# R525 hero asset rollout

All 16 uploaded bodies in `assets/Cars/hero` are fixed-livery, body-only
reference assets. No generated paint masks or edits to the supplied art.
`heroCarAssets.js` owns measured right-origin axle centres and per-axle sizes.
Each body is 1300×440 except Esprit NSX (1350×440).

Wheel sizes are visual: small 182px, medium 194px, large 210px. Stock geometry's
legacy `L` still means 194px; it is not the new hero large size. Each tyre touches
the same ground line, including when mirrored or viewed at different zooms.
Vehicle wheel radius, gearing and physics are not changed by visual sizes.

Explicit user sizes: Top Secret M/M; VeilSide M/S; Liberty Walk L/M; RWB M/S;
Mäkinen M/M. Unspecified sizes were selected against the supplied arches.
Existing dedicated wheel textures remain in use. The newly supplied Castrol,
ZERO/SPORTS, McRae, Mäkinen and Renown wheel textures are now connected.

## Collector identities and gameplay profiles

Existing eleven IDs and seven tuner conversions are preserved. Five new IDs
join Ginza's existing rotating collection, without entering stock markets,
coupons or street encounter pools:

| ID | Build | kW | Nm | Drive | kg | Ginza price |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| cleanMazda787B | Same R26B profile as Renown, clean orange body | 515 | 608 | RWD | 830 | ¥220m |
| zeroSportsGc8 | EJ20 tuner game specification | 294 | 480 | AWD | 1220 | ¥38m |
| castrolMugenNsx | Naturally aspirated C32B GT500 game specification | 368 | 400 | RWD/mid | 1150 | ¥160m |
| mcrae22B | EJ22G 22B specification with McRae-era tribute livery | 206 | 363 | AWD | 1270 | ¥30m |
| tommiEvo6 | 4G63 Group A rally game specification, not the road TME | 221 | 510 | AWD | 1230 | ¥65m |

Curves and race/tuner outputs are gameplay approximations, not measured dyno
data for the depicted chassis. The 22B baseline follows STI's published 1998
specification: https://www.sti.jp/en/roadcars/1998/impreza-22b.html
It uses a new collector ID and engine key so the historical `wrx22b`→`gc8`
stock-save migration cannot rename it. The clean and Renown 787Bs remain
separately ownable but have identical performance.

Updated stock art: R34 now uses its measured 1300×440 canvas and revised axles;
S2000 uses revised axle centres and no old body-height correction. NSX retains
its matching measured axle positions and uses the taller supplied layers.

Verification: `node --test tests/hero-assets-r525.mjs` checks paths, canvas sizes,
no paint requests/tint, staggered fit, mirrored ground contact, save identity,
legacy-baseline exclusions and standing/rolling half-mile completion for all
16 collectors. Existing reference and tuner-conversion regressions also run.
