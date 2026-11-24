import { useEffect, useRef, useState } from "react";
import type { Estimate } from "../../lib/pricing";
import { useAnimatedNumber } from "../../lib/hooks";
import { useCurrency } from "../../lib/currency";

export function EstimateLines({ estimate, compact = false }: { estimate: Estimate; compact?: boolean }) {
  const { fmt } = useCurrency();
  const animatedTotal = useAnimatedNumber(estimate.total, 400);
  const prevRef = useRef(new Map<string, number>());
  const [flash, setFlash] = useState<string[]>([]);

  useEffect(() => {
    const previous = prevRef.current;
    const changed = estimate.lines
      .filter((line) => previous.has(line.id) && previous.get(line.id) !== line.amount)
      .map((line) => line.id);
    if (estimate.rush) changed.push("total");
    prevRef.current = new Map(estimate.lines.map((line) => [line.id, line.amount]));
    if (!changed.length) return;
    setFlash(changed);
    const timer = window.setTimeout(() => setFlash([]), 600);
    return () => window.clearTimeout(timer);
  }, [estimate]);

  return (
    <div className="w-full">
      <ul className={`divide-y divide-ink/10 ${compact ? "text-[12px]" : "text-[13px]"}`}>
        {estimate.lines.map((line) => (
          <li
            key={line.id}
            data-flash={flash.includes(line.id)}
            className={`flex items-baseline justify-between gap-3 py-2 font-mono tabular-nums transition-colors duration-300 ${
              flash.includes(line.id) ? "bg-accent px-1" : ""
            }`}
          >
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span>{line.label}</span>
              {line.note && <span className="text-[10px] uppercase tracking-[0.1em] text-muted">{line.note}</span>}
            </span>
            <span className="shrink-0">{fmt(line.amount)}</span>
          </li>
        ))}
        {estimate.rush && (
          <>
            <li className="flex items-baseline justify-between gap-3 py-2 font-mono">
              <span>Subtotal</span>
              <span>{fmt(estimate.subtotal)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-3 py-2 font-mono">
              <span>Rush delivery · 48 h</span>
              <span>+{fmt(estimate.rushAmount)}</span>
            </li>
          </>
        )}
      </ul>

      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-ink pt-3">
        <span className="font-display text-[12px] uppercase tracking-[0.14em]">Total</span>
        <span
          className="font-mono text-[20px] tabular-nums sm:text-[22px]"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Total ${fmt(estimate.total)}`}
        >
          {fmt(animatedTotal)}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="micro">Deposit due today · 30%</span>
        <span className="font-mono text-[12px] tabular-nums text-bronze">{fmt(estimate.deposit)}</span>
      </div>
    </div>
  );
}

export function EstimateNote() {
  return <p className="mt-3 font-serif text-[12px] leading-snug text-muted">Final quote confirmed after we review your brief.</p>;
}
