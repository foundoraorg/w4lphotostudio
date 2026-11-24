import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "../../lib/hooks";

export function CountUp({
  value,
  suffix = "",
  duration = 1200,
  className = "",
  format = true,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
  format?: boolean;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {format ? display.toLocaleString("en-US") : display}
      {suffix}
    </span>
  );
}
