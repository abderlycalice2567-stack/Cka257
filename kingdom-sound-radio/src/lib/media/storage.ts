import "server-only";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

/**
 * Local filesystem storage adapter. The interface (put/stat/stream/remove)
 * maps one-to-one onto S3/R2, which is the production target.
 */
export const MEDIA_ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.MEDIA_DIR || path.join(process.cwd(), "data", "media"));

export const LIMITS = {
  audio: 95 * 1024 * 1024, // 95 MB (server-action upload limit is 100 MB)
  image: 8 * 1024 * 1024, // 8 MB
} as const;

type Detected = { kind: "audio" | "image"; mime: string; ext: string };

/** Identifies a file by its leading bytes; the client-supplied type is ignored. */
export function sniff(buf: Uint8Array): Detected | null {
  const b = (i: number) => buf[i] ?? -1;
  const ascii = (start: number, len: number) => String.fromCharCode(...buf.slice(start, start + len));
  if (ascii(0, 3) === "ID3" || (b(0) === 0xff && (b(1) & 0xe0) === 0xe0 && (b(1) & 0x06) !== 0)) {
    // MPEG audio frame sync (but not AAC ADTS, which has layer bits 00)
    return { kind: "audio", mime: "audio/mpeg", ext: "mp3" };
  }
  if (b(0) === 0xff && (b(1) & 0xf6) === 0xf0) return { kind: "audio", mime: "audio/aac", ext: "aac" };
  if (ascii(4, 4) === "ftyp" && ["M4A ", "M4B ", "mp42", "isom"].includes(ascii(8, 4))) {
    return { kind: "audio", mime: "audio/mp4", ext: "m4a" };
  }
  if (ascii(0, 4) === "OggS") return { kind: "audio", mime: "audio/ogg", ext: "ogg" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") return { kind: "audio", mime: "audio/wav", ext: "wav" };
  if (b(0) === 0x89 && ascii(1, 3) === "PNG") return { kind: "image", mime: "image/png", ext: "png" };
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { kind: "image", mime: "image/jpeg", ext: "jpg" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return { kind: "image", mime: "image/webp", ext: "webp" };
  return null;
}

export async function saveUpload(file: File, expected: "audio" | "image") {
  if (file.size === 0) throw new Error("The file is empty");
  if (file.size > LIMITS[expected]) throw new Error(`File is larger than ${Math.round(LIMITS[expected] / 1048576)} MB`);
  const buf = new Uint8Array(await file.arrayBuffer());
  const det = sniff(buf);
  if (!det || det.kind !== expected) throw new Error(`Unsupported ${expected} file type`);
  const key = `${det.kind}/${new Date().toISOString().slice(0, 7)}/${randomBytes(12).toString("hex")}.${det.ext}`;
  const full = resolveKey(key);
  await fsp.mkdir(path.dirname(full), { recursive: true });
  await fsp.writeFile(full, buf, { flag: "wx" });
  return { key, bytes: buf.byteLength, mime: det.mime, kind: det.kind };
}

/** Maps a storage key to a path, refusing anything that escapes MEDIA_ROOT. */
export function resolveKey(key: string): string {
  if (!/^[a-z]+\/[A-Za-z0-9._\/-]+$/.test(key) || key.includes("..")) throw new Error("Invalid storage key");
  const full = path.resolve(MEDIA_ROOT, key);
  if (!full.startsWith(MEDIA_ROOT + path.sep)) throw new Error("Invalid storage key");
  return full;
}

export async function statKey(key: string) {
  return fsp.stat(resolveKey(key));
}

export function streamKey(key: string, range?: { start: number; end: number }) {
  return fs.createReadStream(resolveKey(key), range);
}

export async function removeKey(key: string) {
  await fsp.rm(resolveKey(key), { force: true });
}

/** Reads the duration with ffprobe; returns null if ffprobe is unavailable. */
export async function probeDuration(key: string): Promise<number | null> {
  try {
    const { stdout } = await run(
      process.env.FFPROBE_PATH || "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", resolveKey(key)],
      { timeout: 20000 },
    );
    const n = Math.round(Number(stdout.trim()));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
