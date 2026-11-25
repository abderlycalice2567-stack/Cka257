import Link from "next/link";
import { sql } from "@/lib/db";
import { pick } from "@/lib/i18n/config";
import { requirePermission } from "@/lib/auth/session";
import { sp } from "@/lib/page";
import type { Tr } from "@/modules/catalog";
import { AdminHeader, Badge, Check, Flash, Input, Panel, STATUS_TONE, Table, TextArea, TrFields } from "@/components/admin/ui";
import { saveArticle, saveDevotional, saveEvent, savePage } from "../actions";

export const metadata = { title: "Content" };
const TABS = ["articles", "devotionals", "events", "pages"] as const;
const PAGES = ["about", "mission", "leadership", "faq", "privacy", "terms", "accessibility"];

export default async function AdminContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("content.manage");
  const q = await searchParams;
  const tab = (TABS as readonly string[]).includes(sp(q.tab) ?? "") ? (sp(q.tab) as (typeof TABS)[number]) : sp(q.page) ? "pages" : "articles";
  const editId = sp(q.edit);

  const tabs = (
    <nav className="mb-6 flex flex-wrap gap-2">
      {TABS.map((t) => <Link key={t} href={`/admin/content?tab=${t}`} className={tab === t ? "btn-gold btn-sm capitalize" : "btn-outline btn-sm capitalize"}>{t}</Link>)}
    </nav>
  );

  let body: React.ReactNode = null;
  if (tab === "articles") {
    const rows = await sql<{ id: string; slug: string; locale: string; title: string; excerpt: string; body: string; category: string; status: string; published_at: Date | null; is_sample: boolean }[]>`
      SELECT id, slug, locale, title, excerpt, body, category, status, published_at, is_sample FROM articles ORDER BY coalesce(published_at, created_at) DESC LIMIT 100`;
    const edit = rows.find((r) => r.id === editId);
    body = (
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Articles">
          <Table head={["Title", "Lang", "Status"]}>
            {rows.map((a) => (
              <tr key={a.id}><td className="px-3 py-2"><Link className="link" href={`/admin/content?tab=articles&edit=${a.id}`}>{a.title}</Link> {a.is_sample && <Badge>sample</Badge>}</td><td className="px-3 py-2 uppercase">{a.locale}</td><td className="px-3 py-2"><Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge></td></tr>
            ))}
          </Table>
        </Panel>
        <Panel title={edit ? `Edit: ${edit.title}` : "New article"} actions={edit ? <Link className="text-xs link" href="/admin/content?tab=articles">New instead</Link> : undefined}>
          <form action={saveArticle} className="space-y-3" key={edit?.id ?? "new"}>
            {edit && <input type="hidden" name="id" value={edit.id} />}
            <Input name="title" label="Title" defaultValue={edit?.title} required />
            <div className="grid gap-3 md:grid-cols-4">
              <label className="block"><span className="label">Language</span><select name="locale" defaultValue={edit?.locale ?? "en"} className="input"><option value="en">EN</option><option value="fr">FR</option><option value="ht">HT</option></select></label>
              <Input name="category" label="Category" defaultValue={edit?.category ?? "news"} />
              <label className="block"><span className="label">Status</span><select name="status" defaultValue={edit?.status ?? "draft"} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
              <Input name="slug" label="Slug" defaultValue={edit?.slug} />
            </div>
            <TextArea name="excerpt" label="Excerpt" defaultValue={edit?.excerpt} rows={2} />
            <TextArea name="body" label="Body (Markdown: ## headings, - lists, **bold**, [links](https://…))" defaultValue={edit?.body} rows={12} />
            <button className="btn-gold btn-sm" type="submit">Save article</button>
          </form>
        </Panel>
      </div>
    );
  } else if (tab === "devotionals") {
    const rows = await sql<{ day: string; locale: string; title: string; scripture_ref: string; status: string; is_sample: boolean }[]>`
      SELECT to_char(day, 'YYYY-MM-DD') AS day, locale, title, scripture_ref, status, is_sample FROM devotionals ORDER BY day DESC, locale LIMIT 60`;
    body = (
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent devotionals">
          <Table head={["Date", "Lang", "Reference", ""]}>
            {rows.map((d) => <tr key={d.day + d.locale}><td className="px-3 py-2">{d.day}</td><td className="px-3 py-2 uppercase">{d.locale}</td><td className="px-3 py-2">{d.scripture_ref}</td><td className="px-3 py-2">{d.is_sample && <Badge>sample</Badge>}{d.status === "draft" && <Badge>draft</Badge>}</td></tr>)}
          </Table>
        </Panel>
        <Panel title="Add or replace a devotional">
          <form action={saveDevotional} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Input name="day" label="Date" type="date" required />
              <label className="block"><span className="label">Language</span><select name="locale" className="input"><option value="en">EN</option><option value="fr">FR</option><option value="ht">HT</option></select></label>
              <Input name="title" label="Title" required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="scripture_ref" label="Scripture reference" required />
              <Input name="translation" label="Bible translation" hint="Use public-domain or licensed text only" />
            </div>
            <TextArea name="scripture_text" label="Verse text" rows={3} />
            <TextArea name="body" label="Reflection" rows={6} />
            <Check name="draft" label="Save as draft" />
            <button className="btn-gold btn-sm" type="submit">Save devotional</button>
          </form>
        </Panel>
      </div>
    );
  } else if (tab === "events") {
    const rows = await sql<{ id: string; slug: string; title: Tr; description: Tr; kind: string; starts_at: Date; ends_at: Date | null; location: string; registration_enabled: boolean; capacity: number | null; status: string; regs: number; is_sample: boolean }[]>`
      SELECT e.*, (SELECT count(*)::int FROM event_registrations r WHERE r.event_id = e.id) AS regs FROM events e ORDER BY e.starts_at DESC LIMIT 100`;
    const edit = rows.find((r) => r.id === editId);
    const dt = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 16) : "");
    body = (
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Events">
          <Table head={["Event", "Starts (UTC)", "Registrations", "Status"]}>
            {rows.map((e) => <tr key={e.id}><td className="px-3 py-2"><Link className="link" href={`/admin/content?tab=events&edit=${e.id}`}>{pick(e.title, "en")}</Link> {e.is_sample && <Badge>sample</Badge>}</td><td className="px-3 py-2 text-xs">{dt(e.starts_at).replace("T", " ")}</td><td className="px-3 py-2">{e.regs}{e.capacity ? ` / ${e.capacity}` : ""}</td><td className="px-3 py-2"><Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge></td></tr>)}
          </Table>
        </Panel>
        <Panel title={edit ? `Edit: ${pick(edit.title, "en")}` : "New event"}>
          <form action={saveEvent} className="space-y-3" key={edit?.id ?? "new"}>
            {edit && <input type="hidden" name="id" value={edit.id} />}
            <TrFields name="title" label="Title" value={edit?.title} required />
            <TrFields name="description" label="Description" value={edit?.description} textarea />
            <div className="grid gap-3 md:grid-cols-3">
              <Input name="starts_at" label="Starts (UTC)" type="datetime-local" defaultValue={dt(edit?.starts_at)} required />
              <Input name="ends_at" label="Ends (UTC)" type="datetime-local" defaultValue={dt(edit?.ends_at)} />
              <Input name="location" label="Location" defaultValue={edit?.location} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input name="kind" label="Type" defaultValue={edit?.kind ?? "community"} hint="conference, concert, crusade, special…" />
              <Input name="capacity" label="Capacity" type="number" defaultValue={edit?.capacity} />
              <label className="block"><span className="label">Status</span><select name="status" defaultValue={edit?.status ?? "draft"} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select></label>
            </div>
            <Check name="registration_enabled" label="Enable registration" defaultChecked={edit?.registration_enabled} />
            <button className="btn-gold btn-sm" type="submit">Save event</button>
          </form>
        </Panel>
      </div>
    );
  } else {
    const slug = PAGES.includes(sp(q.page) ?? "") ? sp(q.page)! : "about";
    const pl = ["en", "fr", "ht"].includes(sp(q.pl) ?? "") ? sp(q.pl)! : "en";
    const [page] = await sql<{ title: string; body: string; is_sample: boolean }[]>`SELECT title, body, is_sample FROM pages WHERE slug = ${slug} AND locale = ${pl}`;
    body = (
      <Panel title="Pages">
        <nav className="mb-4 flex flex-wrap gap-2">
          {PAGES.map((p) => <Link key={p} href={`/admin/content?page=${p}&pl=${pl}`} className={slug === p ? "btn-gold btn-sm" : "btn-outline btn-sm"}>{p}</Link>)}
          <span className="mx-2 border-l border-line" />
          {["en", "fr", "ht"].map((l) => <Link key={l} href={`/admin/content?page=${slug}&pl=${l}`} className={pl === l ? "btn-gold btn-sm uppercase" : "btn-outline btn-sm uppercase"}>{l}</Link>)}
        </nav>
        {page?.is_sample && <p className="mb-3 text-xs text-muted"><Badge>template</Badge> This page still contains template text. Legal pages require review by the station (and counsel where needed).</p>}
        <form action={savePage} className="space-y-3" key={slug + pl}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="locale" value={pl} />
          <Input name="title" label="Title" defaultValue={page?.title} required />
          <TextArea name="body" label="Body (Markdown)" defaultValue={page?.body} rows={16} />
          <button className="btn-gold btn-sm" type="submit">Save page</button>
        </form>
      </Panel>
    );
  }

  return (
    <>
      <AdminHeader title="Content" intro="Articles, devotionals, events and editable pages in English, French and Haitian Creole." />
      <Flash sp={q} />
      {tabs}
      {body}
    </>
  );
}
