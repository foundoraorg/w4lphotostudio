import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Heart, HeartFilled } from "../components/Icons";
import { AddOnList, DurationChips, EditsChips, LocationChips, PeopleChips } from "../components/estimate/SelectionControls";
import { EstimateLines, EstimateNote } from "../components/estimate/EstimateLines";
import { useBooking } from "../components/booking/BookingContext";
import { Accordion } from "../components/ui/Accordion";
import { PrintImage } from "../components/ui/PrintImage";
import { useToast } from "../components/ui/Toast";
import { useFlyer } from "../components/gallery3d/FlyerContext";
import { useCatalogue } from "../lib/catalogue";
import {
  CANCELLATION_COPY,
  DELIVERY_COPY,
  WHAT_INCLUDED,
  WHAT_TO_WEAR,
  type PricingConfig,
  type Session,
} from "../lib/config";
import { useCurrency } from "../lib/currency";
import { formatDurationLabel } from "../lib/pricing";
import { useSaved } from "../lib/saved";
import { defaultSelection, estimateFor, toBookingSelections, type Selection } from "../lib/selection";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { NotFound } from "./NotFound";

export function SessionDetail() {
  const { slug } = useParams();
  const { sessionBySlug, loading } = useCatalogue();
  const session = slug ? sessionBySlug(slug) : undefined;

  if (!session) {
    if (loading) {
      return (
        <div className="wrap grid gap-10 py-12 lg:grid-cols-2">
          <div className="skeleton aspect-[4/5] w-full" />
          <div className="space-y-4 pt-6">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-12 w-3/4" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </div>
      );
    }
    return <NotFound />;
  }

  return <SessionView key={session.id} session={session} />;
}

