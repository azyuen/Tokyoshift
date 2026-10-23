import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getBuiltCar,buildCarFromState} from '../src/vehicles/VehiclePerformance.js';
import {cars} from '../src/data/cars.js';
import {engines} from '../src/data/engines.js';
import {ids,stage} from '../tools/vehicle-balance.mjs';
import {TUNER_SHOPS} from '../src/data/tunerShops.js';
import {boostSupportMessage} from '../src/data/engineeringFeedback.js';
const source=fs.readFileSync('src/scenes/GarageScene.js','utf8');
const method=source.split('  getEnginePreviewBuild() {')[1].split('\n  refreshEngineMode()')[0];
const scene=Function('cars','engines','buildCarFromState','return {getEnginePreviewBuild() {'+method+'}')(cars,engines,buildCarFromState);
test('engine purchase previews match complete race builds for all 43 cars',()=>{
 for(const id of ids)for(const n of [0,1,2,3]){
  const state={...stage(3),stage3Calibration:{ecuBias:1,boostBias:-1,gearBias:1}},before=JSON.stringify(state);
  scene.selectedCarId=id;scene.registry={get:()=>({[id]:state})};scene.pendingEngineTuning=stage(n).tuning;
  const {preview}=scene.getEnginePreviewBuild(),expected=getBuiltCar(id,{...state,tuning:scene.pendingEngineTuning,engineTuning:scene.pendingEngineTuning,stock:false});
  assert.deepEqual(preview,expected,id);assert.equal(JSON.stringify(state),before);
 }
});
test('regional specialist upgrades remain included exactly once in purchase preview',()=>{
 for(const shop of Object.values(TUNER_SHOPS)){
  const state={...stage(3),specialistTuning:shop.tuningOptions.map(o=>o.id)};
  scene.selectedCarId=shop.donorCarId;scene.registry={get:()=>({[shop.donorCarId]:state})};scene.pendingEngineTuning=state.tuning;
  assert.deepEqual(scene.getEnginePreviewBuild().preview,getBuiltCar(shop.donorCarId,{...state,engineTuning:state.tuning,stock:false}));
 }
});
test('unsupported turbo identifies supporting hardware; full support increases available boost',()=>{
 for(const id of ids){
  const bare=stage(0);bare.tuning.turbo=3;
  const a=getBuiltCar(id,bare).car.engineering,b=getBuiltCar(id,stage(3)).car.engineering;
  assert.ok(a.requestedBoost>a.availableBoost,id);assert.notEqual(a.limitingHardware,'none',id);
  assert.ok(b.availableBoost>=a.availableBoost,id);
 }
 assert.match(source,/boostSupportMessage\(preview.car, this.pendingEngineTuning\)/);
});
test('support advice never recommends upgrading an already maximum-level component',()=>{
 for(const id of ids){
  const state=stage(3),car=getBuiltCar(id,state).car;
  assert.doesNotMatch(boostSupportMessage(car,state.tuning),/upgrade/);
  const bare=stage(0);bare.tuning.turbo=3;
  assert.match(boostSupportMessage(getBuiltCar(id,bare).car,bare.tuning),/upgrade/);
 }
});
