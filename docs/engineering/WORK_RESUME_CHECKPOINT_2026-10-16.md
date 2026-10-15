# Tokyo SHIFT — Vehicle Engineering Work Resume Checkpoint
Date: 2026-10-16 (Australia/Melbourne)
Repository: azyuen/Tokyoshift

## Purpose
Protect the existing partially implemented 43-car (42 production cars + developer Mitsubishi Magna) engineering/tuning/class overhaul while the owner's ChatGPT Work allowance resets. Resume the work already completed; **do not restart the audit, recreate existing models, or silently overwrite work**.

## Version control: established facts at checkpoint
- Active engineering development branch: `engineering/vehicle-balance-20261015`.
- Backup branch created from that exact engineering branch state on 2026-10-16: `checkpoint/vehicle-engineering-20261016`.
- At checkpoint, GitHub comparison `main...engineering/vehicle-balance-20261015` reported 2 commits ahead and 1 behind; `main` was at `e09a168d8d9f8fd9ec97d15a092131cfd3a35d7a`, and merge base was `ccc9ebb21bf0fe2c8b38f8ac4c36204121b82cac`.
- The engineering code is NOT merged into `main`. Continue ordinary gameplay tests from `main` or isolated non-engineering branches; do not make a gameplay-testing run depend on unvalidated engineering changes.
- This note describes only **work pushed to GitHub**. Changes/test outputs still inside a prior ChatGPT Work computer that were never committed and pushed cannot be verified here.

## Artifacts already present on the engineering branch
- `src/data/vehicleEngineering.js` — engine-family hardware envelopes and engineering parameters, including flow, displacement, compression, BMEP, boost and factory references.
- `src/data/stockClasses.js` — stock classes and per-car tuning-potential labels derived from simulated baseline metrics.
- `src/data/factorySetup.js` — factory configuration support.
- `src/data/cars.js`, `src/data/engines.js`, `src/data/tuning.js`, `src/data/secondaryTuning.js`, `src/data/stage3Calibration.js` — modified car definitions/tuning integration.
- `src/vehicles/{Engine,Transmission,Turbo,Clutch,NitrousSystem,Tyres,Vehicle,VehiclePerformance,PerformanceEstimate}.js` — physics/performance work.
- `tools/vehicle-balance.mjs` — deterministic 120 Hz race simulation/reporting tool; iterates `carOrder` plus `magna`, seven build levels (`stock`, `budget`, `street`, `intermediate`, `advanced`, `max`, `dyno`), standing and 60 km/h rolling starts.
- `docs/engineering/baseline.json` and `docs/engineering/revised.json` — committed simulation data from the previous Work run. Treat as historical evidence; preserve before any regeneration.
- Various integration changes across the game import graph, meet/AI/dyno/crew/UI scenes.

Presence of these files does **not** certify that the overhaul is correct, complete, tested or release-ready. No final engineering review/report or passing test run has been independently verified at this checkpoint.

## Safe sequence when Work allowance returns
1. Open the **original engine-overhaul Work conversation** (prefer continuity with its prior tools and reasoning). Read the most recent Work status and attempt to locate any uncommitted files, analysis or reports remaining in its own environment. If accessible, back them up immediately via commits or exported files.
2. Inspect `engineering/vehicle-balance-20261015` and this checkpoint branch, not just `main`. Check status, commit ancestry, changed files and the full existing `docs/engineering` datasets. Do not redo work already reflected in these files.
3. Before editing, write a brief verified progress inventory: done, partially done, untested, outstanding, and highest-risk regressions. Cross-check it against the original 43-car overhaul specification.
4. Resume simulations and tests **incrementally**, inspecting the existing runner first. Example invocation (in an appropriate Node environment): `node tools/vehicle-balance.mjs docs/engineering/results.json`. Do not replace the saved baseline/revised datasets without first preserving copies.
5. Verify factory-stock per-car outputs, physically differentiated progression, upgrade economy, classes, AI and opponent selection, Race/Dyno parity, save compatibility, and broader regressions. Add repeatable assertions/report tables where missing. Only claim validation for tests actually executed.
6. Inspect and incorporate changes made to `main` after the engineering branch diverged. Resolve conflicts carefully; do not force-push or indiscriminately overwrite either branch. Keep engine work on its own branch until ready for deliberate review/merge/deployment.
7. Maintain a concise, committed `docs/engineering/STATUS.md` or equivalent after each major unit: implemented changes, exact tests and results, problems, next actions and relevant commit SHAs. This avoids re-exploration if credits run out again.
8. Ask the owner before replacing live engine behaviour or shipping the partially validated overhaul to `main`.

## Owner's current parallel-work preference
While the engineering overhaul is paused, allow separate simpler gameplay tests and fixes to proceed on `main` or their own branches. Avoid changes to `src/data/vehicleEngineering.js`, `src/data/stockClasses.js`, `tools/vehicle-balance.mjs`, or the committed engineering result files outside the engineering workstream.

## Resumption instruction for Work
**Continue from the existing branch and data above. First inventory and preserve any uncommitted Work-session state. Do not start over, do not rerun expensive full-matrix tests until required by a specific unresolved validation gap, and do not merge into main until the user's approval and regression checks.**
