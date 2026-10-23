import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isGinzaLoanActive, canVisitDuringGinzaLoan,
  canUseTunerDuringGinzaLoan, ginzaRoomDuringLoan, GINZA_LOAN_BLOCK_LABEL,
} from '../src/data/ginzaLoanAccess.js';
import { TRAVEL_REGIONS } from '../src/data/travelRegions.js';
import { ginzaConversation } from '../src/data/ginzaScenes.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const registry = (carId = 'ginzaDemo_calsonicR390') =>
  ({ get: key => key === 'ginzaTestDrive' ? { carId } : undefined });

test('collector loan allows Ginza and all street meets, blocks every disallowed destination', () => {
  const borrowed = registry();
  const normal = { get: () => null };
  assert.ok(isGinzaLoanActive(borrowed));
  assert.ok(!isGinzaLoanActive(normal));
  assert.equal(GINZA_LOAN_BLOCK_LABEL, 'GINZA LOAN // RETURN CAR FIRST');
  assert.equal(canUseTunerDuringGinzaLoan(borrowed), false);
  assert.equal(canUseTunerDuringGinzaLoan(normal), true);
  assert.equal(ginzaRoomDuringLoan(borrowed, 1), 3);
  assert.equal(ginzaRoomDuringLoan(normal, 2), 2);
  const denied = [
    'tokyoDragComplex', 'tokyoAutoMarket',
    'oshiageDrivingSchool', 'oshiageCustomWorks',
    'shinonomeWorkshop', 'shinonomeCanalYard',
    'shinonomeWarehouseStrip',
  ];
  denied.forEach(id => assert.equal(canVisitDuringGinzaLoan(borrowed, id), false, id));
  assert.equal(canVisitDuringGinzaLoan(borrowed, 'ginzaMotorGallery'), true);
  assert.equal(canVisitDuringGinzaLoan(borrowed, 'oshiageSkytreeMeet'), true);
  Object.values(TRAVEL_REGIONS).forEach(region => region.locations.forEach(location => {
    assert.equal(canVisitDuringGinzaLoan(normal, location.id), true, location.id);
    if (denied.includes(location.id)) return;
    assert.equal(canVisitDuringGinzaLoan(borrowed, location.id), true, location.id);
  }));
  assert.equal(isGinzaLoanActive({ ginzaTestDrive: { carId:'r32' } }), false);
});

test('map greys and disables blocked locations and tuner shop across all callers', () => {
  const map = source('src/ui/TravelMap.js');
  assert.match(map, /const ginzaLoanBlocked = location =>/);
  assert.match(map, /if \(!location \|\| ginzaLoanBlocked\(location\)\) return false/);
  assert.match(map, /if \(ginzaLoanBlocked\(location\)\) \{/);
  assert.match(map, /row\.meta\.setText\(GINZA_LOAN_BLOCK_LABEL\)/);
  assert.match(map, /if \(!ginzaLoanBlocked\(item\) &&/);
  assert.match(map, /if \(loanTunerBlocked\) \{/);
  assert.match(map, /tunerBadge\.disableInteractive\(\)/);
  for (const file of ['CentralTokyoScene', 'MeetScene', 'OshiageScene']) {
    const code = source('src/scenes/' + file + '.js');
    assert.ok(code.includes('canVisitDuringGinzaLoan(this.registry, locationId)'), file);
    assert.ok(code.includes('isGinzaLoanActive(this.registry)'), file);
  }
});

test('vault stays locked during loan, shows correct vehicle and ends only on cutscene completion', () => {
  const scene = source('src/scenes/CentralTokyoScene.js');
  assert.match(scene, /this\.ginzaRoom = ginzaRoomDuringLoan\(this\.registry, data\?\.ginzaRoom \|\| 1\)/);
  assert.match(scene, /this\.ginzaVaultIndex = loanIndex < 0 \? 0 : loanIndex/);
  assert.match(scene, /if \(isGinzaLoanActive\(this\.registry\)\) this\.ginzaRoom = 3/);
  assert.match(scene, /enterGinzaRoom\(room\) \{\s*if \(isGinzaLoanActive\(this\.registry\)\) return;/);
  assert.match(scene, /RETURN LOAN TO LEAVE VAULT/);
  assert.match(scene, /MOTOR GALLERY \/\/ LOCKED/);
  assert.match(scene, /PRESTIGE SALON \/\/ LOCKED/);
  assert.match(scene, /const owner = isNamedArkonDen\(this\.registry\)/);
  assert.match(scene, /this\.ginzaScene\(owner \? 'vaultReturnArkon' : 'vaultReturn', \{\}, \(\) => \{/);
  assert.match(scene, /this\.endGinzaTestDrive\(false\);\s*this\.ginzaRoom = 1;/);
  assert.match(scene, /this\.registry\.set\('selectedCarId', restore\)/);
  assert.match(scene, /this\.registry\.set\('ginzaTestDrive', null\)/);
  assert.doesNotMatch(scene.slice(scene.indexOf('  drawDragComplex() {'),scene.indexOf('  drawDragSide(',scene.indexOf('  drawDragComplex() {'))), /feetJitter|migratedRivals/);
});

test('the return cutscene uses matching evening outfits for Sayaka and Arkon', () => {
  const owner = ginzaConversation('vaultReturnArkon');
  const regular = ginzaConversation('vaultReturn');
  assert.equal(owner.characters.left, 'sayakaFujieda');
  assert.equal(owner.characters.right, 'arkonDen');
  assert.equal(owner.pages.length, 5);
  assert.deepEqual(owner.pages.map(p => p.speaker), ['left','right','left','right','left']);
  owner.pages.forEach(page => {
    assert.equal(page.leftPose, 'ginzaDress');
    assert.equal(page.rightPose, 'ginzaSuit');
  });
  assert.ok(regular.pages.length >= 2);
  assert.match(ginzaConversation('vaultDrive').pages.map(p=>p.text).join(' '), /street meets/i);
});

test('race dialogue uses the left reading zone with a right-aligned Aruken portrait', () => {
  const hud = source('src/ui/GinzaBanterHud.js');
  const layout = source('src/ui/CompactDialogueLayout.js');
  assert.match(hud, /GINZA_CHAT_LAYOUT = COMPACT_DIALOGUE_LAYOUTS/);
  assert.match(layout, /COMPACT_DIALOGUE_SHIFT_X = 150/);
  assert.match(layout, /textWidth: 486/);
  assert.match(hud, /const right = create\('ARUKEN', arkonVisual, arkonKey, 'right'/);
});
