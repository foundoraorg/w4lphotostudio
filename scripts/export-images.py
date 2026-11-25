#!/usr/bin/env python3
"""Generate the responsive JPEG variants the site serves.

    python3 scripts/export-images.py

Every photograph in public/images/hero and public/images/sessions is read once,
three narrower copies are written beside it (NAME-320.jpg, NAME-480.jpg and
NAME-800.jpg, never upscaled), and the original pixel dimensions are recorded in
src/lib/imageManifest.json so the app can emit width/height and srcset.

This is a build-time tool, not a server dependency: Pillow is only needed to run
this script. The site itself only ever sees the JPEGs and the JSON manifest.

    python3 -m pip install pillow
    python3 scripts/export-images.py

Re-run it whenever a photograph is added, replaced or re-cropped.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover - developer-facing message
    sys.exit("Pillow is required to export images: python3 -m pip install pillow")

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DIRECTORIES = ("public/images/hero", "public/images/sessions", "public/images/dawn")
WIDTHS = (320, 480, 800)
QUALITY = 82
MANIFEST = ROOT / "src/lib/imageManifest.json"


def is_variant(path: Path) -> bool:
    """True for a file this script wrote, so variants are never re-exported."""
    return any(path.stem.endswith(f"-{width}") for width in WIDTHS)


def main() -> int:
    manifest: dict[str, dict[str, int]] = {}
    written = 0

    for directory in DIRECTORIES:
        folder = ROOT / directory
        if not folder.is_dir():
            continue
        for source in sorted(folder.glob("*.jpg")):
            if is_variant(source):
                continue

            with Image.open(source) as opened:
                image = opened.convert("RGB")
                width, height = image.size
                manifest[source.relative_to(PUBLIC).as_posix()] = {"w": width, "h": height}

                for target in WIDTHS:
                    if target >= width:
                        # Never upscale: the original is already the smallest copy.
                        continue
                    variant = source.with_name(f"{source.stem}-{target}.jpg")
                    variant_height = max(1, round(height * target / width))
                    image.resize((target, variant_height), Image.LANCZOS).save(
                        variant,
                        "JPEG",
                        quality=QUALITY,
                        optimize=True,
                        progressive=True,
                    )
                    written += 1
                    print(f"{variant.relative_to(ROOT)}  {target}x{variant_height}")

    MANIFEST.write_text(
        json.dumps(dict(sorted(manifest.items())), indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"\n{written} variants for {len(manifest)} photographs\n"
        f"manifest -> {MANIFEST.relative_to(ROOT)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
