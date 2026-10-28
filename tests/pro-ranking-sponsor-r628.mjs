import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultProCircuitState, getProCircuitDriverSeeds, getProCircuitTeamSeeds,
  getProPrizeBonusPercent, getProPrizeWithBonus,
} from '../src/data/proCircuit.js';
import {
  settleLegacySeasonEvent, registerCrewSeries, getCrewSeriesUnits,
  getCrewFixture, preparePlayerCrewFixture, getPlayerCrewHeat,
  settlePlayerCrewHeat, settleCrewSeriesFixture,
} from '../src/data/proSeason.js';
import { createDefaultGameState } from '../src/state/GameState.js';
import { recruitRandomDevCrew } from '../src/data/crewSystem.js';
import { FOUR_WIDE_CUP, createFourWideTournament, getPlayerProHeat, settleFourWideHeat } from '../src/data/proTournament.js';

test('rank commission uses a progressive capped tier with no payout at entry level',()=>{
  const expected=new Map([[1,100],[2,75],[3,75],[4,50],[5,50],
    [6,30],[10,30],[11,15],[14,15],[15,0],[24,0],[0,0]]);
  for(const [rank,pct] of expected)assert.equal(getProPrizeBonusPercent(rank),pct);
  assert.equal(getProPrizeBonusPercent(undefined),0);
  assert.deepEqual(getProPrizeWithBonus(100001,1),{
    basePrize:100001,bonusPercent:100,bonusCash:100001,totalPrize:200002,
  });
  assert.equal(getProPrizeWithBonus(0,1).totalPrize,0);
  assert.equal(getProPrizeWithBonus(-30000,1).totalPrize,0);
  const c=createDefaultProCircuitState();
  assert.equal(getProPrizeBonusPercent(getProCircuitDriverSeeds(c).find(x=>x.id==='player:driver').seed),0);
  assert.equal(getProPrizeBonusPercent(getProCircuitTeamSeeds(c).find(x=>x.id==='player:team').seed),0);
});

test('open driver payout adds exact sponsor cash but never awards qualification points',()=>{
  const c=createDefaultProCircuitState();
  c.playerDriver.rating=2500; // professional #1 before paid event
  const rounds=Array(3).fill({characterId:'unknown',encounterRating:3});
  const state={proSeasonId:'sponsor:test:driver',eventId:'streetShootout',
    openCircuit:true,rounds,prizeCash:70000};
  const result=settleLegacySeasonEvent(c,state,3,90000);
  assert.equal(result.lastTournament.rankBefore,1);
  assert.equal(result.lastTournament.cashPrize,180000);
  assert.equal(result.lastTournament.sponsorBonus,90000);
  assert.equal(result.lastTournament.sponsorPercent,100);
  assert.equal(result.playerDriver.seasonPoints,0);
  assert.equal(result.calendar.round,0);
  assert.equal(result.openCircuitTick,1);
  assert.equal(settleLegacySeasonEvent(result,state,3,90000).openCircuitTick,1);
});

test('official Season pays sponsor commission without extra points and completed defeats earn cash',()=>{
  const rounds=Array(3).fill({characterId:'unknown',encounterRating:3});
  const c=createDefaultProCircuitState();
  c.playerDriver.rating=2500;
  c.seasonStatus='ACTIVE';
  const state={proSeasonId:'official:sponsor:test',eventId:'streetShootout',
    openCircuit:false,rounds,prizeCash:90000};
  const season=settleLegacySeasonEvent(c,state,3,90000);
  assert.equal(season.lastTournament.cashPrize,180000);
  assert.equal(season.lastTournament.sponsorBonus,90000);
  assert.equal(season.lastTournament.sponsorPercent,100);
  assert.equal(season.calendar.round,1);
  assert.equal(season.playerDriver.seasonPoints,20);
  const lose=settleLegacySeasonEvent(createDefaultProCircuitState(),
    {...state,proSeasonId:'open:sponsor:loss',openCircuit:true},0,0);
  assert.equal(lose.lastTournament.cashPrize,30000);
  assert.equal(lose.lastTournament.sponsorBonus,0);
});

