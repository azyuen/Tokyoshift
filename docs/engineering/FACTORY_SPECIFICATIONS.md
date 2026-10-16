# Targeted factory specification corrections

This is an incremental provenance ledger, not a claim that all 43 factory variants have been independently verified. No model/save IDs, driver assignments, art or exclusive specifications change.

## Honda S2000 AP1 — corrected

Primary source: [Honda April 1999 specification](https://www.honda.co.jp/factbook/auto/s2000/199904/050.html), reviewed 2026-10-16 UTC.

The retained 184 kW / 218 Nm F20C corresponds to the Japanese 250 PS / 22.2 kgf·m specification. Adopt the non-navigation 1,240 kg variant (previously 1,260 kg). Honda lists fifth/sixth as 0.970/0.810 and reductions of **1.160 primary × 4.100 final**. The old model had 0.943/0.763 and omitted the primary reduction entirely. The first four ratios are unchanged.

`primaryReductionRatio` is optional and defaults to 1. `effectiveFinalDrive` combines it with the differential ratio once; Transmission, AI (through Transmission), performance estimation, rolling-start setup and dyno gearing all consume that overall reduction. The differential remains separately represented as 4.100. No saved upgrade field is renamed or deleted. The regional S2000 rival correctly inherits the correction; the separately configured Amuse hero does not.

Only seven S2000 core builds (standing and rolling) and its 12 supplementary scenarios were rerun. The previous rows remain in `before-spec-correction-s2000.json`; all other rows and the entire original baseline are preserved. Unaffected supplementary records retain their original source hashes: they are historical runs, not falsely relabelled new executions. A subsequent general harness invocation may conservatively rerun them because its source hash changed.

| Standard build | Previous 400 m | Corrected 400 m |
|---|---:|---:|
| Stock | 14.367 s | 14.276 s |
| Budget | 14.123 s | 14.060 s |
| Street | 13.649 s | 13.597 s |
| Intermediate | 12.573 s | 12.593 s |
| Advanced | 12.312 s | 12.327 s |
| Maximum | 11.491 s | 11.510 s |

These are seeded simulated times, not road-test measurements. Shorter gearing improves stock acceleration but introduces shift/traction trade-offs at higher power. All standard stages still improve over the preceding stage. Factory class remains B; potential remains High after regeneration.

## Mazda RX-7 FD — metadata corrected, no physics change

Primary source: [Mazda December 1998 launch release](https://newsroom.mazda.com/en/publicity/release/1998/9812/981215be.html), reviewed 2026-10-16 UTC.

The 280 PS / 32.0 kgf·m RX-7 went on sale in January 1999. The game's 206 kW / 314 Nm therefore cannot describe its previous 1992 label. Correct the metadata year to 1999; retain the established FD identity and art. The 1,280 kg configuration approximates Type RS mass, but its inherited final drive is not independently verified here. Do not label this an exact Type RS recreation yet. Both years remain within the existing 1990s restriction.

## Open discrepancies — not silently converted into a different model

- SVX: [Subaru's Japanese Version E catalogue](https://ucar.subaru.jp/php/catalog/grade.php?cat_id=4500997) lists 177 kW, 1,580 kg, four-speed automatic and 3.700 final. The registry has 169 kW, 1,590 kg and 3.545, potentially mixing export/trim specifications. The four automatic ratios are represented using the game's common clutch/shift model, not a torque-converter simulation. Market/trim must be resolved before changing performance.
- FC3S: 1989 metadata and 136 kW may combine later model-year presentation with earlier turbo output. A precise primary-source variant match remains outstanding.
- 3000GT: the 235 kW rating requires checking against the named 1994 VR-4 market, especially PS versus mechanical-horsepower conversion. Do not infer a correction from unit labels alone.
- Magna: developer-only status is preserved; exact Australian Sports year/engine specification still needs provenance closure.

## Class formula clarification

The existing classes reproduce from **402.336 m and 804.672 m** splits, not rounded 400/800 m. Score = 0.50 × standing quarter-mile + 0.25 × standing half-mile / 1.54 + 0.25 × rolling quarter-mile × 1.25. Thresholds remain 14.1 / 14.8 / 15.5. Earlier report prose incorrectly called these 400/800 m; no unaffected class is changed. A regression now checks all 43 stored scores against the actual split formula.
