# Tokyo SHIFT — Story Director R639

Story Director is a declarative orchestration layer over the existing Phaser
scenes and dialogue renderers. It **does not** replace MangaCutscene,
PhoneConversation or the Ginza-specific Sayaka/Arkon passenger banter.

## Story command model

Create a script with `{ id, title, steps: [...] }`, register with
`game.storyDirector.register(script)`, and call
`game.storyDirector.start(script.id)` from a real career trigger.

Supported actions:

| Command | Parameters | Behaviour |
| --- | --- | --- |
| `LOCATION` | `scene`, optional `data`, `force` | Safely transition to an existing Phaser scene |
| `STAGE` | `background`, `characters`, `cars`, `depth` | Overlay a temporary location tableau with canonical character PNGs and explicit background/car textures |
| `CLEAR_STAGE` | — | Remove staged objects |
| `MANGA` | `cutsceneId` or `pages`, `characters`, `title` | Reuse full manga presentation; blocks race update |
| `PHONE` | `pages`, `callerId`, `callerPose`, `presentationMode` | Reuse ringing/accept/alternating dialogue, blocks race update |
| `COMPACT` | `pages`, `characters`, `autoAdvanceMs`, `tapToAdvance` | Reuse floating face/speech HUD over any scene, racing continues |
| `OPEN_MAP` | — | Opens the existing GarageScene map, retaining normal prices/unlocks; waits until the user travels |
| `START_RACE` | optional `raceContext` | Enters RaceScene **after** the regular caller has configured a race; requires a selected car |
| `WAIT_SCENE` | `scene` | Wait for that active scene (e.g. the player manually starts a race) |
| `WAIT_RACE_END` | — | Wait until an ordinary RaceScene finishes and presents its result |
| `WAIT_EVENT` | `event` | Wait for `game.storyDirector.signal(event, data)`, or `game.events.emit('tokyo-shift-story-event', event, data)` |
| `WAIT_FLAG` | `key`, `equals` / `notEquals` / `atLeast` / `atMost` | Wait for a saved condition |
| `SET_FLAG` | `key`, `value` | Commit a narrative milestone (disabled in preview) |
| `IF` | `key`, condition and `then` / `else` labels | Branch based on current registry |
| `GOTO` / `LABEL` | `to` / `name` | Named narrative branches |
| `END` | — | Complete story and remove its checkpoint |

Using a scene in a script **does not** change its core race economy, crew
recruitment or physics. Automatic races must use the existing prepared race
registry context; `WAIT_SCENE: RaceScene` is preferable when the player
should initiate a real meet race.

## Example

```js
game.storyDirector.register({
  id: 'example01',
  title: 'Warehouse to Tokyo',
  steps: [
    { type: 'LOCATION', scene: 'GarageScene',
      data: { workshopLocationId: 'shinonomeWarehouseStrip' } },
    { type: 'MANGA', characters: { left: 'daichiSakamoto', right: '$PLAYER' },
      pages: [{ speaker: 'left', pose: 'idle', text: 'Ready to head out?' }] },
    { type: 'OPEN_MAP' },
    { type: 'WAIT_SCENE', scene: 'RaceScene' },
    { type: 'COMPACT', characters: { left: 'sayakaFujieda', right: '$PLAYER' },
      pages: [{ speaker: 'left', pose: 'idle', text: 'Stay focused.' }] },
    { type: 'WAIT_RACE_END' },
    { type: 'MANGA', characters: { left: 'daichiSakamoto', right: '$PLAYER' },
      pages: [{ speaker: 'left', pose: 'idle', text: 'That was a race!' }] },
    { type: 'WAIT_SCENE', scene: 'MeetScene' },
    { type: 'PHONE', callerId: 'sayakaFujieda', callerName: 'SAYAKA',
      presentationMode: 'openingSwipe',
      pages: [{ speaker: 'caller', text: 'Glad you made it back.' }] },
    { type: 'END' },
  ],
});
game.storyDirector.start('example01');
```

In a persistent chapter, register the script from the canonical data catalog
`src/data/storyDirectorScripts.js` before it is first run. Ad hoc scripts
registered solely in-memory cannot be resumed after a complete browser reload.

## Character and location staging

`STAGE` is optional: an existing Garage/Meet/Race screen generally already
provides the correct environment. Author a background as
`{ key: 'someTexture', path: 'assets/...' }` and a character as
`{ id: 'sayakaFujieda', pose: 'idle', x: 450, y: 630, height: 410 }`.
Car staging takes explicit texture keys/paths (not the modular car renderer).
Staged objects are removed by `CLEAR_STAGE`, `LOCATION`, scene shutdown,
or script completion.

