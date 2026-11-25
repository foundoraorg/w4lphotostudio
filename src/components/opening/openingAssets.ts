/**
 * W4L Studios — opening hero assets and layout maths.
 *
 * Colours, type and print treatment come from the existing W4L design
 * system (src/index.css variables + tailwind.config.js). Nothing here
 * introduces a new palette or an outside visual identity.
 */

/** Mirrors the CSS custom properties in src/index.css (single source of truth). */
export const W4L = {
  wall: "var(--wall)",
  page: "var(--page)",
  ink: "var(--ink)",
  accent: "var(--accent)",
  bronze: "var(--bronze)",
  night: "var(--night)",
  line: "var(--line, #d9d2c5)",
  muted: "var(--muted, #6f665f)",
} as const;

/**
 * Pixel palette for the icon set: ink, bronze and the lime accent, with the
 * page colour used only inside frames.
 */
export const PIXEL_COLOURS = {
  k: "#29211D",
  b: "#B97953",
  a: "#C8F23D",
  w: "#F8F6F0",
} as const;

export type PixelKey = keyof typeof PIXEL_COLOURS;

/**
 * Seven 9 × 9 photography marks: camera, lens, flash, film, print,
 * composition guides and light. Same silhouette language as the original
 * choreography, rebuilt around the studio's craft.
 */
export const PRINT_ICONS: string[][] = [
  // camera
  [
    ".........",
    "...kkk...",
    ".kkkkkkk.",
    "kkkkkkkkk",
    "kkkwwwkkk",
    "kkkwbwkkk",
    "kkkwwwkkk",
    "kkkkkkkkk",
    ".........",
  ],
  // lens
  [
    "...kkk...",
    "..kwwwk..",
    ".kwkkkwk.",
    "kwkwwwkwk",
    "kwkwbwkwk",
    "kwkwwwkwk",
    ".kwkkkwk.",
    "..kwwwk..",
    "...kkk...",
  ],
  // flash
  [
    ".....kkk.",
    "....kkk..",
    "...kkk...",
    "..kkkkk..",
    "....kk...",
    "...kk....",
    "..kk.....",
    ".kk......",
    ".........",
  ],
  // film strip
  [
    ".kkkkkkk.",
    ".kwkkkwk.",
    ".kwkkkwk.",
    ".kwkkkwk.",
    ".kwkkkwk.",
    ".kwkkkwk.",
    ".kwkkkwk.",
    ".kwkkkwk.",
    ".kkkkkkk.",
  ],
  // print
  [
    "kkkkkkkkk",
    "kwwwwwwwk",
    "kwwbwwwwk",
    "kwwwwwwwk",
    "kwwwwwwwk",
    "kwkkkkkwk",
    "kwwwwwwwk",
    "kwwwwwwwk",
    "kkkkkkkkk",
  ],
  // composition guides
  [
    "kk.....kk",
    "k.......k",
    ".........",
    ".........",
    "....aa...",
    "....aa...",
    ".........",
    "k.......k",
    "kk.....kk",
  ],
  // light
  [
    "....k....",
    ".k..k..k.",
    "..k.k.k..",
    "...kkk...",
    "k..bbb..k",
    "...kkk...",
    "..k.k.k..",
    ".k..k..k.",
    "....k....",
  ],
];

/* ---------------------------------------------------------------- prints */

export interface Print {
  src: string;
  /** Focal point for the card crop, in % of the image. */
  focus: string;
}

/**
 * The six prints in the fan, left to right. To use real W4L photographs,
 * replace public/images/hero/print-1…6.jpg and keep the order below.
 */
export const PRINTS: Print[] = [
  { src: "/images/hero/print-1.jpg", focus: "50% 32%" }, // portrait, window light
  { src: "/images/hero/print-6.jpg", focus: "50% 45%" }, // hands and film camera
  { src: "/images/hero/print-3.jpg", focus: "50% 50%" }, // still life
  { src: "/images/hero/print-4.jpg", focus: "50% 42%" }, // family on the beach
  { src: "/images/hero/print-2.jpg", focus: "50% 50%" }, // studio interior
  { src: "/images/hero/print-5.jpg", focus: "50% 35%" }, // couple at dusk
];

/* --------------------------------------------------------------- metrics */

export interface OpeningMetrics {
  W: number;
  H: number;
  mobile: boolean;
  /** --u: the design unit. */
  u: number;
  /** --hfs: headline font size. */
  hfs: number;
  /** --ic: pixel icon size. */
  ic: number;
  /** print width before the mobile fit guard. */
  cw: number;
}

export function openingMetrics(host?: HTMLElement | null): OpeningMetrics {
  // The hero now sits under the site header, so its own box is the frame the
  // fan is composed against — not the full viewport.
  const W = host?.clientWidth || window.innerWidth;
  const H = host?.clientHeight || window.innerHeight;
  const mobile = W < 820 && W < H * 1.1;
  const u = Math.min(W / 1440, H / 800);
  const hfs = mobile ? Math.min(W * 0.12, H * 0.09) : Math.min(W * 0.074, H * 0.135);
  const ic = hfs * 0.62;
  const cw = mobile ? Math.min(W * 0.3, H * 0.2) : Math.min(W / 1440, H / 780) * 218;
  return { W, H, mobile, u, hfs, ic, cw };
}

export interface FanSlot {
  x: number;
  y: number;
  /** degrees */
  rotation: number;
}

const fanSlots = (cw: number, m: OpeningMetrics): FanSlot[] => {
  const R = m.mobile ? m.W * 1.35 : (1250 * m.W) / 1440;
  const cx = m.mobile ? m.W * 0.5 : m.W * 0.55;
  // Phones sit the fan higher so the prints read as prints, not a sliver.
  const cy = m.H * (m.mobile ? 0.72 : 0.86) + R;
  const step = 2 * Math.asin(Math.min(1, (1.05 * cw) / (2 * R)));
  return Array.from({ length: 6 }, (_, i) => {
    const theta = (i - 2.5) * step;
    return {
      x: cx + R * Math.sin(theta) - m.W * 0.02,
      y: cy - R * Math.cos(theta) + (m.mobile ? cw * 0.2 : 0),
      rotation: (theta * 180) / Math.PI,
    };
  });
};

/**
 * The six-print fan.
 *
 * The width is the reference value. On a phone that width makes the two
 * outer prints sit entirely outside the viewport, so a guard shrinks the
 * prints until every fan position is on screen; the geometry formula itself
 * is unchanged.
 */
export function printFan(m: OpeningMetrics): { cw: number; slots: FanSlot[] } {
  let cw = m.cw;
  let slots = fanSlots(cw, m);
  for (let guard = 0; guard < 48; guard += 1) {
    // On phones the fan must also stay inside the viewport, not just on screen.
    const inFrame =
      !m.mobile ||
      (Math.min(...slots.map((s) => s.x)) >= 12 &&
        Math.max(...slots.map((s) => s.x)) <= m.W - 12);
    // Every print should show at least its upper half above the crop.
    const tallEnough = slots.every((s) => s.y - cw * 0.72 <= m.H - 8);
    if (inFrame && tallEnough) break;
    cw *= 0.94;
    slots = fanSlots(cw, m);
  }
  return { cw, slots };
}
