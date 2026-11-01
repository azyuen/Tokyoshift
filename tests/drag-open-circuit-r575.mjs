import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultProCircuitState, normaliseProCircuitState, PRO_CIRCUIT_TROPHIES } from '../src/data/proCircuit.js';
import { createDefaultGameState,normaliseState } from '../src/state/GameState.js';
import { recruitRandomDevCrew } from '../src/data/crewSystem.js';
import {
  PRO_SEASON_LENGTH, getProQualification, getOpenCircuitTrophy, isOpenCircuitAvailable,
  finishOpenCircuitEvent, startProfessionalSeason, forfeitProfessionalSeason,
  completeSeasonRound, nextProfessionalSeason, settleLegacySeasonEvent,
  getCrewSeriesUnits,registerCrewSeries,preparePlayerCrewFixture,getCrewFixture,getPlayerCrewHeat,
  settlePlayerCrewHeat,settleCrewSeriesFixture,
} from '../src/data/proSeason.js';

test('new profiles start with a voluntary OPEN pre-season; migrated active seasons retain their round', () => {
  const fresh=createDefaultProCircuitState();
  assert.equal(fresh.seasonStatus,'OPEN');
  assert.equal(isOpenCircuitAvailable(fresh),true);
  assert.equal(getProQualification(fresh).driver,0);
  const legacy={...fresh,seasonStatus:undefined,calendar:{...fresh.calendar,round:4,history:[{id:'old:round1'}]}};
  const migrated=normaliseProCircuitState(legacy);
  assert.equal(migrated.seasonStatus,'ACTIVE');
  assert.equal(migrated.calendar.round,4);
  assert.equal(isOpenCircuitAvailable(migrated),false);
});

test('standalone races never score toward a season or advance its round', () => {
  let c=createDefaultProCircuitState();
  c=finishOpenCircuitEvent(c,{id:'open:driver:1',placing:1,discipline:'DRIVER',points:999});
  assert.equal(c.calendar.round,0);
  assert.equal(c.playerDriver.seasonPoints,0);
  assert.equal(c.playerTeam.seasonPoints,0);
  assert.equal(c.openCircuitTick,1);
  const duplicate=finishOpenCircuitEvent(c,{id:'open:driver:1',placing:1});
  assert.equal(duplicate.openCircuitTick,1);
  assert.equal(duplicate.completedEventIds.length,1);
});

test('each of five minor trophies rotates after a two-event cooldown and only wins award a trophy',()=>{
  let c=createDefaultProCircuitState();
  c.season=3;
  c.trophyWins.shutoSpeed=1;
  c.trophyWins.tokyoTechnical=1;
  for(let index=0;index<PRO_CIRCUIT_TROPHIES.length;index++){
    const current=getOpenCircuitTrophy(c);
    assert.equal(current.id,PRO_CIRCUIT_TROPHIES[index].id);
    assert.equal(current.available,true);
    const won=index%2===0,previous=c.trophyWins[current.id];
    c=finishOpenCircuitEvent(c,{id:'minor:'+index,trophyId:current.id,placing:won?1:2});
    assert.equal(c.trophyWins[current.id],previous+(won?1:0));
    assert.equal(c.minorTrophyIndex,(index+1)%5);
    assert.equal(getOpenCircuitTrophy(c).available,false);
    assert.equal(getOpenCircuitTrophy(c).eventsRemaining,2);
    c=finishOpenCircuitEvent(c,{id:'driver:after:'+index,placing:1});
    assert.equal(getOpenCircuitTrophy(c).eventsRemaining,1);
    c=finishOpenCircuitEvent(c,{id:'crew:after:'+index,placing:3});
    assert.equal(getOpenCircuitTrophy(c).available,true);
  }
  assert.equal(c.calendar.round,0);
  assert.equal(c.playerDriver.seasonPoints,0);
  assert.equal(c.playerTeam.seasonPoints,0);
});

test('registration commits the full 8-round season, preserves garage-related progress on forfeit',()=>{
  const c=createDefaultProCircuitState();
  c.openCircuitTick=5;
  c.trophyWins.shutoSpeed=1;
  const roster=['ef','ae86','gc8'];
  const entered=startProfessionalSeason(c,roster,roster);
  assert.ok(entered.circuit);
  assert.equal(entered.circuit.seasonStatus,'ACTIVE');
  assert.equal(isOpenCircuitAvailable(entered.circuit),false);
  assert.equal(startProfessionalSeason(entered.circuit).error,'FINISH THE CURRENT EVENT OR CHAMPIONSHIP');
  entered.circuit.playerDriver.seasonPoints=20;
  const abandoned=forfeitProfessionalSeason(entered.circuit);
  assert.equal(abandoned.circuit.seasonStatus,'OPEN');
  assert.equal(abandoned.circuit.season,2);
  assert.equal(abandoned.circuit.playerDriver.seasonPoints,0);
  assert.equal(abandoned.circuit.openCircuitTick,5);
  assert.equal(abandoned.circuit.trophyWins.shutoSpeed,1);
  assert.equal(abandoned.circuit.calendar.archives.at(-1).forfeited,true);
});

