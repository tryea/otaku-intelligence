/**
 * Seed the demo user. Idempotent — safe to re-run.
 * Run: bun run db:seed
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var required");
  process.exit(1);
}

const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@otaku.local",
  name: "Demo User",
  spoilerStrictness: "relaxed" as const,
};

async function main() {
  const client = postgres(DATABASE_URL!, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  console.log("→ Seeding demo user:", DEMO_USER.id);
  await db
    .insert(schema.users)
    .values(DEMO_USER)
    .onConflictDoNothing({ target: schema.users.id });
  console.log("✓ Demo user seeded (or already existed)");

  await client.end();
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
