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
