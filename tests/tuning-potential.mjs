import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {derivePotential,ratePotential} from '../tools/tuning-potential.mjs';
import {TUNING_POTENTIAL} from '../src/data/tuningPotential.js';
import {STOCK_CLASS_DATA,stockClassFor,tuningPotentialSummary} from '../src/data/stockClasses.js';
import {cars,carOrder} from '../src/data/cars.js';
import {getCrewRecruitmentChallengeRules} from '../src/data/crewSystem.js';
const core=JSON.parse(fs.readFileSync('docs/engineering/revised.json'));
const scenarios=JSON.parse(fs.readFileSync('docs/engineering/scenarios.json')).records;
test('all 43 potential ratings reproduce from saved physics and current prices',()=>{
 assert.deepEqual(TUNING_POTENTIAL,derivePotential());assert.equal(Object.keys(TUNING_POTENTIAL).length,43);
 for(const [id,p]of Object.entries(TUNING_POTENTIAL)){
  assert.ok(Number.isFinite(p.score));assert.equal(cars[id].tuningPotential,p.rating);
  assert.equal(STOCK_CLASS_DATA[id].tuningPotential,p.rating);
  assert.ok(tuningPotentialSummary(cars[id]).includes(p.rating.toUpperCase()));
 }
});
test('potential rewards performance and affordability, not peak-power labels',()=>{
 assert.equal(TUNING_POTENTIAL.ae86.rating,'High');assert.equal(TUNING_POTENTIAL.nsx.rating,'Exceptional');
 assert.ok(TUNING_POTENTIAL.ae86.maximumPowerKW<TUNING_POTENTIAL.svx.maximumPowerKW);
 assert.ok(TUNING_POTENTIAL.ae86.score>TUNING_POTENTIAL.svx.score);
 for(const id of carOrder){const rows=core.filter(r=>r.id===id),extra=scenarios.filter(r=>r.id===id);
  assert.ok(ratePotential(rows,extra,1000000).score>=ratePotential(rows,extra,9000000).score,id);
  const slower=structuredClone(rows);for(const r of slower)if(r.build==='max')for(const mode of ['standing','rolling'])for(const d of [400,800])r[mode].splits[d]*=1.1;
  assert.ok(ratePotential(slower,extra,1000000).score<ratePotential(rows,extra,1000000).score,id);
 }
});
test('potential has no effect on factory classes or recruitment choices',()=>{
 const source={ownedCarIds:carOrder,carStates:{}};
 for(const id of carOrder){const before=getCrewRecruitmentChallengeRules(source,{baseCarId:id}).eligibleCarIds;
  const saved=STOCK_CLASS_DATA[id].tuningPotential;const factory=stockClassFor(cars[id]);
  try{STOCK_CLASS_DATA[id].tuningPotential='Low';assert.equal(stockClassFor(cars[id]),factory);assert.deepEqual(getCrewRecruitmentChallengeRules(source,{baseCarId:id}).eligibleCarIds,before);}
  finally{STOCK_CLASS_DATA[id].tuningPotential=saved;}
 }
 assert.equal(tuningPotentialSummary({id:'copy',ownedBaseCarId:'ae86'}),tuningPotentialSummary(cars.ae86));
});
