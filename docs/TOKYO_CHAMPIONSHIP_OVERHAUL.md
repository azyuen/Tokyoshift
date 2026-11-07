# Tokyo Championship mechanics overhaul — approved rules and audit gates

Status: design locked for implementation on feature/tokyo-championship-mechanics-overhaul. No deployment or merge authorised.

## Player registration
- New Pro Seasons register exactly three owned personal cars, with **no requirement** to represent FF, RWD and AWD.
- Preserve registered vehicle instance IDs, upgrades, paint, garage ownership, and save compatibility.
- Pro Season individual events continue to enforce their own drivetrain, class, power and NOS eligibility rules at event entry. Registration itself is drivetrain-open.
- Pro Paddock three bays are registration slots, not drivetrain-specific eligibility slots; display each actual drivetrain. Avoid duplicate instances.
- Legacy saved seasons and in-progress Championship races must resume without data migration that invalidates their saved roster or committed race snapshots.

## Championship events
- Championship eligibility is open to any drivetrain and any legitimately owned eligible car among the three registered cars, including collectors and Le Mans prototypes.
- Knockout and four-wide are two separate individual events. Choose exactly one of the three registered cars for each event; persist an event-specific car lock once the event starts.
- The player may use the same car in both events or a different car in each. Do not change the car mid-event.
- Crew competition retains the existing seven-recruit roster and fixture restrictions.
- Preserve 16 entrants, rounds, points, standings, payouts, progression and restart semantics.

## AI garage
- Each Championship rival owns three persistent, individually identified builds with distinct car IDs, paint/livery, tuning and NOS configuration. Garage assignment and opponent identity remain stable through the Championship and across reloads.
- The majority of opponent builds should be near-max or max-tuned endgame cars; select among them using measured event-specific performance, rather than hidden stat boosts or a narrow repeated red-car pool.
- Use the same legal vehicle performance and race/NOS simulation as the player. Existing approved physics and engineering are frozen pending explicit discussion.
- Do not select Le Mans prototype AI cars unless reproducible benchmarking shows they can be beaten by reasonably attainable max-tuned road/collector builds. Player-owned prototypes remain eligible.
- The fixed-spec collector NOS setting is independent of forbidden engine/chassis tuning. Liberty Walk factory three-shot NOS must not stack with generic NOS kits.

## Required benchmark before AI balance implementation
- Enumerate production car IDs, variant/livery aliases, ownership/collector flags, stock and max-tuned builds, and eight Liberty Walk Full Works builds.
- Run repeatable, seeded race trials at Championship distances for each build with NOS on/off, including high-power launch and shift cases.
- Report median, 10th/90th percentiles, DNF/DQ rates, win rates, power/weight, NOS shots, and gap against attainable reference builds.
- Diagnose opponent selection, car color defaults, AI launch/shift/NOS decisions, and race snapshot generation from actual source.
- Implement with isolated tests for registration, per-event car locks, persistence, AI garage diversity, legal NOS, and Championship standings. Mobile/tablet visual QA required.

## Existing documentation conflict
The November R753/R754/R756 addenda in docs/DRAG_COMPLEX_BLUEPRINT.md describe one FF, one RWD and one AWD registration and bay labels 04 AWD / 05 RWD / 06 FF. This approved change supersedes those registration constraints; code and blueprint must be updated together. Do not silently preserve the old restriction.
