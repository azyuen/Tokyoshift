import assert from 'node:assert/strict';
import Vehicle from '../src/vehicles/Vehicle.js';
import AI from '../src/ai/DragRacingAI.js';
import { getBuiltCar } from '../src/vehicles/VehiclePerformance.js';
import { getEncounterAi, boostAiForStandingStart } from '../src/data/encounterProfiles.js';
import { applyDifficultyToRivalAi } from '../src/data/playerDifficulty.js';

globalThis.Phaser = { Math: { Clamp: (v,a,b) => Math.max(a,Math.min(b,v)), Linear: (a,b,t) => a+(b-a)*t } };
export function random(seed) { return () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }; }
export const tuned = {
  engineTuning: { intake:3, ecu:3, turbo:3, intercooler:3, internals:3 },
  drivetrainTuning: { clutch:3, gearbox:3, differential:3, suspension:3 },
  chassisTuning: { tyres:3, weightReduction:3 },
  exhaustNosTuning: { headers:3, exhaust:3, muffler:3, nosKit:3, nitrousShot:3 },
  stage3Calibration: { ecuBias:2, boostBias:2, gearBias:2 },
};
export function run(carId, rating, { rolling=false, state={}, difficulty='STANDARD', seed=1, dt=1/120 }={}) {
  const built = getBuiltCar(carId,state);
  const frozen = JSON.stringify(built);
  const v = new Vehicle(built.car,built.engine);
  const skill = applyDifficultyToRivalAi(rolling ? getEncounterAi(rating) : boostAiForStandingStart(getEncounterAi(rating),rating),difficulty,{rollingStart:rolling});
  const ai = new AI(v,skill,{rating,playerDifficulty:difficulty,rollingStart:rolling,random:random(seed)});
  for(let time=-3;time<0;time+=dt) v.update(dt,ai.update(dt,time,null));
  if(rolling) {
    const speed=60/3.6, wheel=speed/(2*Math.PI*v.config.wheelRadius)*60;
    let fallback=2, score=Infinity;
    v.config.gearRatios.forEach((ratio,i)=>{ const rpm=wheel*ratio*v.config.finalDriveRatio;
      if(rpm>0 && rpm<v.config.engineRedlineRPM*.86) {
        const value=Math.abs(rpm-v.config.engineRedlineRPM*.63)+Math.max(0,rpm-v.config.engineRedlineRPM*.76)*1.5;
        if(value<score){score=value;fallback=i+1;}
      }
    });
    v.transmission.currentGear=ai.chooseRollingStartGear(speed)??fallback;
    v.speedMps=speed;v.tyres.wheelRPM=wheel;v.engine.rpm=wheel*v.transmission.ratio;v.clutch.pedal=0;
  }
  let finish=null, limiter=0, neutral=0, maxNeutral=0, tailThrottle=0, tailCount=0;
  for(let time=0;time<45;time+=dt) {
    const controls=ai.update(dt,time,0);
    assert(Object.values(controls).every(x=>typeof x==='boolean'||Number.isFinite(x)));
    v.update(dt,controls);
    if(v.engine.rpm>=v.engine.config.limiterRPM)limiter+=dt;
    neutral=v.transmission.currentGear===0?neutral+dt:0;maxNeutral=Math.max(maxNeutral,neutral);
    if(time>8){tailThrottle+=controls.throttle;tailCount++;}
    if(v.positionM>=804.672){finish=time;break;}
  }
  assert(finish!=null,`${carId}/${rating} did not finish`);
  assert(maxNeutral<.5,`stuck neutral ${maxNeutral}`);
  assert(ai.diagnostics.shifts.every(s=>s.quality==='CLEAN'));
  assert.equal(JSON.stringify(built),frozen,'AI mutated the build');
  return {finish, quarter:ai.diagnostics.splits.quarterMile.fromGreen, limiter, maxNeutral,
    tailThrottle:tailThrottle/tailCount, diagnostics:ai.diagnostics};
}
if(import.meta.url===`file://${process.argv[1]}`) {
  const rows=[];
  for(const car of ['evo3','jza80','ek9']) for(const state of [{},tuned]) for(const rolling of [false,true]) {
    const result=[];
    for(const rating of [2,3,4,5]) {
      const runs=Array.from({length:6},(_,i)=>run(car,rating,{state,rolling,seed:i+1}));
      const mean=k=>runs.reduce((s,r)=>s+r[k],0)/runs.length;
      result.push({rating,quarter:mean('quarter'),half:mean('finish'),limiter:mean('limiter'),throttle:mean('tailThrottle')});
    }
    rows.push({car,tuned:state===tuned,rolling,result});
  }
  console.log(JSON.stringify(rows,null,2));
}
