# 43-car engineering audit — development branch

**Validation in progress; not a release sign-off.** Generated from the preserved 301-build baseline and revised datasets. Baseline uses R527 physics. Revised includes the S2000 factory gearing/mass correction and the shared smart-driver clutch correction of 24 October. See FACTORY_SPECIFICATIONS.md and LAUNCH_CONTROL_REVIEW.md; unchanged rolling and rating-3 evidence is retained with its original provenance. Both use production Vehicle/Engine/AI, 120 Hz, seeded driver, standing and 60 km/h rolling starts, NOS disabled. Times are simulated, not measured road-test results. Exactly 400/800 m are shown; raw JSON also includes quarter/half-mile splits, acceleration ranges, spin duration, gear changes and complete factory configurations.

## Provenance
Baseline SHA-256: `821dd78835ee44ed8681c7a02dae518218b7497e2b34a9c40e0230490fd149e6`

Revised SHA-256: `8bda3833225a0c70511e62788e58413fd7e212e28b2945716b0925e1930257a6`

The model identities are inherited from the registry. Exact model years are not asserted where the registry does not identify one. A 43-model external factory-specification verification is still incomplete. Factory output normalization is tested to <1% against rated kW and Nm; displayed values to <1 kW/Nm against engine output. Gearing, Cd, frontal area, grip and driveline loss remain inherited gameplay calibrations pending further provenance review.

## Stock and maximum standard builds

