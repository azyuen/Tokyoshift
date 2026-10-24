import test from 'node:test';
import assert from 'node:assert/strict';
import { getTunerShopForRegion } from '../src/data/tunerShops.js';
import { isCrewEventFactoryStock } from '../src/data/crewBattleRules.js';
import { getCrewRecruitmentChallengeRules } from '../src/data/crewSystem.js';
import { getStockTuneServiceAction, applyStockTuneService } from '../src/data/stockTuneService.js';

const shop = getTunerShopForRegion('SHINAGAWA');
const state = {
  stock:false, tuning:{engine:2,intake:1}, engineTuning:{engine:2,intake:1},
  drivetrainTuning:{gearbox:2}, chassisTuning:{tyres:1},
  exhaustNosTuning:{nosKit:1,nitrousShot:2}, nosInstalled:true,
  nosPower:50,nosShots:2,nosCapacitySeconds:3,
  specialistTuning:[shop.tuningOptions[0].id],
  stage3Calibration:{ecuBias:1,boostBias:-1,gearBias:1},
  paintColor:0x334455, visualMods:{bodyKit:'stock'}, tuneLevel:0,
  acquiredVia:'garage',
};
test('original specialist and tier fee required', () => {
  assert.equal(getStockTuneServiceAction(state,shop).action,'PREPARE');
  assert.equal(getStockTuneServiceAction(state,shop).fee,5000);
  assert.equal(getStockTuneServiceAction(state).action,null);
  assert.equal(getStockTuneServiceAction(state,getTunerShopForRegion('SHINJUKU')).action,null);
});
test('complete reversible tuning snapshot preserves purchases and cosmetics', () => {
  const before=JSON.stringify(state);
  const stock=applyStockTuneService(state,shop);
  assert.ok(isCrewEventFactoryStock(stock));
  assert.equal(stock.specialistTuning.length,0);
  assert.equal(stock.nosInstalled,false);
  assert.equal(getStockTuneServiceAction(stock,shop).action,'RESTORE');
  assert.equal(getStockTuneServiceAction(stock,getTunerShopForRegion('SHINJUKU')).action,null);
  stock.paintColor=0x778899;
  const restored=applyStockTuneService(stock,shop);
  assert.deepEqual(restored.tuning,state.tuning);
  assert.deepEqual(restored.engineTuning,state.engineTuning);
  assert.deepEqual(restored.stage3Calibration,state.stage3Calibration);
  assert.deepEqual(restored.specialistTuning,state.specialistTuning);
  assert.equal(restored.nosInstalled,true);
  assert.equal(restored.paintColor,0x778899);
  assert.equal(restored.stockTuneService,undefined);
  assert.equal(JSON.stringify(state),before);
});
test('Daichi handles ordinary workshop upgrades at Warehouse HQ', () => {
  const generic={...state,specialistTuning:[]};
  assert.equal(getStockTuneServiceAction(generic,shop).action,null);
  assert.equal(getStockTuneServiceAction(generic).fee,10000);
  const stock=applyStockTuneService(generic);
  assert.ok(isCrewEventFactoryStock(stock));
  assert.equal(getStockTuneServiceAction(stock).action,'RESTORE');
  assert.equal(applyStockTuneService(stock).tuning.engine,2);
});
test('existing stored kits are never overwritten', () => {
  const generic={...state,specialistTuning:[],storedKit:{version:1,parts:{'engine:engine':2}}};
  assert.equal(getStockTuneServiceAction(generic).action,null);
  assert.equal(applyStockTuneService(generic),null);
});
test('recruitment is stock-only and within +/-40kW on Easy', () => {
  const garage={ownedCarIds:['ek9','fc3s','gc8','rx7fd'],playerDifficulty:'EASY',
    carStates:{gc8:{tuning:{engine:2}},rx7fd:{nosInstalled:true}}};
  const source={get:key=>garage[key]};
  const svx=getCrewRecruitmentChallengeRules(source,{baseCarId:'svx'});
  assert.deepEqual([...svx.eligibleCarIds].sort(),['ek9','fc3s'].sort());
  const z32=getCrewRecruitmentChallengeRules(source,{baseCarId:'z32'});
  assert.deepEqual(z32.eligibleCarIds,[]);
  garage.carStates.gc8=applyStockTuneService(garage.carStates.gc8);
  assert.ok(getCrewRecruitmentChallengeRules(source,{baseCarId:'z32'}).eligibleCarIds.includes('gc8'));
});
