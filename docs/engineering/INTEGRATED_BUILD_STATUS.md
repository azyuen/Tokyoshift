# Integrated build validation — 24 October 2026

Branch: engineering/integrated-playable-20261024. Base integration 5cbf959 combines engineering with main 9d79c77 / R677. Main and the original engineering branch are unchanged.

Recruitment intentionally preserves R676/R677's factory-stock ±40 kW rule. Factory classes and tuning potential remain vehicle metadata; the original same-class recruitment requirement is superseded in this integration to preserve current gameplay. Hidden legacy upgrades remain ineligible.

Browser testing exposed a retained engineering button that could park parts for free and bypass the current paid stock/tuned service. It now restores existing legacy parked saves only; it cannot create new parked parts, even if its hidden handler is invoked. New changes retain the original specialist/warehouse service, fees and availability. No saved purchases are removed.

The targeted integrated suite passes 81 tests, including current stock/tuned service semantics, saved duplicate cars, legacy upgrades, all 43 engine/build configurations, seven specialist previews, gearing and launch behavior. Evidence: integrated-validation-tests.txt. This is not a claim that every historical repository test passes.

Browser runner: tests/engineering-browser.mjs through tools/engineering-browser-server.py. It uses local Chromium, a synthetic imported profile, locally served Phaser 3.90.0 and automated scene controls. The fixture imports a legacy parked state and verifies the real restoration handler, plus prevention of new free parking. browser-results.json records completed runs. Garage/profile checks run at 1024×768 and 390×844; dyno and completed canonical R34 recruitment run at 1024×768. No native iPad, owner's actual profile or deployed-build test is implied. The paid service has source-level regression coverage; its confirmation UI is not exercised by this browser fixture.

Remaining release work: exercise the current paid service UI, validate current cache/version transition, review broad regression differences and latest-main drift, then provide an isolated playable review build. Prior engineering reports describe earlier branch rules/prices and are historical evidence, not current integrated recruitment policy. Do not deploy based solely on this checkpoint.
