import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../src/ui/TokyoChampionshipScreens.js',import.meta.url),'utf8');
const scene=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
const hub=ui.slice(ui.indexOf('function showHub('),ui.indexOf('function eventInfo('));
const podium=ui.slice(ui.indexOf("if(view==='HUB')"),ui.indexOf("}else if(view==='CREW')"));

test('four ranked characters share a single height width and feet line',()=>{
  assert.match(podium,/xs=lineup\.length===4\?\[850,1055,1260,1465\]/);
  assert.match(podium,/sprite\(s,o,row\.asset\?\.key,xs\[i\],1040,978,480\)/);
  assert.ok(850-480/2>=610);
  assert.doesNotMatch(podium,/stature=isPlayer\?/);
});

test('a narrow blue map button sits under the red event entry',()=>{
  assert.match(hub,/o\.button\(left\+width\/2\+3\*\(width\+gap\),810,width,38,'GO TO MAP'/);
  assert.match(hub,/o\.close\(\);\s*actions\?\.goToMap\?\.\(\)/);
  assert.match(panel,/goToMap:\(\)=>s\.openMap\?\.\(\)/);
});

test('map arrival defaults to Championship hub only with an active Championship',()=>{
  assert.match(scene,/this\._championshipMapArrival=locationId==='tokyoDragComplex'&&/);
  assert.match(scene,/Boolean\(this\.registry\.get\('proCircuit'\)\?\.activeChampionship\)/);
  assert.match(scene,/showTokyoChampionship\(this,'HUB'\)/);
  assert.match(scene,/this\._championshipMapArrival=false/);
});
