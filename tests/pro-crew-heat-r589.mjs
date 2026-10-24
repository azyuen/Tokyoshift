import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultGameState} from '../src/state/GameState.js';
import {recruitRandomDevCrew} from '../src/data/crewSystem.js';
import {normaliseProCircuitState} from '../src/data/proCircuit.js';
import {
  OPEN_CIRCUIT_CREW_FEE,getCrewSeriesUnits,registerCrewSeries,getCrewFixture,
  preparePlayerCrewFixture,getPlayerCrewHeat,settlePlayerCrewHeat,
  settleCrewSeriesFixture,useProCrewAdvice,
} from '../src/data/proSeason.js';
import {getProCrewHeatAdvice} from '../src/ui/ProCrewBattleLineup.js';

const source=()=>{
  const state=createDefaultGameState();
  const data={...state,devMode:true,cash:2500000,proCircuit:normaliseProCircuitState(state.proCircuit)};
  const m=new Map(Object.entries(data));
  const s={get:key=>m.get(key),set:(key,value)=>m.set(key,value)};
  recruitRandomDevCrew(s,()=>0.2);
  return s;
};
const completeFixture=(s,ids)=>{
  const f=getCrewFixture(s.get('proCircuit'));
  const prepared=preparePlayerCrewFixture(s,ids,f.id);
  assert.equal(prepared.error,undefined,prepared.error);
  s.set('proCircuit',prepared.circuit);
  for(let i=0;i<3;i++){
    const heat=getPlayerCrewHeat(s.get('proCircuit'));
    const result=settlePlayerCrewHeat(s.get('proCircuit'),heat.id,[
      {id:'player',finishSeconds:10,disqualified:false},
      {id:'ai-1',finishSeconds:11,disqualified:false},
    ]);
    assert.equal(result.status,'CREW_HEAT');
    s.set('proCircuit',result.circuit);
  }
  const end=settleCrewSeriesFixture(s.get('proCircuit'),f.id);
  assert.ok(['ADVANCED','COMPLETE'].includes(end.status));
  s.set('proCircuit',end.circuit);
  return end;
};
test('R589: seven-member team enters once without five-driver registration',()=>{
  const s=source();
  const units=getCrewSeriesUnits(s),ids=units.map(u=>u.id);
  assert.equal(ids.length,7);
  const starting=s.get('cash');
  const out=registerCrewSeries(s,ids);
  assert.equal(out.error,undefined,out.error);
  assert.equal(out.circuit.activeCrewEvent.squadIds.length,7);
  assert.equal(out.cash,starting-OPEN_CIRCUIT_CREW_FEE);
  s.set('proCircuit',out.circuit);s.set('cash',out.cash);
  assert.equal(registerCrewSeries(s,ids).error!==undefined,true,'cannot pay twice');
  const f=getCrewFixture(out.circuit);
  assert.equal(f.round,0);
  assert.match(getProCrewHeatAdvice(f,units),/Hrmmm/);
  assert.match(getProCrewHeatAdvice(f,units),/\([^)]+\)/,
    'Sayaka recommends named drivers with short car models');
  assert.match(preparePlayerCrewFixture(s,ids.slice(0,2),f.id).error,/THREE/);
  assert.match(preparePlayerCrewFixture(s,[ids[0],ids[0],ids[1]],f.id).error,/THREE/);
  assert.equal(preparePlayerCrewFixture(s,[ids[0],ids[1],ids[2]],f.id).error,undefined);
});

test('R589: Sayaka can be consulted only once per paid event, even after state reload',()=>{
  const s=source(),ids=getCrewSeriesUnits(s).map(u=>u.id);
  const first=registerCrewSeries(s,ids);s.set('proCircuit',first.circuit);
  const id=first.circuit.activeCrewEvent.id;
  const used=useProCrewAdvice(s,id);
  assert.equal(used.error,undefined,used.error);
  assert.equal(used.circuit.activeCrewEvent.adviceUsed,true);
  s.set('proCircuit',normaliseProCircuitState(JSON.parse(JSON.stringify(used.circuit))));
  assert.match(useProCrewAdvice(s,id).error,/ALREADY USED/);
  assert.match(useProCrewAdvice(s,'wrong-id').error,/NO LONGER AVAILABLE/);
  assert.equal(s.get('proCircuit').activeCrewEvent.adviceUsed,true);
  // Reading the fixture after advice does not consume or reset the flag.
  assert.ok(getCrewFixture(s.get('proCircuit')));
  assert.equal(s.get('proCircuit').activeCrewEvent.adviceUsed,true);
});

test('R589: legacy five-member entries still work and keep their saved limitation',()=>{
  const s=source(),ids=getCrewSeriesUnits(s).map(u=>u.id);
  const out=registerCrewSeries(s,ids.slice(0,5));
  assert.equal(out.error,undefined,out.error);
  assert.equal(out.circuit.activeCrewEvent.squadIds.length,5);
  s.set('proCircuit',out.circuit);
  const f=getCrewFixture(out.circuit);
  assert.match(preparePlayerCrewFixture(s,[ids[0],ids[1],ids[6]],f.id).error,/REGISTERED/);
});

test('R589: long professional trophy can choose a new trio on its next fixture',()=>{
  const s=source(),c=s.get('proCircuit'),units=getCrewSeriesUnits(s),ids=units.map(u=>u.id);
  c.minorTrophyIndex=3; // Team Grand Prix, three actual fixtures
  c.season=2; // prestige trophy is unlocked from Season 2
  s.set('proCircuit',c);
  const entry=registerCrewSeries(s,ids,{},'teamGrandPrix');
  assert.equal(entry.error,undefined,entry.error);
  assert.equal(entry.circuit.activeCrewEvent.short,false);
  s.set('proCircuit',entry.circuit);s.set('cash',entry.cash);
  const advice=useProCrewAdvice(s,entry.circuit.activeCrewEvent.id);
  s.set('proCircuit',advice.circuit);
  const paid=s.get('cash');
  const first=completeFixture(s,ids.slice(0,3));
  assert.equal(first.status,'ADVANCED');
  assert.equal(s.get('cash'),paid);
  assert.equal(s.get('proCircuit').activeCrewEvent.adviceUsed,true);
  const later=getCrewFixture(s.get('proCircuit'));
  const second=preparePlayerCrewFixture(s,[ids[4],ids[5],ids[6]],later.id);
  assert.equal(second.error,undefined,second.error);
  assert.deepEqual(second.fixture.lineup,[ids[4],ids[5],ids[6]]);
  assert.equal(second.circuit.activeCrewEvent.adviceUsed,true);
});