| ID / model | Engine family / aspiration | Stock kW / Nm / kg | Class / potential | Stock 400 / 800 / roll 400 s | Max kW / Nm | Max 400 / 800 s | Role |
|---|---|---|---|---|---|---|---|
| gdb — Subaru Impreza WRX STI GDB | EJ207 / turbo | 206.00 / 373.00 / 1430.00 | A / Exceptional | 13.61 / 21.15 / 11.31 | 358.30 / 623.01 | 10.89 / 16.93 | Launch consistency; driveline loss and mass |
| gf8 — Subaru Impreza WRX STI GF8 | Subaru EJ207 GF8 Version VI / turbo | 206.00 / 353.00 / 1310.00 | A / Exceptional | 13.38 / 20.85 / 11.19 | 349.80 / 579.07 | 10.66 / 16.68 | Launch consistency; driveline loss and mass |
| s15 — Nissan Silvia S15 | SR20DET S15 / turbo | 184.00 / 275.00 / 1240.00 | A / Exceptional | 13.92 / 21.42 / 11.33 | 358.07 / 535.02 | 11.04 / 16.85 | Rolling pace; launch control matters |
| starion — Mitsubishi Starion GSR-VR | G54B Turbo / turbo | 129.00 / 313.00 / 1340.00 | D / Moderate | 15.53 / 24.03 / 12.47 | 245.81 / 564.11 | 12.13 / 18.77 | Rolling pace; launch control matters |
| fto — Mitsubishi FTO GPX | 6A12 MIVEC / NA | 147.00 / 200.00 / 1170.00 | C / High | 14.96 / 22.99 / 11.93 | 297.50 / 410.77 | 11.85 / 17.92 | Light chassis; front-axle traction limits |
| mx5 — Mazda MX-5 NB | BP 1.8 DOHC / NA | 103.00 / 162.00 / 1030.00 | D / High | 15.40 / 24.18 / 12.65 | 233.65 / 363.95 | 11.61 / 18.00 | Rolling pace; launch control matters |
| sa22c — Mazda RX-7 SA22C Turbo | 12A Turbo / turbo | 121.00 / 226.00 / 1020.00 | B / High | 14.59 / 22.76 / 11.95 | 252.28 / 454.34 | 11.36 / 17.51 | Rolling pace; launch control matters |
| mx6 — Mazda MX-6 | KL-ZE 2.5 V6 / NA | 147.00 / 224.00 / 1210.00 | C / High | 15.01 / 23.03 / 11.94 | 313.75 / 474.42 | 11.80 / 17.86 | Light chassis; front-axle traction limits |
| prelude — Honda Prelude Type S | H22A Type S / NA | 162.00 / 221.00 / 1310.00 | C / High | 15.00 / 22.98 / 12.04 | 331.12 / 459.71 | 11.81 / 17.86 | Light chassis; front-axle traction limits |
| sw20 — Toyota MR2 SW20 Turbo | 3S-GTE Gen III / turbo | 180.00 / 304.00 / 1260.00 | A / Exceptional | 13.61 / 21.11 / 11.31 | 343.80 / 574.75 | 10.76 / 16.59 | Mid-engine traction; expensive platform |
| soarer — Toyota Soarer JZZ30 | 1JZ-GTE Twin Turbo / turbo | 206.00 / 363.00 / 1560.00 | B / High | 14.12 / 21.70 / 11.50 | 414.36 / 715.73 | 11.28 / 17.14 | Rolling pace; launch control matters |
| forester — Subaru Forester SF5 S/tb | EJ20 Turbo S/tb / turbo | 184.00 / 306.00 / 1380.00 | B / High | 14.18 / 22.17 / 11.80 | 322.92 / 527.59 | 11.27 / 17.64 | Launch consistency; driveline loss and mass |
| svx — Subaru SVX | EG33 Flat-Six / NA | 169.00 / 309.00 / 1590.00 | C / High | 15.31 / 23.67 / 12.23 | 350.14 / 629.12 | 11.58 / 17.90 | Launch consistency; driveline loss and mass |
| xt — Subaru Alcyone XT Turbo | EA82T / turbo | 100.00 / 196.00 / 1190.00 | D / Low | 16.83 / 26.06 / 13.28 | 192.73 / 366.02 | 13.00 / 20.07 | Launch consistency; driveline loss and mass |
| ae86 — Toyota Sprinter Trueno AE86 | Toyota 4A-GE 1.6L DOHC / NA | 96.00 / 149.00 / 940.00 | C / High | 15.28 / 23.97 / 12.43 | 214.62 / 328.56 | 11.52 / 17.86 | Rolling pace; launch control matters |
| ef — Honda Civic SiR EF | Honda B16A VTEC / NA | 117.98 / 150.00 / 1010.00 | C / High | 15.14 / 23.56 / 12.28 | 256.46 / 336.41 | 11.60 / 17.78 | Light chassis; front-axle traction limits |
| ek9 — Honda Civic Type R EK9 | Honda B16B 1.6L VTEC / NA | 136.00 / 160.00 / 1090.00 | C / High | 15.18 / 23.50 / 12.08 | 285.58 / 342.33 | 11.58 / 17.72 | Light chassis; front-axle traction limits |
| s2000 — Honda S2000 AP1 | Honda F20C 2.0L VTEC / NA | 184.00 / 218.00 / 1240.00 | B / High | 14.28 / 21.78 / 11.33 | 349.61 / 422.49 | 11.49 / 17.35 | Rolling pace; launch control matters |
| fc3s — Mazda RX-7 FC3S | Mazda 13B-T Rotary Turbo / turbo | 136.00 / 245.00 / 1250.00 | C / High | 14.97 / 23.21 / 12.18 | 283.52 / 509.37 | 11.63 / 17.82 | Rolling pace; launch control matters |
| rx7fd — Mazda RX-7 FD3S | Mazda 13B-REW Twin Turbo / turbo | 206.00 / 314.00 / 1280.00 | A / Exceptional | 13.66 / 20.88 / 11.00 | 406.50 / 627.94 | 10.91 / 16.49 | Rolling pace; launch control matters |
| rx8 — Mazda RX-8 | Mazda 13B-MSP RENESIS / NA | 170.00 / 211.00 / 1370.00 | B / High | 14.37 / 22.31 / 11.80 | 332.95 / 447.80 | 11.26 / 17.35 | Rolling pace; launch control matters |
| galant — Mitsubishi Galant VR-4 | Mitsubishi 4G63T 2.0L DOHC Turbo // Galant VR-4 Evolution / turbo | 176.00 / 304.00 / 1380.00 | B / High | 14.60 / 22.62 / 11.90 | 332.62 / 565.78 | 11.22 / 17.49 | Launch consistency; driveline loss and mass |
| evo5 — Mitsubishi Lancer Evolution V | Mitsubishi 4G63T Evolution V / turbo | 206.00 / 373.00 / 1360.00 | A / Exceptional | 13.65 / 21.21 / 11.30 | 382.66 / 665.71 | 10.65 / 16.57 | Launch consistency; driveline loss and mass |
| evo6 — Mitsubishi Lancer Evolution VI | Mitsubishi 4G63T Evolution VI / turbo | 206.00 / 373.00 / 1360.00 | A / Exceptional | 13.60 / 21.13 / 11.27 | 384.77 / 663.97 | 10.64 / 16.56 | Launch consistency; driveline loss and mass |
| gc8 — Subaru Impreza WRX STI GC8 | Subaru EJ207 2.0L Turbo // Impreza GC8 STI / turbo | 206.00 / 353.00 / 1260.00 | A / Exceptional | 13.27 / 20.68 / 11.11 | 357.40 / 591.81 | 10.52 / 16.45 | Launch consistency; driveline loss and mass |
| r32 — Nissan Skyline GT-R R32 | Nissan RB26DETT 2.6L Twin Turbo / turbo | 206.00 / 353.00 / 1430.00 | A / Exceptional | 13.87 / 21.51 / 11.39 | 417.75 / 712.37 | 10.69 / 16.55 | Launch consistency; driveline loss and mass |
| r34 — Nissan Skyline GT-R R34 | Nissan RB26DETT R34 Twin Turbo / turbo | 206.00 / 392.00 / 1560.00 | B / Exceptional | 13.95 / 21.70 / 11.60 | 418.94 / 769.01 | 10.79 / 16.74 | Launch consistency; driveline loss and mass |
| 3000gt — Mitsubishi 3000GT VR-4 | Mitsubishi 6G72 3.0L Twin Turbo V6 / turbo | 235.00 / 427.00 / 1710.00 | B / Exceptional | 13.91 / 21.54 / 11.59 | 460.08 / 826.97 | 10.81 / 16.72 | Launch consistency; driveline loss and mass |
| a60 — Toyota Celica Supra A60 | Toyota 5M-GE 2.8L Straight-Six / NA | 118.00 / 221.00 / 1360.00 | D / Moderate | 15.58 / 24.55 / 12.88 | 260.66 / 488.94 | 11.96 / 18.63 | Rolling pace; launch control matters |
| jza80 — Toyota Supra JZA80 | Toyota 2JZ-GTE 3.0L Twin Turbo / turbo | 206.00 / 435.00 / 1510.00 | A / Exceptional | 13.95 / 21.51 / 11.35 | 421.65 / 872.18 | 11.12 / 16.94 | Rolling pace; launch control matters |
| nsx — Honda NSX NA1 | Honda C30A 3.0L V6 VTEC / NA | 206.00 / 294.00 / 1350.00 | A / Exceptional | 13.15 / 20.38 / 10.95 | 399.49 / 602.68 | 10.24 / 15.83 | Mid-engine traction; expensive platform |
| z32 — Nissan 300ZX Z32 Twin Turbo | VG30DETT / turbo | 206.00 / 388.00 / 1530.00 | A / Exceptional | 13.93 / 21.46 / 11.41 | 418.71 / 778.37 | 10.99 / 16.79 | Rolling pace; launch control matters |
| z33 — Nissan 350Z Z33 | VQ35DE / NA | 206.00 / 363.00 / 1450.00 | A / Exceptional | 13.52 / 20.90 / 11.08 | 404.11 / 743.20 | 10.80 / 16.55 | Rolling pace; launch control matters |
| 240z — Datsun 240Z | L24 / NA | 112.00 / 198.00 / 1044.00 | C / High | 14.92 / 23.55 / 12.33 | 247.47 / 437.62 | 11.51 / 17.90 | Rolling pace; launch control matters |
| crx — Honda CR-X SiR EF8 | B16A / NA | 118.00 / 152.00 / 1000.00 | C / High | 15.24 / 23.64 / 12.33 | 256.50 / 338.11 | 11.85 / 18.04 | Light chassis; front-axle traction limits |
| dc2 — Honda Integra Type R DC2 | B18C / NA | 147.00 / 181.00 / 1060.00 | B / High | 14.71 / 22.59 / 11.59 | 310.96 / 399.85 | 11.64 / 17.56 | Light chassis; front-axle traction limits |
| eclipse — Mitsubishi Eclipse GSX | 4G63T / turbo | 157.00 / 290.00 / 1480.00 | C / High | 15.14 / 23.58 / 12.37 | 309.77 / 558.03 | 11.56 / 18.06 | Launch consistency; driveline loss and mass |
| familia — Mazda Familia GT-R | BPT / turbo | 136.00 / 235.00 / 1210.00 | C / High | 15.16 / 23.64 / 12.36 | 268.48 / 457.58 | 11.54 / 18.05 | Launch consistency; driveline loss and mass |
| 180sx — Nissan 180SX | SR20DET / turbo | 151.00 / 274.00 / 1220.00 | B / High | 14.39 / 22.26 / 11.73 | 301.48 / 535.56 | 11.29 / 17.32 | Rolling pace; launch control matters |
| st205 — Toyota Celica GT-Four ST205 | 3S-GTE / turbo | 188.00 / 304.00 / 1390.00 | B / High | 14.20 / 22.09 / 11.75 | 354.45 / 571.74 | 11.03 / 17.17 | Launch consistency; driveline loss and mass |
| jzx100 — Toyota Chaser JZX100 | 1JZ-GTE VVT-i / turbo | 206.00 / 378.00 / 1470.00 | A / Exceptional | 13.79 / 21.24 / 11.30 | 408.99 / 730.86 | 10.94 / 16.72 | Rolling pace; launch control matters |
| b4rsk — Subaru Legacy B4 RSK | EJ208 / turbo | 206.00 / 343.00 / 1470.00 | A / High | 13.90 / 21.56 / 11.49 | 346.47 / 561.00 | 11.19 / 17.40 | Launch consistency; driveline loss and mass |
| magna — 1998 Mitsubishi Magna Sports | 6G72 3.0 V6 / NA | 140.00 / 255.00 / 1450.00 | D / Moderate | 15.49 / 23.97 / 12.44 | 308.37 / 558.53 | 12.03 / 18.34 | Light chassis; front-axle traction limits |

