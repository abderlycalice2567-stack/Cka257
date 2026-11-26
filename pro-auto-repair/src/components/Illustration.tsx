import type { GalleryItem } from "@/config/business";

/**
 * Original, in-repo SVG scenes used as illustrative placeholders in the private
 * demo. They depict nothing real and must be replaced by owner-approved photos.
 */
export function Illustration({ scene, className = "" }: { scene: GalleryItem["scene"]; className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill="#E3EAF1" />
      <rect y="215" width="400" height="85" fill="#C9D5E0" />
      {scene === "bay" && (
        <g>
          <rect x="40" y="40" width="320" height="16" rx="4" fill="#17324D" opacity=".25" />
          <rect x="92" y="150" width="12" height="80" fill="#17324D" />
          <rect x="296" y="150" width="12" height="80" fill="#17324D" />
          <rect x="80" y="146" width="240" height="10" rx="3" fill="#087E83" />
          <path d="M110 146c6-30 22-48 50-48h70c26 0 44 14 56 34l14 4c8 2 10 6 10 10z" fill="#17324D" />
          <path d="M150 108h36v26h-52c2-14 8-22 16-26zm48 0h30c14 0 24 10 32 26h-62z" fill="#E3EAF1" />
          <circle cx="150" cy="150" r="20" fill="#0F2236" /><circle cx="150" cy="150" r="8" fill="#C9D5E0" />
          <circle cx="262" cy="150" r="20" fill="#0F2236" /><circle cx="262" cy="150" r="8" fill="#C9D5E0" />
        </g>
      )}
      {scene === "inspection" && (
        <g>
          <rect x="130" y="50" width="140" height="190" rx="10" fill="#fff" stroke="#17324D" strokeWidth="6" />
          <rect x="170" y="38" width="60" height="26" rx="6" fill="#17324D" />
          {[95, 130, 165, 200].map((y, i) => (
            <g key={y}>
              <rect x="150" y={y - 10} width="20" height="20" rx="4" fill={i < 3 ? "#087E83" : "#E3EAF1"} />
              {i < 3 && <path d={`M154 ${y}l5 5 8-9`} stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />}
              <rect x="182" y={y - 4} width={i % 2 ? 56 : 70} height="8" rx="4" fill="#C9D5E0" />
            </g>
          ))}
        </g>
      )}
      {scene === "desk" && (
        <g>
          <rect x="60" y="150" width="280" height="80" rx="6" fill="#17324D" />
          <rect x="50" y="140" width="300" height="14" rx="4" fill="#087E83" />
          <rect x="150" y="70" width="100" height="62" rx="6" fill="#0F2236" />
          <rect x="158" y="78" width="84" height="46" rx="2" fill="#D9EFEF" />
          <rect x="192" y="132" width="16" height="10" fill="#0F2236" />
          <rect x="280" y="112" width="34" height="28" rx="4" fill="#fff" stroke="#17324D" strokeWidth="4" />
          <circle cx="92" cy="122" r="18" fill="#fff" stroke="#17324D" strokeWidth="4" />
          <path d="M92 110v12l8 5" stroke="#087E83" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
