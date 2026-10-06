import assert from 'node:assert/strict';
import fs from 'node:fs';
import {run, tuned, random} from './ai-driving.mjs';
import AI from '../src/ai/DragRacingAI.js';
import Vehicle from '../src/vehicles/Vehicle.js';
import {DrivingModel} from '../src/ai/DrivingModel.js';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';
import {cars} from '../src/data/cars.js';
import {getEncounterAi} from '../src/data/encounterProfiles.js';
import {applyDifficultyToRivalAi} from '../src/data/playerDifficulty.js';

let count=0;
const rows=[];
for(const car of ['evo3','r32','jza80','ek9','s2000']) for(const state of [{},tuned]) for(const rolling of [false,true]) {
  const means=[];
  for(const rating of [1,2,3,4,5]) {
    const runs=Array.from({length:12},(_,i)=>run(car,rating,{state,rolling,dt:1/60,seed:50+i*997}));count+=runs.length;
    const average=k=>runs.reduce((s,r)=>s+r[k],0)/runs.length;
    means.push(average(rolling?'finish':'quarter'));
    if(rating>=4){
      assert(runs.every(r=>r.limiter<.2),'smart driver dwelling on limiter');
      assert(runs.every(r=>r.tailThrottle>.8),'permanent throttle feathering');
      if(state===tuned)assert(runs.every(r=>r.diagnostics.nosEvents.some(e=>e.active)),'NOS never used');
      else assert(runs.every(r=>!r.diagnostics.nosEvents.some(e=>e.active)),'no-kit NOS requested');
    }
  }
  // Individual runs may overlap, but seeded averages must have the intended order.
  for(let i=1;i<means.length;i++)assert(means[i]<means[i-1],`${car} tuned=${state===tuned} rolling=${rolling}: ${means}`);
  assert(means[4]<means[2]-.05,'Elite must clearly beat Skilled');
  rows.push({car,build:state===tuned?'stage3+NOS':'stock',start:rolling?'rolling half':'standing quarter',seconds:means.map(n=>+n.toFixed(3))});
}
// Full catalogue: hero/locked and ordinary cars must complete on real physics.
for(const car of Object.keys(cars))for(const rolling of [false,true]){run(car,5,{rolling,dt:1/60});count++;}
for(const dt of [1/30,1/120])for(const car of ['evo3','jza80','ek9'])for(const rolling of [false,true]){run(car,5,{state:tuned,rolling,dt});count++;}

const built=getBuiltCar('evo3',tuned);
const v=new Vehicle(built.car,built.engine);
const model=new DrivingModel(v);
// Deliberately peaky engine: wheel-torque crossover must produce an early shift.
const altered=structuredClone(built);
altered.engine.torqueCurve=[[900,100],[3500,500],[5000,490],[6000,170],[8000,40]];
const peaky=new DrivingModel(new Vehicle(altered.car,altered.engine));
assert(peaky.shiftPoints[1]<model.shiftPoints[1]-400,'ignores torque-curve crossover');
altered.car.gearRatios[2]*=.7;
const wider=new DrivingModel(new Vehicle(altered.car,altered.engine));
assert.notEqual(wider.shiftPoints[1],peaky.shiftPoints[1],'ignores next-gear RPM drop');
for(const bias of [-2,2]) {
 const b=getBuiltCar('evo3',{...tuned,stage3Calibration:{ecuBias:bias,boostBias:bias,gearBias:bias}});
 const m=new DrivingModel(new Vehicle(b.car,b.engine));
 assert(m.shiftPoints.every(r=>r<=b.engine.limiterRPM-160));
 assert(m.rollingGear(60/3.6)>0);
}
const weakLaunch=new AI(v,{...getEncounterAi(5),launchSkill:.5},{rating:5,random:random(40)});
const weakShift=new AI(v,{...getEncounterAi(5),shiftSkill:.5},{rating:5,random:random(40)});
assert.notEqual(weakLaunch.launchTargetRPM,weakShift.launchTargetRPM);
assert.notDeepEqual(weakLaunch.targets,weakShift.targets);
const hard=applyDifficultyToRivalAi({reactionSkill:.95,launchSkill:.85,shiftSkill:.75,aggression:.65},'HARD');
assert(hard.reactionSkill>hard.launchSkill&&hard.launchSkill>hard.shiftSkill);
for(const difficulty of ['EASY','STANDARD','HARD'])for(const rating of [2,4,5]){
 const r=run('jza80',rating,{difficulty,state:tuned});count++;
 assert.equal(r.diagnostics.legacy,difficulty==='EASY');
}
const scene=fs.readFileSync(new URL('../src/scenes/RaceScene.js',import.meta.url),'utf8');
const meet=fs.readFileSync(new URL('../src/scenes/MeetScene.js',import.meta.url),'utf8');
assert.equal((scene.match(/boostAiForPinkSlip\(/g)||[]).length,1);
assert.equal((meet.match(/boostAiForPinkSlip\(/g)||[]).length,0);
assert(scene.includes("this.raceDeal === 'PINK_SLIP' && this.playerDifficulty !== 'EASY'"));
assert(scene.includes('vehicle === this.opponent ? this.ai.chooseRollingStartGear'));
console.log(JSON.stringify({runs:count,rows},null,2));