test('an officially completed season returns to open circuit until new deliberate registration',()=>{
  const c=createDefaultProCircuitState();
  c.seasonStatus='ACTIVE';
  c.calendar.round=PRO_SEASON_LENGTH-1;
  const complete=completeSeasonRound(c,{id:'official:last',label:'FINALE',discipline:'DRIVER',placing:1},[]);
  assert.equal(complete.calendar.round,PRO_SEASON_LENGTH);
  assert.equal(complete.seasonStatus,'COMPLETE');
  assert.equal(isOpenCircuitAvailable(complete),true);
  const roster=['ef','ae86','gc8'];
  const next=startProfessionalSeason(complete,roster,roster);
  assert.ok(next.circuit);
  assert.equal(next.circuit.season,2);
  assert.equal(next.circuit.calendar.round,0);
  assert.equal(next.circuit.seasonStatus,'ACTIVE');
});

test('legacy three-heat driver cup settles as open circuit without adding points',()=>{
  let c=createDefaultProCircuitState();
  const round={characterId:'unknown',encounterRating:3};
  c=settleLegacySeasonEvent(c,{proSeasonId:'open:driver:legacy',eventId:'streetShootout',openCircuit:true,rounds:[round,round,round],prizeCash:50000},3);
  assert.equal(c.playerDriver.seasonPoints,0);
  assert.equal(c.calendar.round,0);
  assert.equal(c.openCircuitTick,1);
  assert.equal(c.lastTournament.openCircuit,true);
  assert.equal(c.lastTournament.cashPrize,50000);
});

test('a full standalone crew session charges once, drives three heats and earns no season points',()=>{
  const data={...createDefaultGameState(),devMode:true,cash:500000,ownedCarIds:['ae86'],selectedCarId:'ae86'};
  const state=new Map(Object.entries(data));
  const registry={get:key=>state.get(key),set:(key,value)=>state.set(key,value)};
  recruitRandomDevCrew(registry,()=>.2);
  const ids=getCrewSeriesUnits(registry).slice(0,3).map(x=>x.id);
  const registration=registerCrewSeries(registry,ids);
  assert.ok(registration.circuit,registration.error);
  assert.equal(registration.cash,465000);
  assert.equal(registration.circuit.activeCrewEvent.openCircuit,true);
  registry.set('cash',registration.cash);
  registry.set('proCircuit',registration.circuit);
  let fixture=getCrewFixture(registry.get('proCircuit'));
  const prepared=preparePlayerCrewFixture(registry,ids,fixture.id);
  assert.ok(prepared.circuit,prepared.error);
  registry.set('proCircuit',prepared.circuit);
  for(let i=0;i<3;i++){
    const heat=getPlayerCrewHeat(registry.get('proCircuit'));
    assert.ok(heat);
    const settled=settlePlayerCrewHeat(registry.get('proCircuit'),heat.id,
      [{id:'player',finishSeconds:10,disqualified:false},
       {id:'ai-1',finishSeconds:11,disqualified:false}]);
    assert.equal(settled.status,'CREW_HEAT');
    registry.set('proCircuit',settled.circuit);
  }
  fixture=getCrewFixture(registry.get('proCircuit'));
  const complete=settleCrewSeriesFixture(registry.get('proCircuit'),fixture.id);
  assert.equal(complete.status,'COMPLETE');
  assert.equal(complete.circuit.calendar.round,0);
  assert.equal(complete.circuit.playerTeam.seasonPoints,0);
  assert.equal(complete.circuit.openCircuitTick,1);
  assert.equal(complete.circuit.activeCrewEvent,null);
  assert.equal(complete.cashPrize,70000);
  assert.equal(complete.summary.openCircuit,true);
  assert.equal(settleCrewSeriesFixture(complete.circuit,fixture.id).cashPrize,0);
});

