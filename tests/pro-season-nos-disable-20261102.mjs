import {applyProRaceNosLimit} from '../src/data/proRaceNos.js';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';
import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Phaser={Math:{Clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),Linear:(a,b,t)=>a+(b-a)*t}};
import {getProfessionalCarEligibility} from '../src/data/proSeason.js';
import {cars} from '../src/data/cars.js';
import {setDriverPowerPartLevels,getDriverPowerPartLevelInfo} from '../src/data/proDriverBriefing.js';

test('manual NOS off allows fitted NOS at no-NOS scrutineering',()=>{
  const fitted={nosInstalled:true,nosShots:3,nosEnabled:false,exhaustNosTuning:{nosKit:3,nitrousShot:2}};
  const enabled={...fitted,nosEnabled:true};
  const rules={noNos:true};
  const off=getProfessionalCarEligibility('ef',fitted,rules);
  const on=getProfessionalCarEligibility('ef',enabled,rules);
  assert.ok(!off.reasons.some(reason=>reason.includes('NOS')),JSON.stringify(off.reasons));
  assert.ok(on.reasons.some(reason=>reason.includes('NOS')));
  assert.equal(fitted.nosEnabled,false,'scrutineering must not change the car');
});

test('shot caps allow owned hardware and limit only usable shots in the live race',()=>{
  const fitted={nosInstalled:true,nosShots:3,nosEnabled:true,exhaustNosTuning:{nosKit:3,nitrousShot:2}};
  const over=getProfessionalCarEligibility('ef',fitted,{maxNosShots:1});
  assert.equal(over.eligible,true);
  const config=getBuiltCar('ef',fitted).car;
  const limited=applyProRaceNosLimit(config,{maxNosShots:1});
  assert.equal(limited.nosShots,1);
  assert.equal(limited.nosCapacitySeconds,limited.nosShotDurationSeconds);
  assert.equal(config.nosShots,3,'build and purchased hardware stay intact');
  const disabled=getProfessionalCarEligibility('ef',{...fitted,nosEnabled:false},{maxNosShots:1});
  assert.ok(!disabled.reasons.some(reason=>reason.includes('NOS LIMIT')));
  assert.equal(fitted.nosShots,3);
});

test('factory-NOS collectors honor the manual switch even in legacy saves',()=>{
  const entry=Object.entries(cars).find(([,car])=>
    (car.tuningLocked||car.lbwkFullWorks||car.arkonOneOff) &&
    Number(car.nosPower||0)>0 && Number(car.nosShots||0)>0);
  assert.ok(entry,'at least one factory-nitrous collector must exist');
  const [carId]=entry;
  const active=getProfessionalCarEligibility(carId,{nosInstalled:false},{noNos:true});
  const off=getProfessionalCarEligibility(carId,{nosInstalled:false,nosEnabled:false},{noNos:true});
  assert.ok(active.reasons.some(x=>x.includes('NOS')),JSON.stringify(active));
  assert.ok(!off.reasons.some(x=>x.includes('NOS')),JSON.stringify(off));
});

test('driver preparation manually selects one or two shots from an owned three-shot kit',()=>{
  const owned={nosInstalled:true,nosEnabled:true,exhaustNosTuning:{nosKit:3,nitrousShot:2}};
  const one=setDriverPowerPartLevels(owned,{nosKit:1});
  assert.equal(getDriverPowerPartLevelInfo(one,'nosKit').current,1);
  assert.equal(getDriverPowerPartLevelInfo(one,'nosKit').original,3);
  assert.equal(getProfessionalCarEligibility('ef',one,{maxNosShots:1}).eligible,true);
  const two=setDriverPowerPartLevels(one,{nosKit:2});
  assert.equal(getDriverPowerPartLevelInfo(two,'nosKit').current,2);
  assert.equal(getProfessionalCarEligibility('ef',two,{maxNosShots:1}).eligible,true);
  assert.equal(getProfessionalCarEligibility('ef',two,{maxNosShots:2}).eligible,true);
  const off=setDriverPowerPartLevels(two,{nosKit:0});
  assert.equal(getDriverPowerPartLevelInfo(off,'nosKit').current,0);
  assert.equal(getProfessionalCarEligibility('ef',off,{noNos:true}).eligible,true);
  const restored=setDriverPowerPartLevels(off,{nosKit:3});
  assert.equal(getDriverPowerPartLevelInfo(restored,'nosKit').current,3);
  assert.equal(restored.proBriefingNosStash,undefined);
  assert.equal(restored.exhaustNosTuning.nitrousShot,2);
  assert.equal(owned.exhaustNosTuning.nosKit,3,'saved purchased hardware remains untouched');
});

import NitrousSystem from '../src/vehicles/NitrousSystem.js';
import {readFileSync} from 'node:fs';
test('player and AI receive identical usable shot limits without mutating saved builds',()=>{
  const original=Object.freeze({nosPower:50,nosShots:3,nosShotDurationSeconds:1.2,nosCapacitySeconds:3.6});
  for(const [rules,shots] of [[null,3],[{},3],[{maxNosShots:1},1],[{maxNosShots:2},2],[{maxNosShots:0},0],[{noNos:true,maxNosShots:3},0]]){
    for(const role of ['player','rival']){
      const race=applyProRaceNosLimit(original,rules);
      const system=new NitrousSystem(race);
      assert.equal(system.totalShots,shots,role);
      if(shots===0)assert.equal(system.powerHp,0,role);
      assert.equal(original.nosShots,3);
    }
  }
  const scene=readFileSync(new URL('../src/scenes/FourLaneTestScene.js',import.meta.url),'utf8');
  assert.match(scene,/applyProRaceNosLimit\(playerConfig, eventNosRules\)/);
  assert.match(scene,/applyProRaceNosLimit\(built.car, activeRules\)/);
  assert.match(scene,/new Vehicle\(rivalConfig, built.engine\)/);
});
