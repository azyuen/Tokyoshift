import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js';
import { getCrewLoanCarId } from '../src/data/crewRoster.js';
import {
  PART_UNINSTALL_FEE, STORE_KIT_REMOVE_FEE, STORE_KIT_RESTORE_FEE,
  getPartRemovalQuote, listStorableKitParts,
  storeSelectedKitParts, restoreStoredKitParts,
} from '../src/data/partUninstall.js';
import {
  CREW_BATTLE_REGION_RULES, getCrewEventCarSetup,
  isCrewEventFactoryStock, validateCrewBattleBuiltCar,
} from '../src/data/crewBattleRules.js';
import { buildRegionalCrewBattleRounds } from '../src/data/crewSystem.js';
import { getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('global uninstall/restore fees are exactly 20k/50k', () => {
  assert.equal(PART_UNINSTALL_FEE, 20000);
  assert.equal(STORE_KIT_REMOVE_FEE, 20000);
  assert.equal(STORE_KIT_RESTORE_FEE, 50000);
  assert.equal(getPartRemovalQuote({tuning:{engine:1}},'engine','engine').cost,20000);
  assert.equal(getPartRemovalQuote({tuning:{engine:3}},'engine','engine').cost,20000);
});

test('recruited crew loan parts can be stored and restored without affecting ownership or cosmetics', () => {
  const carId = getCrewLoanCarId('aoiShindou');
  assert.ok(cars[carId]?.crewLoan);
  const original={
    acquiredVia:'crewLoan',crewLoan:true,crewOwnerCharacterId:'aoiShindou',
    paintColor:0x3388ee,visualMods:{bodyKit:'stock'},
    nosInstalled:true, nosShots:1, nosPower:40, nosCapacitySeconds:1.5,
    tuning:{engine:2,intake:1},
    drivetrainTuning:{clutch:1},
    exhaustNosTuning:{nosKit:1,nitrousShot:1},
  };
  const before=JSON.stringify(original);
  const keys=listStorableKitParts(original).map(item=>item.key);
  assert.ok(keys.includes('engine:engine'));
  assert.ok(keys.includes('exhaustNos:nosKit'));
  const stored=storeSelectedKitParts(original,keys);
  assert.ok(stored?.storedKit);
  assert.equal(stored.tuning.engine,0);
  assert.equal(stored.exhaustNosTuning.nosKit,0);
  assert.equal(stored.nosInstalled,false);
  assert.equal(stored.crewOwnerCharacterId,'aoiShindou');
  assert.equal(stored.paintColor,0x3388ee);
  assert.equal(JSON.stringify(original),before,'owner state is never mutated');
  const restored=restoreStoredKitParts(stored);
  assert.equal(restored.tuning.engine,2);
  assert.equal(restored.exhaustNosTuning.nosKit,1);
  assert.equal(restored.exhaustNosTuning.nitrousShot,1);
  assert.equal(restored.nosInstalled,true);
  assert.equal(restored.storedKit,undefined);
  assert.deepEqual(restored.visualMods,original.visualMods);
  assert.equal(restored.crewOwnerCharacterId,original.crewOwnerCharacterId);
});

test('no event forcibly downtunes a player car', () => {
  const upgraded={nosInstalled:true, tuning:{engine:3},exhaustNosTuning:{nosKit:1,nitrousShot:1}};
  const before=JSON.stringify(upgraded);
  for(const rule of [
    {stock:true,noNos:true,label:'FACTORY STOCK'},
    {noNos:true,label:'NO NOS'},
    {maxPowerKW:100,label:'MAX 100 KW'},
  ]) {
    const result=getCrewEventCarSetup('ae86',upgraded,rule);
    assert.equal(result.eligible,false,rule.label);
    assert.deepEqual(result.state,upgraded);
  }
  assert.equal(JSON.stringify(upgraded),before);
  assert.equal(isCrewEventFactoryStock({tuning:{engine:1}}),false);
  assert.equal(isCrewEventFactoryStock({tuning:{engine:0},paintColor:0x00ff00}),true);
  assert.equal(isCrewEventFactoryStock({exhaustNosTuning:{nosKit:1}}),false);
});

test('live regulation validator applies identically to player and opponent', () => {
  const noNos={noNos:true,label:'NO NOS'};
  const car={powerKW:190,nosPower:35,nosCapacitySeconds:1,nosShots:1};
  for(const side of ['player','opponent']) {
    const invalid=validateCrewBattleBuiltCar(car,{nosInstalled:true},noNos);
    assert.equal(invalid.eligible,false,side);
    assert.equal(invalid.reason,'NO NOS INSTALLED');
  }
  assert.equal(validateCrewBattleBuiltCar(
    {powerKW:221,nosPower:0,nosCapacitySeconds:0}, {}, {maxPowerKW:220}
  ).eligible,false);
  assert.equal(validateCrewBattleBuiltCar(
    {powerKW:219,nosPower:0,nosCapacitySeconds:0}, {}, {maxPowerKW:220}
  ).eligible,true);
});

test('regional rivals have legal physical builds and the agreed progressive formats', () => {
  const expected={
    ODAIBA:[['Standing Start',402.336],['Standing Start',402.336],['Standing Start',402.336]],
    SHINAGAWA:[['Standing Start',402.336],['Standing Start',402.336],['Standing Start',402.336]],
    TATSUMI:[['Standing Start',402.336],['Standing Start',402.336],['Standing Start',402.336]],
    SHIBUYA:[['Standing Start',402.336],['Roll Race',402.336],['Standing Start',402.336]],
    YOKOHAMA:[['Standing Start',402.336],['Roll Race',402.336],['Standing Start',804.672]],
    DAIKOKU:[['Roll Race',402.336],['Standing Start',804.672],['Standing Start',402.336]],
    SHINJUKU:[['Standing Start',402.336],['Roll Race',402.336],['Standing Start',804.672]],
  };
  assert.equal(CREW_BATTLE_REGION_RULES.TATSUMI.heats[0].maxPowerKW,220);
  assert.equal(CREW_BATTLE_REGION_RULES.YOKOHAMA.heats[0].maxPowerKW,300);
  assert.equal(CREW_BATTLE_REGION_RULES.SHINJUKU.heats[1].noNos,true);
  for(const [region,formats] of Object.entries(expected)) {
    const rounds=buildRegionalCrewBattleRounds(region);
    assert.equal(rounds.length,3,region+' must have three legal opponents');
    for(let i=0;i<3;i++) {
      const round=rounds[i];
      assert.deepEqual([round.raceType,round.distanceM],formats[i]);
      const built=getVehiclePerformance(round.carId,round.opponentBuildState).car;
      assert.equal(
        validateCrewBattleBuiltCar(built,round.opponentBuildState,round.rule).eligible,
        true,region+' rival heat '+(i+1)+' must obey ALL actual physics restrictions'
      );
      if(round.rule.noNos) {
        assert.equal(Number(built.nosPower||0),0);
        assert.equal(Number(built.nosShots||0),0);
        assert.equal(Number(built.nosCapacitySeconds||0),0);
      }
    }
  }
});

test('Crew Space service is present and live races reject invalid AI builds', () => {
  const garage=read('src/scenes/GarageScene.js');
  const race=read('src/scenes/RaceScene.js');
  assert.match(garage,/this\.crewMode \? 608 : 662/);
  assert.match(garage,/this\.buildCrewSpaceNavigation\(\);\s*this\.buildStoreRestoreKitButton\(\);/);
  assert.match(garage,/this\.getCurrentWorkshopCars\(\)\.includes\(carId\)/);
  assert.match(race,/validateCrewBattleBuiltCar\(\s*opponentConfig, this\.opponentBuildState, rule/);
  assert.match(race,/validateCrewBattleBuiltCar\(\s*playerConfig, this\.playerCarState, rule/);
});

test('crew lineup communicates heat restrictions and precise eligibility failures', () => {
  const meet = read('src/scenes/MeetScene.js');
  assert.match(meet, /HEAT 3 ONLY IF THE SERIES IS TIED 1-1/);
  assert.match(meet, /NO AUTO DOWN-TUNING/);
  assert.match(meet, /lineupComplianceLabel\.setText\(notice\)/);
  assert.match(meet, /NOT ELIGIBLE:/);
  assert.match(meet, /SELECT CREW MEMBER \/\/ HEAT /);
  assert.match(meet, /chosenHeat\.ruleLabel/);
});
