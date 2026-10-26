# Tokyo SHIFT Engineering Preview E005 — Human Expert/Elite

Pilot changes ONLY in /engineering-preview. Production /src, live game,
economy, and story remain unchanged.

- Expert and Elite now perceive slip and RPM with bounded observation noise
  every ~120ms and 90ms rather than perfect feedback every engine frame.
- Expert and Elite gearshift initiation and combined clutch release / accelerator
  transition now have human-scale execution time, small variability and less
  surgically exact shift-point selection. Elite retains the edge.
- Touch clutch can swipe down progressively after fully swiping up, unlike
  previous full-depression latch. The accelerator latch remains.
- Two-thumb shortcut: hold clutch, TAP the shifter to upshift; old swipe up/down
  remains supported. A rejected shift still follows existing transmission rules.
- Top-right `E005` revision tag replaces the verbose preview label.
- Compare identical car builds under baseline vs E005 using
  `node tools/engineering-human-ai-preview-e005.mjs` on source branch.
- Simulations alone are not evidence of real device UX or match win rates;
  manually check Safari iPhone/iPad before approving production merge.

Preview: https://azyuen.github.io/Tokyoshift/engineering-preview/
