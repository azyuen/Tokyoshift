import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
const home=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const reset=panel.slice(panel.indexOf('export function cancelDevTokyoChampionship('),panel.indexOf('export function enterDevTokyoChampionship('));
test('cancel is gated to dev mode and refuses to interrupt a race',()=>{
 assert.match(reset,/registry\?\.get\('devMode'\)/);
 assert.match(reset,/competitionState'\)\?\.active/);
});
test('reset clears only the active Championship fixture and persists transactionally',()=>{
 assert.match(reset,/saveProTransaction\(s\.registry,\{proCircuit:\{/);
 assert.match(reset,/\.\.\.current,activeChampionship:null/);
 assert.doesNotMatch(reset,/seasonPoints:|calendar:|credits:|inventory:/);
});
test('home screen has a confirmed Withdraw Tokyo action',()=>{ assert.match(home,/WITHDRAW TOKYO/); assert.match(home,/CONFIRM WITHDRAW/); assert.match(home,/cancelDevTokyoChampionship\(this\)/); });
