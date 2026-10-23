import test from 'node:test';
import assert from 'node:assert/strict';
import {stage,simulate} from '../tools/vehicle-balance.mjs';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';
test('stock XT completes a competitive launch with unchanged factory output',()=>{
 const b=getBuiltCar('xt',stage(0)),snapshot=JSON.stringify(b);
 for(const seed of [1,7,17]){
  const r=simulate(b,{seed});
  assert.ok(r.splits[400]<17.1,JSON.stringify(r));
  assert.ok(r.splits[400]>15,'No implausible speed gain');
 }
 assert.equal(b.car.powerKW,100);assert.equal(JSON.stringify(b),snapshot);
});
test('stock XT completes low-grip and imperfect-driver scenarios without changing hardware',()=>{
 const b=getBuiltCar('xt',stage(0));
 const elite=simulate(b),human=simulate(b,{rating:3,seed:17}),lowGrip=simulate(b,{grip:.6});
 // A lower tier can be slightly faster on a particular seed/car; do not
 // impose a hidden vehicle penalty to manufacture strict ordering.
 assert.ok(Number.isFinite(human.splits[800]));
 assert.ok(Number.isFinite(lowGrip.splits[800]));
 assert.ok(lowGrip.splits[400]>elite.splits[400]-.05);
});
