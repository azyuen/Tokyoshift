import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultProCircuitState,normaliseProCircuitState} from '../src/data/proCircuit.js';
import {startProfessionalSeason,forfeitProfessionalSeason} from '../src/data/proSeason.js';
import {PRO_GARAGE_ID,PRO_GARAGE_WORKSHOP,MAX_GARAGE_CAPACITY,
  normaliseCarGarageLocations,getGarageCapacity} from '../src/data/workshopProgression.js';
import {PRO_GARAGE_BAYS,stageProGarage,releaseProGarage,shouldReleaseProGarage,
  getProGarageBayCars} from '../src/data/proGarage.js';

const owned=['ef','ae86','gc8','r32'];
const initial={ef:'shinonomeWorkshop',ae86:'shinonomeCanalYard',
  gc8:'shinonomeWarehouseStrip',r32:'shinonomeWarehouseStrip'};
function fresh(){const res=startProfessionalSeason(createDefaultProCircuitState(),
  ['ef','ae86','gc8'],owned);assert.ok(res.circuit,res.error);return res.circuit;}

test('Pro Garage has three temporary bays without adding purchased garage capacity',()=>{
  assert.deepEqual(PRO_GARAGE_BAYS.map(b=>[b.number,b.drive]),
    [['04','AWD'],['05','RWD'],['06','FWD']]);
  assert.equal(PRO_GARAGE_WORKSHOP.capacity,3);
  assert.equal(PRO_GARAGE_WORKSHOP.tier,2);
  assert.equal(getGarageCapacity(2),MAX_GARAGE_CAPACITY);
});

test('registration moves exactly three registered personal cars with original garages saved',()=>{
  const c=fresh();const staged=stageProGarage(c,owned,initial,2);
  assert.ok(staged.circuit,staged.error);
  assert.deepEqual(staged.circuit.proGarageOrigins,{
    ef:initial.ef,ae86:initial.ae86,gc8:initial.gc8,
  });
  for(const id of ['ef','ae86','gc8'])assert.equal(staged.carGarageLocations[id],PRO_GARAGE_ID);
  assert.equal(staged.carGarageLocations.r32,initial.r32);
  assert.deepEqual(getProGarageBayCars(staged.circuit,owned).map(b=>b.carId),
    ['gc8','ae86','ef']);
  const reload=normaliseProCircuitState(JSON.parse(JSON.stringify(staged.circuit)));
  assert.deepEqual(reload.proGarageOrigins,staged.circuit.proGarageOrigins);
  assert.deepEqual(normaliseCarGarageLocations(owned,staged.carGarageLocations,2),
    staged.carGarageLocations);
  const second=stageProGarage(reload,owned,staged.carGarageLocations,2);
  assert.deepEqual(second.carGarageLocations,staged.carGarageLocations);
});

test('withdrawing season returns original garage assignments without losing car state',()=>{
  const staged=stageProGarage(fresh(),owned,initial,2);
  const exited=forfeitProfessionalSeason(staged.circuit);
  assert.ok(exited.circuit,exited.error);
  assert.equal(shouldReleaseProGarage(exited.circuit),true);
  const back=releaseProGarage(exited.circuit,owned,staged.carGarageLocations,2);
  assert.equal(back.changed,true);
  assert.deepEqual(back.carGarageLocations,initial);
  assert.equal(back.circuit.proGarageOrigins,null);
  assert.equal(releaseProGarage(back.circuit,owned,back.carGarageLocations,2).changed,false);
});

test('qualified season stays in paddock until championship settles; unqualified releases',()=>{
  const started=stageProGarage(fresh(),owned,initial,2).circuit;
  const finished=structuredClone(started);
  finished.seasonStatus='COMPLETE';finished.calendar.round=8;
  finished.playerDriver.seasonPoints=80;finished.playerTeam.seasonPoints=60;
  assert.equal(shouldReleaseProGarage(finished),false);
  finished.activeChampionship={completed:true,stage:'COMPLETE',id:'tokyo:s1'};
  assert.equal(shouldReleaseProGarage(finished),true);
  const unsuccessful=structuredClone(started);
  unsuccessful.seasonStatus='COMPLETE';unsuccessful.calendar.round=8;
  assert.equal(shouldReleaseProGarage(unsuccessful),true);
});

test('legacy pre-paddock seasons are unaffected',()=>{
  const old=createDefaultProCircuitState();old.seasonStatus='ACTIVE';
  old.registeredDriverCars=null;
  assert.equal(shouldReleaseProGarage(old),false);
  assert.deepEqual(getProGarageBayCars(old,owned),[]);
  assert.match(stageProGarage(old,owned,initial,2).error,/THREE REGISTERED/);
});
