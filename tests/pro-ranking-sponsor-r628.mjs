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

test('rank commission uses a progressive capped tier with no payout at entry level',()=>{
  const expected=new Map([[1,15],[2,12],[3,12],[4,10],[5,10],
    [6,7],[10,7],[11,4],[14,4],[15,0],[24,0],[0,0]]);
  for(const [rank,pct] of expected)assert.equal(getProPrizeBonusPercent(rank),pct);
  assert.equal(getProPrizeBonusPercent(undefined),0);
  assert.deepEqual(getProPrizeWithBonus(100001,1),{
    basePrize:100001,bonusPercent:15,bonusCash:15000,totalPrize:115001,
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
  assert.equal(result.lastTournament.cashPrize,103500);
  assert.equal(result.lastTournament.sponsorBonus,13500);
  assert.equal(result.lastTournament.sponsorPercent,15);
  assert.equal(result.playerDriver.seasonPoints,0);
  assert.equal(result.calendar.round,0);
  assert.equal(result.openCircuitTick,1);
  assert.equal(settleLegacySeasonEvent(result,state,3,90000).openCircuitTick,1);
});

test('sponsor payout is excluded from registered season and zero-prize defeats',()=>{
  const rounds=Array(3).fill({characterId:'unknown',encounterRating:3});
  const c=createDefaultProCircuitState();
  c.playerDriver.rating=2500;
  c.seasonStatus='ACTIVE';
  const state={proSeasonId:'official:sponsor:test',eventId:'streetShootout',
    openCircuit:false,rounds,prizeCash:90000};
  const season=settleLegacySeasonEvent(c,state,3,90000);
  assert.equal(season.lastTournament.cashPrize,90000);
  assert.equal(season.lastTournament.sponsorBonus,0);
  assert.equal(season.calendar.round,1);
  assert.equal(season.playerDriver.seasonPoints,20);
  const lose=settleLegacySeasonEvent(createDefaultProCircuitState(),
    {...state,proSeasonId:'open:sponsor:loss',openCircuit:true},0,0);
  assert.equal(lose.lastTournament.cashPrize,0);
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
  assert.equal(complete.cashPrize,80500);
  assert.equal(complete.summary.sponsorBonus,10500);
  assert.equal(complete.summary.sponsorPercent,15);
  assert.equal(complete.circuit.playerTeam.seasonPoints,0);
  assert.equal(complete.circuit.calendar.round,0);
  assert.equal(settleCrewSeriesFixture(complete.circuit,fixture.id).cashPrize,0);
});
