/**
 * SQL safety layer — app-layer validation before execution.
 *
 * Defense-in-depth: this regex filter runs BEFORE the DB. Postgres
 * statement_timeout (set in sql-agent.ts) is the DB-layer backstop. Both must
 * pass for a query to execute.
 *
 * V1 allowlist: SELECT, WITH (CTE). Everything else rejected — including
 * EXPLAIN ANALYZE which can leak query plans + cost real time.
 */

const ALLOWED_START = /^\s*(SELECT|WITH)\b/i;

// Blocked keywords matched as whole words (\b boundaries).
// Order doesn't matter — first match wins.
const BLOCKED_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "MERGE",
  "DROP",
  "CREATE",
  "ALTER",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "COPY",
  "VACUUM",
  "ANALYZE",
  "REINDEX",
  "CLUSTER",
  "LOCK",
  "CALL",
  "DO",
  "EXECUTE",
  "PREPARE",
  "DEALLOCATE",
  "LISTEN",
  "NOTIFY",
  "UNLISTEN",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "SAVEPOINT",
  "SET",
  "RESET",
  "SHOW",
  "DECLARE",
  "FETCH",
  "CLOSE",
  "REFRESH",
  "DISCARD",
  "COMMENT",
  "SECURITY",
  "REASSIGN",
];

const BLOCKED_REGEX = new RegExp(`\\b(${BLOCKED_KEYWORDS.join("|")})\\b`, "i");

// Reject queries containing semicolons followed by non-whitespace content
// (multi-statement attack: "SELECT 1; DROP TABLE anime;")
const MULTI_STATEMENT_REGEX = /;\s*\S/;

// Reject pg_* system catalog access (information disclosure risk)
const SYSTEM_TABLE_REGEX = /\b(pg_|information_schema)/i;

const MAX_LENGTH = 4000;

export type SafetyResult =
  | { ok: true; sql: string }
  | { ok: false; reason: string };

/**
 * Validate user-generated SQL against safety rules.
 * Returns sanitized SQL (with default LIMIT appended if missing) or rejection reason.
 */
export function validateSql(rawSql: string): SafetyResult {
  const sql = rawSql.trim().replace(/;+\s*$/, ""); // strip trailing semicolons

  if (sql.length === 0) {
    return { ok: false, reason: "Empty query" };
  }
  if (sql.length > MAX_LENGTH) {
    return { ok: false, reason: `Query exceeds ${MAX_LENGTH} chars` };
  }
  if (!ALLOWED_START.test(sql)) {
    return { ok: false, reason: "Only SELECT or WITH queries allowed" };
  }
  if (MULTI_STATEMENT_REGEX.test(sql)) {
    return { ok: false, reason: "Multi-statement queries blocked" };
  }
  if (SYSTEM_TABLE_REGEX.test(sql)) {
    return { ok: false, reason: "System catalog access (pg_*, information_schema) blocked" };
  }
  const blocked = sql.match(BLOCKED_REGEX);
  if (blocked) {
    return { ok: false, reason: `Blocked keyword: ${blocked[1].toUpperCase()}` };
  }

  // Append default LIMIT if the query doesn't have one. Cheap belt-and-suspenders.
  const hasLimit = /\bLIMIT\s+\d+\b/i.test(sql);
  const finalSql = hasLimit ? sql : `${sql} LIMIT 100`;

  return { ok: true, sql: finalSql };
}
