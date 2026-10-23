# TOKYO SHIFT — Arkon Story Chapter 09 // NO WAY OUT

**Release:** R673, 23 October 2026. This is the earlier-era Arkon Story campaign, NOT the separate Career Chapter 09.

## Approved canon and escalation
- Begins after Chapter 08's Shibuya VIP contract and Sayaka's quiet departure. Arkon and Sayaka are strained, not broken up. Sayaka owns the restored black RWB Porsche gifted in Chapter 06.
- Arkon's new private-racing contacts broker suspicious collector-car resales with inconsistent ownership histories, inflated valuations and work invoices that do not match the engineering record. No organisation is named, no criminal charge is established, and nobody announces a Yakuza affiliation. Danger is conveyed through professional pressure and financial leverage.
- Two private demonstrations in existing Shibuya and Daikoku meets are genuine 402.336-metre player races with normal vehicle physics. Winning or losing is not scripted. No personal wager, automatic Career settlement, pink slip, crew recruit, hidden power or arbitrary financial punishment.
- Arkon notices a car he previously inspected has been purportedly resold repeatedly. His signature is sought to make questionable documents look credible. He faces pressure under Chapter 08's existing conditional Warehouse HQ guarantee.
- Sayaka comes back in her gifted RWB after hearing troubling rumours. She does not magically know all the facts or nullify his contract; she tests his resolve. She recalls Arkon's refusal to sign off an unsafe Porsche inspection.
- Arkon decides to refuse further certification. They seek independent advice before a tense final public Shibuya meet. He declines the requested sign-off without making accusations, and they leave carefully.
- A quiet Yokohama-night montage followed by Warehouse HQ coffee begins reconciliation; liabilities and trust remain to be resolved. No instant insolvency, property confiscation, criminal conviction, new relationship declaration, or premature Ginza Gallery founding occurs.

## Implementation
- src/data/arkonChapter09.js: authored story with existing workshop, meet and portrait assets. The final journey is a cinematic tableau and dialogue, not a fabricated playable Porsche drive.
- src/data/arkonChapter09Races.js: two real race contexts, one-time settlement, genuine outcomes, original car/race-context restoration, and persistent refusal.
- src/story/StoryDirector.js, src/story/StoryScript.js, src/data/storyDirectorScripts.js: chapter registration, scripted actions, race resume and checkpoint handling.
- src/scenes/RaceScene.js: Story-only race result settlement.
- src/state/GameState.js: safe save/default/normalisation fields, Career isolation.
- src/ui/ArkonStoryObjective.js: entry from Warehouse HQ once Chapter 08 contract is signed.
- src/ui/ArkonPlayableReplay.js and src/ui/ArkonStoryArchivePanel.js: sandbox full chapter replay and cutscene recount.
- tests/arkon-chapter09-r673.mjs and .github/workflows/arkon-chapter09-r673.yml: regression checks.

## Follow-ups
- Custom sprite for Sayaka's arrival and properly choreographed driving in her black RWB.
- Dedicated illustrated Shibuya collector event rather than repurposing existing Meet panoramas.
- Chapter 10 consequences of financial/legal entanglement and the ongoing Arkon–Sayaka relationship.
