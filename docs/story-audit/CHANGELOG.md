# Aruken Story Mode presentation audit — Chapters 01–10

Branch: `audit/aruken-story-visuals-20261026`  
Baseline: `3fc821ee2f6da6bbefa8dba41f762b42357b8f23` (R686).  
Status: implementation and visual verification in progress; no merge or deployment.

## Scope and preserved behavior

Changes are limited to presentation: staging, visible sprite proportions, artwork selection, background populations, display vehicles, arrival timing and player-controlled holds. The existing Garage/Meet car renderers, workshop/showdown anchors and character PNGs are reused. No generated assets are introduced.

A baseline digest checks all 11 registered Aruken chapter scripts, including the legacy Chapter 1 edition. Only explicitly allowed presentation fields are omitted from the comparison. Dialogue text, choices, action parameters, step order/count and saved step positions must match the baseline. Racing, payouts, purchases, ownership and other economy source files are unchanged.

## Chapter changes

| Chapter | Presentation changes |
| --- | --- |
| **01 — First Impressions** | Align characters using visible PNG bounds, retain the roadside witness composition, replace misleading blouse assets with navy-uniform equivalents, and add a quiet player-controlled pause after “AN OLD DATSUN.” |
| **02 — The Long Way Home** | Give crouching repair poses a believable height; separate Rina from Sayaka and remove Rina’s oversized scale; improve conversational spacing and preserve mechanic clothing between dialogue pages. |
| **03 — The Night Shift** | Reuse native workshop and tuner floor geometry, align feet and car tyre contact, preserve clothing through work conversations, and wait for the tableau to settle before dialogue. |
| **04 — The Price of Trust** | Keep the Porsche’s native roll-in and wheel geometry; correct cross-location backdrops and tuner staging; preserve mechanic clothing through work scenes and wait for arrivals. |
| **05 — The Fastest Pair in Tokyo** | Retain the bespoke two-car duel, approach animation and car exit; correct pose proportions and costume continuity; add a pause after “THE DAY SHE NEEDED A FRIEND.” |
| **06 — Everything We Built** | Use daylight for the morning-after scene; retain restoration-pair staging and Chapter 6’s existing post-dialogue holds; align the final couple’s visible feet and height; enlarge finale touch controls. The gift remains one Porsche. |
| **07 — Never Enough** | Apply consistent workshop/meet proportions, conversational spacing and arrival waits; preserve the existing outfit progression and add a pause after “ANOTHER TIME.” |
| **08 — The Price of Ambition** | Use daylight for the familiar visitor; add six silent background guests and R34/NSX displays to invitations, eight guests at VIP parties, and separate foreground race cars into readable bays. Retain formal clothing and add pauses around “ANOTHER TIME” and “THE SIGNATURE.” |
| **09 — No Way Out** | Populate invitations and the private signing event, separate display and foreground cars, keep formal outfits on the immediate road home, use daylight for morning coffee, and add pauses after “THE QUESTION” and “ONE LAST DOCUMENT.” |
| **10 — The Road Ahead** | Use daylight for the familiar sound; populate the gallery opening and separate its two display cars. Keep closing time quiet, with casual clothing continuing into the final drive and paired artwork. Pause after “A RARE MOMENT OF DOUBT”; align the final couple and enlarge finale touch controls. The sold Z does not return. |

Background extras are artwork-only. They do not establish named guests, knowledge, relationships, rewards or event outcomes. Party displays reuse existing modular cars and do not add vehicles to anyone’s inventory. Quiet private scenes retain their small cast.

## Verification method and limits

`tests/visual/aruken-audit.mjs` boots the real Phaser application and renders authored presentations in an isolated fixture using production scene methods. It exercises **134 stages, 213 manga cutscenes and 20 phone calls**, plus the two bespoke finales. Every manga page is advanced and checked for a visible dialogue panel; screenshots record the final page of each cutscene. Phone calls are answered and advanced through their authored pages. Chapter 6 and 10 finale buttons and the Story Director’s establishing/post-dialogue holds are tested separately.

Viewports: **mobile 844 × 390** and **tablet 1180 × 820**, Chromium with touch enabled. These are browser emulations, not physical iOS/Android devices. They validate isolated presentations, not a complete playthrough of races, travel, purchases or all save/resume routes. `$CURRENT_MEET` is resolved to Odaiba at night; `$CURRENT_WORKSHOP` follows the chapter’s workshop tier. Context-dependent variants at every possible meet are not exhaustively covered.

For bulk settled-frame capture only, scene tweens run faster in the test fixture. Production durations are unchanged. Hold and finale interaction checks run at normal speed. Baseline captures use the same fixture and viewport settings as the edited version. The fixture leaves gameplay HUD panels empty, making the presentation itself visible; screenshots are not claims of complete in-game HUD testing.

## Reproduce

Use Node, Python 3, Playwright, a compatible headless Chromium binary, and a local Phaser 3.90.0 distribution. See the paths/env defaults in `tests/visual/aruken-audit.mjs`.

```sh
node --test tests/aruken-presentation-audit.mjs tests/arkon*.mjs
AUDIT_PHASE=after AUDIT_PORT=8770 node tests/visual/aruken-audit.mjs
AUDIT_PHASE=after AUDIT_MODE=dialogue AUDIT_PORT=8771 node tests/visual/aruken-audit.mjs
AUDIT_PHASE=after AUDIT_MODE=finale AUDIT_PORT=8772 node tests/visual/aruken-audit.mjs
AUDIT_PHASE=after AUDIT_MODE=hold AUDIT_PORT=8773 node tests/visual/aruken-audit.mjs
```

For baseline captures set `AUDIT_SOURCE` to a worktree at the baseline commit and `AUDIT_PHASE=before`. `AUDIT_RESUME=1` skips successful captures; failures are retried. Per-run JSON records screenshot names, chapter/step indices, page counts and errors. Use separate ports for concurrent runs.

## Remaining verification record

Final capture counts, visual review results and evidence links are added after the runs complete. One known baseline failure in `arkon-character-identity-r677.mjs` expects the retired Career line “Aruken and I spent”; R680 removed that disclosure. The audit does not restore it.
