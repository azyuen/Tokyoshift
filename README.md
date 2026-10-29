# TOKYO SHIFT

**A Tokyo street-racing, car-building and motorsport RPG — built around the art of the perfect launch.**

Set in a fictionalised Tokyo car scene, **TOKYO SHIFT** combines hands-on drag racing with vehicle ownership, engineering, regional rivalries, crew building and a character-driven career. What began as a focused manual-driving physics prototype has grown into a multi-location racing world.

**Project status:** Playable, in active development (October 2026). The street career, vehicle/garage systems, crew racing, Aruken story prelude and substantial professional-circuit gameplay are implemented. The unified Tokyo Championship finale and complete career validation are being finished separately. See [the current build marker](version.json) and [professional-circuit blueprint](docs/DRAG_COMPLEX_BLUEPRINT.md) for up-to-date implementation detail.

---

## The experience

Start with a modest **AE86 or Civic EF**, learn to launch and shift, and work your way into Tokyo's racing community. Every race can help you improve your driving, upgrade your car, earn money, meet rivals and build a reputation.

Progression is about more than collecting wins:

1. **Find your feet** — Meet Daichi and Sayaka, take your first driving lesson and establish your garage in Shinonome.
2. **Conquer seven regional challenges** — Race through **Odaiba, Shinagawa, Tatsumi, Shibuya, Yokohama, Daikoku and Shinjuku**, meeting distinct rivals and specialist tuners.
3. **Build a crew** — Recruit seven regional drivers, prepare cars and compete in player-driven **3v3 crew battles**.
4. **Go professional** — Enter Tokyo Drag Complex for repeatable Open Circuit competitions, prestige trophies and an opt-in **eight-round Pro Season**.
5. **Aim for the Tokyo title** — The unified Tokyo Championship is the planned career culmination; its completion is being validated on a separate development branch, rather than advertised as a finished main-branch feature.

Around that journey are the **Tokyo Auto Market**, **Ginza Motor Gallery**, **Oshiage Driving School**, specialist workshops, a changing day/night world and an expanding cast of characters.

## What's in the game

| Area | Current experience |
| --- | --- |
| **Manual drag racing** | Analogue throttle and clutch, shifting, launches, traction and wheelspin, RPM/torque behaviour, turbo response, gear changes and shot-based nitrous |
| **Race formats** | Street duels, regional challenges, pink slips, three-race competitions, four-wide events and multi-heat crew formats |
| **Cars & engineering** | A broad Japanese performance-car roster with factory classes, individual engines and drivetrains, tuning potential and physics-based rival builds |
| **Ownership & upgrades** | Car buying, multi-car garages, parts, specialist regional tuning, dyno testing, mechanical upgrades and an in-game economy |
| **Visual customisation** | High-density pixel-art vehicles, layered body/paint assets, colours, rims, decals and selected special bodykits |
| **Street career** | Seven regional championships, recurring named rivals, reputation, crew recruitment and crew battles |
| **Professional racing** | Tokyo Drag Complex, rotating Open Circuit offers, five multi-stage Prestige Trophies, driver/crew events, season standings and an eight-round Pro Season |
| **Story & characters** | Cinematic Career chapters, magazine content, character interactions and a separate ten-chapter Aruken Denzaki prelude |
| **Collection & records** | Hero/collector vehicles, Ginza showroom, race history, car rewards, trophies and persistent driver profiles |
| **Accessibility & testing** | Touch-first mobile layout, multiple difficulty settings, an optional driving school and dedicated developer/test utilities |

Vehicle physics, tuning and racing AI have undergone a major engineering pass and are part of the approved game baseline. The game is **single-player**; development and balance testing remain ongoing.

## Two connected stories

### Career Mode — your rise through Tokyo

Create a driver, grow from a newcomer into a regional champion, recruit a crew and enter the professional racing world. **Daichi Sakamoto**, **Sayaka Fujieda** and the regional rivals recur as your career develops. Story scenes are tied to meaningful progression instead of functioning as an unrelated campaign.

### Aruken Denzaki — the prelude

