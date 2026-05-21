/**
 * Watchlist — user tracks anime + current episode + personal rating.
 *
 * `currentEpisode` is the source-of-truth for spoiler context in V1.2+
 * (pre-retrieval filter excludes chunks referring to episodes > current).
 * V1 cut stores it but doesn't yet use it — future-proofing.
 */
import { integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { anime } from "./anime";
import { users } from "./users";

export const watchlist = pgTable(
  "watchlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    animeId: integer("anime_id")
      .notNull()
      .references(() => anime.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["watching", "completed", "on_hold", "dropped", "plan_to_watch"],
    }).notNull(),
    currentEpisode: integer("current_episode").notNull().default(0),
    userScore: integer("user_score"), // 1-10, null = not yet rated
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("watchlist_user_anime_unique").on(t.userId, t.animeId)],
);

export type WatchlistEntry = typeof watchlist.$inferSelect;
