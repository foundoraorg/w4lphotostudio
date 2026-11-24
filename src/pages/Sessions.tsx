import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SessionCard } from "../components/SessionCard";
import { ArrowRight } from "../components/Icons";
import { Divider, Reveal } from "../components/ui/Reveal";
import { useCatalogue } from "../lib/catalogue";
import { FILTERS } from "../lib/config";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function Sessions() {
  const { sessions, loading } = useCatalogue();
  const [filter, setFilter] = useState<string>("All");
  useDocumentTitle(
    "Sessions & prices — W4L Studios",
    "Nine photography sessions in Watamu, from KES 6,000. Compare durations, inclusions and prices, then book a date online.",
  );

  const list = useMemo(
    () => (filter === "All" ? sessions : sessions.filter((session) => session.category === filter)),
    [filter, sessions],
  );

  return (
    <div className="bg-wall">
      <section className="wrap pb-10 pt-10 md:pb-14 md:pt-16">
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <p className="kicker">The catalogue · 2026</p>
            <Reveal as="h1" className="page-title mt-3 block">
              Sessions
            </Reveal>
            <Reveal as="p" variant="fade" delay={100} className="mt-5 block max-w-xl font-serif text-[17px] leading-relaxed text-ink/75">
              Nine ways to be photographed, priced from. Every session includes direction, studio time and ten hand-retouched
              photographs. Build the estimate, hold a date, pay 30% to confirm.
            </Reveal>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link to="/estimate" className="btn btn-lime">
              Quick estimate <ArrowRight size={15} />
            </Link>
            <Link to="/contact" className="btn">
              Ask a question
            </Link>
          </div>
        </div>

        <Divider className="mt-10" />

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter sessions by category">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
                className="chip min-h-[36px] shrink-0"
              >
                {option}
              </button>
            ))}
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted" aria-live="polite">
            {loading ? "Loading catalogue" : `${list.length} ${list.length === 1 ? "session" : "sessions"}`}
          </p>
        </div>
      </section>

      <section className="wrap pb-16 md:pb-24" aria-label="Session catalogue">
        {loading && sessions.length === 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <div className="skeleton aspect-[4/5] w-full" />
                <div className="skeleton mt-3 h-4 w-2/3" />
                <div className="skeleton mt-2 h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div key={filter} className="sessions-reflow grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-6 md:gap-y-12">
            {list.map((session, index) => (
              <SessionCard key={session.id} session={session} priority={index < 3} />
            ))}
          </div>
        )}

        {list.length === 0 && (
          <p className="py-12 font-serif text-[17px]">
            Nothing in that category yet. <button type="button" className="link-underline" onClick={() => setFilter("All")}>Show all sessions</button>.
          </p>
        )}
      </section>

      <section className="border-t border-line bg-page">
        <div className="wrap flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-16">
          <div>
            <p className="kicker">Not sure which one</p>
            <h2 className="mt-3 font-display text-[clamp(26px,3.4vw,42px)] uppercase leading-[0.95]">
              Price it in thirty seconds.
            </h2>
          </div>
          <Link to="/estimate" className="btn btn-lime">
            Build an estimate <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
