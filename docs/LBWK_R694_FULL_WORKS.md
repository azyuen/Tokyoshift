# R694 — Ginza × Liberty Walk: full-works economy & collector separation

## Intent
The eight career LBWK cars are independent, sealed fully developed donor builds — **all 16 parts at Level 3 including NOS (three 75 hp shots)**, with an authored +38% engine output target over that legal max-part donor and improvements to weight/grip/launch. They are not ordinary regional specialist upgrade slots and do not apply regional multipliers on top of the sealed hero engine.

## Checkout: discounts are calculated, not coupons
The full catalogue price of all Level 1→3 steps is **¥2,564,000 per donor** at the R694 parts catalogue. Credit is the catalogue value of already-installed levels of those same 16 parts; no credit is fabricated for unrelated paint/wheels or past specialist labour. Formula:

    due = full_catalogue_parts - installed_parts_credit + bespoke_LBWK_premium

The conversion replaces the donor with a sealed hero. The player's previous individual part state is deliberately not copied (to prevent double-tuning a prebuilt hero) but is fully recognised financially, including NOS upgrades. The quote is recomputed immediately before the atomic cash deduction.

| Donor | Original class | Premium | Untuned donor due | Fully Lv3 donor due |
|---|---|---:|---:|---:|
| MX-5 NB | D | ¥3,000,000 | ¥5,564,000 | ¥3,000,000 |
| A60 Supra | D | ¥3,200,000 | ¥5,764,000 | ¥3,200,000 |
| Datsun 240Z | C | ¥3,500,000 | ¥6,064,000 | ¥3,500,000 |
| 180SX | B | ¥4,400,000 | ¥6,964,000 | ¥4,400,000 |
| Silvia S15 | A | ¥4,800,000 | ¥7,364,000 | ¥4,800,000 |
| 350Z | A | ¥5,200,000 | ¥7,764,000 | ¥5,200,000 |
| R32 GT-R | A | ¥6,000,000 | ¥8,564,000 | ¥6,000,000 |
| R34 GT-R | B | ¥6,200,000 | ¥8,764,000 | ¥6,200,000 |

The collector class is still **S** for all sealed hero cars, although the above table refers to the *donor* factory class. Class-restricted matchmaking remains unchanged.

## Three different 240Z roles
- `arkonLibertyWalk240z`: existing Story Mode cosmetic body alias for Aruken's personally owned workshop 240Z; the playable Story Mode car and its tuning progression are **untouched**.
- `libertyWalk240z`: the Career Mode player's ordinary 240Z donor converted to the same sealed Level 3 + NOS + specialist-power template as the other seven; underlying L-series engine retained. The dedicated **#52** red/white hero body is `assets/Cars/hero/liberty_walk_240z_hero_body.png`.
- `arkonGinza240z`: fictional RB26DETT-swapped, 975 kg and ~675 kW collector special, using the black/gold Aruken 240Z body artwork (**#16**) from `assets/Cars/hero/liberty_walk_aruken240z_hero_body.png` and listed at Ginza for **¥125 million**. Shown only after the first Pro Season sponsorship. The free no-stakes sponsor exhibition uses this unique one-off. The existing story progression and saved narrative car never inherit these new statistics.

**Both final visual assets are integrated.** Career player (#52) and Aruken's Story Mode / one-off (#16) now have distinct body texture paths, without altering their underlying body geometry or wheel-reference configuration.

## QA and compatibility
- Independent catalogue-level regression test: all conversions, upgrade credits, NOS in actual race builds, pre-sponsor Ginza gate, donor original class distribution, distinct 240Z identifiers, and fair Lv3 donor 402m benchmark.
- No routine factory car, normal regional hero or existing user-purchased upgrade part definitions altered.
- **Save compatibility:** saved car IDs are preserved. Previous LBWK owner specifications and pricing are replaced by R694 on load; no retroactive refunds are issued because purchase transactions do not persist exact historical itemised part costs. If old premium purchases need compensation, implement a dedicated, idempotent migration.
- **Before merge:** inspect 402m benchmark output against standard full Lv3 and globally stacked regional tuning; run mobile/tablet manual checkout and NOS races. The two supplied number-livery images are now included in the branch; verify their staging and wheel alignment in mobile/tablet QA.

## R742 — GMG demonstration vehicle versus Prelude 240Z

The Career-only `arkonGinza240z` (#16 RB26 collector special, listed at ¥125 million) is a **different, later Ginza Motor Gallery × Liberty Walk one-off demonstration/commission build** from Aruken's personally owned 240Z voluntarily sold during Prelude Chapter 10. It deliberately reuses his signature black-and-gold #16 visual identity without erasing the sale. GMG's commercial access does not assert his personal ownership. The no-stakes sponsor exhibition uses this later car; specifications, price, gallery rotation, saved vehicle IDs and racing mechanics remain unchanged. See `docs/GMG_BUSINESS_AND_RACING_CANON_20261030.md`.
