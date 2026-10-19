import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const driver=read('../src/ui/ProDriverBriefing.js');
const crew=read('../src/ui/ProCrewBattleLineup.js');
const chrome=read('../src/ui/ProBriefingChrome.js');
const carRenderer=read('../src/scenes/CentralTokyoScene.js');

test('R608 player car moves right and retains a visible shadow darker than character shadows',()=>{
  assert.match(driver,/safeCarPreview\(state\.playerCarId,796,474,670,207,carState,true\)/);
  assert.match(driver,/i===2&&keepShadow\)part\?\.setAlpha\?\.\(\.34\)/);
  assert.match(driver,/\.setDepth\(209\)/);
  assert.match(carRenderer,/const shadow = this\.add\.ellipse\(/);
  assert.match(carRenderer,/return \[\s*rearBacking,\s*frontBacking,\s*shadow,/);
  assert.match(driver,/getCarPaintColor\(previewState\)/);
});
test('R608 identical Exo 2 italic grey heat subtitles beneath both event titles',()=>{
  assert.match(driver,/addProHeatSubtitle\(s,add,\{heat:stageNo,total:stageTotal\}\)/);
  assert.match(crew,/addProHeatSubtitle\(s,add,\{heat:heatIndex\+1,total:3\}\)/);
  assert.match(driver,/fontFamily:DISPLAY/);
  assert.match(crew,/fontFamily:'"Exo 2", sans-serif'/);
  assert.match(crew,/const heatIndex=Math\.min\(2,Math\.max\(0,Number\(f\.prepared\?\.revealed\|\|0\)\)\)/);
  assert.match(driver,/display\(89,652,'NEXT OPPONENT',24,'#35d6ff'\)/);
  assert.doesNotMatch(driver,/NEXT OPPONENT '\+stageNo/);
});
test('R608 opponent portrait shifts left but keeps same black-bordered mask',()=>{
  assert.match(driver,/const px=frameX\+frameW\/2-9,py=frameY\+frameH\/2/);
  assert.match(driver,/s\.add\.image\(px,frameY\+18,helmetKey\)/);
  assert.match(driver,/x:px,y:py\+10/);
  assert.match(driver,/image\.setMask\(shape\.createGeometryMask\(\)\)/);
});
test('R608 Crew Hiroshi shows no fixture or repeated entry and uses a shorter six-row popup',()=>{
  const rows=crew.slice(crew.indexOf('const crewRows=['),crew.indexOf('const toggleSteward='));
  assert.ok(rows.startsWith('const crewRows=['));
  assert.doesNotMatch(rows,/\['FIXTURE'/);
  assert.doesNotMatch(rows,/\['ENTRY '/);
  for(const label of ['EVENT','FORMAT','NEXT DRIVER','NEXT CAR','CAR RULE','POWER / NOS']){
    assert.ok(rows.includes("['"+label+"'"),'expected detail: '+label);
  }
  assert.match(crew,/renderStewardBriefing\(s,dialogueAdd,crewRows,\{anchorX:1366,height:218\}\)/);
  assert.match(chrome,/const h=height\?\?STEWARD_BUBBLE\.h,edge=x\+w/);
  assert.match(chrome,/x:850,y:24,w:674,h:258,triangleSide:36/);
  assert.match(driver,/renderStewardBriefing\(s,dialogueAdd,details,\{anchorX:1402\}\)/);
});
