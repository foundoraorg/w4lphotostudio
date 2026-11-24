import type { ElementType, ReactNode } from "react";
import { useInView, useReducedMotion } from "../../lib/hooks";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  innerClassName?: string;
  as?: ElementType;
  variant?: "mask" | "fade";
}

/** Masks a line and lifts it into place once, with a stagger delay. */
export function Reveal({ children, delay = 0, className = "", innerClassName = "", as, variant = "mask" }: RevealProps) {
  const Tag = (as ?? "span") as ElementType;
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15 });
  const reduced = useReducedMotion();
  const active = inView || reduced;

  if (variant === "fade") {
    return (
      <Tag ref={ref} className={`reveal-fade ${active ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag ref={ref} className={`reveal-mask ${active ? "is-in" : ""} ${className}`}>
      <span className={`reveal-line ${innerClassName}`} style={{ transitionDelay: `${delay}ms` }}>
        {children}
      </span>
    </Tag>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  const { ref, inView } = useInView<HTMLHRElement>({ threshold: 0.4 });
  return <hr ref={ref} className={`divider-draw ${inView ? "is-in" : ""} ${className}`} />;
}
