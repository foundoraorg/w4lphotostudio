import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Close } from "../Icons";

type Tone = "default" | "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastValue {
  toast: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: Tone = "default") => {
      idRef.current += 1;
      const id = idRef.current;
      setItems((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[95] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-8 sm:right-8 sm:items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 border px-4 py-3 shadow-[0_18px_50px_rgba(16,19,24,0.18)] ${
              item.tone === "error" ? "border-ink bg-ink text-wall" : "border-ink bg-page text-ink"
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center ${
                item.tone === "error" ? "bg-bronze text-wall" : "bg-accent text-ink"
              }`}
            >
              {item.tone === "error" ? <Close size={12} /> : <Check size={12} />}
            </span>
            <p className="flex-1 font-serif text-[14px] leading-snug">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="mt-0.5 p-1 text-current opacity-60 hover:opacity-100"
              aria-label="Dismiss message"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
