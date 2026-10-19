import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getVehiclePerformance} from '../src/vehicles/VehiclePerformance.js';
import {getBaseCarId} from '../src/data/carOwnership.js';
import {normaliseProCircuitState} from '../src/data/proCircuit.js';
import {forfeitOpenDriverTransaction,toggleBriefingNos,removeDriverPowerPart} from '../src/data/proDriverBriefing.js';

const source=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const event=()=>({
  active:true,proEvent:true,openCircuit:true,openTrophyId:null,
  playerCarId:'240z__copy2',eventId:'streetShootout',
  proSeasonId:'open:streetShootout:s1:e55',roundIndex:0,
  rounds:[
    {carId:'galant',characterId:'rival-a',encounterRating:3},
    {carId:'r32',characterId:'rival-b',encounterRating:4},
    {carId:'s2000',characterId:'rival-c',encounterRating:5},
  ],
  entryFee:30000,prizeCash:57000,
});
test('copy-car performance is built using its true model but its individual tuned state',()=>{
  assert.equal(getBaseCarId('240z__copy2'),'240z');
  const state={tuning:{engine:2,intake:2,ecu:2},exhaustNosTuning:{nosKit:2,nitrousShot:2}};
  const result=getVehiclePerformance('240z__copy2',state);
  const baseline=getVehiclePerformance('240z',state);
  assert.ok(result?.car?.powerKW>0);
  assert.ok(result?.car?.torqueNm>0);
  assert.equal(result.car.powerKW,baseline.car.powerKW);
  assert.equal(result.car.torqueNm,baseline.car.torqueNm);
  assert.ok(result.car.powerKW>getVehiclePerformance('240z',{}).car.powerKW);
});
test('forfeit terminates saved paid event and restores all purchased tuning',()=>{
  const state=event();
  const base={tuning:{engine:2,turbo:2,ecu:3},exhaustNosTuning:{nosKit:2,nitrousShot:3}};
  const altered=toggleBriefingNos(removeDriverPowerPart(base,'turbo'));
  const carStates={[state.playerCarId]:altered};
  const circuit=normaliseProCircuitState({eventTick:14,crewAdviceCooldownUntil:17});
  const out=forfeitOpenDriverTransaction(circuit,state,carStates);
  assert.ok(!out.error,out.error);
  assert.equal(out.changes.competitionState,null);
  assert.equal(out.changes.proCircuit.eventTick,15);
  assert.equal(out.changes.proCircuit.crewAdviceCooldownUntil,17,
    'forfeit counts as one of the three inclusive professional events');
  assert.equal(out.changes.proCircuit.lastTournament.forfeited,true);
  assert.equal(out.changes.proCircuit.lastTournament.cashPrize,0);
  assert.equal(out.changes.carStates[state.playerCarId].tuning.turbo,2);
  assert.equal(out.changes.carStates[state.playerCarId].exhaustNosTuning.nosKit,2);
  assert.equal(out.changes.carStates[state.playerCarId].proBriefingNosStash,undefined);
  assert.equal(out.changes.carStates[state.playerCarId].proBriefingPowerStash,undefined);
  assert.equal(carStates[state.playerCarId].tuning.turbo,0,
    'no premature mutation of live save');
  assert.match(forfeitOpenDriverTransaction(circuit,{...state,openCircuit:false},carStates).error,/NO ACTIVE/);
  assert.match(forfeitOpenDriverTransaction({...circuit,completedEventIds:[state.proSeasonId]},state,carStates).error,/SETTLED/);
});
test('layout matches wide rego room and displays single-event briefing, advice and forfeit',()=>{
  const ui=source('../src/ui/ProDriverBriefing.js');
  const scene=source('../src/scenes/CentralTokyoScene.js');
  const core=source('../src/vehicles/VehiclePerformance.js');
  assert.match(ui,/dragcomplex\/regoroom_/);
  assert.doesNotMatch(ui,/regozoomed_/);
  assert.match(ui,/getBaseCarId\(state\.playerCarId\)/);
  assert.match(ui,/modelFor\(id\)/);
  assert.match(ui,/powerKW\|\|playerCar\.powerKW/);
  assert.match(ui,/1\/4 MI \/\/ STANDING/);
  assert.match(ui,/HIROSHI \/\/ RACE BRIEFING/);
  assert.match(ui,/bubble\.fillPoints/);
  assert.match(ui,/FORFEIT EVENT/);
  assert.match(ui,/options\.onForfeit/);
  assert.match(ui,/options\.proAccess/);
  assert.match(scene,/forfeitOpenDriverTransaction/);
  assert.match(scene,/getVehiclePerformance\(getBaseCarId\(carId\),carState\)/);
  assert.match(core,/cars\[carId\] \|\| cars\[getBaseCarId\(carId\)\]/);
});
