import type { ReactNode } from "react";
import { ChevronDown } from "../Icons";

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export function Accordion({ items, className = "" }: { items: AccordionItem[]; className?: string }) {
  return (
    <div className={`divide-y divide-line border-t border-line ${className}`}>
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-[14px] uppercase tracking-[0.06em] marker:hidden [&::-webkit-details-marker]:hidden">
            {item.title}
            <ChevronDown size={16} className="shrink-0 transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <div className="pb-5 pr-6 font-serif text-[15px] leading-relaxed text-ink/75">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
