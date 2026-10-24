# R645 — Tokyo SHIFT Background Standardisation

**Status:** Pixel canvas dimensions are standardised for the active
Meets/outdoor locations and the vehicle workshop/garage interiors.
**Painted vanishing points, horizon and floor perspective have NOT yet
been visually measured or corrected.** Do not label the artwork itself
perspective-calibrated.

## What changed in R645

1. Audited 153 scenery and race-layer images using the actual checked-in
   PNG/WebP headers, not assumptions from filenames.
2. Found **eight** 1536×864 outliers. Nearest-neighbour rescaled only these
   eight active images to the 1672×941 master format, with no crop or
   recolouring (Git history retains the originals).
3. All **42 Meet** images, **4 Skytree** images, **4 central outdoor** images,
   **6 Shinonome workshop** images, **16 tuner workshop** images, **2 crew space**
   images and **2 Dyno** images are now exactly **1672×941**.
4. Preserved deliberately different categories rather than warping them:
   **Ginza** five 1672×941; **Oshiage interior** eight 1672×941; **pro
   registration rooms** four 1672×941; **Office** three 1536×1024;
   **Auto Market** nine 1836×857; professional racing foreground/stands
   separate multilayer component sizes.
5. Corrected the Story Director's full-screen versus small-window
   transform: source-image coordinates and sprite coordinates must use
   the **identical uniform crop/scale/position matrix**, not separate
   percentages of the two differently cropped viewports.

## Image contacts (all real source art)

Use these to compare geometric linework. Colored lines are **suggested**
guides, not measurements of each image's painted architecture:

- [Outdoor and Meet contact sheet](sheets/outdoor_meets.webp)
- [Vehicle garages and tuner workshops](sheets/workshops.webp)
- [Other Story Mode interiors](sheets/story_interiors.webp)

[Full dimension-by-file inventory](INVENTORY.md) ·
[Structured machine-readable inventory](inventory.json) ·
[Interactive side-by-side line comparison](../../tools/background-calibrator.html)

The interactive comparison tool can display actual day and night art
side-by-side and adjust common horizon/back/ground/near lines.
It exports a JSON snippet for the next approved per-background
calibration pass without changing normal gameplay or player saves.

## The R645 source-art coordinate standard

All perspective variables are fractions of the **original artwork**.
The geometric back line is a hard stop; move a character past it and
the projection clamps them to the minimum depth.

\[
y_{world}=\mathrm{clamp}(y_{requested},b,n)
\]
\[
k(y)=\mathrm{clamp}\left[\left(\frac{y_{world}-h}{r-h}\right)^\gamma,k_{min},k_{max}\right]
\]
\[
S_{display}=S_{reference,source}\cdot k(y)\cdot
S_{art\rightarrow screen}
\]

A source background at `1672×941` can render inside `1138×528`
or fill the `1560×840` cinematic window. The viewport transform
includes cover cropping, fit-contain bars, bottom anchoring and
home workshop's zoom-cover. The very same transform applies to
characters' feet, vehicle wheel-ground anchors and sprite scale.

Example: the aspect ratio of 1672×941 is preserved regardless of
whether the target window is a slightly different aspect ratio.
No raw PNG gets distorted by stretching to the target aspect ratio.

### Provisional mathematical family lines

| Scene family | Horizon | Back ground | Reference | Near ground |
| --- | ---: | ---: | ---: | ---: |
| Outdoor location | 0.40 | 0.52 | 0.76 | 0.94 |
| Workshop interior | 0.34 | 0.54 | 0.78 | 0.95 |

**These ratios still require review against the painted artworks.**
For road/race scenes, the rendering remains orthographic and
side-scrolling; the drag complex uses authored layered geometry.

## Planned visual geometry QA — not yet marked complete

The next pass must verify each **real painted**:
- wall/floor boundary or road ground plane relative to the master
- horizontal level and vanishing point alignment
- ability for car and person side-on/front-on sprites to stand naturally
- day/night architecture alignment and any artwork discrepancies
- foreground occluders that should sit ahead of characters/cars.

Making PNGs the same pixel dimensions does *not* make their painted
vanishing points identical. Where perspective differs materially, an
artist or targeted image edit is required. Do not automatically warp
background linework with projective transformations or redraw a beloved
location without reviewing it.

## Exactly which active PNGs were resized?

- `assets/Garage/shinonome_warehouse_day.png`
- `assets/Locations/TunerShops/shinagawa_zerosports_day.png`
- `assets/Meet/Day/shibuya_center_gai_day.png`
- `assets/Meet/Day/shibuya_scramble_day.png`
- `assets/Meet/Day/shinagawa_konan_day.png`
- `assets/Meet/Day/shinagawa_oi_wharf_day.png`
- `assets/Meet/Day/yokohama_bay_bridge_day.png`
- `assets/Meet/Day/yokohama_minato_mirai_day.png`

All eight originally had 1536×864 canvases; night versions
already used 1672×941. Their near-identical 16:9 shape allowed
resizing without changing artwork composition or cutting objects off.
Pillow `Image.Resampling.NEAREST` preserves the original pixel-art colors.

## Other audit findings

- Three intentionally duplicated Auto Market nighttime assets/aliases.
- Oshiage paint booth day/night were byte-identical; do not delete without
  verifying whether separate files are needed for time-of-day switching.
- Some Drag Complex crowd tiers use different component dimensions.
  Because those components occupy independent world-space layers, they
  are deliberately excluded from flat 1672×941 scene standardisation.
- Wide Auto Market artwork and portrait-oriented office interiors are
  distinct **story interior subtypes**, not broken garage assets.
- Live gameplay Meet/Garage sprite coordinates are not globally rewritten.
  The renderer correction applies to opt-in Story Director stages first.

## Running the audit

```sh
python3 scripts/audit_backgrounds.py \
  --json docs/background-audit/inventory.json \
  --markdown docs/background-audit/INVENTORY.md
python3 scripts/normalize_backgrounds.py --check
python3 scripts/render_background_review_sheets.py
node --test tests/background-viewport-r645.mjs
```

Normalisation (`--apply`) is restricted to the known eight image
paths and runs through a separate isolated-branch workflow, never on
every main-branch push.
