# TOKYO SHIFT — Drag Complex Professional Circuit Blueprint (v1)

**Adopted:** 2026-10-08. **Status:** Phase 1 merged (PR #59 / R429); Phase 2 first playable four-wide tournament merged (PR #62 / R443); Phases 3–4 still planned.
**Purpose:** Permanent design and handoff document. Read this before changing the Drag Complex, professional competitions, career unlocks, crew competition, ranking, or Tokyo Championship.

## Product vision and unlock

Street career (seven regional championships, seven crew recruits, recurring regional rivals) leads to a **professional circuit** at Tokyo Drag Complex. The venue remains discoverable/visit-able on its existing seven-regional-championship access rule, so existing saves are not stranded. **Entering professional events** requires recruiting all seven legitimate regional crew members; Arkon Den/developer mode may bypass for tests. A recruitment milestone should lead to an invitation/introduction; the existing `tokyoChampionshipInvited` flag refers to the later championship storyline, **not** open-circuit access. The professional circuit funds crew upgrades and offers a long-lived, repeatable endgame.

## Three competition tiers

1. **Open Circuit:** Rotating, repeatable, short three-race competitions; meaningful but moderate money, driver or crew rating/season points. Eligible classes can specify FWD/RWD/AWD, manufacturer, turbo/NA, kW cap, vehicle mass, NOS on/off, distance and start mode. Existing `PRO_DRAG_EVENTS` in `src/data/centralTokyo.js` remain working during Phase 1.
2. **Five Major Trophies:** Prestige competitions, roughly five *fixtures* each (not necessarily five individual heats), varied round-robin/knockout and discipline. Proposed names: Shuto Speed Trophy (individual/open), Tokyo Technical Trophy (individual/restricted), Tri-Drive Trophy (crew/drivetrain diversity), Team Grand Prix Trophy (crew/open), Tokyo Masters Trophy (mixed). First wins confer durable trophies and substantial prizes, with select rare rewards; repeat wins must be economically controlled. The five trophy slots in HQ should report real wins only after tournament settlement is implemented.
3. **Tokyo Championships:** **Parallel individual Drivers' and Crew titles** with qualifying standards (do **not** make all five trophies mandatory). Proposed each 16 entrants, four groups of four, top two from each group progress to an eight-entrant knockout (quarterfinal, semifinal, final). Three round-robin fixtures + three elimination fixtures for a finalist. Player can leave between matches to adjust tuning, with the **same registered car** throughout an individual championship. Crew registers up to five drivers, fields three each fixture. Race fees, eligibility and prizes are authoritative only at transaction time, not UI state.

## Ranking / living world

Separate persistent long-term **driver rating** and **team rating** (Elo-style relative skill) from **season points** (event placements/qualification). Seed brackets using rating/season rules; #1 plays #16 in a seeded 16-person knockout, higher seeds distributed across round-robin groups. Seed helps earlier matchups but does not protect a competitor from elimination.

Create a stable world roster comprising **seven canonical region rivals** plus many persistent generic professional racers and generic teams. Store per-racer/team rating, points and record per save profile. Canonical rival IDs must remain distinct from playable protagonist identity (existing substitute-identity rules apply when the avatar overlaps). Do **not** force all seven into final eight: allow the world simulation to generate upsets. Personalised cutscenes when encountered; a separate post-championship Champion's Challenge can guarantee a particular story showdown without fixing the tournament bracket.

Progress the world on **in-game event completions**, never real-world time or offline catch-up. Use seeded/deterministic simulation incorporating driving proficiency, car build/performance and upset chance, with consistent brackets and reproducible stored outcomes. Reuse existing actual vehicle/race physics for races the player drives. Off-screen fixtures should use a **lightweight simulation**, not invisible full Phaser scenes. No accidental extra points/cash/advancement from revisiting a result or tapping twice.

## Crew competitions

Player is **manager, not an on-track driver** in crew fixtures. Select three eligible crew drivers from the recruited seven, each racing one heat against corresponding opponent; team wins with two of three heats. Player can scout and choose lineup/order and approved car/preset; AI skill and real vehicle state determine races. For championship squad registration, optionally register five, field three per fixture; provide simulated viewing and skip/fast-forward. Restrictions should be less punishing than individual events and **must not strand users** requiring three identical manufacturer cars without attainable alternatives.

## Progression/economy/UX guardrails

- Genuine expert/elite launch, shifting and NOS strategy; **no hidden speed cheats** to make hard opponents win.
- Meaningful kW/performance categories preserve reasons to own/tune varied cars, including lower-power specialists.
- Prize and fee amounts tuned against actual seven-car upgrade costs. Prevent repeatable high-end cash farming.
- Tuning/garage breaks are allowed between fixtures; preserve registration, match results and standings atomically across PWA close/reload.
- No regression to regional championships, existing street competitions or profile saves.
- Arkon Den should be able to inspect/test all phases.
- Team and driver titles, trophy display and rewards **must derive from saved tournament results**, not placeholders.

## Delivery phases / acceptance

### Phase 1 — Foundation (complete, merged 2026-10-08)
- Add this blueprint and durable ownership guidelines.
- Keep existing venue access; gate **entry into** pro racing behind seven valid crew recruits (dev exception).
- Add versioned, normalized, backward-compatible per-profile professional-circuit state and stable world roster, driver/team ratings, season-points placeholders, deterministic seed functions, and declarative trophy/championship definitions.
- Test new and legacy saves, corrupt payloads, dev bypass, roster uniqueness and deterministic seeding.
- **Explicitly not shipping yet:** visible full leaderboard/season races, Elo updates, actual trophies, team event execution, Tokyo Championships.

### Phase 2 — First playable professional tournament (merged R443, first four-wide cup)
- Dedicated reusable tournament engine, independent of fixed `RaceScene` three-round `competitionState` settlement; do not break street cups.
- Seeded bracket, player event, real rating/season-point updates, robust payout once, save/resume, garage breaks, good UX and regression tests.
- Treat current pro three-round events as legacy until migration is proven.

### Phase 3 — Living season + three-driver crew racing (Astra suggested)
- Background deterministic simulated events, evolving standings, event calendar/rotation.
- Three-driver manager-led crew fixture, roster registration, AI/performance integration.
- Save safety and repeatable simulation tests are prerequisites to merge.

### Phase 4 — Five trophies + Tokyo Championships
- Five varied tournaments, prize economy and collector reward policy; two championship formats and tournament-specific dialogue.
- Trophy-case state wiring, manga/cutscenes with `docs/CHARACTER_BIBLE.md` and `docs/NARRATIVE_AUTHORING.md`; final visual polish and balance.
- Replayable later seasons/title defense.

## Code map and known technical constraints (audited 2026-10-08)

- `src/data/centralTokyo.js`: venue already unlocks at **seven regional championships**, has three current `PRO_DRAG_EVENTS`.
- `src/scenes/CentralTokyoScene.js`: Drag Complex venue, event UI, qualifying, player-specific pro brackets and migrated rivals; `startProBracket` builds existing 3 rounds.
- `src/data/crewSystem.js`: authoritative `isCrewComplete` and `getCrewCount`; `tokyoChampionshipInvited` is tied to later regional crew battles.
- `src/state/GameState.js`: multi-profile save/restore; normalize and snapshot both need new fields; preserve existing saves.
- `src/scenes/RaceScene.js`: `COMPETITION` settlement currently **hardcodes roundIndex <=2**, and pays and clears after 3rd victory. **Do not repurpose this code blindly for long tournaments.**
- `src/data/characters.js`: `MAIN_RIVAL_BY_REGION`, canonical/protagonist substitution and rival progression.
- `src/ui/OfficePanel.js`: trophy case presently a placeholder.
- `docs/CHARACTER_BIBLE.md`: authoritative character narrative canon.

## Next handoff / where to resume

1. Phase 1 completed in PR #59 with passing GitHub foundation checks; build R429. Verify the in-game access gate with Arkon Den and one mature non-dev profile.
2. Phase 2 deployed (R443): test the Four-Wide Open with Arkon Den and a regular seven-crew profile, finish three heats, check rank/cash once, break/resume, mobile composition and saved profiles.
3. On Sunday 2026-10-11, Astra can tackle Phase 3 (living season and three-driver crew racing), while using the proven Phase 2 bracket interfaces; also evaluate routing all professional two-car races to the nearest two lanes of the shared four-lane complex.
4. Phase 4 after genuine individual/crew simulations are demonstrably reliable.

**Design status:** blueprint approved; implementation status must be updated based on actual merges, not presumed from this document.

## Optional four-wide drag development track (R431 prototype)

A dev-only four-lane quarter-mile **sandbox** is implemented in `src/scenes/FourLaneTestScene.js`, accessible via the upper-right **4-LANE TEST** button at Tokyo Drag Complex **only for Arkon Den**. It reuses the existing `RaceScene` car visuals, player controls, car physics and AI driving implementation, with three AI opponents. Four lanes span the upper part of the road; distant cars scale smaller but **front bumpers line up** at staging. Venue-only close-up scenery replaces the racing skyline. Press START for a wider track-preview-to-close-up camera move before the standard amber/green countdown. Placings 1–4 reflect actual quarter-mile crossing times; false starts are DQ, non-finishers DNF.

**This is intentionally not** a professional-circuit event: no cash or profile competition progress, no trophy, no persistent ranking update, no tournament advancement, and no changes to normal two-car race presentation. The sandbox permits Retry / Return to Drag; normal competition code retains its existing three-race rules.

**To validate on device:** inspect four-lane positioning / wheel grounding on narrow iPhones, front-bumper alignment, camera zoom, manual shifting, rivals' launches, live placements, 1–4 final results, and return-to-Drag. Four-wide points events/qualification and richer professional complex art are later design/implementation tasks; never confuse this prototype with the completed tournament engine.

## Phase 2 — First playable 16-driver Four-Wide Open (R443)

The first playable professional tournament uses **exactly the current FourLaneTestScene venue artwork, track geometry, lanes, car perspective, foreground/stands, stage tree and zoom**, with production car physics, three independently driving AI racers, normal manual controls and 1–4 actual finish times. The racing UI has a brief `QUALIFYING/SEMIFINAL/FINAL` title and `TOP TWO ADVANCE` reminder, then fades the new text overlays away before launch. The original **Arkon Den 4-LANE TEST** button remains a no-money/no-record sandbox.

- Enter/continue through `TOKYO FOUR-WIDE OPEN` in the Drag Complex right sidebar. The same seven-crew-member professional access gate applies (dev bypass). Registered car must remain owned; tuning between stages is allowed. Entry ¥90,000 (R447 pricing; previously registered brackets keep their original fee).
- Sixteen persistent professional identities (player + 15 matched by rating) and fixed deterministic seeded qualifying grid: four heats of four, two from each into two semifinals, two from each into the four-car final. The player drives **only their own heat** in each stage; other heats are simulated with an explicit lightweight seeded ET model, not invisible physics scenes or forced narrative finals.
- A single persistent `proCircuit.activeTournament` tracks stages/heats and race results. It is separate from legacy `competitionState`; all normal Street/three-race cup settlement remains unchanged. Closing the PWA after completing a heat preserves the bracket. `NEXT HEAT` or `RETURN TO DRAG` lets players tune/visit the garage before resuming.
- Once the player is eliminated, the rest of the cup is simulated to completion; once the final is raced, real driver standings, player pro rank and season points update. Event entry/cash awards/standings are written **once**, with event IDs preventing duplicate processing of recorded brackets.
- Cash payouts: 1st ¥320k, 2nd ¥170k, 3rd ¥90k, 4th ¥50k, semifinal eliminations ¥12k, qualifying eliminations ¥0. Later repeated cup awards are discounted. Winners are not guaranteed; AI build and player driving decide the live heat.
- Professional results use the user's own selected protagonist portrait and a brief rotating-reveal ranking capsule. Free dev sandbox remains unchanged in its economy.
- During an active Four-Wide Open, legacy event entry is disabled and the registered car cannot be sold at Central Tokyo Auto Market.

**Scope limits:** The original three pro cups still run through the existing two-car engine, with no new pro rating integration. The Four-Wide Open proves the four-lane shared stage; moving *every* two-car professional cup to the nearest two lanes will be a later renderer unification. Crowd-level variants depend on the user's future assets. Season calendar/automatic background progression, crew competitions and Tokyo Championships remain Phase 3/4, not silently implemented here.

**Next user testing:** Arkon Den can enter and play a new cup, inspect minimalist race overlays, place 1–4, see top-two qualification, leave/resume mid-event, confirm a final payout/rank movement, and verify existing 4-LANE TEST and Midnight Cup have no changed settlement behaviour. Test a genuine seven-crew non-dev profile when available.

## R444 hotfix — Four-wide finish and first-heat briefing

**Bug reported:** An R443 Four-Wide Open heat could continue driving long after the quarter-mile timing line, then freeze with no results. Two concrete causes were found:
1. `FourLaneTestScene` created the player's in-race ID as `player`, but the professional tournament engine's registered ID is `player:driver`. The old result payload therefore threw during scoring.
2. Four-wide camera tracked the player indefinitely until a long all-driver/10-second timeout instead of freezing immediately after the first finish.

**Fixed in R444:**
- Professional heats now create the actual registered `player:driver` runner. Arkon Den's non-paying sandbox still uses `player`.
- `src/data/fourLaneFinish.js` supplies reusable meet-style timing: approximately 0.24 seconds after the first finish, lock the scene camera; let all four car sprites fly past the fixed venue; show race results by 2.1 seconds after the first finish (earlier after all finish), or fail safe after 38 seconds if *no* car reaches the finish. Camera, crowd, road and vehicle scale/camera zoom before the finish remain unchanged.
- Brief 160ms results transition followed by a result-title animation (QUALIFIED, ELIMINATED, CHAMPION, RUNNER-UP, etc.). Defensive recovery on tournament settlement failure shows return/retry rather than leaving a frozen race screen.
- New **once per tournament** introductory overlay before the first heat: 16-driver qualifying/semifinal/final structure, top two advance, actual three opponents and their cars, entry fee, top prize, registered-car/save reminder. It must be dismissed with READY TO RACE before stage controls become active.
- R443 saves of an active/pending Four-Wide Open continue unchanged; no second entry charge. The first heat can be rerun if the old build crashed before recording it.
- Added `tests/four-lane-finish-regression.mjs` and GitHub Actions checks for finish camera timing, max flypast, real saved bracket ID, first-heat briefing and existing tournament/Phase 1 compatibility.

**Still pending device validation:** verify finish world art stays frozen while cars pass it, popup is readable on iPhone, results buttons respond, and a paused R443 cup can resume without re-entry fees. Do not claim automated syntax tests prove visual behavior.

## R445 — Shared venue for every professional race; manga results and entry-level economy

- The **approved four-lane track artwork, staging perspective, starting tree, finish fly-past, stands, crowd and camera** is the only professional racing environment. The existing `FourLaneTestScene` renders all four cars in Four-Wide Open and exactly **two cars occupying lanes 1 and 2** for the three introductory professional cups. The free Arkon Den 4-LANE TEST remains intact.
- R445 routes fresh Street Shootout, Midnight Cup and Tokyo Invitational entries to `FourLaneTestScene` in `PRO_DUEL` mode. The historical `competitionState` three-round elimination bracket remains separate from `proCircuit.activeTournament`. Win a round to advance, lose any round to exit, win all three to receive the single cash purse and record one competition win. When returning between rounds, the venue offers **RESUME PRO CUP**. Registered vehicles cannot be sold mid-bracket. An old active bracket retains its stored entry fee/prize.
- Rebalanced **three-round** cup fees and *total purse for winning all rounds*: Street Shootout ¥55,000 / ¥95,000; Midnight Cup ¥65,000 / ¥135,000; Tokyo Invitational ¥80,000 / ¥190,000. The higher-tier Four-Wide Open is ¥90,000 entry / ¥320,000 champion's purse. The standard Easy-mode cash multiplier is preserved to match legacy behavior.
- The paid professional race ending no longer displays an opaque central popup. Over a lightly dimmed frozen race background, the player's **enlarged, masked head portrait in the angled manga panel appears on the left**, the main middle/right headline shows QUALIFIED, ELIMINATED, CHAMPION, RUNNER-UP or other relevant placement, finishing times are displayed as editorial rows, and an animated **angled pro-ranking plaque** shows the actual pro rank before/after on tournament completion. Intro cups display the current pro rank without falsely altering it.
- Results advance with **one full-screen pointer target at depth 295** and Enter key, armed after only 360ms. Qualified / advancing rounds go straight to the next race; eliminations and end-of-event results return to the complex. No invisible low-depth button can intercept the tap or force a 20–30s wait.
- `tests/pro-complex-r445.mjs` validates the entry/prize tiers, all three stages, losses, idempotent payout, two-car renderer dispatch, professional manga artwork and tap depth. Existing four-wide/pro tournament/Phase 1 tests remain required.

**Manual validation still needed:** iPhone legibility/portrait crop/overlap, rapid single tap progression, 2-lane race physical positioning (all four asphalt lanes stay rendered), fee vs purse economics on Standard and Easy, and old R444 in-progress bracket resume.

## R447 — Economy cross-check against regular meet competitions

Regular meet three-round competitions currently offer:
EASY ¥10k/¥20k, MED ¥20k/¥32k, HARD ¥35k/¥48k and ELITE ¥50k/¥70k (entry/prize before rolling bonuses).
The initial R446 introductory cup fees were accidentally priced below ELITE and did not satisfy the intended professional tier.

**Final R447 new-entry pricing:** Street Shootout ¥55k fee/¥95k purse, Midnight Cup ¥65k/¥135k, Tokyo Invitational ¥80k/¥190k, and Four-Wide Open ¥90k entry/¥320k champion purse. All intro prizes are paid only after winning three rounds, with no regular meet competition cooldown. Four-Wide Open pays for placings according to its original prize schedule. The upgraded higher-stakes tournament is more lucrative for winning but risky for fourth or early elimination.

**Save compatibility:** Already-entered competitions still retain the entry fee and purse stored in their `competitionState`, so no mid-event increases. Four-Wide entrants already paid and registered under a previous build are not charged again. R447 pricing only applies to future entries.

## R448 — Three-event Drag Complex menu and editorial result refinement

- The public Drag Complex venue has **exactly three fixed event selection cards** (no extra separate event/test entry buttons): Street Shootout (PRO COMP // DRIVER), Midnight Cup (PRO COMP // DRIVER), and Four-Wide Open (TROPHY COMP // 4-WIDE). The three cards display event name, discipline/format and entry fee only. Team competitions are **not** presented until actual Phase 3 team race simulation exists; the superseded new-entry Tokyo Invitational remains valid for saved legacy brackets and can be resumed from the single main action.
- All selected-event detail belongs in the **right sidebar**: head-to-head round format, requirements, fees and prize, or for Four-Wide 16 entrants / 4 qualifiers / 2 semifinals / final, top-two progression and podium prizes.
- One entry/resume button at the original `SIDE.y + 590`, plus the persistent GO TO MAP button. An active saved pro event uses the same button (never a third “Resume” action elsewhere). Stored legacy fees/prizes and old four-wide brackets remain intact. No new fees charged on resume.
- Arkon Den's 4-LANE TEST button and standalone dev test access are retired. The actual four-lane venue/physics renderer remains named `FourLaneTestScene` internally so old scene keys and dynamic imports remain compatible; it refuses direct non-tournament entry. Old opaque dev results and keyboard retry logic were deleted. Dev REFRESH LINEUP moves from right sidebar to the top-right of the main stage pane and changes future AI lineup rotation **without shuffling the three event slots**.
- Shared manga results retain huge QUALIFIED/ELIMINATED/CHAMPION headline, now with **smaller angled cropped head panel at left**, the stage number and **next stage** explanatory sentence, and lowered finishing-time rows. The wide PRO RANKING rectangle is replaced with a **white/grey Exo 2 italic ranking circle** at lower-right of character portrait; 0.82-second numeric movement remains where the rating changed.
- Professional event-selection UI, event detail sidebar, map button and race results adopt **charcoal/black, off-white, greys and restrained race red**. Venue art, physical lane scales/positions/camera, user-custom controls, AI simulation, fees and progression rules are deliberately unchanged.
- UI tests include active legacy Invitational/unnamed saved brackets, exactly three fixed cards, no direct dev tester entry, no duplicate sidebar fourwide button, stage line, portrait placement, rank badge and tap-anywhere. Automated syntax and data regressions do **not** replace iPhone visual/touch testing.

**Phase 3 still planned:** proper team event simulations, rotating season calendar, venue reputation/crowd density variants, formal five-trophy programme and championships. Keep the three-slot UI architecture and adapt slot event definitions when those systems are genuinely playable.

## R455 — Real spectator density and day/night racing art (Phase 3-ready)

The official professional Drag Complex renderer uses `src/data/dragstripVenue.js` to choose exactly one **five-part** scenery set from the `assets/CentralTokyo/dragstrip` folder per live heat:

| Current playable event | Default crowd tier |
| --- | --- |
| Street Shootout | `low` |
| Midnight Cup | `half` |
| Four-Wide Open | `full` |
| Existing saved Tokyo Invitational cup | `half` |

Each combination of crowd tier `low / half / full` and Tokyo world phase `day / night` loads:
- `{tier}_complex_{phase}.png`
- `{tier}_frontcrowd_{phase}.png`
- `{tier}_standleft_{phase}.png`
- `{tier}_standmid_{phase}.png`
- `{tier}_standright_{phase}.png`
- the matching `assets/Race/Skylines/skyline_shinjuku_{phase}.webp`

All 30 source PNGs are verified by CI as named; the shared `getWorldPhase()` clock drives the phase, not actual clock time, device brightness or a stale race flag. Lock the art during a heat so it cannot pop between phases mid-race, then resolve the live world clock again on the next heat.

Asset keys include both crowd and phase, preventing Phaser from displaying a previously cached version. Remove inactive dragstrip variants and their `SceneTrim` generated textures during preload so iPhone memory does not accumulate all six large-resolution venue sets. This changes no lane geometry, camera perspective, starter tree, venue placement, movement, simulation or match payouts.

For Phase 3, the event/season/rank/crowd-attendance engine may populate a validated `crowdTier` property on the active `competitionState` (three-round duel) or `proCircuit.activeTournament` (four-wide cup). `resolveDragstripVenue({eventId, phase, crowdTier})` will honor it without any asset-renaming or renderer modification. The current presets remain the user-approved defaults.

**Physical iOS validation outstanding:** compare crowd sprite scale and alignment at the start/finish, verify day-to-night change at a world-phase boundary between heats, monitor PWA memory over repeated venue changes, and verify all five chosen PNGs share intended scale/transparency.
