export type Currency = "KES" | "USD";

const kesFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatNumber(value: number): string {
  return kesFormatter.format(Math.round(Number.isFinite(value) ? value : 0));
}

export function formatKES(value: number): string {
  return `KES ${formatNumber(value)}`;
}

export function formatUSD(value: number, rate: number): string {
  const safeRate = rate > 0 ? rate : 129;
  return `$${formatNumber(value / safeRate)}`;
}

/** Converts a KES amount for display in either currency. */
export function money(valueKes: number, currency: Currency, rate: number): string {
  return currency === "USD" ? formatUSD(valueKes, rate) : formatKES(valueKes);
}

/** Rounded USD for large display figures. */
export function usd(valueKes: number, rate: number): number {
  return Math.round(valueKes / (rate > 0 ? rate : 129));
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local midnight for a YYYY-MM-DD string, avoiding UTC drift. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDateLong(iso: string): string {
  const date = fromISODate(iso);
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatDateShort(iso: string): string {
  const date = fromISODate(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** 6x7 matrix of ISO dates (null outside the month) starting Monday. */
export function monthMatrix(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(toISODate(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function addMinutesToSlot(slot: string, minutes: number): string {
  const [h, m] = slot.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = `${Math.floor((total / 60) % 24)}`.padStart(2, "0");
  const mm = `${total % 60}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

export function referenceFor(date: string, suffix: string): string {
  return `W4L-${date.replaceAll("-", "").slice(2)}-${suffix}`;
}

export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}
