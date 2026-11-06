# Beta triage continuation — 6 November 2026

Candidate R802 includes current main R801 and remains on PR 270, not merged or deployed.

## Runtime repairs

- Return cached/downloaded assets before asynchronous integrity hashing and cache writes complete; keep content revisions and worker lifetime protection.
- Defer character selection and station modules until needed.
- Require explicit factory NOS shots for sealed stock cars; legacy duration fields no longer enable purchased NOS.
- Apply professional event NOS limits to both player and AI runtime configurations without changing saved equipment or engine calibration.
- Sponsor replay uses a temporary active circuit rather than three-car season registration. Preserve exact snapshot restoration and save guards.

## Regression repairs

Historical fixtures predated deployed changes to the canonical vehicle roster, sponsored entries/prizes, three-car registration, season completion, virtual paddock, story continuity, portraits, phone typography and championship presentation. Update those expectations to the current implementations, retaining progression, eligibility, payout, replay, asset and layout checks. No tests are disabled or skipped to obtain a pass.

Faithful Phaser Clamp/Linear helpers support Node performance tests. Version checks validate resolved module paths and synchronized build/cache contracts instead of obsolete hard-coded releases. The manifest contains 767 revisions, including current championship art. The replay browser test waits for the real lazy-loaded Garage implementation.

The original R799 baseline had 168 failing assertions among 1,030 assertions in 177 historical mjs files. A broader audit includes 186 mjs/js test files. All individually identified failures have now passed their focused reruns; the complete migrated workflow runner is being verified.

## Browser evidence

At commit 59c46431462a4e2d94bb82bf0607ee7834ec2112, loading/cache, mobile boot/reload and real-Phaser replay workflows passed. The complete regression workflow still failed before this final historical-test batch. Final candidate verification remains pending.

Physical iPhone XR and iPad Pro 9.7 loading latency, memory pressure and gameplay have not been measured. The dependency-size reduction is not a device timing claim.
