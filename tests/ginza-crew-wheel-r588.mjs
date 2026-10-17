import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CREW_REGIONS, getRegionalCrewRoster,
} from '../src/data/crewRoster.js';
import {
  createCrewInviteFromMeetWin, acceptCrewInviteChallenge,
  getCrewInviteInterest, getCrewRecruitChallenge,
  getGlobalCrewRecruitmentState, resetCrewRecruitmentAfterLoss,
} from '../src/data/crewSystem.js';
import { getCrewInviteDialogue } from '../src/data/crewDialogue.js';
import { getCutscene } from '../src/data/cutscenes.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';
import { restorePreferredCar } from '../src/state/CarSelection.js';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const meet = read('src/scenes/MeetScene.js');
const race = read('src/scenes/RaceScene.js');
const ginza = read('src/scenes/CentralTokyoScene.js');
const wheels = read('src/scenes/WheelCalibrationScene.js');
const garage = read('src/scenes/GarageScene.js');
const stateSource = read('src/state/GameState.js');
const setup = (extra={}) => {
  const data = {
    devMode: false, wins: 90, losses: 0, crewMembers: {},
    tunerTeamChallenges: Object.fromEntries(
      CREW_REGIONS.map(region => [region, { championEarned: true }])
    ),
    crewRecruitmentState: {}, crewInviteInterests: {},
    crewInviteInterest: null, crewRecruitChallenges: {},
    crewRecruitChallenge: null, ownedCarIds: ['ae86'],
    selectedCarId: 'ae86', preferredCarId: 'ae86',
    ...extra,
  };
  return { get: key => data[key], set: (key,value) => { data[key]=value; }, data };
};
const win = (r, region, character, token, random=()=>0) =>
  createCrewInviteFromMeetWin(r, {
    regionId: region, characterId: character,
    locationId: region.toLowerCase() + 'Meet', winToken: token,
  }, random);

test('a lost duel clears the accepted challenge and completely resets global pity', () => {
  const roster = getRegionalCrewRoster('SHIBUYA').members;
  assert.ok(roster.length >= 2, 'alternate crew candidate exists');
  const r = setup();
  const initial = win(r, 'SHIBUYA', roster[0].characterId, 'first');
  assert.equal(initial.characterId, roster[0].characterId);
  const duel = acceptCrewInviteChallenge(r, initial);
  assert.equal(getCrewRecruitChallenge(r, 'SHIBUYA').active, true);
  resetCrewRecruitmentAfterLoss(r, duel);
  assert.equal(getCrewRecruitChallenge(r, 'SHIBUYA'), null);
  assert.equal(getCrewInviteInterest(r, 'SHIBUYA'), null);
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite, 0);
  assert.ok(r.data.crewRecruitmentState.SHIBUYA.failedCharacterIds.includes(roster[0].characterId));
});

test('repeated wins against a failed rival count toward pity but cannot re-offer them', () => {
  const roster = getRegionalCrewRoster('SHIBUYA').members;
  const r = setup();
  const first = win(r, 'SHIBUYA', roster[0].characterId, 'initial');
  const duel = acceptCrewInviteChallenge(r, first);
  resetCrewRecruitmentAfterLoss(r, duel);
  for (let n=1; n<=5; n++) {
    assert.equal(win(r,'SHIBUYA',roster[0].characterId,'same-'+n),null);
  }
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,3);
  const fresh = win(r,'SHIBUYA',roster[1].characterId,'fresh',()=>1);
  assert.equal(fresh.characterId,roster[1].characterId);
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,0);
});

test('the result defers joining until the player explicitly accepts in a manga scene', () => {
  assert.match(race,/this\.registry\.set\('crewPendingJoinDecision'/);
  assert.match(race,/resetCrewRecruitmentAfterLoss\(this\.registry, challenge\)/);
  assert.match(meet,/reason === 'action'/);
  assert.match(meet,/acceptCrewMember\(this\.registry, pending\)/);
  assert.match(meet,/playMangaCutscene\(this, 'crewRecruitmentJoin'/);
  assert.match(meet,/playMangaCutscene\(this, 'crewRecruitmentAnswer'/);
  assert.match(meet,/CAR NOW AT|CAR \+ DRIVER NOW AT|\+ DRIVER NOW AT WAREHOUSE CREW SPACE/);
  assert.ok(getCutscene('crewRecruitmentJoin').pages.some(p => p.secondaryActionLabel));
  assert.equal(getCutscene('crewRecruitmentAnswer').pages[0].speaker,'right');
});

test('every recruitable character has distinct personal post-win dialogue', () => {
  const ids = [...new Set(CREW_REGIONS.flatMap(region =>
    getRegionalCrewRoster(region).members.map(member => member.characterId)
  ))];
  const lines = ids.map(id => getCrewInviteDialogue(id).joinLine);
  assert.ok(lines.every(line => typeof line==='string' && line.length > 35));
  assert.equal(new Set(lines).size,ids.length);
});

test('unresolved recruitment choice survives a normalised save and load', () => {
  const raw=createDefaultGameState({ starterCarId:'ae86' });
  const pending={regionId:'SHIBUYA',characterId:'miuTanaka',baseCarId:'ek9',wonAt:12};
  const restored=normaliseState({...raw,crewPendingJoinDecision:pending});
  assert.equal(restored.crewPendingJoinDecision.characterId,pending.characterId);
  assert.match(stateSource,/crewPendingJoinDecision: registry\.get\('crewPendingJoinDecision'\)/);
});

test('active Ginza loan is preserved when crossing into street Meets', () => {
  const demo='ginzaDemo_essoToyotaGtOne';
  const reg=setup({
    ownedCarIds:['ae86',demo], selectedCarId:'ae86',
    preferredCarId:'ae86', ginzaTestDrive:{carId:demo,previousCarId:'ae86'},
  });
  assert.equal(restorePreferredCar(reg),demo);
  assert.equal(reg.data.selectedCarId,demo);
  assert.match(race,/this\.raceDeal = 'BET'/);
  assert.doesNotMatch(race,/ginzaDemo: true \};\s*saveSessionState/);
  assert.match(ginza,/centralGinzaVaultBg.*tokyo_ginza03\.png/);
});

test('crew removal and wheel calibration show their consequences and a road line', () => {
  assert.match(garage,/Their signature loan car leaves with them/);
  assert.match(garage,/CONFIRM REMOVE/);
  assert.match(wheels,/0xdde7ed/);
  assert.match(wheels,/lineBetween\(44, 615, 940, 615\)/);
});
