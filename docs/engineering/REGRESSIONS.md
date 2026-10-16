# Broad regression comparison

Engineering checkpoint: `af797594c50f538d73334c47f76cca78b611f3ec` plus the FD 1 Nm tolerance correction.
Baseline: `c3819c9fe618c6285122646f81c4e7a3f9e903f3` in an isolated worktree.

Command: `python tools/engineering-regressions.py --baseline /tmp/tokyo-main-baseline`

55 Node test files: engineering **21 pass / 34 fail**; main **19 pass / 34 fail**, with two engineering-only files absent. All failing test names also fail on main after correcting the obsolete FD exact sample. This is **not** a green release gate: equal names do not establish identical failure causes or validate unexecuted assertions. Browser tests are excluded by Playwright import detection and run separately.

Both worktrees are sparse. Asset checks can fail because real tracked images are not materialized; these failures do not establish missing production assets. Several legacy tests use retired IDs (`evo3`, `wrx22b`), old roster expectations or UI-source patterns. Do not weaken unrelated tests simply to obtain a green count.

Machine-readable counts, failing test names, diagnostic excerpts and full-log hashes are in `regression-comparison.json`. Full local logs are under `artifacts/engineering/regressions/` (not committed). The command reproduces them. The focused engineering gate is independent; it subsequently reached 76 passing tests after adding canonical recruitment-identity validation. This broad comparison predates that final guard.

| Test file | Main pass/fail | Engineering pass/fail | Missing-file diagnostic |
|---|---:|---:|---|
| ai-driving.mjs | 0/1 | 0/1 | no (not proof assets exist) |
| ai-regressions.mjs | 0/1 | 0/1 | no (not proof assets exist) |
| car-reference-geometry.mjs | 2/1 | 2/1 | yes |
| car-reference-rollout.mjs | 4/0 | 4/0 | no (not proof assets exist) |
| central-tokyo-startup-r449.mjs | 3/0 | 3/0 | no (not proof assets exist) |
| character-control-assets-r458.mjs | 2/3 | 2/3 | yes |
| character-dialogue-r532.mjs | 7/0 | 7/0 | no (not proof assets exist) |
| drag-complex-r448.mjs | 4/1 | 4/1 | no (not proof assets exist) |
| dragstrip-parent-cleanup-r456.mjs | 2/2 | 2/2 | yes |
| dragstrip-venue-variants-r455.mjs | 3/2 | 3/2 | no (not proof assets exist) |
| engineering-integration.mjs | absent | 6/0 | no (not proof assets exist) |
| four-lane-finish-regression.mjs | 4/1 | 4/1 | no (not proof assets exist) |
| four-lane-prototype.mjs | 12/0 | 12/0 | no (not proof assets exist) |
| galant-vr4-r502.mjs | 0/4 | 0/4 | no (not proof assets exist) |
| gf8-r517.mjs | 2/1 | 2/1 | yes |
| hero-assets-r525.mjs | 5/1 | 5/1 | yes |
| magazine-issue01-r486.mjs | 8/1 | 8/1 | no (not proof assets exist) |
| meet-refresh-r469.mjs | 5/0 | 5/0 | no (not proof assets exist) |
| meet-rival-cars-and-profiles-r500.mjs | 2/2 | 2/2 | yes |
| opening-chapter-r467.mjs | 22/10 | 22/10 | no (not proof assets exist) |
| opening-phone-prototype-r515.mjs | 4/1 | 4/1 | no (not proof assets exist) |
| oshiage-coaching-r509.mjs | 4/0 | 4/0 | no (not proof assets exist) |
| oshiage-manga-r511.mjs | 5/0 | 5/0 | no (not proof assets exist) |
| oshiage-r496.mjs | 7/1 | 7/1 | no (not proof assets exist) |
| oshiage-race-coach-hud-r513.mjs | 4/0 | 4/0 | no (not proof assets exist) |
| oshiage-rims-r501.mjs | 8/2 | 8/2 | yes |
| oshiage-school-polish-r512.mjs | 3/1 | 3/1 | no (not proof assets exist) |
| oshiage-showdown-r522.mjs | 8/0 | 8/0 | no (not proof assets exist) |
| oshiage-ui-r510.mjs | 3/2 | 3/2 | no (not proof assets exist) |
| oshiage-yuna-rolling-r507.mjs | 4/2 | 4/2 | no (not proof assets exist) |
| pinkSlipProgression.test.mjs | 4/0 | 4/0 | no (not proof assets exist) |
| pro-circuit-foundation.mjs | 5/2 | 5/2 | no (not proof assets exist) |
| pro-complex-r445.mjs | 8/1 | 8/1 | no (not proof assets exist) |
| pro-season-crew.mjs | 16/7 | 16/7 | no (not proof assets exist) |
| pro-tournament-phase2.mjs | 8/1 | 8/1 | no (not proof assets exist) |
| proSeason.simulation.test.js | 9/0 | 9/0 | no (not proof assets exist) |
| progression-rebalance-r479.mjs | 9/0 | 9/0 | no (not proof assets exist) |
| r488-reference-fixes.mjs | 2/1 | 2/1 | no (not proof assets exist) |
| race-dialogue-standard-r514.mjs | 4/0 | 4/0 | no (not proof assets exist) |
| ref2-body-alignment.mjs | 4/0 | 4/0 | no (not proof assets exist) |
| ref2-roster.mjs | 2/1 | 2/1 | yes |
| region-crew-tuning-r529.mjs | 5/1 | 5/1 | no (not proof assets exist) |
| region-unlock-oshiage-r531.mjs | 8/1 | 8/1 | no (not proof assets exist) |
| regional-engine-balance-r484.mjs | 3/2 | 3/2 | no (not proof assets exist) |
| retired-ej1-r503.mjs | 1/3 | 1/3 | no (not proof assets exist) |
| sayaka-reika-continuity.mjs | 3/2 | 3/2 | yes |
| selected-car-continuity-r530.mjs | 6/0 | 6/0 | no (not proof assets exist) |
| shibuya-asset-rename-r459.mjs | 1/2 | 1/2 | yes |
| shinagawa-zero-sports-r526.mjs | 4/1 | 4/1 | no (not proof assets exist) |
| startup-import-integrity-r508.mjs | 2/0 | 2/0 | no (not proof assets exist) |
| stock-assets-r505.mjs | 2/2 | 2/2 | yes |
| stock-expansion-r516.mjs | 3/0 | 3/0 | no (not proof assets exist) |
| tokyoChampionship.simulation.test.js | 4/0 | 4/0 | no (not proof assets exist) |
| tuner-hero-conversions-r521.mjs | 8/0 | 8/0 | no (not proof assets exist) |
| vehicle-engineering.mjs | absent | 53/0 | no (not proof assets exist) |
