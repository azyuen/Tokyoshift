# Issue 01 — R490 reader and editorial refinement

The owner approved direct deployment and requested use of these exact backings:
- `assets/Magazine/blank.webp`: open two-column feature article on page 05 and race-school pages.
- `assets/Magazine/contents.webp`: authored contents page 03, with Phaser-overlay editorial entries.
- `assets/Magazine/featuredcar_blank.webp`: all five car profiles.
- `assets/Magazine/ginza_blank.webp`: fixed collector advertisement.

Commissioned champion illustrations are loaded for pages 04 and 06; page 05 intentionally uses the open blank paper to give the short article room. All editorial text, quotations, specifications and car sprites are Phaser overlays. Layouts use measured template panels and text bounds; no article copy is burned into the backings.

| Pages | Content |
|---|---|
| 1 | Existing cover |
| 2–3 | Existing Auto Market starter choice; new contents.webp backing with live page-number/headline overlays (04, 08, 11). Ginza is excluded as advertising. |
| 4–6 | Mika Hiyase: The Price of Speed (italic headline and team quote), The Long Way to the Line (two-column backstory), Tokyo Goes With Her. |
| 7 | Ginza: Spoon EK9 foreground, Amuse S2000 GT1 rear display |
| 8–10 | Shift timing and clean technique; standing versus rolling; FWD/RWD/AWD |
| 11–15 | AE86, Civic EF, RX-7 FC, Civic EK9, Evo III |

The full 15-page print edition can be read before choosing either starter. Page 15 is the final page on all visits; the older personal Street File / owned, archived and spotted cars section is no longer shown. Edition content does not mutate profile progression, inventory or gallery stock. The collector pair is fixed, aspirational advertising, not an unlocked purchase. Closing during a flip cancels the tween and guards its callbacks. The reader uses 792px-tall pages in the 840px game canvas, compact square X / < / > controls, and no external issue/page folio.

## Mika Hiyase

The owner named the former champion Mika Hiyase and supplied three Central sprite files with the legacy `mika_hayase_*` stem. Keep that display spelling, and keep those asset paths. She is separate from Yokohama's existing `mikaHayase` racer and Odaiba's Mika Hoshino. See the character-bible extension for authored history, voice and knowledge boundaries. The feature's quotes are fictional dialogue authored for this game. The page 05 team quote now appears on page 04. Page 05's new two-column account of Mika's parts-counter work, waterfront losses, notebook and collaborators has a readable font floor and paragraph indents. No family secrets or international victories are invented.

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

`node --test tests/*.mjs`: 161 passed, seven existing professional-season failures, reproduced unchanged at base d743ac9. R489's 39 magazine/opening checks passed. R490 tests now assert the new contents asset, end of edition on page 15, full-size navigation and two-column article; these changes require validation in the deployed build. Browser validation covers every editorial spread, texture loading, panel text bounds, both starter choices, revisits, the personal archive and closing during animation. Inspect at 1560×840 and scaled mobile viewport. Template files are used directly without alteration.
