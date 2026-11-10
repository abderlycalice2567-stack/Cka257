import Link from "next/link";
import type { Program } from "@/lib/content";
import { Badge } from "./section";
import { ArrowIcon } from "@/components/icons";

export function ProgramCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/nos-emissions/${program.slug}`}
      className="card card-hover group flex flex-col overflow-hidden"
    >
      <div
        className={`relative flex h-40 items-end p-4 ${
          program.accent === "gold"
            ? "bg-gradient-to-br from-gold-500 to-gold-700"
            : "bg-gradient-to-br from-navy-700 to-navy-900"
        }`}
      >
        {/* Program artwork placeholder (decorative; real art supplied by owner). */}
        <svg
          className="absolute right-3 top-3 opacity-25"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9" strokeLinecap="round" />
        </svg>
        <div className="relative">
          <Badge tone={program.accent === "gold" ? "navy" : "gold"}>{program.category}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-navy-900">{program.title}</h3>
          {!program.sourced && <span className="text-[10px] font-semibold uppercase text-gold-700">démo</span>}
        </div>
        <p className="mt-1 text-xs font-medium text-slate">
          {program.host} · {program.schedule}
        </p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate">{program.summary}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 group-hover:text-gold-700">
          Découvrir
          <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
