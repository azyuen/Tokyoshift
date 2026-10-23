# Launch control and class recalculation — 24 October 2026

The stock XT's 17.71 s result was partly a driver-control defect. At 0.5 s the prior Elite controller had fully released the clutch; RPM fell from 4,326 to 1,228 by 1 s and boost fell to 0.012 bar. The grip-based clutch limit allowed more load than the off-boost engine could sustain. A pedal-only prototype recovered nearly one second without changing factory torque, power, gearing or grip.

The shared Expert/Elite controller now limits launch clutch capacity by both traction and current engine torque, accounting for engine losses and RPM error. It holds throttle while the clutch meters load and allows up to four seconds for shaft speeds to converge. It uses the same Vehicle, Engine, Turbo and Clutch as the player; no injected force, torque, boost or hidden performance multiplier. Lower driver tiers and rolling starts are unchanged. The controller remains an approximation, not an optimal-launch solver.

| Stock car | Previous 400 m | Revised 400 m | Interpretation |
|---|---:|---:|---|
| XT | 17.707 | 16.833 | Avoids falling below useful boost range |
| GDB | 14.139 | 13.614 | AWD engine load better controlled |
| R32 | 14.463 | 13.867 | AWD launch improves |
| R34 | 14.521 | 13.952 | AWD launch improves; still Class B by composite |
| SA22C | 15.965 | 14.593 | Large improvement from maintaining rotary RPM |
| AE86 | 15.360 | 15.282 | Small improvement |
| Starion | 15.239 | 15.525 | Conservative clutch holding loses time; retained outlier |
| JZX100 | 13.688 | 13.791 | Small standing loss; not forced to improve every car |

Recalculated all 301 core standing runs and their performance indices, plus 199 affected supplementary standing runs (including NOS, specialists and exclusives). Retained all 301 core rolling results and 285 supplementary rolling/lower-tier results. This refresh is necessary because the shared driver changed; baseline.json remains unchanged. Before-standing evidence is in launch-control-comparison.json, with the previous GitHub commit identified. Each refreshed row records the controller hash; retained rows keep their earlier provenance. The refresh tool refuses to overwrite its comparison file silently.

Retained class thresholds of 14.1 / 14.8 / 15.5 composite seconds and recalculated the fixed model metadata. Regular roster counts are A 15 / B 11 / C 12 / D 4; developer Magna is additional D. Classes do not change when a player upgrades a car. These development-branch assignments remain subject to final review. The improved AE86 is now C alongside EF; stock MX-5, Starion, A60 and XT occupy D. Do not preserve a historical letter at the expense of the measured grouping.

All six standard sampled stages still increase power and improve standing 400 m for every regular car. Factory output and maximum power are unchanged. Potential ratings were regenerated from the new standing results, existing rolling/usability samples and the same donor/hardware prices. No collector engine or hardware was nerfed; shared AI changes can improve or worsen a particular exclusive's simulated launch.

Validation: 95 focused tests pass; the existing 1,431-run AI regression passes. A new assertion that every imperfect-driver XT run must be slower was rejected by evidence: rating 3 / seed 17 is 16.751 s, about 0.08 s faster than Elite / seed 1. The final test checks completion and unchanged hardware rather than pretending strict tier ordering holds. XT remains the slowest stock car; Starion launch regression, skill spacing and premium NSX dominance remain review items. Browser evidence is recorded separately and does not establish deployed or native-device testing.

Recruitment affordability and showroom choices are in RECRUITMENT_ACCESS.md. No economy or invitation policy was changed in this increment.
