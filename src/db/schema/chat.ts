/**
 * Chat tables — conversations + messages with rich-block content.
 *
 * `content` is JSON array of block objects (text / table / chart / citation /
 * follow_up). Matches the rich-block protocol in PDF Section 11. UI's chat
 * component renders these via dedicated React components per type.
 */
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New conversation"),
  /**
   * Cached context snapshot from creation time (e.g. current watchlist progress).
   * Spoiler guard uses this to evaluate responses against user's known state.
   * V1 cut: just stores it, no enforcement yet.
   */
  contextSnapshot: jsonb("context_snapshot"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  /**
   * Array of typed blocks: [{type:"text", content:"..."}, {type:"table", data:[...]}].
   * For user messages, usually a single text block. Assistant messages can
   * have multiple ordered blocks.
   */
  blocks: jsonb("blocks").notNull(),
  plainText: text("plain_text"), // flat projection for full-text search later
  /**
   * { promptTokens, completionTokens, totalTokens, model, agentRoute, latencyMs }
   * — drives analytics dashboard in V1.1.
   */
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
