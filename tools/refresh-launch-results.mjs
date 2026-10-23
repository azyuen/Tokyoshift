// Refresh only paths affected by smart standing-start clutch control.
// Original evidence remains in git; rolling and rating-3 scenarios are retained.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {builds,stage,simulate} from './vehicle-balance.mjs';
import {getBuiltCar,calculatePerformanceIndex} from '../src/vehicles/VehiclePerformance.js';
import {TUNER_SHOPS} from '../src/data/tunerShops.js';
const dir='docs/engineering/';
const core=JSON.parse(fs.readFileSync(dir+'revised.json'));
const extra=JSON.parse(fs.readFileSync(dir+'scenarios.json'));
const hash=crypto.createHash('sha256').update(fs.readFileSync('src/ai/DragRacingAI.js')).digest('hex');
const history=dir+'launch-control-comparison.json';
if(fs.existsSync(history))throw Error('Comparison already exists; inspect before refreshing again.');
const before=core.map(r=>({id:r.id,build:r.build,standing:r.standing,index:r.index}));
for(const r of core){
 const b=getBuiltCar(r.id,builds()[r.build]);
 r.standing=simulate(b);r.index=calculatePerformanceIndex(b.car,b.engine);
 r.launchControllerHash=hash;
}
let refreshed=0,retained=0;
for(const r of extra.records){
 if(r.options.speed||(r.options.rating??5)<4){retained++;continue;}
 let state=typeof r.build==='number'?stage(r.build):{};
 if(r.build==='specialist'){
  const shop=Object.values(TUNER_SHOPS).find(s=>s.donorCarId===r.id);
  state={...stage(3),specialistTuning:shop.tuningOptions.map(o=>o.id)};
 }
 if(r.scenario==='NOS'){state.exhaustNosTuning.nosKit=3;state.exhaustNosTuning.nitrousShot=3;}
 r.result=simulate(getBuiltCar(r.id,state),r.options);
 r.previousKey=r.key;r.previousPhysicsHash=r.physicsHash;
 // Describe the delta explicitly; do not attribute retained runs to new code.
 r.launchControllerHash=hash;
 r.physicsHash=crypto.createHash('sha256').update(r.previousPhysicsHash+hash).digest('hex');
 r.key=crypto.createHash('sha256').update(r.previousKey+hash).digest('hex');refreshed++;
}
const path='src/data/stockClasses.js',source=fs.readFileSync(path,'utf8');
const data=Object.fromEntries(core.filter(r=>r.build==='stock').map(r=>{
 const score=.5*r.standing.splits[402.336]+.25*r.standing.splits[804.672]/1.54+.25*r.rolling.splits[402.336]*1.25;
 return [r.id,{stockClass:score<14.1?'A':score<14.8?'B':score<15.5?'C':'D',stockCompositeSeconds:+score.toFixed(3)}];
}));
fs.writeFileSync(path,source.replace(/export const STOCK_CLASS_DATA = [\s\S]*?\n};/,'export const STOCK_CLASS_DATA = '+JSON.stringify(data,null,2)+';'));
fs.writeFileSync(dir+'revised.json',JSON.stringify(core,null,2));
fs.writeFileSync(dir+'scenarios.json',JSON.stringify(extra));
fs.writeFileSync(history,JSON.stringify({sourceCommit:'5497eb86d860b5b9d046fb363a838bb38448b6f5',launchControllerHash:hash,coreStandingRefreshed:core.length,supplementaryRefreshed:refreshed,supplementaryRetained:retained,before},null,2)+'\n');
console.log({core:core.length,refreshed,retained});
