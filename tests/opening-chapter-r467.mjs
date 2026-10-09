import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createDefaultGameState, createStarterCarState, normaliseState } from '../src/state/GameState.js';
import { CUTSCENES } from '../src/data/cutscenes.js';

const source = path => readFileSync(path, 'utf8');
const pending = (stage = 'station') => ({
  ...createDefaultGameState({ starterCarId: 'ae86' }),
  firstName: 'TEST', lastName: 'DRIVER',
  openingChapter: stage,
  ownedCarIds: [], carStates: {}, carGarageLocations: {}, selectedCarId: null,
  gameOver: false,
});

test('brand-new profile starts at the train station without an owned or phantom starter car', () => {
  const normal = normaliseState(pending());
  assert.equal(normal.openingChapter, 'station');
  assert.deepEqual(normal.ownedCarIds, []);
  assert.deepEqual(normal.carStates, {});
  assert.deepEqual(normal.carHistory, []);
  assert.equal(normal.selectedCarId, null);
  assert.equal(normal.gameOver, false);
});

test('station -> home -> magazine -> delivery preserves zero vehicles across saves', () => {
  for (const stage of ['station', 'home', 'magazine', 'delivery']) {
    const original = pending(stage);
    if (stage === 'delivery') original.starterCarId = 'ef';
    const normal = normaliseState(original);
    assert.equal(normal.openingChapter, stage);
    assert.equal(normal.starterCarId, stage === 'delivery' ? 'ef' : 'ae86');
    assert.deepEqual(normal.ownedCarIds, []);
    assert.equal(normal.gameOver, false);
  }
});

test('the selected EF is awarded once and resumes with Sayaka after delivery', () => {
  const original = pending('tutorial');
  original.starterCarId = 'ef';
  original.ownedCarIds = ['ef'];
  original.selectedCarId = 'ef';
  original.carGarageLocations = { ef: 'shinonomeWorkshop' };
  original.carStates = { ef: createStarterCarState() };
  const normal = normaliseState(original);
  assert.deepEqual(normal.ownedCarIds, ['ef']);
  assert.equal(normal.selectedCarId, 'ef');
  assert.equal(normal.openingChapter, 'tutorial');
  assert.equal(normal.gameOver, false);
  assert.equal(normal.carStates.ef.acquiredVia, 'starter');
  assert.equal(normal.carHistory.filter(h => h.carId === 'ef' && h.status === 'OWNED').length, 1);
});

test('new lesson completion checkpoint survives normalisation', () => {
  const original = pending('tutorial');
  original.ownedCarIds = ['ae86'];
  original.selectedCarId = 'ae86';
  original.openingDrivingLessonComplete = true;
  const normal = normaliseState(original);
  assert.equal(normal.openingDrivingLessonComplete, true);
  assert.equal(normal.introTutorialChoiceDone, false);
});

test('older saves keep their original starter car and original Daichi cutscene', () => {
  const saved = createDefaultGameState({ starterCarId: 'ae86' });
  delete saved.openingChapter;
  const normal = normaliseState(saved);
  assert.equal(normal.ownedCarIds[0], 'ae86');
  assert.equal(normal.gameOver, false);
  assert.equal(normal.openingChapter, null);
  assert.equal(CUTSCENES.openingDaichiStory.pages[0].leftCharacter, 'sayakaFujieda');
  assert.ok(CUTSCENES.openingDaichiStory.pages[0].text.includes('bring this over'));
});

test('new character and scene order resolves the station and first-car choice only at the magazine', () => {
  const station = source('src/scenes/TrainStationScene.js');
  const setup = source('src/scenes/CharacterSelectScene.js');
  const garage = source('src/scenes/GarageScene.js');
  const magazine = source('src/ui/OpeningMagazine.js');
  const main = source('src/main.js');
  assert.match(setup, /state\.openingChapter = 'station'/);
  assert.doesNotMatch(setup, /this\.buildStarterCarPanel\(\).*?this\.currentStarterCarId =/s);
  assert.match(main, /TrainStationScene/);
  assert.match(station, /SHINONOME WORKSHOP/);
  assert.match(garage, /createStarterCarState\(\)/);
  assert.match(garage, /openingSayakaFarewell/);
  assert.match(garage, /openingDaichiAfterSayaka/);
  assert.match(magazine, /TOYOTA AE86/);
  assert.match(magazine, /HONDA CIVIC EF/);
  assert.match(magazine, /CONFIRM CAR/);
  for (const phase of ['day', 'night'])
    assert.ok(existsSync('assets/CentralTokyo/tokyo_trainstation_' + phase + '.png'));
});

test('Sayaka stays the driving mentor while Daichi explains tuning and Tokyo', () => {
  assert.equal(CUTSCENES.openingSayakaKeys.characters.left, 'sayakaFujieda');
  assert.equal(CUTSCENES.openingSayakaFarewell.characters.left, 'sayakaFujieda');
  assert.equal(CUTSCENES.openingDaichiAfterSayaka.characters.left, 'daichiSakamoto');
  assert.match(CUTSCENES.openingDaichiAfterSayaka.pages.map(x => x.text).join(' '), /engine|drivetrain|drag scene/i);
});
