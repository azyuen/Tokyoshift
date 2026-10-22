# Targeted regression triage — 22 October 2026

Branch: engineering/vehicle-balance-20261015, based on 5043fd6. No merge to main or deployment. Historical broad comparison remains in REGRESSIONS.md; this is not a replacement full-suite result.

## Actual compatibility defect fixed

The owned-copy pattern `[2-9][0-9]*` rejected copy numbers starting with 1 (10–19, 100–199, etc.). Saved records could survive normalization while remaining unregistered/unbuildable; legacy Evo III/22B copies also failed canonical migration. The replacement accepts integers 2 and above without leading zeros. Ownership parsing, canonical migration, Evo IX retirement and EJ1 retirement now agree.

Four new tests cover buildable copies through 100/101, selected-car and purchased-tuning preservation through actual profile normalization, collision-safe mixed old/new garages, coupon merging, migration idempotence, invalid suffix rejection and retired-car copies. No existing IDs or state fields are renamed beyond the already-established migrations.

## Restored AI evidence

Both AI harnesses were blocked by retired `evo3` fixtures. Replaced these with canonical `galant`; missing fixtures now produce an explicit assertion. The fallback rolling calculation now uses Transmission's effective reduction, including AP1 primary reduction. No AI implementation, physics, skill-order assertion or completion threshold was weakened.

Commands and durable output:

- `node tests/ai-driving.mjs` → ai-driving-results.json: 288 runs (three models, two builds, two starts, four ratings, six seeds).
- `node tests/ai-regressions.mjs` → ai-regression-results.json: **1,431 runs pass**, covering five models across five ratings/twelve seeds, catalogue completion, frame rates, NOS behaviour and shift-planner response.
- Focused eight-file engineering suite → focused-tests.txt: **89 pass / 0 fail**.

These AI fixtures include maximum upgrades **with NOS** and dyno bias; they supplement rather than replace the preserved no-NOS balance matrix. They use ordinary-race standing AI adjustments, not Standard recruitment's no-bonus path. Skilled-to-Expert standing-time gaps remain substantial (e.g. stock Galant means ~19.57 versus ~14.81 s); ordered tiers do not establish desirable difficulty spacing. This is an open gameplay-calibration risk, not a reason to silently relax the assertions or change AI during migration repair.

## Sparse-checkout false failures resolved

Materialized tracked assets/Cars/stock, assets/Cars/hero and assets/wheels locally. No asset content, geometry or source references changed.

`node --test tests/stock-assets-r505.mjs tests/gf8-r517.mjs tests/car-reference-geometry.mjs tests/ref2-roster.mjs tests/hero-assets-r525.mjs`

Result: **19 pass / 0 fail**, saved in asset-validation.txt. This covers all 86 regular body/paint PNGs, matching canvases, approved axle registration, 20 fixed-livery collector/hero entries and their standing/rolling completion checks. It does not establish that every unrelated game asset is present in this sparse checkout.

## Remaining failures inspected, not hidden

- galant-vr4-r502 expects the pre-canonical `evo3` registry/save ID. Its assumptions need updating while retaining legacy-save input fixtures; new migration coverage above does not make the old file pass.
- retired-ej1-r503 expects 11 collectors and old regional assignments; the registry has 20. Do not revert current assignments to satisfy old tests.
- regional-engine-balance-r484 assumes the old Tatsumi S2000/Evo roster and historic tuning thresholds. It must be reconciled against current encounter design before treating its assertions as release gates.
- region-crew-tuning-r529 expects the previous six-heat crew format; current branch uses three. This is outside the vehicle parser change.

No fresh browser gameplay, public preview or deployed validation was performed in this increment. The existing 301-row core and 484-record supplementary matrices are unchanged. Next priorities: refresh obsolete integration assertions against current gameplay, resolve factory variant provenance, then deliberately reconcile subsequent main commits and validate an isolated playable engineering build.
