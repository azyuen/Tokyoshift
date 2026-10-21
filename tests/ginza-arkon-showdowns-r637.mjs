import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { ginzaConversation } from '../src/data/ginzaScenes.js';
import { canVisitDuringGinzaLoan } from '../src/data/ginzaLoanAccess.js';
import { getOshiageShowdownAccess } from '../src/data/oshiageShowdown.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Ginza loans can visit normal meets and Skytree while service hubs stay locked', () => {
  const loan = { get: key => key === 'ginzaTestDrive' ? { carId: 'ginzaDemo_calsonicR390' } : null };
  for (const id of ['odaiba7eleven', 'shibuyaCenterGai',
    'yokohamaRedBrick', 'oshiageSkytreeMeet', 'ginzaMotorGallery']) {
    assert.equal(canVisitDuringGinzaLoan(loan, id), true, id);
  }
  for (const id of ['tokyoDragComplex', 'tokyoAutoMarket', 'oshiageCustomWorks',
    'oshiageDrivingSchool', 'shinonomeWorkshop']) {
    assert.equal(canVisitDuringGinzaLoan(loan, id), false, id);
  }
});

test('normal Meet showdowns accept loan cars, without enabling pink slips or regional crew races', () => {
  const meet = source('src/scenes/MeetScene.js');
  const initial = meet.slice(meet.indexOf('const competitionUnlocked ='), meet.indexOf('const buttons ='));
  const refresh = meet.slice(meet.indexOf('updateCompetitionCooldownButton() {'), meet.indexOf('chooseCompetitionCharacter(', meet.indexOf('updateCompetitionCooldownButton() {')));
  assert.doesNotMatch(initial, /ginzaDemo/);
  assert.doesNotMatch(refresh, /ginzaDemo/);
  assert.match(meet, /if \(!isGinzaLoanActive\(this\.registry\) &&\s*!carMatchesCompetitionRestriction/);
  assert.match(meet, /startCompetition\(offer\) \{/);
  assert.match(meet, /GALLERY LOAN \/\/ NO PINKS/);
  assert.match(meet, /if \(this\.isCrewTestDriveMode\(\) \|\| !this\.hasCar \|\|\s*cars\[this\.registry\.get\('selectedCarId'\)\]\?\.ginzaDemo\) return;/);
});

test('Ginza loan race preserves COMPETITION and OSHIAGE_ELITE for real payouts and three heats', () => {
  const race = source('src/scenes/RaceScene.js');
  assert.match(race, /if \(!\['COMPETITION', 'OSHIAGE_ELITE'\]\.includes\(this\.raceMode\)\) \{/);
  assert.match(race, /this\.raceMode === 'COMPETITION' && competitionState\?\.active/);
  assert.match(race, /this\.raceMode === 'OSHIAGE_ELITE'/);
  assert.match(race, /competitionContinues/);
  assert.match(race, /oshiageEliteContinues/);
});

test('Skytree elite eligibility still works for an owned temporary collector loan', () => {
  const data = source('src/data/oshiageShowdown.js');
  assert.match(data, /const car = cars\[id\] \|\| cars\[getBaseCarId\(id\)\]/);
  assert.match(data, /if \(!car \|\| !\(\(read\(source, 'ownedCarIds', \[\]\) \|\| \[\]\)\.includes\(id\)\) \|\| car\.crewLoan\)/);
  assert.doesNotMatch(data, /ginzaDemo/);
});

test('Arkon departure gets evening dress and suit dialogue while ordinary players keep default', () => {
  const scene = source('src/scenes/CentralTokyoScene.js');
  assert.match(scene, /isNamedArkonDen\(this\.registry\) \? 'vaultDriveArkon' : 'vaultDrive'/);
  const owner = ginzaConversation('vaultDriveArkon');
  const standard = ginzaConversation('vaultDrive');
  assert.equal(owner.characters.left, 'sayakaFujieda');
  assert.equal(owner.characters.right, 'arkonDen');
  assert.equal(owner.pages.length, 5);
  assert.deepEqual(owner.pages.map(p => p.speaker), ['left','right','left','right','left']);
  owner.pages.forEach(p => {
    assert.equal(p.leftPose, 'ginzaDress');
    assert.equal(p.rightPose, 'ginzaSuit');
  });
  assert.ok(standard.pages.length > 0);
  assert.ok(existsSync('assets/Characters/Main/arkon_den_suit.png'));
  assert.ok(existsSync('assets/Characters/Main/ginza_sayaka_fujieda_dress.png'));
});

test('Arkon race results show suit foreground and opposite Sayaka reaction in same player frame', () => {
  const race = source('src/scenes/RaceScene.js');
  assert.match(race, /this\.showArkonResultPair = isNamedArkonDen\(this\.registry\) &&/);
  assert.match(race, /this\.playerCharacterId === storedPlayerCharacterId/);
  assert.match(race, /\['arkonDen', 'ginzaSuit'\]/);
  assert.match(race, /\['sayakaFujieda', 'devScowl'\]/);
  assert.match(race, /\['sayakaFujieda', 'ginzaHappy'\]/);
  assert.match(race, /pose: playerWon \? 'devScowl' : 'ginzaHappy'/);
  assert.match(race, /pose: pairedArkonResult \? 'ginzaSuit'/);
  assert.match(race, /sayakaReactionProfile\?\.image\?\.setMask\(playerMask\)/);
  assert.match(race, /const sayakaReactionImage = sayakaReactionProfile\?\.image/);
  assert.match(race, /targets: sayakaReactionImage/);
  assert.ok(existsSync('assets/Characters/Dev/sayaka_fujieda_scowl.png'));
  assert.ok(existsSync('assets/Characters/Main/ginza_sayaka_fujieda_happy.png'));
});
