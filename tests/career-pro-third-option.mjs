// Career v1.0 endgame professional ladder — focused deterministic regression.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState,normaliseProCircuitState} from '../src/data/proCircuit.js';
import {createDefaultGameState} from '../src/state/GameState.js';
import {recruitRandomDevCrew} from '../src/data/crewSystem.js';
import {
  PRO_SEASON_LENGTH,PRO_SEASON_CALENDAR,CREW_SERIES,PRO_QUALIFICATION,
  PRO_ALT_CREW_ENTRY_FEE,PRO_ALT_CREW_PRIZES,
  PRO_INVITATIONAL_DRIVER_FEE,PRO_INVITATIONAL_DRIVER_PRIZE,
  getAlternativeProCrewFormat,getProInvitationalDiscipline,
  getProDriverInvitationRules,getProSeasonSkillTier,
  getProfessionalOpponentBuild,getProfessionalCarEligibility,
  crewSeriesEligibility,registerCrewSeries,getCrewSeriesUnits,
  registerProfessionalTimedEvent,
} from '../src/data/proSeason.js';
import {
  createProvisionalChampionship,getChampionshipOpponentSkill,
} from '../src/data/tokyoChampionship.js';

const venue=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
const race=readFileSync(new URL('../src/scenes/FourLaneTestScene.js',import.meta.url),'utf8');
function mockPhaser(){
  globalThis.Phaser={Math:{Clamp:(x,lo,hi)=>Math.max(lo,Math.min(hi,x)),Linear:(a,b,t)=>a+(b-a)*t}};
}
function crewSource(round=1){
  const data=createDefaultGameState();
  data.devMode=true;data.cash=600000;data.ownedCarIds=['ae86'];data.selectedCarId='ae86';
  const entries=new Map(Object.entries(data));
  const source={get:k=>entries.get(k),set:(k,v)=>entries.set(k,v)};
  recruitRandomDevCrew(source,()=>.2);
  const c=source.get('proCircuit');c.seasonStatus='ACTIVE';c.calendar.round=round;
  return source;
}

test('each of eight rounds has three genuine offers with guaranteed Driver and Crew choices',()=>{
  assert.equal(PRO_SEASON_LENGTH,8);
  assert.equal(PRO_SEASON_CALENDAR.length,8);
  for(let round=0;round<8;round++){
    const state=createDefaultProCircuitState();state.seasonStatus='ACTIVE';state.calendar.round=round;
    assert.ok(PRO_SEASON_CALENDAR[round].driver.format);
    assert.ok(PRO_SEASON_CALENDAR[round].crew.format);
    const discipline=getProInvitationalDiscipline(state);
    assert.ok(['DRIVER','TEAM'].includes(discipline));
    assert.notEqual(getAlternativeProCrewFormat(round),PRO_SEASON_CALENDAR[round].crew.format);
    assert.equal(getProDriverInvitationRules(round).format,'KNOCKOUT');
  }
  assert.deepEqual(PRO_QUALIFICATION,{driver:60,crew:40});
  assert.ok(PRO_INVITATIONAL_DRIVER_FEE>0);
  assert.ok(PRO_INVITATIONAL_DRIVER_PRIZE>0);
  assert.ok(PRO_ALT_CREW_ENTRY_FEE>CREW_SERIES.entryFee);
  assert.ok(PRO_ALT_CREW_PRIZES[0]>CREW_SERIES.prizes[0]);
});

test('rotation starts 5 Driver/3 Crew and responds to unmet qualification',()=>{
  const state=createDefaultProCircuitState();state.seasonStatus='ACTIVE';
  assert.deepEqual(Array.from({length:8},(_,i)=>{
    state.calendar.round=i;return getProInvitationalDiscipline(state);
  }),['DRIVER','TEAM','DRIVER','DRIVER','TEAM','DRIVER','TEAM','DRIVER']);
  state.calendar.round=4;state.playerDriver.seasonPoints=0;state.playerTeam.seasonPoints=40;
  assert.equal(getProInvitationalDiscipline(state),'DRIVER');
  state.playerDriver.seasonPoints=60;state.playerTeam.seasonPoints=0;
  assert.equal(getProInvitationalDiscipline(state),'TEAM');
});

