/**
 * Migration runner. Applies Drizzle-generated migrations from src/db/migrations/.
 * Run: bun run db:migrate
 */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var required");
  process.exit(1);
}

async function main() {
  const client = postgres(DATABASE_URL!, { max: 1, prepare: false });
  const db = drizzle(client);

  console.log("→ Applying Drizzle migrations from ./src/db/migrations");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("✓ All migrations applied");

  await client.end();
}

main().catch((err) => {
  console.error("✗ Migration failed:", err);
  process.exit(1);
});
