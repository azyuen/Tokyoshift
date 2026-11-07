import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
const settings=readFileSync(new URL('../src/ui/SettingsPanel.js',import.meta.url),'utf8');
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
test('dev settings includes explicit two-press reset and restart shortcut',()=>{
 assert.match(settings,/D\) STOP TOKYO/);
 assert.match(settings,/D\) TEST TOKYO/);
 assert.match(settings,/PRESS D\) STOP TOKYO AGAIN TO CONFIRM RESET/);
 assert.match(settings,/cancelDevTokyoChampionship\(scene\)/);
});
