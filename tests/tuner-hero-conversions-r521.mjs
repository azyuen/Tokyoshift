import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars, carOrder } from '../src/data/cars.js';
import { getBaseCarId, registerOwnedCarInstance } from '../src/data/carOwnership.js';
import {
  TUNER_SHOPS,
  getTunerShopForRegion,
  getTunerShopForDonorCar,
} from '../src/data/tunerShops.js';

// These are intentional stock model -> hero build contracts, not display names.
const EXPECTED = {
  ODAIBA: ['nsx', 'espritNsx'],
  SHINAGAWA: ['ek9', 'spoonEk9'],
  TATSUMI: ['evo5', 'junHyperLemonEvo5'],
  SHIBUYA: ['s2000', 'amuseS2000Gt1'],
  YOKOHAMA: ['r34', 'minesR34'],
  DAIKOKU: ['rx7fd', 'reAmemiyaRx7'],
  SHINJUKU: ['jza80', 'topSecretSupra'],
};

test('every regional tuner converts its correct existing stock model', () => {
  assert.equal(Object.keys(TUNER_SHOPS).length, 7);
  const donors = new Set();
  const heroes = new Set();
  for (const [region, [donorId, heroId]] of Object.entries(EXPECTED)) {
    const shop = getTunerShopForRegion(region);
    assert.ok(shop, region + ' shop disabled or missing');
    assert.equal(shop.donorCarId, donorId, region + ' donor');
    assert.equal(shop.heroCarId, heroId, region + ' hero');
    assert.ok(carOrder.includes(donorId), region + ' donor is not standard stock');
    assert.ok(cars[donorId], region + ' donor missing from cars');
    assert.ok(cars[heroId], region + ' hero missing from cars');
    assert.ok(!cars[donorId].collector, region + ' donor is collector-only');
    assert.ok(Number.isFinite(shop.buildCost) && shop.buildCost > 0);
    assert.equal(getTunerShopForDonorCar(donorId)?.id, shop.id);
    assert.ok(!donors.has(donorId), 'two tuners share donor ' + donorId);
    assert.ok(!heroes.has(heroId), 'two tuners share hero ' + heroId);
    donors.add(donorId);
    heroes.add(heroId);
  }
});

// Execute the *production* TunerShopScene conversion method with a mock
// registry. The full scene depends on Phaser's graphical/browser runtime,
// but its synchronous car/cash/ownership transaction is testable in Node.
const sceneSource = readFileSync(
  new URL('../src/scenes/TunerShopScene.js', import.meta.url),
  'utf8'
);
const startMarker = '  performHeroConversion() {';
const methodStart = sceneSource.indexOf(startMarker);
const methodEnd = sceneSource.indexOf('\n  showToast(', methodStart);
assert.ok(methodStart >= 0 && methodEnd > methodStart, 'hero conversion method found');
const methodBody = sceneSource
  .slice(methodStart + startMarker.length, methodEnd)
  .replace(/\n  }\s*$/, '');

function simulate(shop, { donorId = shop.donorCarId, cash = shop.buildCost,
  stock = true, alreadyOwned = false } = {}) {
  if (donorId.includes('__copy')) registerOwnedCarInstance(donorId, shop.donorCarId);
  const registryState = {
    selectedCarId: donorId,
    ownedCarIds: alreadyOwned ? [donorId, shop.heroCarId] : [donorId],
    carStates: { [donorId]: { stock, paintColor: 0xabcdef } },
    carGarageLocations: { [donorId]: 'shinonomeCanalYard' },
    tunerShopProgress: {},
    workshopLocationId: 'shinonomeWorkshop',
    cash,
  };
  const registry = {
    get: key => registryState[key],
    set: (key, value) => { registryState[key] = value; },
  };
  const events = [];
  const convert = new Function(
    'getBaseCarId', 'recordCarDeparture', 'recordCarAcquisition', 'saveSessionState',
    'return function performHeroConversion(){' + methodBody + '}'
  )(
    getBaseCarId,
    (_registry, id, reason) => events.push(['depart', id, reason]),
    (_registry, id) => events.push(['acquire', id]),
    () => events.push(['save'])
  );
  const scene = { shop, registry, getCurrentCarId: () => registryState.selectedCarId };
  return { success: convert.call(scene), state: registryState, events };
}

for (const [region] of Object.entries(EXPECTED)) {
  test(region + ' conversion consumes the donor and charges exactly the build price', () => {
    const shop = getTunerShopForRegion(region);
    const normal = simulate(shop);
    assert.equal(normal.success, true);
    assert.equal(normal.state.cash, 0);
    assert.deepEqual(normal.state.ownedCarIds, [shop.heroCarId]);
    assert.equal(normal.state.selectedCarId, shop.heroCarId);
    assert.equal(normal.state.carStates[shop.donorCarId], undefined);
    assert.equal(normal.state.carStates[shop.heroCarId].convertedFrom, shop.donorCarId);
    assert.equal(normal.state.carGarageLocations[shop.heroCarId], 'shinonomeCanalYard');
    assert.ok(normal.events.some(e => e[0] === 'save'));

    const second = simulate(shop, { donorId: shop.donorCarId + '__copy2' });
    assert.equal(second.success, true, 'duplicate stock instances can convert');
    assert.equal(second.state.carStates[shop.heroCarId].convertedFrom,
      shop.donorCarId + '__copy2');

    for (const opts of [
      { cash: shop.buildCost - 1 },
      { stock: false },
      { alreadyOwned: true },
    ]) {
      const rejected = simulate(shop, opts);
      assert.equal(rejected.success, false, JSON.stringify(opts));
      assert.equal(rejected.state.ownedCarIds[0], shop.donorCarId);
      assert.equal(rejected.state.cash, opts.cash ?? shop.buildCost);
      assert.equal(rejected.events.length, 0);
    }
  });
}
