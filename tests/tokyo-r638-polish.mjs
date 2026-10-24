import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  isArkonName, isEthanName, validArkonCreationPin,
  grantEthanCompensationOnce, ethanCompensationCutscene,
  ETHAN_GIFT_SAVE_KEY, ETHAN_GIFT_PENDING_KEY,
} from '../src/data/specialProfileRewards.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
function registry(seed) {
  const store = new Map(Object.entries(seed));
  return { get: key => store.get(key), set: (key, val) => store.set(key, val) };
}

test('only exact Arkon Den creation requires the four-digit owner PIN', () => {
  assert.ok(isArkonName('Arkon','Den'));
  assert.ok(isArkonName('ARKON ',' den'));
  assert.ok(!isArkonName('Arkon','Denny'));
  assert.equal(validArkonCreationPin('Arkon','Den','1985'), true);
  for (const pin of ['', '985', '11985', '1986', 'abcd', '1985x'])
    assert.equal(validArkonCreationPin('Arkon','Den',pin), false);
  assert.equal(validArkonCreationPin('Ethan','Yuen',''), true);
  const creator = source('src/scenes/CharacterSelectScene.js');
  const html = source('index.html');
  assert.match(creator, /validArkonCreationPin\(firstName, lastName/);
  assert.match(creator, /ARKON DEN \/\/ ENTER THE CORRECT 4-DIGIT PIN/);
  assert.match(creator, /pinRow\.hidden = !needed/);
  assert.match(html, /id="arkonCreationPin"/);
  assert.match(html, /type="password"/);
  assert.match(html, /inputmode="numeric"/);
});

test('Ethan compensation is additive, profile-specific, exactly once, and survives dialogue interruption', () => {
  assert.ok(isEthanName('Ethan', 'Yuen'));
  assert.ok(!isEthanName('Ethan', 'Yu'));
  const ethan = registry({ firstName:'Ethan', lastName:'Yuen', cash: 12500 });
  assert.equal(grantEthanCompensationOnce(ethan), true);
  assert.equal(ethan.get('cash'), 2012500);
  assert.equal(ethan.get(ETHAN_GIFT_SAVE_KEY), true);
  assert.equal(ethan.get(ETHAN_GIFT_PENDING_KEY), true);
  assert.equal(grantEthanCompensationOnce(ethan), false);
  assert.equal(ethan.get('cash'), 2012500);
  const another = registry({ firstName:'Other', lastName:'Driver', cash:5000 });
  assert.equal(grantEthanCompensationOnce(another), false);
  assert.equal(another.get('cash'), 5000);
  const pages = ethanCompensationCutscene().pages;
  assert.match(pages[0].text, /cheated out of a car/);
  assert.match(pages[0].text, /feeling generous/);
  assert.match(pages[1].text, /2,000,000/);
  const state = source('src/state/GameState.js');
  assert.match(state, /ethanYuenCompensationR638: Boolean\(input\.ethanYuenCompensationR638\)/);
  assert.match(state, /ethanYuenCompensationR638: Boolean\(registry\.get\('ethanYuenCompensationR638'\)\)/);
  const garage = source('src/scenes/GarageScene.js');
  assert.match(garage, /if \(grantEthanCompensationOnce\(this\.registry\)\) saveSessionState/);
  assert.match(garage, /this\.registry\.set\(ETHAN_GIFT_PENDING_KEY, false\)/);
  assert.match(garage, /playMangaCutscene\(this, ethanCompensationCutscene\(\)/);
});

test('only tuner LOCKED remains, no overlapping loan warning copies', () => {
  const map = source('src/ui/TravelMap.js');
  const block = map.slice(map.indexOf('if (loanTunerBlocked) {'),map.indexOf('} else if (tunerUnlocked)'));
  assert.match(block, /TUNER SHOP \/\/ LOCKED/);
  assert.match(block, /tunerName\.setText\(''\)/);
  assert.match(block, /tunerSpecialty\.setText\(''\)/);
  assert.doesNotMatch(block, /Return the collector car to Ginza/);
});

test('Skytree respects ONLY the active loan, including second and third elite heats', () => {
  const oshiage = source('src/data/oshiageShowdown.js');
  assert.match(oshiage, /const isActiveGalleryLoan = isGinzaLoanActive\(source\)/);
  assert.match(oshiage, /read\(source, 'ginzaTestDrive'\)\?\.carId === id && car\?\.ginzaDemo/);
  assert.match(oshiage, /const exactLoan = isGinzaLoanActive\(registry\)/);
  assert.match(oshiage, /!exactLoan &&/);
});

test('all Drag Strip background rivals are gone, while venue staff remain', () => {
  const central = source('src/scenes/CentralTokyoScene.js');
  const draw = central.slice(central.indexOf('  drawDragComplex() {'),central.indexOf('  drawDragSide(',central.indexOf('  drawDragComplex() {')));
  assert.doesNotMatch(draw, /getConqueredMainRivalIds|migratedRivals|genericRivals|feetJitter/);
  assert.match(draw, /const dragStaff = CENTRAL_TOKYO_CHARACTER_IDS\.dragComplex/);
});

test('Arkon portraits move right and react correctly; Ginza manga flips toward Sayaka', () => {
  const race = source('src/scenes/RaceScene.js');
  assert.match(race, /pose: playerWon \? 'devScowl' : 'devLaughing'/);
  assert.match(race, /x: 1224, y: 262/);
  assert.match(race, /playerWon \? 'devLaughing' : 'devSerious'/);
  assert.match(race, /x: pairedArkonResult \? 1420 : 1310/);
  assert.ok(existsSync('assets/Characters/Dev/sayaka_fujieda_laughing.png'));
  const manga = source('src/ui/MangaCutscene.js');
  assert.match(manga, /ginzaArkonFaceSayaka = side === 'right' && characterId === 'arkonDen'/);
  assert.match(manga, /flipInward: !ginzaArkonFaceSayaka/);
  assert.match(manga, /flipInward: !actor\?\.ginzaArkonFaceSayaka/);
});
