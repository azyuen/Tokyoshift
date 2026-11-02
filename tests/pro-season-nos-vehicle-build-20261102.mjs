import test from 'node:test';
import assert from 'node:assert/strict';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';

test('NOS master switch removes race nitrous without uninstalling parts',()=>{
  const fitted={nosInstalled:true,nosPower:50,nosShots:3,exhaustNosTuning:{nosKit:3,nitrousShot:2}};
  const enabled=getBuiltCar('ae86',fitted);
  const disabled=getBuiltCar('ae86',{...fitted,nosEnabled:false});
  assert.ok(enabled&&disabled);
  assert.ok(Number(enabled.car.nosShots)>0);
  assert.equal(disabled.car.nosShots,0);
  assert.equal(disabled.car.nosPower,0);
  assert.equal(fitted.exhaustNosTuning.nosKit,3);
});

test('collector NOS is usable while all non-NOS collector tuning remains sealed',()=>{
  const base={collector:true,tuningLocked:true,exhaustNosTuning:{nosKit:2,nitrousShot:2},nosPower:50,nosShots:2};
  // The collector-specific branch also applies when a stock model is
  // explicitly sealed in saved state.
  const enabled=getBuiltCar('ae86',base);
  const disabled=getBuiltCar('ae86',{...base,nosEnabled:false});
  assert.ok(enabled&&disabled);
  assert.equal(enabled.car.nosShots,2);
  assert.equal(disabled.car.nosShots,0);
});
