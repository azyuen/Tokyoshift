import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultProCircuitState } from '../src/data/proCircuit.js';
import { getOpenCircuitTrophy, finishOpenCircuitEvent, registerCrewSeries,
  getCrewSeriesUnits, getCrewFixture, preparePlayerCrewFixture, getPlayerCrewHeat,
  settlePlayerCrewHeat, settleCrewSeriesFixture, settleLegacySeasonEvent } from '../src/data/proSeason.js';
import { getProfessionalDuelRound, settleProfessionalDuel } from '../src/data/proDragDuel.js';
import { createDefaultGameState } from '../src/state/GameState.js';
import { recruitRandomDevCrew } from '../src/data/crewSystem.js';

const driverState=()=>({
  active:true,proEvent:true,openCircuit:true,openTrophyId:'shutoSpeed',
  eventId:'shutoSpeed',playerCarId:'r32',prizeType:'CASH',prizeCash:230000,
  proSeasonId:'open:shutoSpeed:1',roundIndex:0,
  rounds:Array.from({length:5},(_,i)=>({carId:'r34',characterId:'opponent'+i,encounterRating:4}))
});

test('Shuto five-stage knockout persists each stage and settles exactly once',()=>{
  let state=driverState();
  for(let i=0;i<4;i++){
    const current=getProfessionalDuelRound(state);
    assert.equal(current.roundIndex,i);
    assert.equal(current.totalRounds,5);
    const out=settleProfessionalDuel(state,true);
    assert.equal(out.status,'ADVANCED');
    assert.equal(out.cashPrize,0);
    state=structuredClone(out.nextState);
  }
  const result=settleProfessionalDuel(state,true);
  assert.equal(result.status,'CHAMPION');
  assert.equal(result.roundNumber,5);
  assert.equal(result.cashPrize,230000);
  assert.equal(result.nextState,null);
  let c=settleLegacySeasonEvent(createDefaultProCircuitState(),state,5);
  assert.equal(c.trophyWins.shutoSpeed,1);
  assert.equal(c.trophyHistory.length,1);
  assert.equal(c.trophyHistory[0].carId,'r32');
  assert.equal(c.playerDriver.seasonPoints,0);
  assert.equal(c.calendar.round,0);
  assert.equal(c.lastTournament.placing,1);
  const again=settleLegacySeasonEvent(c,state,5);
  assert.equal(again.trophyWins.shutoSpeed,1);
  assert.equal(again.openCircuitTick,1);
});

test('knockout elimination awards no trophy or cash even on fifth stage',()=>{
  const state={...driverState(),roundIndex:4};
  const out=settleProfessionalDuel(state,false);
  assert.equal(out.status,'ELIMINATED');
  assert.equal(out.cashPrize,0);
  const c=settleLegacySeasonEvent(createDefaultProCircuitState(),state,4);
  assert.equal(c.lastTournament.placing,2);
  assert.equal(c.trophyWins.shutoSpeed,0);
  assert.equal(c.trophyHistory[0].placing,2);
});

test('short legacy duels remain three rounds after trophy expansion',()=>{
  let state={...driverState(),openTrophyId:null,rounds:driverState().rounds.slice(0,3)};
  for(let i=0;i<2;i++)state=settleProfessionalDuel(state,true).nextState;
  assert.equal(getProfessionalDuelRound(state).totalRounds,3);
  assert.equal(settleProfessionalDuel(state,true).status,'CHAMPION');
});

test('Masters invitation and saved mixed crew gauntlet use DUEL, RELAY, FOUR-WIDE',()=>{
  const data={...createDefaultGameState(),devMode:true,cash:600000,ownedCarIds:['ae86'],selectedCarId:'ae86'};
  const m=new Map(Object.entries(data));
  const registry={get:k=>m.get(k),set:(k,v)=>m.set(k,v)};
  recruitRandomDevCrew(registry,()=>.2);
  const c=registry.get('proCircuit');
  c.season=3;c.minorTrophyIndex=4;c.trophyWins.shutoSpeed=1;c.trophyWins.tokyoTechnical=1;
  assert.equal(getOpenCircuitTrophy(c).id,'tokyoMasters');
  const ids=getCrewSeriesUnits(registry).slice(0,3).map(u=>u.id);
  const registered=registerCrewSeries(registry,ids,{},'tokyoMasters');
  assert.ok(registered.circuit,registered.error);
  assert.equal(registered.cash,475000);
  registry.set('proCircuit',registered.circuit);
  for(const [round,format] of ['DUEL','RELAY','FOUR_WIDE'].entries()){
    const f=getCrewFixture(registry.get('proCircuit'));
    assert.equal(f.round,round);assert.equal(f.format,format);
    const prepared=preparePlayerCrewFixture(registry,ids,f.id);
    assert.ok(prepared.circuit,prepared.error);
    registry.set('proCircuit',prepared.circuit);
    for(let heat=0;heat<3;heat++){
      const h=getPlayerCrewHeat(registry.get('proCircuit'));
      assert.ok(h);
      const finishes=[{id:'player',finishSeconds:10,disqualified:false},
        {id:'ai-1',finishSeconds:11,disqualified:false}];
      if(format==='FOUR_WIDE')finishes.push(
        {id:'ai-2',finishSeconds:12,disqualified:false},
        {id:'ai-3',finishSeconds:13,disqualified:false});
      const out=settlePlayerCrewHeat(registry.get('proCircuit'),h.id,finishes);
      assert.equal(out.status,'CREW_HEAT');
      registry.set('proCircuit',out.circuit);
    }
    const out=settleCrewSeriesFixture(registry.get('proCircuit'),f.id);
    assert.equal(out.status,round===2?'COMPLETE':'ADVANCED');
    assert.equal(out.circuit.calendar.round,0);
    assert.equal(out.circuit.playerTeam.seasonPoints,0);
    registry.set('proCircuit',out.circuit);
    if(round===2){
      assert.equal(out.summary.placing,1);
      assert.equal(out.cashPrize,375000);
      assert.equal(out.circuit.trophyWins.tokyoMasters,1);
      assert.equal(out.circuit.trophyHistory.at(-1).driverIds.length,3);
    }
  }
});

test('repeat winners have reduced prizes and eligibility never moves the official calendar',()=>{
  let c=createDefaultProCircuitState();
  c.trophyWins.shutoSpeed=1;
  assert.equal(getOpenCircuitTrophy(c).firstWin,false);
  assert.equal(getOpenCircuitTrophy(c).repeatCash,85000);
  c=finishOpenCircuitEvent(c,{id:'repeat:shuto',placing:1,trophyId:'shutoSpeed',cashPrize:85000});
  assert.equal(c.trophyWins.shutoSpeed,2);
  assert.equal(c.trophyHistory.at(-1).cashPrize,85000);
  assert.equal(c.calendar.round,0);
  assert.equal(c.minorTrophyCooldownUntil,3);
});
