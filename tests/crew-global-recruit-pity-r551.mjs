import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CREW_INVITE_PITY_WINS, CREW_INVITE_INTEREST_CHANCE,
  getGlobalCrewRecruitmentState, getCrewInviteInterest,
  createCrewInviteFromMeetWin, acceptCrewInviteChallenge,
  clearCrewInviteInterest, getCrewRecruitChallenge,
  setCrewRecruitChallenge, clearCrewRecruitChallenge,
} from '../src/data/crewSystem.js';
import { CREW_REGIONS, getRegionalCrewRoster } from '../src/data/crewRoster.js';

const setup = (extras={}) => {
  const data = {
    wins: 90, losses: 0, devMode: false, crewMembers: {},
    tunerTeamChallenges: Object.fromEntries(CREW_REGIONS.map(region => [region,{championEarned:true}])),
    crewRecruitmentState: {}, crewInviteInterests: {}, crewRecruitChallenges: {},
    crewInviteInterest: null, crewRecruitChallenge:null,
    ...extras,
  };
  return {get:(k)=>data[k],set:(k,v)=>{data[k]=v;},data};
};
const member = region => getRegionalCrewRoster(region).members[0];
const win = (registry, region, n, rand=()=>1) => createCrewInviteFromMeetWin(registry, {
  regionId: region, characterId:member(region).characterId,
  locationId: region.toLowerCase()+'Meet', winToken:region+':'+n,
},rand);

test('global 25% chance and exactly fourth eligible victory guarantee across districts',()=>{
  const r=setup();
  assert.equal(CREW_INVITE_INTEREST_CHANCE,.25);
  assert.equal(CREW_INVITE_PITY_WINS,4);
  const path=['YOKOHAMA','DAIKOKU','SHINAGAWA','SHIBUYA'];
  for(let i=0;i<3;i++){
    assert.equal(win(r,path[i],i+1),null);
    assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,i+1);
  }
  const invited=win(r,'SHIBUYA',4);
  assert.equal(invited.regionId,'SHIBUYA');
  assert.equal(invited.characterId,member('SHIBUYA').characterId);
  assert.equal(getCrewInviteInterest(r,'SHIBUYA').characterId,invited.characterId);
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,0);
  assert.equal(getCrewInviteInterest(r,'YOKOHAMA'),null);
});

test('a lucky win triggers 25% roll immediately and resets the shared counter',()=>{
  const r=setup();
  assert.equal(win(r,'TATSUMI',1,()=>0).regionId,'TATSUMI');
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,0);
});

test('pending invitation elsewhere never blocks the fourth-win Shibuya invite',()=>{
  const a=member('YOKOHAMA');
  const old={regionId:'YOKOHAMA',characterId:a.characterId,baseCarId:a.baseCarId,
    locationId:'yokohamaMeet',createdAt:1};
  const r=setup({crewInviteInterest:old});
  for(const [i,region] of ['DAIKOKU','SHINAGAWA','TATSUMI'].entries())
    assert.equal(win(r,region,i+1),null);
  const newer=win(r,'SHIBUYA',4);
  assert.equal(newer.regionId,'SHIBUYA');
  assert.equal(getCrewInviteInterest(r,'YOKOHAMA').characterId,a.characterId);
  assert.equal(getCrewInviteInterest(r,'SHIBUYA').characterId,member('SHIBUYA').characterId);
  assert.equal(Object.keys(r.data.crewInviteInterests).length,2);
  const duel=acceptCrewInviteChallenge(r,getCrewInviteInterest(r,'SHIBUYA'));
  assert.equal(duel.regionId,'SHIBUYA');
  assert.equal(getCrewInviteInterest(r,'SHIBUYA'),null);
  assert.equal(getCrewInviteInterest(r,'YOKOHAMA').characterId,a.characterId);
  assert.equal(getCrewRecruitChallenge(r,'SHIBUYA').characterId,newer.characterId);
});

