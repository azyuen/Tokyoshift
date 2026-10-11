# Issue 01 — R489 editorial polish

The owner approved direct deployment and requested use of these exact backings:
- `assets/Magazine/blank.webp`: contents and race-school pages.
- `assets/Magazine/featuredcar_blank.webp`: all five car profiles.
- `assets/Magazine/ginza_blank.webp`: fixed collector advertisement.

Three previously commissioned champion paintings are now real runtime WebP assets, replacing R486's rectangle portraits. All editorial text, quotations, specifications and car sprites are Phaser overlays. Layouts use measured template panels and text bounds; no article copy is burned into the backings.

| Pages | Content |
|---|---|
| 1 | Existing cover |
| 2–3 | Existing Auto Market starter choice and live contents |
| 4–6 | Mika Hiyase: Before the Crown, Earned at the Line, Tokyo Goes With Her |
| 7 | Ginza: Spoon EK9 foreground, Amuse S2000 GT1 rear display |
| 8–10 | Shift timing and clean technique; standing versus rolling; FWD/RWD/AWD |
| 11–15 | AE86, Civic EF, RX-7 FC, Civic EK9, Evo III |
| 16+ | Existing per-save owned, archived and spotted cars |

The full print edition can be read before choosing either starter. The personal archive appears on later visits. Edition content does not mutate profile progression, inventory or gallery stock. The collector pair is fixed, aspirational advertising, not an unlocked purchase. Closing during a flip cancels the tween and guards its callbacks.

## Mika Hiyase

The owner named the former champion Mika Hiyase and supplied three Central sprite files with the legacy `mika_hayase_*` stem. Keep that display spelling, and keep those asset paths. She is separate from Yokohama's existing `mikaHayase` racer and Odaiba's Mika Hoshino. See the character-bible extension for authored history, voice and knowledge boundaries. The feature's quotes are fictional dialogue authored for this game. No family secrets or international victories are invented.

## Game mechanics and art integration

The car cards show current stock game values from cars.js, not claimed factory specifications. Transmission.requestGear scores clutch and throttle technique, not shift RPM. RaceScene begins rolling races at 60 km/h. Tyres models driven axle loading; drivetrain advice concerns straight-line acceleration. No universal shift RPM, cornering simulation, or guaranteed professional eligibility is claimed.

The magazine photo helper supports both the existing centred car art and the nine bottom-right anchored reference cars. It uses getReferenceRightX and the shared AE86-derived scale; wheel geometry is unchanged. Container insertion order is explicitly depth sorted so the paint layer remains under the shell. Other scenes and the authored car calibration are untouched.

## Historical sources

Car histories and facts are brief paraphrases of manufacturer records:
- Toyota AE86 Trueno archive: https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60009032/
- Honda Civic 1987: https://global.honda/jp/news/1987/4870909.html
- Honda Civic SiR 1989: https://global.honda/jp/news/1989/4890921.html
- Honda Civic Type R 1997: https://global.honda/en/newsroom/worldnews/1997/4970822b.html
- Honda Type R lineage: https://global.honda/en/stories/048.html
- Mazda FC debut: https://www.mazda.com/en/about/history/1980-1989/
- Mitsubishi Evolution III: https://www.mitsubishi-motors.com/en/company/history/car/

The FC card labels 1985 as the generation debut; existing Street File's 1989 model metadata stays unchanged.

## Checks

`node --test tests/*.mjs`: 161 passed, seven existing professional-season failures, reproduced unchanged at base d743ac9. The 39 magazine/opening checks pass. Browser validation covers every editorial spread, texture loading, panel text bounds, both starter choices, revisits, the personal archive and closing during animation. Inspect at 1560×840 and scaled mobile viewport. Template files are used directly without alteration.
