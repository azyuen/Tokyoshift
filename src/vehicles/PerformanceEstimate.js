import Vehicle from './Vehicle.js';
import AI from '../ai/DragRacingAI.js';
import {getEncounterAi,boostAiForStandingStart} from '../data/encounterProfiles.js';
const cache=new Map();
const fields=['vehicleMassKg','wheelRadius','gearRatios','finalDriveRatio','drivetrainEfficiency','tyreGrip','drivenAxleWeightFraction','launchLoadMultiplier','clutchStrength','shiftTimeScale','difficultyShiftClutchRejectThreshold','difficultyShiftClutchTarget','difficultyShiftThrottleGrace','difficultyShiftPenaltyMultiplier','maximumBoost','turboSize','turboSpoolRate','boostOnsetRPM','boostRampRPM','launchRPM','engineIdleRPM','engineRedlineRPM','engineLimiterRPM','dragCoefficient','frontalAreaM2','rollingResistance','nosPower','nosShots','nosCapacitySeconds','nosShotDurationSeconds'];
// Same Vehicle/AI as gameplay, fixed seed. Only physics enters the cache key.
// 60 Hz estimates are checked against independent 120 Hz race runs.
export function estimateElapsed(car,engine,startKmh=0,distance=400){
 const key=JSON.stringify([fields.map(k=>car[k]??null),engine,startKmh,distance]);
 if(cache.has(key))return cache.get(key);
 let seed=1;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const v=new Vehicle(car,engine),rolling=startKmh>0;
 const ai=new AI(v,rolling?getEncounterAi(5):boostAiForStandingStart(getEncounterAi(5),5),{rating:5,rollingStart:rolling,random});
 const dt=1/60;for(let t=-3;t<0;t+=dt)v.update(dt,ai.update(dt,t,null));v.positionM=0;
 if(rolling){v.speedMps=startKmh/3.6;v.tyres.wheelRPM=v.speedMps/(2*Math.PI*car.wheelRadius)*60;v.transmission.currentGear=ai.chooseRollingStartGear(v.speedMps);v.engine.rpm=v.tyres.wheelRPM*v.transmission.ratio;v.clutch.pedal=0;}
 let elapsed=60;
 for(let t=0;t<60;t+=dt){const before=v.positionM;v.update(dt,ai.update(dt,t,0));if(v.positionM>=distance){elapsed=t+dt*(distance-before)/Math.max(.00001,v.positionM-before);break;}}
 if(cache.size>=512)cache.delete(cache.keys().next().value);cache.set(key,elapsed);return elapsed;
}
export function clearPerformanceEstimateCache(){cache.clear();}
