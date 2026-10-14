import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getOshiageRimListings, getOshiageRimQuote,
  buyOrInstallOshiageRim, restoreStockOshiageRims,
  RIMS_DISPLAY_COUNT, RIMS_REFRESH_MS, OSHIAGE_RIM_SLOTS,
  RIMS_STANDARD_COUNT, RIMS_SPECIAL_COUNT,
} from '../src/data/oshiageRims.js';
import { WHEEL_CATALOG } from '../src/data/wheels.js';
import {
  createVisualModLayers, getVisualModWheelVisual,
  normaliseVisualMods, getVisualModSlotIds,
  getVisualModChangeCost,
} from '../src/data/visualMods.js';
import { cars } from '../src/data/cars.js';
import { normaliseState, createDefaultGameState } from '../src/state/GameState.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
function makeRegistry(raw) {
  const store = new Map(Object.entries(raw));
  return {
    get: key => store.get(key),
    set: (key, value) => { store.set(key, value); },
  };
}
const startingCar = {
  ownedCarIds: ['ae86', 'ek9'],
  selectedCarId: 'ae86',
  cash: 1000000,
  ownedWheelIds: [],
  carStates: { ae86: { paintColor: 0xef403a }, ek9: { paintColor: 0x245bc3 } },
};

test('Oshiage displays four normal and four special designs in eight bays', () => {
  assert.equal(RIMS_DISPLAY_COUNT, 8);
  assert.equal(RIMS_STANDARD_COUNT, 4);
  assert.equal(RIMS_SPECIAL_COUNT, 4);
  assert.equal(RIMS_REFRESH_MS, 10800000);
  const first = getOshiageRimListings(0);
  const second = getOshiageRimListings(RIMS_REFRESH_MS);
  assert.equal(first.length, 8);
  assert.equal(second.length, 8);
  assert.deepEqual(first.slice(0, 4).map(x => x.id), second.slice(0, 4).map(x => x.id));
  assert.notDeepEqual(first.slice(4).map(x => x.id), second.slice(4).map(x => x.id));
  assert.deepEqual(first.slice(0, 4).map(x => x.tier),
    ['STANDARD', 'STANDARD', 'STANDARD', 'STANDARD']);
  assert.deepEqual(first.slice(4).map(x => x.tier),
    ['TUNER', 'TUNER', 'HERO', 'HERO']);
  assert.equal(new Set(first.map(x => x.id)).size, RIMS_DISPLAY_COUNT);
  for (const rim of first) {
    assert.ok(WHEEL_CATALOG.some(item => item.id === rim.id));
    assert.ok(rim.path.startsWith('assets/wheels/'));
  }
});

test('eight overlay positions match the cabinets in the new Oshiage art', () => {
  assert.equal(OSHIAGE_RIM_SLOTS.length, RIMS_DISPLAY_COUNT);
  assert.deepEqual(OSHIAGE_RIM_SLOTS.slice(0, 4).map(x => x.section),
    ['standard', 'standard', 'standard', 'standard']);
  assert.deepEqual(OSHIAGE_RIM_SLOTS.slice(4).map(x => x.section),
    ['special', 'special', 'special', 'special']);
  const left = OSHIAGE_RIM_SLOTS.slice(0, 4);
  const middle = OSHIAGE_RIM_SLOTS.slice(4, 6);
  const right = OSHIAGE_RIM_SLOTS.slice(6, 8);
  assert.equal(new Set(left.map(slot => slot.x)).size, 2);
  assert.equal(new Set(left.map(slot => slot.y)).size, 2);
  assert.ok(left.every(slot => slot.x < 0.40));
  assert.equal(middle[0].y, middle[1].y);
  assert.ok(middle[0].x < middle[1].x);
  assert.ok(right[0].x === right[1].x && right[0].y < right[1].y);
  assert.ok(middle[1].x < right[0].x);
  assert.ok(OSHIAGE_RIM_SLOTS.every(slot => slot.x > 0 && slot.x < 1 &&
    slot.y > 0 && slot.y < 1 && slot.diameter > 40 && slot.diameter < 90));
});

