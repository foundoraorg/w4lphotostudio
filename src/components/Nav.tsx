import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NAV_LINKS } from "../lib/config";
import { useScrollProgress } from "../lib/hooks";
import { useSaved } from "../lib/saved";
import { useBooking } from "./booking/BookingContext";
import { CurrencyPill } from "./CurrencyPill";
import { Calendar, Heart, Search } from "./Icons";
import { Lockup } from "./Lockup";
import { SavedPanel } from "./SavedPanel";
import { SearchOverlay } from "./SearchOverlay";

export function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { items, open } = useBooking();
  const { estimates, sessions: savedSlugs } = useSaved();
  const progress = useScrollProgress();
  const [searchOpen, setSearchOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  const savedCount = estimates.length + savedSlugs.length;
  const bookNow = () => {
    if (items.length > 0) open("items");
    else navigate("/sessions");
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:font-mono focus:text-[12px] focus:uppercase focus:text-wall"
      >
        Skip to content
      </a>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-wall/95 backdrop-blur-sm">
        <div className="wrap flex h-16 items-center justify-between gap-3 lg:h-[72px]">
          <Lockup size="sm" className="min-[420px]:hidden" />
          <Lockup className="hidden min-[420px]:flex lg:hidden" />
          <Lockup className="hidden lg:flex" />

          <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.to === "/index"
                  ? pathname === "/" || pathname === "/index"
                  : pathname === link.to || pathname.startsWith(`${link.to}/`);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative py-2 font-serif text-[15px] transition-colors ${
                    isActive ? "text-ink" : "text-ink/70 hover:text-ink"
                  }`}
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-px origin-left bg-ink transition-transform duration-300 ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 w-10 items-center justify-center text-ink hover:text-bronze lg:flex"
              aria-label="Search sessions"
            >
              <Search size={18} />
            </button>

            <div className="hidden lg:block">
              <CurrencyPill />
            </div>

            <button
              type="button"
              onClick={() => setSavedOpen(true)}
              className="relative hidden h-10 w-10 items-center justify-center text-ink hover:text-bronze lg:flex"
              aria-label={`Saved items${savedCount ? `, ${savedCount} saved` : ""}`}
            >
              <Heart size={18} />
              {savedCount > 0 && (
                <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] text-ink">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => open("items")}
              className="relative flex h-11 w-11 items-center justify-center text-ink hover:text-bronze"
              aria-label={`My bookings${items.length ? `, ${items.length} in progress` : ""}`}
            >
              <Calendar size={20} />
              {items.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 font-mono text-[10px] text-wall">
                  {items.length}
                </span>
              )}
            </button>

            <button type="button" onClick={bookNow} className="btn btn-lime px-4 text-[11px] sm:text-[12px]">
              <span className="hidden sm:inline">BOOK NOW</span>
              <span className="sm:hidden">BOOK</span>
            </button>
          </div>
        </div>
        <div className="progress-bar" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      </header>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      {savedOpen && <SavedPanel onClose={() => setSavedOpen(false)} />}
    </>
  );
}
