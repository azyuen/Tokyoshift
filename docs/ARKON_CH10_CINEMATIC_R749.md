# R749 — Chapter 10 full-frame scenes, sold-car refresh and Porsche night drive

## User reports
1. In Aruken Chapter 10, too much story dialogue appeared on top of the live three-panel Garage UI.
2. The original Liberty Walk 240Z could remain visible in the Garage after Aruken sold it.
3. Sayaka's Yokohama drive showed an endlessly moving road without dialogue, and the only visible interaction in a chapter replay was the replay-exit control.

## Changes
- Most Chapter 10 authored **interior narrative tableaux** (Warehouse HQ and Ginza) use `stageMode:'chapter10-full'`: actual existing venue art fills the screen, with a clean car/cast composition and an opaque cinematic cover over live Garage UI. The restoration job UI and the actual race remain functional and **unchanged**.
- After the real story-owned `ARKON_CH10_SELL_Z` transaction, explicitly clear the previous stage and restart `GarageScene` in Warehouse HQ. This rebuilds its selected-car display from post-sale `ownedCarIds`, while the subsequent scenes explicitly show an AE86 and an R32 instead of the sold 240Z. The one-time sales ledger, cash, liability settlement and car history remain untouched.
- The Chapter 10 RaceScene drive now invokes `createGinzaBanterHud` with `homeClothes:true`: it previously selected the **Oshiage** outfit as its initial Sayaka pose, which was **not preloaded** for the Chapter 10 drive. The HUD constructor returned `null` and all four scene lines were silently discarded.
- Preload every named Chapter 10 cruise portrait, including `homeConfident` and `storyConfidentSmirk`. The night drive's cinematic clock follows actual frame elapsed time (not capped physics time), shows a **CONTINUE TO YOKOHAMA** action after the dialogue, and also auto-transitions at 29 seconds if untouched. No race controls, wagers, prizes, handling or tuning are changed.
- Add the one-time `storyR749` numeric checkpoint migration to preserve old Chapter 10 in-progress saves after inserting the forced scene rebuild. The previous R748 semantic migration remains authoritative and is not shifted twice.

## Test scope
`tests/arkon-chapter10-cinematic-r749.mjs` confirms full-screen staging, sale ordering, post-sale car absence, the real dialogue HUD source, elapsed-time progression, manual/automatic road exit, and previous numeric checkpoint compatibility. Companion tests run the full Chapter 10 state/economy checks, R748 Sayaka pose checks and broader Story/Career continuity. Source inspection plus automated tests do **not** replace visual testing on mobile/tablet.

## Access
The Aruken Story remains restricted to the existing developer mode. No Chapter 11, public unlock, or Career progression change is introduced.
