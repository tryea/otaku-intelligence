/**
 * SQL Agent orchestration — Claude generates SQL, we validate, execute,
 * and self-correct on failure (up to MAX_RETRIES).
 *
 * V1 pattern: single-call structured JSON output, manual retry loop.
 * V1.1+ upgrade path: convert to Anthropic tool_use multi-turn for cleaner
 * agentic loop. See ADR 0006.
 */
import { sql as drizzleSql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { chat, type ChatMessage } from "./client";
import { buildRetryMessage, SQL_AGENT_SYSTEM_PROMPT } from "./prompts";
import { validateSql } from "./safety";
import type { AgentResponse, Block } from "./types";

const MAX_RETRIES = 3;
const STATEMENT_TIMEOUT_MS = 10_000;

// Schema for what the LLM is expected to return per prompts.ts contract.
const llmOutputSchema = z.object({
  sql: z.string().nullable(),
  explanation: z.string(),
});

/**
 * Parse LLM response which should be a single-line JSON object.
 * Some defensive cleanup for common LLM mistakes (markdown fences, leading/trailing prose).
 */
function parseLlmOutput(text: string): z.infer<typeof llmOutputSchema> {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  // Find first { ... } block in case LLM added prose before
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];
  try {
    const parsed = JSON.parse(cleaned);
    return llmOutputSchema.parse(parsed);
  } catch (err) {
    throw new Error(`LLM output not valid JSON: ${(err as Error).message}. Raw: ${text.slice(0, 200)}`);
  }
}

async function executeSql(
  validatedSql: string,
): Promise<{ columns: string[]; rows: Array<Array<string | number | null>>; durationMs: number }> {
  const startMs = Date.now();
  // Wrap in transaction so SET LOCAL statement_timeout applies only here
  const result = await db.transaction(async (tx) => {
    await tx.execute(drizzleSql.raw(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`));
    return tx.execute(drizzleSql.raw(validatedSql));
  });

  const rawRows = (result as unknown) as Array<Record<string, unknown>>;
  const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const rows = rawRows.map((r) =>
    columns.map((c) => {
      const v = r[c];
      if (v === null || v === undefined) return null;
      if (typeof v === "number" || typeof v === "string") return v;
      if (Array.isArray(v)) return v.join(", ");
      return String(v);
    }),
  );

  return { columns, rows, durationMs: Date.now() - startMs };
}

/**
 * Main entry point. Takes user question + prior chat history, returns
 * a typed AgentResponse with text + table blocks + metadata.
 */
export async function runSqlAgent(
  userQuestion: string,
  conversationHistory: ChatMessage[] = [],
): Promise<AgentResponse> {
  let retryCount = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let lastSql: string | null = null;
  let lastError: string | null = null;
  let modelUsed = "";

  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: "user", content: userQuestion },
  ];

  while (retryCount <= MAX_RETRIES) {
    if (retryCount > 0 && lastSql && lastError) {
      // Self-correction: append retry message with error context
      messages.push({
        role: "user",
        content: buildRetryMessage(userQuestion, lastSql, lastError),
      });
    }

    // 1. Generate SQL via Claude
    const llmResult = await chat({
      systemPrompt: SQL_AGENT_SYSTEM_PROMPT,
      messages,
    });
    totalPromptTokens += llmResult.promptTokens;
    totalCompletionTokens += llmResult.completionTokens;
    modelUsed = llmResult.model;

    let parsed: z.infer<typeof llmOutputSchema>;
    try {
      parsed = parseLlmOutput(llmResult.text);
    } catch (err) {
      // LLM returned malformed JSON — treat as terminal failure (no retry)
      return {
        blocks: [
          {
            type: "error",
            message: "Model returned invalid response format",
            detail: (err as Error).message,
          },
        ],
        meta: {
          model: modelUsed,
          agentRoute: "sql",
          retryCount,
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
        },
      };
    }

    // 2. Polite refusal — LLM judged question unanswerable
    if (parsed.sql === null) {
      return {
        blocks: [{ type: "text", content: parsed.explanation }],
        meta: {
          model: modelUsed,
          agentRoute: "sql",
          retryCount,
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
        },
      };
    }

    // 3. Safety layer validation
    const safety = validateSql(parsed.sql);
    if (!safety.ok) {
      lastSql = parsed.sql;
      lastError = `Safety layer rejected: ${safety.reason}`;
      messages.push({ role: "assistant", content: llmResult.text });
      retryCount++;
      continue;
    }

    // 4. Execute SQL
    try {
      const { columns, rows, durationMs } = await executeSql(safety.sql);
      const blocks: Block[] = [{ type: "text", content: parsed.explanation }];
      if (rows.length > 0) {
        blocks.push({ type: "table", columns, rows });
      } else {
        blocks.push({ type: "text", content: "_No rows matched._" });
      }
      return {
        blocks,
        meta: {
          model: modelUsed,
          agentRoute: "sql",
          sqlGenerated: safety.sql,
          executionMs: durationMs,
          retryCount,
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
        },
      };
    } catch (err) {
      // SQL execution failed — feed error back to LLM for self-correction
      lastSql = safety.sql;
      lastError = (err as Error).message;
      messages.push({ role: "assistant", content: llmResult.text });
      retryCount++;
    }
  }

  // Exhausted retries
  return {
    blocks: [
      {
        type: "error",
        message: `Could not generate a working query after ${MAX_RETRIES} attempts.`,
        detail: lastError ?? undefined,
      },
    ],
    meta: {
      model: modelUsed,
      agentRoute: "sql",
      sqlGenerated: lastSql ?? undefined,
      retryCount,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    },
  };
}
