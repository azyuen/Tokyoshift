> **R742 current GMG canon (30 October 2026):** See [GMG business and racing canon](GMG_BUSINESS_AND_RACING_CANON_20261030.md). Aruken and Sayaka are committed romantic partners and equal owners of the operating business, not necessarily the properties or collector vehicles. GMG Racing is their mutually agreed commercial venture, with a meaningful sporting return for Sayaka, not a gift or limitless subsidy. The later sponsored #16 240Z is different from Aruken's sold Prelude vehicle. R680's disclosure boundaries and R692's actual sponsor reveal remain intact.

# Tokyo SHIFT — R680 Career continuity before the Pro Circuit

**Approved canon, 24 October 2026.** Supersedes conflicting historic father, Aruken/Daichi and gallery-ownership lore in older documents. Builds directly on **Prelude R679**. This file is the canonical source for pre-Pro Circuit authoring.

## Fixed background

- **The player's two parents have no professional racing history.** Sayaka Fujieda is a longtime friend of **both** parents, without an old racing-team partnership with the father. The player's enthusiasm, driving talent and future success are their own; there is no inherited racing career or secret racing-father comeback.
- Sayaka privately notices the player's enthusiasm and potential, and asks Aruken Denzaki to restore an inexpensive, worn AE86 or Civic EF as a starter-car gift. Before Pro Circuit, dialogue may acknowledge unnamed friends who helped but **must not name the engineer**.
- **Aruken and Sayaka jointly own the Ginza Motor Gallery operating business and oversee its Warehouse HQ engineering operations.** Property ownership is not established; most extraordinary showroom cars are consignments and customer projects. Aruken leads engineering and Sayaka leads curation, sales and race strategy. By Career Mode they are committed romantic partners, shown through banter rather than labels.
- The two jointly arrange **Daichi's favourable lease at Warehouse HQ**, entirely through business paperwork. Daichi knows only that the rent is an unusually good deal, not who arranged it or why. **Aruken has never met, assessed, trained or personally mentored Daichi** before the *future professional sponsorship cutscene*. Sayaka has met Daichi in Chapter 7, and quietly believes in his team. Aruken backs the opportunity with her, not an existing personal mentoring relationship.
- The existing **¥750,000 Warehouse HQ unlock charge remains a workshop fit-out/access cost**, not proof of a property purchase. Keep the exact cost, access triggers, storage capacities and save structure. Daichi mentions the low rent once, naturally, in Chapter 5.
- The RWB Porsche commissioned through the Ginza collection in Chapter 5 is **Sayaka's personal car**, restored by Aruken and gifted to her in Prelude Chapter 6. Daichi receives work orders but has not met the curator yet; the anonymous specialist commission remains plausible.

## Runtime scenes implemented by R680

| Career chapter | Knowledge boundary |
| --- | --- |
| 01 — The First Night | Sayaka delivers the first car on behalf of the family and its unnamed helpers, gives driving tuition; no racing-parent legacy or named restoring engineer. |
| 02 / 03 — Tokyo Takes Notice / First Champion | Player earns results with Daichi. No change. |
| 04 — Bigger Dreams | Canal Yard opening and Sayaka's worried phone call stay. No Aruken disclosure. |
| 05 — The Ginza Connection | A single mild reference to the unexpectedly cheap Warehouse HQ lease, despite setup costs. Keep the RWB arriving on the existing page four and the anonymous curator's work order. |
| 06 — Beyond Seven | Keep seven-badge montage and Daichi's independent engineering dream. |
| 07 — One Crew, Seven Roads | Sayaka visits, meets Daichi, offers tactical tips; Aruken does not appear. The curator / partnership remain undisclosed. |
| 08 — The Next Level | Preserve Masato's invitation, Daichi's concern over professional management, Sayaka's teasing phone call, the Porsche race, her Ginza curator reveal and her strategist offer. **Do not name Aruken or connect him to Warehouse HQ.** Her unnamed stubborn-engineer references can remain. |
| Earlier stand-alone strategist cutscene | Keep the preexisting trigger/role but remove the line explicitly naming Aruken before their introduction. |

