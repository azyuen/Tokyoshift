// Explicit, bounded refresh after a vehicle-specific correction. Never changes baseline.
// Usage: node tools/refresh-engineering-vehicle.mjs s2000
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ids,builds,stage,cost,peaks,simulate} from './vehicle-balance.mjs';
import {cars} from '../src/data/cars.js';
import {engines} from '../src/data/engines.js';
import {getBuiltCar,calculatePerformanceIndex} from '../src/vehicles/VehiclePerformance.js';
import {TUNER_SHOPS} from '../src/data/tunerShops.js';
const id=process.argv[2];
if(!ids.includes(id))throw Error('Supply one canonical regular vehicle ID');
const dir='docs/engineering/';
const read=n=>JSON.parse(fs.readFileSync(dir+n+'.json'));
const core=read('revised'),scenarios=read('scenarios');
const previous={id,core:core.filter(r=>r.id===id),scenarios:scenarios.records.filter(r=>r.id===id)};
const history=dir+'before-spec-correction-'+id+'.json';
if(!fs.existsSync(history))fs.writeFileSync(history,JSON.stringify(previous,null,2));
const rows=Object.entries(builds()).map(([build,state])=>{
 const b=getBuiltCar(id,state);
 return {id,build,...peaks(b.car,b.engine),displayPower:b.car.powerKW,displayTorque:b.car.torqueNm,mass:b.car.vehicleMassKg,cost:cost(state),boost:b.car.maximumBoost,standing:simulate(b),rolling:simulate(b,{speed:60}),index:calculatePerformanceIndex(b.car,b.engine),factory:build==='stock'?{car:cars[id],engine:engines[cars[id].engine]}:undefined};
});
const modules=['Vehicle','Engine','Transmission','Turbo','Clutch','NitrousSystem','Tyres'].map(n=>'src/vehicles/'+n+'.js').concat(['src/ai/DragRacingAI.js','src/ai/DrivingModel.js','src/data/encounterProfiles.js','tools/vehicle-balance.mjs']);
const physicsHash=crypto.createHash('sha256').update(modules.map(f=>fs.readFileSync(f)).join('\n')).digest('hex');
const extra=[];
function record(build,state,scenario,options){const b=getBuiltCar(id,state);const key=crypto.createHash('sha256').update(JSON.stringify({physicsHash,id,build,b,scenario,options})).digest('hex');extra.push({key,physicsHash,id,build,scenario,options,power:peaks(b.car,b.engine),standardHardwareCost:cost(state),result:simulate(b,options)});}
for(const n of [0,2,3])for(const [scenario,options]of Object.entries({lowGrip:{grip:.8},human:{rating:3,seed:17},rolling100:{speed:100}}))record(n,stage(n),scenario,options);
const nos=stage(3);nos.exhaustNosTuning.nosKit=3;nos.exhaustNosTuning.nitrousShot=3;record(3,nos,'NOS',{nos:true});
for(const shop of Object.values(TUNER_SHOPS))if(shop.donorCarId===id){const state={...stage(3),specialistTuning:shop.tuningOptions.map(o=>o.id)};record('specialist',state,shop.id+' standing',{});record('specialist',state,shop.id+' rolling',{speed:60});}
// Keep every unaffected record byte-equivalent after JSON parsing; old hashes truthfully
// describe those earlier runs. This is safe only for a reviewed vehicle-specific change.
if(previous.core.length!==rows.length||previous.scenarios.length!==extra.length)throw Error('Refresh would change matrix coverage');
const updatedCore=core.map(r=>r.id===id?rows.find(n=>n.build===r.build):r);
scenarios.records=scenarios.records.map(r=>r.id===id?extra.find(n=>n.build===r.build&&n.scenario===r.scenario):r);
if(updatedCore.some(r=>!r)||scenarios.records.some(r=>!r))throw Error('Matrix identity mismatch');
fs.writeFileSync(dir+'revised.json',JSON.stringify(updatedCore,null,2));
fs.writeFileSync(dir+'scenarios.json',JSON.stringify(scenarios));
console.log(JSON.stringify({id,coreBuilds:rows.length,scenarioRaces:extra.length,physicsHash,stock:rows[0].standing.splits,max:rows.find(r=>r.build==='max').standing.splits},null,2));
