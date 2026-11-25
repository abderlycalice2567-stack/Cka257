import "server-only";
import postgres from "postgres";

declare global {
  var __ksrSql: ReturnType<typeof postgres> | undefined;
}

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return postgres(url, {
    max: Number(process.env.DATABASE_POOL_SIZE || 10),
    idle_timeout: 30,
    onnotice: () => {},
    transform: { undefined: null },
  });
}

/** Shared connection pool (reused across hot reloads in development). */
export const sql = globalThis.__ksrSql ?? create();
if (process.env.NODE_ENV !== "production") globalThis.__ksrSql = sql;

export type Sql = typeof sql;
