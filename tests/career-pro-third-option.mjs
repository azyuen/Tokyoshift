// Career v1: the official third card must remain a real, distinct, saved event.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState,normaliseProCircuitState} from '../src/data/proCircuit.js';
import {
  PRO_SEASON_LENGTH,PRO_SEASON_CALENDAR,CREW_SERIES,
  PRO_ALT_CREW_ENTRY_FEE,PRO_ALT_CREW_PRIZES,getAlternativeProCrewFormat,
  crewSeriesEligibility,registerCrewSeries,
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
