import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type {
  BlockedDate,
  Booking,
  BookingStatus,
  Catalogue,
  DepositMethod,
  DepositStatus,
  NewBooking,
  PricingConfig,
  Session,
} from "../src/lib/config";
import type { Estimate } from "../src/lib/pricing";
import { calcEstimate } from "../src/lib/pricing";

const ROOT = process.cwd();
const SESSIONS_PATH = join(ROOT, "data", "sessions.json");
const BOOKINGS_PATH = join(ROOT, "data", "bookings.json");
const SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00"];

interface CatalogueStore extends Catalogue {
  sessions: Session[];
}

interface BookingsStore {
  bookings: Booking[];
}

export class BookingError extends Error {
  status: number;
  code: string;
  bookedSlots?: string[];
  constructor(message: string, status = 400, code = "invalid", bookedSlots?: string[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.bookedSlots = bookedSlots;
  }
}

function readJson<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

/** Write through a temp file so a crash cannot leave half a JSON document. */
function writeJson(path: string, data: unknown) {
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  renameSync(temp, path);
}

export function readCatalogue(): CatalogueStore {
  return readJson<CatalogueStore>(SESSIONS_PATH, {
    sessions: [],
    pricingConfig: {} as PricingConfig,
    blockedDates: [],
    testimonials: [],
    faqs: [],
    settings: {} as Catalogue["settings"],
  });
}

export function writeCatalogue(catalogue: CatalogueStore) {
  writeJson(SESSIONS_PATH, catalogue);
}

export function readBookings(): BookingsStore {
  return readJson<BookingsStore>(BOOKINGS_PATH, { bookings: [] });
}

function writeBookings(store: BookingsStore) {
  writeJson(BOOKINGS_PATH, store);
}

function isoToday(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function reference(date: string, taken: Set<string>): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const yymmdd = date.replaceAll("-", "").slice(2);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const bytes = randomBytes(4);
    let suffix = "";
    for (let i = 0; i < 4; i += 1) suffix += alphabet[bytes[i] % alphabet.length];
    const candidate = `W4L-${yymmdd}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `W4L-${yymmdd}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

export function normalisePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

export function validatePhone(phone: string): boolean {
  const value = normalisePhone(phone);
  return /^(?:\+254|254|0)(7|1)\d{8}$/.test(value);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function availability() {
  const { blockedDates } = readCatalogue();
  const { bookings } = readBookings();
  return {
    booked: bookings
      .filter((booking) => booking.status !== "cancelled")
      .map((booking) => ({ date: booking.date, slot: booking.slot, status: booking.status })),
    blocked: blockedDates,
  };
}

export interface ValidatedBooking {
  booking: Omit<Booking, "id" | "reference" | "created_at" | "status" | "deposit_status">;
  estimate: Estimate;
}

/** Only used to price a booking again on the server before writing it. */
export function priceBooking(input: NewBooking, session: Session, config: PricingConfig): Estimate {
  return calcEstimate(
    {
      basePrice: session.base_price_kes,
      includedEdits: session.included_edits,
      durationId: input.selections?.durationId ?? "base",
      people: Number(input.selections?.people) || 1,
      edits: Number(input.selections?.edits) || 0,
      addOnIds: Array.isArray(input.selections?.addOnIds) ? input.selections.addOnIds : [],
      locationId: input.selections?.locationId ?? "studio",
      rush: Boolean(input.selections?.rush),
    },
    config,
  );
}

export function createBooking(input: NewBooking): Booking {
  const catalogue = readCatalogue();
  const session = catalogue.sessions.find((item) => item.id === input.session_id);
  if (!session) throw new BookingError("That session is no longer available.", 404, "session_missing");

  const name = String(input.name ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const email = String(input.email ?? "").trim();
  const notes = String(input.notes ?? "").trim();
  const depositMethod = input.deposit_method as DepositMethod;

  if (name.length < 2) throw new BookingError("Add the name the booking should be under.", 422, "invalid_name");
  if (!validatePhone(phone)) throw new BookingError("Use a Kenyan number: +254 7xx xxx xxx or 07xx xxx xxx.", 422, "invalid_phone");
  if (!validateEmail(email)) throw new BookingError("That email does not look complete.", 422, "invalid_email");
  if (!input.termsAccepted) throw new BookingError("Please accept the booking terms.", 422, "terms_required");
  if (!["mpesa", "card", "bank"].includes(depositMethod)) throw new BookingError("Choose a deposit method.", 422, "invalid_method");

  const date = String(input.date ?? "");
  if (!isIsoDate(date)) throw new BookingError("Choose a date.", 422, "invalid_date");
  if (date < isoToday()) throw new BookingError("That date has already passed.", 422, "past_date");
  if (!SLOTS.includes(input.slot)) throw new BookingError("Choose one of the studio slots.", 422, "invalid_slot");

  const blocked = catalogue.blockedDates.some(
    (entry) => entry.date === date && (entry.slot === null || entry.slot === input.slot),
  );
  if (blocked) throw new BookingError("The studio is closed on that slot. Pick another.", 409, "slot_blocked");

  const store = readBookings();
  const clash = store.bookings.filter(
    (booking) =>
      booking.date === date && booking.slot === input.slot && booking.status !== "cancelled",
  );
  if (clash.length > 0) {
    throw new BookingError(
      "That slot was just taken. Choose another time.",
      409,
      "slot_taken",
      [...new Set(clash.map((booking) => booking.slot))],
    );
  }

  const estimate = priceBooking(input, session, catalogue.pricingConfig);
  const taken = new Set(store.bookings.map((booking) => booking.reference));

  const booking: Booking = {
    id: randomBytes(8).toString("hex"),
    reference: reference(date, taken),
    session_id: session.id,
    selections: {
      sessionTitle: session.title,
      sessionSlug: session.slug,
      durationId: input.selections?.durationId ?? "base",
      durationLabel: input.selections?.durationLabel ?? "Base duration",
      people: Number(input.selections?.people) || 1,
      edits: Number(input.selections?.edits) || session.included_edits,
      addOnIds: Array.isArray(input.selections?.addOnIds) ? input.selections.addOnIds : [],
      locationId: input.selections?.locationId ?? "studio",
      locationLabel: input.selections?.locationLabel ?? "Studio",
      rush: Boolean(input.selections?.rush),
    },
    estimate_kes: estimate.total,
    deposit_kes: estimate.deposit,
    date,
    slot: input.slot,
    name,
    phone,
    email,
    notes,
    status: "pending",
    deposit_status: "unpaid",
    deposit_method: depositMethod,
    created_at: new Date().toISOString(),
  };

  store.bookings.push(booking);
  writeBookings(store);
  return booking;
}

export function updateBooking(id: string, patch: Partial<Pick<Booking, "status" | "deposit_status">>): Booking {
  const store = readBookings();
  const booking = store.bookings.find((item) => item.id === id);
  if (!booking) throw new BookingError("Booking not found.", 404, "not_found");
  if (patch.status) {
    const statuses: BookingStatus[] = ["pending", "confirmed", "cancelled", "completed"];
    if (!statuses.includes(patch.status)) throw new BookingError("Unknown status.", 422, "invalid_status");
    booking.status = patch.status;
  }
  if (patch.deposit_status) {
    const deposits: DepositStatus[] = ["unpaid", "paid"];
    if (!deposits.includes(patch.deposit_status)) throw new BookingError("Unknown deposit state.", 422, "invalid_deposit");
    booking.deposit_status = patch.deposit_status;
  }
  writeBookings(store);
  return booking;
}

export function lookupBookings(query: string): Booking[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return readBookings()
    .bookings.filter(
      (booking) =>
        booking.reference.toLowerCase() === needle ||
        booking.email.toLowerCase() === needle ||
        normalisePhone(booking.phone) === normalisePhone(needle),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function blockDate(entry: BlockedDate): BlockedDate[] {
  if (!isIsoDate(entry.date)) throw new BookingError("Choose a valid date.", 422, "invalid_date");
  if (entry.slot !== null && !SLOTS.includes(entry.slot)) throw new BookingError("Choose a valid slot.", 422, "invalid_slot");
  const catalogue = readCatalogue();
  const exists = catalogue.blockedDates.some((item) => item.date === entry.date && item.slot === entry.slot);
  if (!exists) {
    catalogue.blockedDates.push({
      date: entry.date,
      slot: entry.slot,
      reason: String(entry.reason ?? "").slice(0, 160),
    });
  }
  catalogue.blockedDates.sort((a, b) => a.date.localeCompare(b.date));
  writeCatalogue(catalogue);
  return catalogue.blockedDates;
}

export function unblockDate(entry: { date: string; slot: string | null }): BlockedDate[] {
  const catalogue = readCatalogue();
  catalogue.blockedDates = catalogue.blockedDates.filter(
    (item) => !(item.date === entry.date && item.slot === entry.slot),
  );
  writeCatalogue(catalogue);
  return catalogue.blockedDates;
}

export function saveSession(session: Session): CatalogueStore {
  const catalogue = readCatalogue();
  const index = catalogue.sessions.findIndex((item) => item.id === session.id);
  if (index === -1) throw new BookingError("Session not found.", 404, "not_found");

  const price = Math.round(Number(session.base_price_kes));
  if (!Number.isFinite(price) || price < 0) throw new BookingError("Base price must be a positive number.", 422, "invalid_price");

  const duration = Math.round(Number(session.base_duration_min));
  if (!Number.isFinite(duration) || duration < 15) throw new BookingError("Duration is too short.", 422, "invalid_duration");

  const edits = Math.round(Number(session.included_edits));
  if (!Number.isFinite(edits) || edits < 0) throw new BookingError("Included edits must be zero or more.", 422, "invalid_edits");

  catalogue.sessions[index] = {
    ...catalogue.sessions[index],
    title: String(session.title).slice(0, 80) || catalogue.sessions[index].title,
    category: String(session.category).slice(0, 40) || catalogue.sessions[index].category,
    description: String(session.description).slice(0, 500),
    base_price_kes: price,
    base_duration_min: duration,
    included_edits: edits,
    active: Boolean(session.active),
  };
  writeCatalogue(catalogue);
  return catalogue;
}

export function savePricing(pricing: PricingConfig): CatalogueStore {
  const catalogue = readCatalogue();
  const current = catalogue.pricingConfig;

  const next: PricingConfig = {
    ...current,
    durationOptions: current.durationOptions.map((option) => {
      const match = pricing.durationOptions?.find((item) => item.id === option.id);
      const factor = Number(match?.factor);
      return match && Number.isFinite(factor) && factor > 0 ? { ...option, factor } : option;
    }),
    peopleBands: current.peopleBands.map((band) => {
      const match = pricing.peopleBands?.find((item) => item.id === band.id);
      const factor = Number(match?.factor);
      return match && Number.isFinite(factor) && factor > 0 ? { ...band, factor } : band;
    }),
    addOns: current.addOns.map((addOn) => {
      const match = pricing.addOns?.find((item) => item.id === addOn.id);
      const price = Number(match?.price);
      return match && Number.isFinite(price) && price >= 0 ? { ...addOn, price: Math.round(price) } : addOn;
    }),
    locations: current.locations.map((location) => {
      const match = pricing.locations?.find((item) => item.id === location.id);
      const fee = Number(match?.fee);
      return match && Number.isFinite(fee) && fee >= 0 ? { ...location, fee: Math.round(fee) } : location;
    }),
    editRate: Math.max(0, Math.round(Number(pricing.editRate) || current.editRate)),
    includedEdits: Math.max(0, Math.round(Number(pricing.includedEdits) || current.includedEdits)),
    rushMultiplier: Math.max(1, Number(pricing.rushMultiplier) || current.rushMultiplier),
    depositPercent: Math.min(1, Math.max(0.05, Number(pricing.depositPercent) || current.depositPercent)),
    usdRate: Math.max(1, Number(pricing.usdRate) || current.usdRate),
  };

  catalogue.pricingConfig = next;
  writeCatalogue(catalogue);
  return catalogue;
}

export function bookingsCsv(): string {
  const { bookings } = readBookings();
  const header = [
    "reference",
    "date",
    "slot",
    "session",
    "name",
    "phone",
    "email",
    "estimate_kes",
    "deposit_kes",
    "status",
    "deposit_status",
    "deposit_method",
    "notes",
    "created_at",
  ];
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const rows = bookings.map((booking) =>
    [
      booking.reference,
      booking.date,
      booking.slot,
      booking.selections.sessionTitle,
      booking.name,
      booking.phone,
      booking.email,
      booking.estimate_kes,
      booking.deposit_kes,
      booking.status,
      booking.deposit_status,
      booking.deposit_method,
      booking.notes,
      booking.created_at,
    ]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function catalogueForClient(): Catalogue {
  const catalogue = readCatalogue();
  return {
    sessions: [...catalogue.sessions].filter((session) => session.active).sort((a, b) => a.sort_order - b.sort_order),
    pricingConfig: catalogue.pricingConfig,
    blockedDates: catalogue.blockedDates,
    testimonials: catalogue.testimonials,
    faqs: catalogue.faqs,
    settings: catalogue.settings,
  };
}

export { SLOTS };
