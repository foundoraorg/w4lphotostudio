import type { ImageCrop, ImageFocus, Session } from "./config";

/**
 * Image sources for sessions.
 *
 * Every session carries `image_crop`, a cell of the optional 3 x 3 sheet at
 * public/portfolio-sheet.jpg. Add a real photograph with `image` (a file name
 * inside public/images/sessions, or an absolute URL) and it is used instead;
 * `image_focus` then chooses the part of the photo to keep in frame.
 * See docs/IMAGES.md for the full walkthrough.
 */

export const SESSION_IMAGES_DIR = "images/sessions/";
export const DEFAULT_FOCUS: ImageFocus = { x: 0.5, y: 0.45 };

export interface SessionImage {
  alt: string;
  /** Real photograph, when the session has one. */
  url?: string;
  /** Focal point used with object-fit: cover and by the 3D texture crop. */
  focus: ImageFocus;
  /** Sheet cell used when there is no photograph, or the photo fails to load. */
  crop: ImageCrop;
}

/** Resolves a session `image` value against the app base (works on sub-path hosting). */
export function imageUrl(image: string): string {
  if (/^(https?:)?\/\//i.test(image) || image.startsWith("/")) return image;
  return `${import.meta.env.BASE_URL}${SESSION_IMAGES_DIR}${image.replace(/^\.?\//, "")}`;
}

export function normaliseFocus(focus?: Partial<ImageFocus> | null): ImageFocus {
  const clamp = (value: unknown, fallback: number) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(1, Math.max(0, number));
  };
  return {
    x: clamp(focus?.x, DEFAULT_FOCUS.x),
    y: clamp(focus?.y, DEFAULT_FOCUS.y),
  };
}

export function sessionImage(session: Session): SessionImage {
  const alt = session.image_alt?.trim() || `${session.title} — ${session.category} photography session`;
  const image = session.image?.trim();
  if (image) {
    return { alt, url: imageUrl(image), focus: normaliseFocus(session.image_focus), crop: session.image_crop };
  }
  return { alt, focus: normaliseFocus(session.image_focus), crop: session.image_crop };
}

/** Inline style for an <img> that fills its frame with the chosen focal point. */
export function focusStyle(focus: ImageFocus) {
  return { objectPosition: `${(focus.x * 100).toFixed(2)}% ${(focus.y * 100).toFixed(2)}%` };
}

/**
 * Draws a photograph into a canvas cropped to `aspect` around `focus`.
 * Used for the three.js print textures, which cannot use CSS object-fit.
 */
export function coverCanvas(image: HTMLImageElement, aspect: number, focus: ImageFocus, width = 900) {
  const height = Math.max(1, Math.round(width / aspect));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx || !image.naturalWidth || !image.naturalHeight) return canvas;

  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = Math.min(0, Math.max(width - drawWidth, width / 2 - focus.x * drawWidth));
  const drawY = Math.min(0, Math.max(height - drawHeight, height / 2 - focus.y * drawHeight));
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  return canvas;
}

export function loadPhoto(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  });
}
