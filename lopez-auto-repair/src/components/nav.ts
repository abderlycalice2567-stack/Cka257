import { gallery } from "@/content/services";

export const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  // Workshop is omitted entirely when there are no gallery assets.
  ...(gallery.length > 0 ? [{ href: "/workshop", label: "Workshop" }] : []),
  { href: "/contact", label: "Contact" },
];
