import { PRINTS } from "./openingAssets";

/**
 * The six photographic prints in the opening fan.
 *
 * Position, width, rotation and the staggered rise are driven by
 * OpeningHero's single timeline through --x / --y / --r / --cw.
 */
export function PrintFan() {
  return (
    <div className="op-fan" aria-hidden="true">
      {PRINTS.map((print, index) => (
        <div key={print.src} className="op-print" data-print={index}>
          <img
            src={print.src}
            alt=""
            draggable={false}
            decoding="async"
            style={{ objectPosition: print.focus }}
          />
        </div>
      ))}
    </div>
  );
}
