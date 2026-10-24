# Tokyo SHIFT — R681 240Z and Daichi continuity

**24 October 2026.** Builds on R678, R679 and the R680 pre-professional Career chronology. This update fixes story dialogue and presentation, not races, milestones, ownership or saves.

## Aruken's first car
- Aruken's own Datsun 240Z is the **initial car in new Aruken Story profiles** and the car later upgraded into the Liberty Walk 240Z, before its voluntary Chapter 10 sale.
- The separate broken-down 240Z at the Odaiba meet belongs to **Aoi Shindou**. Aruken repairs hers; he races his.
- The active Chapter 1 choice now says **SHE ASKS ABOUT THE Z**, matching nearby 240Z dialogue.
- Older Chapter 1 scripts remain registered for historic story checkpoints. Their Civic-specific dialogue is now **vehicle-neutral** because some upgraded older saves legitimately still drive a Civic. They retain their step sequence, save flags and timing; no force-swapping of cars or lost tuning.

## Daichi's first introduction remains for Career Mode
- In Prelude Chapter 10, Sayaka **first tells Aruken about** a young mechanic named Daichi. She has encountered and observed Daichi; Aruken has **not** met him, checked his work personally, or mentored him.
- Together they decide to offer Daichi an unusually good **Warehouse HQ lease**, administered quietly **through office paperwork**. Daichi does not know the partnership behind the good deal.
- Separately, Sayaka knows **both** of the Career player's parents as longtime family friends; neither parent has a motorsport career. She sees enthusiasm and potential in their child, and asks Aruken to restore an affordable AE86 or Civic EF as a gift. Their help is private, not a source of guaranteed wins.
- The Prelude Yokohama finale no longer implies Daichi already knows and relies on them as benefactors.
- **No professional sponsorship cutscene is implemented here**. Aruken's first meeting with Daichi remains reserved for that future scene; the agreed line is **"We'll cover the expenses. We're going to sponsor them."**
- The R679 RWB Porsche gift, sale of the Liberty Walk 240Z, real moving finale with Sayaka driving and hand-holding remain untouched.

## Engineering safeguards
The changed story text does not insert, remove or reorder screenplay actions or dialogue pages. No change to event IDs, saved index checkpoints, races, workshop rent/economy, Career progression, profile ownership or stock/modified legacy Civic handling. Story Director and archive imports use R681 URLs so they show the same script, with the app and PWA cache version bumped. Regression checks live at `tests/arkon-continuity-r681.mjs`.
