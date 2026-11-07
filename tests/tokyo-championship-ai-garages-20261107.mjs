import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAMPIONSHIP_AI_CAR_POOL, createChampionshipAiGarage, getChampionshipAiCar,
} from '../src/data/tokyoChampionship.js';

test('each rival receives three distinct, deterministic road-car builds',()=>{
  for(const id of ['pro:one','pro:two','pro:three']){
    const garage=createChampionshipAiGarage('tokyo:s2',id);
    assert.equal(garage.length,3);
    assert.equal(new Set(garage.map(v=>v.carId)).size,3);
    assert.ok(garage.every(v=>CHAMPIONSHIP_AI_CAR_POOL.includes(v.carId)));
    assert.ok(garage.every(v=>v.state&&v.state.buildRating===5));
    assert.deepEqual(garage,createChampionshipAiGarage('tokyo:s2',id));
  }
});
test('rival event car selection persists through save and reload',()=>{
  const garage=createChampionshipAiGarage('tokyo:s3','rival');
  const state=JSON.parse(JSON.stringify({entrants:[{id:'rival',garage}]}));
  assert.deepEqual(getChampionshipAiCar(state,'rival','KNOCKOUT'),garage[0]);
  assert.deepEqual(getChampionshipAiCar(state,'rival','CREW'),garage[1]);
  assert.deepEqual(getChampionshipAiCar(state,'rival','FOUR_WIDE'),garage[2]);
  assert.equal(getChampionshipAiCar({entrants:[{id:'rival'}]},'rival'),null);
});

test('Championship cars have level-three hardware, stage-three maps and specialist packages',()=>{
  const garage=createChampionshipAiGarage('tokyo:s4','rival:full-build');
  for(const [index,{state}] of garage.entries()){
    for(const group of ['tuning','drivetrainTuning','chassisTuning','exhaustNosTuning'])
      assert.ok(Object.values(state[group]).every(level=>level===3),group);
    assert.equal(state.nosInstalled,true);
    assert.equal(state.tuneLevel,3);
    assert.equal(state.specialistTuning.length,6);
    assert.ok(state.stage3Calibration);
    assert.equal(state.stage3Calibration.ecuBias,[-2,0,2][index]);
  }
});
