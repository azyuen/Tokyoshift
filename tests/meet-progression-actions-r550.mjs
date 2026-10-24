import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CREW_REGIONS, getRegionalCrewRoster } from '../src/data/crewRoster.js';
import { getTunerTeamChallengeState } from '../src/data/tunerChallenges.js';
import { getMeetProgressionActions } from '../src/data/meetProgressionActions.js';
import { getRegionalChallengeReturnLines } from '../src/data/regionalChallengeReturnQuotes.js';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const fullCrew = Object.fromEntries(CREW_REGIONS.map(r => {
  const m = getRegionalCrewRoster(r).members[0];
  return [r, { characterId: m.characterId, baseCarId: m.baseCarId }];
}));
const profile = (data = {}, crew = null) => ({
  regionWins: Object.fromEntries(CREW_REGIONS.map(r => [r, 12])),
  wins: 90, garageTier: 2,
  tunerTeamChallenges: { ODAIBA: data },
  crewMembers: crew || {},
});
const ids = p => getMeetProgressionActions(p, 'ODAIBA').map(a => a.id);

test('an invitation is not the first attempt; first-heat losses remain resumable', () => {
  assert.deepEqual(ids(profile({})), []);
  assert.deepEqual(ids(profile({offeredOnce:true,invited:true})), []);
  assert.deepEqual(ids(profile({offeredOnce:true,reofferVisitsRemaining:5})), []);
  const firstLoss = profile({firstAttemptStarted:true,stage:0,activeSession:false});
  assert.deepEqual(ids(firstLoss), ['REGIONAL']);
  const legacy = profile({playerCarId:'ae86',stage:0});
  assert.equal(getTunerTeamChallengeState(legacy,'ODAIBA').firstAttemptStarted,true);
  assert.deepEqual(ids(legacy), ['REGIONAL']);
  assert.deepEqual(ids(profile({stage:3,paused:true})), ['REGIONAL']);
});

test('champion status replaces regional button with perfect-streak button', () => {
  assert.deepEqual(ids(profile({championEarned:true,perfectEligible:false})), ['PERFECT']);
  assert.deepEqual(ids(profile({championEarned:true,perfectAttempt:true,stage:3})), ['PERFECT']);
  assert.deepEqual(ids(profile({championEarned:true,perfectEarned:true})), []);
  assert.deepEqual(ids(profile({championEarned:true,perfectRewardClaimed:true})), []);
});

test('seven recruits unlock crew battle; at most two remaining actions render', () => {
  assert.deepEqual(ids(profile({},fullCrew)), ['CREW']);
  assert.deepEqual(ids(profile({firstAttemptStarted:true},fullCrew)), ['REGIONAL','CREW']);
  assert.deepEqual(ids(profile({championEarned:true},fullCrew)), ['PERFECT','CREW']);
  const won = profile({championEarned:true},fullCrew);
  won.crewBattleProgress={ODAIBA:{completed:true}};
  assert.deepEqual(ids(won), ['PERFECT']);
  assert.deepEqual(getMeetProgressionActions(won,'ODAIBA',false), []);
  const complete = profile({championEarned:true,perfectEarned:true},fullCrew);
  complete.crewBattleProgress={ODAIBA:{completed:true}};
  assert.deepEqual(ids(complete), []);
  for(const region of CREW_REGIONS)
    assert(getMeetProgressionActions({...complete,tunerTeamChallenges:{}},region).length <=2);
});

test('seven short return invitations retain their captains distinctive voices', () => {
  const lines = CREW_REGIONS.map(getRegionalChallengeReturnLines);
  assert.equal(new Set(lines.map(pair=>pair[0])).size,7);
  for(const pair of lines) {
    assert.equal(pair.length,2);
    assert(pair.every(t=>t.length>25));
  }
});

test('meet scene has pink two-slot challenge actions, pink badges and refresh separation', () => {
  const s=read('src/scenes/MeetScene.js');
  assert.match(s,/this\.buildMeetProgressionButtons\(\)/);
  assert.match(s,/getPinkMeetBadge\(/);
  assert.match(s,/d\[i \+ 1\] = Math\.round\(29 \+ 94 \* light\)/);
  assert.match(s,/const width = 394/);
  assert.match(s,/const right = STAGE\.x \+ STAGE\.w - 34/);
  assert.match(s,/const y = STAGE\.y \+ 51 \+ index \* 60/);
  assert.match(s,/0xff5f93/);
  assert.match(s,/this\.startMeetProgressionChallenge\(regionId, action\.id\)/);
  assert.match(s,/showCrewBattleIntroduction\(regionId\)/);
  assert.match(s,/this\.buildMeetProgressionButtons\(\);[\s\S]*?this\.time\.delayedCall\(60/);
  assert.match(s,/STAGE\.x \+ 195,[\s\S]*?'NEW RIVALS ARRIVE'/);
  assert.doesNotMatch(s,/const panel = add\(this\.add\.rectangle\(780, 420, 700, 300/);
  assert.doesNotMatch(s,/this\.tunerChallengePopup = panel/);
});

test('only first organic invitation gets randomized; later attempts launch from badge', () => {
  const s=read('src/scenes/MeetScene.js');
  const a=s.slice(s.indexOf('  maybeShowTunerTeamChallenge('),
    s.indexOf('  getPreparedRegionalChallengeRounds('));
  assert.match(a,/state\.championEarned \|\| state\.firstAttemptStarted/);
  assert.match(a,/reofferVisitsRemaining/);
  const b=s.slice(s.indexOf('  showTunerTeamChallengePopup('),
    s.indexOf('  startTunerTeamChallengeRound('));
  assert.match(b,/state\.offeredAt === 'RETURN'/);
  assert.match(b,/getRegionalChallengeReturnLines\(key\)/);
  assert.match(b,/finalActionLabel: 'ACCEPT'/);
  assert.match(b,/secondaryFinalActionLabel: 'RACE LATER'/);
  assert.match(b,/reason === 'action'/);
  assert.doesNotMatch(b,/reason === 'skip' \|\|/);
  const c=s.slice(s.indexOf('  beginTunerTeamChallenge('),
    s.indexOf('  showTunerTeamChallengePopup('));
  assert.match(c,/firstAttemptStarted: true/);
  assert.match(c,/continuingPerfect/);
  assert.match(c,/this\.startTunerTeamChallengeRound\(key\)/);
});
