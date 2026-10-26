// Production integration-only regression: evaluates the REAL src tree.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Vehicle from '../../src/vehicles/Vehicle.js';
import AI from '../../src/ai/DragRacingAI.js';
import {cars} from '../../src/data/cars.js';
import {engines} from '../../src/data/engines.js';
import {getBuiltCar,calculatePerformanceIndex} from '../../src/vehicles/VehiclePerformance.js';
import {getEncounterAi,boostAiForStandingStart} from '../../src/data/encounterProfiles.js';
import {stockClassFor} from '../../src/data/stockClasses.js';

assert.equal(cars.dc2.stockClass,'B');
assert.equal(cars.galant.stockClass,'B');
assert.equal(cars.dc2.powerKW,147);
assert.equal(cars.galant.powerKW,176);
assert.equal(stockClassFor(cars.dc2),'B');
assert.equal(cars.espritNsx.powerKW,625);
assert.equal(cars.libertyWalk240z.tuningLocked,true);
assert.equal(Boolean(cars.arkonLibertyWalk240z.collector),false);
assert.ok(engines[cars.renownMazda787B.engine].torqueCurve.length>3);
assert.ok(engines['4g63t_galant_vr4'].referenceBoostBar>0);

const tune = n => ({
 tuning:{engine:n,intake:n,ecu:n,turbo:n,intercooler:n},
 drivetrainTuning:{clutch:n,gearbox:n,differential:n,suspension:n},
 chassisTuning:{tyres:n,weightReduction:n},
 exhaustNosTuning:{headers:n,exhaust:n,muffler:n,nosKit:0,nitrousShot:0},
});
const rand=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function race(id,n,rating=5,hz=60,seed=7){
 const built=getBuiltCar(id,tune(n));
 assert.ok(built?.car&&built?.engine);
 assert.ok(Number.isFinite(built.car.powerKW)&&built.car.powerKW>0,'valid output '+id);
 const v=new Vehicle(built.car,built.engine);
 const skills=boostAiForStandingStart(getEncounterAi(rating),rating);
 const ai=new AI(v,skills,{rating,playerDifficulty:'STANDARD',random:rand(seed),rollingStart:false});
 assert.equal(ai.diagnostics.calibration, rating>=4?'E005 HUMAN EXPERT/ELITE':'STANDARD');
 const dt=1/hz;
 for(let i=0;i<hz*3;i++)v.update(dt,ai.update(dt,(i-hz*3)*dt,null));
 let moved=null,sixty=null,finish=null;
 for(let i=0;i<hz*30;i++){
  const t=i*dt;v.update(dt,ai.update(dt,t,0));
  if(!Number.isFinite(v.positionM)) throw Error('invalid vehicle '+id);
  if(moved==null&&(v.positionM>.2||v.speedMps>.6))moved=t;
  if(sixty==null&&v.positionM>=18.288)sixty=t;
  if(v.positionM>=402.336){finish=t;break;}
 }
 assert.ok(finish!==null&&moved!==null&&sixty!==null,id+' race finish');
 return {id,n,rating,hz,et:+(finish-moved).toFixed(3),sixty:+(sixty-moved).toFixed(3),
   maxKW:built.car.powerKW,shifts:ai.diagnostics.shifts.length,
   engineKind:built.car.engine,engineAtStart:built.engine.torqueCurve[0]};
}
const all=[];
for(const hz of [30,60,120])for(const n of [0,1,2,3])for(const id of ['dc2','galant']){
 const o=race(id,n,5,hz);
 all.push(o);
 console.log('R687_CAR '+JSON.stringify(o));
}
const pick=(id,n,hz=60)=>all.find(x=>x.id===id&&x.n===n&&x.hz===hz);
assert.ok(pick('galant',2).et < pick('dc2',2).et-.25,'Galant AWD turbo advantage preserved');
assert.ok(pick('dc2',3).et < pick('dc2',0).et,'DC2 improves with hardware');
assert.ok(pick('galant',3).et < pick('galant',0).et,'Galant improves with hardware');
assert.ok(all.every(x=>x.et>8&&x.et<25&&x.shifts>=2),'valid timed physics');
const baselineCar=getBuiltCar('dc2',tune(2));
const i=calculatePerformanceIndex(baselineCar.car,baselineCar.engine,{raceType:'Standing Start'});
assert.ok(Number.isFinite(i.selected)&&i.selected>0,'physics calibrated performance index');
const hero=race('renownMazda787B',0,5,60);
assert.ok(hero.et<10,'hero remains sub-ten with skilled human AI');
const es=race('espritNsx',0,5,60);
assert.ok(es.et<10,'ESPRIT collector still sub-ten');
assert.equal(JSON.parse(fs.readFileSync('version.json','utf8')).build,'R687');
const stamp=fs.readFileSync('index.html','utf8');
assert.ok(stamp.includes('id="build-stamp">R687</div>'),'correct release badge');
assert.ok(stamp.includes('src/main.js?v=20261026-r687'),'entry cache version');
assert.ok(!fs.readFileSync('src/input/TouchControls.js','utf8').includes('E005 two-thumb'),'did not copy preview touch controls');
console.log('R687_VALIDATION_PASS '+JSON.stringify({testCases:all.length+2,hero:hero.et,esprit:es.et,dc2Level2:pick('dc2',2).et,galantLevel2:pick('galant',2).et}));
