import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  COMPACT_DIALOGUE_LAYOUTS, COMPACT_DIALOGUE_SHIFT_X, PHONE_CARD_SWIPE_DISTANCE,
} from '../src/ui/CompactDialogueLayout.js';
import {
  PHONE_DIALOGUE_LAYOUTS, RACE_DIALOGUE_THEMES, PHONE_CALL_PRESENTATION,
} from '../src/ui/RaceCoachHud.js';
import { characters, getCharacterVisualAsset } from '../src/data/characters.js';

const src = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('compact HUD and the two phone renderers use the same one-head notch-safe layout', () => {
  const compact = src('src/ui/CompactStoryDialogue.js');
  const ginza = src('src/ui/GinzaBanterHud.js');
  const phone = src('src/ui/PhoneConversation.js');
  const swipe = src('src/ui/OpeningPhonePrototype.js');
  assert.equal(COMPACT_DIALOGUE_SHIFT_X, 150);
  assert.equal(COMPACT_DIALOGUE_LAYOUTS.left.face.x, 172);
  assert.equal(COMPACT_DIALOGUE_LAYOUTS.right.face.x, 905);
  assert.ok(COMPACT_DIALOGUE_LAYOUTS.left.face.x >= 150);
  assert.ok(COMPACT_DIALOGUE_LAYOUTS.right.face.x < 1100);
  assert.ok(COMPACT_DIALOGUE_LAYOUTS.left.bubble.left - 18 >= 310);
  assert.ok(COMPACT_DIALOGUE_LAYOUTS.right.bubble.right + 18 < 1100);
  assert.deepEqual(PHONE_DIALOGUE_LAYOUTS, COMPACT_DIALOGUE_LAYOUTS);
  assert.match(compact, /const LAYOUTS = COMPACT_DIALOGUE_LAYOUTS/);
  assert.match(ginza, /const GINZA_CHAT_LAYOUT = COMPACT_DIALOGUE_LAYOUTS/);
  assert.match(phone, /PHONE_DIALOGUE_LAYOUTS\[isPlayer \? 'right' : 'left'\]/);
  assert.match(swipe, /OPENING_PHONE_DIALOGUE_LAYOUTS = PHONE_DIALOGUE_LAYOUTS/);
  assert.match(compact, /654 \+ COMPACT_DIALOGUE_SHIFT_X/);
});

test('phone maintains its blue theme, border and floating icon, with compact text size', () => {
  const standard = src('src/ui/PhoneConversation.js');
  const swipe = src('src/ui/OpeningPhonePrototype.js');
  assert.equal(RACE_DIALOGUE_THEMES.phone.border, 0x287bb5);
  assert.equal(RACE_DIALOGUE_THEMES.phone.fill, 0xe4f5ff);
  assert.ok(PHONE_CALL_PRESENTATION.iconSize >= 56);
  for (const code of [standard,swipe]) {
    assert.match(code, /theme: 'phone'/);
    assert.match(code, /phoneIconKey:/);
    assert.match(code, /setFontSize\('17px'\)\.setLineSpacing\(4\)/);
  }
});

test('phone only moves the portrait panel within the bubble, and leaves action fixed', () => {
  const swipe = src('src/ui/OpeningPhonePrototype.js');
  assert.equal(PHONE_CARD_SWIPE_DISTANCE, 125);
  assert.ok(PHONE_CARD_SWIPE_DISTANCE < 208);
  assert.doesNotMatch(swipe, /group\.setY\(400\)|y: -460/);
  assert.match(swipe, /card\.group\.setY\(PHONE_CARD_SWIPE_DISTANCE\)/);
  assert.match(swipe, /y: -PHONE_CARD_SWIPE_DISTANCE/);
  assert.match(swipe, /const group = scene\.add\.container\(0, 0,\s*\[\.\.\.hud\.objects\]\)/);
  assert.match(swipe, /\.setScrollFactor\(0\)\.setDepth\(depth \+ 10\)/);
});

test('Arkon paired result is loan-only and his owned-car win/loss uses standard assets', () => {
  const race = src('src/scenes/RaceScene.js');
  const init = race.slice(race.indexOf('this.showArkonResultPair ='),
    race.indexOf('const storedOpponentCharacterId'));
  assert.match(init, /isNamedArkonDen\(this\.registry\)/);
  assert.match(init, /this\.playerCharacterId === storedPlayerCharacterId/);
  assert.match(init, /cars\[this\.selectedCarId\]\?\.ginzaDemo/);
  assert.match(init, /this\.registry\.get\('ginzaTestDrive'\)\?\.carId === this\.selectedCarId/);
  assert.match(race, /const pairedArkonResult = this\.showArkonResultPair && this\.isGinzaDemoRace/);
  assert.match(race, /: playerWon \? 'win' : 'loss'/);
  for (const pose of ['idle','win','loss']) {
    const asset=getCharacterVisualAsset('arkonDen',pose);
    assert.ok(asset?.path && existsSync(asset.path), asset?.path);
  }
  assert.ok(characters.arkonDen.visual.poseAssets.devLaughing);
  const pro = src('src/ui/ProVictoryResults.js');
  assert.match(pro, /getCharacterVisualAsset\(id,pose,\{proCircuit:true\}\)/);
});
