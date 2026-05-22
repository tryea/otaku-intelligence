/**
 * Anthropic SDK wrapper. Thin abstraction so future swap to LiteLLM
 * gateway (see ADR 0006) is a single-file change.
 */
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY && process.env.NODE_ENV !== "test") {
  console.warn(
    "[ai/client] ANTHROPIC_API_KEY not set — calls will fail. Set in .env.local",
  );
}

export const MODEL = "claude-3-5-sonnet-20241022";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY env var required");
    _client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return _client;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
}

/**
 * Non-streaming chat completion. Returns full text + token usage.
 * V1 doesn't stream — Action #4 wires SSE; this function stays the synchronous primitive.
 */
export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const client = getClient();
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0,
    system: opts.systemPrompt,
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const text = resp.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((b) => b.text)
    .join("");

  return {
    text,
    promptTokens: resp.usage.input_tokens,
    completionTokens: resp.usage.output_tokens,
    model: resp.model,
  };
}
