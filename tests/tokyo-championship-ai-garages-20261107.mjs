import test from 'node:test';
import { TUNER_OPTION_BY_ID, areTunerOptionRequirementsMet } from '../src/data/tunerShops.js';
import assert from 'node:assert/strict';
import {
  CHAMPIONSHIP_AI_CAR_POOL, CHAMPIONSHIP_AI_RARE_CAR_POOL,\n  CHAMPIONSHIP_AI_RARE_CAR_PERCENT, createChampionshipAiGarage, getChampionshipAiCar,
} from '../src/data/tokyoChampionship.js';

test('each rival receives three distinct, deterministic road-car builds',()=>{
  for(const id of ['pro:one','pro:two','pro:three']){
    const garage=createChampionshipAiGarage('tokyo:s2',id);
    assert.equal(garage.length,3);
    assert.equal(new Set(garage.map(v=>v.carId)).size,3);
    assert.ok(garage.every(v=>[...CHAMPIONSHIP_AI_CAR_POOL,...CHAMPIONSHIP_AI_RARE_CAR_POOL].includes(v.carId)));
    assert.ok(garage.every(v=>v.state&&v.state.buildRating===5));
    assert.deepEqual(garage,createChampionshipAiGarage('tokyo:s2',id));
  }
});
test('rival event car selection persists through save and reload',()=>{
  const garage=createChampionshipAiGarage('tokyo:s3','rival');
  const state=JSON.parse(JSON.stringify({entrants:[{id:'rival',garage}]}));
  assert.deepEqual(getChampionshipAiCar(state,'rival','KNOCKOUT'),garage[0]);
  assert.deepEqual(getChampionshipAiCar(state,'rival','CREW'),garage[1]);
  assert.deepEqual(getChampionshipAiCar(state,'rival','FOUR_WIDE'),garage[2]);\n  assert.deepEqual(getChampionshipAiCar(state,'rival','FOUR_WIDE',1),garage[0]);\n  assert.deepEqual(getChampionshipAiCar(state,'rival','FOUR_WIDE',2),garage[1]);\n  assert.deepEqual(getChampionshipAiCar(state,'rival','FOUR_WIDE',2),getChampionshipAiCar(state,'rival','FOUR_WIDE',2));
  assert.equal(getChampionshipAiCar({entrants:[{id:'rival'}]},'rival'),null);
});

test('Championship cars have level-three hardware, stage-three maps and specialist packages',()=>{
  const garage=createChampionshipAiGarage('tokyo:s4','rival:full-build');
  for(const [index,{state}] of garage.entries()){
    for(const group of ['tuning','drivetrainTuning','chassisTuning','exhaustNosTuning'])
      assert.ok(Object.values(state[group]).every(level=>level===3),group);
    assert.equal(state.nosInstalled,true);
    assert.equal(state.tuneLevel,3);
    assert.ok(state.specialistTuning.length>0&&state.specialistTuning.length<=6);
    assert.ok(state.stage3Calibration);
    assert.equal(state.stage3Calibration.ecuBias,[-2,0,2][index]);
  }
});

test('every selected regional package has its specialist prerequisites installed',()=>{
  const garage=createChampionshipAiGarage('tokyo:s5','rival:prerequisites');
  for(const {state} of garage){
    const installed=new Set(state.specialistTuning);
    for(const id of installed){
      const option=TUNER_OPTION_BY_ID[id];
      assert.ok(option,'unknown specialist option '+id);
      assert.ok(areTunerOptionRequirementsMet(state,option),'invalid package '+id);
      for(const required of option.requirements?.specialist||[])
        assert.ok(installed.has(required),'missing dependency '+required);
    }
  }
});

test('rare special cars remain a minority of generated rival garages',()=>{
  let rare=0,total=0;
  for(let i=0;i<300;i++)for(const entry of createChampionshipAiGarage('tokyo:s'+(i%5),'rival:'+i)){
    total++;
    if(CHAMPIONSHIP_AI_RARE_CAR_POOL.includes(entry.carId))rare++;
  }
  assert.ok(rare>0,'special cars should appear occasionally');
  assert.ok(rare/total<0.2,'special cars should be uncommon');
  assert.equal(CHAMPIONSHIP_AI_RARE_CAR_PERCENT,10);
});
