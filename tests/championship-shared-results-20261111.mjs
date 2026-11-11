import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const race=readFileSync(new URL('../src/scenes/FourLaneTestScene.js',import.meta.url),'utf8');
const hub=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
test('saved Championship races use the shared illustrated result and preserve settlement',()=>{
  assert.match(race,/saveProTransaction\(this\.registry,[\s\S]*?this\.showChampionshipRaceResult/);
  assert.match(race,/autoShowProVictory:\s*\{/);
  assert.match(race,/won=own\?\.status==='FINISHED'&&own\.placing===1/);
  assert.match(race,/else this\.showChampionshipRaceResult\(standings,outcome\)/);
});
test('shared results return to Championship hub or current event',()=>{
  assert.match(hub,/result\.championshipDestination/);
  assert.match(hub,/showTokyoChampionship\(this,result\.championshipDestination\)/);
});
