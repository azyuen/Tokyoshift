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
