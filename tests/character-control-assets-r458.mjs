import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  characters,
  getCharacterVisualAsset,
  playableCharacterOrder,
  MAIN_RIVAL_BY_REGION,
  REGION_TEAM_CHARACTER_IDS,
  getRivalCharacterOrderForRegion,
} from '../src/data/characters.js';

const source = file => readFileSync(file, 'utf8');
const expectedFile = path => {
  assert.ok(existsSync(path), 'Missing sprite ' + path);
  return path;
};

test('Daichi uses Main home sprite in all workshops and dyno', () => {
  assert.equal(characters.daichiSakamoto.rivalEligible, false);
  const visual = getCharacterVisualAsset('daichiSakamoto');
  assert.equal(visual.path, expectedFile('assets/Characters/Main/home_daichi_sakamoto.png'));
  const garage = source('src/scenes/GarageScene.js');
  const dyno = source('src/scenes/DynoScene.js');
  for (const pose of ['engine_inspect', 'chassis_tools', 'exhaust_crouch']) {
    assert.ok(garage.includes(expectedFile('assets/Characters/Main/home_daichi_' + pose + '.png')));
  }
  assert.match(dyno, /characters\.daichiSakamoto\.*/);
  assert.doesNotMatch(garage, /assets\/Characters\/daichi_(?:engine|chassis|exhaust)/);
});

test('Sayaka has separate home, Ginza and future pro racing outfits in Main', () => {
  for (const [pose, path] of [
    ['homeNormal', 'assets/Characters/Main/home_sayaka_fujieda_normal.png'],
    ['normal', 'assets/Characters/Main/ginza_sayaka_fujieda_normal.png'],
    ['happy', 'assets/Characters/Main/ginza_sayaka_fujieda_happy.png'],
    ['sad', 'assets/Characters/Main/ginza_sayaka_fujieda_sad.png'],
    ['serious', 'assets/Characters/Main/ginza_sayaka_fujieda_serious.png'],
    ['track', 'assets/Characters/Main/race_sayaka_fujieda_idle.png'],
  ]) {
    assert.equal(getCharacterVisualAsset('sayakaFujieda', pose).path, expectedFile(path));
  }
  assert.equal(characters.sayakaFujieda.rivalEligible, false);
});

test('Emi is selectable Odaiba principal rival with canonical root assets', () => {
  assert.equal(MAIN_RIVAL_BY_REGION.ODAIBA, 'emiKanzaki');
  assert.equal(characters.emiKanzaki.mainRival, true);
  assert.equal(characters.emiKanzaki.regionId, 'ODAIBA');
  assert.ok(playableCharacterOrder.includes('emiKanzaki'));
  assert.ok(REGION_TEAM_CHARACTER_IDS.ODAIBA.includes('emiKanzaki'));
  assert.ok(getRivalCharacterOrderForRegion('ODAIBA').includes('emiKanzaki'));
  for (const pose of ['idle', 'win', 'loss']) {
    assert.equal(getCharacterVisualAsset('emiKanzaki', pose).path,
      expectedFile('assets/Characters/emi_kanzaki_' + pose + '.png'));
  }
});

test('retired duplicate character assets are removed without touching main cast files', () => {
  for (const p of [
    'assets/Characters/daichi_sakamoto.png',
    'assets/Characters/daichi_engine_inspect.png',
    'assets/Characters/daichi_chassis_tools.png',
    'assets/Characters/daichi_exhaust_crouch.png',
    ...['normal', 'happy', 'sad', 'serious'].map(p => 'assets/Characters/Central/sayaka_fujieda_' + p + '.png'),
    ...['idle', 'win', 'loss'].map(p => 'assets/Characters/Shinagawa/sayaka_fujieda_' + p + '.png'),
  ]) assert.equal(existsSync(p), false, 'Retired duplicate remains: ' + p);
});

test('both pedal gauge fills remain size-aware and follow the art more closely', () => {
  const controls = source('src/input/TouchControls.js');
  assert.match(controls, /x: clutchRect\.right - 53 \* clutchScale/);
  assert.match(controls, /y: clutchRect\.y \+ 98 \* clutchScale/);
  assert.match(controls, /w: 26 \* clutchScale/);
  assert.match(controls, /x: throttleRect\.right - 61 \* throttleScale/);
  assert.match(controls, /y: throttleRect\.y \+ 99 \* throttleScale/);
  assert.match(controls, /w: 27 \* throttleScale/);
  const hud = source('src/ui/RaceHUD.js');
  assert.match(hud, /fontSize: '26px', color: '#f7f7f2'/);
  assert.match(hud, /this\.sourcePoint\(1213, 300\)/);
  assert.match(hud, /152 \* this\.scale, 36 \* this\.scale/);
  for(const raceScene of ['src/scenes/RaceScene.js','src/scenes/FourLaneTestScene.js','src/scenes/DynoScene.js']) {
    const code=source(raceScene);
    assert.match(code, /new TouchControls\(this/);
    assert.match(code, /new RaceHUD\(this/);
  }
});
