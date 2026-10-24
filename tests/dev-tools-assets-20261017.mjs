import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { cars } from '../src/data/cars.js';
import { HERO_CAR_ASSETS, HERO_WHEEL_DIAMETERS } from '../src/data/heroCarAssets.js';
import { CUTSCENES } from '../src/data/cutscenes.js';
import { TUNER_SHOPS } from '../src/data/tunerShops.js';
import { TUNER_DECAL_STYLES, preloadTunerDecalAssets } from '../src/vehicles/TunerDecals.js';
import { getWheelPairFit } from '../src/vehicles/WheelFit.js';

const code = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('official Zero/Sports PNG is available to the shop and saved decals', () => {
  const style = TUNER_DECAL_STYLES.zeroSports;
  assert.equal(style.suggestedPath, 'assets/Decals/zerosports.png');
  assert.equal(TUNER_SHOPS.SHINAGAWA.decalPath, style.suggestedPath);
  assert.equal(TUNER_SHOPS.SHINAGAWA.decalTextureKey, style.textureKey);
  assert.ok(existsSync(new URL('../' + style.suggestedPath, import.meta.url)));
  const pending = [];
  const count = preloadTunerDecalAssets({
    textures: { exists: () => false },
    load: { image: (key, path) => pending.push([key, path]) },
  }, { tunerDecals: { zeroSports: { x: 0, y: 0 } } });
  assert.equal(count, 1);
  assert.equal(pending[0][0], style.textureKey);
  assert.match(pending[0][1], /assets\/Decals\/zerosports\.png/);
});

test('rendered decals sit between paint and opaque body shell', () => {
  const body = code('src/vehicles/CarAppearance.js');
  assert.match(body, /\.setDepth\(depth \+ 0\.025\)/);
  assert.match(body, /\.setDepth\(depth\)\s*\.setTint\(color\)/);
  for (const scene of ['GarageScene', 'RaceScene', 'TunerShopScene']) {
    const source = code('src/scenes/' + scene + '.js');
    assert.match(source, /bodyLayers\.layered && bodyLayers\.overlay \? depth \+ 1\.012 : depth \+ 1\.04/, scene);
  }
});

test('fulfilled Ethan Yuen reward cannot be awarded again', () => {
  assert.equal(CUTSCENES.ethanYuenEfCompensation, undefined);
  const garage = code('src/scenes/GarageScene.js');
  assert.doesNotMatch(garage, /showEthanYuenRewardIfNeeded|coupons\.ef\s*=.*\+\s*2/);
});

test('developer controls are collapsible and story chapter previews are grouped first', () => {
  const meet = code('src/scenes/MeetScene.js');
  const tester = code('src/ui/CutsceneTester.js');
  assert.match(meet, /D\) DEPLOY  \+/);
  assert.match(meet, /const column = index % 3/);
  assert.match(meet, /box\.disableInteractive\(\)/);
  assert.match(tester, /CHAPTER 01 — THE FIRST NIGHT/);
  assert.match(tester, /CHAPTER 07 — ONE CREW, SEVEN ROADS/);
  assert.match(tester, /const smallerScenes = CUTSCENE_ORDER/);
  assert.match(tester, /height - 135/);
});

test('calibration and live wheel renderer use reference axle geometry and three sizes', () => {
  assert.deepEqual(Object.keys(HERO_WHEEL_DIAMETERS), ['small', 'medium', 'large']);
  assert.deepEqual(Object.values(HERO_WHEEL_DIAMETERS), [182, 194, 210]);
  const source = { width: 384, height: 384 };
  const visual = cars.zeroSportsGc8.visual;
  const baseline = getWheelPairFit(visual, 0.32, false, source);
  assert.equal(baseline.rear.offsetX, visual.referenceGeometry.rearX * 0.32);
  const adjusted = getWheelPairFit({
    ...visual,
    referenceGeometry: { ...visual.referenceGeometry, rearX: visual.referenceGeometry.rearX + 10 },
    referenceRearWheelDiameter: 210,
    referenceRearWheelYOffset: 4,
  }, 0.32, false, source);
  assert.ok(Math.abs(adjusted.rear.offsetX - baseline.rear.offsetX - 3.2) < 1e-10);
  assert.equal(adjusted.rear.wheelScale, 210 * 0.32 / 384);
  assert.ok(Math.abs(adjusted.rear.offsetY + 210 * 0.32 / 2 - 4 * 0.32) < 1e-10);
  const scene = code('src/scenes/WheelCalibrationScene.js');
  assert.match(scene, /referenceGeometry: \{/);
  assert.match(scene, /HERO_WHEEL_DIAMETERS/);
  assert.doesNotMatch(scene, /SIZE \+/);
});

test('every official collector points at the active hero folder, with no obsolete root duplicates', () => {
  const root = new URL('../assets/Cars/', import.meta.url);
  assert.deepEqual(readdirSync(root).filter(name => /_hero_body\.png$/.test(name)), []);
  for (const id of Object.keys(HERO_CAR_ASSETS)) {
    const path = cars[id].visual.bodyPath;
    assert.match(path, /^assets\/Cars\/hero\//, id);
    assert.ok(existsSync(new URL('../' + path, import.meta.url)), id);
  }
  assert.doesNotMatch(code('src/data/cars.js'), /assets\/Cars\/(?!hero\/)[a-z0-9_]+_hero_body\.png/i);
});
