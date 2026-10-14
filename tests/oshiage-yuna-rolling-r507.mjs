import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CENTRAL_TOKYO_CHARACTER_IDS, characters, getCharacterVisualAsset } from '../src/data/characters.js';

const scene = readFileSync(new URL('../src/scenes/OshiageScene.js', import.meta.url), 'utf8');

test('original Tokyo Wheel Shop attendant is Yuna Kisaragi in both Oshiage rooms', () => {
  assert.equal(CENTRAL_TOKYO_CHARACTER_IDS.autoMarket.wheels, 'yunaKisaragi');
  assert.equal(characters.yunaKisaragi.name, 'Yuna Kisaragi');
  const asset = getCharacterVisualAsset('yunaKisaragi', 'normal');
  assert.match(asset.path, /Characters\/Central\/yuna_kisaragi_normal\.png$/);
  assert.match(scene, /this\.activeLocationId === 'oshiageCustomWorks'/);
  assert.match(scene, /\['paint', 'rims'\]\.includes\(this\.room\)/);
  assert.match(scene, /getCharacterVisualAsset\(\s*CENTRAL_TOKYO_CHARACTER_IDS\.autoMarket\.wheels, 'normal'/);
  const yunaCalls = scene.match(/this\.drawCustomWorksSpecialist\(\{/g) || [];
  assert.equal(yunaCalls.length, 2);
});

test('paint showroom car is 70% of earlier width and a little higher', () => {
  assert.match(scene, /this\.paintObjects = this\.drawOwnedCar\(\s*car, state, 609, 345, 483, this\.pendingPaint/);
  assert.equal(483 / 690, .7);
  assert.match(scene, /rollPaintCarIn\(\)/);
});

test('rim descriptions omit dimensions and the manual preview button', () => {
  const start = scene.indexOf('  drawRimShop() {');
  const end = scene.indexOf('  selectRim(index) {', start);
  const shop = scene.slice(start, end);
  assert.ok(start > 0 && end > start);
  assert.doesNotMatch(shop, /384\s*[×x]\s*384/);
  assert.doesNotMatch(shop, /PREVIEW ON CAR/);
  assert.match(shop, /BACK TO RIM WALL/);
  assert.match(shop, /OWNED \/\/ FREE TO INSTALL/);
  assert.match(shop, /this\.drawCustomWorksSpecialist/);
});

test('rim preview rolls in on first selection, not on each swap', () => {
  const start = scene.indexOf('  selectRim(index) {');
  const end = scene.indexOf('  confirmRimTransaction(', start);
  const method = scene.slice(start, end);
  assert.match(method, /const shouldRollIn = !this\.rimPreview/);
  assert.match(method, /this\.renderView\(\)/);
  assert.match(method, /if \(shouldRollIn\) this\.rollRimCarIn\(\)/);
  assert.match(scene, /this\.rimPreview = false;\s*this\.rimCarObjects = \[\];\s*this\.renderView\(\)/);
});

test('physical wheel rotation tracks horizontal translation on one tween', () => {
  const start = scene.indexOf('  animateShopCarEntry(');
  const end = scene.indexOf('  rollRimCarIn()', start);
  assert.ok(start > 0 && end > start);
  const body = scene.slice(start, end);
  const Extracted = new Function('return class DummyScene {\n' + body + '\n}')();
  const dummy = new Extracted();
  let tween;
  let rerenders = 0;
  dummy.paintBusy = false;
  dummy.entryTween = null;
  dummy.tweens = { add: config => {
    tween = config;
    return { stop: () => { throw Error('should not interrupt test tween'); } };
  } };
  dummy.sys = { isActive: () => true };
  dummy.renderView = () => { rerenders += 1; };
  const wheel = { angle: 0, setAngle(v) { this.angle = v; } };
  const pieces = [{ x: 100 }, { x: 160 }, { x: 180 }];
  pieces.rollingWheels = [{ sprite: wheel, radius: 25 }];
  dummy.animateShopCarEntry(pieces, { duration: 4000, distance: 900 });
  assert.equal(dummy.paintBusy, true);
  assert.equal(tween.duration, 4000);
  assert.equal(tween.ease, 'Sine.easeInOut');
  assert.deepEqual(pieces.map(p => p.x), [-800, -740, -720]);
  tween.targets.travel = 450;
  tween.onUpdate();
  assert.deepEqual(pieces.map(p => p.x), [-350, -290, -270]);
  assert.ok(Math.abs(wheel.angle - 450 / 25 * (180 / Math.PI)) < .001);
  tween.targets.travel = 900;
  tween.onUpdate();
  assert.deepEqual(pieces.map(p => p.x), [100, 160, 180]);
  assert.ok(Math.abs(wheel.angle - 900 / 25 * (180 / Math.PI)) < .001);
  tween.onComplete();
  assert.equal(dummy.paintBusy, false);
  assert.equal(dummy.entryTween, null);
  assert.equal(rerenders, 1);
});

test('rotating tyre textures are tracked separately from static body layers', () => {
  assert.match(scene, /rollingWheels\.push\(\{/);
  assert.match(scene, /sprite: wheelSprite/);
  assert.match(scene, /objects\.rollingWheels = rollingWheels/);
  assert.match(scene, /wheel\.sprite\.setAngle\(degrees\)/);
  assert.match(scene, /for \(const entry of originX\)/);
  assert.match(scene, /this\.rollPaintCarIn\(\)/);
  assert.match(scene, /this\.animateShopCarEntry\(this\.rimCarObjects/);
  assert.match(scene, /this\.animateShopCarEntry\(this\.paintObjects/);
});
