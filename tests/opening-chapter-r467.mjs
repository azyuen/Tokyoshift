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

test('older saves keep their starter car but never revive retired Daichi onboarding', () => {
  const saved = createDefaultGameState({ starterCarId: 'ae86' });
  delete saved.openingChapter;
  saved.cutscenesSeen = ['openingDaichiStory', 'openingRaceRules', 'openingWorkshopGuide'];
  const normal = normaliseState(saved);
  assert.equal(normal.ownedCarIds[0], 'ae86');
  assert.equal(normal.gameOver, false);
  assert.equal(normal.openingChapter, null);
  assert.equal(CUTSCENES.openingDaichiStory, undefined);
  assert.equal(CUTSCENES.openingRaceRules, undefined);
  assert.equal(CUTSCENES.openingWorkshopGuide, undefined);
  const garage = source('src/scenes/GarageScene.js');
  for (const id of ['openingDaichiStory', 'openingRaceRules', 'openingWorkshopGuide'])
    assert.doesNotMatch(garage, new RegExp(id));
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
  assert.match(CUTSCENES.openingDaichiAfterSayaka.pages.map(x => x.text).join(' '), /engine|gearing|night meet/i);
});

test('station starts with grounded, larger characters and only a next button', () => {
  const station = source('src/scenes/TrainStationScene.js');
  assert.match(station, /985, 739, 405/);
  assert.match(station, /1265, 739, 435/);
  assert.match(station, /this.nextText =/);
  assert.doesNotMatch(station, /this.dialogue =|this.speaker =|showLine\(/);
  assert.match(station, /playMangaCutscene\(this, 'openingStationEncounter'/);
  assert.doesNotMatch(station, /backgroundStyle: 'paper'/);
  assert.match(station, /const daichiStage = placeCharacter/);
  assert.match(station, /const finishStationConversation =/);
  assert.match(station, /targets: \[daichiStage.actor, daichiStage.shadow\]/);
  assert.match(station, /this.nextText.setText\('GO TO MAP  >'\)/);
  assert.doesNotMatch(station, /onComplete: \(\) => \{[\s\S]{0,220}this\.showTrainMap\(\)/);
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
  assert.match(magazine, /PRESS THE CAR YOU THINK IS BETTER/);
  assert.doesNotMatch(magazine, /PRESS THE ONE/);
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
  assert.doesNotMatch(office, /closeOffice\(\);\s+scene\.completeOpeningMagazineChoice\?\.\(carId\)/);
  assert.match(garage, /this\.registry\.set\('openingChapter', 'delivery'\)/);
  assert.match(garage, /this\.showOpeningPhoneCall\(\)/);
});

test('Sayaka calls inside the office and addresses the chosen first name', () => {
  const garage = source('src/scenes/GarageScene.js');
  const office = source('src/ui/OfficePanel.js');
  assert.match(office, /scene\.completeOpeningMagazineChoice\?\.\(carId\)/);
  assert.doesNotMatch(office, /closeOffice\(\);\s*scene\.completeOpeningMagazineChoice/);
  assert.match(garage, /if \(!this\._officeOverlay\?\.length\) showOfficePanel\(this\)/);
  assert.match(garage, /INCOMING CALL/);
  assert.match(garage, /SAYAKA/);
  assert.match(garage, /firstName = String\(this\.registry\.get\('firstName'\)/);
  assert.match(garage, /I've got your new car, meet me in your garage!/);
  assert.match(garage, /this\.closeOpeningOffice\?\.\(\)/);
});

test('starter car rolls in slowly with distance-synchronised wheel rotation', () => {
  const garage = source('src/scenes/GarageScene.js');
  assert.match(garage, /this\.selectedDisplay\?\.\[3\], this\.selectedDisplay\?\.\[4\]/);
  assert.match(garage, /duration: 4300/);
  assert.match(garage, /const distance = currentX - lastX/);
  assert.match(garage, /wheel\.angle \+= \(distance \/ radius\)/);
  assert.match(garage, /this\.time\.delayedCall\(440/);
  assert.match(garage, /this\.spawnOpeningCompanion\('sayakaFujieda', true/);
});

test('Sayaka matches player height, faces player and fades in left of the car', () => {
  const garage = source('src/scenes/GarageScene.js');
  assert.match(garage, /const targetX = isSayaka \? 548 : 970/);
  assert.match(garage, /isSayaka \? PLAYER_CFG\.targetHeight : 200/);
  assert.match(garage, /if \(isSayaka\) sprite\.setFlipX\(true\)/);
  assert.match(garage, /duration: 950/);
  assert.match(garage, /sprite\.once\('destroy'/);
});

test('opening and farewell dialogue use Sayaka normal-happy-normal beat', () => {
  const intro = CUTSCENES.openingSayakaKeys.pages;
  const goodbye = CUTSCENES.openingSayakaFarewell.pages;
  assert.equal(intro.length, 5);
  assert.equal(goodbye.length, 4);
  assert.match(intro[0].text, /father said you needed this/);
  assert.match(intro[2].text, /even know how to drive/);
  assert.match(intro[3].text, /press accelerate/);
  assert.match(intro[4].text, /clutch in, shift gears/);
  assert.equal(intro[4].pose, 'homeSad');
  assert.equal(goodbye[0].pose, 'homeHappy');
  assert.match(goodbye[0].text, /listen to the engine/);
  assert.equal(goodbye[2].pose, 'homeBlushing');
  assert.match(goodbye[2].text, /Teehehe/);
  assert.equal(goodbye[3].pose, 'homeSerious');
  assert.match(goodbye[3].text, /drive safely/i);
});

test('Sayaka leaves the player at a resumable workshop checkpoint before a separate tap', () => {
  const state = normaliseState({ ...pending('awaitDaichi'), ownedCarIds: ['ae86'], selectedCarId: 'ae86' });
  assert.equal(state.openingChapter, 'awaitDaichi');
  const garage = source('src/scenes/GarageScene.js');
  assert.match(garage, /this\.registry\.set\('openingChapter', 'awaitDaichi'\)/);
  assert.match(garage, /this\.fadeOpeningSayakaFromGarage\(\(\) =>/);
  assert.match(garage, /if \(chapter === 'awaitDaichi'\) return true/);
  assert.match(garage, /if \(chapter === 'awaitDaichi'\) \{\s*this\.armDaichiWorkshopTap\(\);/);
  assert.match(garage, /delayedCall\(120, \(\) => this\.armDaichiWorkshopTap\(\)\)/);
});

test('the very next workshop tap triggers the full-size Daichi chassis pose', () => {
  const garage = source('src/scenes/GarageScene.js');
  assert.match(garage, /armDaichiWorkshopTap\(\) \{/);
  assert.match(garage, /rectangle\(780, 420, 1560, 840, 0x000000, 0\.001\)/);
  assert.match(garage, /shield\.once\('pointerdown', \(\) =>/);
  assert.match(garage, /this\.startDaichiWorkshopArrival\(\)/);
  assert.match(garage, /this\.registry\.set\('openingChapter', 'daichi'\)/);
  assert.match(garage, /this\.startDaichiWorkshopArrival\(true\)/);
  assert.match(garage, /textureKey: 'daichiChassisTools'/);
  assert.match(garage, /getDaichiChassisPosition\(\) \{/);
  assert.match(garage, /DAICHI_CFG\.chassis/);
  assert.match(garage, /targetHeight: chassisCfg\.targetHeight/);
  assert.match(garage, /anchorY: 1517 \/ 1536/);
  assert.match(garage, /duration: 950/);
  assert.doesNotMatch(garage, /spawnOpeningCompanion\('daichiSakamoto', false\)/);
});

test('Daichi dialogue begins with the father and stock car but keeps later tuning exposition', () => {
  const pages = CUTSCENES.openingDaichiAfterSayaka.pages;
  assert.match(pages[0].text, /after all these years talking about driving/i);
  assert.match(pages[1].text, /my dad would get me one/);
  assert.match(pages[2].text, /picked a good one/);
  assert.match(pages[2].text, /ex-pro driver/);
  assert.match(pages[3].text, /looks stock to me/);
  assert.match(pages[4].text, /Good thing your childhood friend/);
  assert.equal(pages.length, 9, 'Four initial exchanges plus five final Daichi lines');
  assert.equal(pages.slice(5).length, 4, 'Only four clicks after the spanner line');
  assert.match(pages[5].text, /Engine, gearing, grip/);
  assert.match(pages[5].text, /workshop/);
  assert.match(pages[6].text, /meet on the map/);
  assert.match(pages[6].text, /cash/);
  assert.match(pages[7].text, /Pink slips/);
  assert.match(pages[7].text, /Lose/);
  assert.match(pages[8].text, /bring it back/);
});

test('the Daichi story finishes with a normal, cleaned workshop and no stale gold prompt', () => {
  const garage = source('src/scenes/GarageScene.js');
  assert.match(garage, /clearOpeningOfficePrompt\(\) \{/);
  assert.match(garage, /this\._openingOfficeGlowTween\?\.remove\?\.\(\)/);
  assert.match(garage, /this\.clearOpeningOfficePrompt\(\);\s*this\.deliverOpeningCar\(\)/);
  assert.match(garage, /restoreNormalWorkshopAfterOpening\(\) \{/);
  assert.match(garage, /this\._openingDaichiObjects = \[\]/);
  assert.match(garage, /this\.selectCar\(this\.selectedCarId\)/);
  assert.match(garage, /this\.renderGaragePage\(\)/);
  assert.match(garage, /this\.setWorkshopHomeHotspotsVisible\(true\)/);
  assert.match(garage, /this\.registry\.set\('openingChapter', 'done'\);[\s\S]*?this\.restoreNormalWorkshopAfterOpening\(\);/);
  assert.doesNotMatch(garage, /this\.time\.delayedCall\(160, \(\) => this\.showCentralTokyoInvitationIfNeeded\(\)\);\s*return;/);
});


test('authored 02–03 spread pauses, then reveals thought and one shared car instruction', () => {
  const magazine = source('src/ui/CarHistoryPanel.js');
  assert.match(magazine, /scene\.time\.delayedCall\(1000, \(\) =>/);
  assert.match(magazine, /targets: thought, alpha: 1, duration: 520/);
  assert.match(magazine, /targets: selectionUi, alpha: 1, duration: 480/);
  assert.match(magazine, /frame\.disableInteractive\(\)/);
  assert.match(magazine, /frame\.setInteractive\(\{ useHandCursor: true \}\)/);
  assert.match(magazine, /DO YOU THINK THIS CAR IS BETTER\?/);
  assert.equal((magazine.match(/PRESS THE CAR YOU THINK IS BETTER/g) || []).length, 1);
  assert.doesNotMatch(magazine, /PRESS THE ONE\\nYOU LIKE BEST/);
  assert.ok(magazine.includes(String.raw`in…\nbut which one would be better?`));
  assert.ok(!magazine.includes(String.raw`in…\\nbut which one would be better?`));
});

test('the in-office Sayaka phone call shows uploaded artwork and real line breaks', () => {
  const garage = source('src/scenes/GarageScene.js');
  assert.match(garage, /assets\/Ui\/phone\.png\?v=20261011-r475/);
  assert.ok(existsSync('assets/Ui/phone.png'));
  assert.match(garage, /this\.add\.image\(678, 478, 'openingIncomingPhone'\)/);
  assert.match(garage, /rectangle\(920, 414, 920, 256/);
  assert.ok(garage.includes(String.raw`around the corner.\nI've got your new car`));
  assert.ok(!garage.includes(String.raw`around the corner.\\nI've got your new car`));
});

test('Sayaka expression assets are loaded in the manga portrait pose map', async () => {
  const { characters } = await import('../src/data/characters.js');
  const poses = characters.sayakaFujieda.visual.poseAssets;
  assert.equal(poses.homeSad.path, 'assets/Characters/Main/home_sayaka_fujieda_sad.png');
  assert.equal(poses.homeHappy.path, 'assets/Characters/Main/home_sayaka_fujieda_happy.png');
  assert.equal(poses.homeBlushing.path, 'assets/Characters/Main/home_sayaka_fujieda_blushing.png');
  assert.equal(poses.homeSerious.path, 'assets/Characters/Main/home_sayaka_fujieda_serious.png');
  for (const key of ['homeSad', 'homeHappy', 'homeBlushing', 'homeSerious']) {
    assert.ok(existsSync(poses[key].path));
  }
});

test('single modern Daichi cutscene ends immediately in a normal workshop', () => {
  const garage = source('src/scenes/GarageScene.js');
  const cutsceneData = source('src/data/cutscenes.js');
  assert.match(garage, /if \(chapter === 'daichi'\) \{/);
  assert.match(garage, /const finishDaichiIntroduction = \(\) => \{/);
  assert.match(garage, /this\.registry\.set\('openingChapter', 'done'\)/);
  assert.match(garage, /this\.restoreNormalWorkshopAfterOpening\(\)/);
  assert.match(garage, /onComplete: finishDaichiIntroduction/);
  for (const id of ['openingDaichiStory', 'openingRaceRules', 'openingWorkshopGuide']) {
    assert.doesNotMatch(garage, new RegExp(id));
    assert.doesNotMatch(cutsceneData, new RegExp(id));
    assert.equal(CUTSCENES[id], undefined);
  }
});

test('Sayaka first-keys and driving-safe panels resolve to the actual authored sprite textures', async () => {
  const { getCharacterVisualAsset } = await import('../src/data/characters.js');
  const { getCharacterProfileTexture } = await import('../src/characters/CharacterProfileRenderer.js');
  const { openingSayakaKeys, openingSayakaFarewell } = CUTSCENES;
  const checks = [
    [openingSayakaKeys.pages[4], 'assets/Characters/Main/home_sayaka_fujieda_sad.png'],
    [openingSayakaFarewell.pages[0], 'assets/Characters/Main/home_sayaka_fujieda_happy.png'],
    [openingSayakaFarewell.pages[2], 'assets/Characters/Main/home_sayaka_fujieda_blushing.png'],
    [openingSayakaFarewell.pages[3], 'assets/Characters/Main/home_sayaka_fujieda_serious.png'],
  ];
  for (const [page, path] of checks) {
    const asset = getCharacterVisualAsset('sayakaFujieda', page.pose);
    assert.equal(asset?.path, path, 'Wrong texture lookup for ' + page.text);
    assert.equal(asset?.fallback, false);
    const portrait = getCharacterProfileTexture('sayakaFujieda', page.pose);
    assert.equal(portrait?.path, path, 'Portrait renderer fell back to idle for ' + page.pose);
    assert.ok(existsSync(path), 'Missing image: ' + path);
    const lower = getCharacterProfileTexture('sayakaFujieda', page.pose.toLowerCase());
    assert.equal(lower?.key, portrait?.key, 'Case-insensitive pose lookup must be stable');
  }
});

test('Sayaka farewell fades both manga portrait and garage companion before Daichi can appear', () => {
  const cutscene = source('src/ui/MangaCutscene.js');
  const garage = source('src/scenes/GarageScene.js');
  assert.match(garage, /playMangaCutscene\(this, 'openingSayakaFarewell', \{\s*exitFadeMs: 850/);
  assert.match(cutscene, /duration: Math\.max\(190, Number\(context\.options\.exitFadeMs\) \|\| 190\)/);
  assert.match(garage, /fadeOpeningSayakaFromGarage\(onComplete\) \{/);
  assert.match(garage, /targets,\s*alpha: 0,\s*duration: 950/);
  assert.match(garage, /this\.fadeOpeningSayakaFromGarage\(\(\) => \{\s*this\.registry\.set\('openingChapter', 'awaitDaichi'\)/);
  assert.doesNotMatch(garage, /this\.openingCompanion\?\.destroy\?\.\(\)/);
});
