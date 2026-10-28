// Career v1: the official third card must remain a real, distinct, saved event.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState,normaliseProCircuitState} from '../src/data/proCircuit.js';
import {createDefaultGameState} from '../src/state/GameState.js';
import {recruitRandomDevCrew} from '../src/data/crewSystem.js';
import {
  PRO_SEASON_LENGTH,PRO_SEASON_CALENDAR,CREW_SERIES,
  PRO_ALT_CREW_ENTRY_FEE,PRO_ALT_CREW_PRIZES,getAlternativeProCrewFormat,
  crewSeriesEligibility,registerCrewSeries,getCrewSeriesUnits,
} from '../src/data/proSeason.js';

const venue=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
const REGISTRY={
  get:key=>key==='proCircuit'?createDefaultProCircuitState():null,
};

test('all eight rounds have three defined, different playable formats',()=>{
  assert.equal(PRO_SEASON_LENGTH,8);
  assert.equal(PRO_SEASON_CALENDAR.length,8);
  for(let round=0;round<PRO_SEASON_LENGTH;round++){
    const official=PRO_SEASON_CALENDAR[round];
    const alternate=getAlternativeProCrewFormat(round);
    assert.ok(official.driver.format,'driver format missing in round '+(round+1));
    assert.ok(official.crew.format,'crew format missing in round '+(round+1));
    assert.notEqual(alternate,official.crew.format,'third card duplicates crew format');
    assert.ok(['DUEL','RELAY','TECHNICAL','FOUR_WIDE'].includes(alternate));
  }
  assert.ok(PRO_ALT_CREW_ENTRY_FEE>CREW_SERIES.entryFee);
  assert.ok(PRO_ALT_CREW_PRIZES[0]>CREW_SERIES.prizes[0]);
});

test('open circuit rejects the official-season alternative',()=>{
  assert.match(crewSeriesEligibility(REGISTRY,[],{},'alternative'),/ONLY AVAILABLE IN PRO SEASON/);
  assert.match(registerCrewSeries(REGISTRY,[],{},null,null,'alternative').error,/ONLY AVAILABLE IN PRO SEASON/);
});

test('three competition cards, registered choice and locked resume route are wired',()=>{
  const section=venue.slice(venue.indexOf('getProDragEvents() {'),venue.indexOf('drawDragComplex() {'));
  assert.match(section,/round<8&&pro.seasonStatus==='ACTIVE'\?alternateCrew:special/);
  assert.match(section,/seasonChoice:'alternative'/);
  assert.match(section,/entryFee:PRO_ALT_CREW_ENTRY_FEE/);
  assert.match(section,/prizes:\[\.\.\.PRO_ALT_CREW_PRIZES\]/);
  assert.match(panel,/pending.seasonChoice/);
  assert.match(panel,/event.seasonChoice\|\|'standard'/);
  assert.match(panel,/active\.seasonChoice\|\|'standard'/);
});

test('existing saved crew events remain standard unless explicitly alternative',()=>{
  const old={...createDefaultProCircuitState(),seasonStatus:'ACTIVE',
    activeCrewEvent:{id:'crewOpen:s1:e1',format:'DUEL',short:true}};
  const loaded=normaliseProCircuitState(old);
  assert.equal(loaded.activeCrewEvent.seasonChoice,undefined);
  assert.equal(loaded.activeCrewEvent.format,'DUEL');
});

test('alternate entry registers a distinct saved fixture and charges its fee once',()=>{
  // Production engines call Phaser math helpers during vehicle eligibility;
  // provide only the math used by the real performance-estimate code.
  globalThis.Phaser={Math:{
    Clamp:(x,min,max)=>Math.max(min,Math.min(max,x)),
    Linear:(a,b,t)=>a+(b-a)*t,
  }};
  try{
    const data=createDefaultGameState();
    data.devMode=true;data.cash=600000;data.ownedCarIds=['ae86'];
    data.selectedCarId='ae86';
    const entries=new Map(Object.entries(data));
    const source={get:k=>entries.get(k),set:(k,v)=>entries.set(k,v)};
    recruitRandomDevCrew(source,()=>0.2);
    const state=source.get('proCircuit');
    state.seasonStatus='ACTIVE';state.calendar.round=0;
    const ids=getCrewSeriesUnits(source).slice(0,3).map(u=>u.id);
    assert.equal(ids.length,3);
    const standard=registerCrewSeries(source,ids,{},null,null,'standard');
    const alternate=registerCrewSeries(source,ids,{},null,null,'alternative');
    assert.ok(standard.circuit,standard.error);
    assert.ok(alternate.circuit,alternate.error);
    assert.equal(alternate.cash,600000-PRO_ALT_CREW_ENTRY_FEE);
    assert.equal(standard.cash,600000-CREW_SERIES.entryFee);
    assert.equal(alternate.circuit.activeCrewEvent.seasonChoice,'alternative');
    assert.equal(alternate.circuit.activeCrewEvent.format,getAlternativeProCrewFormat(0));
    assert.equal(alternate.circuit.activeCrewEvent.prizes[0],PRO_ALT_CREW_PRIZES[0]);
    assert.notEqual(alternate.circuit.activeCrewEvent.id,standard.circuit.activeCrewEvent.id);
    source.set('proCircuit',normaliseProCircuitState(alternate.circuit));
    source.set('cash',alternate.cash);
    assert.ok(registerCrewSeries(source,ids,{},null,null,'alternative').error,
      'an active fixture cannot charge another fee');
    assert.equal(source.get('cash'),600000-PRO_ALT_CREW_ENTRY_FEE);
  }finally{
    delete globalThis.Phaser;
  }
});

test('factory stock driver knockouts are not discarded after successful scrutineering',()=>{
  const start=venue.slice(venue.indexOf('startProBracket(event, build, storyConfirmed = false)'));
  assert.match(start,/getProfessionalCarEligibility\(build.carId,build.state,rules\)/);
  assert.doesNotMatch(start,/rules.format !== 'KNOCKOUT' \|\| rules.stock/);
});
