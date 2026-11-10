"use client";

import { FormEvent, useState } from "react";
import { Field, inputClass, Honeypot } from "./field";
import { prayerSchema } from "@/lib/validation";
import { CheckIcon } from "@/components/icons";

type Errors = Record<string, string[] | undefined>;

export function PrayerForm() {
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
      firstName: String(fd.get("firstName") || ""),
      intention: String(fd.get("intention") || ""),
      isPublic: fd.get("isPublic") === "on",
      company: String(fd.get("company") || ""),
      consent: fd.get("consent") === "on",
    };

    const local = prayerSchema.safeParse(payload);
    if (!local.success) {
      setErrors(local.error.flatten().fieldErrors);
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/prayer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("ok");
        setServerMsg(data.message || "Intention reçue (démonstration).");
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
          <h3 className="font-bold text-navy-900">Nous prions avec vous.</h3>
          <p className="mt-1 text-sm text-slate">{serverMsg}</p>
          <button className="btn-outline mt-4" onClick={() => setStatus("idle")}>
            Déposer une autre intention
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative card space-y-5 p-6 sm:p-8">
      <Honeypot />
      <Field label="Prénom ou pseudonyme" htmlFor="firstName" required hint="Vous pouvez rester anonyme." error={errors.firstName?.[0]}>
        <input id="firstName" name="firstName" className={inputClass} autoComplete="off" required />
      </Field>
      <Field label="Votre intention de prière" htmlFor="intention" required error={errors.intention?.[0]}>
        <textarea id="intention" name="intention" rows={5} className={inputClass} required />
      </Field>
      <label className="flex items-start gap-3 text-sm text-slate">
        <input name="isPublic" type="checkbox" className="mt-1 h-4 w-4 accent-gold-500" />
        <span>J’autorise le partage anonyme de cette intention avec la communauté (facultatif).</span>
      </label>
      <Field label="" htmlFor="consent" error={errors.consent?.[0]}>
        <label className="flex items-start gap-3 text-sm text-slate">
          <input id="consent" name="consent" type="checkbox" className="mt-1 h-4 w-4 accent-gold-500" />
          <span>
            Je comprends qu’il s’agit d’une démonstration : aucune donnée n’est enregistrée ni
            transmise.
          </span>
        </label>
      </Field>
      {status === "error" && serverMsg && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {serverMsg}
        </p>
      )}
      <button type="submit" className="btn-navy" disabled={status === "sending"}>
        {status === "sending" ? "Envoi…" : "Déposer mon intention"}
      </button>
    </form>
  );
}
