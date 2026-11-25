// Creates (or promotes) a Super Administrator.
// Usage: ADMIN_EMAIL=... [ADMIN_PASSWORD=...] npm run admin:create
// If no password is given, a strong random one is generated and printed once.
import crypto from "node:crypto";
import postgres from "postgres";
import { loadEnv } from "./env.mjs";

loadEnv();
const email = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
if (!email || !email.includes("@")) throw new Error("Provide ADMIN_EMAIL (or pass the email as the first argument)");
let password = process.argv[3] || process.env.ADMIN_PASSWORD || "";
const generated = !password;
if (generated) password = crypto.randomBytes(15).toString("base64url");
if (password.length < 12) throw new Error("Admin password must be at least 12 characters");

// Must match src/lib/auth/password.ts
const N = 16384, r = 8, p = 1;
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password.normalize("NFKC"), salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
const encoded = `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;

const sql = postgres(process.env.DATABASE_URL, { onnotice: () => {} });
try {
  const [u] = await sql`
    INSERT INTO users (email, password_hash, display_name, email_verified_at)
    VALUES (${email}, ${encoded}, 'Administrator', now())
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active', updated_at = now()
    RETURNING id`;
  await sql`INSERT INTO user_roles (user_id, role_key) VALUES (${u.id}, 'super_admin') ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (${u.id}, 'admin.bootstrap', 'user', ${u.id})`;
  console.log(`Super Administrator ready: ${email}`);
  if (generated) console.log(`Generated password (shown once): ${password}`);
} finally {
  await sql.end();
}
