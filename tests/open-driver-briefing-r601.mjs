import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getProDriverHelmetIndex} from '../src/data/proDriverBriefing.js';

const ui=readFileSync(new URL('../src/ui/ProDriverBriefing.js',import.meta.url),'utf8');

test('R601 car/player staging, staff swap and mirror flips match the approved layout',()=>{
  assert.match(ui,/safeCarPreview\(state\.playerCarId,590,531,620,207,carState,true\)/);
  assert.match(ui,/key:'proDriverDaichi',x:169,feet:727,height:560,maxWidth:280,flip:true/);
  assert.match(ui,/key:playerAsset\?\.key,x:888,feet:691,height:519,maxWidth:256,flip:false/);
  assert.match(ui,/key:'proDriverSayaka',x:1110,feet:763,height:527/);
  assert.match(ui,/key:'proDriverHiroshi',x:1402,feet:724,height:522,maxWidth:270,flip:true/);
  assert.match(ui,/setFlipX\(Boolean\(p\.flip\)\)/);
  assert.match(ui,/Point the official race briefing toward Hiroshi on the RIGHT/);
});

test('R601 uses workshop heartbeat glow and two equal-sized actions without BACK',()=>{
  assert.match(ui,/const workshopHotspot=\(/);
  assert.match(ui,/alpha:\{from:\.07,to:1\}/);
  assert.match(ui,/duration:1300,yoyo:true,repeat:-1/);
  assert.match(ui,/labelPad|const pad=add/);
  assert.match(ui,/workshopHotspot\(166,623,229,44,'DAICHI \/\/ TUNE'/);
  assert.match(ui,/workshopHotspot\(1111,637,225,44,adviceLabel/);
  assert.match(ui,/workshopHotspot\(1390,616,220,44,'RACE BRIEFING'/);
  assert.match(ui,/btn\(1070,779,246,54,'FORFEIT EVENT'/);
  assert.match(ui,/btn\(1368,779,246,54,'PROCEED TO GRID/);
  assert.doesNotMatch(ui,/btn\([^\n]*'BACK'/);
  assert.match(ui,/s\.tweens\?\.killTweensOf/);
});

test('R601 opponent card is compact and positions real helmeted portrait above metadata',()=>{
  assert.match(ui,/poly\(52,643,730,164/);
  assert.match(ui,/NEXT OPPONENT '\+stageNo\+'\/'\+stageTotal/);
  assert.match(ui,/const px=146,py=742,pw=112,ph=102/);
  assert.match(ui,/driver_0'\+helmetIndex\+'\.png/);
  assert.match(ui,/profile\.setMask\(shape\.createGeometryMask\(\)\)/);
  assert.match(ui,/safeCarPreview\(round\.carId,629,736,226,225/);
  assert.doesNotMatch(ui,/OPPONENT '\+stageNo\+' OF '/);
  assert.match(ui,/const isMainRival=Boolean\(round\.mainRivalTier\|\|rival\.mainRival\)/);
});

test('R601 four generic NPC driver portraits assign deterministically per entrant and round',()=>{
  const state={proSeasonId:'open:streetShootout:s2:e7',roundIndex:0};
  const rival={characterId:'takeshiMori',opponentName:'Takeshi Mori'};
  const index=getProDriverHelmetIndex(state,rival);
  assert.ok(index>=1&&index<=4);
  assert.equal(getProDriverHelmetIndex({...state}, {...rival}),index);
  assert.equal(getProDriverHelmetIndex(state,rival),index);
  const variants=new Set();
  for(let i=0;i<60;i++) variants.add(getProDriverHelmetIndex(
    {...state,roundIndex:i},{characterId:'proDriver'+i}));
  assert.deepEqual([...variants].sort(),[1,2,3,4]);
});
