import { createContext, useCallback, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { ImageCrop } from "../../lib/config";
import { cropStyle, loadSheet, placeholderSheetUrl } from "../../lib/portfolio";

interface FlyerPayload {
  crop: ImageCrop;
  from: { left: number; top: number; width: number; height: number };
}

interface FlyerValue {
  startFlyer: (payload: FlyerPayload) => void;
  arriving: boolean;
}

const FlyerContext = createContext<FlyerValue | null>(null);

export function FlyerProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<FlyerPayload | null>(null);
  const [arriving, setArriving] = useState(false);

  const startFlyer = useCallback((next: FlyerPayload) => {
    setPayload(next);
    setArriving(true);
  }, []);

  const finish = useCallback(() => {
    setPayload(null);
    setArriving(false);
  }, []);

  const value = useMemo(() => ({ startFlyer, arriving }), [startFlyer, arriving]);

  return (
    <FlyerContext.Provider value={value}>
      {children}
      {payload && <FlyerLayer key={`${payload.crop.x}-${payload.crop.y}-${payload.from.left}`} payload={payload} onDone={finish} />}
    </FlyerContext.Provider>
  );
}

function FlyerLayer({ payload, onDone }: { payload: FlyerPayload; onDone: () => void }) {
  const [rect, setRect] = useState(payload.from);
  const [moving, setMoving] = useState(false);
  const [sheet, setSheet] = useState<string>(placeholderSheetUrl());

  useEffect(() => {
    let alive = true;
    void loadSheet().then((source) => {
      if (alive && source instanceof HTMLImageElement && source.src) setSheet(source.src);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const tick = () => {
      const target = document.querySelector<HTMLElement>("[data-flyer-target]");
      const bounds = target?.getBoundingClientRect();
      if (bounds && bounds.width > 4 && bounds.height > 4) {
        setRect({ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height });
        setMoving(true);
        window.setTimeout(onDone, 320);
        return;
      }
      if (performance.now() - started > 1500) {
        onDone();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  const style: CSSProperties = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    ...cropStyle(payload.crop, sheet),
    transition: moving
      ? "left 300ms cubic-bezier(.25,.75,.25,1), top 300ms cubic-bezier(.25,.75,.25,1), width 300ms cubic-bezier(.25,.75,.25,1), height 300ms cubic-bezier(.25,.75,.25,1)"
      : "none",
  };

  return <div className="flyer" style={style} aria-hidden="true" />;
}

export function useFlyer(): FlyerValue {
  const context = useContext(FlyerContext);
  if (!context) throw new Error("useFlyer must be used inside FlyerProvider");
  return context;
}
