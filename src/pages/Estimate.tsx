import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Check } from "../components/Icons";
import { useBooking } from "../components/booking/BookingContext";
import { EstimateLines, EstimateNote } from "../components/estimate/EstimateLines";
import { AddOnList, EditsChips, LocationChips, PeopleStepper } from "../components/estimate/SelectionControls";
import { PrintImage } from "../components/ui/PrintImage";
import { useCatalogue } from "../lib/catalogue";
import { useCurrency } from "../lib/currency";
import { formatDurationLabel, totalMinutes } from "../lib/pricing";
import { defaultSelection, estimateFor, toBookingSelections, type Selection } from "../lib/selection";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function Estimate() {
  const { sessions, data, loading } = useCatalogue();
  const config = data.pricingConfig;
  const [params, setParams] = useSearchParams();
  const requested = params.get("session");
  const active = sessions.find((session) => session.slug === requested) ?? sessions[0];
  const [selection, setSelection] = useState<Selection | null>(() => (active ? defaultSelection(active, config) : null));
  useDocumentTitle(
    "Estimate — W4L Studios",
    "Build a live photography estimate: session, duration, people, location, edits and add-ons, with the 30% deposit shown up front.",
  );

  useEffect(() => {
    if (active) setSelection(defaultSelection(active, config));
    // Reset only when the chosen session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  if (!active || !selection) {
    return (
      <div className="wrap py-16">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton mt-4 h-40 w-full" />
        {loading && <p className="micro mt-4">Loading the estimator…</p>}
      </div>
    );
  }

  const estimate = estimateFor(active, selection, config);
  const update = (patch: Partial<Selection>) => setSelection((current) => (current ? { ...current, ...patch } : current));
  const minutes = totalMinutes(active.base_duration_min, estimate.duration);

  return (
    <div className="bg-wall pb-28 lg:pb-0">
      <section className="wrap pb-8 pt-10 md:pt-14">
        <p className="kicker">The estimator</p>
        <h1 className="page-title mt-3">Price it your way.</h1>
        <p className="mt-5 max-w-2xl font-serif text-[17px] leading-relaxed text-ink/75">
          Choose the session, stretch the time, add people and extras. The total updates as you go and nothing is charged
          here — the 30% deposit comes at booking, after you pick a date.
        </p>
      </section>

      <div className="wrap grid gap-8 pb-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-14 lg:pb-24">
        <div>
          <label htmlFor="session-type" className="label">
            Session type
          </label>
          <select
            id="session-type"
            value={active.slug}
            onChange={(event) => setParams({ session: event.target.value }, { replace: true })}
            className="field appearance-none font-display uppercase tracking-[0.04em]"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.slug}>
                {session.title} · {session.category}
              </option>
            ))}
          </select>
          <Link
            to={`/sessions/${active.slug}`}
            className="mt-2 inline-flex font-mono text-[10px] uppercase tracking-[0.12em] text-bronze hover:text-ink"
          >
            Read the {active.title} session →
          </Link>

          <div className="mt-6 flex items-start gap-4 border border-line bg-page p-3">
            <PrintImage crop={active.image_crop} alt={`${active.title} session`} className="h-24 w-20 shrink-0" />
            <div className="min-w-0 py-1">
              <p className="font-display text-[15px] uppercase tracking-[0.03em]">{active.title}</p>
              <p className="micro mt-1">
                {active.category} · From <EstimatePrice value={active.base_price_kes} />
              </p>
              <p className="mt-2 font-serif text-[13px] leading-snug text-ink/70">
                {formatDurationLabel(minutes)} · {selection.edits} edited photos
              </p>
            </div>
          </div>

          <fieldset className="mt-8">
            <legend className="sr-only">Duration</legend>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em]">Duration</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                {formatDurationLabel(minutes)} · ×{estimate.duration.factor}
              </span>
            </div>
            <input
              type="range"
              className="range w-full"
              min={0}
              max={config.durationOptions.length - 1}
              step={1}
              value={config.durationOptions.findIndex((option) => option.id === selection.durationId)}
              onChange={(event) => update({ durationId: config.durationOptions[Number(event.target.value)].id })}
              aria-label="Session duration"
              aria-valuetext={`${estimate.duration.label}, ${formatDurationLabel(minutes)}`}
            />
            <div className="mt-2 flex justify-between gap-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
              {config.durationOptions.map((option) => (
                <span key={option.id}>{option.label.replace("Base duration", "Base")}</span>
              ))}
            </div>
          </fieldset>

          <div className="mt-8">
            <PeopleStepper session={active} config={config} selection={selection} onChange={update} />
          </div>

          <div className="mt-8">
            <LocationChips session={active} config={config} selection={selection} onChange={update} />
          </div>

          <div className="mt-8">
            <EditsChips session={active} config={config} selection={selection} onChange={update} />
          </div>

          <div className="mt-8">
            <AddOnList session={active} config={config} selection={selection} onChange={update} />
          </div>

          <div className="mt-6 hidden flex-wrap gap-4 lg:flex">
            {["No card needed to estimate", "30% deposit at booking", "Free reschedule up to 72 h"].map((line) => (
              <p key={line} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                <Check size={12} className="text-bronze" /> {line}
              </p>
            ))}
          </div>

          <div className="mt-8 border border-ink/20 bg-page p-5 lg:hidden">
            <p className="kicker">Your estimate</p>
            <div className="mt-3">
              <EstimateLines estimate={estimate} />
            </div>
            <EstimateNote />
            <BookButton session={active} selection={selection} total={estimate.total} deposit={estimate.deposit} className="mt-4 w-full" />
          </div>
        </div>

        <div className="hidden lg:sticky lg:top-[92px] lg:block">
          <TotalCard session={active} selection={selection} total={estimate.total} deposit={estimate.deposit} estimate={estimate} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-between gap-3 border-t border-ink/25 bg-page px-4 lg:hidden">
        <div>
          <p className="font-mono text-[15px] leading-none">
            <EstimatePrice value={estimate.total} />
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
            Deposit <EstimatePrice value={estimate.deposit} />
          </p>
        </div>
        <BookButton session={active} selection={selection} total={estimate.total} deposit={estimate.deposit} short />
      </div>
    </div>
  );
}

