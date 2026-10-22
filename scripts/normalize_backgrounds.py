#!/usr/bin/env python3
"""R645 strictly scoped background canvas normalization for eight known outliers.

No perspective painting, pan, crop, pad, recolor, filenames, or scene logic
is altered. Each 1536x864 pixel-art image is nearest-neighbor resized to the
same 1672x941 canvas already used by the other scene-family backgrounds.
Run --check in CI; run --apply only on a dedicated review branch.
"""
import argparse
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
MASTER=(1672,941)
SOURCE=(1536,864)
TARGETS=(
    "assets/Garage/shinonome_warehouse_day.png",
    "assets/Locations/TunerShops/shinagawa_zerosports_day.png",
    "assets/Meet/Day/shibuya_center_gai_day.png",
    "assets/Meet/Day/shibuya_scramble_day.png",
    "assets/Meet/Day/shinagawa_konan_day.png",
    "assets/Meet/Day/shinagawa_oi_wharf_day.png",
    "assets/Meet/Day/yokohama_bay_bridge_day.png",
    "assets/Meet/Day/yokohama_minato_mirai_day.png",
)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--apply",action="store_true")
    ap.add_argument("--check",action="store_true")
    args=ap.parse_args()
    if args.apply and args.check:
        ap.error("choose --apply OR --check")
    touched=0
    for rel in TARGETS:
        path=ROOT/rel
        with Image.open(path) as im:
            size=im.size
            if size==MASTER:
                print("OK  ", rel, size)
                continue
            if size!=SOURCE:
                raise ValueError(f"Unexpected source size {rel}: {size}, expected {SOURCE}")
            if args.check:
                raise AssertionError(f"Unnormalized active background {rel}: {size}")
            if args.apply:
                # Preserve source pixel colors; no smoothing of high-density pixel art.
                normalized=im.resize(MASTER,Image.Resampling.NEAREST)
                normalized.save(path,"PNG",optimize=True)
                with Image.open(path) as verify:
                    if verify.size!=MASTER:
                        raise AssertionError(f"Failed to normalize {rel}")
                touched+=1
                print("RESIZED",rel, f"{SOURCE[0]}x{SOURCE[1]} -> {MASTER[0]}x{MASTER[1]}")
            else:
                print("PLANNED",rel, f"{SOURCE[0]}x{SOURCE[1]} -> {MASTER[0]}x{MASTER[1]}")
    print(f"Background canvas normalization: {touched} images modified")
if __name__=="__main__": main()