test('open crew sponsor bonus uses CREW rank and settles only on completed paid fixtures',()=>{
  const data={...createDefaultGameState(),devMode:true,cash:500000,
    ownedCarIds:['ae86'],selectedCarId:'ae86'};
  const store=new Map(Object.entries(data));
  const registry={get:key=>store.get(key),set:(key,value)=>store.set(key,value)};
  recruitRandomDevCrew(registry,()=>.2);
  const ranked=createDefaultProCircuitState();
  ranked.playerTeam.rating=2500;
  registry.set('proCircuit',ranked);
  const ids=getCrewSeriesUnits(registry).slice(0,3).map(u=>u.id);
  const registration=registerCrewSeries(registry,ids);
  assert.ok(registration.circuit,registration.error);
  assert.equal(registration.circuit.activeCrewEvent.openCircuit,true);
  registry.set('proCircuit',registration.circuit);
  let fixture=getCrewFixture(registry.get('proCircuit'));
  const prepared=preparePlayerCrewFixture(registry,ids,fixture.id);
  assert.ok(prepared.circuit,prepared.error);
  registry.set('proCircuit',prepared.circuit);
  for(let i=0;i<3;i++){
    const heat=getPlayerCrewHeat(registry.get('proCircuit'));
    const result=settlePlayerCrewHeat(registry.get('proCircuit'),heat.id,
      [{id:'player',finishSeconds:10,disqualified:false},
       {id:'ai-1',finishSeconds:11,disqualified:false}]);
    assert.equal(result.status,'CREW_HEAT');
    registry.set('proCircuit',result.circuit);
  }
  fixture=getCrewFixture(registry.get('proCircuit'));
  const complete=settleCrewSeriesFixture(registry.get('proCircuit'),fixture.id);
  assert.equal(complete.status,'COMPLETE');
  assert.equal(complete.summary.rankBefore,1);
  assert.equal(complete.cashPrize,700000);
  assert.equal(complete.summary.sponsorBonus,350000);
  assert.equal(complete.summary.sponsorPercent,100);
  assert.equal(complete.circuit.playerTeam.seasonPoints,0);
  assert.equal(complete.circuit.calendar.round,0);
  assert.equal(settleCrewSeriesFixture(complete.circuit,fixture.id).cashPrize,0);
});

test('season crew #1 receives double the paid sprint purse but only 20 season points',()=>{
  const data={...createDefaultGameState(),devMode:true,cash:500000,
    ownedCarIds:['ae86'],selectedCarId:'ae86'};
  const store=new Map(Object.entries(data));
  const registry={get:key=>store.get(key),set:(key,v)=>store.set(key,v)};
  recruitRandomDevCrew(registry,()=>.2);
  const ranked=createDefaultProCircuitState();
  ranked.playerTeam.rating=2500;
  ranked.seasonStatus='ACTIVE';
  registry.set('proCircuit',ranked);
  const squad=getCrewSeriesUnits(registry).slice(0,3).map(u=>u.id);
  const entry=registerCrewSeries(registry,squad);
  assert.equal(entry.circuit.activeCrewEvent.openCircuit,false);
  assert.equal(entry.cash,500000); // Aruken funds professional entry
  registry.set('proCircuit',entry.circuit);
  const initialFixture=getCrewFixture(entry.circuit);
  const prepared=preparePlayerCrewFixture(registry,squad,initialFixture.id);
  registry.set('proCircuit',prepared.circuit);
  for(let n=0;n<3;n++){
    const heat=getPlayerCrewHeat(registry.get('proCircuit'));
    const out=settlePlayerCrewHeat(registry.get('proCircuit'),heat.id,
      [{id:'player',finishSeconds:10,disqualified:false},
       {id:'ai-1',finishSeconds:11,disqualified:false}]);
    assert.equal(out.status,'CREW_HEAT');
    registry.set('proCircuit',out.circuit);
  }
  const fixture=getCrewFixture(registry.get('proCircuit'));
  const earned=settleCrewSeriesFixture(registry.get('proCircuit'),fixture.id);
  assert.equal(earned.status,'COMPLETE');
  assert.equal(earned.cashPrize,2100000);
  assert.equal(earned.summary.sponsorBonus,1050000);
  assert.equal(earned.summary.sponsorPercent,100);
  assert.equal(earned.circuit.calendar.round,1);
  assert.equal(earned.circuit.playerTeam.seasonPoints,20);
  assert.equal(settleCrewSeriesFixture(earned.circuit,fixture.id).cashPrize,0);
});

test('season four-wide pays driver sponsorship once with the actual recorded prize',()=>{
  const base=createDefaultProCircuitState();
  base.playerDriver.rating=2500;
  base.seasonStatus='ACTIVE';
  const player='player:driver';
  base.activeTournament=createFourWideTournament(base,'r32');
  let state=base,finish;
  for(let stage=0;stage<3;stage++){
    const heat=getPlayerProHeat(state.activeTournament);
    assert.ok(heat);
    const results=heat.entrants.map((id,i)=>({
      id,finishSeconds:id===player?9:10.5+i*.25,disqualified:false,
    }));
    finish=settleFourWideHeat(state,results,heat.id);
    assert.equal(finish.status,stage===2?'COMPLETE':'ADVANCED');
    state=finish.circuit;
  }
  assert.equal(finish.summary.rankBefore,1);
  assert.equal(finish.cashPrize,FOUR_WIDE_CUP.prizeCash[0]*2);
  assert.equal(finish.summary.sponsorBonus,FOUR_WIDE_CUP.prizeCash[0]);
  assert.equal(finish.summary.sponsorPercent,100);
  assert.equal(finish.circuit.calendar.round,1);
  assert.equal(finish.circuit.playerDriver.seasonPoints,20);
  assert.equal(settleFourWideHeat(finish.circuit,[], 'stale').cashPrize,0);
});
