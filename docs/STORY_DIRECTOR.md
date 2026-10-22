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
