export type FormState = {
  ok?: boolean;
  error?: "invalid" | "rate" | "exists" | "auth" | "token" | "server" | "unconfigured";
  fields?: Record<string, string>;
  message?: string;
};

export const initialFormState: FormState = {};
