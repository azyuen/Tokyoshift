# R716 — Street Showdown coupon distribution and live Office intelligence

## Prize odds and class identity
- **60%** of scheduled Street Showdown invitations offer one coupon; **40%** offer existing cash prizes. Coupon redemption counts, entry fees, cooldowns and the requirement to win all three heats remain unchanged.
- The available prize model is weighted **80%** toward the regional class focus drawn from local Meet favourites, **15%** toward other nearby classes already present in the local Meet pool, and **5%** toward a class-appropriate visiting wildcard. Fallbacks apply if a pool is empty. Source of truth for permanent factory classes is `stockClassFor`; no reclassification or vehicle rebalance.
- Regional class focus: Odaiba D/C, Shinagawa C/B, Tatsumi C/B, Shibuya B/C, Yokohama B/A, Daikoku A, Shinjuku A/B. Existing crew technical rules remain power, NOS and stock restrictions, not these coupon preferences.

## One authoritative day/night refresh
- Street Showdown prize selection now shares the existing **15-minute WorldClock/Open Circuit** rotation; ordinary Meet opponent rosters still refresh every **three minutes**.
- A tiny, deterministic schedule computes prize kind and exact car for every supported Meet location without instantiating Phaser, loading art or simulating opponent tuning. The Office and Meet look up the same rotation index and location. Changing cars, opening the Office or travelling cannot reroll a published prize.
- A full three-heat opponent build is generated **only when the player inspects that Meet Showdown**, preserving the original physics-based build and car matches. The scheduled coupon model is forced into the final heat; if an actual legal build cannot be made, the offer is unavailable rather than silently changed to another prize.
- Already registered competitions preserve their saved fee, opponents, and reward across rotations. Previous unregistered cached invitations are regenerated under the new balance version.

## Office
- CAR COUPONS remains paginated and model-selectable; actual active coupon prizes are listed by **exact region and Meet**, with unlocked/locked status and a next-rotation countdown. A separate section lists future regional hunting leads, explicitly distinct from current prize guarantees.
- No large new asset downloads, background races or simultaneous expensive re-renders. While Office is open, only the 15-minute slot change triggers a redraw (checked every 10 seconds). The refresh synchronizes **timing**, not a burst of expensive work.
- No change to normal Meet rivalry, race physics, engine/tuning, AI, pink slips, crew eligibility or professional prize economy.
