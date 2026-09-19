# TOKYO SHIFT — Phase 1 Driving Prototype

A clean-slate Phaser prototype focused on one thing: making manual launch + shifting feel satisfying before building progression, economy, licensed-looking cars, or final artwork.

## What is implemented

- 1/4-mile / 402.336 m race
- Player + physics-driven AI opponent
- Analogue touch throttle
- Analogue touch clutch (`0% = engaged`, `100% = pedal down` in telemetry)
- Manual 6-speed transmission with a large mobile upshift pad
- Engine torque curve + RPM inertia
- Clutch torque capacity + clutch slip
- Wheelspin tied to available tyre traction
- Turbo spool / boost / shift boost-drop behaviour
- Hold-to-use finite NOS
- Starting tree + false starts
- Reaction, 60-foot, 1/8-mile, 1/4-mile ET, trap speed
- Side-on scrolling camera
- Temporary procedural Tokyo-night placeholder visuals
- Toggleable physics debug HUD
- Structure ready for data-driven future cars/engines

## Run locally

Because the project uses ES modules, serve the folder rather than double-clicking `index.html`.

### Python

```bash
cd tokyo-shift
python3 -m http.server 8080
```

Open `http://localhost:8080`.

### Keyboard controls

- `W` / Up Arrow — throttle
- `C` — clutch fully depressed while held
- `1`–`6` — select gear
- `Space` — NOS
- `D` — debug physics HUD
- `R` — restart

### Mobile controls

- Large left pedal zone — analogue clutch
- Left NOS button — hold NOS
- Large right pedal zone — analogue throttle
- Large right-side SHIFT ↑ pad — neutral→1st and sequential upshifts

The start tree waits until the player has the clutch depressed and 1st selected. The intended rhythm is: throttle → lift → clutch → SHIFT ↑ → clutch out → throttle.

Desktop testing still supports direct gear selection with 1–6.

## Intentionally NOT implemented yet

Garage, upgrades, campaign, economy, car buying, pink slips, multiplayer, licensed cars, final art, sampled engine audio, transmission damage, engine stalls.

## First tuning targets

The next iteration should tune only the feel of:

1. launch bite point and wheelspin severity
2. clutch release window
3. turbo lag / boost retention between shifts
4. shift acceptance thresholds and shift duration
5. tyre grip and post-peak traction
6. AI launch and shift consistency

Do not add progression until those feel good.
