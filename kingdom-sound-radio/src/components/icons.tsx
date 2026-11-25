import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const Play = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" /></svg>
);
export const Pause = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" /></svg>
);
export const Stop = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" /></svg>
);
export const Radio = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" /></svg>
);
export const Volume = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
);
export const Mute = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m16 9 5 5m0-5-5 5" /></svg>
);
export const ChevronUp = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m6 15 6-6 6 6" /></svg>);
export const ChevronDown = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m6 9 6 6 6-6" /></svg>);
export const ChevronRight = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m9 6 6 6-6 6" /></svg>);
export const Back15 = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.7" /><path d="M4 4v4.7h4.7" /><text x="12" y="15.5" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="700">15</text></svg>
);
export const Fwd30 = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M20 12a8 8 0 1 1-2.3-5.6L20 8.7" /><path d="M20 4v4.7h-4.7" /><text x="12" y="15.5" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="700">30</text></svg>
);
export const SkipNext = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 5v14l9-7-9-7Z" fill="currentColor" stroke="none" /><path d="M18 5v14" /></svg>);
export const SkipPrev = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M18 5v14l-9-7 9-7Z" fill="currentColor" stroke="none" /><path d="M6 5v14" /></svg>);
export const Share = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></svg>);
export const Heart = ({ size, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size)} {...p}><path d="M12 20s-7.5-4.6-9.2-9.4C1.7 7.4 3.8 4.5 7 4.5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.2 0 5.3 2.9 4.2 6.1C19.5 15.4 12 20 12 20Z" fill={filled ? "currentColor" : "none"} /></svg>
);
export const Bell = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>);
export const Calendar = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>);
export const Search = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>);
export const User = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
export const Home = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" /></svg>);
export const Grid = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>);
export const Replay = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.7" /><path d="M4 4v4.7h4.7" /><path d="M10 9.5v5l4-2.5-4-2.5Z" fill="currentColor" stroke="none" /></svg>);
export const Menu = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const Close = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m6 6 12 12M18 6 6 18" /></svg>);
export const Sun = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></svg>);
export const Moon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>);
export const Globe = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z" /></svg>);
export const Moonclock = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="13" r="7.5" /><path d="M12 9v4l2.5 2M9 2.5h6" /></svg>);
export const List = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>);
export const Download = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" /></svg>);
export const Rss = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" /><circle cx="6" cy="18" r="1.5" fill="currentColor" /></svg>);
export const External = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5" /></svg>);
export const Check = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
