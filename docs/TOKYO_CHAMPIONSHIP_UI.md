# Tokyo SHIFT — Tokyo Championship UI (November 2026)

## Scope and visual direction

The Championship runs as a full-screen destination separate from the Pro Season Drag Complex. Use the four image assets already on main:

- `assets/CentralTokyo/dragcomplex/championship_hub.png`
- `assets/CentralTokyo/dragcomplex/championship_knockouts.png`
- `assets/CentralTokyo/dragcomplex/championship_crewbattles.png`
- `assets/CentralTokyo/dragcomplex/championship_fourwide.png`

Design: premium, industrial Japanese motorsport in midnight navy/gunmetal with racing red and warm trophy-gold accents. Reuse authentic full-body character art; no duplicate character layers baked into backgrounds. Load only each current event's environment and character sprites to reduce startup traffic on older iPhones/iPads.

## Navigation

1. Completing the eight-round Pro Season with **60 Driver and 40 Crew points** unlocks the unified Tokyo Championship.
2. **Championship Hub:** permanent home screen displaying the player and seeded rivals, current standing and points, leaderboard with detailed driver profiles, event cards, event status and next-event navigation.
3. **Three dedicated briefings:** Individual Knockouts, Crew Battles, Four-Wide Finale. Each uses its own background, stage-specific progress / opponent information, Daichi setup access and Sayaka consultation.
4. **Once per major event:** Sayaka gives a contextual advisory note, persisted in `activeChampionship.adviceByEvent[stage]`; reopening never consumes it again.
5. **Daichi:** access to the original Pro Paddock and Crew Paddock, using existing garage parts / tuning and car-lock rules. Returning to the Drag Complex reopens the saved event briefing.
6. **Race result:** if another heat in the same event is possible, offer **Next Heat** (direct restart for solo; car picker for crew) or **Return to Event Briefing**. When the major event ends, return to the Championship Hub.
7. **Finals:** the normal settlement and title ledger award once, with a final standing/podium view and existing victory/defeat cutscenes.

## Gameplay unchanged

- A single seeded 16-entrant field, with three stages: Knockout **20**, Crew **20**, Four-Wide **40** points. A stage knockout does not eliminate the player from later stages.
- Existing four-round head-to-head bracket, three distinct player-driven crew heats and four-wide qualifiers/semifinals/final remain authoritative.
- One registered personal car locks across knockout and four-wide; distinct crew cars for each crew heat.
- Original race physics, skill tiers, event simulation, points tables, economy and saved profile migration remain untouched.
- The source of truth for settlement stays `src/data/tokyoChampionship.js` and `src/scenes/FourLaneTestScene.js`. UI must never settle prizes by itself.

## R801 — Competition-first UI cleanup (5 November 2026)

The four existing full-screen backgrounds and all character art remain unchanged.
Gameplay and authoritative race progression are unaffected.

- **Hub:** remove competing boxes in the centre of the scene. Show just the
  five-driver live standings wing, the player's score/rank wing and one clickable
  three-event ribbon across the lower edge. Retain full 16-driver profiles, rules
  and one primary continue action.
- **Individual:** show the actual persisted 16→8→4→2→1 knockout bracket rather
  than eight rows of text. Use saved winners to fade eliminated drivers, with
  unknown later-round opponents marked TBD and the player's branch in gold.
- **Crew:** three full-width scored heat rows with their results and selected
  cars, plus a wins tally. All three player-driven heats and existing eligibility
  remain unchanged.
- **Four-wide:** qualifying, semifinal and final cards display lane grids,
  current advancement and saved player-heat fields. No speculative standings
  or simulated results are awarded by the interface.
- **All event pages:** one translucent right-hand competition board; one short
  Sayaka advice card along the lower left; shared bottom actions for Hub, Pro
  Paddock, Crew Paddock and Go To Grid. The redundant Daichi text panel is
  removed, not his paddock function or character sprite.

The one-use Sayaka note still saves under the existing event key. The
Championship UI does not change car locks, physics, points, standings,
economy or season progression. Validate readability and touch targets on
iPhone XR and iPad Pro 9.7 before considering this visually signed off.

## R802 — Wall monitor projection and developer testing shortcut (6 November 2026)

