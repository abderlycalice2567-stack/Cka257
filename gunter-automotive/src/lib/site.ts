import { business } from "@/config/business";
import { services } from "@/content/services";
import { approvedWorkshopPhotos } from "@/content/workshop";

/**
 * SITE_MODE controls what is shown publicly:
 *  - "preview" (default): private sales demo. Draft content is visible but labelled,
 *    every page is noindex and robots.txt disallows everything.
 *  - "live": only set after written owner sign-off. Unapproved content is hidden.
 */
export const isLive = () => process.env.SITE_MODE === "live";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const visibleServices = () => (isLive() ? services.filter((s) => s.approved) : services);

export const showWorkshop = () => !isLive() || approvedWorkshopPhotos().length > 0;

export const navItems = () =>
  [
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    ...(showWorkshop() ? [{ href: "/workshop", label: "Workshop" }] : []),
    { href: "/contact", label: "Contact" },
  ] as const;

export const pageTitle = (title?: string) =>
  title ? `${title} | ${business.name}` : `${business.name} | Auto Repair in Georgia`;
