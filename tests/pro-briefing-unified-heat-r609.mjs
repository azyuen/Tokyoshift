import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const driver=read('../src/ui/ProDriverBriefing.js');
const crew=read('../src/ui/ProCrewBattleLineup.js');
const chrome=read('../src/ui/ProBriefingChrome.js');

test('R609 both professional formats use one large upper-case HEAT subtitle',()=>{
  assert.match(driver,/addProHeatSubtitle\(s,add,\{heat:stageNo,total:stageTotal,y:136,size:16\}\)/);
  assert.match(crew,/addProHeatSubtitle\(s,add,\{heat:heatIndex\+1,total:3\}\)/);
  assert.match(chrome,/export function addProHeatSubtitle/);
  assert.match(chrome,/s\.add\.text\(x,y,'HEAT '\+heat\+' OF '\+total/);
  assert.match(chrome,/x=58,y=146/);
  assert.match(chrome,/fontSize:size\+'px'/);
  assert.match(chrome,/color:'#c5cbd3',stroke:'#090d16'/);
  assert.match(chrome,/strokeThickness:3/);
  assert.doesNotMatch(driver,/display\(58,136,'heat '/);
  assert.doesNotMatch(crew,/meetText\(60,137,'heat '/);
});

test('R609 main driver is to the right of Daichi, mirrored; car 10% smaller and Sayaka nudged right',()=>{
  assert.match(driver,/key:'proDriverDaichi',x:193,feet:727/);
  assert.match(driver,/key:playerAsset\?\.key,x:410,feet:691,height:519,maxWidth:256,flip:true/);
  assert.match(driver,/safeCarPreview\(state\.playerCarId,796,492,670,207,carState,true\)/);
  assert.match(driver,/key:'proDriverSayaka',x:1138,feet:763,height:527/);
  assert.match(driver,/\.setFlipX\(Boolean\(p\.flip\)\)/);
  assert.match(driver,/i===2&&keepShadow\)part\?\.setAlpha\?\.\(\.34\)/);
});

test('R609 Sayaka in both screens uses identical Daichi-size confirmation typography',()=>{
  assert.match(driver,/showProSayakaAdviceConfirm\(s,\{/);
  assert.match(crew,/showProSayakaAdviceConfirm\(s,\{/);
  assert.match(driver,/fontFamily:BODY,fontSize:'18px',fontStyle:'600'/);
  assert.match(chrome,/fontFamily:PIXEL,fontSize:'17px'/);
  assert.match(chrome,/fontFamily:BODY,fontSize:'18px',fontStyle:'600'/);
  assert.match(chrome,/wordWrap:\{width:740\},lineSpacing:4/);
  assert.doesNotMatch(chrome,/fontFamily:BODY,fontSize:'23px'/);
});

test('R609 only HEAT appears as public stage terminology and no duplicate Hiroshi round or fixture',()=>{
  assert.match(chrome,/'HEAT '\+heat\+' OF '\+total/);
  const driverRows=driver.slice(driver.indexOf('const details=['),driver.indexOf('renderStewardBriefing(s,dialogueAdd,details'));
  const crewRows=crew.slice(crew.indexOf('const crewRows=['),crew.indexOf('const toggleSteward='));
  assert.ok(driverRows.includes("['EVENT',title]"));
  assert.ok(crewRows.includes("['EVENT',eventTitle]"));
  assert.doesNotMatch(driverRows,/\['ROUND'/);
  assert.doesNotMatch(crewRows,/\['FIXTURE'/);
  assert.doesNotMatch(crewRows,/\['ENTRY '/);
  assert.match(driver,/NEXT HEAT/);
  assert.match(crew,/NEXT HEAT/);
});
