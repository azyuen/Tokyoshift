import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  characters,
  rivalCharacterOrder,
  REGION_TEAM_CHARACTER_IDS,
  getRivalCharacterOrderForRegion,
  getCharacterVisualAsset,
} from '../src/data/characters.js';
import {
  REGIONAL_CREW_ROSTERS,
  isRecruitableRegionalCharacter,
  getCrewLoanCarId,
} from '../src/data/crewRoster.js';
import { getCrewCount, getCrewMembers } from '../src/data/crewSystem.js';
import { CUTSCENES, getCutsceneIds } from '../src/data/cutscenes.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';

test('Reika replaces Sayaka in all Shinagawa racing and recruitment pools', () => {
  const rivalIds = getRivalCharacterOrderForRegion('SHINAGAWA');
  const teamIds = REGION_TEAM_CHARACTER_IDS.SHINAGAWA;
  assert.ok(rivalIds.includes('reikaTachibana'));
  assert.ok(teamIds.includes('reikaTachibana'));
  assert.equal(rivalIds.includes('sayakaFujieda'), false);
  assert.equal(teamIds.includes('sayakaFujieda'), false);
  assert.equal(rivalCharacterOrder.includes('sayakaFujieda'), false);
  assert.equal(characters.sayakaFujieda.rivalEligible, false);
  assert.equal(isRecruitableRegionalCharacter('SHINAGAWA', 'sayakaFujieda'), false);
  assert.equal(isRecruitableRegionalCharacter('SHINAGAWA', 'reikaTachibana'), true);
  assert.equal(REGIONAL_CREW_ROSTERS.SHINAGAWA.members.length, 6);
  assert.equal(REGIONAL_CREW_ROSTERS.SHINAGAWA.members.find(m => m.characterId === 'reikaTachibana')?.baseCarId, 'rx8');
  assert.ok(Math.abs(characters.sayakaFujieda.age - characters.reikaTachibana.age) <= 5);
});

test('Reika and Sayaka use the already uploaded, distinct sprite sets', () => {
  for (const pose of ['idle', 'win', 'loss']) {
    const reikaAsset = getCharacterVisualAsset('reikaTachibana', pose);
    assert.match(reikaAsset.path, new RegExp('assets/Characters/Shinagawa/reika_tachibana_' + pose + '\\.png$'));
    assert.ok(readFileSync(reikaAsset.path).byteLength > 0);
  }
  for (const [pose, location] of [['homeNormal', 'Main'], ['normal', 'Central'], ['track', 'Main']]) {
    const asset = getCharacterVisualAsset('sayakaFujieda', pose);
    assert.ok(asset.path.includes('assets/Characters/' + location + '/'));
    assert.ok(readFileSync(asset.path).byteLength > 0);
  }
});

test('Sayaka starts as family friend then becomes Ginza curator then pro strategist', () => {
  const opening = CUTSCENES.openingDaichiStory;
  assert.equal(opening.pages[0].leftCharacter, 'sayakaFujieda');
  assert.equal(opening.pages[1].leftCharacter, 'sayakaFujieda');
  assert.equal(opening.pages[2].leftCharacter, 'sayakaFujieda');
  assert.equal(opening.pages[3].leftCharacter, 'daichiSakamoto');
  assert.match(opening.pages[0].text, /bring this over/i);
  assert.match(opening.pages[2].text, /go back a long way/i);
  assert.doesNotMatch(opening.pages.map(p => p.text).join(' '), /curat|strategist/i);

  const ginza = CUTSCENES.ginzaInvitation;
  assert.match(ginza.pages.map(p => p.text).join(' '), /curate and manage/i);
  assert.doesNotMatch(ginza.pages.map(p => p.text).join(' '), /strategist/i);

  const pro = CUTSCENES.proCircuitStrategistReveal;
  assert.equal(pro.once, true);
  assert.ok(getCutsceneIds().includes('proCircuitStrategistReveal'));
  assert.equal(pro.characters.left, 'sayakaFujieda');
  assert.match(pro.pages.map(p => p.text).join(' '), /racing-team strategist/i);
  assert.match(pro.pages.map(p => p.text).join(' '), /join as your team strategist/i);

  const central = readFileSync('src/scenes/CentralTokyoScene.js', 'utf8');
  assert.match(central, /hasSeenCutscene\(this\.registry, 'ginzaInvitation'\)/);
  assert.match(central, /access\.crewCount < access\.crewRequired/);
  assert.match(central, /proCircuitStrategistReveal/);
});

