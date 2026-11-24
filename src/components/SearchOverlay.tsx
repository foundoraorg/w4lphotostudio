import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalogue } from "../lib/catalogue";
import { useCurrency } from "../lib/currency";
import { ArrowRight, Close, Search } from "./Icons";

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const { sessions } = useCatalogue();
  const { fmt } = useCurrency();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const needle = query.trim().toLowerCase();
  const results = needle
    ? sessions.filter((session) =>
        `${session.title} ${session.category} ${session.description}`.toLowerCase().includes(needle),
      )
    : sessions.slice(0, 5);

  const go = (slug: string) => {
    onClose();
    navigate(`/sessions/${slug}`);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-wall" role="dialog" aria-modal="true" aria-label="Search sessions">
      <div className="wrap pt-6 sm:pt-10">
        <div className="flex items-center justify-between">
          <span className="kicker">Search the studio</span>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center" aria-label="Close search">
            <Close />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 border-b border-ink pb-3">
          <Search size={22} className="shrink-0 text-bronze" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Portraits, headshots, brand day…"
            className="w-full bg-transparent font-serif text-[22px] text-ink outline-none placeholder:text-muted sm:text-[30px]"
            aria-label="Search sessions"
          />
        </div>

        <ul className="mt-8 divide-y divide-line border-t border-line">
          {results.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                onClick={() => go(session.slug)}
                className="group flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-display text-[18px] uppercase tracking-wide">{session.title}</span>
                  <span className="micro">
                    {session.category} · From {fmt(session.base_price_kes)}
                  </span>
                </span>
                <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" />
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="py-10">
              <p className="font-serif text-[17px]">Nothing matches “{query}”. Try “portrait”, “family” or “brand”.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