test('crew prestige trophy requires three full fixtures and never scores season points',()=>{
  const data={...createDefaultGameState(),devMode:true,cash:600000,ownedCarIds:['ae86'],selectedCarId:'ae86'};
  const m=new Map(Object.entries(data));
  const registry={get:key=>m.get(key),set:(k,v)=>m.set(k,v)};
  recruitRandomDevCrew(registry,()=>.2);
  const circuit=registry.get('proCircuit');
  circuit.season=2;
  circuit.minorTrophyIndex=3; // TEAM GRAND PRIX
  const ids=getCrewSeriesUnits(registry).slice(0,3).map(x=>x.id);
  const out=registerCrewSeries(registry,ids,{},'teamGrandPrix');
  assert.ok(out.circuit,out.error);
  assert.equal(out.cash,500000);
  assert.equal(out.circuit.activeCrewEvent.short,false);
  registry.set('proCircuit',out.circuit);
  for(let round=0;round<3;round++){
    const f=getCrewFixture(registry.get('proCircuit'));
    assert.equal(f.round,round);
    const prepared=preparePlayerCrewFixture(registry,ids,f.id);
    assert.ok(prepared.circuit,prepared.error);
    registry.set('proCircuit',prepared.circuit);
    for(let i=0;i<3;i++){
      const h=getPlayerCrewHeat(registry.get('proCircuit'));
      const settled=settlePlayerCrewHeat(registry.get('proCircuit'),h.id,
        [{id:'player',finishSeconds:10,disqualified:false},{id:'ai-1',finishSeconds:11,disqualified:false}]);
      assert.equal(settled.status,'CREW_HEAT');
      registry.set('proCircuit',settled.circuit);
    }
    const ended=settleCrewSeriesFixture(registry.get('proCircuit'),f.id);
    assert.equal(ended.status,round===2?'COMPLETE':'ADVANCED');
    assert.equal(ended.circuit.calendar.round,0);
    assert.equal(ended.circuit.playerTeam.seasonPoints,0);
    registry.set('proCircuit',ended.circuit);
    if(round===2){
      assert.equal(ended.summary.placing,1);
      assert.equal(ended.cashPrize,300000);
      assert.equal(ended.circuit.trophyWins.teamGrandPrix,1);
      assert.equal(ended.circuit.trophyHistory.at(-1).trophyId,'teamGrandPrix');
      assert.equal(ended.circuit.openCircuitTick,1);
      assert.equal(settleCrewSeriesFixture(ended.circuit,f.id).cashPrize,0);
    }
  }
});

test('early trophy rotation skips future invitations and Masters requires two different wins',()=>{
  let c=createDefaultProCircuitState();
  c.minorTrophyIndex=2;
  assert.equal(getOpenCircuitTrophy(c).id,'shutoSpeed');
  c.season=2;
  assert.equal(getOpenCircuitTrophy(c).id,'triDrive');
  c.minorTrophyIndex=4;
  assert.equal(getOpenCircuitTrophy(c).id,'shutoSpeed');
  c.season=3;
  assert.equal(getOpenCircuitTrophy(c).id,'shutoSpeed');
  c.trophyWins.shutoSpeed=2;
  c.trophyWins.tokyoTechnical=1;
  assert.equal(getOpenCircuitTrophy(c).id,'tokyoMasters');
});

test('Tri-Drive registration rejects squads without FWD, RWD and AWD',()=>{
  const data={...createDefaultGameState(),devMode:true,cash:600000,ownedCarIds:['ae86'],selectedCarId:'ae86'};
  const m=new Map(Object.entries(data));
  const registry={get:key=>m.get(key),set:(k,v)=>m.set(k,v)};
  recruitRandomDevCrew(registry,()=>.2);
  const c=registry.get('proCircuit');c.season=2;c.minorTrophyIndex=2;
  const units=getCrewSeriesUnits(registry);
  const ids=units.slice(0,3).map(u=>u.id);
  const out=registerCrewSeries(registry,ids,{},'triDrive');
  const drives=ids.map(id=>units.find(u=>u.id===id).drivetrain).map(x=>({FF:'FWD',FR:'RWD'}[x]||x));
  if(new Set(drives).size===3&&['FWD','RWD','AWD'].every(d=>drives.includes(d)))
    assert.ok(out.circuit,out.error);
  else assert.equal(out.error,'TRI-DRIVE NEEDS ONE FWD, ONE RWD AND ONE AWD CAR');
});

test('legacy first-round official duel is preserved rather than interpreted as open-circuit registration',()=>{
 const saved=createDefaultGameState();
 delete saved.proCircuit.seasonStatus;
 saved.competitionState={active:true,proEvent:true,eventId:'streetShootout',
   proSeasonId:'duel:legacy',roundIndex:1,playerCarId:'ae86',rounds:[{carId:'r32'},{carId:'gc8'},{carId:'galant'}]};
 const current=normaliseState(saved);
 assert.equal(current.proCircuit.seasonStatus,'ACTIVE');
 assert.equal(current.proCircuit.calendar.round,0);
 assert.equal(current.competitionState.roundIndex,1);
 assert.equal(isOpenCircuitAvailable(current.proCircuit),false);
});
