#!/usr/bin/env python3
"""Convert only background PNG artwork to WebP on the feature branch.

Never resize artwork, touch car/character sprites, or overwrite the originals
in place. The Git history keeps the source PNGs; the working branch publishes
only the smaller WebP files. Run in a GitHub Actions Ubuntu runner with Pillow.
"""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageChops, features

ROOT = Path(__file__).resolve().parent.parent
TARGETS = (
    "assets/Meet",
    "assets/CentralTokyo",
    "assets/Locations/TunerShops",
    "assets/Garage",
    "assets/Oshiage",
)
MAP_FILE = ROOT / "src/data/backgroundWebpTable.js"
MAP_PREFIX = "export const BACKGROUND_WEBP_ASSETS = Object.freeze("
# Keep existing WebP conversion choices stable on repeated runs.
MAX_PNG_RATIO = 0.95
WEBP_QUALITY = 95


def get_map():
    if not MAP_FILE.exists():
        return {}
    source = MAP_FILE.read_text(encoding="utf-8").strip()
    if not source.startswith(MAP_PREFIX) or not source.endswith(");"):
        raise RuntimeError("Unexpected generated background map file format")
    return json.loads(source[len(MAP_PREFIX):-2])


def candidates():
    files = []
    for target in TARGETS:
        files.extend((ROOT / target).rglob("*.png"))
    files.extend((ROOT / "assets/Ui").glob("tokyo_region_map_*.png"))
    return sorted(set(files))


def convert(source):
    dest = source.with_suffix(".webp")
    if dest.exists():
        raise RuntimeError(f"Refusing to overwrite existing WebP: {dest}")
    initial = source.stat().st_size
    if initial < 100_000:
        return None
    with Image.open(source) as image:
        if image.format != "PNG":
            raise RuntimeError(f"Not PNG: {source}")
        size = image.size
        rgba = image.convert("RGBA")
        alpha = rgba.getchannel("A").getextrema()[0] < 255
        options = {"format": "WEBP", "method": 4}
        if alpha:
            # Explicitly preserve pixel-perfect transparency for layered
            # dragstrip / workshop backgrounds.
            options["lossless"] = True
            to_save = rgba
        else:
            options["quality"] = WEBP_QUALITY
            to_save = image.convert("RGB")
        icc = image.info.get("icc_profile")
        if icc:
            options["icc_profile"] = icc
        to_save.save(dest, **options)

        with Image.open(dest) as verified:
            verified.load()
            if verified.format != "WEBP" or verified.size != size:
                raise RuntimeError(f"Invalid WebP or altered canvas size: {dest}")
            if alpha and ImageChops.difference(
                rgba.getchannel("A"), verified.convert("RGBA").getchannel("A")
            ).getbbox():
                raise RuntimeError(f"Alpha changed during lossless encoding: {dest}")

    compressed = dest.stat().st_size
    if compressed >= initial * MAX_PNG_RATIO:
        dest.unlink()
        return None
    source.unlink()
    return (initial, compressed)


def main():
    if not features.check("webp"):
        raise RuntimeError("Pillow was built without WebP support")
    mapping = get_map()
    number = 0
    skipped = 0
    before = after = 0
    all_files = candidates()
    for source in all_files:
        old = source.relative_to(ROOT).as_posix()
        if old in mapping:
            raise RuntimeError(f"Mapped PNG still present: {old}")
        result = convert(source)
        if result is None:
            skipped += 1
            continue
        old_size, new_size = result
        mapping[old] = source.with_suffix(".webp").relative_to(ROOT).as_posix()
        number += 1
        before += old_size
        after += new_size
        if number % 25 == 0:
            print(f"Converted {number} files, saved {(before-after)/1e6:.1f} MB", flush=True)

    for original, replacement in mapping.items():
        if (ROOT / original).exists() or not (ROOT / replacement).is_file():
            raise RuntimeError(f"Invalid or incomplete WebP mapping: {original}")

    MAP_FILE.write_text(
        MAP_PREFIX + json.dumps(dict(sorted(mapping.items())), indent=2,
                                ensure_ascii=False) + ");\n",
        encoding="utf-8"
    )
    print(f"Background conversion: {number} new, {skipped} skipped; "
          f"{before/1e6:.1f} MB PNG -> {after/1e6:.1f} MB WebP; "
          f"saved {(before-after)/1e6:.1f} MB. Total mapped: {len(mapping)}", flush=True)
    if not mapping or (number > 0 and before-after < 30_000_000):
        raise RuntimeError("Conversion did not save enough bytes; no commit should be made")


if __name__ == "__main__":
    main()
