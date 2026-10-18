import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultGameState} from '../src/state/GameState.js';
import {recruitRandomDevCrew} from '../src/data/crewSystem.js';
import {normaliseProCircuitState} from '../src/data/proCircuit.js';
import {
  getCrewSeriesUnits,getCrewFixture,registerCrewSeries,
  forfeitCrewSeries,useProCrewAdvice,getProCrewAdviceAvailability,
  startProfessionalSeason,
} from '../src/data/proSeason.js';
import {getProCrewHeatAdvice} from '../src/ui/ProCrewBattleLineup.js';

function registry(){
  const data={...createDefaultGameState(),devMode:true,cash:5000000};
  const m=new Map(Object.entries(data));
  const r={get:k=>m.get(k),set:(k,v)=>m.set(k,v)};
  recruitRandomDevCrew(r,()=>.2);
  return r;
}
function enter(r,season=false){
  if(season){
    const start=startProfessionalSeason(r.get('proCircuit'));
    assert.equal(start.error,undefined,start.error);
    r.set('proCircuit',start.circuit);
  }
  const members=getCrewSeriesUnits(r).map(u=>u.id);
  const initialCash=r.get('cash');
  const out=registerCrewSeries(r,members);
  assert.equal(out.error,undefined,out.error);
  assert.ok(out.cash<initialCash);
  r.set('cash',out.cash);r.set('proCircuit',out.circuit);
  return out.circuit.activeCrewEvent.id;
}
test('R594: open circuit forfeit loses the paid event with zero season points, no refund and no reentry',()=>{
  const r=registry(),id=enter(r),cash=r.get('cash'),before=r.get('proCircuit');
  assert.ok(getCrewFixture(before));
  const out=forfeitCrewSeries(r,id);
  assert.equal(out.error,undefined);
  assert.equal(out.status,'FORFEITED');
  assert.equal(out.cashPrize,0);
  assert.equal(out.summary.placing,4);
  assert.equal(out.summary.points,0);
  assert.equal(out.circuit.activeCrewEvent,null);
  assert.equal(out.circuit.openCircuitTick,before.openCircuitTick+1);
  assert.equal(out.circuit.playerTeam.seasonPoints,0);
  assert.equal(out.circuit.calendar.round,0);
  assert.ok(out.circuit.completedEventIds.includes(id));
  assert.equal(r.get('cash'),cash,'no refund or deduction beyond entry fee');
  r.set('proCircuit',normaliseProCircuitState(JSON.parse(JSON.stringify(out.circuit))));
  assert.match(forfeitCrewSeries(r,id).error,/NO ACTIVE/);
});
test('R594: seasonal crew forfeit uses up its official season round but gives no qualification points',()=>{
  const r=registry(),id=enter(r,true),before=r.get('proCircuit');
  const out=forfeitCrewSeries(r,id);
  assert.equal(out.error,undefined,out.error);
  assert.equal(out.circuit.activeCrewEvent,null);
  assert.equal(out.circuit.calendar.round,before.calendar.round+1);
  assert.equal(out.circuit.playerTeam.seasonPoints,0);
  assert.equal(out.circuit.playerTeam.losses,before.playerTeam.losses+1);
  assert.ok(out.circuit.calendar.history.some(e=>e.id===id));
  assert.equal(out.circuit.eventTick,before.eventTick+1);
});
test('R594: a forfeit never counts as one of two COMPLETED events clearing Sayaka cooldown',()=>{
  const r=registry(),id=enter(r);
  const consulted=useProCrewAdvice(r,id);
  assert.equal(consulted.error,undefined);
  r.set('proCircuit',consulted.circuit);
  assert.equal(getProCrewAdviceAvailability(r).remaining,3);
  const abandoned=forfeitCrewSeries(r,id);
  assert.equal(abandoned.error,undefined);
  r.set('proCircuit',abandoned.circuit);
  assert.equal(abandoned.circuit.activeCrewEvent,null);
  assert.equal(abandoned.circuit.eventTick,consulted.circuit.eventTick+1);
  assert.equal(getProCrewAdviceAvailability(r).remaining,3);
});
test('R594: Sayaka gives mixed-case spoken advice with actual driver and vehicle models',()=>{
  const r=registry(),units=getCrewSeriesUnits(r);
  for(const format of ['DUEL','RELAY','TECHNICAL','FOUR_WIDE']){
    const phrase=getProCrewHeatAdvice({format},units);
    assert.match(phrase,/^Hrmmm,/);
    assert.match(phrase,/I would try /);
    assert.match(phrase,/\([^)]+\)/,'includes short car models');
    assert.notEqual(phrase,phrase.toUpperCase());
  }
});
test('R594: entering/returning and quitting crew events use their explicit saved fixture/forfeit flows',()=>{
  const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
  const race=readFileSync(new URL('../src/scenes/FourLaneTestScene.js',import.meta.url),'utf8');
  const central=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
  const lineup=readFileSync(new URL('../src/ui/ProCrewBattleLineup.js',import.meta.url),'utf8');
  const entry=panel.slice(panel.indexOf('export function showCrewRegistration('),
    panel.indexOf('export function confirmCrewForfeit('));
  assert.doesNotMatch(entry,/overlay\(|CONFIRM ENTRY/);
  assert.match(entry,/showCrewFixture\(s\)/);
  assert.doesNotMatch(panel,/SAVE \/ RETURN TO COMPLEX/);
  assert.match(panel,/forfeitCrewSeries\(s\.registry,event\.id\)/);
  assert.match(race,/autoOpenProCrewFixture:/);
  assert.match(central,/showCrewFixture\(this\)/);
  assert.match(lineup,/function assignDriver\(id\)/);
  assert.doesNotMatch(lineup,/7 TEAM MEMBERS/);
  assert.doesNotMatch(lineup,/RACE LATER/);
});
