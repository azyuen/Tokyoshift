import test from 'node:test';
import assert from 'node:assert/strict';
import {cars,carOrder} from '../src/data/cars.js';
import {engines} from '../src/data/engines.js';
import {ENGINE_ENGINEERING} from '../src/data/vehicleEngineering.js';
import {getBuiltCar,calculatePerformanceIndex} from '../src/vehicles/VehiclePerformance.js';
import {buildDynoCar,getDynoPoint} from '../src/data/dyno.js';
import {stockClassFor} from '../src/data/stockClasses.js';
import {isPerformanceStockState,getCrewRecruitmentChallengeRules} from '../src/data/crewSystem.js';
import {parkPerformanceParts,restorePerformanceParts} from '../src/data/factorySetup.js';
import {registerOwnedCarInstance} from '../src/data/carOwnership.js';
import {normaliseState,createDefaultGameState} from '../src/state/GameState.js';
import {ids,stage,peaks,simulate} from '../tools/vehicle-balance.mjs';
const original=JSON.stringify({cars,engines});
test('43 canonical engines have valid stock power, torque, gearing and classes',()=>{
 assert.equal(ids.length,43);assert.equal(new Set(ids).size,43);
 for(const id of ids){const c=cars[id],e=engines[c.engine],b=getBuiltCar(id,stage(0)),p=peaks(b.car,b.engine);
  assert.ok(ENGINE_ENGINEERING[c.engine],id);assert.ok(c.gearRatios.every(x=>Number.isFinite(x)&&x>0),id);
  assert.ok(e.redlineRPM>e.idleRPM&&c.vehicleMassKg>500,id);
  assert.ok(Math.abs(p.powerKW-c.powerKW)<c.powerKW*.01,id+' factory kW');
  assert.ok(Math.abs(p.torqueNm-c.torqueNm)<c.torqueNm*.01,id+' factory Nm');assert.ok(stockClassFor(c),id);
 }
});
for(const id of ids)test(id+' progression, display, dyno and immutable input',()=>{
 let previous=0;for(let n=0;n<=3;n++){
  const s=stage(n),saved=JSON.stringify(s),b=getBuiltCar(id,s),p=peaks(b.car,b.engine),d=buildDynoCar(id,s);
  assert.ok(p.powerKW>=previous-.5,id+' progression');previous=p.powerKW;
  assert.ok(Math.abs(p.powerKW-b.car.powerKW)<1,id+' display kW');
  assert.ok(Math.abs(p.torqueNm-b.car.torqueNm)<1,id+' display Nm');
  assert.ok(Math.abs(getDynoPoint(d,p.peakRPM,b.car.maximumBoost||0).powerKW-p.powerKW)<.01,id+' dyno kW');assert.equal(JSON.stringify(s),saved);
 }
});
test('all individual workshop upgrade paths produce valid builds',()=>{
 for(const id of ids)for(const group of Object.keys(stage(0)))for(const part of Object.keys(stage(0)[group]))for(let n=1;n<=3;n++){
  const s=stage(0);s[group][part]=n;const b=getBuiltCar(id,s);assert.ok(Number.isFinite(b.car.powerKW)&&b.car.powerKW>0,id+'/'+part+'/'+n);assert.ok(b.car.vehicleMassKg>500&&b.car.tyreGrip>0);
 }
});
test('supporting hardware controls boost; small NA conversions retain lower absolute power than RB26/2JZ builds',()=>{
 for(const id of ids){const bare=stage(0);bare.tuning.turbo=3;assert.ok(getBuiltCar(id,bare).car.maximumBoost<=getBuiltCar(id,stage(3)).car.maximumBoost,id);}
 assert.ok(getBuiltCar('dc2',stage(3)).car.powerKW<getBuiltCar('r34',stage(3)).car.powerKW);
 assert.ok(getBuiltCar('s2000',stage(3)).car.powerKW<getBuiltCar('jza80',stage(3)).car.powerKW);
});
test('stock eligibility rejects active/legacy performance and permits inactive presets/cosmetics',()=>{
 assert.ok(isPerformanceStockState({stock:false,paintColor:123,visualMods:{rims:3},savedPresets:[stage(3)]}));
 for(const state of [{tuneLevel:1},{engineTuning:{internals:'1'}},{tuning:{engine:1}},{drivetrainTuning:{launchSetup:1}},{chassisTuning:{tyres:1}},{exhaustNosTuning:{nosKit:1}},{nosInstalled:true},{nosPower:20},{nosShots:1},{nosCapacitySeconds:1},{stage3Calibration:{ecuBias:-1}},{specialistTuning:['test']},{immutable:true},{collector:true}])assert.equal(isPerformanceStockState(state),false,JSON.stringify(state));
});
test('all 42 models require same factory class on all difficulties with multiple eligible choices',()=>{
 const source={ownedCarIds:[...ids,...Object.keys(cars).filter(id=>cars[id].collector)],carStates:{}};
 for(const difficulty of ['EASY','STANDARD','HARD'])for(const id of carOrder){const r=getCrewRecruitmentChallengeRules({...source,playerDifficulty:difficulty},{baseCarId:id});assert.equal(r.carRule,'STOCK');assert.ok(r.eligibleCarIds.length>=2,id);
  for(const candidate of r.eligibleCarIds){assert.ok(carOrder.includes(candidate));assert.equal(stockClassFor(cars[candidate]),stockClassFor(cars[id]));}
  assert.ok(!getCrewRecruitmentChallengeRules({...source,playerDifficulty:difficulty,carStates:{[id]:{tuneLevel:1}}},{baseCarId:id}).eligibleCarIds.includes(id));
 }
});
test('duplicate instances retain classes but cannot bypass NOS restrictions',()=>{
 registerOwnedCarInstance('r34__copy_engineering','r34');const s={ownedCarIds:['r34__copy_engineering'],carStates:{}};
 assert.deepEqual(getCrewRecruitmentChallengeRules(s,{baseCarId:'r34'}).eligibleCarIds,s.ownedCarIds);
 s.carStates[s.ownedCarIds[0]]={nosInstalled:true};assert.equal(getCrewRecruitmentChallengeRules(s,{baseCarId:'r34'}).eligibleCarIds.length,0);
});
test('parking/restoring preserves purchases, calibration and saved presets through JSON',()=>{
 const state={...stage(2),engineTuning:{engine:1},tuneLevel:4,nosInstalled:true,nosPower:35,stage3Calibration:{ecuBias:-1},specialistTuning:['one'],paintColor:123,savedPresets:[stage(3)]};
 const before=JSON.stringify(state),parked=JSON.parse(JSON.stringify(parkPerformanceParts(state)));assert.ok(isPerformanceStockState(parked));assert.equal(JSON.stringify(state),before);
 const restored=restorePerformanceParts(parked);for(const k of Object.keys(state))assert.deepEqual(restored[k],state[k],k);
 parked.tuning={engine:3};assert.equal(restorePerformanceParts(parked).tuning.engine,3);assert.equal(restorePerformanceParts(parked).tuning.turbo,2);
});
test('PI matches independent 120Hz runs within 3 percent',()=>{
 for(const id of ['ae86','ek9','dc2','r34','jza80','rx7fd','nsx','magna'])for(const n of [0,3]){
  const b=getBuiltCar(id,stage(n)),p=calculatePerformanceIndex(b.car,b.engine),s=simulate(b),r=simulate(b,{speed:60});
  assert.ok(Math.abs(p.simulation.standingSeconds/s.splits[400]-1)<.03,id+' standing');assert.ok(Math.abs(p.simulation.rollingSeconds/r.splits[400]-1)<.03,id+' rolling');
 }
});
test('catalogue data remain immutable after builds',()=>assert.equal(JSON.stringify({cars:Object.fromEntries(Object.entries(cars).filter(([id])=>id!=='r34__copy_engineering')),engines}),original));
test('actual profile migration preserves parked hardware, copies, presets and career state',()=>{
 registerOwnedCarInstance('r34__copy_save','r34');
 const s={...createDefaultGameState(),firstName:'Engineering',lastName:'Fixture',wins:90,cash:123456,ownedCarIds:['ae86','r34__copy_save'],selectedCarId:'r34__copy_save',carStates:{ae86:stage(1),'r34__copy_save':parkPerformanceParts({...stage(3),savedPresets:[stage(2)],stage3Calibration:{ecuBias:-1}})}};
 const r=normaliseState(JSON.parse(JSON.stringify(s)));assert.equal(r.wins,90);assert.equal(r.cash,123456);assert.deepEqual(r.carStates['r34__copy_save'].parkedPerformanceParts,s.carStates['r34__copy_save'].parkedPerformanceParts);assert.deepEqual(r.carStates['r34__copy_save'].savedPresets,[stage(2)]);assert.equal(getBuiltCar('r34__copy_save',r.carStates['r34__copy_save']).car.powerKW,206);assert.ok(getBuiltCar('r34__copy_save',restorePerformanceParts(r.carStates['r34__copy_save'])).car.powerKW>400);
});
