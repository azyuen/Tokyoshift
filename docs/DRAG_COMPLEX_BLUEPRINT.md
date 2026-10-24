# TOKYO SHIFT — Drag Complex Professional Circuit Blueprint (v1)

**Adopted:** 2026-10-08. **Status:** Phase 1 and Phase 2 merged; Phase 3 living season and player-driven crew racing implemented (R470/R485); rotating season-choice corrections and the unified Tokyo Championship remain to implement. **Championship design revised 2026-10-11**; the section below is authoritative over historical milestone notes.
**Purpose:** Permanent design and handoff document. Read this before changing the Drag Complex, professional competitions, career unlocks, crew competition, ranking, or Tokyo Championship.

## 2026-10-18 R584 decision — prestige trophy tournaments (supersedes short R575 trophy event format)

Five minor trophies are now standalone, persistent multi-stage competitions: Shuto Speed and Tokyo Technical are five driven knockout duels; Tri-Drive and Team Grand Prix are three saved 3v3 fixtures (nine driven heats); Tokyo Masters is a three-fixture crew invitational with DUEL / RELAY / FOUR_WIDE formats. They remain voluntary **Open Circuit** activity, award zero season/championship points, do not advance the eight-round calendar, and preserve completed trophy records and ownership. Only completion awards trophy wins; results and stages persist until completed or eliminated. Legacy three-round driver/crew races continue unchanged.

- **Shuto Speed:** season 1 onward; open power/no-NOS restriction; entry ¥75k; first-win purse ¥230k, subsequent ¥85k.
- **Tokyo Technical:** season 1 onward; 260 kW maximum, NOS prohibited; entry ¥65k; first-win purse ¥215k, subsequent ¥80k.
- **Tri-Drive:** season 2 onward; one FWD, one RWD, one AWD in a three-driver roster; three full fixtures; entry ¥85k, first prize ¥265k.
- **Team Grand Prix:** season 2 onward, ranked team series; entry ¥100k, first prize ¥300k.
- **Tokyo Masters:** season 3 onward, must have won two different trophy titles; mixed three-fixture team gauntlet including four-wide finale; entry ¥125k, first prize ¥375k.
- Successful and unsuccessful attempts are recorded in trophyHistory (including car or crew and season); only victories increase trophyWins. A completed attempt rotates invitations and triggers two independent-event cooldown; eligibility skips trophies not yet unlocked.
- **Presentation scope:** existing Drag Complex cards, professional results, crew paddock and permanent trophy counter now convey prestige, stage/fixture progress and specific restrictions. Further custom trophy art, award cinematics, a full tournament bracket presentation, reward items and a four-wide finale for Shuto are future visual/content enhancements, **not yet implemented**.
- The separate engineering/vehicle-balance branch is not merged by this feature. Rival car physics use the existing production engine.

## 2026-10-17 R575 decision — voluntary professional season (historical; trophy format superseded by R583)
This accepted progression update supersedes earlier notes implying immediate automatic season scoring upon Drag Strip access.

- **Open Circuit:** On initial unlock and between completed/forfeited seasons, the Drag Strip offers three short one-off event choices: rotating Driver, Crew, and one of five rotating minor trophies. Each competition charges one entry fee, offers modest cash rewards, and runs real player-driven professional heats. All standalone results have **zero official season points** and never advance the eight-round calendar. Trophy wins update permanent trophy collection. A completed minor trophy rotates to the next of the five, with cooldown measured by **two other completed independent events**, not wall-clock waiting. This minor-trophy format is deliberately shorter than the original five-fixture prestige trophy concept.
- **Start Pro Season:** The player registers deliberately using a confirm action. The eight-round official calendar then replaces the three open choices. Exactly one event choice per round is retained. Existing cars, tuning, garages, and street meets remain accessible between professional fixtures.
- **Withdrawal:** A confirm-to-forfeit action archives the attempt, clears current-season scoring and active professional fixture, and returns to open-circuit preparation. Ownership, finances, previous trophies, ratings and achievements survive. Championship-qualified seasons must complete their championship or explicitly forfeit.
- **Completion:** After a normal eight-round season, independent events reopen. Starting another professional season is another opt-in action. Existing saves mid-season are migrated as ACTIVE rather than accidentally reset.
- **Scope:** Gameplay and Drag Complex UI only. Chapter 09 narrative tutorial is a separate subsequent change. The engineering/vehicle-balance branch is not mixed into this work.



