import { sql } from "@/lib/db";
import { pick } from "@/lib/i18n/config";
import { requirePermission } from "@/lib/auth/session";
import { ensureOccurrences, occurrencesBetween } from "@/modules/schedule";
import { getStation } from "@/modules/content";
import type { Tr } from "@/modules/catalog";
import { AdminHeader, Badge, Check, Flash, Panel, STATUS_TONE, Table } from "@/components/admin/ui";
import { createSpecial, deleteSchedule, saveSchedule, updateOccurrence } from "../actions";

export const metadata = { title: "Schedule" };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Rule = { id: string; program_id: string; title: Tr; weekdays: number[]; start_time: string; duration_minutes: number; valid_from: string; valid_until: string | null; is_rebroadcast: boolean; active: boolean };

function RuleForm({ r, programs }: { r?: Rule; programs: { id: string; title: Tr }[] }) {
  return (
    <form action={saveSchedule} className="grid gap-3 md:grid-cols-[1.4fr_auto_90px_90px_auto] md:items-end">
      {r && <input type="hidden" name="id" value={r.id} />}
      <label className="block"><span className="label">Program</span>
        <select name="program_id" defaultValue={r?.program_id ?? ""} className="input" required>
          <option value="" disabled>Choose…</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{pick(p.title, "en")}</option>)}
        </select>
      </label>
      <fieldset><legend className="label">Days</legend>
        <div className="flex gap-1.5">{DAYS.map((d, i) => (
          <label key={d} className="flex flex-col items-center text-[11px]"><input type="checkbox" name={`d${i}`} defaultChecked={r?.weekdays.includes(i)} className="h-4 w-4 accent-[#D4AF37]" />{d[0]}</label>
        ))}</div>
      </fieldset>
      <label className="block"><span className="label">Start</span><input name="start_time" type="time" defaultValue={r?.start_time ?? "09:00"} className="input !px-2" required /></label>
      <label className="block"><span className="label">Minutes</span><input name="duration_minutes" type="number" min={5} max={1440} defaultValue={r?.duration_minutes ?? 60} className="input !px-2" required /></label>
      <div className="flex flex-wrap items-center gap-3">
        <Check name="is_rebroadcast" label="Rebroadcast" defaultChecked={r?.is_rebroadcast} />
        {r && <Check name="active" label="Active" defaultChecked={r.active} />}
        <Check name="allow_overlap" label="Allow overlap" />
        <input type="hidden" name="valid_from" value={r?.valid_from ?? ""} />
        <button className="btn-gold btn-sm" type="submit">{r ? "Save" : "Add"}</button>
      </div>
    </form>
  );
}

function nextWeek(now = Date.now()) {
  return [new Date(now), new Date(now + 7 * 86400000)] as const;
}

export default async function AdminSchedule({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("schedule.manage");
  await ensureOccurrences();
  const [station, programs, rules] = await Promise.all([
    getStation(),
    sql<{ id: string; title: Tr }[]>`SELECT id, title FROM programs WHERE status <> 'archived' ORDER BY title->>'en'`,
    sql<Rule[]>`
      SELECT s.id, s.program_id, p.title, s.weekdays, to_char(s.start_time, 'HH24:MI') AS start_time, s.duration_minutes,
             to_char(s.valid_from, 'YYYY-MM-DD') AS valid_from, to_char(s.valid_until, 'YYYY-MM-DD') AS valid_until, s.is_rebroadcast, s.active
        FROM broadcast_schedules s JOIN programs p ON p.id = s.program_id ORDER BY s.start_time, p.title->>'en'`,
  ]);
  const [weekFrom, weekTo] = nextWeek();
  const upcoming = await occurrencesBetween(weekFrom, weekTo, { includeCancelled: true });
  const local = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: station.timezone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);


  return (
    <>
      <AdminHeader title="Schedule" intro={`Recurring rules are written in station time (${station.timezone}). Upcoming broadcasts are generated 3 weeks ahead; listeners see them converted to their own time zone. Edited individual broadcasts are never overwritten.`} />
      <Flash sp={await searchParams} />
      <Panel title="Add a recurring program"><RuleForm programs={programs} /></Panel>
      <Panel title={`Recurring rules (${rules.length})`} className="mt-6">
        <ul className="divide-y divide-line">
          {rules.map((r) => (
            <li key={r.id} className="py-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                <strong>{pick(r.title, "en")}</strong>
                <span className="text-muted">{r.weekdays.map((d) => DAYS[d]).join(", ")} · {r.start_time} · {r.duration_minutes} min</span>
                {r.is_rebroadcast && <Badge>rebroadcast</Badge>}
                {!r.active && <Badge tone="warn">inactive</Badge>}
                <form action={deleteSchedule} className="ml-auto">
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-xs text-live underline" type="submit">Delete rule</button>
                </form>
              </div>
              <details><summary className="cursor-pointer text-xs text-muted">Edit</summary><div className="mt-3"><RuleForm r={r} programs={programs} /></div></details>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Special broadcast" className="mt-6">
        <form action={createSpecial} className="grid gap-3 md:grid-cols-[1.4fr_1fr_90px_1.4fr_auto] md:items-end">
          <label className="block"><span className="label">Program</span>
            <select name="program_id" className="input" required defaultValue=""><option value="" disabled>Choose…</option>{programs.map((p) => <option key={p.id} value={p.id}>{pick(p.title, "en")}</option>)}</select>
          </label>
          <label className="block"><span className="label">Start (station time)</span><input name="starts_at" type="datetime-local" className="input" required /></label>
          <label className="block"><span className="label">Minutes</span><input name="duration_minutes" type="number" defaultValue={60} className="input !px-2" /></label>
          <label className="block"><span className="label">Note</span><input name="note" className="input" /></label>
          <button className="btn-gold btn-sm h-[42px]" type="submit">Add</button>
        </form>
        <p className="mt-2 text-xs text-muted">Entered in station time ({station.timezone}). Overlaps with other programs are allowed for specials — check the list below.</p>
      </Panel>
      <Panel title="Next 7 days" className="mt-6">
        <Table head={["When (station time)", "Program", "Status", "Actions"]}>
          {upcoming.map((o) => (
            <tr key={o.id} className={o.status === "cancelled" ? "opacity-60" : ""}>
              <td className="whitespace-nowrap px-3 py-2">{local(o.starts_at)}</td>
              <td className="px-3 py-2">{pick(o.program_title, "en")} {o.is_special && <Badge tone="gold">special</Badge>} {o.is_rebroadcast && <Badge>rebroadcast</Badge>}{o.note && <span className="block text-xs text-muted">{o.note}</span>}</td>
              <td className="px-3 py-2"><Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge></td>
              <td className="px-3 py-2">
                <form action={updateOccurrence} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={o.id} />
                  {o.status === "cancelled" ? (
                    <button name="op" value="restore" className="btn-outline btn-sm" type="submit">Restore</button>
                  ) : (
                    <>
                      <input name="note" placeholder="Reason (optional)" className="input !w-40 !py-1 text-xs" />
                      <button name="op" value="cancel" className="btn-outline btn-sm text-live" type="submit">Cancel</button>
                    </>
                  )}
                </form>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
