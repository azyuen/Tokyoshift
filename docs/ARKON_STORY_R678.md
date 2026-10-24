> **R681 continuity correction (24 October 2026):** Fresh Aruken Story Mode starts with his personally owned **Datsun 240Z**, not a Civic; Chapter 1's stray Civic heading was corrected. The legacy Chapter 1 dialogue is deliberately vehicle-neutral because older upgraded Civic saves remain valid, and no vehicle is replaced by these text edits. In Chapter 10, **Sayaka first tells Aruken about Daichi** and proposes a quiet Warehouse HQ lease handled by office paperwork. Aruken has not met or mentored Daichi, who doesn't yet know the people behind his discounted rent. The young Career driver's non-racing parents are both longtime friends of Sayaka. Their first Aruken/Daichi encounter is still reserved for the future Pro Season sponsorship scene. Supersedes conflicting old references below. Details: [R681 240Z / Daichi continuity](ARKON_R681_240Z_DAICHI_CONTINUITY.md).

# R678 — Aruken Story narrative refinement

This release strengthens Aruken Denzaki's established professional engineering background and damaged confidence while keeping his evolving relationship with Sayaka Fujieda as the emotional centre of the ten-chapter J-drama. The purpose of technical encounters is to reveal character through choices and mutual respect, not replace romance with a car-building plot.

## Early chapters

**Chapter 01 — Odaiba:** Existing racer Aoi Shindou and her boyfriend, Shibuya racer Haru Sakurai, need help with Aoi's 240Z. Aruken diagnoses and fixes an intermittent ignition connector with basic tools, free of charge. Their gentle relationship humour establishes a romantic world. Sayaka observes his skill and generosity; the player chooses to approach her or wait. Daigo Kirishima's fair AE86 rivalry remains. Oshiage instructor identity is no longer disclosed in this chapter.

**Chapter 02 — Shibuya and Oshiage:** Rina Tachibana brings a client's S15 for a difficult boost-control diagnosis. Sayaka sees that Aruken's ability extends across vehicle systems, asks about his professional background, and responds with matching openness to the player's choice. She counsels him to accept fair fees from well-resourced clients without losing his generosity. The player visits Oshiage, where she is comically revealed to be the instructor. Her complimentary real driving lesson and her limited availability as a full-time instructor are preserved. The Forester dock job, bad workshop coffee, night drive and Daigo rematch survive.

**Chapters 03–05:** Tuner consultations are woven into Aruken's existing customer jobs and projects using established shop backgrounds, character sprites and specialties. Each collaborator brings genuine expertise; Aruken's distinction is whole-vehicle engineering and respectful integration. The Porsche ethical crisis, later RWB ownership, finance and relationship beats are not rewritten.

## Exact existing tuners

| Region | Character | Shop | Specialty |
|---|---|---|---|
| Odaiba | Takumi Serizawa | ESPRIT | Aero & Weight |
| Shinagawa | Natsumi Kagawa | ZERO/SPORTS | Drivetrain & Launch |
| Tatsumi | Tetsu Nakahara | JUN | Engine Internals |
| Shibuya | Itsuki Kuroda | Amuse | Exhaust & Flow |
| Yokohama | Reina Kuroda | Mine's | ECU & Response |
| Daikoku | Nao Fujita | RE Amemiya | Cooling & Flow |
| Shinjuku | Daigo Arakawa | Top Secret | Turbo & Boost |

Daigo Arakawa is distinct from the recurring, romantically overconfident AE86 owner Daigo Kirishima.

## Chapter 07 payoff

The personally owned Datsun 240Z already progresses through genuine workshop Level 2 and Level 3 parts, real specialist visits, and real physics-driven races before conversion into the Liberty Walk 240Z. R678 extends the final milestone to all seven regional tuner houses, with at least one actual, paid, installed specialist treatment on that 240Z per shop. The game checks persistent `specialistTuning` IDs, not narrative flags. Seven short tuner reunions use the characters' existing sprites and shop backgrounds, with no free parts, cash or fabricated boosts. The purchased tuning transfers with the actual car during conversion.

This deeply collaborative project is the culmination of the early friendships, not a substitute for Sayaka's emotional story. Their warm Chapter 07 scene is immediately followed by Aruken's escalating distraction, missed time together and established lonely night drive. Chapters 08–10 retain their already-deployed emotional and business outcomes. Sayaka remains equal Ginza co-owner, owns her gifted black RWB Porsche, and is an independent person with ambitions of her own.

## Technical continuity

The persistent Script Director still uses the same chapter IDs and completion keys, and new checkpoints mark R678 in their existing serializable primitive vars. Older, in-progress numeric checkpoints are migrated by scene phase and verified financial or vehicle milestones rather than being interpreted against new script offsets. Completed chapters remain complete. Legacy users may need to replay a chapter to see new retrospective dialogue; migration does not award extra money or vehicles.

Release entry points and PWA build stamp updated to R678. Tests: `tests/arkon-story-r678.mjs`, revised `tests/arkonStoryMode.test.mjs` and `tests/arkon-chapter07-r669.mjs`. CI: `.github/workflows/arkon-story-r678.yml`.
