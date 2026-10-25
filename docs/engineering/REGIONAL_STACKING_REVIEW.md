# Regional stacking — preview revision 3 (25 October 2026)

Baseline: integrated preview 217559614a63bbfca4a0adc9d9ede04d4fd2aa1c. This change affects regular-car regional engine refinements only; sealed hero/collector mechanics are unchanged. No profile migration or purchase deletion. Normal live root source is not updated.

## Model

Output requests aggregate once, independent of purchase order. A shared smooth calibration allowance ranges from 2% with no internal/ECU support to 8% with full support. The resulting incremental torque is additionally limited by remaining compressor-flow power and displacement/BMEP torque capacity at each RPM. Existing individual engine profiles supply those capacities; turbo/internal levels scale them. NA builds without turbo use the existing breathing curve with a small finishing allowance. These remain gameplay engineering approximations, not certified real-world tuning limits.

The regional gain cannot exceed the remaining capacity. If the existing standard build already exceeds a provisional capacity estimate, it receives no additional torque there; this patch deliberately does not reduce that standard build. NOS is added separately using the existing temporary shot logic.

Regional boost additions share a maximum 0.08-bar refinement allowance, scaled by internal/ECU/cooling support and bounded by existing supported boost. Existing Stage III boost-map trade-offs apply afterwards as before. Rev refinements share a smooth allowance of 2% of the built redline for pistons or 2.5% for rotaries, scaled by internal/ECU support. This is a calibration allowance, not new engine hardware. Stage III ECU curve positioning uses the pre-regional redline so purchasing rev work does not reduce an existing top-end map.

Weight, drag, grip, launch, efficiency, shift and spool package effects retain their existing values. Workshop benefits no longer promise independent additive output/boost/RPM gains; purchase descriptions explain shared hardware limits. Legacy purchase IDs and object/array forms remain readable. Standard builds and factory classes/potential ratings are unchanged.

## Validation

131 targeted tests pass: all 43 curves, unchanged 301 standard-build outputs, per-car stacked envelope limits, purchase-order independence, duplicates, sequential purchase peak-power monotonicity, dyno/display agreement, parked-parts JSON restore, weak support, sealed heroes, recruitment and workshop regressions.

258 new simulations compare the changed fully stacked configuration only: 43 cars × old/new × standing, rolling and NOS standing. 120 Hz, seeded existing AI; each run records both 400/800 m. No unchanged core matrix was rerun. Full hardware and the existing +1 ECU/boost/gear dyno map were used, not an exhaustive calibration optimizer.

Browser: Chromium hosted preview shell with local revised source overlay reached character selection, imported a synthetic R34 profile, reloaded to profile selection, and recovered 21 purchases with 476 kW output. Zero page errors. This is pre-publication testing, not Safari or actual-owner-save validation.

## Measured comparison — no NOS

