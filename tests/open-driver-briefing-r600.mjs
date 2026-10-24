import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getBaseCarId} from '../src/data/carOwnership.js';
import {getVehiclePerformance} from '../src/vehicles/VehiclePerformance.js';
import {driverBriefingEligibility,driverAdviceStatus} from '../src/data/proDriverBriefing.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const ui=read('../src/ui/ProDriverBriefing.js');
const scene=read('../src/scenes/CentralTokyoScene.js');

test('R600 paddock uses real Hiroshi and the selected playable sprite',()=>{
  assert.match(ui,/assets\/Characters\/Central\/hiroshi_sato_normal\.png/);
  assert.match(ui,/getCharacterVisualAsset\(playerId,'idle',\{proCircuit:true\}\)/);
  assert.match(ui,/s\.registry\.get\('playerCharacterId'\)/);
  assert.match(ui,/key:'proDriverHiroshi',x:1402/);
  assert.match(ui,/key:playerAsset\?\.key,x:410/);
  assert.match(ui,/key:'proDriverSayaka',x:1138/);
  assert.match(ui,/key:'proDriverDaichi',x:193/);
  assert.match(ui,/regoroom_/);
  assert.doesNotMatch(ui,/display\([^\n]*'YOUR CAR'/);
  assert.doesNotMatch(ui,/poly\(46,436,389,357/);
});

test('R600 real owned car is in the room, with no invented painted preview or box',()=>{
  assert.match(ui,/safeCarPreview\(state\.playerCarId,796,492,670,207,carState,true\)/);
  assert.match(ui,/getCarPaintColor\(previewState\)/);
  assert.match(ui,/createCarDisplay\(car,x,y,w,depth/);
  assert.match(ui,/getBaseCarId\(state\.playerCarId\)/);
  const perf=getVehiclePerformance(getBaseCarId('240z__copy2'),{tuning:{ecu:3}});
  assert.ok(perf?.car?.powerKW>0);
});

test('R600 opponent panel is wider, shorter and supports real portraits plus safe NPC placeholder',()=>{
  assert.match(ui,/poly\(52,643,654,164/);
  assert.match(ui,/createCharacterProfile\(s,\{/);
  assert.match(ui,/rivalContext:true/);
  assert.match(ui,/proDriverHelmet/);
  assert.match(ui,/safeCarPreview\(round\.carId,545,743,211/);
  assert.match(ui,/opponentTorque/);
  assert.match(ui,/display\(89,652,'NEXT OPPONENT',24/);
});

test('R600 steward toggles race info, Sayaka only reveals on demand',()=>{
  assert.match(ui,/key:'proDriverHiroshi'[^\n]*onTap:null/);
  assert.match(ui,/workshopHotspot\(1390,576,220,44,'RACE BRIEFING'/);
  assert.match(ui,/function toggleDialogue\(which\)/);
  assert.match(ui,/if\(activeDialogue===which\)\{clearDialogue\(\);return;\}/);
  assert.match(ui,/renderStewardBriefing\(s,dialogueAdd,details/);
  assert.match(ui,/\['POWER RULE'/);
  assert.match(ui,/\['NOS RULE'/);
  assert.match(ui,/\['STATUS'/);
  assert.match(ui,/function handleSayaka\(\)/);
  assert.match(ui,/state\.briefingAdviceText\)\{toggleDialogue\('sayaka'\);return;\}/);
  assert.match(ui,/if\(options\.initialDialogue==='sayaka'&&state\.briefingAdviceText\)/);
  assert.match(scene,/this\.showOpenCircuitDriverBriefing\('sayaka'\)/);
  assert.match(ui,/clearDialogue\(\);\s+nodes\.forEach/);
});
test('R600 racing safety, cooldown, tuning and forfeits are retained',()=>{
  assert.match(ui,/CAR SETUP/);
  assert.match(ui,/FORFEIT EVENT/);
  assert.match(ui,/NEXT HEAT/);
  assert.match(ui,/options\.onForfeit/);
  assert.match(ui,/options\.onRace/);
  assert.match(ui,/getStage3CalibrationEligibility/);
  assert.match(scene,/forfeitOpenDriverTransaction/);
  const state={active:true,proEvent:true,openCircuit:true,playerCarId:'240z__copy2',
    roundIndex:0,rounds:[{carId:'galant'}],briefingRules:{maxPowerKW:260,noNos:true}};
  assert.equal(driverBriefingEligibility(state,{},119,['240z__copy2']).eligible,true);
  assert.equal(driverAdviceStatus({eventTick:2,crewAdviceCooldownUntil:4},state).available,false);
});
