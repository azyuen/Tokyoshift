import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultGameState} from '../src/state/GameState.js';
import {recruitRandomDevCrew} from '../src/data/crewSystem.js';
import {
  getCrewSeriesUnits,registerCrewSeries,forfeitCrewSeries,
  useProCrewAdvice,getProCrewAdviceAvailability,
} from '../src/data/proSeason.js';
import {
  consumeDriverAdvice,driverAdviceStatus,forfeitOpenDriverTransaction,
} from '../src/data/proDriverBriefing.js';

const ui=readFileSync(new URL('../src/ui/ProDriverBriefing.js',import.meta.url),'utf8');
const chrome=readFileSync(new URL('../src/ui/ProBriefingChrome.js',import.meta.url),'utf8');
function registry() {
  const m=new Map(Object.entries({...createDefaultGameState(),devMode:true,cash:10000000}));
  const r={get:k=>m.get(k),set:(key,value)=>m.set(key,value)};
  recruitRandomDevCrew(r,()=>.2);
  return r;
}
function crewEnter(r) {
  const lineup=getCrewSeriesUnits(r).map(u=>u.id);
  const out=registerCrewSeries(r,lineup);
  assert.equal(out.error,undefined,out.error);
  r.set('cash',out.cash);r.set('proCircuit',out.circuit);
  return out.circuit.activeCrewEvent.id;
}
function driverState(c,index) {
  return {
    active:true,proEvent:true,openCircuit:true,openTrophyId:null,
    eventId:'streetShootout',playerCarId:'ae86',
    proSeasonId:'open:streetShootout:r602:'+index,
    roundIndex:0,rounds:[
      {carId:'r32',characterId:'aiOne',encounterRating:3},
      {carId:'galant',characterId:'aiTwo',encounterRating:3},
      {carId:'s2000',characterId:'aiThree',encounterRating:3},
    ],prizeCash:57000,
  };
}

test('R602: shared cooldown applies across crew and driver series, including forfeits',()=>{
  const r=registry();
  const id=crewEnter(r);
  const used=useProCrewAdvice(r,id);
  assert.equal(used.error,undefined,used.error);
  r.set('proCircuit',used.circuit);
  assert.equal(used.circuit.crewAdviceCooldownUntil,used.circuit.eventTick+3);
  const first=forfeitCrewSeries(r,id);
  assert.equal(first.error,undefined,first.error);
  r.set('proCircuit',first.circuit);
  assert.equal(first.circuit.eventTick,used.circuit.eventTick+1);
  assert.equal(first.circuit.crewAdviceCooldownUntil,used.circuit.crewAdviceCooldownUntil);
  assert.equal(getProCrewAdviceAvailability(r).remaining,2);

  const driver=driverState(first.circuit,1);
  assert.equal(driverAdviceStatus(first.circuit,driver).available,false);
  const second=forfeitOpenDriverTransaction(first.circuit,driver,{});
  assert.equal(second.error,undefined,second.error);
  r.set('proCircuit',second.changes.proCircuit);
  assert.equal(second.changes.proCircuit.eventTick,first.circuit.eventTick+1);
  assert.equal(driverAdviceStatus(second.changes.proCircuit,driver).remaining,1);
  assert.equal(second.changes.proCircuit.crewAdviceCooldownUntil,used.circuit.crewAdviceCooldownUntil);

  const thirdId=crewEnter(r);
  assert.match(useProCrewAdvice(r,thirdId).error,/1 MORE/);
  const third=forfeitCrewSeries(r,thirdId);
  assert.equal(third.error,undefined,third.error);
  r.set('proCircuit',third.circuit);
  assert.equal(third.circuit.eventTick,used.circuit.eventTick+3);
  assert.equal(third.circuit.crewAdviceCooldownUntil,used.circuit.crewAdviceCooldownUntil);

  const following=driverState(third.circuit,2);
  assert.equal(driverAdviceStatus(third.circuit,following).available,true);
  const consult=consumeDriverAdvice(third.circuit,following);
  assert.equal(consult.error,undefined,consult.error);
  assert.equal(consult.circuit.crewAdviceCooldownUntil,third.circuit.eventTick+3);
  assert.equal(consult.competitionState.briefingAdviceUsed,true);
  assert.match(consumeDriverAdvice(consult.circuit,consult.competitionState).error,/ALREADY USED/);
});
test('R602: layouts and dialogue use glowing toggles without X close controls',()=>{
  assert.match(ui,/safeCarPreview\(state\.playerCarId,660,474,744,207,carState,true\)/);
  assert.match(ui,/key:'proDriverDaichi',x:193/);
  assert.match(ui,/workshopHotspot\(190,576,229,44,'DAICHI \/\/ TUNE'/);
  assert.match(ui,/poly\(52,643,654,164/);
  assert.match(ui,/border\.lineStyle\(4,0x050a10,1\)/);
  assert.match(ui,/clipPortrait\(profile\)/);
  assert.match(ui,/safeCarPreview\(round\.carId,545,743,211,225/);
  assert.match(chrome,/x:850,y:24,w:674,h:222/);
  assert.match(chrome,/triangleHeight=Math\.sqrt\(3\)\*triangleSide\/2/);
  assert.match(ui,/const x=558,y=405,w=470,h=146/);
  assert.match(ui,/const triangleBase=36/);
  assert.doesNotMatch(ui,/on\('pointerdown',clearDialogue\)/);
  assert.doesNotMatch(ui,/bubbleText\([^\n]*'×'/);
  assert.match(ui,/key:'proDriverHiroshi'[^\n]*onTap:null/);
  assert.match(ui,/key:'proDriverSayaka'[^\n]*onTap:null/);
  assert.match(ui,/if\(activeDialogue===which\)\{clearDialogue\(\);return;\}/);
});
