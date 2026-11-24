/**
 * Studio configuration: every price, fee and scheduling constant lives here.
 * The running catalogue is stored in /data/sessions.json (seeded from these
 * defaults) so the admin screen can edit prices without a redeploy.
 */

export type Category =
  | "Portrait"
  | "Family"
  | "Couples"
  | "Business"
  | "Commercial"
  | "Fashion"
  | "Maternity"
  | "Kids"
  | "Brand";

export interface ImageCrop {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Session {
  id: string;
  slug: string;
  title: string;
  category: Category | string;
  description: string;
  base_price_kes: number;
  base_duration_min: number;
  included_edits: number;
  image_crop: ImageCrop;
  sort_order: number;
  active: boolean;
}

export interface DurationOption {
  id: string;
  label: string;
  factor: number;
  addMinutes: number;
}

export interface PeopleBand {
  id: string;
  label: string;
  min: number;
  max: number;
  factor: number;
}

export interface AddOn {
  id: string;
  label: string;
  price: number;
  blurb: string;
}

export interface Location {
  id: string;
  label: string;
  fee: number;
}

export interface PricingConfig {
  durationOptions: DurationOption[];
  peopleBands: PeopleBand[];
  editRate: number;
  includedEdits: number;
  editOptions: number[];
  addOns: AddOn[];
  rush: { id: string; label: string; price: number; multiplier: number; blurb: string };
  locations: Location[];
  rushMultiplier: number;
  depositPercent: number;
  usdRate: number;
}

export interface BlockedDate {
  date: string; // YYYY-MM-DD
  slot: string | null;
  reason: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  session: string;
}

export interface Faq {
  id: string;
  q: string;
  a: string;
}

export interface Settings {
  name: string;
  partner: string;
  tagline: string;
  partnerUrl: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: { days: string; time: string }[];
  socials: { label: string; handle: string; url: string }[];
}

export interface Catalogue {
  sessions: Session[];
  pricingConfig: PricingConfig;
  blockedDates: BlockedDate[];
  testimonials: Testimonial[];
  faqs: Faq[];
  settings: Settings;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type DepositStatus = "unpaid" | "paid";
export type DepositMethod = "mpesa" | "card" | "bank";

export interface BookingSelections {
  sessionTitle: string;
  sessionSlug: string;
  durationId: string;
  durationLabel: string;
  people: number;
  edits: number;
  addOnIds: string[];
  locationId: string;
  locationLabel: string;
  rush: boolean;
}

export interface Booking {
  id: string;
  reference: string;
  session_id: string;
  selections: BookingSelections;
  estimate_kes: number;
  deposit_kes: number;
  date: string;
  slot: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: BookingStatus;
  deposit_status: DepositStatus;
  deposit_method: DepositMethod;
  created_at: string;
}

export interface NewBooking {
  session_id: string;
  selections: BookingSelections;
  estimate_kes: number;
  deposit_kes: number;
  date: string;
  slot: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  deposit_method: DepositMethod;
  termsAccepted: boolean;
}

/** Canonical defaults. data/sessions.json carries the editable copy. */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  durationOptions: [
    { id: "base", label: "Base duration", factor: 1, addMinutes: 0 },
    { id: "plus30", label: "+ 30 minutes", factor: 1.25, addMinutes: 30 },
    { id: "plus60", label: "+ 1 hour", factor: 1.5, addMinutes: 60 },
    { id: "halfDay", label: "Half day", factor: 2.5, addMinutes: 180 },
    { id: "fullDay", label: "Full day", factor: 4, addMinutes: 420 },
  ],
  peopleBands: [
    { id: "one", label: "1 person", min: 1, max: 1, factor: 1 },
    { id: "two", label: "2 people", min: 2, max: 2, factor: 1.1 },
    { id: "three-five", label: "3-5 people", min: 3, max: 5, factor: 1.25 },
    { id: "six-ten", label: "6-10 people", min: 6, max: 10, factor: 1.5 },
    { id: "ten-plus", label: "10+ people", min: 11, max: 99, factor: 1.8 },
  ],
  editRate: 300,
  includedEdits: 10,
  editOptions: [10, 20, 30, 50],
  addOns: [
    { id: "hmua", label: "Hair & make-up", price: 6000, blurb: "Artist on set for the session." },
    { id: "wardrobe", label: "Wardrobe styling", price: 5000, blurb: "Looks pulled and steamed before you arrive." },
    { id: "backdrop", label: "Extra backdrop", price: 1500, blurb: "A second paper or hand-painted ground." },
    { id: "prints", label: "Prints & album", price: 8000, blurb: "A 20-page linen album with ten prints." },
    { id: "reel", label: "Short video reel", price: 10000, blurb: "A 30-second vertical cut for social." },
  ],
  rush: { id: "rush", label: "Rush delivery (48 h)", price: 0, multiplier: 1.25, blurb: "Your gallery within two working days." },
  locations: [
    { id: "studio", label: "Studio", fee: 0 },
    { id: "watamu", label: "Watamu", fee: 3000 },
    { id: "kilifi", label: "Kilifi", fee: 4000 },
    { id: "malindi", label: "Malindi", fee: 5000 },
    { id: "mombasa", label: "Mombasa", fee: 6000 },
    { id: "beach", label: "Outdoor / beach", fee: 3500 },
  ],
  rushMultiplier: 1.25,
  depositPercent: 0.3,
  usdRate: 129,
};

export const SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00"] as const;
export type Slot = (typeof SLOTS)[number];

export const DEPOSIT_METHODS: { id: DepositMethod; label: string; instruction: string }[] = [
  {
    id: "mpesa",
    label: "M-Pesa",
    instruction: "Paybill 400 145 · account = your reference. The studio confirms within the hour.",
  },
  {
    id: "card",
    label: "Card",
    instruction: "A secure payment link is sent to your email once we review the brief.",
  },
  {
    id: "bank",
    label: "Bank transfer",
    instruction: "KCB Watamu · W4L Studios Ltd · 1100 223 445. Use your reference as the narrative.",
  },
];

export const FILTERS = ["All", "Portrait", "Family", "Business", "Commercial", "Fashion", "Kids"] as const;

export const NAV_LINKS = [
  { to: "/index", label: "Index" },
  { to: "/sessions", label: "Sessions" },
  { to: "/estimate", label: "Estimate" },
  { to: "/studio", label: "Studio" },
  { to: "/contact", label: "Contact" },
];

export const STUDIO_HIRE = [
  { id: "hourly", label: "Studio + lights", price: 4500, unit: "per hour", note: "Two lights, modifiers and paper." },
  { id: "half", label: "Half day", price: 14000, unit: "4 hours", note: "Includes backdrop changes and an assistant." },
  { id: "full", label: "Full day", price: 24000, unit: "8 hours", note: "The whole room, with a second set built." },
  { id: "content", label: "Content corner", price: 8000, unit: "per half day", note: "Styled corner for small product batches." },
];

export const GEAR = [
  { id: "bodies", label: "Camera bodies", value: 4, suffix: "" },
  { id: "lights", label: "Studio lights", value: 7, suffix: "" },
  { id: "backdrops", label: "Painted backdrops", value: 12, suffix: "" },
  { id: "sessions", label: "Sessions shot", value: 860, suffix: "+" },
];

export const WHAT_INCLUDED = [
  "A pre-session call to shape the brief and the shot list",
  "Private studio time with the full lighting kit",
  "Guided direction throughout, no posing experience needed",
  "Your included edited photographs, retouched by hand",
];

export const DELIVERY_COPY =
  "A private online gallery lands within seven working days. You choose the frames to retouch, we deliver full-resolution files plus web-sized copies, and the gallery stays live for a year. Rush delivery moves you to 48 hours.";

export const CANCELLATION_COPY =
  "Reschedule once, free, up to 72 hours before your session. Cancel more than seven days out and the deposit is refunded in full. Inside 72 hours the deposit can move to another date if the studio fills the slot.";

export const WHAT_TO_WEAR =
  "Bring two or three options in warm neutrals and one thing that feels like you. Avoid large logos and brand-new patterns. Hair and make-up and wardrobe styling can be added to any session, and the studio has a changing room and steamer.";

export const OWNER_WHATSAPP = "254722000145";