function SessionView({ session }: { session: Session }) {
  const { data, sessions } = useCatalogue();
  const config: PricingConfig = data.pricingConfig;
  const { fmt } = useCurrency();
  const { addItem, open } = useBooking();
  const { saveEstimate, toggleSession, isSaved } = useSaved();
  const { arriving } = useFlyer();
  const fromFlyer = Boolean((useLocation().state as { flyer?: boolean } | null)?.flyer);
  const { toast } = useToast();
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(session, config));
  const saved = isSaved(session.slug);
  useDocumentTitle(
    `${session.title} — W4L Studios`,
    `${session.description} From KES ${session.base_price_kes.toLocaleString("en-US")}, booked online with a 30% deposit.`,
  );

  const estimate = useMemo(() => estimateFor(session, selection, config), [session, selection, config]);
  const update = (patch: Partial<Selection>) => setSelection((current) => ({ ...current, ...patch }));

  const book = () => {
    addItem({
      sessionId: session.id,
      title: session.title,
      slug: session.slug,
      selections: toBookingSelections(session, selection, config),
      estimateKes: estimate.total,
      depositKes: estimate.deposit,
    });
    open("details");
  };

  const save = () => {
    saveEstimate({
      slug: session.slug,
      title: session.title,
      selections: toBookingSelections(session, selection, config),
      estimateKes: estimate.total,
      depositKes: estimate.deposit,
    });
    toast("Estimate saved. Find it under the heart in the nav.", "success");
  };

  const keep = () => {
    const added = toggleSession(session.slug);
    toast(added ? "Saved to your sessions." : "Removed from your sessions.");
  };

  const others = sessions.filter((item) => item.id !== session.id).slice(0, 4);

  const estimator = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="kicker">Your estimate</p>
        <button
          type="button"
          onClick={keep}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink"
          aria-pressed={saved}
        >
          {saved ? <HeartFilled size={13} className="text-bronze" /> : <Heart size={13} />}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      <div className="mt-3">
        <EstimateLines estimate={estimate} compact />
      </div>
      <EstimateNote />
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={book} className="btn btn-lime w-full">
          Book this session <ArrowRight size={15} />
        </button>
        <button type="button" onClick={save} className="btn btn-ghost w-full">
          Save estimate
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-wall pb-24 lg:pb-0">
      <div className="wrap pt-5">
        <Link to="/sessions" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink">
          <ArrowLeft size={13} /> All sessions
        </Link>
      </div>

      <div className="wrap grid gap-8 pb-14 pt-5 lg:grid-cols-[46fr_54fr] lg:gap-14 lg:pb-24 lg:pt-6">
        <div className="lg:sticky lg:top-[88px] lg:self-start">
          <div
            className={`relative ${fromFlyer && arriving ? "opacity-0" : "page-fade"}`}
            data-flyer-target
          >
            <PrintImage
              crop={session.image_crop}
              alt={`${session.title} — ${session.category} photography by W4L Studios`}
              className="aspect-[4/5] w-full"
            />
            <span className="absolute bottom-3 left-3 bg-wall/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]">
              {session.category} · Watamu
            </span>
          </div>
          <div className="mt-4 hidden lg:block border border-ink/20 bg-page p-5">
            {estimator}
          </div>
        </div>

        <div className={fromFlyer && !arriving ? "details-fade" : ""}>
          <p className="kicker">{session.category}</p>
          <h1 className="mt-3 font-display text-[clamp(32px,4.4vw,60px)] uppercase leading-[0.94]">{session.title}</h1>
          <p className="mt-4 max-w-xl font-serif text-[17px] leading-relaxed text-ink/80">{session.description}</p>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-mono text-[15px] text-bronze">From {fmt(session.base_price_kes)}</span>
            <span className="micro">
              {formatDurationLabel(session.base_duration_min)} · {session.included_edits || config.includedEdits} edited photos included
            </span>
          </div>

          <div className="mt-8 space-y-7">
            <DurationChips session={session} config={config} selection={selection} onChange={update} />
            <PeopleChips session={session} config={config} selection={selection} onChange={update} />
            <LocationChips session={session} config={config} selection={selection} onChange={update} />
            <EditsChips session={session} config={config} selection={selection} onChange={update} />
            <AddOnList session={session} config={config} selection={selection} onChange={update} />
          </div>

          <div className="mt-8 border border-ink/20 bg-page p-5 lg:hidden">{estimator}</div>

          <div className="mt-10">
            <h2 className="micro mb-3">The practical parts</h2>
            <Accordion
              items={[
                {
                  id: "included",
                  title: "What's included",
                  content: (
                    <ul className="space-y-2">
                      {WHAT_INCLUDED.map((item) => (
                        <li key={item} className="flex gap-2">
                          <Check size={14} className="mt-1 shrink-0 text-bronze" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ),
                },
                { id: "delivery", title: "Delivery & turnaround", content: <p>{DELIVERY_COPY}</p> },
                { id: "cancellation", title: "Cancellation & rescheduling", content: <p>{CANCELLATION_COPY}</p> },
                {
                  id: "wear",
                  title: "What to wear",
                  content: <p>{WHAT_TO_WEAR}</p>,
                },
              ]}
            />
          </div>
        </div>
      </div>

      <section aria-labelledby="more-sessions" className="border-t border-line bg-page py-12">
        <div className="wrap">
          <div className="flex items-end justify-between gap-4">
            <h2 id="more-sessions" className="font-display text-[clamp(24px,3vw,36px)] uppercase leading-none">
              More sessions
            </h2>
            <Link to="/sessions" className="link-underline text-ink">
              See all <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 px-5 sm:grid-cols-4 sm:px-8 lg:px-12">
          {others.map((item) => (
            <Link key={item.id} to={`/sessions/${item.slug}`} className="group">
              <PrintImage
                crop={item.image_crop}
                alt={`${item.title} session`}
                className="aspect-[4/5] w-full transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <h3 className="mt-2 font-display text-[13px] uppercase tracking-[0.02em]">{item.title}</h3>
              <p className="micro mt-0.5">From {fmt(item.base_price_kes)}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-between gap-3 border-t border-ink/25 bg-page px-5 lg:hidden">
        <div>
          <p className="font-mono text-[15px] leading-none">{fmt(estimate.total)}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Deposit {fmt(estimate.deposit)}</p>
        </div>
        <button type="button" onClick={book} className="btn btn-lime min-h-[40px]">
          Book this session
        </button>
      </div>
    </div>
  );
}