## Transmission, engine response and chassis assumptions

| ID | Drive | Game gear ratios | Primary × final | Redline | Stock boost bar | Onset / full rpm | Efficiency | Grip | Cd / m² | Displacement L / compression | Compressor lb/min / built BMEP bar |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gdb | AWD | 3.636 / 2.375 / 1.761 / 1.346 / 1.062 / 0.842 | 1 × 3.9 | 8000.00 | 1.05 | 1800 / 3800 | 0.84 | 1.00 | 0.32 / 1.85 | 2 / 8 | 54 / 35 |
| gf8 | AWD | 3.166 / 1.882 / 1.296 / 0.972 / 0.738 | 1 × 4.444 | 7000.00 | 0.80 | 2000 / 4000 | 0.84 | 1.02 | 0.35 / 1.95 | 2 / 8 | 49 / 32 |
| s15 | RWD | 3.626 / 2.2 / 1.541 / 1.213 / 1 / 0.767 | 1 × 3.692 | 7500.00 | 0.80 | 1900 / 4000 | 0.88 | 1.00 | 0.32 / 1.85 | 2 / 8.5 | 54 / 35 |
| starion | RWD | 3.369 / 2.035 / 1.36 / 1 / 0.856 | 1 × 3.545 | 6000.00 | 0.60 | 1700 / 3500 | 0.88 | 1.00 | 0.32 / 1.85 | 2.6 / 7 | 42 / 25 |
| fto | FWD | 3.583 / 1.947 / 1.343 / 0.976 / 0.804 | 1 × 4.312 | 8000.00 | 0.00 | 2200 / 4300 | 0.90 | 1.00 | 0.32 / 1.85 | 2 / 10 | 40 / 25 |
| mx5 | RWD | 3.136 / 1.888 / 1.33 / 1 / 0.814 | 1 × 4.3 | 7000.00 | 0.00 | 2100 / 4200 | 0.88 | 1.00 | 0.32 / 1.85 | 1.8 / 9.5 | 39 / 29 |
| sa22c | RWD | 3.622 / 2.186 / 1.419 / 1 / 0.807 | 1 × 3.909 | 7000.00 | 0.55 | 2100 / 4200 | 0.88 | 1.00 | 0.32 / 1.85 | 1.146 / 8.5 | 40 / 25 |
| mx6 | FWD | 3.307 / 1.833 / 1.31 / 1.03 / 0.795 | 1 × 4.105 | 7000.00 | 0.00 | 1900 / 3900 | 0.90 | 1.00 | 0.32 / 1.85 | 2.5 / 10 | 45 / 24 |
| prelude | FWD | 3.285 / 1.956 / 1.344 / 1.034 / 0.787 | 1 × 4.266 | 7800.00 | 0.00 | 2200 / 4500 | 0.90 | 1.00 | 0.32 / 1.85 | 2.2 / 11 | 45 / 26 |
| sw20 | RWD | 3.23 / 1.913 / 1.258 / 0.918 / 0.731 | 1 × 4.285 | 7250.00 | 0.85 | 1800 / 3700 | 0.88 | 1.00 | 0.32 / 1.85 | 2 / 8.5 | 54 / 36 |
| soarer | RWD | 3.251 / 1.955 / 1.31 / 1 / 0.753 | 1 × 4.083 | 7000.00 | 0.70 | 2100 / 4200 | 0.88 | 1.00 | 0.32 / 1.85 | 2.5 / 8.5 | 64 / 37 |
| forester | AWD | 3.454 / 1.947 / 1.366 / 0.972 / 0.738 | 1 × 4.444 | 7000.00 | 0.80 | 1700 / 3600 | 0.84 | 1.00 | 0.36 / 2.2 | 2 / 8 | 46 / 30 |
| svx | AWD | 2.785 / 1.545 / 1 / 0.694 | 1 × 3.545 | 7000.00 | 0.00 | 1800 / 3800 | 0.84 | 1.00 | 0.32 / 1.85 | 3.3 / 10 | 49 / 23 |
| xt | AWD | 3.545 / 1.947 / 1.366 / 0.972 / 0.783 | 1 × 3.7 | 6500.00 | 0.50 | 2000 / 3900 | 0.84 | 1.00 | 0.32 / 1.85 | 1.8 / 7.7 | 28 / 24 |
| ae86 | RWD | 3.587 / 2.022 / 1.384 / 1 / 0.861 | 1 × 4.3 | 7600.00 | 0.00 | 2300 / 4400 | 0.89 | 1.00 | 0.34 / 1.72 | 1.6 / 9.4 | 34 / 28 |
| ef | FWD | 3.23 / 2.105 / 1.458 / 1.107 / 0.848 | 1 × 4.4 | 8000.00 | 0.00 | 2400 / 4600 | 0.90 | 1.01 | 0.34 / 1.88 | 1.6 / 10.2 | 38 / 30 |
| ek9 | FWD | 3.23 / 2.105 / 1.458 / 1.107 / 0.848 | 1 × 4.4 | 8400.00 | 0.00 | 2500 / 4700 | 0.90 | 1.01 | 0.34 / 1.88 | 1.6 / 10.8 | 40 / 31 |
| s2000 | RWD | 3.133 / 2.045 / 1.481 / 1.161 / 0.97 / 0.81 | 1.16 × 4.1 | 9000.00 | 0.00 | 2600 / 4800 | 0.90 | 1.05 | 0.35 / 1.8 | 2 / 11.7 | 45 / 31 |
| fc3s | RWD | 3.483 / 2.015 / 1.391 / 1 / 0.762 | 1 × 4.1 | 7000.00 | 0.70 | 2100 / 4000 | 0.88 | 1.00 | 0.31 / 1.78 | 1.308 / 8.5 | 48 / 29 |
| rx7fd | RWD | 3.483 / 2.015 / 1.391 / 1 / 0.762 | 1 × 4.1 | 8000.00 | 0.85 | 1900 / 3500 | 0.88 | 1.00 | 0.31 / 1.78 | 1.308 / 9 | 60 / 33 |
| rx8 | RWD | 3.76 / 2.269 / 1.645 / 1.187 / 1 / 0.843 | 1 × 4.444 | 9000.00 | 0.00 | 2700 / 4900 | 0.88 | 1.02 | 0.31 / 1.93 | 1.308 / 10 | 43 / 25 |
| galant | AWD | 2.846 / 1.581 / 1.16 / 0.862 / 0.617 | 1 × 4.929 | 7000.00 | 0.78 | 1900 / 3800 | 0.84 | 1.02 | 0.35 / 2.09 | 2 / 7.8 | 52 / 34 |
| evo5 | AWD | 2.785 / 1.95 / 1.407 / 1.031 / 0.761 | 1 × 4.529 | 7500.00 | 0.92 | 1700 / 3500 | 0.84 | 1.02 | 0.36 / 2.09 | 2 / 8.8 | 60 / 39 |
| evo6 | AWD | 2.785 / 1.95 / 1.407 / 1.031 / 0.761 | 1 × 4.529 | 7500.00 | 0.96 | 1700 / 3500 | 0.84 | 1.02 | 0.36 / 2.09 | 2 / 8.8 | 61 / 39 |
| gc8 | AWD | 3.166 / 1.882 / 1.296 / 0.972 / 0.738 | 1 × 4.444 | 7000.00 | 0.80 | 1900 / 3800 | 0.84 | 1.03 | 0.35 / 2 | 2 / 8 | 50 / 33 |
| r32 | AWD | 3.214 / 1.925 / 1.302 / 1 / 0.752 | 1 × 4.111 | 8000.00 | 0.75 | 2200 / 4400 | 0.84 | 1.02 | 0.4 / 1.95 | 2.6 / 8.5 | 68 / 39 |
| r34 | AWD | 3.827 / 2.36 / 1.685 / 1.312 / 1 / 0.793 | 1 × 3.545 | 8000.00 | 0.82 | 2000 / 4200 | 0.84 | 1.05 | 0.35 / 2.02 | 2.6 / 8.5 | 75 / 40 |
| 3000gt | AWD | 3.083 / 1.684 / 1.115 / 0.833 / 0.666 / 0.536 | 1 × 4.153 | 7000.00 | 0.75 | 1800 / 3500 | 0.82 | 1.03 | 0.33 / 2.03 | 3 / 8 | 67 / 35 |
| a60 | RWD | 3.285 / 1.894 / 1.275 / 1 / 0.783 | 1 × 4.1 | 6500.00 | 0.00 | 2000 / 4000 | 0.87 | 0.98 | 0.38 / 1.91 | 2.8 / 8.8 | 40 / 24 |
| jza80 | RWD | 3.827 / 2.36 / 1.685 / 1.312 / 1 / 0.793 | 1 × 3.27 | 6800.00 | 0.80 | 1700 / 3500 | 0.87 | 1.03 | 0.31 / 1.93 | 3 / 8.5 | 90 / 42 |
| nsx | RWD | 3.071 / 1.727 / 1.23 / 0.967 / 0.771 | 1 × 4.06 | 8000.00 | 0.00 | 2400 / 4500 | 0.90 | 1.08 | 0.32 / 1.79 | 3 / 10.2 | 52 / 29 |
| z32 | RWD | 3.214 / 1.925 / 1.302 / 1 / 0.752 | 1 × 3.692 | 7000.00 | 0.70 | 1800 / 3700 | 0.88 | 1.03 | 0.31 / 1.93 | 3 / 8.5 | 66 / 35 |
| z33 | RWD | 3.794 / 2.324 / 1.624 / 1.271 / 1 / 0.794 | 1 × 3.538 | 6600.00 | 0.00 | 2100 / 4100 | 0.88 | 1.08 | 0.32 / 1.79 | 3.5 / 10.3 | 53 / 27 |
| 240z | RWD | 3.321 / 2.077 / 1.308 / 1 / 0.864 | 1 × 3.9 | 6500.00 | 0.00 | 2000 / 3900 | 0.88 | 0.98 | 0.38 / 1.91 | 2.4 / 9 | 38 / 25 |
| crx | FWD | 3.25 / 2.052 / 1.416 / 1.103 / 0.87 | 1 × 4.4 | 8000.00 | 0.00 | 2400 / 4600 | 0.90 | 1.01 | 0.34 / 1.88 | 1.6 / 10.2 | 38 / 30 |
| dc2 | FWD | 3.23 / 2.105 / 1.458 / 1.107 / 0.848 | 1 × 4.785 | 8400.00 | 0.00 | 2500 / 4600 | 0.90 | 1.01 | 0.34 / 1.88 | 1.8 / 11.1 | 44 / 31 |
| eclipse | AWD | 3.083 / 1.684 / 1.115 / 0.833 / 0.666 | 1 × 4.929 | 7000.00 | 0.75 | 1800 / 3600 | 0.84 | 1.02 | 0.35 / 2.09 | 2 / 8.5 | 54 / 35 |
| familia | AWD | 3.454 / 1.833 / 1.31 / 0.97 / 0.717 | 1 × 4.214 | 7000.00 | 0.65 | 1900 / 3900 | 0.84 | 1.02 | 0.35 / 2.09 | 1.8 / 8.2 | 44 / 32 |
| 180sx | RWD | 3.321 / 1.902 / 1.308 / 1 / 0.759 | 1 × 4.083 | 7500.00 | 0.70 | 2000 / 4100 | 0.88 | 1.00 | 0.31 / 1.78 | 2 / 8.5 | 52 / 34 |
| st205 | AWD | 3.384 / 1.913 / 1.258 / 0.918 / 0.731 | 1 × 4.285 | 7200.00 | 0.90 | 1800 / 3700 | 0.84 | 1.02 | 0.35 / 2.09 | 2 / 8.5 | 55 / 36 |
| jzx100 | RWD | 3.251 / 1.955 / 1.31 / 1 / 0.753 | 1 × 3.727 | 7000.00 | 0.75 | 1700 / 3400 | 0.88 | 1.03 | 0.31 / 1.93 | 2.5 / 9 | 65 / 37 |
| b4rsk | AWD | 3.166 / 1.882 / 1.296 / 0.972 / 0.738 | 1 × 4.444 | 7500.00 | 0.80 | 1800 / 4000 | 0.84 | 1.03 | 0.35 / 2 | 2 / 8.5 | 49 / 31 |
| magna | FWD | 3.583 / 1.947 / 1.266 / 0.97 / 0.767 | 1 × 3.736 | 6500.00 | 0.00 | 1800 / 3800 | 0.90 | 1.00 | 0.32 / 1.85 | 3 / 9 | 47 / 25 |

