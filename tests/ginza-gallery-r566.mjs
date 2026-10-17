import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/scenes/CentralTokyoScene.js', import.meta.url), 'utf8');
const sceneBlock = (start, end) => {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'scene block present: ' + start);
  return source.slice(a, b);
};
const gallery = sceneBlock('  drawGinza() {', '  drawGinzaSide(listing) {');
const side = sceneBlock('  drawGinzaSide(listing) {', '  showGinzaPurchase(listing, viewOnly = false) {');
const navigation = sceneBlock('  drawNavigation(title, subtitle) {', '  devRefreshCentralLocation() {');

test('one unchanged-width car uses the same left-and-up plinth anchor in all three rooms', () => {
  assert.match(gallery, /const stageX = STAGE\.x \+ STAGE\.w \* 0\.54/);
  assert.match(gallery, /stageX, STAGE\.y \+ 340, 630, 11/);
  assert.match(gallery, /rectangle\(stageX, STAGE\.y \+ 333/);
  assert.doesNotMatch(gallery, /STAGE\.w \* \(this\.ginzaRoom === 1/);
});

test('foreground cast match floor shadow and Kaede-sized Sayaka; background duo move left/down', () => {
  assert.match(gallery, /emiSaionji'[\s\S]*?x: STAGE\.x \+ 103, feetY: STAGE\.y \+ 510, height: 244/);
  assert.match(gallery, /kaedeTachibana'[\s\S]*?x: STAGE\.x \+ 285, feetY: STAGE\.y \+ 512, height: 245,[\s\S]*?shadowOffsetX: 16/);
  assert.match(gallery, /sayakaFujieda'[\s\S]*?x: STAGE\.x \+ 285, feetY: STAGE\.y \+ 512, height: 225/);
  assert.match(gallery, /STAGE\.x \+ 846, feetY: STAGE\.y \+ 383, height: 143/);
  assert.match(gallery, /STAGE\.x \+ 976, feetY: STAGE\.y \+ 383, height: 143/);
  assert.match(source, /shadowOffsetX = 0/);
  assert.match(source, /x \+ shadowOffsetX/);
});

test('all rooms have three large lower navigation buttons, never price or car metadata', () => {
  const bottom = gallery.slice(gallery.indexOf('// The full lower strip'), gallery.indexOf('if (this.ginzaRoom === 3) {',gallery.indexOf('// The full lower strip')));
  assert.match(bottom,/\['MOTOR GALLERY', 'PRESTIGE SALON', 'PRIVATE VAULT'\]/);
  assert.match(bottom,/CARDS\.y \+ 90, 348, 112/);
  assert.match(bottom,/this\.enterGinzaRoom\(index \+ 1\)/);
  assert.doesNotMatch(bottom,/listing\.price|car\.name|collectionLabel/);
  assert.equal((gallery.match(/CARDS\.y \+/g) || []).length, 2, 'only three-button row uses bottom card coordinates');
  assert.match(gallery,/STAGE\.y \+ 43, 214, 37/);
  assert.match(gallery,/this\.switchGinzaVaultCar\(index\)/);
});

test('side shows one large gold hero name, shifted-up unique pricing and cleaner buttons', () => {
  assert.match(side,/fontSize: '12px', color: '#f5d48b'/);
  assert.match(side,/const y0 = SIDE\.y \+ \(vault \? 205 : 145\)/);
  assert.match(side,/car\.engineModel/);
  assert.doesNotMatch(side,/listing\.collectionLabel/);
  assert.equal((side.match(/money\(listing\.price\)/g)||[]).length,1);
  assert.match(side,/'BUY THIS CAR'/);
  assert.match(side,/const buyY = SIDE\.y \+ \(vault \? 567 : 515\)/);
  assert.match(side,/GO BACK \/\/ MOTOR GALLERY/);
  assert.match(side,/back\.on\('pointerdown', \(\) => this\.enterGinzaRoom\(1\)\)/);
  assert.match(side,/this\.startGinzaTestDrive\(listing\)/);
  assert.match(side,/this\.toggleGinzaVaultStock\(\)/);
});

test('developer collector refresh lives in top-right of side pane only', () => {
  assert.match(navigation,/const ginzaRefresh = kind === 'showroom'/);
  assert.match(navigation,/const devY = SIDE\.y \+ \(ginzaRefresh \? 95 : 176\)/);
  assert.match(navigation,/const devX = ginzaRefresh \? SIDE\.x \+ SIDE\.w - 82/);
  assert.match(navigation,/ginzaRefresh \? 'D\) REFRESH'/);
  assert.match(navigation,/devButton\.on\('pointerdown', \(\) => this\.devRefreshCentralLocation\(\)\)/);
});
