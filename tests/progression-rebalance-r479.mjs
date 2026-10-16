import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { migrateRetiredEvoIX } from '../src/data/carRetirement.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';
import { cars, carOrder } from '../src/data/cars.js';
import { getRegionalChampionshipCashReward } from '../src/data/tunerChallenges.js';
import { applyEasyCashWinBonus } from '../src/data/careerProgression.js';
import {
  CAR_COUPON_REQUIREMENTS, MARKET_BASE_PRICES, getCarCouponRequirement,
} from '../src/data/centralTokyo.js';
import {
  getStreetShowdownDriverRatings,
  STREET_SHOWDOWN_CASH_ENTRY_FEES,
  getStreetShowdownCouponEntryFee,
} from '../src/data/streetShowdowns.js';
import { PINK_SLIP_MEDIAN_RACES, getPinkSlipOpportunityChance } from '../src/data/pinkSlipProgression.js';

test('regional championships pay larger one-time cash prizes while retaining perfect bonuses', () => {
  const order = ['ODAIBA', 'SHINAGAWA', 'TATSUMI', 'SHIBUYA', 'YOKOHAMA', 'DAIKOKU', 'SHINJUKU'];
  assert.deepEqual(order.map(id => getRegionalChampionshipCashReward(id)),
    [40000, 60000, 55000, 75000, 100000, 135000, 180000]);
  assert.deepEqual(order.map(id => getRegionalChampionshipCashReward(id, true)),
    [15000, 20000, 20000, 25000, 30000, 40000, 50000]);
  assert.equal(getRegionalChampionshipCashReward('ODAIBA') + getRegionalChampionshipCashReward('SHINAGAWA'), 100000);
  assert.equal(getRegionalChampionshipCashReward('ODAIBA', true) + getRegionalChampionshipCashReward('SHINAGAWA', true), 35000);
});

test('regional payouts apply the existing Easy cash bonus to completion and perfect prizes', () => {
  const easy = { playerDifficulty: 'EASY' };
  const standard = { playerDifficulty: 'STANDARD' };
  assert.equal(applyEasyCashWinBonus(easy, getRegionalChampionshipCashReward('ODAIBA')), 52000);
  assert.equal(applyEasyCashWinBonus(easy, getRegionalChampionshipCashReward('ODAIBA', true)), 19500);
  assert.equal(applyEasyCashWinBonus(standard, getRegionalChampionshipCashReward('ODAIBA')), 40000);
  assert.equal(applyEasyCashWinBonus(standard, getRegionalChampionshipCashReward('ODAIBA', true)), 15000);
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
    selectedOpponentCarId: 'evo9',
    meetRosters: { odaiba: [{ carId: 'evo9', characterId: 'rival-a' }] },
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
  assert.equal(migrated.selectedOpponentCarId, 'evo6');
  assert.equal(migrated.meetRosters.odaiba[0].carId, 'evo6');
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

test('cash Showdown entry fees remain moderate and grow by difficulty', () => {
  assert.deepEqual(STREET_SHOWDOWN_CASH_ENTRY_FEES, {
    EASY: 10000, MED: 18000, HARD: 30000, ELITE: 40000,
  });
  const scene = readFileSync(new URL('../src/scenes/MeetScene.js', import.meta.url), 'utf8');
  for (const difficulty of ['EASY', 'MED', 'HARD', 'ELITE']) {
    assert.match(scene, new RegExp('entryFee: STREET_SHOWDOWN_CASH_ENTRY_FEES\\.' + difficulty));
  }
  assert.match(scene, /getStreetShowdownCouponEntryFee\\(carValue, couponRequirement\\)/);
  assert.match(scene, /balanceVersion: 'R20261016-fees'/);
  assert.match(scene, /current\\?\\.balanceVersion !== 'R20261016-fees'/);
});

test('coupon entry prices use nonlinear market-value bands with guarded boundaries', () => {
  const fee = getStreetShowdownCouponEntryFee;
  for (const [couponValue, expected] of [
    [190000, 20000], [300000, 20000],
    [300001, 35000], [600000, 35000],
    [600001, 55000], [900000, 55000],
    [900001, 75000], [1200000, 75000],
    [1200001, 95000], [1300000, 95000],
  ]) {
    assert.equal(fee(couponValue * 5, 5), expected, String(couponValue));
  }
  for (const [carId, expected] of [
    ['ae86', 20000], ['rx7fd', 35000],
    ['r32', 75000], ['r34', 95000], ['nsx', 95000],
  ]) {
    assert.equal(fee(MARKET_BASE_PRICES[carId], getCarCouponRequirement(carId)),
      expected, carId);
  }
  assert.equal(fee(0, 7), 60000, 'unpriced coupon prizes cannot default to cheapest fee');
  assert.equal(fee(NaN, 7), 60000);
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

test('new profiles start with ¥5,000 while existing cash balances are not reset', () => {
  assert.equal(createDefaultGameState().cash, 5000);
  assert.equal(normaliseState({}).cash, 5000);
  assert.equal(normaliseState({ cash: 50000 }).cash, 50000);
  assert.equal(normaliseState({ cash: 123456 }).cash, 123456);
});