## Persistence and developer controls

The real script runner checkpoints `{ id, index, ownerSlot, version: 1 }` in
`storyDirectorProgress`, through the existing per-profile save pathway.
When a new scene becomes active or the page reloads, a registered chapter
resumes from its most recently completed action. Only completed actions advance
the checkpoint. Reloading *during* a dialogue will replay that dialogue rather
than skipping it. Story decisions and flags stay under the normal save profile.

The **Dev Scenes** list has two opt-in, non-canonical previews:
- **Three Dialogue Templates**: manga → ringing phone → compact portrait HUD.
- **Garage / Map / Race / Meet**: enter Warehouse HQ → manga → regular map →
  start a normal race manually → compact chat during driving → finish manga →
  return to Meet → phone conversation.

These are deliberately not auto-triggered for players and do not set
story flags or rewards as part of the Director. However, the cross-scene preview
uses the normal playable race, so **the underlying race itself is real**, including
normal stakes/results. Test with a developer profile.

## Known limits for new authoring

- `OPEN_MAP` presently delegates to the existing GarageScene map button.
  Maps in other scenes will need a thin adapter before their scripting API is
  generalised.
- Script-triggered race configuration is caller-owned. There is no bypass of
  opponent selection or race eligibility.
- Phone calls are interactive/blocking while the player answers. For gameplay
  that must remain live, prefer `COMPACT`.
- The staging overlay can position PNGs but does not duplicate the game's
  full modular car-rendering pipeline.
- Full end-to-end touch/browser verification is still needed for every
  new chapter; automated checks protect the core schema and imports.

Character dialogue remains subject to `CHARACTER_BIBLE.md`,
`NARRATIVE_AUTHORING.md` and `CAREER_NARRATIVE.md`.


## R641 — Arkon vault drive: interactive story rehearsal

This is an intentionally **non-canonical, developer-only** experiment in the
Story Director rather than a new career chapter or permanent story decision.

To trigger it:
1. Enter Ginza Motor Gallery as the named **Arkon Den** dev account, visit the
   private vault, and select **TEST DRIVE // STREET MEETS**.
2. Use the existing Tokyo map to travel to **SHIBUYA → DOGENZAKA**. Other venues
   continue to work normally. The first Dogenzaka arrival while this loan is
   armed is diverted *before regular Meet UI is rendered*.
3. At the bespoke venue, read the manga sequence, then pick **Dinner**,
   **Mine's R34 challenge**, or **After-dark photo stop**. Dinner has another
   choice about the bill. The photo route includes a ringing phone call.
4. All routes return to the live Ginza private vault, include a final
   **return the keys / ask for another drive** decision, and invoke the existing
   `CentralTokyoScene.endGinzaTestDrive` cleanup to restore the originally
   selected/preferred car.

The loan marker `ginzaTestDrive.devVaultNightOutR641` is saved as
`armed` and then `started` on entry, so the event does not retrigger every
time the player visits Dogenzaka. Only a newly borrowed vault loan can arm it
again. An interrupted playthrough can return the car through normal Ginza
controls; non-Arkon profiles cannot enter the experiment.

The Mine's R34 branch uses the **real RaceScene physics and race outcome**,
but the scripted challenge is a *no-stakes exhibition*: no cash, win/loss
record, coupon, reputation, recruitment or car ownership change. The
reversible race setup is held separately and is restored on returning to the
bespoke scene. The original Ginza rental and the ordinary paired Arkon/Sayaka
passenger banter are retained.

The script lives at `src/data/storyDirectorScripts.js` as
`devVaultNightOut`. For authoring, R641 adds:
- `CHOICE`: 2–4 numbered interactive manga-style buttons, each with `id`,
  `label`, optional `description` and a target `to` label; save-free
  choices are accessible to `IF` using the command's `key`.
- `WAIT_MS`: scripted delay (maximum 15 seconds).
- `VENUE`: fade to an existing background in the purpose-built
  `DevVaultStoryScene`, without showing ordinary Meet competitors/cards.
- `DEV_HERO_RACE`: restricted developer-story bridge to a real exhibition
  race with automatic resume after the normal result screen.
- `RETURN_LOAN`: restricted developer-story invocation of the existing
  Ginza vault return routine.

The developer-only actions deliberately cannot be called from arbitrary
Career scripts. To make this a real Story Mode system later, add general
race-launch and venue adapters with explicit validation of outcomes and
permissions rather than reusing these bespoke sandbox commands.


