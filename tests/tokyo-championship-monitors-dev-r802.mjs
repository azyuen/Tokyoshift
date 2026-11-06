import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState} from '../src/data/proCircuit.js';
import {canEnterTokyoChampionship,createProvisionalChampionship,
  createDevTokyoChampionship} from '../src/data/tokyoChampionship.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('src/ui/TokyoChampionshipScreens.js');
const panel=read('src/ui/ProSeasonPanel.js');
const settings=read('src/ui/SettingsPanel.js');
const venue=read('src/scenes/CentralTokyoScene.js');

test('regular player still needs eight rounds and qualification',()=>{
  const state=createDefaultProCircuitState();
  assert.equal(canEnterTokyoChampionship(state),false);
  assert.match(createProvisionalChampionship(state).error,/COMPLETE EIGHT ROUNDS/);
});
test('dev test creates an authentic full bracket without changing the input season',()=>{
  const state=createDefaultProCircuitState(),before=structuredClone(state);
  const result=createDevTokyoChampionship(state,1700000000000);
  assert.ok(result.championship);
  assert.equal(result.resumed,undefined);
  assert.equal(result.championship.devBypass,true);
  assert.equal(result.championship.id,'tokyo:s1:dev:1700000000000');
  assert.equal(result.championship.stage,'KNOCKOUT');
  assert.equal(result.championship.entrants.length,16);
  assert.equal(result.championship.knockout.results.length,0);
  assert.equal(result.championship.crew.results.length,0);
  assert.equal(result.championship.fourWide.results.length,0);
  assert.deepEqual(state,before,'normal season and ranking points untouched');
});
test('dev shortcut resumes an active saved bracket rather than resetting it',()=>{
  const c=createDefaultProCircuitState();
  const active=createDevTokyoChampionship(c,1234).championship;
  const after={...c,activeChampionship:{
    ...active,stage:'CREW',crew:{results:[{index:0,carId:'car1',won:true}]},
  }};
  const result=createDevTokyoChampionship(after,6789);
  assert.equal(result.resumed,true);
  assert.deepEqual(result.championship,after.activeChampionship);
});
test('dev shortcut cannot replace a running professional event',()=>{
  const c=createDefaultProCircuitState();
  for(const key of ['activeCrewEvent','activeTournament','activeTimedEvent']){
    assert.match(createDevTokyoChampionship({...c,[key]:{id:'ongoing'}},1234).error,
      /FINISH THE CURRENT/);
  }
});
test('new screen coordinates fit the photographed wall displays',()=>{
  const match=ui.match(/TOKYO_CHAMP_MONITORS=Object.freeze\(\{([\s\S]*?)\}\);/);
  assert.ok(match,'configured screen bounds');
  const hub={x:100,y:164,w:510,h:337},ko={x:897,y:160,w:550,h:285};
  for(const b of [hub,ko]){
    assert.ok(b.x>=0&&b.y>=65&&b.x+b.w<=1560&&b.y+b.h<=600);
  }
  assert.match(ui,/HUB:Object.freeze\(\{x:100,y:164,w:510,h:337\}\)/);
  assert.match(ui,/KNOCKOUT:Object.freeze\(\{x:897,y:160,w:550,h:285\}\)/);
  assert.match(ui,/state\.knockout\?\.bracket\|\|seedKnockoutBracket/);
  assert.match(ui,/history\[round\]\?\.matches\?\.\[i\]\?\.winner/);
  assert.match(ui,/if\(stage!=='KNOCKOUT'\)o\.panel/);
  assert.match(ui,/EXPAND TOURNAMENT BRACKET/);
  assert.match(ui,/showFullKnockout\(s,actions\)/);
});
test('only developer UI exposes bypass, while standard car and crew locks remain',()=>{
  assert.match(settings,/if\(scene\.registry\.get\('devMode'\)\)/);
  assert.match(settings,/D\) TEST TOKYO/);
  assert.match(settings,/prepareDevTokyoChampionship\(scene\)/);
  assert.match(venue,/if\(this\.registry\.get\('devMode'\)\)/);
  assert.match(venue,/enterDevTokyoChampionship\(this\)/);
  assert.match(panel,/if\(!s\?\.registry\?\.get\('devMode'\)\)return false/);
  assert.match(panel,/if\(s\.registry\.get\('competitionState'\)\?\.active\)/);
  assert.match(panel,/saveProTransaction\(s\.registry,\{proCircuit/);
  assert.match(panel,/!state\.devBypass&&getProSeasonDriverCarError/);
  assert.match(ui,/state\.driverCarId\?\[state\.driverCarId\]/);
  assert.match(panel,/mode==='CHAMP_CREW'/);
  assert.match(panel,/!owned\.includes\(carId\)/);
});
