import type { Dictionary } from "@/lib/i18n";

export function formMessages(t: Dictionary, success: string) {
  return {
    success,
    error: t.forms.error,
    rate: t.forms.rateLimited,
    field: t.forms.fieldError,
    exists: t.auth.exists,
    auth: t.auth.invalid,
    token: t.auth.tokenInvalid,
    unconfigured: t.support.notConnected,
  };
}
