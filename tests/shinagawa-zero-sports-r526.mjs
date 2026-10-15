import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js';
import {
  TUNER_SHOPS, getTunerShopById, getTunerShopForDonorCar,
  getTunerShopPhaseBackground, isTunerShopUnlocked,
  getTunerOption, applySpecialistTuning,
} from '../src/data/tunerShops.js';
import { TUNER_DECAL_STYLES } from '../src/vehicles/TunerDecals.js';

const shop = TUNER_SHOPS.SHINAGAWA;

test('Shinagawa Zero/Sports is a stock-GC8 conversion and keeps the existing hero asset', () => {
  assert.equal(shop.id, 'shinagawaZeroSports');
  assert.equal(shop.heroCarId, 'zeroSportsGc8');
  assert.equal(shop.donorCarId, 'gc8');
  assert.match(shop.label, /ZERO\/SPORTS/);
  assert.equal(getTunerShopForDonorCar('gc8'), shop);
  assert.equal(getTunerShopForDonorCar('ek9'), undefined);
  assert.equal(cars.gc8.collector, false);
  assert.equal(cars.zeroSportsGc8.collector, true);
  assert.equal(cars.zeroSportsGc8.tuningLocked, true);
  assert.equal(cars.zeroSportsGc8.ginzaExclusive, false);
  assert.equal(cars.zeroSportsGc8.visual.bodyPath, 'assets/Cars/hero/zerosportsgc8_hero_body.png');
  assert.equal(cars.zeroSportsGc8.visual.wheelPath, 'assets/wheels/zerosportsgc8_hero_wheel.png');
});

test('Shinagawa day and night backgrounds both exist and have unique keys', () => {
  const day = getTunerShopPhaseBackground(shop, 'day');
  const night = getTunerShopPhaseBackground(shop, 'night');
  assert.notEqual(day.key, night.key);
  assert.notEqual(day.path, night.path);
  for (const bg of [day, night]) {
    assert.ok(existsSync(new URL('../' + bg.path, import.meta.url)), bg.path);
    assert.match(bg.path, /shinagawa_zerosports_/);
  }
  assert.ok(existsSync(new URL('../' + shop.backgroundPath, import.meta.url)));
});

test('legacy Spoon saves keep unlock state and existing specialist effects', () => {
  assert.equal(getTunerShopById('shinagawaSpoon'), shop);
  assert.ok(isTunerShopUnlocked({
    tunerShopProgress: { shinagawaSpoon: { visited: true } },
  }, 'SHINAGAWA'));
  assert.ok(cars.spoonEk9, 'already-owned Spoon cars remain loadable');
  const legacy = getTunerOption('spoonRigidChassis');
  assert.equal(legacy.effect.gripScale, 1.02);
  const old = { ...cars.ek9 };
  const result = applySpecialistTuning(old, { torqueCurve: [[3000, 100]] }, {
    specialistTuning: ['spoonRigidChassis'],
  });
  assert.ok(Math.abs(result.car.tyreGrip - cars.ek9.tyreGrip * 1.02) < 1e-8);
});

test('Zero/Sports tunes and decal do not depend on absent image assets', () => {
  assert.deepEqual(shop.tuningOptions.map(o => o.id), [
    'zeroSportsBoxerResponse', 'zeroSportsAwdLaunch', 'zeroSportsCompleteSetup',
  ]);
  for (const opt of shop.tuningOptions) assert.equal(getTunerOption(opt.id)?.shopId, shop.id);
  assert.equal(shop.tuningOptions[2].requirements.specialist.length, 2);
  assert.equal(shop.decalId, 'zeroSports');
  assert.equal(shop.decalPath, null);
  assert.equal(TUNER_DECAL_STYLES.zeroSports.label, 'ZERO/SPORTS');
  assert.equal(TUNER_DECAL_STYLES.zeroSports.suggestedPath, null);
});

test('all tuner modes and donor animation use the same hero-scale display width', () => {
  const code = readFileSync(new URL('../src/scenes/TunerShopScene.js', import.meta.url), 'utf8');
  assert.match(code, /const TUNER_STAGE_CAR_WIDTH = Math\.round\(770 \* HERO_CAR_DISPLAY_SCALE\)/);
  // Declaration plus hero, specialist tuning, decal placement, donor roll-in and finished hero.
  assert.equal((code.match(/TUNER_STAGE_CAR_WIDTH/g) || []).length, 6);
  assert.doesNotMatch(code, /drawCarOnStage\(carId, 720, 650, 730/);
  assert.doesNotMatch(code, /\n\s+730,\n\s+10,/);
});
