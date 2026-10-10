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
  const magazine = source('src/ui/CarHistoryPanel.js');
  const main = source('src/main.js');
  assert.match(setup, /state\.openingChapter = 'station'/);
  assert.doesNotMatch(setup, /this\.buildStarterCarPanel\(\).*?this\.currentStarterCarId =/s);
  assert.match(main, /TrainStationScene/);
  assert.match(station, /travelMode: 'openingTrain'/);
  assert.match(station, /this.cameras.main.fadeIn\(1600/);
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

test('station starts with grounded, larger characters and only a next button', () => {
  const station = source('src/scenes/TrainStationScene.js');
  assert.match(station, /985, 739, 405/);
  assert.match(station, /1265, 739, 435/);
  assert.match(station, /this.nextText =/);
  assert.doesNotMatch(station, /this.dialogue =|this.speaker =|showLine\(/);
  assert.match(station, /playMangaCutscene\(this, 'openingStationEncounter'/);
  assert.match(station, /backgroundStyle: 'paper'/);
});

test('station cutscene addresses selected name without spoiling car or Sayaka', () => {
  const scene = CUTSCENES.openingStationEncounter;
  assert.deepEqual(scene.characters, { left: 'daichiSakamoto', right: '$PLAYER' });
  assert.equal(scene.finalActionLabel, 'GO TO MAP');
  assert.equal(scene.pages[0].speaker, 'left');
  assert.match(scene.pages[0].text, /\{PLAYER_FIRST_NAME\}/);
  assert.ok(scene.pages.some(p => p.speaker === 'right'));
  assert.ok(scene.pages.some(p => /last year's Tokyo Champion/.test(p.text)));
  const lines = scene.pages.map(p => p.text).join('\n');
  assert.doesNotMatch(lines, /Sayaka|two cars|choose a car|AE86|Civic EF/i);
  assert.match(lines, /family friend/i);
  assert.match(lines, /from my dad/i);
});

test('train map reveals only Shinonome home without modifying the ordinary map', () => {
  const map = source('src/ui/TravelMap.js');
  const station = source('src/scenes/TrainStationScene.js');
  assert.match(map, /openingTrainMode = travelMode === 'openingTrain'/);
  assert.match(map, /openingTrainMode && regionId !== HOME_REGION_ID/);
  assert.match(map, /region.locations.filter\(item => item.id === 'shinonomeWorkshop'\)/);
  assert.match(map, /setText\('HOME'\)/);
  assert.match(station, /homeCost: 0/);
  assert.match(station, /onHome: \(locationId\)/);
  assert.match(station, /openingChapter', 'home'/);
});

test('workshop prompt is centred and office magazine label is simplified', () => {
  const garage = source('src/scenes/GarageScene.js');
  const office = source('src/ui/OfficePanel.js');
  assert.match(garage, /wordWrap: \{ width: promptW - 48 \}/);
  assert.match(garage, /setOrigin\(0\.5, 0\.5\)/);
  assert.match(office, /READ THE TOKYO SHIFT MAGAZINE/);
  assert.doesNotMatch(office, /TAP THE MAGAZINE TO CHOOSE YOUR CAR/);
});

test('Issue 01 uses the real cover, Auto Market ad and contents assets', async () => {
  const { MAGAZINE_ISSUES } = await import('../src/data/carMagazine.js');
  const issue = MAGAZINE_ISSUES[1];
  assert.equal(issue.coverPath, 'assets/Magazine/01/cover.webp');
  assert.equal(issue.adPath, 'assets/Magazine/01/automarket_ad.webp');
  assert.equal(issue.insetPath, 'assets/Magazine/01/contents.webp');
  for (const path of [issue.coverPath, issue.adPath, issue.insetPath]) {
    assert.equal(existsSync(path), true, 'Missing authored page: ' + path);
  }
});

test('the opening and later visits use one magazine page-flip renderer', () => {
  const magazine = source('src/ui/CarHistoryPanel.js');
  const office = source('src/ui/OfficePanel.js');
  const wrapper = source('src/ui/OpeningMagazine.js');
  assert.match(magazine, /openingChoice = scene\.registry\.get\('openingChapter'\) === 'magazine'/);
  assert.match(magazine, /totalViews = openingChoice \? 2 : 2 \+ featureSpreadCount/);
  assert.match(magazine, /Math\.max\(1, Math\.ceil\(features\.length \/ 2\)\)/);
  assert.match(magazine, /issue\.adKey/);
  assert.match(magazine, /issue\.insetKey/);
  assert.match(office, /showMagazinePanel\(scene, openingMagazine/);
  assert.doesNotMatch(office, /showOpeningMagazine\(scene/);
  assert.match(wrapper, /return showMagazinePanel\(scene, \{ onChoose \}\)/);
});

test('page 2 carries both rendered starter cars, model inserts and live selection prompts', () => {
  const magazine = source('src/ui/CarHistoryPanel.js');
  assert.match(magazine, /\['ae86', 0\.25, 'TOYOTA AE86'\]/);
  assert.match(magazine, /\['ef', 0\.75, 'HONDA CIVIC EF'\]/);
  assert.match(magazine, /renderCarPhoto\(scene, \{ carId: id, state: \{\} \}/);
  assert.match(magazine, /PRESS THE ONE/);
  assert.match(magazine, /YOU LIKE BEST/);
  assert.match(magazine, /I've heard that these two cars are great to start racing in/);
  assert.match(magazine, /but which one would be better/);
  assert.match(magazine, /activeGlows\.push/);
});

test('confirming a car closes the actual magazine and starts delivery, without bypassing confirmation', () => {
  const magazine = source('src/ui/CarHistoryPanel.js');
  const office = source('src/ui/OfficePanel.js');
  const garage = source('src/scenes/GarageScene.js');
  assert.match(magazine, /const confirmStarterCar = carId =>/);
  assert.match(magazine, /accept\.on\('pointerdown', \(\) =>/);
  assert.match(magazine, /closeMagazine\(\);\s+if \(typeof options\.onChoose/);
  assert.match(magazine, /frame\.on\('pointerdown', \(\) => confirmStarterCar\(id\)\)/);
  assert.match(office, /closeOffice\(\);\s+scene\.completeOpeningMagazineChoice\?\.\(carId\)/);
  assert.match(garage, /this\.registry\.set\('openingChapter', 'delivery'\)/);
  assert.match(garage, /this\.showOpeningPhoneCall\(\)/);
});
