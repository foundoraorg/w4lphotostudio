import { describe, expect, it } from "vitest";
import type { Session } from "./config";
import { DEFAULT_FOCUS, imageUrl, normaliseFocus, sessionImage } from "./images";

const base: Session = {
  id: "studio-portrait",
  slug: "studio-portrait",
  title: "Studio Portrait",
  category: "Portrait",
  description: "A quiet hour of portraits.",
  base_price_kes: 7500,
  base_duration_min: 60,
  included_edits: 10,
  image_crop: { x: 0, y: 0, w: 1 / 3, h: 1 / 3 },
  sort_order: 0,
  active: true,
};

describe("normaliseFocus", () => {
  it("defaults to a little above centre", () => {
    expect(normaliseFocus()).toEqual(DEFAULT_FOCUS);
  });

  it("clamps out-of-range and non-numeric values", () => {
    expect(normaliseFocus({ x: 1.4, y: -0.2 })).toEqual({ x: 1, y: 0 });
    expect(normaliseFocus({ x: Number.NaN, y: 0.3 })).toEqual({ x: DEFAULT_FOCUS.x, y: 0.3 });
  });
});

describe("imageUrl", () => {
  it("resolves a file name inside the sessions folder", () => {
    expect(imageUrl("studio-portrait.jpg")).toMatch(/images\/sessions\/studio-portrait\.jpg$/);
  });

  it("leaves absolute paths and URLs alone", () => {
    expect(imageUrl("/cdn/portrait.jpg")).toBe("/cdn/portrait.jpg");
    expect(imageUrl("https://cdn.example.com/portrait.jpg")).toBe("https://cdn.example.com/portrait.jpg");
  });
});

describe("sessionImage", () => {
  it("uses the photograph and its focus when image is set", () => {
    const image = sessionImage({ ...base, image: "studio-portrait.jpg", image_focus: { x: 0.4, y: 0.32 } });
    expect(image.url).toMatch(/images\/sessions\/studio-portrait\.jpg$/);
    expect(image.focus).toEqual({ x: 0.4, y: 0.32 });
  });

  it("falls back to the sheet cell and title alt text without a photograph", () => {
    const image = sessionImage(base);
    expect(image.url).toBeUndefined();
    expect(image.crop).toEqual(base.image_crop);
    expect(image.alt).toBe("Studio Portrait — Portrait photography session");
  });

  it("prefers explicit alt text", () => {
    expect(sessionImage({ ...base, image_alt: "A portrait in window light" }).alt).toBe("A portrait in window light");
  });
});
