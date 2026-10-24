# R683 — Aruken Denzaki suited-portrait audit (25 October 2026)

## Source assets and identity
- Internal character ID **arkonDen** and filename stem **arkon_den** are preserved. In-world dialogue addresses him as **Aruken Denzaki**.
- **Standing/full-body suited actor:** `assets/Characters/Main/arkon_den_suit.png` via `ginzaSuit`. Do not substitute portrait art for a standing workshop/gala/stage actor.
- **Manga suited Dev portraits:** `assets/Characters/Dev/arkon_den_{idle,talking,laughing,serious,angry,blushing,nervous,sad}.png`. The last four (angry, blushing, nervous, sad) were uploaded immediately after R682 and were previously unregistered.
- Physically pixel-inspecting the binary PNGs was not available through the GitHub text connector. File existence, asset mapping, script use and sprite preload/runtime code were audited. Mobile visual framing should be smoke-tested, especially switching between new portraits.

## Before R683
- `ginzaSuit` served as one unchanging manga image even when Aruken spoke, listened, blushed or argued.
- R682 locked every Chapter 7 “A NEW LOOK” page to `ginzaSuit`, preventing expressive changes for the compliment moment.
- Chapter 8's final “THE PRICE OF AMBITION” uses casual poses right after the formal party; Chapter 9's unspeaking suited Aruken could revert to casual `storyIdle` in the private-sale cutscene.
- Suited Dev facial variants were present, but only four of eight had catalog entries.

## Changes (no new dialogue)
- All eight suited Dev expressions are registered in `characters.js` and use the existing case-insensitive pose lookup.
- In **MangaCutscene only**, an authored `ginzaSuit` becomes `devTalking` when Aruken speaks and `devIdle` while another actor speaks. Explicit `devAngry`, `devBlushing`, `devNervous`, `devSad`, `devLaughing` and `devSerious` remain selected as authored.
- This same pose resolution runs during **page-specific asset preloading** and **portrait rendering**, so the renderer will not silently fall back to the casual sprite because a Dev pose was never queued.
- Chapter 7 compliment: `devBlushing`, with every other portrait in the same suited family. The mechanics/specialists remain in mechanic outfits.
- Chapter 8 gala: playful/blushing with Sayaka; serious for technical assurance; angry during the dispute; nervous for the security terms and Sayaka's departure; sad after the contract signature. The late gala no longer silently switches to casual.
- Chapter 9 refusal: consistent formal outfit for both speaking and dimmed characters, with `devSerious` for his firm decision. Sayaka also remains in her evening dress while she listens.
- Chapter 10: warm/laughing Ginza opening, serious acknowledgement of Sayaka's work, blushing/nervous final invitation. Earlier engineering and later Yokohama scenes retain their deliberately **casual** poses.
- Developer-only `devVaultNightOut` uses the shared resolver when a page calls for `ginzaSuit`; it does not require a separate rewrite of its branching script.

## Guardrails / verification
- No change to story step count, checkpoint indices, prose, player choices, saves, car ownership or racing systems.
- Career characters, other people's outfits, full-height `STAGE` actors and non-formal Aruken manga scenes are untouched.
- Targeted test file: `tests/arkon-suited-portraits-r683.mjs`. Run with the existing Chapter 7–10 regression suites and review PWA version/caching as part of release.