test('legacy Shinagawa Sayaka recruit migrates to Reika without losing car or status', () => {
  const old = createDefaultGameState();
  const oldLoanCarId = getCrewLoanCarId('sayakaFujieda');
  const newLoanCarId = getCrewLoanCarId('reikaTachibana');
  old.crewMembers.SHINAGAWA = {
    regionId: 'SHINAGAWA',
    characterId: 'sayakaFujieda',
    baseCarId: 'rx8',
    loanCarId: oldLoanCarId,
    recruitedAt: 1234,
  };
  old.ownedCarIds.push(oldLoanCarId);
  old.carStates[oldLoanCarId] = {
    acquiredVia: 'crewLoan', crewLoan: true,
    crewOwnerCharacterId: 'sayakaFujieda', crewBaseCarId: 'rx8',
    tuning: { engine: 2, ecu: 1 },
  };
  old.carGarageLocations[oldLoanCarId] = 'crewSpace';
  old.selectedCarId = oldLoanCarId;
  old.crewPreviousCarId = oldLoanCarId;
  old.crewRecruitmentState.SHINAGAWA = { lastCharacterId: 'sayakaFujieda', misses: 3 };
  old.selectedRacePlayerCharacterId = 'sayakaFujieda';
  const restored = normaliseState(old);
  assert.equal(restored.crewMembers.SHINAGAWA.characterId, 'reikaTachibana');
  assert.equal(restored.crewMembers.SHINAGAWA.recruitedAt, 1234);
  assert.equal(restored.crewMembers.SHINAGAWA.loanCarId, newLoanCarId);
  assert.ok(restored.ownedCarIds.includes(newLoanCarId));
  assert.ok(!restored.ownedCarIds.includes(oldLoanCarId));
  assert.equal(restored.carGarageLocations[newLoanCarId], 'crewSpace');
  assert.equal(restored.carStates[newLoanCarId].tuning.engine, 2);
  assert.equal(restored.carStates[newLoanCarId].crewOwnerCharacterId, 'reikaTachibana');
  assert.equal(restored.carStates[oldLoanCarId], undefined);
  assert.equal(restored.selectedCarId, newLoanCarId);
  assert.equal(restored.crewPreviousCarId, newLoanCarId);
  assert.equal(restored.crewRecruitmentState.SHINAGAWA.lastCharacterId, 'reikaTachibana');
  assert.equal(restored.selectedRacePlayerCharacterId, 'reikaTachibana');
  assert.equal(getCrewMembers(restored).SHINAGAWA.characterId, 'reikaTachibana');
  assert.equal(getCrewCount(restored), 1);
  assert.equal(restored.cash, old.cash);
  assert.equal(restored.ownedCarIds.length, old.ownedCarIds.length);
});

test('legacy Sayaka recruitment invitations are updated without changing other regions', () => {
  const old = createDefaultGameState();
  old.crewInviteInterest = { regionId: 'SHINAGAWA', characterId: 'sayakaFujieda', createdAt: 123 };
  old.crewRecruitChallenge = { regionId: 'SHINAGAWA', characterId: 'sayakaFujieda', baseCarId: 'rx8', stage: 1 };
  old.crewPendingRecruit = { regionId: 'SHINAGAWA', characterId: 'sayakaFujieda', baseCarId: 'rx8' };
  const restored = normaliseState(old);
  assert.equal(restored.crewInviteInterest.characterId, 'reikaTachibana');
  assert.equal(restored.crewRecruitChallenge.characterId, 'reikaTachibana');
  assert.equal(restored.crewPendingRecruit.characterId, 'reikaTachibana');
  assert.equal(restored.crewInviteInterest.createdAt, 123);
  const newState = createDefaultGameState();
  newState.crewMembers.SHINAGAWA = { regionId: 'SHINAGAWA', characterId: 'reikaTachibana' };
  assert.equal(normaliseState(newState).crewMembers.SHINAGAWA.characterId, 'reikaTachibana');
});
