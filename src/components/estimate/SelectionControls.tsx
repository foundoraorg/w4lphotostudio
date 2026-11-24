import type { PricingConfig, Session } from "../../lib/config";
import { useCurrency } from "../../lib/currency";
import { formatDurationLabel } from "../../lib/pricing";
import { PEOPLE_CHOICES, type Selection } from "../../lib/selection";
import { Check, Minus, Plus } from "../Icons";

interface ControlProps {
  session: Session;
  config: PricingConfig;
  selection: Selection;
  onChange: (patch: Partial<Selection>) => void;
}

function GroupLabel({ label, hint, id }: { label: string; hint?: string; id?: string }) {
  return (
    <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
      <span id={id} className="font-mono text-[11px] uppercase tracking-[0.16em]">
        {label}
      </span>
      {hint && <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{hint}</span>}
    </div>
  );
}

export function DurationChips({ session, config, selection, onChange }: ControlProps) {
  return (
    <fieldset>
      <legend className="sr-only">Duration</legend>
      <GroupLabel label="Duration" hint="Add time to the base session" />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Duration">
        {config.durationOptions.map((option) => {
          const minutes = session.base_duration_min + option.addMinutes;
          return (
            <button
              key={option.id}
              type="button"
              className="chip min-h-[44px] flex-col gap-0.5 !px-3 !py-2 sm:min-h-[48px]"
              aria-pressed={selection.durationId === option.id}
              onClick={() => onChange({ durationId: option.id })}
            >
              <span>{formatDurationLabel(minutes)}</span>
              <span className="text-[9px] tracking-[0.08em] opacity-70">
                {option.addMinutes === 0 ? "base" : `+${formatDurationLabel(option.addMinutes)}`} · ×{option.factor}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PeopleChips({ config, selection, onChange }: ControlProps) {
  return (
    <fieldset>
      <legend className="sr-only">People</legend>
      <GroupLabel label="People" hint="Who is being photographed" />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Number of people">
        {PEOPLE_CHOICES.map((choice) => {
          const band = config.peopleBands.find((b) => choice.value >= b.min && choice.value <= b.max);
          const active = selection.people === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              className="chip min-h-[44px] flex-col gap-0.5 !px-3 !py-2"
              aria-pressed={active}
              onClick={() => onChange({ people: choice.value })}
            >
              <span>{choice.label}</span>
              <span className="text-[9px] tracking-[0.08em] opacity-70">×{band?.factor ?? 1}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function LocationChips({ config, selection, onChange }: ControlProps) {
  const { fmt } = useCurrency();
  const current = config.locations.find((location) => location.id === selection.locationId);
  return (
    <fieldset>
      <legend className="sr-only">Location</legend>
      <GroupLabel label="Location" hint={current?.fee ? "Travel included below" : "No travel fee"} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Location">
        {config.locations.map((location) => (
          <button
            key={location.id}
            type="button"
            className="chip min-h-[44px]"
            aria-pressed={selection.locationId === location.id}
            onClick={() => onChange({ locationId: location.id })}
          >
            {location.label}
          </button>
        ))}
      </div>
      {current && current.fee > 0 && (
        <p className="mt-2 font-mono text-[11px] text-bronze" aria-live="polite">
          Travel fee to {current.label}: +{fmt(current.fee)}
        </p>
      )}
    </fieldset>
  );
}

export function EditsChips({ session, config, selection, onChange }: ControlProps) {
  const { fmt } = useCurrency();
  const included = session.included_edits || config.includedEdits;
  return (
    <fieldset>
      <legend className="sr-only">Edited photographs</legend>
      <GroupLabel label="Edited photos" hint={`${included} included · ${fmt(config.editRate)} per extra`} />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Edited photographs">
        {config.editOptions.map((option) => {
          const extra = Math.max(0, option - included);
          return (
            <button
              key={option}
              type="button"
              className="chip min-h-[44px] flex-col gap-0.5 !px-3 !py-2"
              aria-pressed={selection.edits === option}
              onClick={() => onChange({ edits: option })}
            >
              <span>{option}</span>
              <span className="text-[9px] tracking-[0.08em] opacity-70">
                {extra > 0 ? `+${fmt(extra * config.editRate)}` : "included"}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function AddOnList({ config, selection, onChange }: ControlProps) {
  const { fmt } = useCurrency();
  const toggle = (id: string) => {
    const next = selection.addOnIds.includes(id)
      ? selection.addOnIds.filter((item) => item !== id)
      : [...selection.addOnIds, id];
    onChange({ addOnIds: next });
  };

  return (
    <fieldset>
      <legend className="sr-only">Add-ons</legend>
      <GroupLabel label="Add-ons" hint="Select any" />
      <div className="flex flex-col gap-2">
        {config.addOns.map((addOn) => {
          const active = selection.addOnIds.includes(addOn.id);
          return (
            <button
              key={addOn.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggle(addOn.id)}
              className={`flex min-h-[52px] items-center justify-between gap-4 border px-3 py-2.5 text-left transition-colors ${
                active ? "border-ink bg-accent/25" : "border-line bg-page hover:border-ink/60"
              }`}
            >
              <span className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                    active ? "border-ink bg-ink text-accent" : "border-ink/40"
                  }`}
                >
                  {active && <Check size={11} />}
                </span>
                <span>
                  <span className="block font-serif text-[15px] leading-snug">{addOn.label}</span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{addOn.blurb}</span>
                </span>
              </span>
              <span className="shrink-0 font-mono text-[12px]">+{fmt(addOn.price)}</span>
            </button>
          );
        })}
        <button
          type="button"
          role="checkbox"
          aria-checked={selection.rush}
          onClick={() => onChange({ rush: !selection.rush })}
          className={`flex min-h-[52px] items-center justify-between gap-4 border px-3 py-2.5 text-left transition-colors ${
            selection.rush ? "border-ink bg-accent/25" : "border-line bg-page hover:border-ink/60"
          }`}
        >
          <span className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                selection.rush ? "border-ink bg-ink text-accent" : "border-ink/40"
              }`}
            >
              {selection.rush && <Check size={11} />}
            </span>
            <span>
              <span className="block font-serif text-[15px] leading-snug">{config.rush.label}</span>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                {config.rush.blurb}
              </span>
            </span>
          </span>
          <span className="shrink-0 font-mono text-[12px]">×{config.rushMultiplier}</span>
        </button>
      </div>
    </fieldset>
  );
}

export function PeopleStepper({ selection, onChange, config }: ControlProps) {
  const band = config.peopleBands.find((b) => selection.people >= b.min && selection.people <= b.max);
  const set = (next: number) => onChange({ people: Math.min(30, Math.max(1, next)) });
  return (
    <div>
      <GroupLabel label="People" hint={`${band?.label ?? ""} · ×${band?.factor ?? 1}`} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set(selection.people - 1)}
          disabled={selection.people <= 1}
          className="flex h-11 w-11 items-center justify-center border border-ink/30 disabled:opacity-30"
          aria-label="One fewer person"
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          min={1}
          max={30}
          value={selection.people}
          onChange={(event) => set(Number(event.target.value) || 1)}
          className="h-11 w-16 border border-line bg-page text-center font-mono text-[15px]"
          aria-label="Number of people"
        />
        <button
          type="button"
          onClick={() => set(selection.people + 1)}
          disabled={selection.people >= 30}
          className="flex h-11 w-11 items-center justify-center border border-ink/30 disabled:opacity-30"
          aria-label="One more person"
        >
          <Plus size={16} />
        </button>
        <span className="font-mono text-[11px] text-muted">×{band?.factor ?? 1} multiplier</span>
      </div>
    </div>
  );
}
