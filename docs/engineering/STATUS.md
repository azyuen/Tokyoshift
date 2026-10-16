# Engineering overhaul status — 2026-10-16 recovery

## Verified preserved state
- Active development head: cce86ef3f11a08faa1852e471dad23c67ae3636b.
- Recovery handoff: checkpoint/vehicle-engineering-20261016 at ce47d7414bbabf0e020fe712be6f59ccc4014fe7.
- Engine profiles for 43 regular models, normalized stock curves, supported boost/airflow constraints, shared race/dyno build path, simulation-based PI, four fixed factory classes, strict stock recruitment and reversible parts parking are implemented.
- baseline.json and revised.json each preserve 43 vehicles × seven builds. Do not overwrite or regenerate these without a specific validation reason.
- Module query suffixes were removed to avoid duplicate module/registry instances.
- No engine changes have been merged or deployed to main.

## Recovery audit
Workspace maintenance removed the old checkout and uncommitted artifacts. There are no local modifications left to stash. The conversation records a later 53-test engineering suite passing, including profile migration; those test files and expanded scenario JSON were not pushed and must be restored before that result is a durable release gate.
Earlier full-suite comparison found 19 failing files also failing upstream; one additional FD curve assertion expected an obsolete exact sample. Treat this as historical evidence, not a fresh green suite.
Seven hero conversions and duplicate selection had passed. Browser validation never completed: browser installation failed before a game boot was observed. Do not claim a browser or deployment pass.

## Unfinished / highest risks
1. Restore focused engineering tests and preserve their current output immediately.
2. Audit saved simulations for progressions, output consistency, classes, cost and intentional outliers; create reproducible report generation from existing JSON.
3. Review strict recruitment at actual scene entry, hidden legacy upgrades, specialist/dyno state, duplicate instances and parked-part persistence.
4. Check PI runtime cost, correctness of cache keys and parity across garage/dyno/AI.
5. Restore expanded scenario harness. Its prior results were lost, so rerun only missing scenarios when required; never repeat the existing core matrix by default.
6. Browser boot/profile load, garage parking/restoration, dyno and race smoke tests remain mandatory.
7. Compare newer main commits and reconcile deliberately on the engineering branch. Preserve narrative, progression, assets and car assignments.
8. Complete documented primary-source provenance, engineering assumptions, 43-car audit, before/after, stage costs and competitive assessment.
9. No merge, build-version bump or deployment until validation is complete and the owner's release instruction is satisfied.

## Working rule
Commit each bounded unit and update this file with exact commands/results. Main and the recovery branch remain untouched.

## Increment 1 — restored regression gate
Restored `tests/vehicle-engineering.mjs` from the previous conversation, including real profile migration. Fresh command:
`node --test tests/vehicle-engineering.mjs tests/tuner-hero-conversions-r521.mjs tests/selected-car-continuity-r530.mjs tests/startup-import-integrity-r508.mjs`
Result: **69 passed, 0 failed**, recorded in `focused-tests.txt`. This runs only representative PI parity races (16 builds), not the completed full matrix. Stock outputs tolerate <1%; displayed output <1 kW/Nm; PI ET parity <3% against 120 Hz runs.
Current main observed at `0aad895e442753c8ea9b0af1f24e18cc39bb7c17`; it has not been merged into this workstream.

## Increment 2 — saved-data audit and integration fixes
- Preserved datasets verified at 301 rows each. All six standard stages avoid >0.05 s 400 m regressions; FD dyno +1 preset is intentionally slower than balanced maximum hardware (~0.11 s).
- Fixed PI cache identity to include all four transmission difficulty settings.
- Fixed parked parts losing their resale contribution; restoration combines duplicate purchased levels without double-counting.
- Added `tests/engineering-integration.mjs`. Focused gate is now **73 passed / 0 failed**. 43-stock-car PI timing on this Node host: ~131 ms cold / 3.25 ms warm; not a mobile-device benchmark.
- Added `tools/engineering-report.mjs`, `AUDIT.md` and `BALANCE.md`. These regenerate tables from preserved data with SHA-256 provenance; no full core matrix rerun.
- Reports explicitly mark missing year/spec provenance, provisional potential ratings and unresolved endgame dominance. They are development reports, not final sign-off.
- Main has advanced to R540. New recruitment manga selection, deferred loss rematches and removal of Standard standing-start AI boosting overlap MeetScene/RaceScene/crewSystem. These must be reconciled before any release; do not replace them with the old branch implementations. Main has not been merged or modified.

