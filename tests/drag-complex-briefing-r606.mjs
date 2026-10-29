import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 BRIEFING_POWER_PARTS,removeDriverPowerPart,restoreDriverBriefingParts,
} from '../src/data/proDriverBriefing.js';
import {STAGE3_CALIBRATION_OPTIONS,getStage3CalibrationEligibility} from '../src/data/stage3Calibration.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const ui=read('../src/ui/ProDriverBriefing.js');
const crew=read('../src/ui/ProCrewBattleLineup.js');
const complex=read('../src/scenes/CentralTokyoScene.js');
const modal=read('../src/ui/ProBriefingChrome.js');
const dyno=read('../src/scenes/DynoScene.js');

test('R606 no trophy panel matches other events and omits duplicate extra cycle/scrutineering',()=>{
 assert.match(complex,/CHECK BACK AFTER THE NEXT FULL DAY \/ NIGHT/);
 assert.match(complex,/fontFamily:'"Rajdhani", monospace',fontSize:'11px',fontStyle:'700'/);
 assert.doesNotMatch(complex,/NO TROPHY INVITATION THIS CYCLE\.\\n\\nCHECK BACK/);
 assert.match(complex,/event\.trophySlotClosed\?'':'ENTRY '/);
 assert.doesNotMatch(complex,/SCRUTINEERING PASSED/);
});

test('R606 both event preparations use the same loading title',()=>{
 assert.match(ui,/PREPARING RACE BRIEFING/);
 assert.match(crew,/PREPARING RACE BRIEFING/);
 assert.doesNotMatch(ui,/PREPARING DRIVER BRIEFING/);
 assert.doesNotMatch(crew,/PREPARING CREW PADDOCK/);
});

test('R606 Daichi panel is to his right, with exact requested header/copy',()=>{
 assert.match(ui,/workshopHotspot\(190,576,229,44,'CAR SETUP'/);
 assert.match(ui,/const x=377,y=46,w=1140,h=738/);
 assert.match(ui,/mechanicDialogue\('DAICHI \/\/ CAR SETUP'/);
 assert.match(ui,/Temporarily fit lower owned part levels/);
 assert.match(ui,/STAGE3_CALIBRATION_OPTIONS\[entry\.key\]\.forEach/);
 assert.match(ui,/modalBtn\(557,730,223,'REMOVE PARTS'/);
 assert.match(ui,/modalBtn\(839,730,223,'APPLY TUNE'/);
 assert.doesNotMatch(ui,/modalBtn\([^\n]*'REMOVE NOS'/);
});

test('R606 exact Dyno control categories, art, values, activation and selection',()=>{
 assert.match(ui,/STAGE3_CALIBRATION_OPTIONS\[entry\.key\]\.forEach/);
 assert.match(dyno,/STAGE3_CALIBRATION_OPTIONS\[row\.key\]\.forEach/);
 for(const [key,sprite,description] of [
  ['ecuBias','tuningPartEcuL3','ECU CURVE'],
  ['boostBias','tuningPartTurboL3','BOOST CURVE'],
  ['gearBias','tuningPartGearboxL3','GEAR SPREAD'],
 ]){
  assert.deepEqual(STAGE3_CALIBRATION_OPTIONS[key].map(o=>o.value),[-2,-1,0,1,2]);
  assert.match(ui,new RegExp(sprite));
  assert.match(ui,new RegExp(description));
  assert.match(dyno,new RegExp(sprite));
 }
 assert.match(ui,/values\[entry\.key\]=preset\.value/);
 assert.match(ui,/getStage3CalibrationEligibility\(carState\)/);
 assert.match(ui,/stage3Calibration:canTune\?/);
 assert.match(ui,/options\.onCarState\?\.\(next\)/);
 const gates=getStage3CalibrationEligibility({tuning:{ecu:3,turbo:3},
  drivetrainTuning:{gearbox:3}});
 assert.equal(gates.ecuBias,true);
 assert.equal(gates.boostBias,true);
});

test('R606 NOS is among larger removable parts and survives reversible removal',()=>{
 assert.ok(BRIEFING_POWER_PARTS.some(p=>p.id==='nosKit'&&p.label==='NOS EQUIPMENT'));
 assert.match(ui,/OWNED L/);
 const state={nosInstalled:true,exhaustNosTuning:{
  nosKit:2,nitrousShot:3,exhaust:2},tuning:{ecu:3,turbo:1}};
 const removed=removeDriverPowerPart(state,'nosKit');
 assert.equal(removed.nosInstalled,false);
 assert.equal(removed.exhaustNosTuning.nosKit,0);
 assert.equal(removed.proBriefingNosStash.exhaustNosTuning.nitrousShot,3);
 const restored=restoreDriverBriefingParts({ae86:removed},{
  active:true,proEvent:true,openCircuit:true,playerCarId:'ae86',
  roundIndex:0,rounds:[{carId:'r32'}],
 });
 assert.equal(restored.ae86.nosInstalled,true);
 assert.equal(restored.ae86.exhaustNosTuning.nosKit,2);
 assert.equal(restored.ae86.exhaustNosTuning.nitrousShot,3);
 assert.equal(restored.ae86.exhaustNosTuning.exhaust,2);
});

test('R606 forfeit description matches compact crew and driver popup type',()=>{
 assert.match(modal,/fontFamily:BODY,fontSize:'15px'/);
 assert.match(modal,/align:'center',wordWrap:\{width:540\}/);
 assert.match(modal,/CONFIRM FORFEIT/);
});