## Engineering model and limits

Incremental boost output is constrained by compressor flow and displacement/BMEP torque headroom, with a smooth saturation curve rather than an abrupt output ceiling. Internals, ECU/fueling and charge cooling each limit available boost; the lowest supported limit applies. Larger turbos delay response and add mass for NA conversions. Rotaries use a distinct displacement convention and breathing adjustment. Compression is descriptive metadata; its effect is currently represented by per-profile stock boost margin rather than an independent combustion calculation. These envelopes are gameplay design assumptions, not certified safe tuning limits. Exhaust and ECU breathing still use shared coefficients, so further family-specific refinement remains a review item.

The factory curve correction preserves inherited shape where possible and normalizes it to rated torque/power. Some original curves were inconsistent with catalogue values (notably R34 ~226 kW versus 206 kW). No exclusive collector engine was normalized or silently nerfed. The tyre model retains driven-axle load and a fixed launch-load multiplier; transient suspension, heat accumulation and wear are not simulated.

## Recruitment access

| Class | Models | Three least expensive market choices |
|---|---|---|
| A | 15.00 | b4rsk (2,600,000), z33 (2,900,000), sw20 (3,000,000) |
| B | 11.00 | sa22c (2,000,000), forester (2,000,000), rx8 (2,050,000) |
| C | 12.00 | ae86 (950,000), ef (1,150,000), ek9 (1,450,000) |
| D | 4.00 | xt (1,250,000), mx5 (1,350,000), starion (1,800,000) |