## Product vision and unlock

Street career (seven regional championships, seven crew recruits, recurring regional rivals) leads to a **professional circuit** at Tokyo Drag Complex. The venue remains discoverable/visit-able on its existing seven-regional-championship access rule, so existing saves are not stranded. **Entering professional events** requires recruiting all seven legitimate regional crew members; Arkon Den/developer mode may bypass for tests. A recruitment milestone should lead to an invitation/introduction; the existing `tokyoChampionshipInvited` flag refers to the later championship storyline, **not** open-circuit access. The professional circuit funds crew upgrades and offers a long-lived, repeatable endgame.

## Three competition tiers

1. **Open Circuit:** Rotating, repeatable, short three-race competitions; meaningful but moderate money, driver or crew rating/season points. Eligible classes can specify FWD/RWD/AWD, manufacturer, turbo/NA, kW cap, vehicle mass, NOS on/off, distance and start mode. Existing `PRO_DRAG_EVENTS` in `src/data/centralTokyo.js` remain working during Phase 1.
2. **Five Major Trophies:** Prestige competitions, roughly five *fixtures* each (not necessarily five individual heats), varied round-robin/knockout and discipline. Proposed names: Shuto Speed Trophy (individual/open), Tokyo Technical Trophy (individual/restricted), Tri-Drive Trophy (crew/drivetrain diversity), Team Grand Prix Trophy (crew/open), Tokyo Masters Trophy (mixed). First wins confer durable trophies and substantial prizes, with select rare rewards; repeat wins must be economically controlled. The five trophy slots in HQ should report real wins only after tournament settlement is implemented.
3. **Unified Tokyo Championship:** One ultimate Tokyo Champion, **not** separate Drivers' and Crew titles. An eight-event professional season offers three rotating event choices per round, with separate Driver Points and Crew Points needed to qualify. The championship itself is a three-stage cumulative-points contest: (1) individual two-car knockouts, (2) player-driven crew battles, (3) higher-weight four-car racing, potentially with elimination heats. All eligible entrants remain in contention for the overall title through the final stage; elimination from a stage only limits points in that stage. The five major trophies are prestigious optional events, not mandatory championship prerequisites. See the authoritative 2026-10-11 design section below.

## AUTHORITATIVE REVISION — 2026-10-11: eight-round season and ONE Tokyo Championship

**Decision:** This section supersedes earlier proposals for parallel Driver/Crew Championships, mandatory separate titles, a championship built from repeated three-part head-to-head fixtures, or a dedicated Four-Wide competition pathway. R470 and R485 milestone descriptions below document implementation history, not the target design. Preserve the functioning systems and save data while migrating the design.

### A. Eight-round professional qualifying season

