# Beta triage continuation

The initial R800 browser runs passed mobile boot/reload and persistent caching.
Replay Chapters 7 and 8 passed; Chapter 6 timed out. Its test could start a replay
against the active deferred Garage placeholder. It now waits for the actual
Garage implementation to finish create before starting the replay.

Twenty-one historical Node test files omitted Phaser math helpers needed by the
production performance estimator. Add the same Clamp/Linear operations to the
test environment; preserve all original assertions. The crew-renderer mock also
preserves these math helpers when supplying texture constants.

A genuine NOS integration defect treated legacy duration fields in a sealed
stock-car save as factory NOS. Factory detection now requires explicit positive
shot capacity. Purchased collector NOS and disabling NOS pass the existing
focused tests; no engine calibration or race balance changes.

Before interruption, the comparative local rerun reported 136 remaining failures
after these fixes versus the original 168. This is not a clean beta test baseline.
The replay-test adjustment still requires browser CI confirmation. No tests have
been skipped or removed to hide failures. Remaining source snapshots, outdated
fixtures and possible runtime defects still require individual review.

This continuation is saved on PR 270, not merged or deployed.
