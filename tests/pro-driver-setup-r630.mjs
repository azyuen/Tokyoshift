import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BRIEFING_POWER_PARTS, getDriverPowerPartLevelInfo,
  setDriverPowerPartLevel, setDriverPowerPartLevels,
  restoreDriverBriefingParts, driverBriefingEligibility,
  toggleBriefingNos,
} from '../src/data/proDriverBriefing.js';
import { getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const active = () => ({active:true,proEvent:true,openCircuit:true,
  playerCarId:'ae86',roundIndex:0,rounds:[{carId:'r32',characterId:'emiKanzaki'}],
  briefingRules:{maxPowerKW:500,noNos:false}});
const installed = () => ({
  nosInstalled:true,
  tuning:{turbo:3,ecu:3,engine:2,intake:2},
  drivetrainTuning:{clutch:3,gearbox:3,differential:2,suspension:2},
  chassisTuning:{tyres:3,weightReduction:3},
  exhaustNosTuning:{headers:3,exhaust:2,muffler:2,nosKit:2,nitrousShot:3},
  dyno:{officialReading:{powerKW:200,torqueNm:340}},
});

test('pro setup accepts any owned level, never buys or changes original car state', () => {
  const original=installed(), snapshot=JSON.stringify(original);
  const reduced=setDriverPowerPartLevels(original,{
    turbo:1,ecu:2,engine:1,gearbox:1,tyres:1,weightReduction:1,
    clutch:2,headers:1,
  });
  assert.equal(JSON.stringify(original),snapshot);
  assert.equal(reduced.tuning.turbo,1);
  assert.equal(reduced.tuning.ecu,2);
  assert.equal(reduced.drivetrainTuning.gearbox,1);
  assert.equal(reduced.chassisTuning.weightReduction,1);
  assert.equal(reduced.proBriefingPowerStash.tuning.turbo,3);
  assert.equal(reduced.proBriefingPowerStash.drivetrainTuning.gearbox,3);
  assert.equal(reduced.proBriefingPowerStash.chassisTuning.weightReduction,3);
  assert.equal(reduced.dyno.officialReading,null);
  assert.deepEqual(getDriverPowerPartLevelInfo(reduced,'turbo'),{
    current:1,original:3,stored:true,
  });
  const raised=setDriverPowerPartLevel(reduced,'turbo',2);
  assert.equal(raised.tuning.turbo,2);
  assert.equal(raised.proBriefingPowerStash.tuning.turbo,3);
  const restoredLevel=setDriverPowerPartLevel(raised,'turbo',3);
  assert.equal(restoredLevel.proBriefingPowerStash.tuning.turbo,undefined);
  assert.equal(restoredLevel.tuning.turbo,3);
  assert.equal(setDriverPowerPartLevel(reduced,'turbo',4),reduced);
  assert.equal(setDriverPowerPartLevel(reduced,'turbo',-1),reduced);
});

test('changes to weight reduction modify live physics weight and engine output refreshes', () => {
  const original=installed();
  const lighter=getVehiclePerformance('ae86',original);
  const heavierState=setDriverPowerPartLevels(original,{
    turbo:1,engine:1,weightReduction:0,headers:0,
  });
  const heavier=getVehiclePerformance('ae86',heavierState);
  assert.ok(heavier.car.vehicleMassKg>lighter.car.vehicleMassKg);
  assert.ok(heavier.car.powerKW<lighter.car.powerKW);
  assert.ok(Number.isFinite(heavier.car.torqueNm));
  assert.ok(heavierState.chassisTuning.weightReduction===0);
});

test('all purchased levels and NOS restore atomically at end of pro event', () => {
  const original=installed();
  const provisional=setDriverPowerPartLevels(original,{
    turbo:1,ecu:1,clutch:0,weightReduction:2,exhaust:0,
    nosKit:0,
  });
  assert.equal(provisional.nosInstalled,false);
  assert.equal(provisional.proBriefingNosStash.exhaustNosTuning.nitrousShot,3);
  const states={ae86:provisional};
  const restored=restoreDriverBriefingParts(states,active());
  assert.equal(restored.ae86.tuning.turbo,3);
  assert.equal(restored.ae86.tuning.ecu,3);
  assert.equal(restored.ae86.drivetrainTuning.clutch,3);
  assert.equal(restored.ae86.chassisTuning.weightReduction,3);
  assert.equal(restored.ae86.exhaustNosTuning.exhaust,2);
  assert.equal(restored.ae86.nosInstalled,true);
  assert.equal(restored.ae86.exhaustNosTuning.nosKit,2);
  assert.equal(restored.ae86.exhaustNosTuning.nitrousShot,3);
  assert.equal(restored.ae86.proBriefingPowerStash,undefined);
  assert.equal(restored.ae86.proBriefingNosStash,undefined);
  assert.equal(states.ae86.proBriefingPowerStash.tuning.turbo,3);
});

test('NOS restoration preserves separately downgraded exhaust hardware', () => {
  const state=installed();
  const noNos=toggleBriefingNos(state);
  const lower=setDriverPowerPartLevel(noNos,'exhaust',1);
  const reinstalled=toggleBriefingNos(lower);
  assert.equal(reinstalled.exhaustNosTuning.nosKit,2);
  assert.equal(reinstalled.exhaustNosTuning.nitrousShot,3);
  assert.equal(reinstalled.exhaustNosTuning.exhaust,1);
  assert.equal(reinstalled.proBriefingPowerStash.exhaustNosTuning.exhaust,2);
});

test('legacy exhaust upgrade is visible and can be temporarily lowered', () => {
  const state={tuning:{engine:0,exhaust:2},exhaustNosTuning:{}};
  assert.equal(getDriverPowerPartLevelInfo(state,'exhaust').current,2);
  const reduced=setDriverPowerPartLevel(state,'exhaust',1);
  assert.equal(reduced.exhaustNosTuning.exhaust,1);
  assert.equal(reduced.proBriefingPowerStash.exhaustNosTuning.exhaust,2);
});

test('ineligible grid stays disabled until all actual regulations pass', () => {
  const state=active(),raw=installed();
  const restricted={...state,briefingRules:{maxPowerKW:120,noNos:true}};
  const originalPower=getVehiclePerformance('ae86',raw).car.powerKW;
  const initial=driverBriefingEligibility(restricted,raw,originalPower,['ae86']);
  assert.equal(initial.eligible,false);
  assert.ok(initial.problems.some(reason=>reason.includes('POWER')));
  assert.ok(initial.problems.some(reason=>reason.includes('NOS')));
  const noNos=setDriverPowerPartLevel(raw,'nosKit',0);
  assert.ok(!driverBriefingEligibility(restricted,noNos,originalPower,['ae86']).eligible);
  const stock=driverBriefingEligibility(
    {...state,briefingRules:{stock:true}},
    raw,originalPower,['ae86']
  );
  assert.equal(stock.eligible,false);
  const drive=driverBriefingEligibility(
    {...state,briefingRules:{drivetrain:'AWD'}},
    {},110,['ae86']
  );
  assert.equal(drive.eligible,false);
  assert.ok(drive.problems.includes('REQUIRES AWD'));
});

test('Daichi UI exposes both tabs, four levels, real build readouts and disabled entry', () => {
  const ui=read('src/ui/ProDriverBriefing.js');
  const crew=read('src/ui/ProCrewBattleLineup.js');
  const complex=read('src/scenes/CentralTokyoScene.js');
  assert.equal(BRIEFING_POWER_PARTS.length,15);
  for(const part of ['turbo','ecu','nosKit','clutch','gearbox','suspension','tyres','weightReduction'])
    assert.ok(BRIEFING_POWER_PARTS.some(p=>p.id===part));
  assert.ok(ui.includes('ENGINE + NOS') && ui.includes('GRIP + WEIGHT'));
  assert.ok(ui.includes("level===0?'STOCK':'L'+level"));
  assert.ok(ui.includes('setDriverPowerPartLevels(carState,requestedLevels)'));
  assert.ok(ui.includes('addLiveEngineeringMetrics(carState)'));
  assert.ok(ui.includes("Number(config?.vehicleMassKg)"));
  assert.ok(ui.includes('previewMetrics(previewState)'));
  assert.ok(ui.includes('INELIGIBLE CAR SETUP'));
  assert.ok(ui.includes('{disabled:!eligibility.eligible}'));
  assert.ok(crew.includes("INELIGIBLE CAR SETUP"));
  assert.ok(complex.includes('feetY: STAGE.y + 372 + feetJitter'));
  assert.ok(!complex.includes('REGIONAL RIVALS // MOVED UP TO THE COMPLEX'));
  assert.ok(complex.includes('xJitter'));
});
