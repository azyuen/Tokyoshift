import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getEngineTuning } from '../src/data/tuning.js';
import { areTunerOptionRequirementsMet, getTunerShopForRegion } from '../src/data/tunerShops.js';
import { restorePreferredCar } from '../src/state/CarSelection.js';
import { cars } from '../src/data/cars.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

function registry(input) {
  const values = { ...input };
  return {
    get: key => values[key],
    set: (key, value) => { values[key] = value; },
  };
}

test('GC8 Level 3 ECU/turbo satisfies ZERO/SPORTS prerequisites despite an outdated engineTuning alias', () => {
  const gc8 = {
    tuning: { engine: 3, intake: 3, ecu: 3, turbo: 3, intercooler: 3 },
    engineTuning: { engine: 1, intake: 1, ecu: 1, turbo: 0 },
    drivetrainTuning: { differential: 3 },
    chassisTuning: { tyres: 3 },
  };
  const shop = getTunerShopForRegion('SHINAGAWA');
  assert.equal(getEngineTuning(gc8).ecu, 3);
  assert.equal(areTunerOptionRequirementsMet(gc8, shop.tuningOptions[0]), true);
  assert.equal(areTunerOptionRequirementsMet(gc8, shop.tuningOptions[1]), true);
  assert.equal(areTunerOptionRequirementsMet(gc8, shop.tuningOptions[2]), false);
});

test('engine prerequisites still work for engineTuning-only legacy profiles', () => {
  const gc8 = { engineTuning: { engine: 3, intake: 3, ecu: 3, turbo: 3, intercooler: 3 } };
  assert.equal(areTunerOptionRequirementsMet(gc8, getTunerShopForRegion('TATSUMI').tuningOptions[0]), true);
  assert.equal(areTunerOptionRequirementsMet(gc8, getTunerShopForRegion('TATSUMI').tuningOptions[1]), true);
});

test('genuine missing prerequisites remain blocked', () => {
  const gc8 = { tuning: { engine: 3, ecu: 1, turbo: 0 } };
  assert.equal(areTunerOptionRequirementsMet(gc8, getTunerShopForRegion('SHINAGAWA').tuningOptions[0]), false);
});

test('after a race overrides the selected car, returning to a tuner restores the chosen GC8', () => {
  const r = registry({
    ownedCarIds: ['gc8', 'zeroSportsGc8'],
    preferredCarId: 'gc8',
    selectedCarId: 'zeroSportsGc8',
  });
  assert.equal(cars.gc8.tuningLocked, undefined);
  assert.equal(cars.zeroSportsGc8.tuningLocked, true);
  assert.equal(restorePreferredCar(r), 'gc8');
  assert.equal(r.get('selectedCarId'), 'gc8');
});

test('active crew/elite event car locks are preserved', () => {
  for (const lock of [{ crewBattleState: { active: true } }, { oshiageEliteSeries: { active: true } }]) {
    const r = registry({
      ownedCarIds: ['gc8', 'zeroSportsGc8'],
      preferredCarId: 'gc8', selectedCarId: 'zeroSportsGc8', ...lock,
    });
    assert.equal(restorePreferredCar(r), 'zeroSportsGc8');
    assert.equal(r.get('selectedCarId'), 'zeroSportsGc8');
  }
});

test('tuner scene restores preference before assets and engine tuning writes both save aliases', () => {
  const tunerScene = source('src/scenes/TunerShopScene.js');
  const engineScene = source('src/scenes/EngineTuningScene.js');
  assert.match(tunerScene, /preload\\(\\) \\{\\s*\\/\\/[^\\n]*\\n\\s*\\/\\/[^\\n]*\\n\\s*restorePreferredCar\\(this\\.registry\\)/);
  assert.match(engineScene, /state\\.engineTuning = \\{ \\.\\.\\.state\\.tuning \\}/);
  assert.match(tunerScene, /COLLECTOR BUILD \\/\\/ SPECIALIST TUNING SEALED/);
});
