import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useBooking } from "./booking/BookingContext";
import { useCatalogue } from "../lib/catalogue";
import { useCurrency } from "../lib/currency";
import { useSaved } from "../lib/saved";
import { ArrowRight, Close, HeartFilled, Trash } from "./Icons";

export function SavedPanel({ onClose }: { onClose: () => void }) {
  const { estimates, removeEstimate, sessions: savedSlugs } = useSaved();
  const { sessionBySlug } = useCatalogue();
  const { addItem, open } = useBooking();
  const { fmt } = useCurrency();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const book = (slug: string) => {
    const session = sessionBySlug(slug);
    const saved = estimates.find((e) => e.slug === slug);
    if (!session || !saved) return;
    addItem({
      sessionId: session.id,
      title: session.title,
      slug: session.slug,
      selections: saved.selections,
      estimateKes: saved.estimateKes,
      depositKes: saved.depositKes,
    });
    onClose();
    open("details");
  };

  return (
    <div className="fixed inset-0 z-[75]">
      <button type="button" className="drawer-scrim absolute inset-0 bg-night/40" onClick={onClose} aria-label="Close saved items" />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-drawer shadow-[-20px_0_60px_rgba(16,19,24,0.2)]"
        role="dialog"
        aria-modal="true"
        aria-label="Saved estimates"
      >
        <div className="flex items-center justify-between border-b border-ink/15 px-5 py-4">
          <div className="flex items-center gap-2">
            <HeartFilled size={16} className="text-bronze" />
            <h2 className="font-display text-[18px] uppercase tracking-wide">Saved</h2>
            <span className="micro">({estimates.length})</span>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center" aria-label="Close saved panel">
            <Close />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {estimates.length === 0 && savedSlugs.length === 0 && (
            <div className="py-10">
              <p className="font-serif text-[17px] leading-relaxed">
                Nothing saved yet. Build an estimate on any session page and press <span className="font-mono text-[12px] uppercase">Save estimate</span> to keep it here.
              </p>
            </div>
          )}

          {estimates.length > 0 && (
            <section aria-labelledby="saved-estimates">
              <h3 id="saved-estimates" className="kicker mb-3">
                Estimates
              </h3>
              <ul className="space-y-3">
                {estimates.map((estimate) => (
                  <li key={estimate.id} className="border border-ink/15 bg-page p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={`/sessions/${estimate.slug}`} onClick={onClose} className="font-display text-[16px] uppercase tracking-wide hover:text-bronze">
                          {estimate.title}
                        </Link>
                        <p className="micro mt-1">
                          {estimate.selections.durationLabel} · {estimate.selections.people}{" "}
                          {estimate.selections.people === 1 ? "person" : "people"} · {estimate.selections.edits} edits
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEstimate(estimate.id)}
                        className="p-2 text-muted hover:text-ink"
                        aria-label={`Remove saved ${estimate.title} estimate`}
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="font-mono text-[15px]">{fmt(estimate.estimateKes)}</p>
                        <p className="micro">Deposit {fmt(estimate.depositKes)}</p>
                      </div>
                      <button type="button" className="btn btn-dark min-h-[40px] px-3 text-[11px]" onClick={() => book(estimate.slug)}>
                        Book <ArrowRight size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {savedSlugs.length > 0 && (
            <section className="mt-8" aria-labelledby="saved-sessions">
              <h3 id="saved-sessions" className="kicker mb-3">
                Sessions you kept
              </h3>
              <ul className="divide-y divide-ink/10 border-y border-ink/10">
                {savedSlugs.map((slug) => {
                  const session = sessionBySlug(slug);
                  if (!session) return null;
                  return (
                    <li key={slug}>
                      <Link to={`/sessions/${slug}`} onClick={onClose} className="flex items-center justify-between py-3 text-[16px]">
                        <span>{session.title}</span>
                        <ArrowRight size={15} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
