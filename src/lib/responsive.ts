import manifest from "./imageManifest.json";

/**
 * Responsive sources for the studio photographs.
 *
 * `scripts/export-images.py` writes the narrow copies (NAME-320.jpg,
 * NAME-480.jpg, NAME-800.jpg) and records each original's pixel size in
 * imageManifest.json. This module turns that into the props an <img> needs:
 * srcSet, a default sizes value and the intrinsic width/height that stop the
 * frame jumping while the file loads.
 *
 * A photograph with no manifest entry (a URL, or a file dropped in without
 * running the export step) simply returns nothing and is served at full size,
 * exactly as before.
 */

export const VARIANT_WIDTHS = [320, 480, 800] as const;

interface Dimensions {
  w: number;
  h: number;
}

const SIZES: Record<string, Dimensions> = manifest;

/** Drops any query string or fragment before matching. */
const withoutQuery = (url: string) => url.split(/[?#]/)[0];

/** Manifest keys are paths inside public/, e.g. images/sessions/family-story.jpg. */
function manifestKey(url: string): string {
  const base = import.meta.env.BASE_URL || "/";
  let path = withoutQuery(url);
  if (base !== "/" && path.startsWith(base)) path = path.slice(base.length);
  return path.replace(/^\/+/, "");
}

export function responsiveSource(
  url: string,
  sizes?: string,
): { srcSet?: string; sizes?: string; width?: number; height?: number } {
  const dimensions = SIZES[manifestKey(url)];
  if (!dimensions) return {};

  const original = withoutQuery(url);
  const width = dimensions.w;
  const height = dimensions.h;
  const dot = original.lastIndexOf(".");
  if (dot < 0) return { width, height };

  const stem = original.slice(0, dot);
  const extension = original.slice(dot);
  const candidates = VARIANT_WIDTHS.filter((variant) => variant < width).map(
    (variant) => `${stem}-${variant}${extension} ${variant}w`,
  );
  // The original is always the last, widest candidate.
  candidates.push(`${original} ${width}w`);

  return { srcSet: candidates.join(", "), sizes, width, height };
}
