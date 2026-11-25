import { Link } from "react-router-dom";
import type { Session } from "../lib/config";
import { useCurrency } from "../lib/currency";
import { formatDurationLabel } from "../lib/pricing";
import { PrintImage } from "./ui/PrintImage";

export function SessionCard({ session, priority = false }: { session: Session; priority?: boolean }) {
  const { fmt } = useCurrency();
  return (
    <Link to={`/sessions/${session.slug}`} className="group flex h-full flex-col">
      <div className="relative overflow-hidden bg-drawer">
        <PrintImage
          session={session}
          alt={`${session.title} — ${session.category} photography session`}
          className="aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-[1.03]"
          sizes={priority ? "(min-width: 1024px) 33vw, 50vw" : "(min-width: 768px) 33vw, 50vw"}
        />
        <span className="absolute bottom-3 left-3 hidden items-center gap-1 border border-ink bg-accent px-2.5 py-1.5 font-display text-[11px] uppercase tracking-[0.12em] text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
          Book
        </span>
        <span className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.14em] text-wall mix-blend-difference">
          {session.category}
        </span>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[15px] uppercase leading-tight tracking-[0.02em] sm:text-[17px]">
            {session.title}
          </h3>
          <p className="shrink-0 font-mono text-[11px] text-bronze">From {fmt(session.base_price_kes)}</p>
        </div>
        <p className="micro mt-1.5">{formatDurationLabel(session.base_duration_min)} · {session.included_edits} edits included</p>
      </div>
    </Link>
  );
}
