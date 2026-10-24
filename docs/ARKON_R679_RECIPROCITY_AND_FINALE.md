# TOKYO SHIFT — Aruken / Sayaka R679 story canon and deployment notes

**Date:** 24 October 2026  
**Foundation:** R678 (character motivation, relationship and seven-specialist Liberty Walk 240Z build).  
**Implementation:** R679.  
**Scope:** Aruken's separate Story/Prelude profile only; do not change Career Mode or Chapters 7–9's central conflict.

## Why this refinement exists

The relationship must be reciprocal. Sayaka is already capable, perceptive and independent; she is not someone who requires saving. Aruken previously received more emotional support on screen than he gave. R679 adds three **small, quiet, earned** moments rather than a new major conflict.

- **Chapter 5 — THE DAY SHE NEEDED A FRIEND:** After a student loses confidence at Oshiage, Sayaka seeks out Aruken. He puts down his spanner and listens rather than offering an unwanted mechanical fix. His attention, not his career prospects, helps her.
- **Chapter 6 — THE PART SHE STILL MISSES:** Sayaka admits she misses aspects of professional race strategy and team management, but genuinely loves teaching at Oshiage and isn't sure whether to return. Aruken sees and supports her ambitions without deciding for her.
- **Chapter 10 — A RARE MOMENT OF DOUBT:** At the newly opened Ginza Gallery, Sayaka admits she was frightened to make such a significant decision. Aruken recognises the gallery as **her idea** and her own achievement. Their equal 50/50 ownership remains unchanged.
- **Chapters 7–9:** Keep the existing structure untouched: Aruken chases reputation, becomes inattentive, signs risky/compromised business contracts, and ultimately refuses to lend his name to suspicious transactions after Sayaka's challenge. Their reunion is earned, not a theatrical breakup.
- **No added trauma, infidelity, rescued damsel, or new major villain.** Keep the existing humour and recurring bad-coffee motif.

## The 240Z's consequential farewell

Chapter 10's opening negotiations recover some ground but leave a specifically documented **¥4,800,000 negotiated liability** beyond an immediate small legal/settlement cost. The old R674 opening line implying the dispute was *already completely paid* is retired.

After the **real** final friendly Daikoku race in the fully tuned Liberty Walk 240Z, Aruken independently decides to sell that very car. It is not a forced confiscation or suggestion by Sayaka. The scripted scene acknowledges his grief, pride, responsibility and growth. A buyer pays **¥5,200,000**; proceeds pay the ¥4,800,000 liability. If Aruken owns no other playable car, an ordinary used **Civic EF** costing ¥300,000 from the proceeds keeps the saved garage usable; it is not a free bonus. A ¥100,000 net remainder from the sale goes into his account in that case. This is a designed narrative settlement, not a general market pricing revision.

- The real car `arkonLibertyWalk240z` leaves `ownedCarIds`, `carStates`, `carGarageLocations`, active selections.
- Its exact tuned state is retained in `arkonStoryChapter10ZSale.lastState` and in the Car History `SOLD` entry, enabling an emotional provenance record and chapter replay without loss of original tuning.
- The transaction is one-time, idempotent, separately flagged and *Aruken Story-only*.
- R678's real seven-specialist fully tuned 240Z is preserved through Chapters 7–10 until the sale. No pretend car or direct-to-money reward replaces it.
- The next restoration commissions, equal Ginza partnership and private aid to Daichi proceed after liabilities are settled.
- Earlier completed profile saves are never forcibly stripped of the Z; the new ending applies during genuine Chapter 10 progression / explicit safe replay.

## Final road and Yokohama

The last journey is now a full no-input moving Porsche road sequence in existing `RaceScene`, adapting the technical pattern already used by Chapter 6's RWB cruise. **Sayaka owns and drives** the restored `rwbStellaPorsche` and Aruken rides in the passenger seat, content to be carried by someone he trusts. In-car banter plays during the drive, then the scene transitions to **one RWB Porsche** parked beneath the Yokohama Ferris wheel with the original paired hand-holding end composition.

Unlike the previous R674 two-car arrival, the Liberty Walk Z cannot appear at the finale: Aruken has already sold it. This is both visual story continuity and emotional shorthand for their future together. The restored broken Porsche is a symbol of the long, shared rebuilding journey. Do **not** insert an explanatory speech about this symbolism, nor a kiss, forced confession, or sequel sting.

The cinematic temporarily selects the Porsche for RaceScene rendering **without adding it to Aruken's ownership, states, or garage**. After completion, original race context and selections are restored. Mid-drive reloads persist the temporary borrowing context; ordinary Career saves remain isolated.

## Technical continuity and testing

- New actions: `ARKON_CH10_SELL_Z`, `ARKON_CH10_DRIVE`, `ARKON_CH10_DRIVE_RETURN`.
- New saved story data: `arkonStoryChapter10ZSale`, `arkonStoryChapter10Cruise`, `arkonStoryChapter10CruiseFinished`.
- R679 semantic migration protects numeric in-progress checkpoints after insertion in Chapters 5, 6 and 10 (with R678 migration retained for earlier changes).
- Full playable replay creates a temporary restored Z **only inside the sandbox snapshot** for completed Chapter 10 profiles; original saves are returned intact on exit.
- Dedicated regression tests: `tests/arkon-chapter10-r679.mjs` plus updated `tests/arkon-chapter10-r674.mjs`; CI workflow `.github/workflows/arkon-chapter10-r679.yml`.
- The testable intent is a playable emotional conclusion, not a rework of drag physics, Career canon or Aruken's R678 childhood/backstory changes.