## R642 — reusable cinematic composition and immediate scene activation

**Composition defaults** live in `src/ui/StoryComposition.js` and are
used by BOTH the generic `STAGE` command and the bespoke Ginza/Dogenzaka
story scene. Stage authors do not hand-tune every car relative to a
character portrait.

Three authored templates:

| `STAGE.composition` | Use case | Composition |
| --- | --- | --- |
| `car-behind-cast` (default) | Introductions, story conversations, victory photographs | Large vehicle behind actors, full-body cast on matching ground |
| `car-in-front` | Dramatic car reveal, vehicle-centric conversations | Vehicle overlaps actors intentionally |
| `conversation-balanced` | Portrait-heavy dialogue scenes | Smaller, secondary vehicle, more actor space |

Each preset derives positions from the actual Phaser logical viewport
(1560 × 840 by default). The hero-car behind cast uses ~69% viewport
width (about 1076 px, rather than the previous 620 px) and the
two-character lineup uses consistent proportional heights (~58–59% of
viewport height). The car is grounded at a consistent location; the
characters' feet use a bottom-aligned anchor. Explicit depth layers
determine whether a vehicle appears in front or behind portraits.
The actual car body and tyre fit use existing `CarAppearance` /
`WheelFit` functions rather than stretching the hero PNG arbitrarily.

A reusable Story/Career authored tableau can now specify a car model:

```js
{
  type:'STAGE',
  composition:'car-behind-cast',
  background:{key:'meetCycle_shibuyaDogenzaka_night',
    path:'assets/Meet/Night/shibuya_dogenzaka_night.png'},
  characters:[
    {id:'sayakaFujieda',pose:'ginzaDress'},
    {id:'arkonDen',pose:'ginzaSuit'},
  ],
  cars:[{carId:'ginzaDemo_calsonicR390'}],
}
```

The `cars[].carId` route uses native modular/single-body car art and
wheel rendering; static `{key,path}` images remain available for
non-car backdrop props. Cast and car positions/heights/depths may still be
overridden individually for authored shots, so these are **templates**,
not compulsory layouts. Production scripts should use only cars available
to the player's profile, with relevant safeguards in their trigger logic.

**Choice cards are already a universal presentation template.** Any
Director script, including future **Career chapters**, can insert
`{type:'CHOICE',key:'dinnerPlan',choices:[{id:'dinner',label:'...',to:'label'},...]}`.
Branch destinations are validated, and R642 also preserves small,
sanitised selection values in profile-owned real-story checkpoints, so
decisions survive reloading the game. Developer previews do not save
permanent decision flags.

**Dogenzaka lag fix:** Starting a fresh Arkon vault loan still arms the
private rehearsal, but choosing **SHIBUYA → DOGENZAKA** in the Ginza map
now diverts *before entering and preloading normal MeetScene*. This avoids
generating opponents and car assets that will not be shown and prevents
an ordinary race from appearing before the scripted arrival. Direct
saved Meet entries retain a fallback preloading gate. The deliberate
cinematic opening pause was also shortened while preserving the fade.


## R643 — establishing-shot hold and immediate Dogenzaka entrance

New universal `HOLD_SCENE` command displays the fully authored background,
characters and car **without dialogue or decision overlays** and requires an
explicit Continue tap. Its `label` and optional `caption` are authored; the
button respects the existing 1560×840 virtual screen and blocks accidental
click-through to underlying controls. It works in both Story and Career.

The private vault rehearsal now:
1. Arrives at Dogenzaka with a clean tableau, and **waits** for
   **BEGIN THE EVENING** before playing manga banter.
2. After the initial manga concludes, restores the clean tableau and **waits**
   for **MAKE YOUR CHOICE** before showing the existing three-button decision.
3. Branches as before — none of the dinner/race/photo outcomes changed.

For the default `car-behind-cast` composition, the car's ground plane is
raised from 85.5% to **75.5%** of stage height (~84px), approximating
half to one hero-wheel diameter. Body/wheel scale remains unchanged and
characters retain their feet-on-ground layout.

First arrival handling also now treats the current **active Ginza vault loan**
as authoritative; a temporarily restored personal `selectedCarId` cannot
delay the story until a normal race has completed. An `armed` *or*
`started` but unfinished loan remains eligible for recovery if a deferred
scene switch fails. The story intercepts at (1) Ginza map selection,
(2) Meet preload/create, and (3) Race preload/create as a safety fallback.
The real scripted Mine's R34 race is exempt from this guard.
Returning the car clears the loan and all episode eligibility.