## Increment 3 — recovered supplementary evidence
The expanded scenario JSON was lost before checkpointing, so only those missing runs were repeated (not the preserved baseline/revised core matrix). `tools/engineering-scenarios.mjs` produced **484 records**: 43 models × three stages × low grip / rating-3 driver / 100 km/h rolling, 43 maximum NOS runs, 14 specialist standing/rolling runs and 40 exclusive standing/rolling runs. It saves after each completed race and reuses matching physics/configuration hashes. Reinvocation reports 0 added / 484 reused.
`SCENARIOS.md` records leaders, specialist/exclusive results and separated NOS effects. NSX leads low-grip and 100 km/h rolling max builds; Z33 leads the rating-3 driver sample. The actual registry has 20 exclusive entries, including livery variants. All remain unchanged.
Browser setup now launches Chromium 153. The boot/profile/park/restore test is underway; no browser pass is asserted until its recorded result exists.

## Increment 4 — browser validation completed, release still gated
Fresh local Chromium 153 smoke passed at **1024×768** and **390×844**: initial character screen, fixture profile import, reload to profile selector, continue to garage, selected R34, park purchased parts (419 → 206 kW and stock eligible), restore parts (206 → 419 kW). No page exceptions or HTTP >=400 responses. Results: `browser-results.json`; reproducible harness: `tests/engineering-browser.mjs`. Tablet screenshot inspected; class label fits after width constraint.
The first attempt exposed a pre-existing missing `assets/Garage/workshop_home.PNG` fallback. Replaced its data URL with the existing `shinonome_workshop_day.png` asset; no art changed. Long class/potential text now scales to its existing garage panel width.
Environment caveats: local server, synthetic profile (not the owner's actual save), Chromium viewport emulation (not native iPad Safari), service workers blocked, exact Phaser 3.90.0 served from a local npm copy in place of its CDN request. No live/deployed build, service-worker update, physical touch controls, DynoScene interaction or RaceScene gameplay pass is claimed. Source/dyno/Vehicle numerical parity is covered separately by the 73-test gate, which passed again after UI fixes.

## Next bounded work
1. Reconcile R540 recruitment UI/rematch/AI changes on the engineering branch without losing fixed classes or strict eligibility. Preserve the original character mappings and dialogue; review current source before editing. Main remains untouched.
2. Complete live local DynoScene and RaceScene smoke tests and service-worker/cache transition validation after reconciliation.
3. Restore durable broad-suite comparison; earlier 19 failing test files were pre-existing, but their detailed logs were lost. Update only obsolete assertions directly affected by this overhaul (FD normalization sample), and distinguish pre-existing failures.
4. Finalize tuning-potential grading using cost/versatility as well as power/time, review class-D spread and NSX premium outlier, and close remaining per-variant provenance gaps. Current tables/ratings are explicitly provisional.
5. Finalize release version/cache only after those gates. Do not deploy or merge engine work into main during the ongoing parallel gameplay work.

Recovery rule: core JSON and 484 supplementary results are now on GitHub. Reuse them. Only rerun configurations invalidated by an actual physics change. No engine research restart is needed.

## Increment 5 — current gameplay reconciled on engineering only
Merged main c3819c9 (crew showdown fixes, clipped crew selector, Warehouse kit storage, newer recruitment UI and deferred rematches) into the engineering workstream. Preserved fixed stock classes, strict legacy/NOS eligibility, shared build output, factory parking and all upstream assets/dialogue. Relative JS import URLs remain canonical so registry instances do not split. Easy now uses its declared rating-2 driver instead of inheriting higher personal skill values; Standard keeps upstream Expert-only/no-standing-bonus behaviour.
Warehouse stored kits and factory parking coexist: inactive hardware does not affect stock output/eligibility, restoring recovers purchased levels, and resale counts owned stored parts without duplicating installed copies. Added regression coverage across all 43 models. Focused gate: **75 passed / 0 failed**, saved in focused-tests.txt. Core and supplemental simulation files were not changed or rerun.
This is an engineering-branch reconciliation, not a release: main and the checkpoint branch remain untouched. Version/cache files are inherited from upstream, with no engineering release bump. Earlier browser evidence covers the pre-reconciliation build only. Browser runtime temporary files were removed by workspace maintenance; recreate runtime before claiming new browser validation. Remaining gates are browser dyno/race/cache validation, durable broad-suite comparison, final potential grading and targeted provenance closure.

## Increment 6 — broad comparison and recruitment identity
Added `tools/engineering-regressions.py` and preserved `REGRESSIONS.md` / `regression-comparison.json`: 55 Node files, 21 passing / 34 failing on engineering versus 19 passing / 34 failing on main c3819c9 (two engineering-only files absent upstream). After correcting FD's obsolete exact 303 Nm sample to a 1 Nm tolerance, no additional failing test names remain. This is not a green release gate; sparse-asset failures and obsolete upstream tests remain explicit, and equal failure names do not prove identical causes. Browser tests are excluded by Playwright imports.
Actual local Chromium testing completed a dyno pull (418.9 kW versus 419 displayed) and a stock 206 kW versus 206 kW race with both cars finishing. Screenshot review caught an invalid fixture character/region combination. Added canonical 42-assignment validation at race entry so a mismatched saved challenge fails closed; the corrected Daigo Arakawa/R34/Shinjuku browser rerun remains pending until recorded. Focused gate after this guard: **76 passed / 0 failed**.
A separate real service-worker test replaced R532 with current R548, preserved the synthetic profile and unrelated cache, removed old sentinel content, and served an identical engineering module offline after reload. It does not establish full offline-game support or a deployed update pass. Old in-flight worker requests can briefly recreate an old cache; reload binds requests to the new controller. No service-worker implementation changes were needed.
Corrected audit drivetrain roles using existing magazine metadata where older car objects lack descriptive drive labels. This changes reports only, not physics. No core or supplemental simulations were repeated.

## Increment 7 — corrected scene and cache checks complete
The canonical Daigo Arakawa/R34/Shinjuku recruitment browser rerun passed after the identity guard: both stock cars are 206 kW, both cross 400 m, no false start, and the real results screen appears. The R34 rental dyno pull completes at 418.9 kW against 419 displayed. Garage/profile/park/restore pass at 1024×768 and 390×844; dyno/race run at 1024×768. No page exceptions or HTTP errors. Screenshots inspected locally. Pedals/gears are automated through scene control methods; this is not physical touch testing.
Reproducible local server and cache lifecycle test are now included. Temporary browser binaries were cleared between turns, so the replacement runtime now lives under ignored `artifacts/browser-runtime/`. Set CHROMIUM_PATH, LD_LIBRARY_PATH and PHASER_LOCAL there, then run `python tools/engineering-browser-server.py`; pass `tests/engineering-cache-browser.mjs` to run cache validation separately. Browser fixture data remain isolated from user profiles.
Next work: finalize cost/versatility-aware tuning potential, targeted factory specification provenance (including inherited transmission/year ambiguity), and triage the remaining broad-suite failures with a full asset checkout before release. Reconcile any subsequent main changes deliberately; this branch includes main only through c3819c9. No deploy or merge into main is authorized while these gates remain open.

## Increment 8 — player-facing tuning potential implemented
Replaced provisional peak-power labels with reproducible development grades: 45% maximum standing/rolling/800m pace, 20% intermediate pace, 15% low-grip/imperfect-driver/100km/h-roll versatility, 10% stock-to-max improvement, 10% donor-plus-hardware value. Fixed benchmark definitions, score thresholds, limitations and all 43 results are in TUNING_POTENTIAL.md. No core/supplementary race was rerun and no physics parameter changed.
`node tools/tuning-potential.mjs` derives compact runtime metadata from saved results and current market prices. It does not simulate races. The garage/market shared label uses the new grade; tapping the garage label shows standard maximum output and the first sampled competitive build's total cost including the car. Grades do not affect factory class or recruitment eligibility. AE86 Low → High, NSX High → Exceptional, R34 Exceptional → High: actual usable performance and development cost now matter alongside hardware headroom. Exclusive vehicles remain outside these grades.
Three new regressions validate all 43 generated ratings, price/performance direction, duplicate labels and independence from factory-class eligibility. Focused gate: **79 passed / 0 failed**. Local Chromium garage-only checks pass at 1024×768 and 390×844, including the real label action, profile loading and factory park/restore; screenshot inspected. Saved in potential-browser-results.json. This run intentionally skips unchanged dyno/race simulations. Test fixture now marks unrelated career cutscenes seen to keep the explanation unobscured.
Remaining release gates: targeted historical/variant specification discrepancies, broad-suite failure triage with complete assets, review later main changes beyond c3819c9, and an owner-reviewable playable engineering preview before any main release. Potential grading is implemented for this revision, but must be regenerated if the engineering model or prices change. Main remains untouched.

## Increment 9 — AP1 factory gearing correction and targeted validation
Honda's April 1999 AP1 specification revealed a missing 1.160 primary reduction, incorrect fifth/sixth ratios and a 20 kg mass discrepancy. Corrected these to 1.160 × 4.100, 0.970/0.810 and 1,240 kg. Added one shared effective-reduction helper used by Transmission/AI, PI/rolling selection, race setup and dyno. Existing upgrades/presets remain unchanged. All other regular and exclusive transmission ratios are regression-tested unchanged; the canonical S2000 crew clone inherits its donor's correction.

Reran only seven S2000 core builds and 12 supplementary scenarios with `node tools/refresh-engineering-vehicle.mjs s2000`. Preserved their previous rows in before-spec-correction-s2000.json. Verified all non-S2000 rows are deeply identical to the previous commit (301 core / 484 supplementary records), and baseline.json is byte-identical. Stock 400 m improves 14.367 → 14.276 s; maximum changes 11.491 → 11.510 s. Class B and High potential remain; refreshed score and reports. Fixed report prose: class composites use exact quarter/half-mile splits, not rounded 400/800 m; all 43 scores now have a reproduction test.

Corrected FD metadata year to 1999 to match the retained 280 PS output; no FD physics change. FACTORY_SPECIFICATIONS.md records primary sources, assumptions and remaining SVX/FC/3000GT/Magna variant uncertainties instead of claiming full provenance closure.

Focused command: `node --test tests/factory-specifications.mjs tests/tuning-potential.mjs tests/engineering-integration.mjs tests/vehicle-engineering.mjs tests/tuner-hero-conversions-r521.mjs tests/selected-car-continuity-r530.mjs tests/startup-import-integrity-r508.mjs`. **85 passed / 0 failed**, saved in focused-tests.txt. Scene syntax checks and git diff whitespace checks pass.

Targeted local Chromium 153 test (`tests/engineering-gearing-browser.mjs` through the existing browser server) loads a synthetic S2000 profile, completes an actual DynoScene pull at 183.3 kW versus 184 displayed, and initializes canonical Emi Saionji/Shinjuku stock recruitment at 184 kW each. Dyno, player, AI opponent and rolling helper agree on primary/final reduction. No page exceptions or HTTP errors. Evidence: gearing-browser-results.json. This run does not finish the browser race, test native touch/iPad Safari, load the owner's profile or test a deployed build. The first browser launch failed because the cached executable was truncated; restoring it from the existing compressed package resolved the environment failure.

Next: finish the outstanding variant provenance checks, triage broad legacy-suite failures with complete assets, then reconcile later main changes deliberately and prepare an isolated playable engineering review. No main merge, release-version bump or deployment has occurred. The broader suite is still not a green release gate.