test('accepted duels are retained separately when another region is active',()=>{
  const r=setup();
  const a=win(r,'SHIBUYA',1,()=>0);
  const first=acceptCrewInviteChallenge(r,a);
  assert.equal(first.regionId,'SHIBUYA');
  assert.equal(getCrewRecruitChallenge(r,'SHIBUYA').active,true);
  assert.equal(win(r,'DAIKOKU',2,()=>0).regionId,'DAIKOKU');
  const second=acceptCrewInviteChallenge(r,getCrewInviteInterest(r,'DAIKOKU'));
  assert.equal(second.regionId,'DAIKOKU');
  assert.equal(getCrewRecruitChallenge(r,'SHIBUYA').characterId,first.characterId);
  assert.equal(getCrewRecruitChallenge(r,'DAIKOKU').characterId,second.characterId);
  clearCrewRecruitChallenge(r,'DAIKOKU');
  assert.equal(getCrewRecruitChallenge(r,'DAIKOKU'),null);
  assert.equal(getCrewRecruitChallenge(r,'SHIBUYA').characterId,first.characterId);
  setCrewRecruitChallenge(r,{...first,attempts:1,lastLossAt:42,retryDeferredUntilExit:true});
  assert.equal(getCrewRecruitChallenge(r,'SHIBUYA').retryDeferredUntilExit,true);
});

test('duplicate win token, leader, and already-recruited region cannot gain pity',()=>{
  const r=setup();
  assert.equal(win(r,'SHIBUYA',1),null);
  assert.equal(win(r,'SHIBUYA',1),null);
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,1);
  const boss=getRegionalCrewRoster('SHIBUYA').mainRivalId;
  assert.equal(createCrewInviteFromMeetWin(r,{regionId:'SHIBUYA',characterId:boss,winToken:'boss'}),null);
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,1);
  r.data.crewMembers.SHIBUYA={characterId:member('SHIBUYA').characterId};
  assert.equal(win(r,'SHIBUYA',2),null);
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,1);
});

test('legacy partial pity is migrated without resetting or exceeding fourth win',()=>{
  const r=setup({crewRecruitmentState:{SHIBUYA:{misses:2},YOKOHAMA:{misses:1}}});
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,3);
  assert.equal(win(r,'DAIKOKU',10)?.regionId,'DAIKOKU');
  assert.equal(getGlobalCrewRecruitmentState(r).eligibleWinsSinceInvite,0);
});

test('local clearing and save paths do not destroy other invitations',()=>{
  const a=member('YOKOHAMA'),b=member('SHIBUYA');
  const r=setup({crewInviteInterests:{
    YOKOHAMA:{regionId:'YOKOHAMA',characterId:a.characterId},
    SHIBUYA:{regionId:'SHIBUYA',characterId:b.characterId},
  }});
  clearCrewInviteInterest(r,'SHIBUYA');
  assert.equal(getCrewInviteInterest(r,'SHIBUYA'),null);
  assert.equal(getCrewInviteInterest(r,'YOKOHAMA').characterId,a.characterId);
  const src=readFileSync(new URL('../src/state/GameState.js',import.meta.url),'utf8');
  assert.match(src,/crewInviteInterests: registry.get\('crewInviteInterests'\)/);
  assert.match(src,/crewRecruitChallenges: registry.get\('crewRecruitChallenges'\)/);
  const meet=readFileSync(new URL('../src/scenes/MeetScene.js',import.meta.url),'utf8');
  const race=readFileSync(new URL('../src/scenes/RaceScene.js',import.meta.url),'utf8');
  assert.match(meet,/getCrewInviteInterest\(this.registry, currentRegion\)/);
  assert.match(meet,/getCrewRecruitChallenge\(this.registry, region\)/);
  assert.match(meet,/setCrewRecruitChallenge\(this.registry, challenge\)/);
  assert.match(race,/resetCrewRecruitmentAfterLoss\(this.registry, challenge\)/);
  assert.match(race,/crewPendingJoinDecision/);
  assert.match(race,/createCrewInviteFromMeetWin\(/);
});