function EstimatePrice({ value }: { value: number }) {
  const { fmt } = useCurrency();
  return <>{fmt(value)}</>;
}

function useBook() {
  const { addItem, open } = useBooking();
  const config = useCatalogueConfig();
  return (session: Parameters<typeof toBookingSelections>[0], selection: Selection, total: number, deposit: number) => {
    addItem({
      sessionId: session.id,
      title: session.title,
      slug: session.slug,
      selections: toBookingSelections(session, selection, config),
      estimateKes: total,
      depositKes: deposit,
    });
    open("details");
  };
}

function useCatalogueConfig() {
  const { data } = useCatalogue();
  return data.pricingConfig;
}

function BookButton({
  session,
  selection,
  total,
  deposit,
  className = "",
  short = false,
}: {
  session: Parameters<typeof toBookingSelections>[0];
  selection: Selection;
  total: number;
  deposit: number;
  className?: string;
  short?: boolean;
}) {
  const book = useBook();
  return (
    <button type="button" onClick={() => book(session, selection, total, deposit)} className={`btn btn-lime min-h-[40px] ${className}`}>
      {short ? "Book" : "Book with this estimate"} <ArrowRight size={15} />
    </button>
  );
}

function TotalCard({
  session,
  selection,
  total,
  deposit,
  estimate,
}: {
  session: Parameters<typeof toBookingSelections>[0];
  selection: Selection;
  total: number;
  deposit: number;
  estimate: ReturnType<typeof estimateFor>;
}) {
  return (
    <div className="border border-ink/25 bg-page p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="kicker">Live total</p>
        <p className="micro">No card needed</p>
      </div>
      <div className="mt-4">
        <EstimateLines estimate={estimate} />
      </div>
      <EstimateNote />
      <BookButton session={session} selection={selection} total={total} deposit={deposit} className="mt-5 w-full" />
      <p className="mt-3 font-serif text-[12px] leading-snug text-muted">
        You choose a date and time next, and the slot is re-checked before the deposit is confirmed.
      </p>
    </div>
  );
}
