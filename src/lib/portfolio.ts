import type { CSSProperties } from "react";
import type { ImageCrop } from "./config";

/**
 * The optional 3 x 3 sheet at public/portfolio-sheet.jpg (1744 x 2336), cropped
 * per session through `image_crop`. Per-session photographs take precedence and
 * this is their fallback — see docs/IMAGES.md.
 */
export const SHEET_URL = `${import.meta.env.BASE_URL}portfolio-sheet.jpg`;
export const SHEET_WIDTH = 1744;
export const SHEET_HEIGHT = 2336;

const PALETTES: [string, string, string][] = [
  ["#e7d9c6", "#c7a789", "#6d5140"],
  ["#efe4d3", "#d5b9a0", "#7c5f4b"],
  ["#e3d5c4", "#bf9d80", "#5c4536"],
  ["#f0e7d8", "#d8c0a6", "#856a51"],
  ["#e9dccb", "#c9a88c", "#6a4f3d"],
  ["#e0d2bf", "#b89274", "#4f3b2f"],
  ["#f2e9da", "#dcc4ab", "#8a6c55"],
  ["#e6d8c6", "#c2a184", "#634838"],
  ["#ece0cf", "#cfae92", "#71543f"],
];

let placeholderUrl: string | null = null;

/** Nine warm, softly silhouetted tiles with a fine grain, drawn once on a canvas. */
export function placeholderSheetUrl(): string {
  if (placeholderUrl) return placeholderUrl;
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = SHEET_WIDTH;
  canvas.height = SHEET_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const tw = SHEET_WIDTH / 3;
  const th = SHEET_HEIGHT / 3;

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const index = row * 3 + col;
      const [light, mid, dark] = PALETTES[index];
      const x = col * tw;
      const y = row * th;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, tw, th);
      ctx.clip();

      // Warm ground.
      const bg = ctx.createLinearGradient(x, y, x + tw * 0.4, y + th);
      bg.addColorStop(0, light);
      bg.addColorStop(0.55, mid);
      bg.addColorStop(1, dark);
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, tw, th);

      // Window light.
      const glow = ctx.createRadialGradient(x + tw * 0.18, y + th * 0.16, 10, x + tw * 0.3, y + th * 0.3, tw * 1.1);
      glow.addColorStop(0, "rgba(255,250,235,0.75)");
      glow.addColorStop(0.45, "rgba(255,247,230,0.16)");
      glow.addColorStop(1, "rgba(255,247,230,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x, y, tw, th);

      // Floor / horizon band.
      ctx.fillStyle = "rgba(45,33,27,0.18)";
      ctx.fillRect(x, y + th * 0.78, tw, th * 0.22);

      // Soft silhouette: shoulders + head, offset differently per tile.
      const cx = x + tw * (0.5 + (index % 3) * 0.045 - 0.045);
      const shoulderY = y + th * (0.9 + (index % 2) * 0.02);
      ctx.filter = "blur(26px)";
      ctx.fillStyle = "rgba(38,28,23,0.55)";
      ctx.beginPath();
      ctx.ellipse(cx, shoulderY, tw * 0.42, th * 0.26, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      const headR = tw * (0.15 + (index % 3) * 0.012);
      ctx.beginPath();
      ctx.ellipse(cx + tw * 0.01, y + th * 0.5, headR, headR * 1.22, -0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = "none";

      // Rim light on the far edge.
      const rim = ctx.createLinearGradient(x + tw, y, x + tw * 0.5, y);
      rim.addColorStop(0, "rgba(255,246,225,0.4)");
      rim.addColorStop(1, "rgba(255,246,225,0)");
      ctx.fillStyle = rim;
      ctx.fillRect(x, y, tw, th);

      // Grain.
      for (let i = 0; i < 1100; i += 1) {
        ctx.fillStyle = i % 3 === 0 ? "rgba(255,255,255,0.05)" : "rgba(30,20,15,0.05)";
        ctx.fillRect(x + Math.random() * tw, y + Math.random() * th, 1.4, 1.4);
      }

      // Vignette.
      const vignette = ctx.createRadialGradient(x + tw / 2, y + th / 2, th * 0.25, x + tw / 2, y + th / 2, th * 0.75);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(20,14,10,0.32)");
      ctx.fillStyle = vignette;
      ctx.fillRect(x, y, tw, th);

      ctx.restore();
    }
  }

  placeholderUrl = canvas.toDataURL("image/jpeg", 0.86);
  return placeholderUrl;
}

let sheetPromise: Promise<HTMLImageElement | HTMLCanvasElement> | null = null;

/** Tries the real sheet, falls back to the generated placeholder. */
export function loadSheet(url: string = SHEET_URL): Promise<HTMLImageElement | HTMLCanvasElement> {
  if (sheetPromise) return sheetPromise;
  sheetPromise = new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SHEET_WIDTH;
      canvas.height = SHEET_HEIGHT;
      const ctx = canvas.getContext("2d");
      const placeholder = new Image();
      placeholder.onload = () => {
        ctx?.drawImage(placeholder, 0, 0);
        resolve(canvas);
      };
      placeholder.onerror = () => resolve(canvas);
      placeholder.src = placeholderSheetUrl();
    };
    image.src = url;
  });
  return sheetPromise;
}

/** CSS crop of the 3 x 3 sheet cell, matching the three.js texture crop. */
export function cropStyle(crop: ImageCrop, url: string | null = placeholderSheetUrl()): CSSProperties {
  return {
    backgroundImage: url ? `url("${url}")` : undefined,
    backgroundSize: `${100 / Math.max(crop.w, 0.0001)}% ${100 / Math.max(crop.h, 0.0001)}%`,
    backgroundPosition: `${crop.w >= 1 ? 0 : (crop.x / (1 - crop.w)) * 100}% ${
      crop.h >= 1 ? 0 : (crop.y / (1 - crop.h)) * 100
    }%`,
    backgroundRepeat: "no-repeat",
  };
}

export function sheetCell(index: number): ImageCrop {
  const col = ((index % 3) + 3) % 3;
  const row = (Math.floor(index / 3) + 3) % 3;
  return { x: col / 3, y: row / 3, w: 1 / 3, h: 1 / 3 };
}
