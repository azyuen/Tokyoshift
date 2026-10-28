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
import { getCrewCount, getCrewMembers, buildRegionalCrewBattleRounds } from '../src/data/crewSystem.js';
import {
  getTunerTeamChallengeState, buildTunerTeamChallengeRounds,
} from '../src/data/tunerChallenges.js';
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
  assert.equal(REGIONAL_CREW_ROSTERS.SHINAGAWA.members.find(m => m.characterId === 'reikaTachibana')?.baseCarId, 'fc3s');
  assert.ok(Math.abs(characters.sayakaFujieda.age - characters.reikaTachibana.age) <= 5);
});

test('Reika and Sayaka use the already uploaded, distinct sprite sets', () => {
  for (const pose of ['idle', 'win', 'loss']) {
    const reikaAsset = getCharacterVisualAsset('reikaTachibana', pose);
    assert.match(reikaAsset.path, new RegExp('assets/Characters/Shinagawa/reika_tachibana_' + pose + '\\.png$'));
    assert.ok(readFileSync(reikaAsset.path).byteLength > 0);
  }
  for (const [pose, location] of [['homeNormal', 'Main'], ['normal', 'Main'], ['track', 'Main']]) {
    const asset = getCharacterVisualAsset('sayakaFujieda', pose);
    assert.ok(asset.path.includes('assets/Characters/' + location + '/'));
    assert.ok(readFileSync(asset.path).byteLength > 0);
  }
});

