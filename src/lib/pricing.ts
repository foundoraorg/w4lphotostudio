import type { AddOn, DurationOption, Location, PeopleBand, PricingConfig } from "./config";

export interface EstimateInput {
  /** Session base price in KES. */
  basePrice: number;
  /** Edits already included in the session price. */
  includedEdits?: number;
  durationId: string;
  people: number;
  edits: number;
  addOnIds: string[];
  locationId: string;
  rush: boolean;
}

export interface EstimateLine {
  id: string;
  label: string;
  amount: number;
  note?: string;
}

export interface Estimate {
  lines: EstimateLine[];
  subtotal: number;
  rush: boolean;
  rushAmount: number;
  total: number;
  deposit: number;
  duration: DurationOption;
  band: PeopleBand;
  location: Location;
  addOns: AddOn[];
  includedEdits: number;
  extraEdits: number;
}

const FALLBACK_DURATION: DurationOption = { id: "base", label: "Base duration", factor: 1, addMinutes: 0 };
const FALLBACK_BAND: PeopleBand = { id: "one", label: "1 person", min: 1, max: 1, factor: 1 };
const FALLBACK_LOCATION: Location = { id: "studio", label: "Studio", fee: 0 };

export function getDuration(durationId: string, config: PricingConfig): DurationOption {
  return config.durationOptions.find((d) => d.id === durationId) ?? config.durationOptions[0] ?? FALLBACK_DURATION;
}

export function getPeopleBand(people: number, config: PricingConfig): PeopleBand {
  const count = Number.isFinite(people) ? Math.max(1, Math.round(people)) : 1;
  return (
    config.peopleBands.find((b) => count >= b.min && count <= b.max) ??
    config.peopleBands[config.peopleBands.length - 1] ??
    FALLBACK_BAND
  );
}

export function getLocation(locationId: string, config: PricingConfig): Location {
  return config.locations.find((l) => l.id === locationId) ?? config.locations[0] ?? FALLBACK_LOCATION;
}

/**
 * The single source of truth for money.
 *
 *   subtotal = base x durationFactor x peopleFactor
 *            + max(0, edits - included) x editRate
 *            + sum(addOns)
 *            + locationFee
 *   total    = subtotal x rushMultiplier when rush is on
 *   deposit  = round(total x depositPercent)
 *
 * Rounding happens once per line so the breakdown always adds up.
 */
export function calcEstimate(input: EstimateInput, config: PricingConfig): Estimate {
  const base = Math.max(0, Number(input.basePrice) || 0);
  const duration = getDuration(input.durationId, config);
  const band = getPeopleBand(input.people, config);
  const location = getLocation(input.locationId, config);
  const includedEdits = Math.max(0, input.includedEdits ?? config.includedEdits);

  const durationOnly = Math.round(base * duration.factor);
  const combined = Math.round(base * duration.factor * band.factor);

  const lines: EstimateLine[] = [
    { id: "base", label: "Session base", amount: base },
  ];

  const durationDelta = durationOnly - base;
  if (durationDelta !== 0) {
    lines.push({
      id: "duration",
      label: `Duration · ${duration.label}`,
      amount: durationDelta,
      note: `×${duration.factor}`,
    });
  }

  const peopleDelta = combined - durationOnly;
  if (peopleDelta !== 0) {
    lines.push({
      id: "people",
      label: `People · ${band.label}`,
      amount: peopleDelta,
      note: `×${band.factor}`,
    });
  }

  const edits = Number.isFinite(input.edits) ? Math.max(0, Math.round(input.edits)) : 0;
  const extraEdits = Math.max(0, edits - includedEdits);
  if (extraEdits > 0) {
    lines.push({
      id: "edits",
      label: `Extra edits · ${extraEdits} × ${config.editRate.toLocaleString("en-US")}`,
      amount: extraEdits * config.editRate,
    });
  }

  const addOns = config.addOns.filter((a) => input.addOnIds.includes(a.id));
  for (const addOn of addOns) {
    lines.push({ id: `addon-${addOn.id}`, label: addOn.label, amount: addOn.price });
  }

  if (location.fee > 0) {
    lines.push({
      id: "location",
      label: `Travel · ${location.label}`,
      amount: location.fee,
      note: "Location fee",
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const rushAmount = input.rush ? Math.round(subtotal * config.rushMultiplier) - subtotal : 0;
  const total = subtotal + rushAmount;
  const deposit = Math.round(total * config.depositPercent);

  return {
    lines,
    subtotal,
    rush: Boolean(input.rush),
    rushAmount,
    total,
    deposit,
    duration,
    band,
    location,
    addOns,
    includedEdits,
    extraEdits,
  };
}

/** Selected edits are always one of the catalogue options. */
export function normaliseEdits(edits: number, config: PricingConfig): number {
  const options = config.editOptions.length ? config.editOptions : [config.includedEdits];
  if (options.includes(edits)) return edits;
  return options.reduce((best, option) => (Math.abs(option - edits) < Math.abs(best - edits) ? option : best), options[0]);
}

export function formatDurationLabel(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

/** Total session length for a chosen duration option. */
export function totalMinutes(sessionMinutes: number, duration: DurationOption): number {
  return Math.max(0, sessionMinutes + Math.max(0, duration.addMinutes));
}
