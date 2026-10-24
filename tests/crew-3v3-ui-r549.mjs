import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const meet = read('src/scenes/MeetScene.js');
const race = read('src/scenes/RaceScene.js');

test('crew briefing uses the lower-right street quadrant, not the skyline', () => {
  const start = meet.indexOf('  showCrewBattleLineup(regionId) {');
  const end = meet.indexOf('  startCrewBattle(regionId, lineup, rounds = null) {', start);
  const ui = meet.slice(start, end);
  assert(start > 0 && end > start);
  assert.match(ui, /headerShape\(806, 446, 724, 294, 0x06121f/);
  assert.match(ui, /text\(830, 459, 'BATTLE BRIEFING/);
  assert.match(ui, /const y = 504 \+ i \* 70;/);
  assert.match(ui, /SCOUT:/);
  assert.doesNotMatch(ui, /headerShape\(54, 202, 698, 188/);
  const panelBottom = 446 + 294;
  const buttonsTop = 779 - 49 / 2;
  assert(panelBottom < buttonsTop, 'briefing must leave a gap above actions');
  assert(806 + 724 < 1560, 'briefing must fit the game width');
});

test('player cars shift left, rival portraits and both crew titles shift right', () => {
  const start = meet.indexOf('  showCrewBattleLineup(regionId) {');
  const end = meet.indexOf('  startCrewBattle(regionId, lineup, rounds = null) {', start);
  const ui = meet.slice(start, end);
  assert.match(ui, /sideFrame\(24, 399, 730, 405, 0x35d6ff, 'YOUR CREW', 18\)/);
  assert.match(ui, /sideFrame\(798, 28, 728, 408, 0xff477e, 'RIVAL CREW', 18\)/);
  assert.match(ui, /const xPlayer = \[63, 292, 521\]/);
  assert.match(ui, /const xRival = \[835, 1064, 1293\]/);
  assert.match(ui, /const carX = x - \(rival \? 26 : 30\)/);
  assert.match(ui, /this\.add\.text\(carX \+ 105, y \+ 199, carName/);
  // Original rival boxes were [821,1050,1279]-12. They must NOT move.
  const previousRivalCars = [821,1050,1279].map(x => x-12);
  const newRivalCars = [835,1064,1293].map(x => x-26);
  assert.deepEqual(newRivalCars, previousRivalCars);
  // Original blue boxes [63,292,521]-18; shift 12px left.
  assert.deepEqual([63,292,521].map(x => x-30), [63,292,521].map(x => x-18-12));
});

test('crew victory gets unique bottom-right stamp after complete battle only', () => {
  assert(existsSync(new URL('../assets/Garage/badge_crew.png',import.meta.url)));
  assert.match(race,/queueImage\('regionalCrewVictoryBadge', 'assets\/Garage\/badge_crew\.png'\)/);
  assert.match(race,/const crewBadgeWon = Boolean\(settlement\?\.crewBattleCompleted\)/);
  assert.match(race,/this\.add\.image\(1450, 582, 'regionalCrewVictoryBadge'\)/);
  assert.match(race,/settlement\.crewBattleFirstClear \? 'CREW BADGE EARNED' : 'CREW BADGE'/);
  assert.match(race,/targets: crewBadge,[\s\S]*?ease: 'Back\.Out'/);
  assert.match(race,/showCrewCaptainFinale\(settlement, returnScene\)/);
  assert.match(race,/createCrewBattleCaptainResult\([\s\S]*?settlement\?\.crewBattleCompleted/);
});
