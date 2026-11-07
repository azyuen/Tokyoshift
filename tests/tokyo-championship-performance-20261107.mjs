// Run with: node --test tests/tokyo-championship-performance-20261107.mjs
// Uses production performance estimation; it does not modify race physics.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cars } from '../src/data/cars.js';
import { getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';
import { createChampionshipAiGarage } from '../src/data/tokyoChampionship.js';

const groups=['tuning','drivetrainTuning','chassisTuning','exhaustNosTuning'];
const referenceCarIds=['r34','evo6','rx7fd','s2000','r32','jza80','gc8','gdb','s15']
  .filter(id=>cars[id]&&!cars[id].tuningLocked);
function maxPlayerState(){
  return {
    stock:false,
    tuning:{engine:3,intake:3,ecu:3,turbo:3,intercooler:3},
    drivetrainTuning:{clutch:3,gearbox:3,differential:3,suspension:3},
    chassisTuning:{tyres:3,weightReduction:3},
    exhaustNosTuning:{headers:3,exhaust:3,muffler:3,nosKit:3,nitrousShot:3},
    nosInstalled:true,
    stage3Calibration:{ecuBias:0,boostBias:0,gearBias:0},
  };
}
test('all saved Championship rivals build into finite, race-ready configurations',()=>{
  for(let rival=0;rival<15;rival++){
    const garage=createChampionshipAiGarage('tokyo:s8','rival:'+rival);
    for(const {carId,state} of garage){
      for(const group of groups)
        assert.ok(Object.values(state[group]).every(n=>n===3),carId+':'+group);
      const perf=getVehiclePerformance(carId,state,{raceType:'Standing Start',distanceM:400});
      assert.ok(perf,'cannot build '+carId);
      assert.ok(Number.isFinite(perf.index.standing)&&perf.index.standing>0,carId);
      assert.ok(Number.isFinite(perf.index.simulation.standingSeconds),carId);
      assert.ok(perf.car.nosShots>0,'NOS unavailable on '+carId);
    }
  }
});
test('print Championship AI versus maximum player-road-car benchmark',()=>{
  const players=referenceCarIds.map(carId=>{
    const perf=getVehiclePerformance(carId,maxPlayerState(),{raceType:'Standing Start',distanceM:400});
    assert.ok(perf,'player reference missing '+carId);
    return {carId,seconds:perf.index.simulation.standingSeconds,standing:perf.index.standing};
  });
  const rivals=Array.from({length:15},(_,i)=>
    createChampionshipAiGarage('tokyo:s8','rival:'+i)
      .map(({carId,state})=>{
        const perf=getVehiclePerformance(carId,state,{raceType:'Standing Start',distanceM:400});
        return {carId,seconds:perf.index.simulation.standingSeconds,standing:perf.index.standing};
      })).flat();
  const range=rows=>({
    fastest:Math.min(...rows.map(v=>v.seconds)),
    median:[...rows].sort((a,b)=>a.seconds-b.seconds)[Math.floor(rows.length/2)].seconds,
    slowest:Math.max(...rows.map(v=>v.seconds)),
  });
  console.log('TOKYO CHAMPIONSHIP 400m standing-start ESTIMATES',JSON.stringify({
    playerMaxRoadCars:range(players),
    championshipRivals:range(rivals),
    playerByCar:players,
    rivalsByCar:rivals,
  },null,2));
});
