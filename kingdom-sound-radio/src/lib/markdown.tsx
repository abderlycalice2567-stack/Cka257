import type { ReactNode } from "react";

/**
 * Small, safe Markdown subset renderer (headings, paragraphs, lists, bold,
 * italic, links). It builds React elements — never raw HTML — so editor
 * content cannot inject markup or scripts.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) nodes.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*")) nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    else {
      const lm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok);
      const href = lm?.[2] ?? "";
      const safe = /^(https:\/\/|\/|mailto:)/.test(href);
      nodes.push(
        safe ? (
          <a key={key} href={href} className="underline underline-offset-2" {...(href.startsWith("https://") ? { rel: "noopener noreferrer", target: "_blank" } : {})}>
            {lm?.[1]}
          </a>
        ) : (
          lm?.[1]
        ),
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className={`prose-ksr ${className}`}>
      {blocks.map((block, bi) => {
        const b = block.trim();
        if (!b) return null;
        const key = `b${bi}`;
        if (b.startsWith("### ")) return <h4 key={key}>{inline(b.slice(4), key)}</h4>;
        if (b.startsWith("## ")) return <h3 key={key}>{inline(b.slice(3), key)}</h3>;
        if (b.startsWith("# ")) return <h2 key={key}>{inline(b.slice(2), key)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-*] /.test(l))) {
          return (
            <ul key={key}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-*] /, ""), `${key}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={key}>{inline(lines.join(" "), key)}</p>;
      })}
    </div>
  );
}
