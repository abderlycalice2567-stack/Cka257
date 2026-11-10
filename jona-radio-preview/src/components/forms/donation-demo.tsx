"use client";

import { useState } from "react";
import { CheckIcon, HeartIcon } from "@/components/icons";

const PRESETS = [5, 10, 25, 50];

/**
 * DEMO donation interface. Collects NO payment credentials and processes NO
 * real payment. It illustrates the UX that would later connect to a licensed
 * payment provider (Stripe, HelloAsso, PayPal…) after owner authorization.
 */
export function DonationDemo() {
  const [amount, setAmount] = useState<number>(10);
  const [custom, setCustom] = useState("");
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [done, setDone] = useState(false);

  const effective = custom ? Math.max(0, parseFloat(custom) || 0) : amount;

  if (done) {
    return (
      <div className="card p-8 text-center" role="status">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckIcon />
        </span>
        <h3 className="mt-4 text-xl font-bold text-navy-900">Merci pour votre générosité !</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate">
          Ceci est une démonstration : <strong>aucun paiement n’a été effectué</strong> et aucune
          information bancaire n’a été demandée ou enregistrée. En production, le paiement serait
          traité par un prestataire agréé (ex. Stripe, HelloAsso), jamais par ce site directement.
        </p>
        <button className="btn-outline mt-6" onClick={() => setDone(false)}>
          Revenir
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-700">
        <HeartIcon width={14} height={14} /> Démonstration — aucun paiement réel
      </div>

      <div className="mt-6" role="group" aria-label="Fréquence du don">
        <div className="inline-flex rounded-full bg-navy-50 p-1">
          {(["once", "monthly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              aria-pressed={frequency === f}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                frequency === f ? "bg-navy-800 text-ivory" : "text-navy-700"
              }`}
            >
              {f === "once" ? "Une fois" : "Chaque mois"}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-navy-900">Montant (€)</legend>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setAmount(p);
                setCustom("");
              }}
              aria-pressed={!custom && amount === p}
              className={`rounded-xl border py-3 text-sm font-bold transition ${
                !custom && amount === p
                  ? "border-gold-500 bg-gold-500/10 text-navy-900"
                  : "border-navy-100 text-navy-700 hover:border-gold-500"
              }`}
            >
              {p} €
            </button>
          ))}
        </div>
        <label htmlFor="custom-amount" className="mt-3 block text-sm text-slate">
          Autre montant
        </label>
        <input
          id="custom-amount"
          inputMode="decimal"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))}
          placeholder="Ex. 15"
          className="mt-1 w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-navy-900 focus:border-gold-500 focus-visible:ring-2 focus-visible:ring-gold-500"
        />
      </fieldset>

      <button
        type="button"
        onClick={() => setDone(true)}
        disabled={effective <= 0}
        className="btn-gold mt-6 w-full"
      >
        Faire un don de {effective > 0 ? `${effective} €` : "—"}
        {frequency === "monthly" ? " / mois" : ""} (démo)
      </button>
      <p className="mt-3 text-center text-xs text-slate">
        Nous ne demandons aucune coordonnée bancaire dans cette maquette.
      </p>
    </div>
  );
}
