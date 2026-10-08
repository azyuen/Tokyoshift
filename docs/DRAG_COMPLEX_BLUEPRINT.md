# TOKYO SHIFT — Drag Complex Professional Circuit Blueprint (v1)

**Adopted:** 2026-10-08. **Status:** Phase 1 foundation in development; Phase 2–4 not yet implemented.
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

### Phase 1 — Foundation (in progress)
- Add this blueprint and durable ownership guidelines.
- Keep existing venue access; gate **entry into** pro racing behind seven valid crew recruits (dev exception).
- Add versioned, normalized, backward-compatible per-profile professional-circuit state and stable world roster, driver/team ratings, season-points placeholders, deterministic seed functions, and declarative trophy/championship definitions.
- Test new and legacy saves, corrupt payloads, dev bypass, roster uniqueness and deterministic seeding.
- **Explicitly not shipping yet:** visible full leaderboard/season races, Elo updates, actual trophies, team event execution, Tokyo Championships.

### Phase 2 — First playable professional tournament
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

1. Confirm Phase 1 branch changes and tests have passed; merge only after review.
2. Build Phase 2 isolated engine **before** changing major tournament scene presentation.
3. On Sunday 2026-10-11, Astra can tackle Phase 3 using this document and Phase 2 engine; preserve all tested interfaces.
4. Phase 4 after genuine individual/crew simulations are demonstrably reliable.

**Design status:** blueprint approved; implementation status must be updated based on actual merges, not presumed from this document.
