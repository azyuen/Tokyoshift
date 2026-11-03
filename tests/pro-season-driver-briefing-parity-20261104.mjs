import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const open=read('src/ui/ProDriverBriefing.js');
const season=read('src/ui/ProSeasonDriverBriefing.js');

test('Pro Season uses the Open Circuit header type, band and coordinates',()=>{
  for(const source of [open,season]){
    assert.ok(source.includes('poly(40,34,268,42,0x03070c,0x03070c,218)'));
    assert.ok(source.includes('fit(display(55,83,title,41),790)'));
  }
  assert.ok(season.includes("display(63,43,'PRO SEASON',21,'#ff8197')"));
  assert.ok(open.includes("display(63,43,'OPEN CIRCUIT',21,'#ff8197')"));
  assert.match(season,/fontFamily:DISPLAY,fontSize:'16px',fontStyle:'italic 900'/);
  assert.match(season,/stroke:'#090d16',strokeThickness:3/);
  assert.doesNotMatch(season,/label\(55,83,title,41/);
});

test('Opponent panels use the same professional skew and compact typography',()=>{
  for(const source of [open,season]){
    assert.ok(source.includes('poly(52,643,654,164,0x071728,CYAN,219)'));
    assert.ok(source.includes("display(89,652,'NEXT OPPONENT',24,'#35d6ff')"));
    assert.ok(source.includes('frameX=74,frameY=683,frameW=129,frameH=106,skew=16'));
    assert.ok(source.includes("fit(text(231,684,rivalName,18,'#ffffff'),239)"));
    assert.ok(source.includes("text(231,733,'CLASS CAP',10,'#b1cddb',true)"));
    assert.ok(source.includes("text(231,753,'NOS',10,'#b1cddb',true)"));
    assert.ok(source.includes("text(231,775,'CLASS',10,'#b1cddb',true)"));
  }
  assert.ok(season.includes('createCarDisplay(cars[shownCarId],545,743,211,225'));
  assert.ok(season.includes('if(index===2){part?.destroy?.();continue;}'));
  assert.doesNotMatch(season,/PROVISIONAL OPPONENT CAR/);
});

test('Season briefing loads a real professional helmet and clips the artwork',()=>{
  assert.match(season,/getProCircuitGenericDriverAsset\(getProDriverHelmetIndex\(/);
  assert.doesNotMatch(season,/getProCircuitGenericDriverAsset\(0\)/);
  assert.ok(season.includes('assets.push([helmet.key,helmet.path])'));
  assert.ok(season.includes('clipPortrait(profile)'));
  assert.ok(season.includes('createCharacterProfile(s,{'));
  assert.ok(season.includes('s.textures.get(helmetKey).setFilter?.(Phaser.Textures.FilterMode.NEAREST)'));
  assert.ok(season.includes("getProSeasonDriverCarError(now,currentSelection)"));
  assert.ok(season.includes('onGrid?.(s.getSelectedBuild?.())'));
});

test('Pro Season keeps paddock, steward, advice and race-action coordinates',()=>{
  assert.ok(season.includes("label:'CAR SETUP',onClick:openProPaddock"));
  assert.ok(season.includes("label:'RACE BRIEFING',onClick:()=>toggleDialogue('hiroshi',check)"));
  assert.ok(season.includes("button(1070,779,246,54,'BACK TO SEASON',close,true,{grey:true})"));
  assert.ok(season.includes('button(1368,779,246,54,canStart?'));
});
