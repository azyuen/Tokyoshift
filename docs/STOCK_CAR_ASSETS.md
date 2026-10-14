# Tokyo SHIFT stock cars — canonical asset folder (R505)

All **28 deployed standard car models** now load their two transparent PNG
layers from `assets/Cars/stock/` (lowercase). This replaces the former
`assets/Cars/Ref/` and `assets/Cars/Ref2/` folders.

The **56 existing PNGs** (28 matching BODY/PAINT pairs) were moved unchanged,
using the same Git blob hashes, case, canvas dimensions, pixel density, relative
geometry, paint layers and bottom-right anchor.

## Adding a new stock model

1. Put `<stem>_stock_body.png` and `<stem>_stock_paint.png` in
   `assets/Cars/stock/` on matching-size transparent canvases.
2. Add the game's vehicle/engine specifications in `src/data/cars.js` or
   update an existing model's configuration.
3. Register axle X coordinates and S/L tyre size in
   `STANDARD_CAR_REFERENCE.cars[stem]` in `src/data/carReferenceGeometry.js`.
4. Add canvas `[width, height]` in `REFERENCE_CAR_CANVAS[stem]` and map
   `REFERENCE_CAR_GAME_IDS[gameId]` to its asset stem.
5. Ensure the shared AE86-derived 0.32 source scale, nose/right alignment and
   ground/wheel registration remain correct. Use `body-alignment.html` to
   calibrate heights and wheel positions if needed.

The universal `getReferenceAssetRoot()` now always resolves to
`assets/Cars/stock`; there is no Ref-vs-Ref2 dispatch.

The 11 hero/collector cars intentionally remain as single-body files directly
in `assets/Cars/`. The prior root-level stock/bodykit assets were separately
archived in [the permanent legacy ZIP release](https://github.com/azyuen/Tokyoshift/releases/tag/legacy-car-assets-2026-10-14).

The migration doesn't modify saved profiles, installed upgrades, decal
placements, physics, wheel registration or existing game car IDs.

## Approved future roster replacement (2026-10-15)

The previously planned **Subaru Legacy GT-B wagon (BG5/BH5)** is **removed from the future roster plan** in favour of the **1999–2000 Subaru Impreza WRX STI Version VI (GF8)** five-door sports wagon/hatchback. This also supersedes the briefly selected third-generation GRB hatchback.

The approved **GF8** is the **206 kW (280 PS) / 353 Nm** JDM EJ207-powered Version VI, weighing **1,310 kg**, with AWD and a **five-speed manual**. The intended unique game ID is `gf8`; proposed stock and modified Auto Market prices are **¥3,500,000** and **¥4,200,000** respectively. This remains **planned, not deployed**: only register it once the user uploads a matching GF8 BODY/PAINT asset pair and the geometry/engine/market configuration is calibrated.

The GT-B and GRB were **never deployed**. The deployed **Subaru Legacy B4 RSK sedan** (`b4rsk`) and **Subaru Impreza 22B STI** (`wrx22b`) remain unchanged. See [canonical GF8 roster and asset-intake specifications](PLANNED_GF8_WRX_STI.md) for exact model identification, sources and asset naming.
