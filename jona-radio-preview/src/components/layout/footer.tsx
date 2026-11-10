import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { footerNav, socialLinks, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 bg-navy-900 text-ivory">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/70">
            Une voix d’espoir, de foi et d’inspiration. Radio chrétienne en ligne, en français.
          </p>
          <p className="mt-4 text-xs text-ivory/50">
            Démonstration indépendante. Site officiel :{" "}
            <a
              href={site.official.website}
              className="underline hover:text-gold-400"
              rel="noopener noreferrer nofollow"
              target="_blank"
            >
              jonaradio.net
            </a>
          </p>
        </div>

        {footerNav.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-400">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-ivory/75 hover:text-ivory">
                    {item.label}
                    {item.demo && <span className="ml-1.5 text-[10px] uppercase text-gold-400">démo</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-xs text-ivory/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Jona Radio (maquette). Coordonnées et mentions légales{" "}
            <Link href="/mentions-legales" className="underline hover:text-gold-400">
              à confirmer par le propriétaire
            </Link>
            .
          </p>
          <ul className="flex items-center gap-4">
            {socialLinks.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:text-gold-400"
                  title={s.verify ? "Lien à vérifier avec le propriétaire" : undefined}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
