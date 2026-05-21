/**
 * Users — simplest possible auth table.
 *
 * V1 cut intentionally skips NextAuth + sessions + RBAC. A single seeded row
 * (`demo-user-001`) drives everything via the DEMO_USER_ID env var. Full auth
 * gets layered in V1.1 via NextAuth v5 + drizzle-adapter against this same
 * table — schema is already shaped right.
 */
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  /**
   * Spoiler tolerance: drives the pre-retrieval filter when RAG ships.
   * V1 cut doesn't use it yet; column exists so future migration doesn't break.
   */
  spoilerStrictness: text("spoiler_strictness", { enum: ["strict", "relaxed", "off"] })
    .notNull()
    .default("relaxed"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
