/**
 * Anime catalog — the dataset the SQL Agent queries against.
 *
 * Sourced from Jikan API v4 (community MAL mirror). Stored denormalized
 * (genres + studios as arrays, not join tables) for V1. Full normalization
 * with `studios`, `genres`, `staff` join tables happens in V1.1 when graph
 * traversal becomes a use case — for now flat columns serve text-to-SQL
 * better because the LLM doesn't need to learn join semantics.
 */
import { integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const anime = pgTable("anime", {
  id: serial("id").primaryKey(),
  malId: integer("mal_id").notNull().unique(),
  title: text("title").notNull(),
  titleJp: text("title_jp"),
  type: text("type", { enum: ["TV", "Movie", "OVA", "ONA", "Special", "Music"] }),
  episodes: integer("episodes"),
  airedFrom: text("aired_from"),
  airedTo: text("aired_to"),
  season: text("season"),
  year: integer("year"),
  status: text("status", {
    enum: ["Finished Airing", "Currently Airing", "Not yet aired"],
  }),
  studios: text("studios").array().notNull().default([]),
  genres: text("genres").array().notNull().default([]),
  themes: text("themes").array().notNull().default([]),
  score: numeric("score", { precision: 4, scale: 2 }),
  scoredBy: integer("scored_by"),
  members: integer("members"),
  popularity: integer("popularity"),
  imageUrl: text("image_url"),
  synopsis: text("synopsis"),
  ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Anime = typeof anime.$inferSelect;
