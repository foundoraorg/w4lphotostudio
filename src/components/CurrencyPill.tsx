import { useCurrency } from "../lib/currency";

export function CurrencyPill({ dark = false }: { dark?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const base = dark ? "border-wall/30 text-wall" : "border-line text-ink";
  const active = "bg-accent text-ink";
  return (
    <div
      role="group"
      aria-label="Display currency"
      className={`inline-flex items-center border font-mono text-[11px] uppercase tracking-[0.12em] ${base}`}
    >
      {(["KES", "USD"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          aria-pressed={currency === code}
          className={`flex min-h-[28px] items-center px-2.5 py-1 transition-colors ${currency === code ? active : "hover:opacity-70"}`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
