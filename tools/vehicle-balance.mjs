import fs from 'node:fs';
import {cars,carOrder} from '../src/data/cars.js';
import {engines} from '../src/data/engines.js';
import {getBuiltCar,calculatePerformanceIndex} from '../src/vehicles/VehiclePerformance.js';
import Vehicle from '../src/vehicles/Vehicle.js';
import Engine from '../src/vehicles/Engine.js';
import AI from '../src/ai/DragRacingAI.js';
import {getEncounterAi,boostAiForStandingStart} from '../src/data/encounterProfiles.js';
import {getEngineTuningCartCost} from '../src/data/tuning.js';
import {getDrivetrainCartCost,getChassisCartCost,getExhaustNosCartCost} from '../src/data/secondaryTuning.js';
export const ids=[...carOrder,'magna'];
globalThis.Phaser??={Math:{Clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),Linear:(a,b,t)=>a+(b-a)*t}};
export const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export function stage(n){return {tuning:{engine:n,intake:n,ecu:n,turbo:n,intercooler:n},drivetrainTuning:{clutch:n,gearbox:n,differential:n,suspension:n},chassisTuning:{tyres:n,weightReduction:n},exhaustNosTuning:{headers:n,exhaust:n,muffler:n,nosKit:0,nitrousShot:0}};}
export function builds(){const budget=stage(0);Object.assign(budget.tuning,{intake:1,ecu:1});budget.exhaustNosTuning.exhaust=1;budget.chassisTuning.tyres=1;budget.drivetrainTuning.clutch=1;const advanced=stage(2);Object.assign(advanced.tuning,{engine:3,ecu:3,turbo:3});return {stock:stage(0),budget,street:stage(1),intermediate:stage(2),advanced,max:stage(3),dyno:{...stage(3),stage3Calibration:{ecuBias:1,boostBias:1,gearBias:1}}};}
export function cost(s){return getEngineTuningCartCost({},s.tuning)+getDrivetrainCartCost({},s.drivetrainTuning)+getChassisCartCost({},s.chassisTuning)+getExhaustNosCartCost({},s.exhaustNosTuning);}
export function peaks(car,engine){const e=new Engine(engine);let powerKW=0,torqueNm=0,peakRPM=0;const samples=[];for(let rpm=engine.idleRPM;rpm<=engine.redlineRPM;rpm+=10){e.rpm=rpm;const t=e.combustionTorque(1,car.maximumBoost||0),p=t*rpm*Math.PI/30000;samples.push([rpm,p]);if(p>powerKW){powerKW=p;peakRPM=rpm;}torqueNm=Math.max(torqueNm,t);}const band=samples.filter(x=>x[1]>=powerKW*.8);return {powerKW,torqueNm,peakRPM,powerband:[band[0]?.[0],band.at(-1)?.[0]]};}
export function simulate(built,{speed=0,grip=1,rating=5,seed=1,dt=1/120,nos=false}={}){
 const car={...built.car,tyreGrip:built.car.tyreGrip*grip};const v=new Vehicle(car,built.engine);
 const ai=new AI(v,speed?getEncounterAi(rating):boostAiForStandingStart(getEncounterAi(rating),rating),{rating,rollingStart:speed>0,random:random(seed)});
 for(let t=-3;t<0;t+=dt)v.update(dt,ai.update(dt,t,null));
 v.positionM=0;
 if(speed){v.speedMps=speed/3.6;v.tyres.wheelRPM=v.speedMps/(2*Math.PI*car.wheelRadius)*60;v.transmission.currentGear=ai.chooseRollingStartGear(v.speedMps);v.engine.rpm=v.tyres.wheelRPM*v.transmission.ratio;v.clutch.pedal=0;}
 const splits={},accel={};let spin=0,limiter=0;
 for(let t=0;t<60;t+=dt){const before=v.positionM,c=ai.update(dt,t,0);if(!nos)c.nos=false;v.update(dt,c);
  if(!Number.isFinite(v.speedMps))throw Error('nonfinite simulation');
  spin+=v.tyres.wheelspin?dt:0;limiter+=v.engine.rpm>=built.engine.limiterRPM?dt:0;
  for(const d of [400,402.336,800,804.672])if(!splits[d]&&v.positionM>=d)splits[d]=t+dt*(d-before)/Math.max(.00001,v.positionM-before);
  for(const s of [60,80,100,120,160,200])if(accel[s]===undefined&&v.speedMps*3.6>=s)accel[s]=t+dt;
  if(splits[804.672])return {splits,accel,spinSeconds:spin,limiterSeconds:limiter,finishKmh:v.speedMps*3.6,shifts:ai.diagnostics.shifts.length};
 }throw Error('race timeout');
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const rows=[];for(const id of ids){for(const [build,state] of Object.entries(builds())){const b=getBuiltCar(id,state),standing=simulate(b),rolling=simulate(b,{speed:60});rows.push({id,build,...peaks(b.car,b.engine),displayPower:b.car.powerKW,displayTorque:b.car.torqueNm,mass:b.car.vehicleMassKg,cost:cost(state),boost:b.car.maximumBoost,standing,rolling,index:calculatePerformanceIndex(b.car,b.engine),factory:build==='stock'?{car:cars[id],engine:engines[cars[id].engine]}:undefined});}console.error(id);}
 fs.mkdirSync('docs/engineering',{recursive:true});fs.writeFileSync(process.argv[2]||'docs/engineering/results.json',JSON.stringify(rows,null,2));
}
