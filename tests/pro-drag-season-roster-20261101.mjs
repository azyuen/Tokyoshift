import test from 'node:test';
import { createFourWideTournament } from '../src/data/proTournament.js';
import assert from 'node:assert/strict';
import { createDefaultProCircuitState, normaliseProCircuitState } from '../src/data/proCircuit.js';
import {
  PRO_DRIVER_DRIVETRAINS,getProDriverDrivetrain,validateProSeasonDriverCars,
  getProSeasonDriverCarError,startProfessionalSeason,forfeitProfessionalSeason,
  registerProfessionalTimedEvent,
} from '../src/data/proSeason.js';

const roster=['ef','ae86','gc8'];

test('season registration requires one owned FF/FWD, RWD and AWD personal car',()=>{
  assert.deepEqual(PRO_DRIVER_DRIVETRAINS,['FWD','RWD','AWD']);
  assert.deepEqual(roster.map(getProDriverDrivetrain),PRO_DRIVER_DRIVETRAINS);
  assert.equal(validateProSeasonDriverCars(roster,roster),null);
  assert.match(validateProSeasonDriverCars([],roster),/EXACTLY THREE/);
  assert.match(validateProSeasonDriverCars(['ef','ae86','ef'],roster),/EXACTLY THREE/);
  assert.match(validateProSeasonDriverCars(roster,['ef','ae86']),/OWNED/);
  assert.match(validateProSeasonDriverCars(['ef','ek9','gc8'],['ef','ek9','gc8']),/ONE FF/);
  assert.match(startProfessionalSeason(createDefaultProCircuitState()).error,/EXACTLY THREE/);
});

test('committed roster persists after reload and excludes all unregistered driver cars',()=>{
  const next=startProfessionalSeason(createDefaultProCircuitState(),roster,roster);
  assert.ok(next.circuit,next.error);
  const c=normaliseProCircuitState(JSON.parse(JSON.stringify(next.circuit)));
  assert.equal(c.seasonStatus,'ACTIVE');
  assert.deepEqual(c.registeredDriverCars,roster);
  for(const id of roster)assert.equal(getProSeasonDriverCarError(c,id),null);
  assert.match(getProSeasonDriverCarError(c,'fc3s'),/REGISTERED/);
  // Round 2 is a timed, RWD-only event; the registration layer must reject
  // an unregistered RWD even if it would otherwise satisfy scrutineering.
  c.calendar.round=1;
  assert.match(registerProfessionalTimedEvent(c,'fc3s',0,{}).error,/REGISTERED/);
  const forfeit=forfeitProfessionalSeason(c);
  assert.ok(forfeit.circuit,forfeit.error);
  assert.equal(forfeit.circuit.registeredDriverCars,null);
});

test('older in-progress seasons without a saved car roster remain playable',()=>{
  const legacy=createDefaultProCircuitState();
  legacy.seasonStatus='ACTIVE';
  legacy.calendar.round=3;
  delete legacy.registeredDriverCars;
  const migrated=normaliseProCircuitState(legacy);
  assert.equal(migrated.registeredDriverCars,null);
  assert.equal(getProSeasonDriverCarError(migrated,'fc3s'),null);
});


test('Four Wide cup rejects unregistered individual car IDs at tournament creation',()=>{
  const started=startProfessionalSeason(createDefaultProCircuitState(),roster,roster);
  assert.ok(started.circuit,started.error);
  started.circuit.calendar.round=2; // official Four Wide round
  assert.equal(createFourWideTournament(started.circuit,'fc3s'),null);
  const approved=createFourWideTournament(started.circuit,'ae86');
  assert.ok(approved);
  assert.equal(approved.carId,'ae86');
});

test('the driver trio survives normalisation without restricting crew state',()=>{
  const c=startProfessionalSeason(createDefaultProCircuitState(),roster,roster).circuit;
  const stored={...c,activeCrewEvent:{id:'crew:fixture',squadIds:['one','two','three','four','five','six','seven']}};
  const reloaded=normaliseProCircuitState(stored);
  assert.deepEqual(reloaded.registeredDriverCars,roster);
  assert.equal(reloaded.activeCrewEvent.squadIds.length,7);
});
