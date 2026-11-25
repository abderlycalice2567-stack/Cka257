"use client";

import { useState } from "react";
import * as I from "@/components/icons";

export function SectionOrder({ items }: { items: { key: string; label: string; on: boolean }[] }) {
  const [list, setList] = useState(items);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setList(next);
  };
  return (
    <>
      <input type="hidden" name="sections" value={list.map((x) => x.key).join(",")} />
      <ol className="divide-y divide-line rounded-xl border border-line">
        {list.map((it, i) => (
          <li key={it.key} className="flex items-center gap-3 px-4 py-2.5">
            <input type="checkbox" name={`on_${it.key}`} defaultChecked={it.on} className="h-4 w-4 accent-[#D4AF37]" aria-label={`Show ${it.label}`} />
            <span className="flex-1 text-sm">{it.label}</span>
            <button type="button" className="btn-ghost h-8 w-8 !p-0" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${it.label} up`}><I.ChevronUp size={16} /></button>
            <button type="button" className="btn-ghost h-8 w-8 !p-0" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Move ${it.label} down`}><I.ChevronDown size={16} /></button>
          </li>
        ))}
      </ol>
    </>
  );
}