test('Pro starts Expert-heavy, Invitationals are 80% Elite, and late regulars are mostly Elite',()=>{
  assert.ok([3,4,5].includes(getProSeasonSkillTier(0,0,false)));
  assert.equal(Array.from({length:10},(_,i)=>getProSeasonSkillTier(0,i)).filter(x=>x===3).length,1);
  assert.equal(Array.from({length:10},(_,i)=>getProSeasonSkillTier(0,i)).filter(x=>x===5).length,2);
  assert.equal(Array.from({length:5},(_,i)=>getProSeasonSkillTier(0,i,true)).filter(x=>x===5).length,4);
  for(const round of [4,5,6,7]){
    const tiers=Array.from({length:40},(_,i)=>getProSeasonSkillTier(round,i));
    assert.ok(tiers.every(n=>n>=4),'no Skilled opponents after round 4');
    assert.ok(tiers.filter(n=>n===5).length>=24,'Elite-majority fields');
  }
});

test('official third card alternates between Driver and Crew and remains independently resumable',()=>{
  const section=venue.slice(venue.indexOf('getProDragEvents() {'),venue.indexOf('drawDragComplex() {'));
  assert.match(section,/getProInvitationalDiscipline\(pro\)/);
  assert.match(section,/invitationalDiscipline==='DRIVER'\?alternateDriver:alternateCrew/);
  assert.match(section,/seasonChoice:'alternative'/);
  assert.match(section,/entryFee:PRO_INVITATIONAL_DRIVER_FEE/);
  assert.match(section,/entryFee:PRO_ALT_CREW_ENTRY_FEE/);
  assert.match(section,/legacy.eventId===inviteRules.id\?2:0/);
  assert.match(panel,/pending.seasonChoice/);
  assert.match(panel,/active\.seasonChoice\|\|'standard'/);
});

test('out-of-rotation, open-circuit or double crew registration is rejected',()=>{
  mockPhaser();
  try{
    const open={get:key=>key==='proCircuit'?createDefaultProCircuitState():null};
    assert.match(registerCrewSeries(open,[],{},null,null,'alternative').error,/ONLY AVAILABLE/);
    const noCrew=crewSource(0),ids0=getCrewSeriesUnits(noCrew).slice(0,3).map(u=>u.id);
    assert.match(registerCrewSeries(noCrew,ids0,{},null,null,'alternative').error,/NOT OFFERED/);
    const source=crewSource(1),ids=getCrewSeriesUnits(source).slice(0,3).map(u=>u.id);
    assert.equal(ids.length,3);
    const normal=registerCrewSeries(source,ids,{},null,null,'standard');
    const alternate=registerCrewSeries(source,ids,{},null,null,'alternative');
    assert.ok(normal.circuit,normal.error);
    assert.ok(alternate.circuit,alternate.error);
    assert.equal(alternate.cash,600000-PRO_ALT_CREW_ENTRY_FEE);
    assert.equal(alternate.circuit.activeCrewEvent.seasonChoice,'alternative');
    assert.equal(alternate.circuit.activeCrewEvent.format,getAlternativeProCrewFormat(1));
    assert.equal(alternate.circuit.activeCrewEvent.prizes[0],PRO_ALT_CREW_PRIZES[0]);
    assert.notEqual(alternate.circuit.activeCrewEvent.id,normal.circuit.activeCrewEvent.id);
    source.set('proCircuit',normaliseProCircuitState(alternate.circuit));
    source.set('cash',alternate.cash);
    assert.ok(registerCrewSeries(source,ids,{},null,null,'alternative').error);
    assert.equal(source.get('cash'),600000-PRO_ALT_CREW_ENTRY_FEE);
  }finally{delete globalThis.Phaser;}
});

test('official timed and driver knockout rivals are actually scrutineered to matching car classes',()=>{
  mockPhaser();
  try{
    const rules={stock:true,maxPowerKW:180,noNos:true};
    const rival=getProfessionalOpponentBuild(rules,150,4,'stock-r1','ae86');
    assert.ok(rival,'legal stock opponent required');
    assert.equal(rival.skillTier,4);
    assert.ok(getProfessionalCarEligibility(rival.carId,rival.state,rules).eligible);
    assert.ok(rival.powerKW<=180);
    const spec={drivetrain:'RWD',maxPowerKW:260,noNos:true};
    const developed=getProfessionalOpponentBuild(spec,220,5,'pro-r7','ae86');
    assert.ok(developed,'legal developed opponent required');
    assert.equal(developed.skillTier,5);
    assert.ok(getProfessionalCarEligibility(developed.carId,developed.state,spec).eligible);
    assert.ok(developed.powerKW<=260);
  }finally{delete globalThis.Phaser;}
});

