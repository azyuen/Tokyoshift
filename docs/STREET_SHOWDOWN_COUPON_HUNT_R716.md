# R716 — Street Showdown coupon distribution and live Office intelligence

## Prize odds and class identity
- **60%** of scheduled Street Showdown invitations offer one coupon; **40%** offer existing cash prizes. Coupon redemption counts, entry fees, cooldowns and the requirement to win all three heats remain unchanged.
- The available prize model is weighted **80%** toward the region's existing Meet favourites *within its preferred factory classes*, **15%** toward any other model of those same classes, and **5%** toward a neighbouring-class wildcard. A region's allowed class envelope protects entry-level areas from unexpectedly high-class prizes. Source of truth for permanent factory classes is `stockClassFor`; no reclassification or vehicle rebalance. **There are no hard-coded RX-8, RX-7 FD, or other model-specific hunting-region exceptions.**
- Regional class focus: Odaiba D/C, Shinagawa C/B, Tatsumi C/B, Shibuya B/C, Yokohama B/A, Daikoku A, Shinjuku A/B. All regular cars in a region's class envelope are potentially attainable; a given model's frequency varies by class and whether it is an existing regional Meet favourite. Existing crew technical rules remain power, NOS and stock restrictions, not these coupon preferences.

## One authoritative day/night refresh
- Street Showdown prize selection now shares the existing **15-minute WorldClock/Open Circuit** rotation; ordinary Meet opponent rosters still refresh every **three minutes**.
- A tiny, deterministic schedule computes prize kind and exact car for every supported Meet location without instantiating Phaser, loading art or simulating opponent tuning. The Office and Meet look up the same rotation index and location. Changing cars, opening the Office or travelling cannot reroll a published prize.
- A full three-heat opponent build is generated **only when the player inspects that Meet Showdown**, preserving the original physics-based build and car matches. The scheduled coupon model is forced into the final heat; if an actual legal build cannot be made, the offer is unavailable rather than silently changed to another prize.
- Already registered competitions preserve their saved fee, opponents, and reward across rotations. Previous unregistered cached invitations are regenerated under the new balance version.

## Office
- CAR COUPONS remains paginated and model-selectable; actual active coupon prizes are listed by **exact region and Meet**, with unlocked/locked status and a next-rotation countdown. A separate section lists future regional hunting leads, classified as **REGIONAL FAVOURITE**, **CLASS MATCH** or **RARE WILDCARD** rather than falsely designating a special home region for any model.
- No large new asset downloads, background races or simultaneous expensive re-renders. While Office is open, only the 15-minute slot change triggers a redraw (checked every 10 seconds). The refresh synchronizes **timing**, not a burst of expensive work.
- No change to normal Meet rivalry, race physics, engine/tuning, AI, pink slips, crew eligibility or professional prize economy.


## R788 update — guaranteed regular-car availability

Every **regular Auto Market car** is still eligible to appear in Street Showdown coupon events in one or more appropriate regional Meets. R716's region-class weighting, while broadly inclusive, did not guarantee that a rare model would actually be drawn within any reasonable time. An Easy-mode 20-win bonus could therefore feel like the only practical way to get that coupon.

R788 replaces the independent model lottery with a finite rotation of the **entire eligible car pool at each Meet**. Each five 15-minute WorldClock rotations include three coupon offers and two cash offers (60% coupons). The three coupon rotations advance the venue's model wheel, and neighbouring venues start at different offsets. All regular models will eventually appear as exact advertised prizes, including less common performance models. This remains deterministic for Office/Meet and is independent of selected player car.

Regional factory-class envelopes, 5/7-coupon redemption requirements, competition fees, actual race opponents/physics, and saved registered events remain unchanged. The 20-win Easy bonuses still exist as optional rewards, not an exclusive path to regular models. Ginza collector/hero cars retain their specialist acquisition rules. Previous unsaved offers are invalidated via the R788 balance version. The Office regional hunt tiers now indicate regional favourite, class match or neighbouring class, not a probability-based frequency guarantee.
