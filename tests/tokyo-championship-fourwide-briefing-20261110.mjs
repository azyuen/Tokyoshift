import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  getChampionshipFourWideHeat,championshipStandings,createDevTokyoChampionship,
} from '../src/data/tokyoChampionship.js';
import {createDefaultProCircuitState} from '../src/data/proCircuit.js';

const screens=readFileSync(new URL('../src/ui/TokyoChampionshipScreens.js',import.meta.url),'utf8');
const entry=screens.slice(screens.indexOf("function showFourWideBriefing("),
  screens.indexOf("function showEvent("));

test('four-wide uses a dedicated uncluttered briefing with no top chrome',()=>{
  assert.match(screens,/hideTopChrome:stage==='KNOCKOUT'\|\|stage==='CREW'\|\|stage==='FOUR_WIDE'/);
  assert.match(screens,/if\(stage==='FOUR_WIDE'\)return showFourWideBriefing/);
  assert.match(entry,/FOUR-WIDE FINALE/);
  assert.match(entry,/glow\(135,485,206,'ASK ADVICE'/);
  assert.match(entry,/glow\(542,485,206,'CAR SETUP'/);
  assert.match(entry,/openPaddock\(s,state,'DRIVER'\)/);
  assert.match(entry,/GO TO GRID/);
  assert.match(entry,/RETURN TO HUB/);
  assert.doesNotMatch(entry,/CREW PADDOCK|o\\.button\\(186,794/);
});

test('previewed driver car is the same championship-registered one used at grid',()=>{
  assert.match(screens,/function fourWideDisplayCarId\(s,state\)/);
  assert.match(screens,/getChampionshipEventCar\(state,'FOUR_WIDE'\)/);
  assert.match(screens,/if\(stage==='FOUR_WIDE'\)\{[\s\S]*?preloadStoryCar\(s,cars\[id\]\)/);
  assert.match(entry,/renderStoryCar\(s,car/);
  assert.match(entry,/fourWideDisplayCarId\(s,saved\)/);
  assert.match(entry,/lockChampionshipEventCar\(saved,'FOUR_WIDE',id,registered/);
  assert.match(entry,/actions\.startRace\('CHAMP_FOUR',id\)/);
});

test('opponent list uses the real four-car grid and supports field/history toggle',()=>{
  assert.match(entry,/const modes=\['HEAT','FIELD',\.\.\.\(history\.length\?\['RESULTS'\]:\[\]\)\]/);
  assert.match(entry,/getChampionshipFourWideHeat\(state\)/);
  assert.match(entry,/live\?\.entrants/);
  assert.match(entry,/state\.fourWide\?\.results/);
  assert.match(entry,/championshipStandings\(state\)/);
  assert.match(entry,/for\(let i=0;i<4;i\+\+\)/);
  assert.match(entry,/DRIVER STANDINGS/);
  assert.match(entry,/switchMode\(-1\)/);
  assert.match(entry,/switchMode\(1\)/);
});

test('saved championship four-wide heat is exactly four entrants',()=>{
  const c=createDefaultProCircuitState();
  const state=createDevTokyoChampionship(c,1700000000000).championship;
  const ready={...state,stage:'FOUR_WIDE'};
  const heat=getChampionshipFourWideHeat(ready);
  assert.equal(heat.entrants.length,4);
  assert.ok(heat.entrants.includes('player:driver'));
  assert.equal(new Set(heat.entrants).size,4);
  assert.equal(championshipStandings(ready).length,16);
});
