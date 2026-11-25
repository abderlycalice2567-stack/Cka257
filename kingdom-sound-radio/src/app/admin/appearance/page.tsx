import { requirePermission } from "@/lib/auth/session";
import { getSetting } from "@/modules/content";
import { AdminHeader, Flash, Panel } from "@/components/admin/ui";
import { saveHomepage } from "../actions";
import { SectionOrder } from "@/components/admin/section-order";

export const metadata = { title: "Homepage" };

const ALL: [string, string][] = [
  ["hero", "Hero"], ["now", "Now broadcasting & coming up next"], ["replays", "Latest replays & podcasts"], ["programs", "Featured programs"],
  ["platforms", "Listen everywhere"], ["presenters", "Meet our presenters"], ["news", "News & community"], ["events", "Upcoming events"],
  ["spiritual", "Verse, devotional, prayer & testimonies"], ["newsletter", "Newsletter"], ["support", "Support the ministry"],
];

export default async function AdminAppearance({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("content.manage");
  const current = await getSetting<{ sections: string[] }>("homepage", { sections: ALL.map(([k]) => k) });
  const enabled = new Set(current.sections);
  const ordered = [...current.sections.filter((k) => ALL.some(([a]) => a === k)), ...ALL.map(([k]) => k).filter((k) => !enabled.has(k))];
  return (
    <>
      <AdminHeader title="Homepage" intro="Choose which homepage sections appear and in what order. Changes go live immediately." />
      <Flash sp={await searchParams} />
      <Panel>
        <form action={saveHomepage}>
          <SectionOrder items={ordered.map((k) => ({ key: k, label: ALL.find(([a]) => a === k)?.[1] ?? k, on: enabled.has(k) }))} />
          <button className="btn-gold btn-sm mt-4" type="submit">Save homepage</button>
        </form>
      </Panel>
    </>
  );
}