test('Sayaka starts as family friend then becomes Ginza curator then pro strategist', () => {
  const opening = CUTSCENES.openingSayakaKeys;
  assert.equal(opening.characters.left, 'sayakaFujieda');
  assert.match(opening.pages[0].text, /Your parents say you never stop talking about cars/i);
  assert.match(opening.pages[1].text, /finally got my own car/i);
  assert.doesNotMatch(opening.pages.map(p => p.text).join(' '), /curat|strategist/i);
  const daichi = CUTSCENES.openingDaichiAfterSayaka;
  assert.equal(daichi.characters.left, 'daichiSakamoto');
  assert.match(daichi.pages[2].text, /plenty of potential/i);
  assert.doesNotMatch(daichi.pages.map(p=>p.text).join(' '), /ex-pro driver|racing father/i);
  assert.match(daichi.pages.map(p=>p.text).join(' '), /Sayaka said some friends helped get it ready/i);
  assert.doesNotMatch(daichi.pages.map(p=>p.text).join(' '), /curat|strategist|Aruken|Denzaki/i);

  const ginza = CUTSCENES.ginzaInvitation;
  assert.match(ginza.pages.map(p => p.text).join(' '), /curate and manage/i);
  assert.doesNotMatch(ginza.pages.map(p => p.text).join(' '), /strategist/i);

  const pro = CUTSCENES.proCircuitStrategistReveal;
  assert.equal(pro.once, true);
  assert.ok(getCutsceneIds().includes('proCircuitStrategistReveal'));
  assert.equal(pro.characters.left, 'sayakaFujieda');
  assert.match(pro.pages.map(p => p.text).join(' '), /helping drivers and engineers with strategy/i);
  assert.doesNotMatch(pro.pages.map(p=>p.text).join(' '), /Aruken|Denzaki|father.{0,30}strategist/i);
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

test('fresh Shinagawa regional and crew events never field Sayaka', () => {
  const regional = buildTunerTeamChallengeRounds('SHINAGAWA');
  assert.equal(regional.length, 7);
  assert.ok(regional.some(r => r.characterId === 'reikaTachibana' && r.carId === 'fc3s'));
  assert.equal(regional.some(r => r.characterId === 'sayakaFujieda'), false);
  // Crew builder uses the full vehicle-performance estimator. Provide the
  // minimal Phaser math surface that the browser supplies at runtime.
  globalThis.Phaser ??= {};
  globalThis.Phaser.Math ??= {
    Clamp: (v,min,max) => Math.max(min,Math.min(max,v)),
    Linear: (a,b,t) => a+(b-a)*t,
  };
  const crew = buildRegionalCrewBattleRounds('SHINAGAWA');
  assert.equal(crew.length, 3);
  assert.ok(crew.every(round => round.characterId !== 'sayakaFujieda'));
  assert.ok(crew.every(round => getRivalCharacterOrderForRegion('SHINAGAWA').includes(round.characterId)));
  const reika = getCharacterVisualAsset('reikaTachibana', 'idle');
  assert.equal(reika.path, 'assets/Characters/Shinagawa/reika_tachibana_idle.png');
});

test('saved regional Sayaka round migrates to Reika while retaining championship progress', () => {
  const state = createDefaultGameState();
  state.cash = 188800;
  state.tunerTeamChallenges.SHINAGAWA = {
    activeSession: true, firstAttemptStarted: true, stage: 5,
    championEarned: false, perfectEarned: false,
    rounds: [
      ...buildTunerTeamChallengeRounds('SHINAGAWA').slice(0, 5),
      { stageIndex: 5, regionId: 'SHINAGAWA',
        characterId: 'sayakaFujieda', carId: 'rx8', encounterRating: 3,
        opponentBuildState: { buildArchetype: 'obsolete', tuning: { engine: 1 } },
      },
      buildTunerTeamChallengeRounds('SHINAGAWA')[6],
    ],
  };
  const restored = normaliseState(state);
  const challenge = getTunerTeamChallengeState(restored, 'SHINAGAWA');
  assert.equal(challenge.stage, 5);
  assert.equal(challenge.activeSession, true);
  assert.equal(challenge.rounds[5].characterId, 'reikaTachibana');
  assert.equal(challenge.rounds[5].carId, 'fc3s');
  assert.equal(restored.cash, 188800);
  // The scene rebuilds a legacy roster's performance state from the current
  // authored opponent/car mapping instead of reusing an old RX-8 tune.
  const meet = readFileSync('src/scenes/MeetScene.js','utf8');
  assert.match(meet,/savedRounds\.some\(round =>[\s\S]*?round\?\.characterId === 'sayakaFujieda'/);
  assert.match(meet,/if \(oldShinagawaDriver\) return generated/);
});

test('legacy Shinagawa crew battle snapshot replaces Sayaka without resetting heats', () => {
  const save = createDefaultGameState();
  save.crewBattleState = {
    active: true, regionId: 'SHINAGAWA', roundIndex: 1,
    playerWins: 1, opponentWins: 0,
    rounds: [
      { characterId: 'akiraShimizu', carId: 'ek9' },
      { characterId: 'sayakaFujieda', carId: 'rx8', opponentBuildState: { tuning: { engine: 2 } } },
      { characterId: 'natsumiKagawa', carId: 'familia' },
    ],
    lineup: [
      { id: 'SHINAGAWA', regionId: 'SHINAGAWA', characterId: 'sayakaFujieda', carId: 'crew__sayakaFujieda' },
      { id: 'ODAIBA', regionId: 'ODAIBA', characterId: 'aoiShindou', carId: 'crew__aoiShindou' },
      { id: 'SHINJUKU', regionId: 'SHINJUKU', characterId: 'emiSaionji', carId: 'crew__emiSaionji' },
    ],
  };
  const restored = normaliseState(save).crewBattleState;
  assert.equal(restored.roundIndex, 1);
  assert.equal(restored.playerWins, 1);
  assert.equal(restored.opponentWins, 0);
  assert.equal(restored.rounds[1].characterId, 'reikaTachibana');
  assert.equal(restored.rounds[1].carId, 'rx8'); // underway heat retains hardware
  assert.equal(restored.rounds[1].opponentBuildState.tuning.engine, 2);
  assert.equal(restored.lineup[0].characterId, 'reikaTachibana');
  assert.equal(restored.lineup[0].carId, 'crew__reikaTachibana');
  assert.equal(restored.lineup[1].characterId, 'aoiShindou');
});

test('Shinagawa migration does not replace Sayaka in story scenes or other events', () => {
  const original = createDefaultGameState();
  original.crewBattleState = {
    active: true, regionId: 'ODAIBA', playerWins: 0, opponentWins: 1,
    rounds: [{ characterId: 'sayakaFujieda', carId: 'rx8' }],
    lineup: [{ regionId: 'ODAIBA', characterId: 'sayakaFujieda', carId: 'rx8' }],
  };
  const restored = normaliseState(original);
  assert.equal(restored.crewBattleState.rounds[0].characterId, 'sayakaFujieda');
  assert.equal(restored.crewBattleState.lineup[0].characterId, 'sayakaFujieda');
  assert.equal(CUTSCENES.openingSayakaKeys.characters.left, 'sayakaFujieda');
});

test('an already running Shinagawa race remaps the opponent and preserves Story Mode Sayaka', () => {
  const race = readFileSync('src/scenes/RaceScene.js','utf8');
  assert.match(race,/\['TUNER_TEAM', 'CREW_BATTLE'\]\.includes\(this\.registry\.get\('selectedRaceCategory'\)\)/);
  assert.match(race,/storedOpponentCharacterId === 'sayakaFujieda'/);
  assert.match(race,/storedOpponentCharacterId = 'reikaTachibana'/);
  assert.match(race,/this\.registry\.set\('selectedOpponentCharacterId', storedOpponentCharacterId\)/);
});
