import "server-only";

/**
 * Structured server log. NEVER pass customer data (name, phone, email,
 * description) — only event names, opaque ids and error codes.
 */
export function logEvent(level: "info" | "warn" | "error", event: string, meta: Record<string, string | number | boolean | null> = {}): void {
  const line = JSON.stringify({ level, event, ...meta, at: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
