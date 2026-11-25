import "server-only";
import { redirect } from "next/navigation";

export function str(fd: FormData, k: string, max = 10000): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function optStr(fd: FormData, k: string, max = 10000): string | null {
  return str(fd, k, max) || null;
}

export function bool(fd: FormData, k: string): boolean {
  const v = fd.get(k);
  return v === "on" || v === "true";
}

export function int(fd: FormData, k: string): number | null {
  const n = Number(str(fd, k));
  return Number.isFinite(n) && str(fd, k) !== "" ? Math.trunc(n) : null;
}

/** Reads translatable fields named `${k}_en`, `${k}_fr`, `${k}_ht`. */
export function tr(fd: FormData, k: string, max = 10000) {
  const out: Record<string, string> = {};
  for (const l of ["en", "fr", "ht"]) {
    const v = str(fd, `${k}_${l}`, max);
    if (v) out[l] = v;
  }
  return out;
}

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Redirect back with a flash message in the query string. */
export function back(path: string, kind: "ok" | "error", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message)}`);
}

export function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

export function isCheckViolation(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23514";
}
