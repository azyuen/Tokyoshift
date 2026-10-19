import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  removeDriverPowerParts,restoreDriverBriefingParts,BRIEFING_POWER_PARTS,
} from '../src/data/proDriverBriefing.js';
import {normaliseStage3Calibration} from '../src/data/stage3Calibration.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const driver=read('../src/ui/ProDriverBriefing.js');
const crew=read('../src/ui/ProCrewBattleLineup.js');
const chrome=read('../src/ui/ProBriefingChrome.js');

test('R607 batch removals change three parts in one state and restore every purchase',()=>{
 const original={nosInstalled:true,tuning:{turbo:3,ecu:3,intake:2},
  exhaustNosTuning:{nosKit:2,nitrousShot:3,exhaust:2},
  stage3Calibration:{ecuBias:1,boostBias:-1,gearBias:0}};
 const before=JSON.stringify(original);
 const selected=['turbo','ecu','nosKit','nosKit'];
 const removed=removeDriverPowerParts(original,selected);
 assert.equal(JSON.stringify(original),before,'original garage/car state stays unchanged');
 assert.equal(removed.tuning.turbo,0);
 assert.equal(removed.tuning.ecu,0);
 assert.equal(removed.nosInstalled,false);
 assert.equal(removed.exhaustNosTuning.nosKit,0);
 assert.equal(removed.exhaustNosTuning.nitrousShot,0);
 assert.equal(removed.proBriefingNosStash.exhaustNosTuning.nitrousShot,3);
 assert.equal(removed.proBriefingPowerStash.tuning.turbo,3);
 assert.equal(removed.proBriefingPowerStash.tuning.ecu,3);
 assert.deepEqual(normaliseStage3Calibration(removed),normaliseStage3Calibration(original));
 const restored=restoreDriverBriefingParts({ae86:removed},{
  active:true,proEvent:true,openCircuit:true,playerCarId:'ae86',
  roundIndex:0,rounds:[{carId:'r32'}]});
 assert.equal(restored.ae86.tuning.turbo,3);
 assert.equal(restored.ae86.tuning.ecu,3);
 assert.equal(restored.ae86.nosInstalled,true);
 assert.equal(restored.ae86.exhaustNosTuning.nosKit,2);
 assert.equal(restored.ae86.exhaustNosTuning.nitrousShot,3);
 assert.equal(restored.ae86.proBriefingNosStash,undefined);
 assert.equal(restored.ae86.proBriefingPowerStash,undefined);
 assert.equal(BRIEFING_POWER_PARTS.length,9);
});
test('R607 multi-selection applies only once, not per item click',()=>{
 assert.match(driver,/const selected=new Set\(\)/);
 assert.match(driver,/if\(selected\.has\(part\.id\)\)selected\.delete\(part\.id\)/);
 assert.match(driver,/selected\.add\(part\.id\)/);
 assert.match(driver,/removeDriverPowerParts\(carState,\[\.\.\.selected\]\)/);
 assert.match(driver,/APPLY REMOVALS \/\/ /);
 const section=driver.slice(driver.indexOf('function openPowerParts'),driver.indexOf('function openTune'));
 assert.equal((section.match(/options\.onCarState\?\.\(next\)/g)||[]).length,2,
  'one batch apply action and one optional restore-all action');
});
test('R607 dyno toggles have side labels, left headers and unsaved apply highlight',()=>{
 assert.match(driver,/const bx=704\+index\*87,by=entry\.y\+4/);
 assert.match(driver,/s\.add\.text\(663,entry\.y\+4,entry\.left/);
 assert.match(driver,/s\.add\.text\(1098,entry\.y\+4,entry\.right/);
 assert.match(driver,/s\.add\.text\(432,entry\.y-49/);
 assert.match(driver,/s\.add\.image\(479,entry\.y\+20,entry\.sprite\)/);
 assert.match(driver,/function highlightApplyTune\(\)/);
 assert.match(driver,/values\[key\]!==original\[key\]/);
 assert.match(driver,/changed\?0x167c79:0x142b3e/);
 assert.match(driver,/highlightApplyTune\(\);/);
});
test('R607 larger in-world car, fully masked lower portrait and taller Hiroshi',()=>{
 assert.match(driver,/safeCarPreview\(state\.playerCarId,726,474,744,207,carState,true\)/);
 assert.match(driver,/s\.add\.image\(px,frameY\+18,helmetKey\)/);
 assert.match(driver,/image\.setMask\(shape\.createGeometryMask\(\)\)/);
 assert.match(driver,/x:px,y:py\+10/);
 assert.match(chrome,/x:850,y:24,w:674,h:258,triangleSide:36/);
});
test('R607 individual and pro crew use EXACT same compact Sayaka confirmation',()=>{
 assert.match(chrome,/export function showProSayakaAdviceConfirm/);
 assert.match(chrome,/rectangle\(780,420,820,268/);
 assert.match(chrome,/fontFamily:BODY,fontSize:'23px'/);
 assert.match(driver,/showProSayakaAdviceConfirm\(s,\{/);
 assert.match(crew,/showProSayakaAdviceConfirm\(s,\{/);
 assert.doesNotMatch(crew,/rect\(780,420,850,332/);
 assert.doesNotMatch(driver,/modal\('ASK SAYAKA FOR ADVICE\?'/);
 assert.match(driver,/s\._proSayakaClose\?\.\(\)/);
 assert.match(crew,/s\._proSayakaClose\?\.\(\)/);
});