The newly uploaded background assets contain real painted virtual displays:
- **Hub:** left-wall display. The active bracket's 16-driver standings
  (up to 12 legible rows plus a full standings drill-down) render directly
  inside scene rectangle `x100 y164 w510 h337`.
- **Knockouts:** right-wall display. A four-column, saved-winner knockout
  diagram renders directly inside `x897 y160 w550 h285`; a dedicated
  **Expand Tournament Bracket** action provides a readable full-screen view.
- These coordinates use the game's **1560×840** reference canvas, derived
  from the uploaded **1671×941** backgrounds and their cover-scale crop.
- Dark opaque UI overlays on these physical displays have been removed.
  Characters avoid the monitor bounds and all gameplay result data stays live.

A **D) TEST TOKYO** shortcut is available in developer Settings from any
scene and inside Tokyo Drag Complex. This loads the authentic 16-driver
Championship without requiring the eight-round season or 60/40 points.
If a Championship is in progress it resumes it rather than re-seeding.
A completed developer run can be started again. The shortcut persists the
fixture atomically, but does not grant season progress, cars, crew or
eligibility: the real race, crew, vehicle and settlement rules remain.
Developer-only presentation skips the once-only Career opening scene.

Safety boundary: both buttons are gated behind `registry.devMode`, never
shown for regular Career or Aruken Story profiles. This is a local game
test shortcut, not a multiplayer server authorization system. The normal
`createProvisionalChampionship` gate is unchanged.

## R803 — Hub declutter, paged rankings and podium (7 November 2026)

- Remove the Hub's thin full-width top bar, breadcrumb and close X. The
  Championship title now sits high in the racing display font; below it is
  the smaller Season number, without the former descriptive subtitle.
  Event briefings, driver profiles and secondary screens keep their original
  navigation chrome. A discreet **Back to Pro Season** action at the bottom
  keeps the Hub escapable after removing X.
- Project **exactly eight** standings rows on the embedded left-wall monitor,
  with 1–8 / 9–16 paging arrows and touch targets to open each driver's actual
  Championship breakdown. Return from a monitor-selected driver profile
  restores the same standings page.
- Three event buttons are on/off monitor previews, **not** navigation into
  locked or active event briefings. A second tap restores the live rankings;
  they show authentic rules for individual knockout, crew and four-wide.
- The **fourth equal-sized red button** is the only Hub entry route. It
  follows the live authoritative `activeChampionship.stage` and changes
  from Enter Event 01 to 02 to 03 automatically; after completion it opens
  the Championship results view.
- Remove the redundant right-side player-rank box and Sayaka Hub sprite.
  Place the actual **top three by live championship standings** at enlarged
  double scale and lowered by approximately one original body length. If
  the player is not top three, show them as a fourth sprite on the right,
  aligned with the leaders. If an AI-only professional driver lacks an
  authored named sprite, use the project's existing generic Pro-driver art
  rather than falsely displaying a named regional character.
- The lower strip carries a Road to the Title heading, four same-size
  event buttons, plus smaller Rival Profiles / Championship Rules /
  Back to Pro Season actions. No scores, races or prize mechanisms change.

## Test checklist before merge/deploy

- Fresh qualified save: Season Results → Enter Championship → Hub → Knockout briefing.
- Tap seeded rivals; inspect player/rival statistics and standings; verify correct portrait substitution for a player also used as a canonical rival.
- Open all three stage previews; locked events must not start.
- Get Sayaka advice once per major event; reload, reopen and check text persisted; no duplicate consumption.
- Use Daichi's Pro Paddock and Crew Paddock and return directly to the original briefing; no duplicate cars or free upgrades.
- Select and lock a valid registered solo car; reject an unregistered or different car after lock.
- Win and lose knockout rounds; when eliminated, still progress to Crew.
- Complete three distinct player-driven crew heats; prohibit reusing a crew car; test Next Heat crew picker.
- Four-wide qualifier → semifinal → final; correctly allow next heat or return to briefing.
- Check save/reload between every heat, on last heat and on stage change; no duplicate score or payout.
- Finish with a win and a defeat; confirm prize, career title and Office persistence, hub final standings and repeat season.
- Device testing on iPhone XR / iPad Pro 9.7; inspect safe area, text and tappable areas; measure initial background load.

**Status:** Current production UI is maintained on `main`. The original pre-release branch/approval note is historical; each change is validated through its own pull request and browser checks.
