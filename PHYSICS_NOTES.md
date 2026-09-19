# Phase 1 physics notes

The prototype intentionally uses a simplified drivetrain rather than `speed += acceleration` arcade logic.

## Core loop

1. Engine torque is interpolated from an RPM torque curve.
2. Turbo boost multiplies available combustion torque and has its own spool state.
3. NOS adds RPM-dependent torque while held and consumes a finite supply.
4. Clutch engagement determines torque capacity between engine and gearbox.
5. Engine RPM and driveline RPM can differ while the clutch slips.
6. Gear ratio + final drive convert transmitted engine torque to wheel torque.
7. Tyres compare demanded force with available driven-wheel traction.
8. Excess force becomes independent wheel surface speed / slip rather than extra road acceleration.
9. Aerodynamic drag and rolling resistance oppose road force.
10. Net force / mass produces vehicle acceleration and track position.

## Deliberate skill effects

- High-RPM clutch dumps exceed tyre grip, build wheel speed and move the tyre below peak traction.
- A progressive launch can hold the car nearer available grip.
- Excessively slow clutch release limits transmitted torque and costs time.
- Shifts with inadequate clutch are rejected.
- Shifts with too much throttle and/or marginal clutch take longer and add drivetrain shock.
- Boost decays on throttle lift / during shifts, then has to respool under load.

## Current smoke-test calibration

A deterministic scripted run of the current physics produced approximately:

- reasonably clean launch, no NOS: ~14.0 s quarter mile
- high-RPM clutch dump: ~14.7 s quarter mile with substantially more wheel slip
- overly slow clutch release: ~14.2 s quarter mile
- reasonably clean run using NOS for part of the pass: ~14.0 s, with a slightly higher trap speed

These are calibration checks, not final performance targets. The next pass should be driven by how the touch controls actually feel on a phone, not by chasing exact ET numbers.
