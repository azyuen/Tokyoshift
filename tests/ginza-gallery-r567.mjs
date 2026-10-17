import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const scene = read('src/scenes/CentralTokyoScene.js');
const manga = read('src/ui/MangaCutscene.js');
const segment = (from, to) => {
  const start = scene.indexOf(from);
  const end = scene.indexOf(to, start + from.length);
  assert.ok(start >= 0 && end > start, from + ' present in scene');
  return scene.slice(start, end);
};
const gallery = segment('  drawGinza() {', '  drawGinzaSide(listing) {');
const panel = segment('  drawGinzaSide(listing) {', '  showGinzaPurchase(listing, viewOnly = false) {');
const navigation = segment('  drawNavigation(title, subtitle) {', '  devRefreshCentralLocation() {');
const ownerEntry = segment('  enterGinzaRoom(room) {', '  switchGinzaVaultCar(index) {');

test('all hero cars keep raised plinth anchor and use 10% reduced width', () => {
  assert.match(gallery, /stageX, STAGE\.y \+ 309, 567, 11/);
  assert.match(gallery, /rectangle\(stageX, STAGE\.y \+ 302/);
  assert.doesNotMatch(gallery, /STAGE\.y \+ 340/);
});

test('both motor gallery shadows shift up independently of characters', () => {
  const staff = gallery.slice(gallery.indexOf('if (this.ginzaRoom === 1)'));
  assert.match(scene, /shadowOffsetY = 0/);
  assert.match(scene, /feetY - 7 \+ shadowOffsetY/);
  assert.match(staff, /emiSaionji'[\s\S]*?shadowOffsetY: -18/);
  assert.match(staff, /kaedeTachibana'[\s\S]*?shadowOffsetX: 16, shadowOffsetY: -18/);
});

test('prestige background staff both move left and face opposite direction', () => {
  const rear = gallery.slice(gallery.indexOf('if (this.ginzaRoom === 2)'),
    gallery.indexOf('// Ginza Sayaka shares'));
  assert.match(rear, /STAGE\.x \+ 775[\s\S]*?flip: true/);
  assert.match(rear, /STAGE\.x \+ 905[\s\S]*?flip: true/);
});

test('dev owner-specific vault cutscene repeats on re-entry without disrupting invite', () => {
  assert.match(ownerEntry, /if \(dev\) \{[\s\S]*?ginzaScene\('vaultOwner'/);
  assert.doesNotMatch(ownerEntry, /dev && !this\.registry\.get\('ginzaVaultOwnerWelcomed'\)/);
  assert.match(ownerEntry, /this\.registry\.set\('ginzaVaultInvited', true\)/);
  assert.match(ownerEntry, /if \(!dev && !this\.registry\.get\('ginzaVaultInvited'\)\)/);
});

test('private vault bottom three buttons select R390, GT-One, 787B; main stage clear', () => {
  assert.match(gallery, /vault \? GINZA_VAULT_CARS : roomNames/);
  assert.match(gallery, /if \(vault\) this\.switchGinzaVaultCar\(index\)/);
  assert.match(gallery, /else this\.enterGinzaRoom\(index \+ 1\)/);
  assert.match(gallery, /CARDS\.y \+ 90, 348, 112/);
  assert.doesNotMatch(gallery, /STAGE\.y \+ 43, 214, 37/);
  assert.match(panel, /back\.on\('pointerdown', \(\) => this\.enterGinzaRoom\(1\)\)/);
});

test('vault decal button higher and body text no longer overlaps test drive', () => {
  assert.match(panel, /SIDE\.y \+ 122, width, 37/);
  assert.match(panel, /const y0 = SIDE\.y \+ \(vault \? 165 : 124\)/);
  assert.match(panel, /const demoY = SIDE\.y \+ 513/);
  // Vault seal's second line is well above the top of its test-drive button.
  const sealEnd = 165 + 246 + 44;
  const demoTop = 513 - 21;
  assert.ok(sealEnd < demoTop - 15);
});

test('full-size refresh belongs in top right of stage only for Ginza', () => {
  assert.match(navigation, /STAGE\.x \+ STAGE\.w - 132/);
  assert.match(navigation, /STAGE\.y \+ 27/);
  assert.match(navigation, /ginzaRefresh \? 226 : SIDE\.w - 36/);
  assert.match(navigation, /D\) REFRESH CARS/);
  assert.match(navigation, /devButton\.on\('pointerdown'/);
});

test('Ginza dialogue loads only scripted portraits and eagerly loads player idle', () => {
  const ginzaScene = segment('  ginzaScene(kind, args = {}, onComplete = null) {',
    '  enterGinzaRoom(room) {');
  assert.match(ginzaScene, /preloadPagePosesOnly: true/);
  assert.match(scene, /queueCharacterPose\(driverId, 'idle'\)/);
  assert.match(manga, /if \(context\?\.options\?\.preloadPagePosesOnly\)/);
  assert.match(scene, /queueCharacterPose\(who, pose\)/);
});
