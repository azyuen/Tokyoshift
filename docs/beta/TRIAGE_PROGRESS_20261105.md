# Beta triage continuation — 6 November 2026

Candidate R803 includes current main R802 (88446a9d) and remains on PR 270, not merged or deployed.

## Runtime repairs

- Return cached/downloaded assets before asynchronous integrity hashing and cache writes complete; keep content revisions and worker lifetime protection.
- Defer character selection and station modules until needed.
- Require explicit factory NOS shots for sealed stock cars; legacy duration fields no longer enable purchased NOS.
- Apply professional event NOS limits to both player and AI runtime configurations without changing saved equipment or engine calibration.
- Sponsor replay uses a temporary active circuit rather than three-car season registration. Preserve exact snapshot restoration and save guards.

## Regression repairs

Historical fixtures predated deployed changes to the canonical vehicle roster, sponsored entries/prizes, three-car registration, season completion, virtual paddock, story continuity, portraits, phone typography and championship presentation. Update those expectations to the current implementations, retaining progression, eligibility, payout, replay, asset and layout checks. No tests are disabled or skipped to obtain a pass.

Faithful Phaser Clamp/Linear helpers support Node performance tests. Version checks validate resolved module paths and synchronized build/cache contracts instead of obsolete hard-coded releases. The manifest contains 767 revisions, including current championship art. The replay browser test waits for the real lazy-loaded Garage implementation.

The original R799 baseline had 168 failing assertions among 1,030 assertions in 177 historical mjs files. A broader audit includes 186 mjs/js test files. The full runner also exposed an old wildcard command that launched browser entry points without their browser environment. Wildcards now include every Node test and leave the six browser entry points in their dedicated workflows, with a coverage test enforcing that separation. Additional legacy fixtures now exercise the preserved three-fixture crew-save format, current named-opponent/background scoring, and deployed Chapters 8/10 fingerprints (source verified unchanged from main f652a92). The old AI harness now uses the canonical Galant and actual tuning fields, preserving physical completion/NOS/shift checks across 1,463 simulations. Rolling starts test progression within the legacy and E005 human driver models, rather than requiring the human cadence to always beat the older Skilled model. No production AI or narrative code changed. CI at d5c3afbd ran 1,180 combined assertions: 1,179 passed and one old crew prize assertion still expected 210,000 instead of the deployed 1,050,000. That assertion is now corrected; its 23-test fixture passes. Main advanced to R802 during verification; merge its championship display/dev-entry updates, refresh the three changed image revisions, and advance this candidate to R803. All 47 focused merge/cache/crew checks pass. The complete merged candidate is being verified.

## Browser evidence

At commit 59c46431462a4e2d94bb82bf0607ee7834ec2112, loading/cache, mobile boot/reload and real-Phaser replay workflows passed. The complete regression workflow still failed before this final historical-test batch. Final candidate verification remains pending.

Physical iPhone XR and iPad Pro 9.7 loading latency, memory pressure and gameplay have not been measured. The dependency-size reduction is not a device timing claim.
