/**
 * Shared types for AI service layer.
 *
 * Block types match PDF Section 11 "Rich Message Blocks". V1 ships text + table +
 * error only. Others (chart, citation, follow_up, suggestion, spoiler_warning)
 * defer to later phases.
 */

export type Block =
  | { type: "text"; content: string }
  | {
      type: "table";
      columns: string[];
      rows: Array<Array<string | number | null>>;
    }
  | {
      type: "error";
      message: string;
      detail?: string;
    };

export interface AgentRunMeta {
  model: string;
  agentRoute: "sql"; // V1 single route. Router Agent V1.1+ adds graph/hybrid/retrieval/chitchat.
  sqlGenerated?: string;
  executionMs?: number;
  retryCount: number;
  promptTokens: number;
  completionTokens: number;
}

export interface AgentResponse {
  blocks: Block[];
  meta: AgentRunMeta;
}
