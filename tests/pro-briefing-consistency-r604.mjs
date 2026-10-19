import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const driver=read('../src/ui/ProDriverBriefing.js');
const crew=read('../src/ui/ProCrewBattleLineup.js');
const chrome=read('../src/ui/ProBriefingChrome.js');
const panel=read('../src/ui/ProSeasonPanel.js');

test('R604 matching workshop hotspot and top-right Hiroshi briefing renderer used by both rooms',()=>{
 assert.match(driver,/addProGlowingHotspot\(s,add/);
 assert.match(crew,/addProGlowingHotspot\(s,add/);
 assert.match(driver,/renderStewardBriefing\(s,dialogueAdd,details,\{anchorX:1402\}\)/);
 assert.match(crew,/renderStewardBriefing\(s,dialogueAdd,crewRows,\{anchorX:1366\}\)/);
 assert.match(chrome,/x:850,y:24,w:674,h:222,triangleSide:36/);
 assert.match(chrome,/duration:1300,yoyo:true,repeat:-1/);
 assert.match(driver,/workshopHotspot\(190,576,229,44,'DAICHI \/\/ TUNE'/);
 assert.match(driver,/workshopHotspot\(1111,576,225,44,adviceLabel/);
 assert.match(driver,/workshopHotspot\(1390,576,220,44,'RACE BRIEFING'/);
 assert.match(crew,/crewGlow\(1055,502,235/);
 assert.match(crew,/crewGlow\(1366,502,220,'RACE BRIEFING'/);
 assert.match(crew,/function renderLineup\(\)/);
 assert.doesNotMatch(crew,/meetHeader\(54,194,632,35/);
 assert.doesNotMatch(crew,/pixelText\(74,163/);
});

test('R604 rival and player car positioning and shadows are subtly refined',()=>{
 assert.match(driver,/safeCarPreview\(state\.playerCarId,660,474,744,207,carState,true\)/);
 assert.match(driver,/part\?\.setAlpha\?\.\(\.16\)/);
 assert.match(driver,/p\.key==='proDriverSayaka'\?16:6/);
 assert.match(driver,/const frameX=74,frameY=683/);
 assert.match(driver,/fit\(text\(231,684,rivalName/);
 assert.match(driver,/safeCarPreview\(round\.carId,545,743,211,225/);
 assert.match(driver,/const x=558,y=405,w=470,h=146/);
});

test('R604 compact forfeit is shared by both competition formats',()=>{
 assert.match(driver,/showCompactProForfeit\(s,\{/);
 assert.match(panel,/showCompactProForfeit\(s,\{/);
 assert.match(chrome,/620,258,0x0b1b2c/);
 assert.match(chrome,/CONTINUE EVENT/);
 assert.match(chrome,/CONFIRM FORFEIT/);
 assert.match(driver,/\{grey:true\}/);
 assert.match(panel,/forfeitCrewSeries\(s\.registry,event\.id\)/);
 assert.match(driver,/options\.onForfeit\?\.\(\)/);
});

test('R604 Daichi setup uses steward-style cyan bubble with intact interactive controls',()=>{
 assert.match(driver,/function mechanicDialogue\(title,description=''/);
 assert.match(driver,/panel\.fillStyle\(0x081a2b,\.97\)/);
 assert.match(driver,/panel\.lineStyle\(3,CYAN,1\)/);
 assert.match(driver,/mechanicDialogue\('DAICHI \/\/ RACE SETUP'/);
 assert.match(driver,/mechanicDialogue\('DAICHI \/\/ REMOVE PARTS'/);
 assert.match(driver,/toggleBriefingNos\(carState\)/);
 assert.match(driver,/removeDriverPowerPart\(carState,part\.id\)/);
 assert.match(driver,/normaliseStage3Calibration\(carState\)/);
 assert.match(driver,/options\.onCarState\?\.\(next\)/);
});

test('R604 crew Sayaka advice and Hiroshi briefing are independent toggles',()=>{
 assert.match(crew,/if\(activeDialogue==='hiroshi'\)\{clearDialogue\(\);return;\}/);
 assert.match(crew,/if\(activeDialogue==='sayaka'\)\{clearDialogue\(\);return;\}/);
 assert.match(crew,/const crewRows=\[/);
 assert.match(crew,/\['CAR RULE',crewRule\]/);
 assert.match(crew,/\['FORMAT',formatName\(f\.format\)\]/);
 assert.match(crew,/adviceUsed\?toggleSayaka:askAdvice/);
 assert.match(crew,/opts\.onAdvice\?\.\(\[\.\.\.selected\]\)/);
 assert.match(crew,/const maxHeight=h-43/);
});
