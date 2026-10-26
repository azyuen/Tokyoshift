// E005 paired physics evaluation: same build, same seeds, same gearbox and tyres.
// Only the driver AI implementation changes. Compare elapsed time from movement.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getBuiltCar } from '../engineering-preview/src/vehicles/VehiclePerformance.js';
import Vehicle from '../engineering-preview/src/vehicles/Vehicle.js';
import HumanAI from '../engineering-preview/src/ai/DragRacingAI.js';
import BaselineAI from './fixtures/engineering-ai-e004.mjs';
import { getEncounterAi, boostAiForStandingStart } from '../engineering-preview/src/data/encounterProfiles.js';

const rand = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const dt = 1 / 120;
const candidates = [
  ['ek9',2], ['gc8',2], ['r34',2], ['jza80',2], ['evo5',2],
  ['renownMazda787B',0], ['espritNsx',0],
];
const tuned = n => ({
  tuning:{engine:n,intake:n,ecu:n,turbo:n,intercooler:n},
  drivetrainTuning:{clutch:n,gearbox:n,differential:n,suspension:n},
  chassisTuning:{tyres:n,weightReduction:n},
  exhaustNosTuning:{headers:n,exhaust:n,muffler:n,nosKit:0,nitrousShot:0},
});

function run(AI, id, tune, rating, seed) {
  const built = getBuiltCar(id, tuned(tune));
  assert.ok(built?.car && built?.engine, 'valid car '+id);
  const v = new Vehicle(built.car,built.engine);
  const skills=boostAiForStandingStart(getEncounterAi(rating),rating);
  const ai = new AI(v, skills, {
    rating, playerDifficulty:'STANDARD', random:rand(seed), rollingStart:false, raceDistanceM:402.336,
  });
  for(let i=0;i<240;i++)v.update(dt,ai.update(dt,-(240-i)*dt,null));
  let movement = null, sixty = null, quarter = null, spin = 0;
  for(let i=0;i<3000;i++){
    const t=i*dt, prev=v.positionM;
    const controls=ai.update(dt,t,0);
    controls.nos = false;
    const tel=v.update(dt,controls);
    if(!Number.isFinite(tel.speedMps))throw Error('nonfinite velocity: '+id);
    if(tel.wheelspin)spin+=dt;
    if(movement===null && (v.positionM>0.20||v.speedMps>0.60))movement=t;
    if(sixty===null && v.positionM>=18.288)sixty=t;
    if(v.positionM>=402.336){quarter=t;break;}
  }
  assert.ok(quarter !== null && movement !== null && sixty !== null, 'race complete: '+id+' '+rating);
  return {
    et:+(quarter-movement).toFixed(3),
    sixty:+(sixty-movement).toFixed(3),
    spin:+spin.toFixed(3),
    shifts:ai.diagnostics.shifts.length,
    shiftQuality:ai.diagnostics.shifts.map(s=>s.quality),
  };
}
const rows=[];
for(const [id,tune] of candidates){
 for(const rating of [4,5]){
  for(const seed of [37,101,409]){
   const old=run(BaselineAI,id,tune,rating,seed);
   const updated=run(HumanAI,id,tune,rating,seed);
   rows.push({id,tune,rating,seed,old,new:updated,diff:+(updated.et-old.et).toFixed(3)});
   console.log('HUMAN_DRIVER_CASE '+JSON.stringify(rows.at(-1)));
  }
 }
}
const mean = rows => +(rows.reduce((acc,r)=>acc+r,0)/rows.length).toFixed(3);
const summary={};
for(const rating of [4,5]){
 const filtered=rows.filter(r=>r.rating===rating);
 summary[rating===5?'elite':'expert']={
   runs:filtered.length,
   baselineMeanEt:mean(filtered.map(r=>r.old.et)),
   updatedMeanEt:mean(filtered.map(r=>r.new.et)),
   meanDelta:mean(filtered.map(r=>r.diff)),
   meanUpdated60ft:mean(filtered.map(r=>r.new.sixty)),
   meanSpinSeconds:mean(filtered.map(r=>r.new.spin)),
   fastestUpdated:Math.min(...filtered.map(r=>r.new.et)),
   slowestUpdated:Math.max(...filtered.map(r=>r.new.et)),
 };
}
console.log('HUMAN_DRIVER_SUMMARY '+JSON.stringify(summary));
assert.ok(rows.every(r=>r.new.shifts>=2),'all cars have made real shifts');
assert.ok(rows.every(r=>r.new.et>5 && r.new.et<25),'reasonable duration, no stuck cars');
assert.ok(summary.elite.updatedMeanEt < summary.expert.updatedMeanEt+1.3,'elite remains competitive');
const c=fs.readFileSync('engineering-preview/src/input/TouchControls.js','utf8');
const html=fs.readFileSync('engineering-preview/index.html','utf8');
assert.ok(c.includes('touchClutch = Phaser.Math.Clamp(travel / (this.pedalSwipePx * scale), 0, 1)'),'reversible clutch');
assert.ok(c.includes("if (isTap && this.clutchPointer?.isDown)"),'two-thumb tap upshift');
assert.ok(html.includes('>E005</div>'),'E005 badge');
assert.ok(html.includes('DragRacingAI.js?e=005'),'cache fresh');
console.log('E005_VALIDATION_PASS');

