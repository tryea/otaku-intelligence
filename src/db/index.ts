import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL env var is required");
}

const globalForDb = globalThis as unknown as {
  _otakuClient?: postgres.Sql;
  _otakuDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const client: postgres.Sql =
  globalForDb._otakuClient ??
  postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

/**
 * Drizzle client with full schema attached. Use anywhere in the app
 * — RSC pages, route handlers, server actions, scripts.
 */
export const db: ReturnType<typeof drizzle<typeof schema>> =
  globalForDb._otakuDb ?? drizzle(client, { schema, casing: "snake_case" });

if (process.env.NODE_ENV !== "production") {
  globalForDb._otakuClient = client;
  globalForDb._otakuDb = db;
}

export { schema };
