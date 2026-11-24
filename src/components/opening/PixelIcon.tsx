import type { ReactElement } from "react";
import { PIXEL_COLOURS, type PixelKey } from "./openingAssets";

interface PixelIconProps {
  /** Nine rows of nine characters: k, b, a, w or . for transparent. */
  map: string[];
}

/**
 * A 9 × 9 W4L pixel mark. Cells overlap by 0.02 units so neighbouring
 * pixels share an edge and the glyph stays crisp at 20–70px.
 */
export function PixelIcon({ map }: PixelIconProps) {
  const cells: ReactElement[] = [];
  map.forEach((row, y) => {
    row.split("").forEach((key, x) => {
      if (key === "." || !(key in PIXEL_COLOURS)) return;
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x * 1.02}
          y={y * 1.02}
          width={1.02}
          height={1.02}
          fill={PIXEL_COLOURS[key as PixelKey]}
        />,
      );
    });
  });

  return (
    <svg viewBox="0 0 9.18 9.18" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {cells}
    </svg>
  );
}
