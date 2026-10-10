import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateRetiredEvoIX } from '../src/data/carRetirement.js';
import { normaliseState } from '../src/state/GameState.js';
import { cars, carOrder } from '../src/data/cars.js';
import { getRegionalChampionshipCashReward } from '../src/data/tunerChallenges.js';
import { CAR_COUPON_REQUIREMENTS, getCarCouponRequirement } from '../src/data/centralTokyo.js';
import { getStreetShowdownDriverRatings } from '../src/data/streetShowdowns.js';
import { PINK_SLIP_MEDIAN_RACES, getPinkSlipOpportunityChance } from '../src/data/pinkSlipProgression.js';

test('regional prizes rise gradually from ¥5k without old ¥250k flat reward', () => {
  const order = ['ODAIBA', 'SHINAGAWA', 'TATSUMI', 'SHIBUYA', 'YOKOHAMA', 'DAIKOKU', 'SHINJUKU'];
  assert.deepEqual(order.map(id => getRegionalChampionshipCashReward(id)),
    [5000, 10000, 17500, 30000, 45000, 65000, 90000]);
  assert.deepEqual(order.map(id => getRegionalChampionshipCashReward(id, true)),
    [2500, 5000, 7500, 10000, 15000, 20000, 30000]);
});

test('coupons require five for entry-tier models and seven for higher-tier cars', () => {
  for (const id of ['ae86', 'ef', 'ek9', 'evo3']) assert.equal(getCarCouponRequirement(id), 5);
  for (const id of ['evo5', 'evo6', 'r34', 'nsx']) assert.equal(getCarCouponRequirement(id), 7);
  assert.equal(Object.hasOwn(CAR_COUPON_REQUIREMENTS, 'evo9'), false);
});

test('EVO IX is no longer a purchasable or playable production car', () => {
  assert.equal(Object.hasOwn(cars, 'evo9'), false);
  assert.equal(carOrder.includes('evo9'), false);
  assert.ok(cars.evo6);
});

test('retired EVO IX cars preserve per-car tuning and garages alongside a real EVO VI', () => {
  const legacy = {
    ownedCarIds: ['evo6', 'evo9', 'evo9__copy2'],
    selectedCarId: 'evo9__copy2',
    carStates: {
      evo6: { tuning: { engine: 1 } },
      evo9: { tuning: { engine: 3 }, paintColor: 0xf0f0f0 },
      evo9__copy2: { drivetrainTuning: { clutch: 2 }, paintColor: 0x101010 },
    },
    carGarageLocations: {
      evo6: 'shinonomeWorkshop',
      evo9: 'shinonomeCanalYard',
      evo9__copy2: 'shinonomeWarehouseStrip',
    },
    carCoupons: { evo9: 3, evo6: 2 },
  };
  const migrated = migrateRetiredEvoIX(legacy);
  assert.deepEqual(migrated.ownedCarIds, ['evo6', 'evo6__copy2', 'evo6__copy3']);
  assert.equal(migrated.selectedCarId, 'evo6__copy3');
  assert.equal(migrated.carStates.evo6.tuning.engine, 1);
  assert.equal(migrated.carStates.evo6__copy2.tuning.engine, 3);
  assert.equal(migrated.carStates.evo6__copy3.drivetrainTuning.clutch, 2);
  assert.equal(migrated.carGarageLocations.evo6__copy3, 'shinonomeWarehouseStrip');
  assert.equal(migrated.carCoupons.evo6, 5);
  assert.equal(migrated.carCoupons.evo9, undefined);
  assert.deepEqual(migrateRetiredEvoIX(migrated), migrated);
  assert.equal(legacy.selectedCarId, 'evo9__copy2', 'migration must not mutate original save');
});

test('real profile normalization migrates existing EVO IX before filtering cars', () => {
  const save = {
    ownedCarIds: ['evo9'],
    selectedCarId: 'evo9',
    carStates: { evo9: { stock: false, acquiredVia: 'pinkSlip', tuning: { engine: 2 } } },
    carCoupons: { evo9: 4 },
  };
  const normalized = normaliseState(save);
  assert.deepEqual(normalized.ownedCarIds, ['evo6']);
  assert.equal(normalized.selectedCarId, 'evo6');
  assert.equal(normalized.carStates.evo6.tuning.engine, 2);
  assert.equal(normalized.carCoupons.evo6, 4);
});

test('coupon Street Showdowns remain challenging but softer', () => {
  assert.deepEqual(getStreetShowdownDriverRatings({ prizeType: 'COUPON', playerDifficulty: 'EASY' }), [3,3,4]);
  assert.deepEqual(getStreetShowdownDriverRatings({ prizeType: 'COUPON', playerDifficulty: 'STANDARD' }), [3,4,4]);
  assert.deepEqual(getStreetShowdownDriverRatings({ prizeType: 'COUPON', playerDifficulty: 'HARD' }), [4,4,5]);
});

test('Easy pink slips keep a low-probability curve with 45-race median', () => {
  assert.equal(PINK_SLIP_MEDIAN_RACES.EASY, 45);
  let none = 1;
  for (let count = 1; count <= 45; count++) {
    none *= 1 - getPinkSlipOpportunityChance({
      wins: count, losses: 0, playerDifficulty: 'EASY', pinkSlipLastWinRace: 0,
    });
  }
  assert.ok(Math.abs(none - 0.5) < 1e-9);
  assert.ok(
    getPinkSlipOpportunityChance({ wins: 8, playerDifficulty: 'EASY' }) <
    getPinkSlipOpportunityChance({ wins: 8, playerDifficulty: 'STANDARD' })
  );
});
