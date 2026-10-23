// Bounded investigation: real Vehicle/AI, stock hardware, no NOS, fixed seed.
import fs from 'node:fs';
import {stage,random} from './vehicle-balance.mjs';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';
import Vehicle from '../src/vehicles/Vehicle.js';
import AI from '../src/ai/DragRacingAI.js';
import {getEncounterAi,boostAiForStandingStart} from '../src/data/encounterProfiles.js';
function run(id,launchRPM,meterClutch=false){
 const built=getBuiltCar(id,stage(0));
 const car={...built.car,...(launchRPM?{launchRPM}:{})};
 const v=new Vehicle(car,built.engine),dt=1/120;
 const ai=new AI(v,boostAiForStandingStart(getEncounterAi(5),5),{rating:5,random:random(1)});
 for(let t=-3;t<0;t+=dt)v.update(dt,ai.update(dt,t,null));
 v.positionM=0;const samples=[],splits={};
 for(let t=0;t<35;t+=dt){
  const before=v.positionM,c=ai.update(dt,t,0);c.nos=false;
  // Experimental pedal-only driver: hold the launch band until shaft speeds
  // converge. No force, torque, boost or grip overrides.
  if(meterClutch&&t>=ai.goTime&&t-ai.goTime<4&&v.transmission.currentGear===1&&ai.shiftState==='none'&&v.clutch.slipRPM>200){
   c.throttle=1;
   const rpm=v.engine.rpm;
   const losses=9+rpm*.0017+(130+rpm*.018)*v.engine.config.inertia*Math.PI*2/60;
   const torque=v.engine.combustionTorque(1,v.turbo.boostBar)-losses+(rpm-ai.launchTargetRPM)*.03;
   const pedal=1-Math.pow(Math.max(0,Math.min(1,torque/v.clutch.maxTorqueNm)),1/1.35);
   c.clutch=Math.max(c.clutch,pedal);
  }
  v.update(dt,c);
  if(t>=samples.length*.25&&t<5)samples.push({time:+t.toFixed(3),rpm:Math.round(v.engine.rpm),speedKmh:+(v.speedMps*3.6).toFixed(2),boost:+v.turbo.boostBar.toFixed(3),gear:v.transmission.currentGear,throttle:+c.throttle.toFixed(3),clutch:+c.clutch.toFixed(3)});
  for(const d of [18.288,100,400])if(splits[d]===undefined&&v.positionM>=d)splits[d]=t+dt*(d-before)/(v.positionM-before);
  if(splits[400])break;
 }
 return {id,driver:meterClutch?'experimental metered clutch':'runtime AI',launchRPM:car.launchRPM,powerKW:car.powerKW,mass:car.vehicleMassKg,splits,samples,shifts:ai.diagnostics.shifts};
}
const results=[run('xt'),run('ae86'),run('starion'),... [3000,3500,5000,5500,6000].map(rpm=>run('xt',rpm)),run('xt',4300,true)];
fs.writeFileSync('docs/engineering/xt-launch-diagnostic.json',JSON.stringify({scope:'Diagnostic launch target overrides are not runtime changes; 120 Hz, seed 1, rating 5, stock, no NOS.',results},null,2)+'\n');
console.table(results.map(({id,driver,launchRPM,splits})=>({id,driver,launchRPM,sixtyFoot:splits[18.288],metres100:splits[100],metres400:splits[400]})));
