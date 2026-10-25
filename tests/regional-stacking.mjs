import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ids,stage,builds,peaks} from '../tools/vehicle-balance.mjs';
import {cars} from '../src/data/cars.js';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';
import Engine from '../src/vehicles/Engine.js';
import {TUNER_SHOPS} from '../src/data/tunerShops.js';
import {buildDynoCar,getDynoPoint} from '../src/data/dyno.js';
import {parkPerformanceParts,restorePerformanceParts} from '../src/data/factorySetup.js';
const options=Object.values(TUNER_SHOPS).flatMap(s=>s.tuningOptions.map(o=>o.id));
const all=()=>({...builds().dyno,specialistTuning:[...options]});
const cached=JSON.parse(fs.readFileSync('docs/engineering/revised.json'));
test('all 43 stock and standard/dyno outputs stay unchanged',()=>{
 for(const row of cached){const state=builds()[row.build];const b=getBuiltCar(row.id,state),p=peaks(b.car,b.engine);
 assert.ok(Math.abs(p.powerKW-row.powerKW)<.001,row.id+'/'+row.build);
 assert.ok(Math.abs(p.torqueNm-row.torqueNm)<.001,row.id+'/'+row.build);}
});
for(const id of ids)test(id+' regional stack is bounded, save-safe and consistent with dyno',()=>{
 const state=all(),saved=JSON.stringify(state),base=getBuiltCar(id,builds().dyno),b=getBuiltCar(id,state);
 const p=peaks(b.car,b.engine);assert.ok(p.powerKW>=peaks(base.car,base.engine).powerKW-1e-6,id);
 const reverse=getBuiltCar(id,{...state,specialistTuning:[...options].reverse()});
 assert.deepEqual(b.engine,reverse.engine);
 assert.equal(b.car.maximumBoost,reverse.car.maximumBoost);
 assert.ok(b.car.maximumBoost<=base.car.maximumBoost+.080001);
 assert.ok(b.engine.redlineRPM<=base.engine.redlineRPM*1.025+1);
 assert.ok(Math.abs(p.powerKW-b.car.powerKW)<1);
 const d=buildDynoCar(id,state);assert.ok(Math.abs(getDynoPoint(d,p.peakRPM,b.car.maximumBoost).powerKW-p.powerKW)<.01);
 const plain=structuredClone(b.engine);delete plain.specialistRefinement;
 const normal=new Engine(plain),regional=new Engine(b.engine),h=b.engine.specialistRefinement;
 for(let rpm=b.engine.idleRPM;rpm<=b.engine.redlineRPM;rpm+=100){
  normal.rpm=regional.rpm=rpm;const t=normal.combustionTorque(1,b.car.maximumBoost),r=regional.combustionTorque(1,b.car.maximumBoost);
  const capacity=Math.min(h.torqueCapacity,h.powerCapacity*30000/(Math.PI*rpm));
  assert.ok(r>=t-1e-8&&r<=Math.max(t,capacity)+1e-8,id+' capacity at '+rpm);
 }
 const duplicate=getBuiltCar(id,{...state,specialistTuning:[...options,...options]});assert.deepEqual(b.engine,duplicate.engine);
 const restored=restorePerformanceParts(JSON.parse(JSON.stringify(parkPerformanceParts(state))));
 assert.deepEqual(restored.specialistTuning,state.specialistTuning);
 assert.deepEqual(getBuiltCar(id,restored).engine,b.engine);
 assert.equal(JSON.stringify(state),saved);
 // More purchased regional packages cannot reduce peak engine power.
 let previous=peaks(base.car,base.engine).powerKW;
 for(let n=1;n<=options.length;n++){const next=getBuiltCar(id,{...state,specialistTuning:options.slice(0,n)});const power=peaks(next.car,next.engine).powerKW;assert.ok(power>=previous-1e-6,id+' purchase '+n);previous=power;}
});
test('boost refinements do not bypass missing internal/fuel/cooling support',()=>{
 for(const id of ids){const s=stage(0);s.tuning.turbo=3;const a=getBuiltCar(id,s),b=getBuiltCar(id,{...s,specialistTuning:options});assert.equal(a.car.maximumBoost,b.car.maximumBoost,id);assert.equal(a.engine.redlineRPM,b.engine.redlineRPM,id);}
});
test('collector/hero builds stay sealed and unchanged even with legacy purchased fields',()=>{
 for(const [id,c] of Object.entries(cars))if(c.collector||c.tuningLocked){assert.deepEqual(getBuiltCar(id,{}),getBuiltCar(id,all()),id);}
});
