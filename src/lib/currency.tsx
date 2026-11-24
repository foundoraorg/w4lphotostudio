import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCatalogue } from "./catalogue";
import { money, type Currency } from "./format";

interface CurrencyValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggle: () => void;
  rate: number;
  fmt: (kes: number) => string;
  label: (kes: number) => string;
}

const CurrencyContext = createContext<CurrencyValue | null>(null);
const STORAGE_KEY = "w4l.currency";

function readCurrency(): Currency {
  try {
    return localStorage.getItem(STORAGE_KEY) === "USD" ? "USD" : "KES";
  } catch {
    return "KES";
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data } = useCatalogue();
  const rate = data.pricingConfig.usdRate || 129;
  const [currency, setCurrencyState] = useState<Currency>(readCurrency);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      /* private mode */
    }
  }, [currency]);

  const setCurrency = useCallback((next: Currency) => setCurrencyState(next), []);
  const toggle = useCallback(() => setCurrencyState((c) => (c === "KES" ? "USD" : "KES")), []);
  const fmt = useCallback((kes: number) => money(kes, currency, rate), [currency, rate]);
  const label = useCallback(
    (kes: number) => (currency === "USD" ? `${fmt(kes)} USD` : fmt(kes)),
    [currency, fmt],
  );

  const value = useMemo<CurrencyValue>(
    () => ({ currency, setCurrency, toggle, rate, fmt, label }),
    [currency, setCurrency, toggle, rate, fmt, label],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyValue {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider");
  return context;
}
