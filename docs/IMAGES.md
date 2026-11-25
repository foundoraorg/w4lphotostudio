# Session photographs

Every session is drawn in five places: the 3D gallery prints on the home page, the
session cards, the session page hero, the booking drawer and the flyer animation when
a print is opened. All five read the same data, so a photo set once appears everywhere.

There are two ways to supply images, in order of preference.

1. **A real photograph per session** — set `image` on the session (recommended).
2. **A single 3 × 3 sheet** — one file cropped per session with `image_crop`
   (the original approach; still supported, and the fallback when a photo is missing).

The generated placeholder tiles you see now are only what the app draws when neither
of the above is present. They are not files you need to delete.

---

## 1. Drop in real photographs

### Step 1 — Export the files

| Property | Recommendation |
| --- | --- |
| Format | JPEG (`.jpg`), sRGB |
| Size | long edge 1600–2400 px; cards and prints need no more |
| Orientation | portrait 4:5 or 3:4 matches the cards and the gallery prints |
| Weight | under ~600 KB each |
| Name | the session slug, e.g. `studio-portrait.jpg` |

Put them in:

```
public/images/sessions/
```

The folder already exists. Anything in `public/` is served from the site root, so
`public/images/sessions/studio-portrait.jpg` is available at `/images/sessions/studio-portrait.jpg`.

