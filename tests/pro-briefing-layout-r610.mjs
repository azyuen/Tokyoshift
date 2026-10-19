import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const driver=read('../src/ui/ProDriverBriefing.js');
const crew=read('../src/ui/ProCrewBattleLineup.js');
const chrome=read('../src/ui/ProBriefingChrome.js');

test('R610 crew roster cars sit vertically centred in the 76px selection rows',()=>{
  assert.match(crew,/const hit=rect\(1235,y\+30,558,76/);
  assert.match(crew,/s\.createCarDisplay\(car,1414,y\+30,145,253/);
  assert.match(crew,/if\(index===2\)\{part\?\.destroy\?\.\(\);return;\}/);
  assert.doesNotMatch(crew,/const crop=mask\(1268,y-4,204,75\)/);
});

test('R610 player left, Sayaka mirrored, and car lowered without changing size or shadow',()=>{
  assert.match(driver,/key:playerAsset\?\.key,x:410,feet:691,height:519,maxWidth:256,flip:true/);
  assert.match(driver,/key:'proDriverSayaka',x:1138,feet:763,height:527,maxWidth:276,flip:true/);
  assert.match(driver,/safeCarPreview\(state\.playerCarId,796,492,670,207,carState,true\)/);
  assert.match(driver,/i===2&&keepShadow\)part\?\.setAlpha\?\.\(\.34\)/);
  assert.match(driver,/\.setFlipX\(Boolean\(p\.flip\)\)/);
});

test('R610 individual HEAT subtitle is 30 percent smaller and 10px higher, crew remains unchanged',()=>{
  assert.match(chrome,/addProHeatSubtitle\(s,add,\{heat=1,total=3,x=58,y=146,size=23\}/);
  assert.match(chrome,/fontSize:size\+'px'/);
  assert.match(driver,/addProHeatSubtitle\(s,add,\{heat:stageNo,total:stageTotal,y:136,size:16\}\)/);
  assert.match(crew,/addProHeatSubtitle\(s,add,\{heat:heatIndex\+1,total:3\}\)/);
  assert.equal(Math.round((1-16/23)*100),30);
});