test('Oshiage wheel shop day/night images are valid same-sized PNG assets', () => {
  const pngInfo = phase => {
    const bytes = readFileSync(new URL('../assets/Oshiage/oshiage_wheels_' +
      phase + '.png', import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    assert.ok(width >= 1000 && height >= 500);
    return { width, height };
  };
  assert.deepEqual(pngInfo('day'), pngInfo('night'));
});

test('the original rim IDs and prices are retained when buying at Oshiage', () => {
  const registry = makeRegistry(structuredClone(startingCar));
  const wheel = WHEEL_CATALOG[0];
  const quote = getOshiageRimQuote(registry, 'ae86', wheel.id);
  assert.equal(quote.status, 'BUY');
  assert.equal(quote.price, wheel.price);
  const result = buyOrInstallOshiageRim(registry, 'ae86', wheel.id);
  assert.deepEqual({ ok: result.ok, spent: result.spent }, { ok: true, spent: wheel.price });
  assert.equal(registry.get('cash'), startingCar.cash - wheel.price);
  assert.deepEqual(registry.get('ownedWheelIds'), [wheel.id]);
  assert.equal(registry.get('carStates').ae86.customWheelId, wheel.id);
  assert.equal(registry.get('carStates').ae86.paintColor, startingCar.carStates.ae86.paintColor);
  assert.equal(getOshiageRimQuote(registry, 'ae86', wheel.id).status, 'INSTALLED');
});

test('already owned rims are free to install on another car without losing either build', () => {
  const wheel = WHEEL_CATALOG[4];
  const registry = makeRegistry({ ...structuredClone(startingCar), ownedWheelIds: [wheel.id] });
  assert.equal(getOshiageRimQuote(registry, 'ek9', wheel.id).status, 'OWNED');
  const result = buyOrInstallOshiageRim(registry, 'ek9', wheel.id);
  assert.equal(result.ok, true);
  assert.equal(result.spent, 0);
  assert.equal(registry.get('cash'), startingCar.cash);
  assert.equal(registry.get('carStates').ek9.customWheelId, wheel.id);
  assert.equal(registry.get('carStates').ek9.paintColor, startingCar.carStates.ek9.paintColor);
  assert.deepEqual(registry.get('ownedWheelIds'), [wheel.id]);
});

test('restoring stock rims removes only the installed customWheelId', () => {
  const registry = makeRegistry({
    ...structuredClone(startingCar),
    ownedWheelIds: [WHEEL_CATALOG[0].id],
    carStates: { ae86: { paintColor: 0xffbb00, customWheelId: WHEEL_CATALOG[0].id } },
  });
  assert.equal(restoreStockOshiageRims(registry, 'ae86'), true);
  assert.equal(registry.get('carStates').ae86.customWheelId, undefined);
  assert.equal(registry.get('carStates').ae86.paintColor, 0xffbb00);
  assert.deepEqual(registry.get('ownedWheelIds'), [WHEEL_CATALOG[0].id]);
});

test('unaffordable wheels, unowned cars and collector cars cannot be altered', () => {
  const wheel = WHEEL_CATALOG[0];
  const poor = makeRegistry({ ...structuredClone(startingCar), cash: 0 });
  assert.equal(getOshiageRimQuote(poor, 'ae86', wheel.id).status, 'UNAFFORDABLE');
  assert.equal(buyOrInstallOshiageRim(poor, 'ae86', wheel.id).ok, false);
  assert.equal(getOshiageRimQuote(poor, 'someOtherCar', wheel.id).status, 'NO_CAR');
  const locked = makeRegistry({
    ...structuredClone(startingCar),
    ownedWheelIds: [wheel.id],
    carStates: { ae86: { immutable: true, customWheelId: wheel.id } },
  });
  assert.equal(getOshiageRimQuote(locked, 'ae86', wheel.id).status, 'LOCKED');
  assert.equal(buyOrInstallOshiageRim(locked, 'ae86', wheel.id).ok, false);
  assert.equal(restoreStockOshiageRims(locked, 'ae86'), false);
});

test('old bodykits are overridden, without touching paint or purchased rims', () => {
  const model = normaliseState({
    ...createDefaultGameState(),
    ownedCarIds: ['ae86'],
    selectedCarId: 'ae86',
    ownedWheelIds: [WHEEL_CATALOG[0].id],
    carStates: { ae86: {
      paintColor: 0x123abc, customWheelId: WHEEL_CATALOG[0].id,
      visualMods: { bodyKit: 'bodykit2' },
      tuning: { engine: 3 },
    } },
  });
  assert.equal(model.carStates.ae86.visualMods.bodyKit, 'stock');
  assert.equal(model.carStates.ae86.customWheelId, WHEEL_CATALOG[0].id);
  assert.equal(model.carStates.ae86.paintColor, 0x123abc);
  assert.equal(model.carStates.ae86.tuning.engine, 3);
  assert.deepEqual(model.ownedWheelIds, [WHEEL_CATALOG[0].id]);
  assert.equal(normaliseVisualMods('ae86', { visualMods: { bodyKit: 'bodykit1' } }).bodyKit, 'stock');
  assert.deepEqual(getVisualModSlotIds('ae86'), []);
  assert.equal(getVisualModChangeCost('ae86', {}, { bodyKit: 'bodykit2' }), 0);
  assert.deepEqual(createVisualModLayers({}, cars.ae86, { visualMods: { bodyKit: 'bodykit2' } }), []);
  assert.equal(getVisualModWheelVisual(cars.ae86, {
    customWheelId: WHEEL_CATALOG[0].id, visualMods: { bodyKit: 'bodykit2' },
  }).wheelKey, WHEEL_CATALOG[0].textureKey);
});

test('retired Auto Market wheel room in old saves is routed to cars, not a broken shop', () => {
  const base = createDefaultGameState();
  assert.equal(normaliseState({ ...base, autoMarketRoom: 'wheels' }).autoMarketRoom, 'used');
  const central = read('src/scenes/CentralTokyoScene.js');
  assert.doesNotMatch(central, /drawWheelShop\(/);
  assert.doesNotMatch(central, /id: 'wheels', label:/);
  assert.match(central, /\{ id: 'new', label: 'NEW CARS' \}/);
  assert.match(central, /\{ id: 'used', label: 'USED CARS' \}/);
});

test('Rims is second Custom Works service, with Bodykit disabled and Paint exclusive', () => {
  const scene = read('src/scenes/OshiageScene.js');
  const garage = read('src/scenes/GarageScene.js');
  assert.match(scene, /this\.button\(590, 743, 338, 65, 'RIMS'/);
  assert.match(scene, /this\.button\(955, 743, 338, 65, 'BODYKIT \/\/ COMING SOON'/);
  assert.match(scene, /drawRimShop\(\)/);
  assert.match(scene, /getOshiageRimListings\(\)/);
  assert.match(scene, /ROOT \+ 'oshiage_wheels_' \+ cleanPhase/);
  assert.doesNotMatch(scene, /assets\/CentralTokyo\/tokyo_wheels_/);
  assert.match(scene, /const rack = this.rimWallRect\(\)/);
  assert.match(scene, /const slot = OSHIAGE_RIM_SLOTS\[index\]/);
  assert.match(scene, /buyOrInstallOshiageRim\(this\.registry/);
  assert.match(scene, /restoreStockOshiageRims\(this\.registry/);
  const chassis = garage.slice(garage.indexOf('  activateChassisMode() {'),
    garage.indexOf('  rebuildSelectedVisualModPreview() {'));
  assert.match(chassis, /CHASSIS_PART_ORDER\.forEach/);
  assert.doesNotMatch(chassis, /chassisPaintMenuButton/);
  assert.doesNotMatch(chassis, /getVisualModSlotIds/);
  assert.doesNotMatch(garage, /applyPendingPaint\(/);
  assert.doesNotMatch(garage, /applyPendingVisualMods\(/);
});
