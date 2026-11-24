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
