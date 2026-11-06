import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const meet = readFileSync('src/scenes/MeetScene.js', 'utf8');
const race = readFileSync('src/scenes/RaceScene.js', 'utf8');
const garage = readFileSync('src/scenes/GarageScene.js', 'utf8');

test('Warehouse HQ selection persists the owned car ID', () => {
  assert.match(garage, /this\.selectedCarId = id;\s*this\.registry\.set\('selectedCarId', id\)/);
  assert.match(garage, /choosePersonalCar\(this\.registry, id\)/);
});

test('all Meet-to-Race entries snapshot the selected car', () => {
  const transitions = [...meet.matchAll(/this\.scene\.start\('RaceScene'\)/g)];
  assert.ok(transitions.length >= 6);
  for (const transition of transitions) {
    const preceding = meet.slice(Math.max(0, transition.index - 330), transition.index);
    assert.match(preceding, /this\.registry\.set\('raceEntryCarId', this\.registry\.get\('selectedCarId'\) \|\| null\)/);
  }
});

test('Race uses captured car and saved modifications, never stock AE86 fallback', () => {
  const init = race.slice(race.indexOf('  init() {'), race.indexOf('  create() {'));
  assert.match(init, /const selectedCarId = entryCarId \|\| this\.registry\.get\('selectedCarId'\)/);
  assert.doesNotMatch(init, /this\.selectedCarId\s*=\s*'ae86'/);
  assert.match(race, /const savedPlayerState = carStates\[this\.selectedCarId\]/);
  assert.match(race, /const playerBaseCar = clone\(cars\[this\.selectedCarId\]\)/);
  assert.match(race, /this\.applyOwnedBuild\(\s*playerBaseCar,/);
});

test('invalid selected car cancels race entry', () => {
  assert.match(race, /if \(this\.invalidRaceCarSelection\) \{/);
  assert.match(race, /this\.scene\.start\(this\.registry\.get\('raceReturnScene'\) \|\| 'MeetScene'\)/);
});
