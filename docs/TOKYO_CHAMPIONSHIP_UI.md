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

**Current branch:** `feature/tokyo-championship-ui`. Do not merge or deploy without approval and device/browser validation.
