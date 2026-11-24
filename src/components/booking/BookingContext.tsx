import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BookingSelections } from "../../lib/config";

export type BookingStep = "items" | "details" | "confirmed";

export interface BookingItem {
  key: string;
  sessionId: string;
  title: string;
  slug: string;
  selections: BookingSelections;
  estimateKes: number;
  depositKes: number;
}

interface BookingValue {
  items: BookingItem[];
  isOpen: boolean;
  step: BookingStep;
  addItem: (item: Omit<BookingItem, "key">) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  open: (step?: BookingStep) => void;
  close: () => void;
  setStep: (step: BookingStep) => void;
  total: number;
  deposits: number;
}

const BookingContext = createContext<BookingValue | null>(null);
const ITEMS_KEY = "w4l.booking.items";

function readItems(): BookingItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    const parsed = raw ? (JSON.parse(raw) as BookingItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BookingItem[]>(readItems);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<BookingStep>("items");

  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    } catch {
      /* private mode */
    }
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const addItem = useCallback((item: Omit<BookingItem, "key">) => {
    setItems((current) => {
      const withoutSame = current.filter((existing) => existing.sessionId !== item.sessionId);
      return [...withoutSame, { ...item, key: crypto.randomUUID() }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const open = useCallback((nextStep: BookingStep = "items") => {
    setStep(nextStep);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setStep("items");
  }, []);

  const total = items.reduce((sum, item) => sum + item.estimateKes, 0);
  const deposits = items.reduce((sum, item) => sum + item.depositKes, 0);

  const value = useMemo<BookingValue>(
    () => ({ items, isOpen, step, addItem, removeItem, clear, open, close, setStep, total, deposits }),
    [items, isOpen, step, addItem, removeItem, clear, open, close, total, deposits],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingValue {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used inside BookingProvider");
  return context;
}
