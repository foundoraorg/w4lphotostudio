import type { BookingSelections, PricingConfig, Session } from "./config";
import { calcEstimate, getDuration, getLocation, type Estimate } from "./pricing";

export interface Selection {
  durationId: string;
  people: number;
  edits: number;
  addOnIds: string[];
  locationId: string;
  rush: boolean;
}

export function defaultSelection(session: Session, config: PricingConfig): Selection {
  return {
    durationId: "base",
    people: 1,
    edits: session.included_edits || config.includedEdits,
    addOnIds: [],
    locationId: "studio",
    rush: false,
  };
}

export function estimateFor(session: Session, selection: Selection, config: PricingConfig): Estimate {
  return calcEstimate(
    {
      basePrice: session.base_price_kes,
      includedEdits: session.included_edits,
      durationId: selection.durationId,
      people: selection.people,
      edits: selection.edits,
      addOnIds: selection.addOnIds,
      locationId: selection.locationId,
      rush: selection.rush,
    },
    config,
  );
}

export function toBookingSelections(
  session: Session,
  selection: Selection,
  config: PricingConfig,
): BookingSelections {
  return {
    sessionTitle: session.title,
    sessionSlug: session.slug,
    durationId: selection.durationId,
    durationLabel: getDuration(selection.durationId, config).label,
    people: selection.people,
    edits: selection.edits,
    addOnIds: [...selection.addOnIds],
    locationId: selection.locationId,
    locationLabel: getLocation(selection.locationId, config).label,
    rush: selection.rush,
  };
}

/** Representative head-counts for the people chips. */
export const PEOPLE_CHOICES = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3-5", value: 4 },
  { label: "6-10", value: 8 },
  { label: "10+", value: 12 },
];
