# R399 opponent driving

The AI changes only throttle, clutch pedal, gear requests and NOS requests.
Vehicle, Engine, Transmission, Clutch, Tyres, Turbo and NitrousSystem are unchanged.
The planning model calls Engine and Turbo on private probes; estimates never
advance the real car or alter its configuration. Rival builds still come from
the existing player-accessible tuning/build path.

## Techniques and execution

- Easy/tutorial: original staging switch, timed clutch release, redline shifts,
  original NOS timing and rolling-gear heuristic. Easy skill modifiers remain.
- Rookie (1–2): imperfect staging, timed clutch release with crude slip correction,
  heuristic shifts with per-gear error, simple NOS. Deliberate pedal/shift
  hesitation is 220/150 ms respectively; character skills still affect execution.
- Skilled (3): original launch technique, shift target blended 45% toward the
  calculated crossover, 25 ms execution hesitation, basic NOS/rolling selection.
- Expert (4): proportional staging, traction-aware clutch/throttle, built-car
  shift points, anticipatory NOS and rolling gear selection. Precision 0.72.
- Elite (5): same advanced techniques with precision 1, faster pedal response,
  smaller target errors and faster clutch/gear execution. Positive reaction time
  and per-run jitter remain; no frame-by-frame re-roll of smart shift targets.
- Hard Expert precision is 0.88. Hard closes 22% of each attribute's remaining gap
  to 1 rather than multiplying strong personalities into the same ceiling.

## Planning

For each valid adjacent pair, scan in 25-rpm increments above 66% of the usable
rev range. Compare current torque × ratio with next-gear torque × next ratio at
RPM × next/current ratio. Require a crossover to persist for 100 rpm. Final drive
and efficiency cancel in that comparison. Fall back to the current built redline,
with at least 160 rpm below the limiter. A one-frame RPM-rise lookahead reduces
overshoot. Invalid/non-descending ratios cannot produce an early shift.

Torque uses the current Engine config/curve, including ECU modifications and
calibration. Private Turbo probes use the installed maximum boost, onset, ramp,
size and spool rate. The next-gear estimate includes boost loss and recovery;
poor low-RPM turbo gears are consequently less attractive. This is a useful
shift estimate, not a mathematical proof of the globally fastest run.

Traction control estimates available crank torque from the installed tyres,
normal load, wheel radius and actual overall ratio. It adjusts clutch capacity
at launch and throttle thereafter. Filtered measured slip reduces requested
power; signed clutch synchronising torque is included. Launch throttle regulates
RPM around the authored launchRPM. No drivetrain-name branches or bonuses exist.

NOS requires high throttle, mostly engaged clutch, limited synchronising RPM
mismatch, low tyre slip, useful RPM, installed gas remaining, and no active or
imminent shift. Last gear has no next-shift guard. It uses only the installed kit.

Rolling selection compares predicted useful wheel force in each valid gear,
limits it to real tyre capacity, and keeps 10% RPM headroom. Only opponents use
this selector. Player rolling preparation and manual gear changes are unchanged.

## Pink slips

MeetScene now transports unboosted encounterAi in both pink-offer creation paths.
RaceScene applies boostAiForPinkSlip once, only outside Easy, before standing-start
and difficulty adjustments. Acceptance, cooldown and outcomes are untouched.
Previously persisted unmarked boosted AI values cannot be reliably distinguished
from custom personality values; no destructive save migration is attempted.

## Inspect and balance

In the developer console:

```js
const scene = window.TOKYO_SHIFT.scene.getScene('RaceScene');
scene.aiDiagnostics;
```

Includes rating/tier, mode, final attributes, target/actual launch RPM, intended
reaction delay, observed movement reaction, launch slip/pedals, per-gear optimal
and execution targets, accepted shift RPM and quality, NOS transitions and gas,
and split timing. `raceTimes` copies the existing authoritative race timings;
`finish` is the half-mile time in a rolling race. Diagnostic event lists are bounded.
No normal HUD elements were added.

Primary tuning knobs are precision, executionHesitation, shift-target jitter,
traction response/slip target/capacity margin, launch release speed, and NOS
RPM/traction/shift-headroom gates in DragRacingAI. Tune control quality first;
do not change car physics or inject output bonuses to adjust opponent level.

## Validation

Run `node tests/ai-regressions.mjs` (no npm dependencies). It runs the real Vehicle
at fixed timesteps, with reproducible AI random seeds, against stock and Stage 3
Evo III, R32, Supra, Civic EK9 and S2000 builds, standing/rolling, five ratings.
All car IDs including locked heroes also receive finish/shift checks. Additional
30/120 Hz cases supplement the main 60 Hz matrix. Curve/gearing/calibration,
custom-personality, Easy/Hard and pink integration assertions are included.

R399: 1,351 simulated races passed. All 20 matrix combinations have average finish
order 1 > 2 > 3 > 4 > 5 (lower time is faster). Times in the generated report are
from green, intentionally including reaction. Elite/Expert did not dwell on the
limiter, stick in neutral or permanently feather throttle in representative tests.
Easy stock-algorithm comparison on three tuned cars stayed within 0.04 s of the
previous controller's average quarter-mile result. No graphical end-to-end
play-test is implied by the headless physics/import tests.
