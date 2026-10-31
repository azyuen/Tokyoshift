# R748 — Sayaka pose and Chapter 10 continuity audit

## Asset findings
Git tree on main at R747 contains four white-blouse assets renamed by the owner:
`home_sayaka_fujieda_alert.png`, `_confident.png`, `_contemplative.png`, `_explaining.png`.
These were **not in the character pose atlas**. They are now registered as `homeAlert`, `homeConfident`, `homeContemplative`, `homeExplaining` with distinct keys and existing on-disk paths.

Genuine navy Oshiage uniform assets remain `oshiageNeutral`, `oshiageTalking`, `oshiageHappy`, `oshiageConcerned`, `oshiageRelaxed`, `oshiageReviewing`, `oshiageSerious`. The earlier compatibility name `oshiageExplaining` continues to resolve to the **actual** uniform talking sprite; no nonexistent old filename is required.

## Full cutscene review and choices
- Prelude **Chapter 01**: retain the specifically approved instructor uniform look at their first meeting. Legacy misnamed expressions render as genuine Oshiage variants, not as casual-white-blouse sprites.
- Prelude **Chapter 02**: casual/home outfits for night meets and the private workshop/coffee conversation; instructor uniform during the **actual Oshiage driving lesson**. Wardrobe and expression change with the scene, without changing dialogue or lesson progression.
- Prelude **Chapters 03–06**: home clothes in personal visits, customer garage, romantic meetings and night runs, with stronger off-duty expressions (particularly `homeContemplative`, `homeAlert`, `homeExplaining`). No more unrelated Oshiage uniforms at a private garage.
- Prelude **Chapters 07–10**: casual/home for private scenes; event/formal poses remain for gala scenes; Chapter 10 uses contemplation, explanation and confidence for the new dialogue.
- Career **opening, Shinonome, Canal Yard**: home; use `homeExplaining` for the manual lesson and tuning advice, `homeAlert` for concern, `homeConfident` for reassuring farewell. The opening caller uses `homeNormal` rather than an ambiguous `idle`.
- Career **Oshiage Driving School**: true school uniform and school-only expressions.
- Career **Ginza**: curator/gallery outfit; **Pro Season and Tokyo Championship**: professional track outfit; no wardrobe crossover.
- Developer/private Ginza scene and car banter retain their dedicated `dev` and `ginza` looks.

## Revised Chapter 10
Keep the real original 240Z sale, three honest restorations, friendly race, Ginza business founding, and career-seed state. Condense the ending: Ginza empty-room 50/50 decision and short future-opportunity seed; black-screen **A FEW YEARS LATER** for 5.5 s; short post-Championship conversation in which Sayaka elects to stay with GMG Racing and Aruken has booked dinner and cleared their day; existing no-input Porsche cruise; short Yokohama exchange and **unchanged one-car holding-hands Ferris-wheel ending**.

The player will have already experienced Career Mode's championship before unlocking this story in the proposed future public path. The current Arkon developer-only access is **not** changed. No race/tuning/economy/consignment mechanics or Career cutscene progression is modified. A one-time R748 semantic migration preserves legacy saves in progress.

## Test scope
`tests/sayaka-pose-ch10-r748.mjs` checks each pose asset on disk, every declared Sayaka portrait in ten Prelude scripts and Career cutscenes, outfit transitions, finale ordering and the safe checkpoint migration.
