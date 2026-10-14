import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { getCharacterVisualAsset } from '../src/data/characters.js';
import { OSHIAGE_SCHOOL_LESSONS } from '../src/data/oshiageSchool.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const school = read('src/scenes/OshiageScene.js');
const race = read('src/scenes/RaceScene.js');
const manga = read('src/ui/MangaCutscene.js');
const bookingScene = school.slice(school.indexOf('  showLessonBookingDialogue('), school.indexOf('  showInstructorCutscene()'));
const resultsScene = race.slice(race.indexOf('  showCoachedResultsCutscene('), race.indexOf('  setupDrivingTutorial('));

test('school dialogue begins with Sayaka and never repeats the player recognises her', () => {
  assert.doesNotMatch(bookingScene, /have we met somewhere|speaker: 'right'|right: '\$PLAYER'/i);
  assert.match(bookingScene, /speaker: 'left', pose: 'oshiageExplaining'/);
  assert.match(bookingScene, /speaker: 'left', pose: 'oshiageHappy'/);
  assert.equal(OSHIAGE_SCHOOL_LESSONS.basic.speech,
    'Haven’t we done this before? Oh wait! Ahem, I can teach you the basics for the first time…');
});

test('all Oshiage teaching poses map to the correct physical asset files', () => {
  const pairs = [
    ['oshiageNeutral', 'neutral'],
    ['oshiageExplaining', 'explaining'],
    ['oshiageHappy', 'happy'],
    ['oshiageConcerned', 'concerned'],
  ];
  for (const [pose, suffix] of pairs) {
    const asset = getCharacterVisualAsset('sayakaFujieda', pose);
    assert.equal(asset?.key, 'characterSayakaOshiage' + suffix[0].toUpperCase() + suffix.slice(1));
    assert.equal(asset?.path, 'assets/Characters/Main/oshiage_sayaka_fujieda_' + suffix + '.png');
    assert.ok(existsSync(new URL('../' + asset.path, import.meta.url)), pose);
  }
  assert.match(resultsScene, /oshiageConcerned' : 'oshiageHappy'/);
  assert.doesNotMatch(bookingScene, /pose: 'home/);
  assert.doesNotMatch(resultsScene, /pose: result\.timedOut \? 'home/);
});

test('course scenes load only needed poses and reuse shared Phaser texture keys', () => {
  assert.match(manga, /preloadPagePosesOnly/);
  assert.match(manga, /queuedKeys\.add\(asset\.key\)/);
  assert.match(manga, /if \(scene\.textures\.exists\(asset\.key\)\) continue/);
  assert.match(bookingScene, /preloadPagePosesOnly: true/);
  assert.match(resultsScene, /preloadPagePosesOnly: true/);
  assert.match(school, /schoolSayakaKey\(pose\)/);
  assert.match(race, /'characterSayakaOshiage' \+ pose\.charAt\(0\)/);
  assert.doesNotMatch(bookingScene, /right: '\$PLAYER'/);
});

test('car parks lower at stage midpoint without locking course buttons while rolling in', () => {
  assert.match(school, /drawOwnedCar\(car, state, 621, 430, 558/);
  assert.match(school, /lockUI: false/);
  assert.match(school, /if \(lockUI\) this\.paintBusy = true/);
  assert.match(school, /if \(lockUI\) this\.paintBusy = false/);
  assert.match(school, /!sceneCutsceneActive\(this\) && !this\.schoolPromptOpen/);
  assert.match(school, /progress\.travel \/ wheel\.radius/);
});
