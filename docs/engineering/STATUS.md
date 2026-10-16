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