All 42 stock market entries remain available through the existing paginated dealership; Magna remains developer-only. Parked parts allow existing owners to use a true stock setup without destroying purchases. This establishes multiple eligible choices, not a guarantee that every cash balance can immediately afford every class. Current gameplay was reconciled through main c3819c9. Long-term earnings and invitation affordability still need playtesting.

## Preserved recruitment assignments

| Region | Character | Car | Class |
|---|---|---|---|
| ODAIBA | aoiShindou | 240z | C |
| ODAIBA | yutoAsakura | ae86 | C |
| ODAIBA | mikaHoshino | xt | D |
| ODAIBA | kaoriNishimura | crx | C |
| ODAIBA | shunAmamiya | sa22c | B |
| ODAIBA | takumiSerizawa | ef | C |
| SHINAGAWA | akiraShimizu | ek9 | C |
| SHINAGAWA | natsumiKagawa | familia | C |
| SHINAGAWA | reiTakamura | a60 | D |
| SHINAGAWA | goroNakajima | starion | D |
| SHINAGAWA | tetsuyaKanda | mx5 | D |
| SHINAGAWA | reikaTachibana | fc3s | C |
| TATSUMI | sotaKisaragi | rx8 | B |
| TATSUMI | yuiNaruse | dc2 | B |
| TATSUMI | daigoMoriyama | sw20 | A |
| TATSUMI | risaTachikawa | fto | C |
| TATSUMI | masatoKurogane | s15 | A |
| TATSUMI | tetsuNakahara | eclipse | C |
| SHIBUYA | haruSakurai | 180sx | B |
| SHIBUYA | miuTanaka | prelude | C |
| SHIBUYA | renjiAoki | mx6 | C |
| SHIBUYA | kentoFujisawa | st205 | B |
| SHIBUYA | rinaTachibana | svx | C |
| SHIBUYA | itsukiKuroda | galant | B |
| YOKOHAMA | masatoIshikawa | r32 | A |
| YOKOHAMA | mikaHayase | gf8 | A |
| YOKOHAMA | reinaKuroda | jzx100 | A |
| YOKOHAMA | ryoheiTakeda | evo6 | A |
| YOKOHAMA | shunMizuno | gdb | A |
| YOKOHAMA | yuiKanzaki | rx7fd | A |
| DAIKOKU | shoNakamura | z33 | A |
| DAIKOKU | miloArai | soarer | B |
| DAIKOKU | naoFujita | b4rsk | A |
| DAIKOKU | akiSenda | gc8 | A |
| DAIKOKU | tetsuoMori | 3000gt | B |
| DAIKOKU | kazuoTanaka | nsx | A |
| SHINJUKU | daigoArakawa | r34 | B |
| SHINJUKU | emiSaionji | s2000 | B |
| SHINJUKU | kaedeTachibana | z32 | A |
| SHINJUKU | renKurosawa | evo5 | A |
| SHINJUKU | rinAmamiya | forester | B |
| SHINJUKU | soraKanzaki | jza80 | A |

## Targeted technical references
These references informed the earlier model pass; they do not independently validate every inherited parameter.

- Nissan Heritage R34 V-spec II: https://www.nissan-global.com/EN/HERITAGE_COLLECTION/280_skyline_gt-r_v-spec_ii.html
- Toyota 1993 Supra: https://global.toyota/en/detail/7868203
- Honda B18C: https://global.honda/jp/tech/engine/car/B18C_integratyper_vtec/
- Honda F20C: https://global.honda/jp/tech/engine/car/F20C_S2000_vtec/
- Mazda RENESIS: https://newsroom.mazda.com/en/publicity/release/2003/200304/0409e.html
- Garrett compressor selection: https://www.garrettmotion.com/racing-and-performance/boost-adviser-finding-the-correct-turbo-for-your-engine/