Export the phone-sized copies once the file is in place — see
[section 4](#4-responsive-sizes). Without that step the full-size file is still
served, so it is the difference between a 25 KB and a 120 KB download, not a
broken page.

### Step 2 — Set the session's image fields

Open `data/sessions.json` and add three fields to the session you are illustrating
(keep the existing ones):

```json
{
  "id": "studio-portrait",
  "slug": "studio-portrait",
  "title": "Studio Portrait",
  "image_crop": { "x": 0, "y": 0, "w": 0.3333, "h": 0.3333 },
  "image": "studio-portrait.jpg",
  "image_alt": "Portrait of a woman in warm window light at W4L Studios",
  "image_focus": { "x": 0.5, "y": 0.38 }
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `image` | for a photo | File name inside `public/images/sessions/`, or any absolute URL (`https://…` or `/…`). |
| `image_alt` | optional | What the photo shows, for screen readers. Defaults to “*Title* — *Category* photography session”. |
| `image_focus` | optional | Point of the photo to keep in frame. Defaults to `{ "x": 0.5, "y": 0.45 }`. |
| `image_crop` | always present | Sheet cell. Ignored while `image` is set; used as the fallback. |

No code change and no restart is needed while `npm run dev` is running — save the JSON
and the dev server reloads. For a production build, run `npm run build` again so the
file is copied into `dist/`.

### Step 3 — Set the framing with `image_focus`

Photographs are laid into frames of different shapes (4:5 cards, 2:3 gallery prints,
wide hero panels), so the browser crops with `object-fit: cover`. `image_focus` decides
which point survives that crop — it works exactly like the focal point in a photo app.

- `x` — 0 is the left edge, 1 is the right edge, 0.5 is centred.
- `y` — 0 is the top edge, 1 is the bottom edge, 0.45 is a little above centre.
- The same values are used by the CSS crops and by the three.js print textures, so the
  gallery and the cards agree.

Starting points:

| What the photo is | `image_focus` |
| --- | --- |
| Head-and-shoulders portrait | `{ "x": 0.5, "y": 0.32 }` |
| Full-length portrait | `{ "x": 0.5, "y": 0.55 }` |
| Subject left of centre | `{ "x": 0.38, "y": 0.45 }` |
| Subject right of centre | `{ "x": 0.72, "y": 0.45 }` |
| Couple, faces near the top | `{ "x": 0.5, "y": 0.28 }` |
| Product flat-lay | `{ "x": 0.5, "y": 0.5 }` |

Rule of thumb: look at the photo, estimate where the subject's eyes sit as a fraction
of the frame (e.g. a third of the way down is `0.33`), and use that. Both values are
clamped to 0–1, so a bad number cannot break the layout.

### Replacing a photo

Overwrite the file, or change `image` to a new file name. Leaving `image` out returns
that session to its sheet cell.

---

## 2. The 3 × 3 sheet

If you would rather review the whole catalogue with one export, drop a single image at:

```
public/portfolio-sheet.jpg
```

- 1744 × 2336 px, portrait, JPEG.
- Three columns × three rows; each cell is one session.
- Cells are numbered 0–8 from left to right, top to bottom, matching `sort_order`
  (0 = Studio Portrait … 8 = Brand & Content Day).

Then give each session the matching cell in `image_crop`, where all values are
fractions of the whole sheet:

```json
"image_crop": { "x": 0.3333, "y": 0, "w": 0.3333, "h": 0.3333 }
```

| Cell | Session order | `x` | `y` |
| --- | --- | --- | --- |
| 0 | Studio Portrait | 0 | 0 |
| 1 | Family Story | 0.3333 | 0 |
| 2 | Couples & Engagement | 0.6667 | 0 |
| 3 | Corporate Headshots | 0 | 0.3333 |
| 4 | Product & Packshot | 0.3333 | 0.3333 |
| 5 | Fashion Editorial | 0.6667 | 0.3333 |
| 6 | Maternity Glow | 0 | 0.6667 |
| 7 | Kids & Newborn | 0.3333 | 0.6667 |
| 8 | Brand & Content Day | 0.6667 | 0.6667 |

`w` and `h` are always `0.3333`. The helper `sheetCell(index)` in
`src/lib/portfolio.ts` returns exactly these values if you prefer generating them.

A sheet cell is stretched to fill its frame, which is why this mode suits a quick
review rather than final artwork — use per-session photographs for launch.

---

## Precedence and fallbacks

1. `image` is set and the file loads → the photograph, framed by `image_focus`.
2. `image` is set but the file is missing or fails → that session's `image_crop` cell.
3. No sheet at `public/portfolio-sheet.jpg` either → a generated warm placeholder tile.

Nothing throws or leaves an empty frame; a wrong file name only costs you the fallback.

## Where these fields are edited

- `data/sessions.json` is the catalogue. Hand-edit the three fields above.
- The admin session editor (`/admin` → sessions) keeps `image`, `image_alt` and
  `image_focus` intact when it saves prices and titles, but it does not expose them —
  this file is the place to change imagery.
- Re-seeding from `DEFAULT_PRICING_CONFIG` never overwrites an existing
  `data/sessions.json`.

## Verify a new photograph

With `npm run dev` running:

1. `/index` — the print in the 3D gallery shows the photo at the chosen focus.
2. `/sessions` — the card is cropped to 4:5 around the same point.
3. `/sessions/<slug>` — hero image, plus the “more sessions” thumbnails if touched.
4. Booking drawer — the line item thumbnail matches.
5. Home page → click a print — the flyer flies in with the photograph, not the sheet.
6. Resize to a phone width; if the subject's face is cut, nudge `image_focus.y` up.

---

## 3. The opening hero prints

The home page opens with a fan of six prints that rise beneath the headline. They
live in their own folder and are not part of the session catalogue:

```
public/images/hero/print-1.jpg … print-6.jpg
```

The files currently there are generated stand-ins. Overwrite them with real W4L
photographs, keeping the six names. No code change is needed for a straight swap —
run the [export step](#4-responsive-sizes), then a production build (`npm run build`)
to copy the new files into `dist/`.

### Export settings

| Property | Recommendation |
| --- | --- |
| Format | JPEG (`.jpg`), sRGB |
| Crop | portrait **3:4** (e.g. 900 × 1200 px); 880 × 1184 also works |
| Size | long edge 900–1200 px is plenty — the cards are small on screen |
| Weight | under ~250 KB each; all six load on the first screen |
| Grade | the site adds a slight warm film grade, so export natural colour |

A print card is 1 : 1.32, a touch taller than 3:4, and the photo is laid into it with
`object-fit: cover`. Exporting 3:4 means only a sliver of top or bottom is trimmed;
leave a little headroom above faces when you crop.

### Order and focal point

The order is set in `src/components/opening/openingAssets.ts`:

```ts
/**
 * The six prints in the fan, left to right. To use real W4L photographs,
 * replace public/images/hero/print-1…6.jpg and keep the order below.
 */
export const PRINTS: Print[] = [
  { src: "/images/hero/print-1.jpg", focus: "50% 38%" }, // portrait, window light
  { src: "/images/hero/print-6.jpg", focus: "50% 50%" }, // hands and film camera
  { src: "/images/hero/print-3.jpg", focus: "50% 55%" }, // still life
  { src: "/images/hero/print-4.jpg", focus: "50% 50%" }, // family on the beach
  { src: "/images/hero/print-2.jpg", focus: "50% 50%" }, // studio interior
  { src: "/images/hero/print-5.jpg", focus: "50% 45%" }, // couple at dusk
];
```

The array is **left to right in the fan**, which is not the same as file number order —
the six names are deliberately shuffled so a straight overwrite does not bunch similar
shots together. Edit this array to reorder, or point an entry at a different file.

`focus` is written straight to the image's CSS `object-position`, so it works like the
focal point in a photo app:

- First value — horizontal: `0%` left edge, `50%` centred, `100%` right edge.
- Second value — vertical: `0%` top edge, `50%` centred, `100%` bottom edge.
- The centre of the crop is pinned to that point; everything outside the 1 : 1.32 card
  falls away. Only the part where the card is *shorter* than the photo actually moves,
  so a landscape-shaped subject may need almost no adjustment.

Pick the value by looking at the photo: estimate where the subject's eyes sit as a
percentage down the frame (a third of the way down is `33%`) and use that as the
second value. Every mark keeps that guidance in its trailing comment.

| What the shot is | `focus` |
| --- | --- |
| Head-and-shoulders portrait | `"50% 32%"` |
| Full-length portrait | `"50% 55%"` |
| Subject left of centre | `"38% 45%"` |
| Subject right of centre | `"68% 45%"` |
| Flat-lay or still life | `"50% 50%"` |
| Landscape with an important horizon | `"50% 60%"` |

The prints are decorative (`aria-hidden`, empty `alt`), so they only need to be
well-framed, not described.

### Check the result

With `npm run dev` running, open `/index` and reload. The fan rises after the
headline, so watch the final positions rather than the first frame.

1. Each print should read at its intended subject; a cut face means the vertical value
   is too high or too low.
2. Narrow the window to a phone width — the fan shrinks and tightens on small screens,
   which trims more of the sides than desktop does.
3. Reload with “reduce motion” enabled in the OS. The prints then appear straight in
   their final positions with no animation, which is the quickest way to judge framing.

---

## 4. Responsive sizes

A phone should not download an 880 px file to fill a 110 px card. Before you ship a
new or replaced photograph, run the export step once on your machine:

```bash
python3 -m pip install pillow     # once: a build-time tool, not a site dependency
python3 scripts/export-images.py
```

It reads every `.jpg` in `public/images/hero` and `public/images/sessions` and writes:

| Output | Width | Used for |
| --- | --- | --- |
| `print-1-320.jpg` | 320 px | phones, the small story and drawer thumbnails |
| `print-1-480.jpg` | 480 px | a phone at 2×, a tablet |
| `print-1-800.jpg` | 800 px | a large card at 2× |
| `src/lib/imageManifest.json` | — | the original pixel size of each photo |

The rules it follows:

- It never upscales: a file narrower than a target width simply skips that width.
- It ignores files it wrote itself, so re-running is safe and idempotent.
- The original stays untouched and remains the widest `srcset` candidate.
- Output is JPEG at quality 82, progressive — typically a fifth of the original weight.

Commit the new files together with the photograph. `src/lib/responsive.ts` reads the
manifest and emits `srcSet`, `sizes`, `width` and `height` for each `<img>`, so the
browser picks the smallest file that fits and reserves the frame before it loads.

A photo with no manifest entry — a remote URL, or a file dropped in without running
the step — is served at full size. Nothing breaks; it is just heavier.

### What `sizes` each surface declares

| Surface | `sizes` |
| --- | --- |
| Opening hero prints (`PrintFan`) | `(min-width: 820px) 240px, 40vw` |
| Scroll-story cards (`ScrollStory`) | `(min-width: 820px) 160px, 120px` |
| Session cards, home grids | `(min-width: 768px) 33vw, 50vw` |
| Session page hero | `(min-width: 1024px) 46vw, 100vw` |
| “More sessions” row | `(min-width: 640px) 25vw, 50vw` |
| Booking drawer / estimate thumbnail | `64px` / `80px` |
| Studio page hero | `100vw` |

If you add a new image folder, add it to `DIRECTORIES` at the top of
`scripts/export-images.py` and give the new `<img>` a `sizes` value that matches how
wide it actually renders.
