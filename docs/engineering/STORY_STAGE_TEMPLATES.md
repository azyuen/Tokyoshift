# Story cinematic staging — R651

## One visual geometry source per real scene

The perspective/ground-plane system from R644–645 remains valid for cinematic
environments that do not have a live foreground renderer. It projects sprites
from normalized source-art ground lines, horizon and scale; background cropping
and character/car transforms share the same viewport.

For **live Workshop and Meet scenes**, however, the existing playable layouts
are more reliable visual calibrations than inferred perspective. R651 reuses
those unchanged foreground anchors and their actual renderers:

| Story stage | Canonical owner | Car | People |
| --- | --- | --- | --- |
| Workshop, active GarageScene | `src/data/workshopPresentation.js`, `GarageScene.buildWorkshopHeroLayout/createCarDisplay` | Same visible tyre-contact line, model-relative reference width, saved wheels and modifications | Same player position, foot line and height; companions inherit that height |
| Meet, active MeetScene | `src/ui/ShowdownLayout.js`, `StreetShowdownView`, `MeetScene.createCarDisplay` | Exact Street Showdown car position, size and native wheel/body transformation | Exact Showdown actor foot line and height; companions inherit that height |
| Other authored backgrounds | `storyBackgroundCatalog.js`, `StoryPerspective.js`, `BackgroundViewport.js` | Perspective-projected relative to source artwork | Perspective-projected on the same ground plane |

### Contract for new scenes

- Put **which character, which pose, which car and which venue** into the script.
- Do not tune `height`, `width`, `ground`, `depth` or `x` in individual
  Workshop or Meet dialogue scenes. The native stage disregards these fields.
- To stage another person, include them in the `characters` list. By default,
  everyone stands on the same ground line at the same height. Use
  `role:'observer'` to place a bystander at the far side without resizing her.
- Workshop story scenes temporarily hide the real Workshop car/player, display
  their story-pose counterparts via the *same* Garage car renderer, then restore
  the originals on clearing/scene shutdown.
- Private Meet story scenes preserve the roster and results while hiding
  ordinary rival objects. The location's *already rendered* background is
  reused; the real Meet renderer draws the selected car using saved paint.
- Other story backgrounds continue to use the perspective projection and
  uniform source-background cropping. R651 does not change those equations.

### Calibration ownership

To change Workshop staging, change `WORKSHOP_PRESENTATION` after a visual
review; both the playable Workshop and Story follow it.

To change Showdown staging, change `SHOWDOWN_HERO_CAR` or
`SHOWDOWN_HERO_CHARACTER` in `ShowdownLayout.js`. Both regular Street
Showdown and Story follow them. Do **not** add new Story-specific offsets.

Tests `arkonStoryMode.test.mjs` assert the shared geometry and the Story
renderer call sites. Runtime/on-device visual verification is still required.
