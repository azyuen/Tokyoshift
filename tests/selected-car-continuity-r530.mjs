import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js';
import { registerOwnedCarInstances } from '../src/data/carOwnership.js';
import { createDefaultGameState, normaliseState, snapshotRegistry } from '../src/state/GameState.js';
import { choosePersonalCar, getPreferredCarId, restorePreferredCar } from '../src/state/CarSelection.js';

const source = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
function registry(input) {
  const store = { ...input };
  return {
    get: key => store[key],
    set: (key, value) => { store[key] = value; },
    dump: () => ({ ...store }),
  };
}
test('Arkon Den keeps the deliberately chosen vehicle after a temporary scene override', () => {
  const save = normaliseState({
    ...createDefaultGameState(),
    firstName: 'Arkon',
    lastName: 'Den',
    devMode: true,
    ownedCarIds: ['ae86', 'ek9', 'r34', 'magna'],
    selectedCarId: 'ae86',
    preferredCarId: 'ae86',
    garageTier: 2,
  });
  const r = registry(save);
  assert.equal(choosePersonalCar(r, 'r34'), true);
  assert.equal(r.get('preferredCarId'), 'r34');
  assert.equal(r.get('selectedCarId'), 'r34');
  r.set('selectedCarId', 'ek9'); // A temporary race/event selection.
  assert.equal(restorePreferredCar(r), 'r34');
  assert.equal(r.get('selectedCarId'), 'r34');
  const persisted = normaliseState(r.dump());
  assert.equal(persisted.preferredCarId, 'r34');
  assert.equal(persisted.selectedCarId, 'r34');
});
test('legacy profiles keep their last valid personal car without migration losses', () => {
  const loaded = normaliseState({
    ...createDefaultGameState(),
    ownedCarIds: ['ae86', 'ek9', 'r34'],
    selectedCarId: 'ek9',
  });
  assert.equal(loaded.preferredCarId, 'ek9');
  assert.equal(loaded.selectedCarId, 'ek9');
});
test('duplicate owned vehicles preserve the exact instance id', () => {
  registerOwnedCarInstances(['ek9__copy2']);
  assert(cars.ek9__copy2);
  const r = registry({
    ownedCarIds: ['ae86', 'ek9', 'ek9__copy2'],
    selectedCarId: 'ae86',
    preferredCarId: 'ae86',
  });
  assert.equal(choosePersonalCar(r, 'ek9__copy2'), true);
  r.set('selectedCarId', 'ek9');
  assert.equal(restorePreferredCar(r), 'ek9__copy2');
  const result = normaliseState({ ...createDefaultGameState(), ...r.dump() });
  assert.equal(result.preferredCarId, 'ek9__copy2');
  assert.equal(result.selectedCarId, 'ek9__copy2');
});
test('sold cars and temporary crew cars cannot become the saved personal preference', () => {
  const r = registry({ ownedCarIds: ['ae86', 'ek9'], selectedCarId: 'ae86', preferredCarId: 'ek9' });
  r.set('ownedCarIds', ['ae86']);
  assert.equal(getPreferredCarId(r), 'ae86');
  assert.equal(restorePreferredCar(r), 'ae86');
  assert.equal(choosePersonalCar(r, 'crew__aoiShindou'), false);
  assert.equal(choosePersonalCar(r, 'r34'), false);
});
test('ongoing elite and crew races must not override their explicitly locked car', () => {
  for (const gate of [{ crewSpaceActive: true }, { crewBattleState: { active: true } },
    { oshiageEliteSeries: { active: true } }]) {
    const r = registry({
      ownedCarIds: ['ae86', 'ek9'],
      selectedCarId: 'ek9', preferredCarId: 'ae86', ...gate,
    });
    assert.equal(restorePreferredCar(r), 'ek9');
    assert.equal(r.get('selectedCarId'), 'ek9');
  }
});
test('garage, meet, Oshiage paint and Central Tokyo consume the shared preference', () => {
  const garage = source('src/scenes/GarageScene.js');
  const meet = source('src/scenes/MeetScene.js');
  const oshiage = source('src/scenes/OshiageScene.js');
  const central = source('src/scenes/CentralTokyoScene.js');
  const state = source('src/state/GameState.js');
  assert(garage.includes('choosePersonalCar(this.registry, id)'));
  assert(garage.includes('this.selectCar(this.selectedCarId, { remember: false })'));
  assert(garage.includes('const preferredCarId = getPreferredCarId(this.registry);'));
  assert(meet.includes('restorePreferredCar(this.registry);'));
  assert(oshiage.includes('restorePreferredCar(this.registry);'));
  assert(central.includes('restorePreferredCar(this.registry);'));
  assert(state.includes("preferredCarId: registry.get('preferredCarId') || null"));
});
