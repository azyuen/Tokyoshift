import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../src/ui/TokyoChampionshipScreens.js',import.meta.url),'utf8');
test('knockout uses exact Open Circuit glowing hotspot helper',()=>{
 assert.match(ui,/import \{ addProGlowingHotspot \}/);
 assert.match(ui,/addProGlowingHotspot\(s,o\.add/);
 assert.match(ui,/EVENT DETAILS/);
});
test('knockout grid uses paddock-selected car and has no driver picker',()=>{
 const part=ui.slice(ui.indexOf('function enterGrid(){'),ui.indexOf('function showFullKnockout('));
 assert.match(part,/registry\.get\('selectedCarId'\)/);
 assert.doesNotMatch(part,/showCarPicker\(s,stage,actions\)/);
});
test('opponent card uses Open Circuit 654 by 164 geometry and real data',()=>{
 assert.match(ui,/const x=52,y=643,w=654,h=164/);
 assert.match(ui,/createCharacterProfile/);
 assert.match(ui,/createCarDisplay/);
});
