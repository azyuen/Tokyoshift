# TOKYO SHIFT — Arkon Story Chapter 08 // THE PRICE OF AMBITION

**Implementation:** R672 (23 October 2026); part of the separate Arkon Story profile, not Career's Chapter 08. Story design approved in conversation on 23 October.

## Continuity / story constraints
- Follows Chapter 07's upgraded Liberty Walk 240Z and the final solo drive. The same Arkon/Sayaka remain affectionately close, even as their shared time has dwindled.
- Sayaka still teaches full-time in Oshiage. She continues visiting Warehouse HQ, brings coffee, banters and joins races.
- Chapter 04 Arkon refused to sign an unsafe RWB inspection. In Chapter 08 Sayaka invokes his old principles explicitly.
- The black RWB Porsche was fully repaired and gifted to Sayaka personally in Chapter 06. No change to its ownership.
- Ginza Gallery has not yet been founded; no Career unlocks or retroactive Career dialogue disclosures.

## Story progression
1. Sayaka visits busy Warehouse HQ, playful coffee and driving-school banter interrupted by a legitimate invitation.
2. A private **Shinagawa** invitational with Sayaka in the passenger seat. She enjoys being out with Arkon. The full player-driven 402.336 m race resolves on real outcome.
3. Between races, Sayaka visits Warehouse HQ again. Arkon is distracted but not cruel; their friendship remains warm.
4. A bigger **Daikoku** race. She grows uneasy about the amount of money being wagered and Arkon's priorities.
5. Arkon asks Sayaka to attend a Saturday VIP occasion, beginning to sound like a date before he joyously blurts out “Deal of a lifetime!” She is disappointed but agrees because she worries for him.
6. Last private **Shibuya** race. Sayaka notices he is driving for the wealthy spectators now, not for the joy of working on cars.
7. The **Shibuya VIP night party**. Arkon in established charcoal suit, Sayaka in existing evening-dress artwork, night Shibuya city backdrop with private illuminated event staging. Their first glance and compliments retain some old chemistry.
8. An unnamed polished private-event promoter lays out a high-value engineering programme, difficult delivery conditions and financial security clauses tied to Warehouse HQ business assets. He is not established as a criminal or a known regional rival; generic story-only portrait pending unique art.
9. Sayaka confronts Arkon: “Where is the man who refused to sign off on that Porsche?” She asks him to leave the *event*, or she will leave the party; this is not a romantic breakup.
10. Businessman interrupts. Arkon says they can talk later; the scene holds, Sayaka fades out of the active stage, and Arkon returns to negotiations.
11. Arkon signs a consequential conditional programme guarantee. No physical failure, seizure, crime, breakup or automatic debt happens yet.
12. Arkon stands among the festivities with a large new contract and a distinctly hollow feeling. Chapter ends.

## Gameplay and save design
- Data: `src/data/arkonChapter08.js`, `src/data/arkonChapter08Races.js`.
- Director actions: `ARKON_CH8_RACE`, `ARKON_CH8_RETURN`, `ARKON_CH8_CONTRACT`.
- Chapter begins only after Chapter 07 completion via **Warehouse HQ > Story Objective** in the Arkon Story profile. No early automatic prompts over meets and no Career replacement.
- Three genuine, normal-physics races in existing Meet/RaceScene. Sayaka's Chapter-08-specific in-race dialogue becomes more uncomfortable across the sequence. Opponents are established regional drivers.
- Cash wagers escrow once at start, capped at 15% of present cash and a maximum nominal stake per event. Win returns twice escrow, defeat loses it, forfeit refunds it. No hidden power, fabricated win, unrelated global Career reward, coupon or pink slip.
- Checkpoints persist context and settled race outcomes and restore originally selected race context/car on conclusion. Completing the final conversation writes an explicit, *conditional* signed contract flag; it does not confiscate the workshop.
- Existing `StoryStage` supports a Story-only Shibuya VIP lighting and sign overlay using the Shibuya night Meet art. A bespoke illustrated rooftop dance party panorama has **not** been created in this revision.
- Chapter 08 joins Arkon's replay archive and isolated full-replay sandbox. Replays do not permanently alter the original profile.
- Updated `GameState` serialization persists Chapters 07–08 checkpoints and achievements; Chapter 07's previously omitted save fields were repaired alongside this addition.
- `version.json`, `sw.js`, index and module query versions bumped to R672.
- Test coverage: `tests/arkon-chapter08-r672.mjs`, `.github/workflows/arkon-chapter08-r672.yml`.

## Unresolved for Chapter 09
The investor/promoter's actual identity and methods, how guarantees will be enforced, whether projects are mechanically unsafe, and the ultimate status of Arkon and Sayaka are **not determined** by the Chapter 08 commit. These require subsequent creative owner direction. Avoid retroactive claims that Sayaka deliberately ignored phone calls or ended their relationship at this party.
