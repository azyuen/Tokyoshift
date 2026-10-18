import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isOpenDriverBriefing, driverBriefingRules, driverBriefingEligibility,
  driverAdviceStatus, consumeDriverAdvice, driverOpponentAdvice,
  toggleBriefingNos, restoreDriverBriefingNos, restoreDriverBriefingParts,
  removeDriverPowerPart, restoreDriverPowerParts,
} from '../src/data/proDriverBriefing.js';

const driver=()=>({
  active:true,proEvent:true,openCircuit:true,openTrophyId:null,
  playerCarId:'ae86',eventId:'streetShootout',roundIndex:0,
  rounds:[{carId:'r32',characterId:'opponent'},{carId:'s2000',characterId:'another'}],
  briefingRules:{maxPowerKW:225,noNos:true},entryFee:10000,
});
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('only saved Open Circuit individual driver heats enter the room',()=>{
  assert.equal(isOpenDriverBriefing(driver()),true);
  assert.equal(isOpenDriverBriefing({...driver(),openCircuit:false}),false);
  assert.equal(isOpenDriverBriefing({...driver(),openTrophyId:'shutoSpeed'}),false);
  assert.equal(isOpenDriverBriefing({...driver(),proEvent:false}),false);
  assert.equal(isOpenDriverBriefing({...driver(),active:false}),false);
  assert.equal(isOpenDriverBriefing({...driver(),roundIndex:9}),false);
  assert.equal(isOpenDriverBriefing({...driver(),rounds:[]}),false);
});

test('registered car ownership, power and NOS restrictions are checked on each heat',()=>{
  const state=driver();
  assert.deepEqual(driverBriefingRules(state),{maxPowerKW:225,noNos:true});
  assert.equal(driverBriefingEligibility(state,{},212,['ae86']).eligible,true);
  assert.match(driverBriefingEligibility(state,{},230,['ae86']).problems[0],/POWER/);
  assert.match(driverBriefingEligibility(state,{nosInstalled:true},212,['ae86']).problems[0],/NOS/);
  assert.match(driverBriefingEligibility(state,{},212,[]).problems[0],/OWNED/);
  assert.equal(driverBriefingEligibility({...state,briefingRules:{maxPowerKW:null,noNos:false}}, {},500,['ae86']).eligible,true);
});

test('driver advice uses the existing crew professional-event cooldown and cannot be farmed between heats',()=>{
  const state=driver(),circuit={eventTick:14,crewAdviceCooldownUntil:0};
  assert.equal(driverAdviceStatus(circuit,state).available,true);
  const out=consumeDriverAdvice(circuit,state);
  assert.equal(out.circuit.crewAdviceCooldownUntil,17);
  assert.equal(out.competitionState.briefingAdviceUsed,true);
  assert.match(consumeDriverAdvice(out.circuit,out.competitionState).error,/ALREADY USED/);
  const nextHeat={...out.competitionState,roundIndex:1};
  assert.equal(driverAdviceStatus({...out.circuit,eventTick:15},nextHeat).available,false);
  assert.equal(driverAdviceStatus({...out.circuit,eventTick:16},{...driver(),briefingAdviceUsed:false}).remaining,1);
  assert.equal(driverAdviceStatus({...out.circuit,eventTick:17},driver()).available,true);
  assert.match(driverOpponentAdvice({shortName:'R32',drivetrain:'AWD'},{
    name:'Kenji Sato'},{}),/AWD/);
});

test('Daichi removes NOS reversibly and returns paid hardware when event completes',()=>{
  const original={
    nosInstalled:true,exhaustNosTuning:{nosKit:3,nitrousShot:2,exhaust:3},
    tuning:{ecu:3},stage3Calibration:{ecuBias:2},
    dyno:{officialReading:{powerKW:200}},
  };
  const removed=toggleBriefingNos(original);
  assert.equal(removed.nosInstalled,false);
  assert.equal(removed.exhaustNosTuning.nosKit,0);
  assert.equal(removed.exhaustNosTuning.exhaust,3);
  assert.equal(original.exhaustNosTuning.nosKit,3,'no original mutation');
  assert.equal(removed.dyno.officialReading,null);
  assert.equal(driverBriefingEligibility(driver(),removed,210,['ae86']).eligible,true);
  const restored=restoreDriverBriefingNos({ae86:removed},driver());
  assert.equal(restored.ae86.exhaustNosTuning.nosKit,3);
  assert.equal(restored.ae86.nosInstalled,true);
  assert.equal(restored.ae86.proBriefingNosStash,undefined);
  assert.equal(restoreDriverBriefingNos({ae86:removed},{...driver(),openTrophyId:'shutoSpeed'}),null);
  assert.deepEqual(toggleBriefingNos(removed).exhaustNosTuning,original.exhaustNosTuning);
});

test('engine and exhaust power parts can be temporarily removed without losing upgrades',()=>{
  const original={tuning:{engine:3,turbo:2,ecu:3,intake:2},
    exhaustNosTuning:{headers:2,exhaust:3,muffler:1,nosKit:2,nitrousShot:1},
    dyno:{officialReading:{powerKW:280}}};
  const turbo=removeDriverPowerPart(original,'turbo');
  const exhaust=removeDriverPowerPart(turbo,'headers');
  assert.equal(turbo.tuning.turbo,0);
  assert.equal(exhaust.exhaustNosTuning.headers,0);
  assert.equal(exhaust.exhaustNosTuning.nosKit,2);
  assert.equal(exhaust.proBriefingPowerStash.tuning.turbo,2);
  assert.equal(exhaust.proBriefingPowerStash.exhaustNosTuning.headers,2);
  assert.equal(exhaust.dyno.officialReading,null);
  assert.equal(original.tuning.turbo,2,'purchased upgrade remains unchanged');
  const restored=restoreDriverPowerParts(exhaust);
  assert.equal(restored.tuning.turbo,2);
  assert.equal(restored.exhaustNosTuning.headers,2);
  assert.equal(restored.proBriefingPowerStash,undefined);
  assert.equal(removeDriverPowerPart(original,'random'),original);
  const both=toggleBriefingNos(exhaust);
  const settled=restoreDriverBriefingParts({ae86:both},driver());
  assert.equal(settled.ae86.exhaustNosTuning.nosKit,2);
  assert.equal(settled.ae86.exhaustNosTuning.headers,2);
  assert.equal(settled.ae86.tuning.turbo,2);
  assert.equal(settled.ae86.proBriefingPowerStash,undefined);
});

test('production routing is scoped, restart-safe, and does not alter crew or season entry',()=>{
  const drag=read('../src/scenes/CentralTokyoScene.js');
  const race=read('../src/scenes/FourLaneTestScene.js');
  const ui=read('../src/ui/ProDriverBriefing.js');
  assert.match(drag,/if\(isOpenDriverBriefing\(activeDuel\)\)this\.showOpenCircuitDriverBriefing\(\)/);
  assert.match(drag,/if \(isOpenDriverBriefing\(state\)\)this\.showOpenCircuitDriverBriefing\(\)/);
  assert.match(drag,/autoOpenProDriverBriefing/);
  assert.match(race,/autoOpenProDriverBriefing:true/);
  assert.match(race,/restoreDriverBriefingParts/);
  assert.match(ui,/regozoomed_/);
  assert.match(ui,/pro_daichi_sakamoto\.png/);
  assert.match(ui,/race_sayaka_fujieda_idle\.png/);
  assert.match(ui,/getStage3CalibrationEligibility/);
  assert.match(ui,/PROCEED TO GRID/);
  assert.match(ui,/ASK FOR ADVICE/);
});