A separate, ten-chapter story follows engineer **Aruken Denzaki**, his workshop, the cars he builds and his evolving friendship with Sayaka. It adds a different perspective to the world encountered in Career Mode.

The prelude and main career have distinct progression and saved-game contexts. Both continue to receive presentation, continuity and playtesting polish.

## Professional motorsport

The **Tokyo Drag Complex** provides several layers of competition:

- **Open Circuit:** Voluntary Driver and Crew events between official seasons, with offers that rotate as the in-game day/night clock changes.
- **Five Prestige Trophies:** Shuto Speed, Tokyo Technical, Tri-Drive, Team Grand Prix and Tokyo Masters. These are persistent multi-stage competitions with distinct restrictions and formats.
- **Pro Season:** A deliberately entered eight-round calendar with Driver and Crew rankings, varied race disciplines and season awards.
- **Tokyo Championship:** A single overall Tokyo Champion is the intended endgame. Championship completion work exists on the separate `feature/career-v1-completion` branch and is **not yet a production-complete feature on `main`** as of this README update.

The five Prestige Trophies are optional Open Circuit achievements; they are not the same as the final Tokyo Championship. Refer to the [Drag Complex blueprint](docs/DRAG_COMPLEX_BLUEPRINT.md) for current rules, development status and superseded historical design notes.

## Driving and playing

The game is designed primarily around **landscape touch controls**, with analogue-style accelerator and clutch inputs, gear shifting and nitrous controls. Desktop keyboard input is also available for testing.

The fundamentals still matter: build revs, judge traction, release the clutch, shift cleanly and use your car's powerband. Oshiage Driving School offers an optional place to practise launch and shifting technique before racing more demanding opponents.

Game progress is stored in browser-based driver profiles. If you test across browsers or devices, treat those as separate local save environments unless you explicitly transfer data through supported in-game mechanisms. Avoid clearing browser site data without protecting your save.

## Run locally

TOKYO SHIFT is a browser-based **Phaser 3** game using JavaScript ES modules and static assets. It does not require a package build step for local play.

From a checkout of this repository:

```bash
python3 -m http.server 8080
```

Open **http://localhost:8080** in a browser. Serve the repository rather than opening `index.html` with `file://`; the game imports modules and assets over HTTP. An internet connection is needed for the Phaser CDN script and web fonts.

Most implementation code lives in `src/`, art and audio in `assets/`, documentation in `docs/`, and regression tests in `tests/`. Focused Node-based regression checks and GitHub Actions workflows cover individual systems; there is no single npm build command in the current `package.json`.

## Project reference

- [Agent / contributor guidance](AGENTS.md) — development guardrails and canonical documentation pointers
- [Character Bible](docs/CHARACTER_BIBLE.md) · [Career continuity](docs/CAREER_R680_PRE_PRO_CONTINUITY.md) · [Narrative authoring](docs/NARRATIVE_AUTHORING.md)
- [Drag Complex blueprint](docs/DRAG_COMPLEX_BLUEPRINT.md) — formats, official season, championship design and implementation notes
- [AI driving](docs/AI_DRIVING.md) · [Physics notes](PHYSICS_NOTES.md)
- [Stock car asset standard](docs/STOCK_CAR_ASSETS.md) · [Hero car assets](docs/HERO_CAR_ASSETS.md)
- [Current version](version.json) — build identifier used by the browser game

**Living project note:** Technical documents preserve historical decisions and some superseded designs. Prefer current code and the latest explicitly authoritative addenda when checking what has shipped.

## Where it started — the original prototype

TOKYO SHIFT started in September 2026 as a deliberately small **Phase 1 Driving Prototype**: one 402-metre race, a manual clutch and gearbox, physics-driven AI, nitrous, and temporary artwork. It had **no garage, economy, regional career or car collection**. Getting the launch and shifting to feel good came first.

That original README is part of the project's history and has been preserved **verbatim**:

**[Read the original Phase 1 Driving Prototype README](docs/history/README_PHASE_1_DRIVING_PROTOTYPE.md)**

The early design philosophy remains recognisable in the much larger game today: **the driving should be enjoyable in its own right.**
