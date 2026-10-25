// Usage: node tools/regional-stacking-review.mjs /path/to/2175596-checkout
// Compare only the newly changed all-region build; reuse existing standard data.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ids,builds,peaks,simulate} from './vehicle-balance.mjs';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';
import {TUNER_SHOPS,areTunerOptionRequirementsMet} from '../src/data/tunerShops.js';
import Engine from '../src/vehicles/Engine.js';
import Nitrous from '../src/vehicles/NitrousSystem.js';
const before=await import(pathToFileURL(path.resolve(process.argv[2],'src/vehicles/VehiclePerformance.js')));
const oldSim=await import(pathToFileURL(path.resolve(process.argv[2],'tools/vehicle-balance.mjs')));
const options=Object.values(TUNER_SHOPS).flatMap(s=>s.tuningOptions);
function burst(b){const e=new Engine(b.engine),n=new Nitrous(b.car);n.update(0,true,true,4000);for(let i=0;i<20;i++)n.update(.01,false,true,4000);let powerKW=0,torqueNm=0;for(let rpm=1810;rpm<=b.engine.redlineRPM;rpm+=10){e.rpm=rpm;const t=e.combustionTorque(1,b.car.maximumBoost,n.torqueAtRPM(rpm));powerKW=Math.max(powerKW,t*rpm*Math.PI/30000);torqueNm=Math.max(torqueNm,t);}return {powerKW,torqueNm};}
const rows=[];
for(const id of ids){
 const s=builds().dyno;s.exhaustNosTuning.nosKit=3;s.exhaustNosTuning.nitrousShot=3;s.specialistTuning=[];
 for(const o of options){if(!areTunerOptionRequirementsMet(s,o))throw Error(id+'/'+o.id);s.specialistTuning.push(o.id);}
 const old=before.getBuiltCar(id,s),b=getBuiltCar(id,s);
 const record=(b,sim,peak)=>({...peak(b.car,b.engine),standing:sim(b),rolling:sim(b,{speed:60}),nosStanding:sim(b,{nos:true})});
 rows.push({id,before:record(old,oldSim.simulate,oldSim.peaks),after:{...record(b,simulate,peaks),burst:burst(b)},refinement:b.car.specialistRefinement});
}
const result={baseline:'217559614a63bbfca4a0adc9d9ede04d4fd2aa1c',conditions:'120 Hz, seeded near-optimal AI, full hardware + dyno + 21 regional options; rolling 60 km/h; NOS separately enabled',regionalCost:options.reduce((a,o)=>a+o.cost,0),rows};
fs.writeFileSync('docs/engineering/regional-stacking-results.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(rows.filter(r=>['r34','jza80','dc2','nsx','3000gt'].includes(r.id)).map(r=>({id:r.id,before:r.before.powerKW,after:r.after.powerKW,old400:r.before.standing.splits[400],new400:r.after.standing.splits[400],new800:r.after.standing.splits[800]})),null,2));
