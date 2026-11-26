import "server-only";
import { serverEnv } from "../env";
import { ResendMailer, UnconfiguredMailer } from "./mailer";
import { SupabaseLeadStore } from "./supabase-store";

export function leadInfrastructure() {
  const env = serverEnv();
  return {
    env,
    store: env.demoMode ? null : new SupabaseLeadStore(env.supabaseUrl, env.supabaseKey),
    mailer: env.emailConfigured ? new ResendMailer(env.resendKey, env.emailFrom) : new UnconfiguredMailer(),
  };
}