test('new Tokyo field opens mainly Elite; semifinals and finals are all Elite',()=>{
  const state=createDefaultProCircuitState();state.seasonStatus='ACTIVE';state.calendar.round=8;
  state.playerDriver.seasonPoints=60;state.playerTeam.seasonPoints=40;
  const out=createProvisionalChampionship(state);
  assert.ok(out.championship,out.error);
  const championship=out.championship;
  const competitors=championship.entrants.filter(e=>e.id!=='player:driver');
  assert.equal(competitors.length,15);
  assert.equal(competitors.filter(e=>e.skillTier===5).length,11);
  assert.equal(competitors.filter(e=>e.skillTier===4).length,4);
  for(const entrant of competitors){
    assert.equal(getChampionshipOpponentSkill(championship,entrant.id,'KNOCKOUT',0),entrant.skillTier);
    assert.equal(getChampionshipOpponentSkill(championship,entrant.id,'KNOCKOUT',2),5);
    assert.equal(getChampionshipOpponentSkill(championship,entrant.id,'FOUR_WIDE',2),5);
  }
  const saved=JSON.parse(JSON.stringify(championship));
  assert.deepEqual(saved.entrants,championship.entrants);
  saved.rosterType='PROVISIONAL';
  assert.equal(getChampionshipOpponentSkill(saved,competitors[0].id,'KNOCKOUT',3),null);
});

test('playable race scene uses saved grades and builds without altering core AI physics',()=>{
  assert.match(race,/getChampionshipOpponentSkill\(this.champState/);
  assert.match(race,/opponentRating\|\|3/);
  assert.match(race,/this.proRivalBuilds/);
  assert.match(race,/getProfessionalOpponentBuild\(rules,ownPower/);
  assert.match(venue,/getProfessionalCarEligibility\(build.carId,build.state,rules\)/);
  assert.doesNotMatch(venue.slice(venue.indexOf('startProBracket(event, build, storyConfirmed = false)')),
    /rules.format !== 'KNOCKOUT' \|\| rules.stock/);
});

test('every official Driver round has at least one rule-legal rival car and genuine Expert/Elite opponent',()=>{
  mockPhaser();
  try{
    const targets=[145,260,340,145,430,220,215,560];
    for(let round=0;round<8;round++){
      const rules=PRO_SEASON_CALENDAR[round].driver;
      const tier=getProSeasonSkillTier(round,0);
      const build=getProfessionalOpponentBuild(rules,targets[round],tier,
        'career-endgame-class-'+round);
      assert.ok(build,'round '+(round+1)+' lacks a legal rival');
      assert.ok(getProfessionalCarEligibility(build.carId,build.state,rules).eligible,
        'illegal build in round '+(round+1));
      assert.ok(build.powerKW<=targets[round]*1.15+0.001,
        'hidden power advantage in round '+(round+1));
      if(round>=4)assert.ok(build.skillTier>=4);
    }
  }finally{delete globalThis.Phaser;}
});

test('timed event registration saves legal opponent build and does not regenerate it on reload',()=>{
  mockPhaser();
  try{
    const state=createDefaultProCircuitState();
    state.seasonStatus='ACTIVE';state.calendar.round=1;
    const result=registerProfessionalTimedEvent(state,'ae86',65000,{});
    assert.ok(result.circuit,result.error);
    const e=result.circuit.activeTimedEvent;
    assert.equal(e.round,1);
    assert.ok(e.opponentRating>=4);
    assert.ok(getProfessionalCarEligibility(e.opponentCarId,e.opponentCarState,
      PRO_SEASON_CALENDAR[1].driver).eligible);
    assert.deepEqual(normaliseProCircuitState(JSON.parse(JSON.stringify(result.circuit))).activeTimedEvent,e);
    assert.ok(registerProfessionalTimedEvent(result.circuit,'ae86',65000,{}).error);
  }finally{delete globalThis.Phaser;}
});