- A season contains **eight completed official professional competitions**. At each round the Drag Complex presents **three independently browsable, rotating event choices**. The player chooses **one** competition to complete; its authoritative settlement advances the season by **one** round. No real-time rotation. An active event can be resumed, and an in-progress commitment may block starting another event, but **must never force the UI selection onto Crew Club** or prevent browsing the other choices. Show an explicit 'Finish current competition' reason instead of trapping the player.
- The three slots are **not** fixed Driver / Crew / Four-Wide pathways. Draw from a varied event catalogue with differing entry fees, prize pools, restrictions, race counts, prestige and formats. **Every round must include at least one Driver Points opportunity and at least one Crew Points opportunity**; the third is flexible (driver, crew or mixed). Do not make crew racing mandatory in every round. Events can blend **2-, 3- and 4-car races** as appropriate: lane count is a heat format, not a competition type or permanent button.
- **Driver Points** come from player-car professional results; **Crew Points** come from crew-car results, with the player physically driving each crew car. A mixed event may award both, clearly advertised. Show each event's potential driver/crew points, entry fee, cash prizes, heat count and restrictions before committing. Reuse current pro race physics, tournament state and once-only settlement.
- Show a clear season header with **Round X / 8**, Driver Points progress, Crew Points progress, and three selectable event cards. Eligibility requires **both** minimum Driver Points and minimum Crew Points; reaching only one is insufficient. **Locked Release 1 thresholds: 100 Driver / 40 Crew**, subject to later empirical balancing. Aim for several viable distributions, with roughly five driver-oriented and three crew-oriented selections a comfortable path for a successful player, not a hard quota. Excellent performances and mixed events may permit other strategies. Prevent impossible schedules due to offered choices; surface qualification feasibility when it becomes unattainable.
- Season points reset on new season; persistent driver/team ratings, career achievements, trophy wins and historical results do not. If the player misses qualification, another season is available. Extra points beyond qualification improve championship **seeding**, not a second title. Keep season advancement event-driven, save-safe, deterministic and free of duplicate fees/points/prizes.
- Professional event choices should rotate with the season, not repeat the same Crew Club Series / Four-Wide Open every round. Existing in-progress R470/R485 Crew Club and legacy cups must remain resumable and settle correctly before new scheduling rules take effect.

### B. One unified Tokyo Championship

- A **single 16-entrant Tokyo Championship**, entered after satisfying both season-point minima. Each entrant is a racer/team identity with an individual car and crew lineup. Use existing persistent professional world roster and standings. Seed from a normalised blend of season Driver and Crew Points (initial design target **70% driver / 30% crew**, to be tuned); long-term ratings may break ties. Qualification thresholds and seeding formula must be centralised, not hard-coded independently in panels.
- **Stage 1 — Individual Knockouts:** 16-driver **two-car elimination bracket**. Player drives their own registered car. Progression through the bracket determines stage points. A driver knocked out of this stage **continues to Stage 2 and Stage 3**; stage elimination is not overall championship elimination.
- **Stage 2 — Crew Battles:** Player registers a legal crew squad, drives the selected crew cars personally, and earns crew-stage points from actual finishes. **Three player-driven crew heats** (rather than a lengthy round-robin), with clear opposing teams, deterministic off-screen results and persistent partial progress. Crew builds and lineup rules follow R485; no manager-mode simulated player races.
- **Stage 3 — Four-Car Finale:** Four-lane heats (possibly elimination/qualification rounds culminating in a four-car final), using the existing flexible race engine. **This stage awards more points than either earlier stage** and is designed to allow a credible late lead change. All 16 championship entrants receive stage placements/points, even if they do not reach the last four; no automatic overall elimination before the points are tallied.
- **One combined championship leaderboard** accumulates Stage 1 + Stage 2 + Stage 3 points. The highest overall total wins **one Tokyo Champion title**. Suggested starting scale: Stage 1 maximum 20, Stage 2 maximum 20, Stage 3 maximum **40** (half of maximum possible championship points); exact placement tables, crew matchups, heat counts, comeback bounds and tie resolution require implementation design and testing. Suggested tiebreak: Stage 3 placement, then Stage 1 placement, then season seeding. The final stage must feel consequential without making the earlier stages meaningless.
- A single championship result awards the durable Tokyo Champion title, trophy/office display, prizes, cinematic presentation and magazine/story recognition. Future seasons permit title defence. Five Major Trophies remain separately collectible optional prestige competitions; no five-trophy gate. Avoid double-paying or double-awarding titles when replaying/reopening results.

### C. Implementation and migration requirements

