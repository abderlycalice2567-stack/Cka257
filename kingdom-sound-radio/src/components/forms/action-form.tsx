"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/forms";

type Messages = {
  success: string;
  error: string;
  rate: string;
  exists?: string;
  auth?: string;
  token?: string;
  unconfigured?: string;
  field?: string;
};

const FormCtx = createContext<FormState & { fieldMsg?: string }>({});

export function ActionForm({
  action,
  messages,
  children,
  className = "space-y-4",
  resetOnSuccess = true,
  hideOnSuccess = false,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  messages: Messages;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  hideOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  const errorText =
    state.error === "rate"
      ? messages.rate
      : state.error === "exists"
        ? (messages.exists ?? messages.error)
        : state.error === "auth"
          ? (messages.auth ?? messages.error)
          : state.error === "token"
            ? (messages.token ?? messages.error)
            : state.error === "unconfigured"
              ? (messages.unconfigured ?? messages.error)
              : state.error
                ? messages.error
                : null;

  if (state.ok && hideOnSuccess) {
    return (
      <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
        {messages.success}
      </p>
    );
  }

  return (
    <FormCtx.Provider value={{ ...state, fieldMsg: messages.field }}>
      <form ref={ref} action={formAction} className={className} noValidate>
        {/* Honeypot — hidden from people and assistive tech. */}
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
        {children}
        <div aria-live="polite">
          {state.ok && (
            <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
              {messages.success}
            </p>
          )}
          {errorText && (
            <p role="alert" className="rounded-xl border border-live/40 bg-live/10 px-4 py-3 text-sm">
              {errorText}
            </p>
          )}
        </div>
      </form>
    </FormCtx.Provider>
  );
}

export function Field({
  name,
  label,
  type = "text",
  required,
  hint,
  autoComplete,
  defaultValue,
  textarea,
  rows = 5,
  placeholder,
  maxLength,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  hint?: string;
  autoComplete?: string;
  defaultValue?: string;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  const state = useContext(FormCtx);
  const err = state.fields?.[name];
  const id = `f-${name}`;
  const describedBy = [hint ? `${id}-hint` : "", err ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name,
    required,
    defaultValue,
    placeholder,
    maxLength,
    "aria-invalid": !!err || undefined,
    "aria-describedby": describedBy,
    className: `input ${err ? "!border-live" : ""}`,
  };
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-live" aria-hidden="true"> *</span>}
      </label>
      {textarea ? <textarea rows={rows} {...common} /> : <input type={type} autoComplete={autoComplete} {...common} />}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {err && (
        <p id={`${id}-err`} className="mt-1 text-xs text-live">
          {state.fieldMsg ?? hint ?? label}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ name, label, defaultChecked, required }: { name: string; label: ReactNode; defaultChecked?: boolean; required?: boolean }) {
  const state = useContext(FormCtx);
  const err = state.fields?.[name];
  return (
    <label className={`flex items-start gap-2.5 text-sm ${err ? "text-live" : ""}`}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} required={required} aria-invalid={!!err || undefined} className="mt-0.5 h-4 w-4 accent-[#D4AF37]" />
      <span>{label}</span>
    </label>
  );
}

export function Submit({ label, pending, className = "btn-gold" }: { label: string; pending: string; className?: string }) {
  const { pending: isPending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={isPending} aria-busy={isPending}>
      {isPending ? pending : label}
    </button>
  );
}
