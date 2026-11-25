import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { buildIcs, buildPodcastRss, escapeXml, hhmmss } from "@/lib/xml";
import { negotiateLocale, pick } from "@/lib/i18n/config";
import en from "@/lib/i18n/dictionaries/en";
import fr from "@/lib/i18n/dictionaries/fr";
import ht from "@/lib/i18n/dictionaries/ht";
import { Markdown } from "@/lib/markdown";
import { contactSchema, prayerSchema, signUpSchema, testimonySchema } from "@/lib/validation";
import { slugify } from "@/lib/admin";

function keys(o: object, prefix = ""): string[] {
  return Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe("i18n", () => {
  it("French and Haitian Creole dictionaries cover every English key", () => {
    const base = keys(en).sort();
    expect(keys(fr).sort()).toEqual(base);
    expect(keys(ht).sort()).toEqual(base);
  });
  it("negotiates the best supported language", () => {
    expect(negotiateLocale("fr-CA,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(negotiateLocale("ht,en;q=0.5")).toBe("ht");
    expect(negotiateLocale("de-DE,es;q=0.8")).toBe("en");
    expect(negotiateLocale(null)).toBe("en");
  });
  it("falls back to English for untranslated content", () => {
    expect(pick({ en: "Hello", fr: "Bonjour" }, "ht")).toBe("Hello");
    expect(pick({ en: "Hello", fr: "Bonjour" }, "fr")).toBe("Bonjour");
  });
});

describe("podcast RSS and calendar", () => {
  it("escapes XML and builds a valid-looking feed", () => {
    const xml = buildPodcastRss(
      { title: "Faith & <Culture>", description: "d", link: "https://x/p", feedUrl: "https://x/f.xml", language: "en", author: "KSR", category: "Religion & Spirituality", explicit: false },
      [{ guid: "g1", title: "Ep \"1\"", description: "x", link: "https://x/e", audioUrl: "https://x/a.mp3", audioBytes: 123, mimeType: "audio/mpeg", durationSeconds: 3725, publishedAt: new Date("2026-01-02T03:04:05Z"), number: 1 }],
    );
    expect(xml).toContain("<title>Faith &amp; &lt;Culture&gt;</title>");
    expect(xml).toContain('<enclosure url="https://x/a.mp3" length="123" type="audio/mpeg"/>');
    expect(xml).toContain("<itunes:duration>01:02:05</itunes:duration>");
    expect(xml).toContain('<guid isPermaLink="false">g1</guid>');
    expect(xml).toContain("Fri, 02 Jan 2026 03:04:05 GMT");
    expect(escapeXml(`'"`)).toBe("&apos;&quot;");
    expect(hhmmss(59)).toBe("00:00:59");
  });
  it("builds RFC 5545 calendars with CRLF and escaping", () => {
    const ics = buildIcs("Cal", [{ uid: "1@x", start: new Date("2026-03-08T06:30:00Z"), end: new Date("2026-03-08T07:30:00Z"), summary: "A, B; C", cancelled: true }]);
    expect(ics).toContain("\r\n");
    expect(ics).toContain("DTSTART:20260308T063000Z");
    expect(ics).toContain("SUMMARY:A\\, B\\; C");
    expect(ics).toContain("STATUS:CANCELLED");
  });
});

describe("markdown renderer is injection-safe", () => {
  const html = (src: string) => renderToStaticMarkup(createElement(Markdown, { source: src }));
  it("renders the supported subset", () => {
    const out = html("## Title\n\n- **bold** item\n- [link](https://example.org)");
    expect(out).toContain("<h3>Title</h3>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain('href="https://example.org"');
  });
  it("never emits raw HTML or javascript: links", () => {
    const out = html('<script>alert(1)</script>\n\n[x](javascript:alert(1)) <img src=x onerror=alert(1)>');
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<img");
    expect(out).not.toContain("javascript:");
    expect(out).toContain("&lt;script&gt;");
  });
});

describe("validation", () => {
  it("requires consent and a valid email on contact", () => {
    expect(contactSchema.safeParse({ name: "Ann", email: "a@b.co", body: "Hello there friend", consent: "on" }).success).toBe(true);
    expect(contactSchema.safeParse({ name: "Ann", email: "a@b.co", body: "Hello there friend" }).success).toBe(false);
    expect(contactSchema.safeParse({ name: "Ann", email: "nope", body: "Hello there friend", consent: "on" }).success).toBe(false);
  });
  it("defaults prayer requests to private and allows anonymous email", () => {
    const r = prayerSchema.parse({ name: "A", body: "Please pray", consent: "on", email: "" });
    expect(r.visibility).toBe("private");
    expect(r.email).toBeUndefined();
  });
  it("records testimony publication consent separately", () => {
    expect(testimonySchema.parse({ name: "A", body: "x".repeat(25), consent: "on" }).consent_publish).toBe(false);
  });
  it("enforces password length and normalises email", () => {
    expect(signUpSchema.safeParse({ display_name: "Al", email: "A@B.CO", password: "short", consent: "on" }).success).toBe(false);
    expect(signUpSchema.parse({ display_name: "Al", email: " A@B.CO ", password: "long enough pw", consent: "on" }).email).toBe("a@b.co");
  });
  it("slugifies accented titles", () => {
    expect(slugify("Prière pour les nations !")).toBe("priere-pour-les-nations");
  });
});
