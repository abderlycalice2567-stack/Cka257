import "server-only";

/**
 * Structured logger that must NEVER receive customer details (names, phone
 * numbers, emails, descriptions). Pass receipt IDs and error codes only.
 */
type Fields = Record<string, string | number | boolean | null | undefined>;
export const log = {
  info: (event: string, fields: Fields = {}) => console.info(JSON.stringify({ level: "info", event, ...fields })),
  warn: (event: string, fields: Fields = {}) => console.warn(JSON.stringify({ level: "warn", event, ...fields })),
  error: (event: string, fields: Fields = {}) => console.error(JSON.stringify({ level: "error", event, ...fields })),
};
