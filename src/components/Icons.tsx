import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </Base>
);

export const ArrowLeft = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 12H5" />
    <path d="m11 18-6-6 6-6" />
  </Base>
);

export const ChevronDown = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);

export const Search = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Base>
);

export const Heart = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20s-7.2-4.4-7.2-9.4A4.1 4.1 0 0 1 12 7.5a4.1 4.1 0 0 1 7.2 3.1C19.2 15.6 12 20 12 20Z" />
  </Base>
);

export const HeartFilled = (p: IconProps) => (
  <Base {...p} fill="currentColor">
    <path d="M12 20s-7.2-4.4-7.2-9.4A4.1 4.1 0 0 1 12 7.5a4.1 4.1 0 0 1 7.2 3.1C19.2 15.6 12 20 12 20Z" />
  </Base>
);

export const Calendar = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="1" />
    <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
  </Base>
);

export const Close = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);

export const Check = (p: IconProps) => (
  <Base {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </Base>
);

export const Minus = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);

export const Plus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const Download = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M5 19.5h14" />
  </Base>
);

export const Copy = (p: IconProps) => (
  <Base {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1" />
    <path d="M15.5 8.5v-4h-11v11h4" />
  </Base>
);

export const MapPin = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21s6.5-6.1 6.5-11a6.5 6.5 0 1 0-13 0C5.5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Base>
);

export const Phone = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
  </Base>
);

export const Mail = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1" />
    <path d="m4 7 8 6 8-6" />
  </Base>
);

export const Instagram = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="16.9" cy="7.1" r="0.9" fill="currentColor" stroke="none" />
  </Base>
);

export const WhatsApp = (p: IconProps) => (
  <Base {...p} strokeWidth="1.4">
    <path d="M20 11.6a8 8 0 0 1-11.9 7l-4 1 1.1-3.9A8 8 0 1 1 20 11.6Z" />
    <path d="M9 8.4c-.5.7-.4 2 .6 3.4 1 1.4 2.3 2.2 3.3 2.3.5 0 1.1-.2 1.4-.7.2-.4.2-.8 0-1l-1.2-.6-.8.7c-.8-.3-1.6-1.1-1.9-1.9l.7-.8-.6-1.2c-.2-.3-.6-.4-1-.3Z" />
  </Base>
);

export const Lock = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="1" />
    <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
  </Base>
);

export const Trash = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 6.5h15M9 6.5V4.5h6v2M6.5 6.5l1 14h9l1-14" />
  </Base>
);

export const Camera = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 7.5h3l1.5-2h6l1.5 2h3v12h-15Z" />
    <circle cx="12" cy="13" r="3.6" />
  </Base>
);

export const ExternalLink = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4h6v6M20 4l-8 8" />
    <path d="M18 14v5.5H4.5V6H10" />
  </Base>
);
