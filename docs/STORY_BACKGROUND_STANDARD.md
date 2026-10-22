# Tokyo SHIFT — Consolidated Cinematic Backgrounds and Perspective (R644)

This feature is a **non-destructive metadata consolidation**, not a PNG
migration. The game retains its active paths, textures and crop transforms in
the original scene modules. Story Director receives a single audited index
(`src/data/storyBackgroundCatalog.js`) over those sources.

## Three environmental families

| Family | Existing backgrounds | Default projection |
| --- | --- | --- |
| `location` | 21 regional Meets × day/night, Oshiage Skytree, station, Drag Complex exterior | Ground-plane linear perspective |
| `interior` | Shinonome 3-workshop day/night, office, crew space, dyno, Ginza, Auto Market, eight tuner shops, Oshiage School/Custom Works/paint/wheels, registration room | Softer ground-plane perspective (gamma 0.90) |
| `road` | Eight regional day/night skyline sets + procedural scrolling road, six layered professional stadium variants | **Orthographic side-on** (scale independent of lane Y) |

Professional races are a `road` family subtype but use a five-layer
Drag Complex renderer. Road backgrounds are catalogued as `layered: true`,
not mistakenly exposed as flat background PNGs.

**Important:** Existing artists' perspectives have not yet been measured
individually. The `calibration:'provisional'` marker is intentional.
Calibrate actual horizon/floor lines visually before applying these equations
to every normal Meet/Garage/gameplay scene.

## Shared ground equation

Normalized `y` measures the ground/contact position vertically down the
background: 0 at the top and 1 at the bottom. The character's point is the
feet; for a car it is the wheel-ground plane, not the image centre.

Let:

- `h`: estimated horizon/vanishing line
- `b`: back/farthest walk line (`b > h`)
- `n`: near/foreground boundary
- `r`: reference ground depth (a normal-size person/car at `r`)
- `gamma`: perspective strength (`1` is linear; `0.90` slightly softer)
- `S_ref`: reference sprite size for its class (height for characters, width for cars)

First clip movement to the navigable floor:

```
y_safe = clamp(y_requested, b, n)
```

Then derive one shared depth scale:

```
depth = (y_safe - h) / (r - h)
scale = clamp(depth ^ gamma, minScale, maxScale)
characterDisplayHeight = characterReferenceHeight * scale
carDisplayWidth = carReferenceWidth * scale
```

Both sprites use the **same scale multiplier** but different reference sizes.
This preserves the proportions and original side-on vs front-on PNG aspect
ratios. The car's real body/wheel painter (`StoryCarRenderer`) remains in
charge of wheel fitting and reference origins.

Optional approach-to-camera horizontal convergence for directed movement:

```
x(y) = vanishX + (x_ref - vanishX) * scale(y) / scale(r)
```

This is opt-in; ordinary left-right staging leaves X unchanged. Occlusion
is sorted by grounded `y` (nearer sprites appear in front), with a small
optional `layerBias` for dramatic foreground shots.

### Initial parameter families (not yet asset-by-asset calibration)

| Family | Horizon h | Back line b | Normal r | Near n | gamma |
| --- | ---: | ---: | ---: | ---: | ---: |
| Location | .40 | .52 | .76 | .94 | 1.00 |
| Interior | .34 | .54 | .78 | .95 | .90 |
| Road | n/a | .48 | .72 | .91 | orthographic |

For the location family, a character at `y=.76` is 1× reference size,
at `y=.58` is 0.5×, and at `y=.88` is ~1.33×. Moving behind `y=.52`
is forbidden. Values are mathematical examples, not visually validated
measurements of a particular Shibuya image.

Side-scrolling racing is deliberately *not* ground-perspective scaled:
RaceScene draws a 1560×720 road with horizontally scrolling road and
foreground, while the skyline moves with slower parallax. A car changing race
lanes is not approaching a pinhole camera in that 2D side view. Its nominal
vehicle scale remains unchanged. Likewise, the layered professional Drag
Complex must retain its existing 3D-like track/world rendering logic.

## Story Director integration

Scripts can now refer to **stable background IDs** instead of copying asset
paths across story files. Illustrative example:

```js
{type:'STAGE',
  backgroundId:'meet:shibuyaDogenzaka:day',
  stageMode:'cinematic', // 1560×840; 'native' respects Meet's stage window
  characters:[
    {id:'sayakaFujieda',pose:'ginzaDress',x:225,ground:.66},
    {id:'arkonDen',pose:'ginzaSuit',x:510,ground:.85},
  ],
  cars:[{carId:'ae86',x:1010,ground:.70}]
}
{type:'HOLD_SCENE',label:'CONTINUE'}
{type:'CLEAR_STAGE'}
```

In these scenes, the author supplies only `ground` (normalized 0–1) to
place a sprite at the correct apparent size; the position is clamped behind
the back line and the scale is derived automatically. Manual `height`,
`width`, `x`, `y`, `depth` overrides still work. If a script supplies
a legacy `background:{key,path}` instead, its old composition-based staging
remains unchanged.

The catalog includes crop policy (`cover`, `bottom-cover`,
`zoom-cover`, `contain`, `top-fit`) and original native frame
dimensions. Story authoring may choose a full cinematic render or a masked
native scene stage without moving the actual game artwork.

Do **not** pass a `road:` or `pro:dragstrip:` ID to a static STAGE;
these records have no flat asset and should be directed via their live
RaceScene / FourLaneTestScene adapters.

## Developer preview and visual calibration status

Use **Dev Scenes → STORY DIRECTOR — PERSPECTIVE / BACKGROUNDS** to advance
through Dogenzaka, Shinonome Warehouse HQ and Ginza. The preview uses real
car and portrait textures at deliberately different ground depths. It is
non-canonical and does not mutate story or career progress.

The following is deliberately **not yet done**:
1. Measuring per-background image-specific horizons, walkable ground region,
   foreground props / overlap, and safe horizontal bounds.
2. Rewriting standard live Garage, Meet or Race scene sprite placement; this
   release changes only **opt-in Story Director staging**.
3. Deleting or renaming duplicate/deprecated PNG files. Physical asset cleanup
   must be gated by a reference audit and visual approval.

A later Dev calibration tool should display horizon/back/near lines, a car
and character at a chosen depth, and allow per-scene adjustments. Save those
calibrations to the single catalog, never as scene-specific magic numbers.
