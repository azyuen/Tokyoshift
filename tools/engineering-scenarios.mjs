// Supplement to preserved core matrix. Existing matching records are reused.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ids,stage,simulate,peaks,cost} from './vehicle-balance.mjs';
import {cars} from '../src/data/cars.js';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';
import {TUNER_SHOPS} from '../src/data/tunerShops.js';
const file='docs/engineering/scenarios.json';
const modules=['Vehicle','Engine','Transmission','Turbo','Clutch','NitrousSystem','Tyres'].map(n=>'src/vehicles/'+n+'.js').concat(['src/ai/DragRacingAI.js','src/ai/DrivingModel.js','src/data/encounterProfiles.js','tools/vehicle-balance.mjs']);
const physicsHash=crypto.createHash('sha256').update(modules.map(f=>fs.readFileSync(f)).join('\n')).digest('hex');
const data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{records:[]};
let added=0,reused=0;
function record(id,build,state,scenario,options){
 const b=getBuiltCar(id,state);const key=crypto.createHash('sha256').update(JSON.stringify({physicsHash,id,build,b,scenario,options})).digest('hex');
 if(data.records.some(r=>r.key===key)){reused++;return;}
 data.records.push({key,physicsHash,id,build,scenario,options,power:peaks(b.car,b.engine),standardHardwareCost:cost(state),result:simulate(b,options)});added++;
 // Every finished race is durable locally; interruptions need not rerun it.
 fs.writeFileSync(file+'.tmp',JSON.stringify(data));fs.renameSync(file+'.tmp',file);
}
for(const id of ids)for(const n of [0,2,3]){
 const state=stage(n);
 for(const [scenario,options] of Object.entries({lowGrip:{grip:.8},human:{rating:3,seed:17},rolling100:{speed:100}}))record(id,n,state,scenario,options);
 if(n===3){const nos=stage(3);nos.exhaustNosTuning.nosKit=3;nos.exhaustNosTuning.nitrousShot=3;record(id,n,nos,'NOS',{nos:true});}
}
for(const shop of Object.values(TUNER_SHOPS)){const state={...stage(3),specialistTuning:shop.tuningOptions.map(o=>o.id)};record(shop.donorCarId,'specialist',state,shop.id+' standing',{});record(shop.donorCarId,'specialist',state,shop.id+' rolling',{speed:60});}
for(const [id,c] of Object.entries(cars))if(c.collector||c.tuningLocked){record(id,'exclusive',{},'standing',{});record(id,'exclusive',{},'rolling',{speed:60});}
console.log(JSON.stringify({added,reused,total:data.records.length,physicsHash}));
