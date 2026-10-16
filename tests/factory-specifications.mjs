import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cars} from '../src/data/cars.js';
import Transmission,{effectiveFinalDrive} from '../src/vehicles/Transmission.js';
import Vehicle from '../src/vehicles/Vehicle.js';
import {getBuiltCar,selectRollingGear} from '../src/vehicles/VehiclePerformance.js';
import {estimateElapsed,clearPerformanceEstimateCache} from '../src/vehicles/PerformanceEstimate.js';
import {STOCK_CLASS_DATA} from '../src/data/stockClasses.js';
import {CAR_MAGAZINE_META} from '../src/data/carMagazine.js';
import {stage} from '../tools/vehicle-balance.mjs';
import {parkPerformanceParts,restorePerformanceParts} from '../src/data/factorySetup.js';

test('1999 AP1 factory ratios include the primary reduction exactly once',()=>{
 const c=cars.s2000;
 assert.equal(c.vehicleMassKg,1240);assert.equal(c.primaryReductionRatio,1.160);
 assert.equal(c.finalDriveRatio,4.100);
 assert.deepEqual(c.gearRatios,[3.133,2.045,1.481,1.161,.970,.810]);
 const t=new Transmission(c);
 for(let g=1;g<=6;g++){t.currentGear=g;assert.ok(Math.abs(t.ratio-c.gearRatios[g-1]*4.1*1.16)<1e-12);}
 assert.equal(CAR_MAGAZINE_META.s2000.year,1999);
 assert.equal(CAR_MAGAZINE_META.rx7fd.year,1999);
});
test('all other stock and exclusive transmissions retain their existing ratios',()=>{
 for(const [id,c]of Object.entries(cars))if(id!=='s2000'&&c.crewBaseCarId!=='s2000'&&c.ownedBaseCarId!=='s2000'){
  assert.equal(c.primaryReductionRatio,undefined,id);
  const t=new Transmission(c);
  for(let g=1;g<=c.gearRatios.length;g++){t.currentGear=g;assert.equal(t.ratio,c.gearRatios[g-1]*c.finalDriveRatio,id);}
 }
});
test('saved AP1 tuning survives park/restore and keeps reduction through every build',()=>{
 for(let n=0;n<=3;n++){
  const state=stage(n),restored=restorePerformanceParts(JSON.parse(JSON.stringify(parkPerformanceParts(state))));
  const original=getBuiltCar('s2000',state),b=getBuiltCar('s2000',restored);
  assert.deepEqual(b,original);assert.equal(b.car.primaryReductionRatio,1.16);
  assert.equal(new Vehicle(b.car,b.engine).transmission.finalDrive,effectiveFinalDrive(b.car));
 }
});
test('speed-aware selection and scene gearing share AP1 overall reduction',()=>{
 const b=getBuiltCar('s2000',{}),choice=selectRollingGear(b.car,b.engine,60);
 const wheelRPM=60/3.6/(2*Math.PI*b.car.wheelRadius)*60;
 assert.ok(Math.abs(choice.rpm-wheelRPM*b.car.gearRatios[choice.gear-1]*effectiveFinalDrive(b.car))<1e-8);
 // Execute the actual scene helper without constructing Phaser/UI assets.
 const source=fs.readFileSync('src/scenes/DynoScene.js','utf8');
 const method=source.split('  getOverallGearRatio(')[1].split('\n  getWheelRPMFromSpeed(')[0];
 const scene=Function('effectiveFinalDrive','return {getOverallGearRatio('+method+'}')(effectiveFinalDrive);
 scene.build=b;scene.currentGear=5;
 assert.equal(scene.getOverallGearRatio(),b.car.gearRatios[4]*effectiveFinalDrive(b.car));
 const race=fs.readFileSync('src/scenes/RaceScene.js','utf8');
 assert.match(race,/rollingGearRPM\(vehicle, gear\)[\s\S]*?effectiveFinalDrive\(vehicle.config\)/);
});
test('PI cache distinguishes primary reduction',()=>{
 const b=getBuiltCar('s2000',{}),legacy={...b.car,primaryReductionRatio:1};
 clearPerformanceEstimateCache();
 const a=estimateElapsed(b.car,b.engine),cached=estimateElapsed(legacy,b.engine);
 clearPerformanceEstimateCache();
 assert.equal(cached,estimateElapsed(legacy,b.engine));assert.notEqual(a,cached);
});
test('factory classes reproduce from quarter/half-mile composite and standard stages remain usable',()=>{
 const rows=JSON.parse(fs.readFileSync('docs/engineering/revised.json'));
 for(const r of rows.filter(r=>r.build==='stock')){
  const score=.5*r.standing.splits[402.336]+.25*r.standing.splits[804.672]/1.54+.25*r.rolling.splits[402.336]*1.25;
  const d=STOCK_CLASS_DATA[r.id];assert.ok(Math.abs(score-d.stockCompositeSeconds)<.00051,r.id);
  assert.equal(d.stockClass,score<14.1?'A':score<14.8?'B':score<15.5?'C':'D',r.id);
 }
 const stages=['stock','budget','street','intermediate','advanced','max'].map(build=>rows.find(r=>r.id==='s2000'&&r.build===build));
 for(let i=1;i<stages.length;i++){assert.ok(stages[i].powerKW>stages[i-1].powerKW);assert.ok(stages[i].standing.splits[400]<stages[i-1].standing.splits[400]);}
});
