export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function rfc2822(d: Date): string {
  return d.toUTCString();
}

export function hhmmss(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export type FeedEpisode = {
  guid: string;
  title: string;
  description: string;
  link: string;
  audioUrl: string;
  audioBytes: number;
  mimeType: string;
  durationSeconds: number | null;
  publishedAt: Date;
  number?: number | null;
};

export type FeedChannel = {
  title: string;
  description: string;
  link: string;
  feedUrl: string;
  language: string;
  author: string;
  category: string;
  explicit: boolean;
  imageUrl?: string;
};

/** Podcast RSS 2.0 with iTunes and Podcasting 2.0 tags (Apple/Spotify compatible). */
export function buildPodcastRss(ch: FeedChannel, items: FeedEpisode[]): string {
  const e = escapeXml;
  const out: string[] = [];
  out.push('<?xml version="1.0" encoding="UTF-8"?>');
  out.push(
    '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
  );
  out.push("<channel>");
  out.push(`<title>${e(ch.title)}</title>`);
  out.push(`<link>${e(ch.link)}</link>`);
  out.push(`<atom:link href="${e(ch.feedUrl)}" rel="self" type="application/rss+xml"/>`);
  out.push(`<description>${e(ch.description)}</description>`);
  out.push(`<language>${e(ch.language)}</language>`);
  out.push(`<itunes:author>${e(ch.author)}</itunes:author>`);
  out.push(`<itunes:summary>${e(ch.description)}</itunes:summary>`);
  out.push(`<itunes:category text="${e(ch.category)}"/>`);
  out.push(`<itunes:explicit>${ch.explicit ? "true" : "false"}</itunes:explicit>`);
  out.push(`<itunes:type>episodic</itunes:type>`);
  if (ch.imageUrl) out.push(`<itunes:image href="${e(ch.imageUrl)}"/>`);
  for (const it of items) {
    out.push("<item>");
    out.push(`<title>${e(it.title)}</title>`);
    out.push(`<description>${e(it.description)}</description>`);
    out.push(`<link>${e(it.link)}</link>`);
    out.push(`<guid isPermaLink="false">${e(it.guid)}</guid>`);
    out.push(`<pubDate>${rfc2822(it.publishedAt)}</pubDate>`);
    out.push(`<enclosure url="${e(it.audioUrl)}" length="${it.audioBytes}" type="${e(it.mimeType)}"/>`);
    if (it.durationSeconds) out.push(`<itunes:duration>${hhmmss(it.durationSeconds)}</itunes:duration>`);
    if (it.number) out.push(`<itunes:episode>${it.number}</itunes:episode>`);
    out.push(`<itunes:explicit>${ch.explicit ? "true" : "false"}</itunes:explicit>`);
    out.push("</item>");
  }
  out.push("</channel></rss>");
  return out.join("\n");
}

/** iCalendar (RFC 5545) export of broadcast occurrences. */
export function buildIcs(
  calName: string,
  events: { uid: string; start: Date; end: Date; summary: string; description?: string; url?: string; cancelled?: boolean }[],
): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Kingdom Sound Radio//Schedule//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${esc(calName)}`];
  const stamp = fmt(new Date());
  for (const ev of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmt(ev.start)}`,
      `DTEND:${fmt(ev.end)}`,
      `SUMMARY:${esc(ev.summary)}`,
    );
    if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`);
    if (ev.url) lines.push(`URL:${ev.url}`);
    if (ev.cancelled) lines.push("STATUS:CANCELLED");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