| Car | Old kW / Nm | Revised kW / Nm | Old / revised 400 m s | Revised 800 m s | Revised rolling 400 m s | NOS peak kW / Nm |
|---|---:|---:|---:|---:|---:|---:|
| gdb | 480 / 771 | 383 / 617 | 9.67 / 10.29 | 16.00 | 9.03 | 439 / 751 |
| gf8 | 451 / 716 | 361 / 576 | 9.55 / 10.21 | 15.98 | 9.07 | 416 / 709 |
| s15 | 473 / 705 | 383 / 557 | 10.14 / 10.44 | 15.91 | 8.84 | 439 / 693 |
| starion | 346 / 692 | 274 / 559 | 10.87 / 11.45 | 17.66 | 9.80 | 330 / 737 |
| fto | 377 / 516 | 309 / 420 | 11.07 / 11.31 | 17.12 | 9.29 | 365 / 538 |
| mx5 | 317 / 475 | 265 / 400 | 10.57 / 10.86 | 16.78 | 9.29 | 321 / 519 |
| sa22c | 342 / 577 | 280 / 457 | 10.28 / 10.70 | 16.45 | 9.03 | 336 / 595 |
| mx6 | 405 / 600 | 328 / 485 | 11.04 / 11.23 | 16.97 | 9.24 | 384 / 614 |
| prelude | 421 / 584 | 342 / 472 | 11.03 / 11.27 | 17.07 | 9.31 | 398 / 567 |
| sw20 | 470 / 730 | 378 / 577 | 9.69 / 10.16 | 15.63 | 8.74 | 434 / 720 |
| soarer | 559 / 924 | 453 / 736 | 10.19 / 10.66 | 16.16 | 8.97 | 509 / 855 |
| forester | 428 / 655 | 333 / 526 | 9.94 / 10.79 | 16.88 | 9.42 | 389 / 665 |
| svx | 444 / 783 | 360 / 637 | 10.21 / 11.05 | 17.11 | 9.44 | 416 / 753 |
| xt | 260 / 454 | 201 / 365 | 11.31 / 12.39 | 19.13 | 10.55 | 256 / 531 |
| ae86 | 287 / 424 | 239 / 355 | 10.58 / 10.88 | 16.78 | 9.20 | 295 / 485 |
| ef | 348 / 444 | 271 / 373 | 10.72 / 10.98 | 16.79 | 9.15 | 326 / 470 |
| ek9 | 381 / 445 | 298 / 377 | 10.70 / 10.98 | 16.78 | 9.13 | 354 / 463 |
| s2000 | 447 / 528 | 361 / 445 | 10.80 / 10.98 | 16.60 | 9.03 | 416 / 556 |
| fc3s | 414 / 672 | 322 / 550 | 10.43 / 10.94 | 16.70 | 9.23 | 378 / 702 |
| rx7fd | 538 / 826 | 426 / 677 | 10.12 / 10.32 | 15.59 | 8.66 | 482 / 784 |
| rx8 | 433 / 564 | 343 / 484 | 10.39 / 10.79 | 16.62 | 9.21 | 399 / 594 |
| galant | 451 / 705 | 362 / 563 | 9.80 / 10.53 | 16.47 | 9.33 | 418 / 721 |
| evo5 | 546 / 835 | 422 / 669 | 9.33 / 9.93 | 15.48 | 8.82 | 478 / 814 |
| evo6 | 544 / 825 | 426 / 658 | 9.34 / 9.92 | 15.46 | 8.81 | 482 / 811 |
| gc8 | 461 / 732 | 369 / 589 | 9.39 / 9.98 | 15.65 | 8.92 | 425 / 722 |
| r32 | 585 / 934 | 471 / 770 | 9.30 / 10.08 | 15.56 | 8.69 | 527 / 891 |
| r34 | 589 / 1001 | 476 / 820 | 9.43 / 10.19 | 15.73 | 8.92 | 532 / 940 |
| 3000gt | 637 / 1060 | 483 / 839 | 9.48 / 10.35 | 15.99 | 9.15 | 538 / 993 |
| a60 | 354 / 625 | 284 / 526 | 10.89 / 11.29 | 17.56 | 9.71 | 340 / 674 |
| jza80 | 612 / 1155 | 477 / 950 | 10.13 / 10.46 | 15.88 | 8.82 | 533 / 1090 |
| nsx | 531 / 755 | 416 / 652 | 9.40 / 9.80 | 15.17 | 8.50 | 472 / 771 |
| z32 | 567 / 1001 | 464 / 825 | 10.03 / 10.37 | 15.82 | 8.76 | 520 / 973 |
| z33 | 521 / 931 | 417 / 752 | 10.10 / 10.39 | 15.93 | 8.78 | 473 / 918 |
| 240z | 329 / 565 | 270 / 473 | 10.61 / 10.84 | 16.81 | 9.16 | 326 / 595 |
| crx | 341 / 444 | 270 / 375 | 11.06 / 11.22 | 17.03 | 9.24 | 326 / 460 |
| dc2 | 401 / 520 | 324 / 436 | 11.01 / 11.11 | 16.71 | 9.08 | 380 / 522 |
| eclipse | 446 / 704 | 348 / 557 | 10.10 / 10.91 | 16.98 | 9.51 | 404 / 737 |
| familia | 370 / 584 | 297 / 464 | 10.07 / 10.88 | 16.99 | 9.53 | 353 / 626 |
| 180sx | 406 / 679 | 336 / 541 | 10.28 / 10.65 | 16.29 | 9.08 | 392 / 701 |
| st205 | 467 / 738 | 387 / 584 | 9.71 / 10.44 | 16.24 | 9.14 | 443 / 726 |
| jzx100 | 561 / 924 | 453 / 736 | 9.98 / 10.32 | 15.74 | 8.78 | 509 / 926 |
| b4rsk | 466 / 701 | 357 / 563 | 9.87 / 10.74 | 16.71 | 9.36 | 412 / 681 |
| magna | 403 / 718 | 333 / 596 | 11.15 / 11.40 | 17.36 | 9.47 | 389 / 717 |

## Remaining balance work

NSX remains quickest in these stacked standing/rolling tests; AWD Evolutions and GC8 are close over standing 400 m. Regional chassis improvements still contribute substantially. Existing hero competitiveness concerns are not solved by this change alone. Wider human/low-grip tests and hero progression review remain separate follow-ups. The historical reports retain their prior provenance and should not be read as updated regional results.
