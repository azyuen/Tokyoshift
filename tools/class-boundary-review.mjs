// New sensitivity scenarios only; reuse the recorded seed-1 standing/rolling.
import fs from 'node:fs';
import {stage,simulate} from './vehicle-balance.mjs';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';
import {STOCK_CLASS_DATA} from '../src/data/stockClasses.js';
const core=JSON.parse(fs.readFileSync('docs/engineering/revised.json'));
const classify=s=>s<14.1?'A':s<14.8?'B':s<15.5?'C':'D';
const results=core.filter(r=>r.build==='stock').map(r=>{
 const built=getBuiltCar(r.id,stage(0));
 const runs=[{seed:1,result:r.standing},...[2,3,17,29].map(seed=>({seed,result:simulate(built,{seed})}))];
 const scores=runs.map(({seed,result:s})=>({seed,seconds400:s.splits[400],score:.5*s.splits[402.336]+.25*s.splits[804.672]/1.54+.25*r.rolling.splits[402.336]*1.25}));
 return {id:r.id,assignedClass:STOCK_CLASS_DATA[r.id].stockClass,scores,classes:[...new Set(scores.map(s=>classify(s.score)))]};
});
fs.writeFileSync('docs/engineering/class-boundary-results.json',JSON.stringify({scope:'Stock, no NOS, Elite driver at 120 Hz. Varies standing seed only; retained seed-1 rolling result. Sensitivity check, not statistical confidence or human performance.',newRaces:172,results},null,2)+'\n');
console.table(results.filter(r=>r.classes.length>1).map(r=>({id:r.id,class:r.assignedClass,classes:r.classes.join('/'),min:Math.min(...r.scores.map(s=>s.score)),max:Math.max(...r.scores.map(s=>s.score))})));
