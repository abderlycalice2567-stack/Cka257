"use client";

import { FormEvent, useState } from "react";
import { Field, inputClass, Honeypot } from "./field";
import { contactSchema } from "@/lib/validation";
import { CheckIcon } from "@/components/icons";

type Errors = Record<string, string[] | undefined>;

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [serverMsg, setServerMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerMsg("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      subject: String(fd.get("subject") || ""),
      message: String(fd.get("message") || ""),
      company: String(fd.get("company") || ""),
      consent: fd.get("consent") === "on",
    };

    // Client-side first pass (server remains the authority).
    const local = contactSchema.safeParse(payload);
    if (!local.success) {
      setErrors(local.error.flatten().fieldErrors);
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("ok");
        setServerMsg(data.message || "Message validé (démonstration).");
        form.reset();
      } else {
        setStatus("error");
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setServerMsg(data.error || "Une erreur est survenue.");
      }
    } catch {
      setStatus("error");
      setServerMsg("Impossible d’envoyer pour le moment.");
    }
  }

  if (status === "ok") {
    return (
      <div className="card flex items-start gap-4 p-6" role="status">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckIcon />
        </span>
        <div>
          <h3 className="font-bold text-navy-900">Merci !</h3>
          <p className="mt-1 text-sm text-slate">{serverMsg}</p>
          <button className="btn-outline mt-4" onClick={() => setStatus("idle")}>
            Envoyer un autre message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative card space-y-5 p-6 sm:p-8">
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom" htmlFor="name" required error={errors.name?.[0]}>
          <input id="name" name="name" className={inputClass} autoComplete="name" required />
        </Field>
        <Field label="E-mail" htmlFor="email" required error={errors.email?.[0]}>
          <input id="email" name="email" type="email" className={inputClass} autoComplete="email" required />
        </Field>
      </div>
      <Field label="Sujet" htmlFor="subject" required error={errors.subject?.[0]}>
        <input id="subject" name="subject" className={inputClass} required />
      </Field>
      <Field label="Message" htmlFor="message" required error={errors.message?.[0]}>
        <textarea id="message" name="message" rows={5} className={inputClass} required />
      </Field>
      <Field label="" htmlFor="consent" error={errors.consent?.[0]}>
        <label className="flex items-start gap-3 text-sm text-slate">
          <input id="consent" name="consent" type="checkbox" className="mt-1 h-4 w-4 accent-gold-500" />
          <span>
            J’accepte que mon message soit traité pour répondre à ma demande. (Démo : aucune donnée
            n’est réellement enregistrée.)
          </span>
        </label>
      </Field>
      {status === "error" && serverMsg && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {serverMsg}
        </p>
      )}
      <button type="submit" className="btn-navy" disabled={status === "sending"}>
        {status === "sending" ? "Envoi…" : "Envoyer le message"}
      </button>
    </form>
  );
}