Chapter IDs, dialogue page counts, presentation cues, cutscene flags, playability, save compatibility and both game modes remain intact. No new ownership, payouts or workshop discounts are conferred beyond the existing game mechanic.

## Future Pro Circuit reveal — approved direction, **not yet implemented in R680**

- The player and Daichi are excited about entering professional racing; an official then lists **season entry fee, insurance, facility/pit costs and technical certification**, and the team panics at the bill.
- Aruken joins Sayaka in person. **This is his first meeting with Daichi.** Keep Aruken warm, approachable, slightly cheeky and a little embarrassed rather than aloof or self-important.
- Daichi asks how he knows Sayaka. Sayaka teases: **"Too well."** Aruken blushes. The official recognises **Denzaki-san** through his respected engineering pedigree, with no lengthy hero speech.
- Aruken commits: **"We'll cover the expenses. We're going to sponsor them."** Do not substitute "Sayaka and I" or openly label their romantic relationship.
- The sponsor pays the **initial professional season participation expenses**, not unlimited tuning, races, upgrades or winnings. Scrutineering, legitimate results, championship unlocks and the player's agency all remain essential. The bargain lease stays unspoken.
- **Important structural boundary:** Chapter 8's invitation, Chapter 9's first visit / Open Circuit orientation, and the later eight-round Pro Season registration are separate existing interactions. The future sponsorship scene must pick a legitimate trigger (likely the season signing), reconcile the actual season economy, and not accidentally introduce Aruken twice. It is not part of this R680 deployment.
- Future interactions may build a relationship between Aruken and Daichi **after** their first meeting; do not retroactively imply earlier mentorship.

## Guardrails and source of truth

Runtime scripts: `src/data/cutscenes.js`, `src/data/chapter08.js`, `src/data/characters.js`. The original Prelude is frozen at R679. Character internal ID `arkonDen` and developer login "Arkon Den" remain unchanged; in-world character is **Aruken Denzaki**.

Regression coverage: `tests/career-continuity-r680.mjs` with the existing opening, Chapter 8, Sayaka/Reika and story replay tests. Retired father-racer material left in older historical prose is not current canon.

## R692 follow-up — first Pro Season sponsor introduction (27 October 2026)

The historical R680 heading above records what had **not** been implemented in R680; the following material supersedes its future-state label once R692 is merged.

- **Chapter 08 remains untouched**: Aruken is unnamed in the phone invitation, Warehouse and Ginza reveals. During the existing Chapter 09 first Drag Complex visit, Masato briefly notices **Denzaki-san** on the team's supporting paperwork. Sayaka brushes the player's question aside; **no Aruken portrait** appears in this Chapter 09 visit.
- On the **first deliberate official Pro Season registration only**, the season becomes ACTIVE through the established registration method and existing economy. Masato lists fees, bond, insurance, pit/workspace and employee contributions. Daichi and the player react; Aruken makes his **first in-person appearance** and first meeting with Daichi, saying the team has sponsor backing. Masato registers the sponsor as **Ginza Motor Gallery**, which Aruken and Sayaka co-own.
- Sayaka and Aruken share familiar, restrained banter. Their relationship remains **unlabelled**. Aruken's appreciation of Daichi's engineering derives from Sayaka's photos and records, **not** prior contact.
- A single no-stakes **Liberty Walk 240Z** exhibition follows using the real two-car race physics. Win, loss and forfeiture all return to the same sponsor send-off; the exhibition creates no career cash, win/loss, entry-fee, coupon, crew, season point, ranking or championship change. The professional season remains ACTIVE throughout.
- The closing cutscene offers encouragement and a brief invitation to Ginza's Liberty Walk collaboration. The Central Tokyo tuner access flag is keyed to completion of this one-time scene; existing tuner build prices, purchase/ownership checks and dev access remain unchanged.
- Subsequent Pro Seasons keep the previous brief season registration vignette, with no repeated sponsorship or paid exhibition. Cutscene history stores intro, race-pending, race-finished and closing-scene checkpoints so interrupted play can resume from the Drag Complex.
- **Later Tokyo Champion celebration cameo** of Aruken with Sayaka remains a separate future scene; R692 does not implement this finale.
