/**
 * POST /api/chat/message — User sends a question, Agent answers.
 *
 * V1 behavior (non-streaming):
 *   1. Create new conversation if conversationId omitted
 *   2. Persist user message
 *   3. Run SQL Agent (with conversation history as context)
 *   4. Persist assistant message
 *   5. Return blocks + meta + IDs
 *
 * V1.1 will replace this with SSE streaming. Endpoint URL stays.
 *
 * Auth: V1 uses static DEMO_USER_ID env var (see ADR 0005). V1.3 swaps to NextAuth.
 */
import { asc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { runSqlAgent } from "@/lib/ai/sql-agent";
import type { ChatMessage } from "@/lib/ai/client";

const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "demo-user-001";

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});

/**
 * Project block content back into plain text for full-text search later.
 * Concatenates text-block content + flattens table to "col1: val1 | col2: val2" style.
 */
function blocksToPlainText(blocks: unknown[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    const b = block as { type: string; content?: string; columns?: string[]; rows?: unknown[][] };
    if (b.type === "text" && b.content) parts.push(b.content);
    if (b.type === "table" && b.columns && b.rows) {
      const colCount = b.columns.length;
      const rowsAsText = b.rows.slice(0, 5).map((r) =>
        (r as unknown[])
          .slice(0, colCount)
          .map((v, i) => `${b.columns?.[i]}: ${v ?? "—"}`)
          .join(" | "),
      );
      parts.push(rowsAsText.join("\n"));
    }
  }
  return parts.join("\n\n");
}

/**
 * Fetch prior chat history (alternating user/assistant) for the conversation.
 * V1 strips block structure — only sends plain text back to the LLM. Reduces
 * token cost since prior tables can be huge.
 */
async function getHistory(conversationId: string): Promise<ChatMessage[]> {
  const rows = await db
    .select({
      role: messages.role,
      plainText: messages.plainText,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  return rows
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.plainText ?? "",
    }));
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_request", detail: (err as Error).message },
      { status: 400 },
    );
  }

  // 1. Resolve or create conversation
  let conversationId = body.conversationId;
  if (!conversationId) {
    const [created] = await db
      .insert(conversations)
      .values({ userId: DEMO_USER_ID, title: body.message.slice(0, 60) })
      .returning({ id: conversations.id });
    conversationId = created.id;
  }

  // 2. Load prior history (excluding the current turn)
  const history = await getHistory(conversationId);

  // 3. Persist user message before running agent (so retries see it in history if we re-run)
  const [userMsg] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "user",
      blocks: [{ type: "text", content: body.message }],
      plainText: body.message,
    })
    .returning({ id: messages.id });

  // 4. Run SQL Agent
  const response = await runSqlAgent(body.message, history);

  // 5. Persist assistant message
  const [assistantMsg] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "assistant",
      blocks: response.blocks,
      plainText: blocksToPlainText(response.blocks),
      meta: response.meta,
    })
    .returning({ id: messages.id });

  // 6. Bump conversation updated_at
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return NextResponse.json({
    conversationId,
    userMessageId: userMsg.id,
    assistantMessageId: assistantMsg.id,
    blocks: response.blocks,
    meta: response.meta,
  });
}
