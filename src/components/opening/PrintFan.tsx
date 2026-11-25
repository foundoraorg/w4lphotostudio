import { PRINTS } from "./openingAssets";
import { responsiveSource } from "../../lib/responsive";

/**
 * The six photographic prints in the opening fan.
 *
 * Position, width, rotation and the staggered rise are driven by
 * OpeningHero's single timeline through --x / --y / --r / --cw.
 */

/** Card width is --cw: about 218px on a wide screen, far less on a phone. */
const SIZES = "(min-width: 820px) 240px, 40vw";

const PRINTS_WITH_SOURCES = PRINTS.map((print) => ({
  print,
  ...responsiveSource(print.src, SIZES),
}));

export function PrintFan() {
  return (
    <div className="op-fan" aria-hidden="true">
      {PRINTS_WITH_SOURCES.map(({ print, ...responsive }, index) => (
        <div key={print.src} className="op-print" data-print={index}>
          <img
            src={print.src}
            srcSet={responsive.srcSet}
            sizes={responsive.sizes}
            width={responsive.width}
            height={responsive.height}
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
