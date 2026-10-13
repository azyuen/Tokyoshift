# R502 — Galant VR-4 Evolution replaces Lancer Evolution III

## Save-safe clean replacement

The existing base model ID `evo3` is deliberately stable for all existing saves, car copies, crews, achievements, coupons, garages, tuner state, car history, pink-slip challenges, magazine sightings and persisted race offers. **The visible car is now exclusively the Mitsubishi Galant VR-4 Evo.** Keeping this internal ID avoids losing players' tuning and prevents new/old ownership collision. Every reference to `cars.evo3` now resolves to the Galant. No second car or choice between Evo III and Galant is offered.

## Sprite integration

- Ref2 actual files: `assets/Cars/Ref2/galant_stock_body.png`, `galant_stock_paint.png`
- Verified PNGs: **1300×440**, same dimensions
- Both art layers use one shared scale with the AE86, bottom-right anchor and common wheel ground line
- Small 182-source-pixel tyres (`S`)
- Initial registration: rear X = -951, front X = -248 source pixels; can be fine-tuned after in-game review
- Fixed shell above tinted paint; no bodykits until rebuilt
- Driver face anchor updated to the Galant cabin
- The in-game car's save ID is still `evo3`; its visual stem is `galant`

## Galant-specific motor

Unique engine registry ID `4g63t_galant_vr4`. Mitsubishi 4G63T 2.0 DOHC turbo period-inspired Galant mapping: stock **176 kW**, peak **304 Nm**, 0.78 bar reference boost, 7,000 rpm redline, 7,200 rpm limiter, 0.23 inertia and a bespoke turbo torque table. Not the original Evo III's `4g63t`, nor Evo V/VI mappings. Galant mass calibrated to 1380 kg with its own AWD gearbox ratios. Tuning and specialist upgrades still use the existing engine-upgrade progression system.

## Scope

Car market, local meets, competitions, rivals, crew loans, pink-slip rewards and players all see the Galant automatically since each consumes the same catalogue model. The replacement does **not** wipe or reset old player upgrades. No direct modifications are made to serialized user data.
