import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD_PHASE_DURATION_MS,WORLD_FULL_DAY_MS,OPEN_CIRCUIT_ROTATION_MS,
  getOpenCircuitRotation,getWorldPhase,
} from '../src/environment/WorldClock.js';
import {createDefaultProCircuitState,PRO_CIRCUIT_TROPHIES} from '../src/data/proCircuit.js';
import {createDefaultGameState} from '../src/state/GameState.js';
import {recruitRandomDevCrew} from '../src/data/crewSystem.js';
import {
  getOpenCircuitTrophy,getOpenCircuitCrewFormat,
  registerCrewSeries,getCrewSeriesUnits,finishOpenCircuitEvent,getCrewFixture,
} from '../src/data/proSeason.js';

test('R592: WorldClock creates six five-minute slots per full day/night and one trophy cycle',()=>{
 const epoch=1234500000;
 const store=new Map([['tokyoShiftWorldCycleEpochV1',String(epoch)]]);
 globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 assert.equal(WORLD_PHASE_DURATION_MS,15*60*1000);
 assert.equal(WORLD_FULL_DAY_MS,30*60*1000);
 assert.equal(OPEN_CIRCUIT_ROTATION_MS,5*60*1000);
 const slots=[0,1,2,3,4,5].map(i=>getOpenCircuitRotation(epoch+i*OPEN_CIRCUIT_ROTATION_MS));
 assert.deepEqual(slots.map(s=>s.slotIndex),[0,1,2,3,4,5]);
 assert.ok(slots.every(s=>s.dayIndex===0));
 assert.deepEqual(slots.map(s=>s.rotationIndex),[0,1,2,3,4,5]);
 assert.ok(slots.every(s=>s.nextTrophyAt===epoch+WORLD_FULL_DAY_MS));
 assert.equal(getWorldPhase(epoch),'night');
 assert.equal(getWorldPhase(epoch+WORLD_PHASE_DURATION_MS),'day');
 const next=getOpenCircuitRotation(epoch+WORLD_FULL_DAY_MS);
 assert.equal(next.dayIndex,1);
 assert.equal(next.slotIndex,0);
 assert.equal(next.rotationIndex,6);
 assert.equal(next.nextTrophyAt,epoch+2*WORLD_FULL_DAY_MS);
 delete globalThis.localStorage;
});

test('R592: daily trophy changes only once per full day and some days show no trophy event',()=>{
 const c=createDefaultProCircuitState();
 c.season=3;
 c.trophyWins.shutoSpeed=1;
 c.trophyWins.tokyoTechnical=1;
 const slots=Array.from({length:6},(_,slotIndex)=>({dayIndex:0,slotIndex,
   rotationIndex:slotIndex}));
 assert.deepEqual([...new Set(slots.map(rot=>getOpenCircuitTrophy(c,rot).id))].length,1);
 assert.equal(getOpenCircuitTrophy(c,slots[0]).scheduled,true);
 const next=getOpenCircuitTrophy(c,{dayIndex:1,slotIndex:0,rotationIndex:6});
 assert.notEqual(next.id,getOpenCircuitTrophy(c,slots[0]).id);
 const dayOff=getOpenCircuitTrophy(c,{dayIndex:3,slotIndex:0,rotationIndex:18});
 assert.equal(dayOff.scheduled,false);
 assert.equal(dayOff.available,false);
 const following=getOpenCircuitTrophy(c,{dayIndex:4,slotIndex:0,rotationIndex:24});
 assert.equal(following.scheduled,true);
 assert.ok(PRO_CIRCUIT_TROPHIES.some(t=>t.id===following.id));
});

test('R592: open crew format changes with the offered slot and locks when the event is registered',()=>{
 const data={...createDefaultGameState(),devMode:true,cash:400000};
 const values=new Map(Object.entries(data));
 const s={get:k=>values.get(k),set:(k,v)=>values.set(k,v)};
 recruitRandomDevCrew(s,()=>.2);
 const roster=getCrewSeriesUnits(s).map(u=>u.id);
 const offered={dayIndex:0,slotIndex:1,rotationIndex:1};
 assert.equal(getOpenCircuitCrewFormat(offered),'RELAY');
 assert.equal(getOpenCircuitCrewFormat({...offered,rotationIndex:2}),'TECHNICAL');
 const registered=registerCrewSeries(s,roster,{},null,offered);
 assert.equal(registered.error,undefined,registered.error);
 assert.equal(registered.circuit.activeCrewEvent.format,'RELAY');
 s.set('proCircuit',registered.circuit);
 assert.equal(getCrewFixture(s.get('proCircuit')).format,'RELAY');
 // In-progress race remains a relay even as the next public slot becomes technical.
 assert.equal(getCrewFixture(s.get('proCircuit')).format,'RELAY');
});

test('R592: finishing saved trophy after a daily rotation awards its originally registered trophy',()=>{
 let c=createDefaultProCircuitState();
 c.season=3;
 c.trophyWins.shutoSpeed=1;
 c.trophyWins.tokyoTechnical=1;
 const t=getOpenCircuitTrophy(c,{dayIndex:1,slotIndex:0,rotationIndex:6});
 const prev=c.trophyWins[t.id];
 c=finishOpenCircuitEvent(c,{id:'saved:trophy:rotating',placing:1,trophyId:t.id});
 assert.equal(c.trophyWins[t.id],prev+1);
 assert.equal(c.trophyHistory.at(-1).trophyId,t.id);
 assert.equal(c.calendar.round,0);
});
