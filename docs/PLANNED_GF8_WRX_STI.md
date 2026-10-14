# Planned stock car: Subaru Impreza WRX STI Version VI (GF8)

**Status: APPROVED FOR FUTURE DEPLOYMENT — NO ASSETS SUPPLIED; NOT PLAYABLE.**
**Roster decision:** 2026-10-15. This decision supersedes the earlier plan for a Subaru Legacy GT-B wagon and the briefly recorded GRB hatchback. Neither of those planned cars was deployed.

## Canonical identity

- Game ID (when deployed): `gf8` — a new ID; do **not** reuse `b4rsk` or `wrx22b`.
- Game short name: `GF8 WRX STI`
- Game display name: `Subaru Impreza WRX STI GF8`
- Reference trim: **JDM 1999–2000 Impreza Sports Wagon WRX STi Version VI**, five doors (GF8G5ED; GF-GF8).
- Body: first-generation GF8 five-door compact sports wagon / hatchback, **not** GRB, GC8 sedan or Legacy GT-B.
- Suggested description: `Rally-bred five-door STI with lightweight AWD traction and an eager EJ207 turbo.`

## Approved specifications

| Attribute | Decision | Source or note |
| --- | --- | --- |
| Engine | EJ207, EJ20-family 1,994 cc DOHC turbo flat-four | MY00 Version VI GF8G5ED listed with EJ207DW1PR |
| Power | **206 kW (280 PS) at 6,500 rpm** | Subaru Japan catalogue |
| Torque | **353 Nm at 4,000 rpm** | Subaru Japan catalogue |
| Mass | **1,310 kg** | Subaru Japan catalogue, WRX STi Version VI wagon |
| Drivetrain | AWD | JDM GF8 Version VI |
| Gearbox | **5-speed manual** | JDM GF8 Version VI |
| Proposed Tokyo SHIFT stock/base price | **¥3,500,000** | Game-economy design choice, not real-world valuation |
| Proposed modified Auto Market listing | **¥4,200,000** | Game-economy design choice; 20% over stock |

The original Japanese list price was **¥2,919,000** (1999), but game pricing above is deliberately different to fit the existing Auto Market progression.

Design positioning: stronger performance than most early AWD cars, but slightly heavier and lower-torque than the game's existing Subaru Impreza 22B STI (206 kW, 363 Nm, 1,270 kg). The GF8 should cost less than the existing 22B (¥6,200,000 base) and be in the same neighbourhood as an Evolution V (¥3,900,000 base). Final engine torque-curve shaping, gearing, physics and race balance should be tuned when it becomes playable.

## Asset intake / activation

The user will upload remaining stock-car art **later**. Do not add this to live `cars`, `carOrder`, market listings, rivals, coupons, engine tables or preloads until its completed canonical sprite pair is available.

Expected filenames in `assets/Cars/stock/`:
- `gf8_stock_body.png`
- `gf8_stock_paint.png`

Match BODY and PAINT canvas sizes; transparent background and separated outlines/window/light versus tintable paint, respectively. Use the AE86 **only** for pixel-density, rendering scale, wheel-ground registration and alignment — **never** as a silhouette or window/proportion template. GF8 should use its own true five-door wagon roof, rear quarter and hatch geometry. The front of the car faces right. Canvas may be sized to preserve real relative proportions; do not assume 1166×420 is mandatory.

At asset deployment, measure and register GF8 axle centres/tyre size/body-seat offsets from the **actual** uploaded sprites in `src/data/carReferenceGeometry.js`, then register the new car, EJ207 engine torque curve, prices and market listing. Keep existing saves and car IDs unchanged.

## Unaffected deployed cars

- `b4rsk`: Subaru Legacy **B4 RSK sedan** remains live.
- `wrx22b`: Subaru Impreza **22B STI** remains live.

## Historical specification references

- [Subaru Japan catalogue — 1999 September WRX STi Version VI five-door](https://ucar.subaru.jp/php/catalog/grade.php?baitai=iphone&cat_id=4501956) (limited trim: power, torque and mass match).
- [Toyota GAZOO catalogue — 1999 September Impreza Sports Wagon WRX STi Version VI](https://gazoo.com/catalog/maker/SUBARU/IMPREZA_SPORTS_WAGON/199211/4501747/).
- [Impreza WRX Owners Club applied-model code table](https://www.type-ra.com/what-model-is-my-impreza/) — GF8G5ED MY00 / EJ207DW1PR versus ordinary GF8 WRX EJ205.