1. **Season/UI correction first:** remove forced Crew Club selection on redraw; allow freely viewing all three choices, show active-event resume/lock reasons, rotate offers after official settlement, guarantee driver and crew opportunity each round, and test eight-round completion and new-season reset. Preserve existing saved active events and older street competitions.
2. **Unified championship logic second:** centralise qualification/seeding; implement a single resumable 16-entrant, three-stage championship using the existing 2–4-lane race infrastructure, crew-driving flow, persistent world roster and save/settlement guards. Test knockout stage-only elimination, crew stage, four-car placements, cumulative scores, ties, crashes/reloads and title award.
3. **Presentation/balance third:** championship intro and escalating stages, live standings after each stage, final podium/cutscene, magazine and HQ trophy, calibrated event rewards/qualification thresholds, and physical iPhone/iPad validation. Ship behind existing career gates; do not replace working drag physics or rewrite unrelated racing modes.

**Scope discipline:** This is an incremental upgrade to the established Phaser game, not a new Story Mode, a team-manager simulation, or a separate Four-Wide career. Do not implement the historical two-championship/group-stage proposal.


## Ranking / living world

Separate persistent long-term **driver rating** and **team rating** (Elo-style relative skill) from **season points** (event placements/qualification). Seed brackets using rating/season rules; #1 plays #16 in a seeded 16-person knockout, higher seeds distributed across round-robin groups. Seed helps earlier matchups but does not protect a competitor from elimination.

Create a stable world roster comprising **seven canonical region rivals** plus many persistent generic professional racers and generic teams. Store per-racer/team rating, points and record per save profile. Canonical rival IDs must remain distinct from playable protagonist identity (existing substitute-identity rules apply when the avatar overlaps). Do **not** force all seven into final eight: allow the world simulation to generate upsets. Personalised cutscenes when encountered; a separate post-championship Champion's Challenge can guarantee a particular story showdown without fixing the tournament bracket.

Progress the world on **in-game event completions**, never real-world time or offline catch-up. Use seeded/deterministic simulation incorporating driving proficiency, car build/performance and upset chance, with consistent brackets and reproducible stored outcomes. Reuse existing actual vehicle/race physics for races the player drives. Off-screen fixtures should use a **lightweight simulation**, not invisible full Phaser scenes. No accidental extra points/cash/advancement from revisiting a result or tapping twice.

## Crew competitions

**User revision, R485 (2026-10-10): the player DRIVES the crew cars.** Register up to five recruited crew members/cars, field three per fixture, and manually drive each selected crew loan car against the corresponding opponent in the existing two-lane Drag Complex. Two heat wins take the fixture. Investment in each car and the player's launch/clutch/throttle/shifting determine performance; friendly crew AI skill must not decide an on-track result. Upgrade cars in the Crew Garage between fixtures. No watch/skip simulation for unplayed player heats. Simulate only off-screen opposition fixtures. Restrictions must not strand users requiring three identical manufacturer cars without attainable alternatives. This supersedes the manager model described in historical milestone notes below.

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
- Three-car player-driven crew fixture, roster registration, car investment and live-race integration.
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

## R470 — Phase 3 milestone: living seasons and Crew Club Series

Implemented eight-event seasons driven by completed official competitions, never wall-clock time. The existing duel cups and Four-Wide Open retain their physical race formats and prizes. The driver slot rotates Street Shootout / Midnight Cup; an existing saved cup takes precedence. The crew slot unlocks after one completed pro event. The third slot retains Four-Wide Open and becomes season results after eight completed events. The season header opens current standings/history without adding a floating action. Subsequent seasons preserve ratings, lifetime records and achievements, archive final standings and reset season points.

