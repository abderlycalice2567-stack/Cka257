import { business } from "@/config/business";

export const showWorkshop = business.gallery.length > 0;

export const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  ...(showWorkshop ? [{ href: "/workshop", label: "Workshop" }] : []),
  { href: "/contact", label: "Contact" },
];
