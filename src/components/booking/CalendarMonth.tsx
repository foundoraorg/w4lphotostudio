import { useMemo, useState } from "react";
import type { Availability } from "../../lib/api";
import { SLOTS } from "../../lib/config";
import { formatMonth, fromISODate, monthMatrix, toISODate } from "../../lib/format";
import { ArrowLeft, ArrowRight } from "../Icons";

interface CalendarProps {
  value: string | null;
  onChange: (iso: string) => void;
  availability: Availability;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function CalendarMonth({ value, onChange, availability }: CalendarProps) {
  const initial = value ? fromISODate(value) : new Date();
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const today = useMemo(() => toISODate(new Date()), []);
  const horizon = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 180);
    return toISODate(date);
  }, []);

  const cells = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const bookedSlots = useMemo(() => {
    const map = new Set<string>();
    availability.booked.forEach((entry) => map.add(`${entry.date}|${entry.slot}`));
    return map;
  }, [availability.booked]);
  const blockedAll = useMemo(
    () => new Set(availability.blocked.filter((entry) => entry.slot === null).map((entry) => entry.date)),
    [availability.blocked],
  );
  const blockedSlots = useMemo(() => {
    const map = new Set<string>();
    availability.blocked.forEach((entry) => {
      if (entry.slot) map.add(`${entry.date}|${entry.slot}`);
    });
    return map;
  }, [availability.blocked]);

  const slotState = (iso: string, slot: string) => {
    const key = `${iso}|${slot}`;
    if (blockedAll.has(iso) || blockedSlots.has(key)) return "blocked";
    if (bookedSlots.has(key)) return "booked";
    return "open";
  };

  const freeCount = (iso: string) => SLOTS.filter((slot) => slotState(iso, slot) === "open").length;

  const shift = (delta: number) => {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const canGoBack = cursor.year > new Date().getFullYear() || (cursor.year === new Date().getFullYear() && cursor.month > new Date().getMonth());

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="flex h-11 w-11 items-center justify-center border border-line bg-page disabled:opacity-30"
        >
          <ArrowLeft size={15} />
        </button>
        <p className="font-display text-[15px] uppercase tracking-[0.08em]" aria-live="polite">
          {formatMonth(cursor.year, cursor.month)}
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="flex h-11 w-11 items-center justify-center border border-line bg-page"
        >
          <ArrowRight size={15} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1" aria-hidden="true">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`} className="pb-1 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Choose a date">
        {cells.map((iso, index) => {
          if (!iso) return <span key={`empty-${index}`} aria-hidden="true" />;
          const free = freeCount(iso);
          const past = iso < today;
          const beyond = iso > horizon;
          const closed = free === 0;
          const disabled = past || beyond || closed;
          const selected = value === iso;
          const date = fromISODate(iso);
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${
                closed ? ", fully booked" : `, ${free} slots open`
              }`}
              onClick={() => onChange(iso)}
              className={`relative flex h-10 items-center justify-center border font-mono text-[12px] transition-colors ${
                selected
                  ? "border-ink bg-accent text-ink"
                  : disabled
                    ? "border-transparent text-ink/25"
                    : "border-transparent text-ink hover:border-ink/40 hover:bg-page"
              }`}
            >
              {date.getDate()}
              {!disabled && !selected && (
                <span aria-hidden="true" className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
              )}
              {disabled && !past && (
                <span aria-hidden="true" className="absolute inset-x-2 bottom-1 h-px bg-ink/20" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function slotAvailability(availability: Availability, date: string, slot: string) {
  const blocked = availability.blocked.some(
    (entry) => entry.date === date && (entry.slot === null || entry.slot === slot),
  );
  if (blocked) return "blocked";
  const booked = availability.booked.some((entry) => entry.date === date && entry.slot === slot);
  return booked ? "booked" : "open";
}