Crew Club Series is a four-team, three-fixture round robin. Register 3–5 genuine recruited drivers with distinct owned cars and field three in selected order per fixture; the player manages rather than drives. Each driver contests one heat. Two heat wins take the fixture; fixture wins earn three series points, then heat difference and original seed break ties. Crew skill, actual tuned-car performance and difficulty affect deterministic results. AI teams retain identities and car builds throughout the series. Garage changes and eligible replacement cars are allowed before locking each fixture. A lightweight animated two-lane timing replay and skip reveal exactly the same pre-saved outcome. This milestone does not yet put crew cars into the physical venue renderer.

Entry is ¥75,000; four-team placing purses are ¥210,000 / ¥90,000 / ¥40,000 / ¥0. After the first series win, future registered series pay 65% purses. Final placings award 32 / 24 / 14 / 6 team season points and performance-based rating changes. Existing three-round driver cups award 3 / 8 / 16 / 32 points according to rounds won. Nonparticipating ranked drivers/teams contest seeded background fixtures after each completed calendar event, using vehicle performance and skills; this moves the living world while keeping actual participant settlement authoritative.

Attendance now considers event prestige, stage/final, player ranking and late-season significance. The existing five-texture day/night set, trim eviction, geometry and controls remain intact. Save transactions verify persisted profile ownership and values; failed saves roll back registry changes. Entry, locked simulation, every reveal and official fixture settlement persist separately. Fixture IDs and legacy round guards reject repeated settlement. Old four-wide and legacy saved cups resume without a new fee.

Validation: new automated coverage includes eligibility, five-driver squads, distinct cars, lineup order, car replacement, locked outcomes, watch/skip parity, every reveal interruption, three-fixture progression, standings, duplicate settlement, old saves, eight-event transitions, dynamic attendance, malformed fixtures and storage/profile failures. Existing control-position assertions were corrected to the current R468 60/110 clutch offsets; control implementation was not changed.

**Still outstanding from the full requested programme:** the five formal trophy events and 16-entry driver/crew championship formats, their qualifying/invitation and title prizes, dedicated trophy celebrations, and full venue-rendered crew replay. Season standings alone do not award a championship or trophy. Physical iPhone/iPad touch, spectator memory and extended economy playtesting remain required. This is a functional Phase 3 milestone, not completion of every Phase 3/4 feature in the broader request.

## R485 — Player-driven crew cars and panel typography correction

The user explicitly replaced the manager concept with manual racing. Crew selection now selects the recruited member's loan car; the player's personal selected car is never replaced in the profile. Each fixture locks three car builds in the chosen order and launches `PRO_CREW` races through the existing two-lane `FourLaneTestScene` physics, controls, camera and art. Real finish times/DQ/DNF determine each heat. Losing a heat does not eliminate the team: all three cars race, then the existing two-of-three fixture settlement applies. Only other teams' off-screen fixtures use simulation. Fees, series standings and season progression remain unchanged.

Saved R470 series retain entry payment and completed fixtures. Already revealed old heats are retained; unrevealed heats convert to pending player-driven races when resumed. Every actual finish saves once with a fixture/heat ID guard, and closing before settlement resumes that pending heat. Crew car builds remain locked during a fixture; garage tuning is picked up for the next fixture.

The crew panels use the normal Rajdhani UI font and explicit final text sizes, avoiding the global 1.6x font enlargement that caused R470 overflow. Sidebar lines have fixed vertical spacing and captions fit inside their buttons. Exo race-result styling remains in the actual manga race results. Formal trophies and championship formats remain pending.

## Release 1 implementation notes — 2026-10-11

User locked: eight-round season, 100 Driver / 40 Crew qualification, at least one Driver and one Crew event option per round with a rotating third choice, one-fixture/three-heat Crew Club Sprint, next season resets season points while keeping persistent career progress, and progress bars plus event details. New Crew Club entries use a `short:true` fixture; saved legacy three-fixture series retain their original flow. UI no longer forces Crew Club selection. This release does **not** implement the Tokyo Championship invitation/entry or verified end-to-end gameplay testing. Qualification and event balance still require validation with actual save profiles.
