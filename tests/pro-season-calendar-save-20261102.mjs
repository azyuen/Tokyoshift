import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultProCircuitState,normaliseProCircuitState} from '../src/data/proCircuit.js';
import {startProfessionalSeason,getProfessionalSeasonCalendar,forfeitProfessionalSeason} from '../src/data/proSeason.js';

const roster=['ef','ae86','gc8'];
test('registered season saves a stable eight-round calendar',()=>{
  const started=startProfessionalSeason(createDefaultProCircuitState(),roster,roster);
  assert.ok(started.circuit,started.error);
  const saved=normaliseProCircuitState(JSON.parse(JSON.stringify(started.circuit)));
  assert.equal(saved.seasonCalendar.season,1);
  assert.equal(saved.seasonCalendar.driver.length,8);
  assert.deepEqual(getProfessionalSeasonCalendar(saved),getProfessionalSeasonCalendar(started.circuit));
  const next=forfeitProfessionalSeason(saved);
  assert.ok(next.circuit,next.error);
  assert.equal(next.circuit.seasonCalendar,null);
  const restarted=startProfessionalSeason(next.circuit,roster,roster);
  assert.ok(restarted.circuit,restarted.error);
  assert.equal(restarted.circuit.seasonCalendar.season,2);
});
test('legacy saves and malformed permutations recover safely',()=>{
  const old=createDefaultProCircuitState();
  old.season=12;
  delete old.seasonCalendar;
  const fallback=getProfessionalSeasonCalendar(normaliseProCircuitState(old));
  assert.equal(fallback.length,8);
  const invalid={...old,seasonCalendar:{season:12,driver:[0,0,0,0,0,0,0,0],crew:[0]}};
  assert.equal(normaliseProCircuitState(invalid).seasonCalendar,null);
  assert.deepEqual(getProfessionalSeasonCalendar(normaliseProCircuitState(invalid)),fallback);
});
