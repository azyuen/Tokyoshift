import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  getChampionshipFourWideHeat,championshipStandings,createDevTokyoChampionship,
  selectChampionshipFourWideCar,getChampionshipEventCar,lockChampionshipEventCar,
} from '../src/data/tokyoChampionship.js';
import {createDefaultProCircuitState} from '../src/data/proCircuit.js';

const screens=readFileSync(new URL('../src/ui/TokyoChampionshipScreens.js',import.meta.url),'utf8');
const entry=screens.slice(screens.indexOf("function showFourWideBriefing("),
  screens.indexOf("function showEvent("));

test('four-wide uses a dedicated uncluttered briefing with no top chrome',()=>{
  assert.match(screens,/hideTopChrome:stage==='KNOCKOUT'\|\|stage==='CREW'\|\|stage==='FOUR_WIDE'/);
  assert.match(screens,/if\(stage==='FOUR_WIDE'\)return showFourWideBriefing/);
  assert.match(entry,/FOUR-WIDE FINALE/);
  assert.match(entry,/glow\(336,265,190,'ASK ADVICE'/);
  assert.match(entry,/glow\(548,265,190,'CAR SETUP'/);
  assert.match(entry,/openPaddock\(s,state,'DRIVER'\)/);
  assert.match(entry,/GO TO GRID/);
  assert.match(entry,/RETURN TO HUB/);
  assert.doesNotMatch(entry,/CREW PADDOCK|o\.button\(186,794/);
});

test('previewed driver car is the same championship-registered one used at grid',()=>{
  assert.match(screens,/function fourWideDisplayCarId\(s,state\)/);
  assert.match(screens,/getChampionshipEventCar\(state,'FOUR_WIDE'\)/);
  assert.match(screens,/if\(stage==='FOUR_WIDE'\)\{[\s\S]*?preloadStoryCar\(s,cars\[id\]\)/);
  assert.match(entry,/renderStoryCar\(s,car/);
  assert.match(entry,/fourWideDisplayCarId\(s,saved\)/);
  assert.match(entry,/selectChampionshipFourWideCar\(saved,id,registered/);
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

test('four-wide hero car and actor positions use the requested new layout',()=>{
  assert.match(screens,/sprite\(s,o,player\?\.key,133,740,677,322,true\)/);
  assert.match(screens,/sprite\(s,o,'champSayaka',336,740,680,306\)/);
  assert.match(screens,/sprite\(s,o,'champDaichi',548,740,665,310\)/);
  assert.match(entry,/targetWidth:1137\.5,depth:207/);
  assert.match(entry,/const bx=24,by=691,bw=212,bh=117/);
  assert.match(entry,/const px=1169,py=269,pw=357,ph=541/);
  assert.match(entry,/o\.iconButton\(px\+35,py\+81,'◀'/);
  assert.match(entry,/o\.iconButton\(px\+pw-35,py\+81,'▶'/);
  assert.doesNotMatch(entry,/o\.button\(px\+36,py\+81/);
});

test('Four-Wide allows a new registered car for a later heat without changing Knockout lock or prior races',()=>{
  const c=createDefaultProCircuitState();
  const championship=createDevTokyoChampionship(c,1700000000000).championship;
  const existing={...championship,stage:'FOUR_WIDE',
    eventCarLocks:{KNOCKOUT:'ae86',FOUR_WIDE:'ae86'},
    fourWide:{...championship.fourWide,results:[{round:0,heats:[]}]},
    championshipRegisteredCars:['ae86','ef','r34'],
  };
  const original=structuredClone(existing);
  const registered=existing.championshipRegisteredCars;
  const chosen=selectChampionshipFourWideCar(existing,'ef',registered,registered);
  assert.ok(chosen.championship);
  assert.equal(getChampionshipEventCar(chosen.championship,'FOUR_WIDE'),'ef');
  assert.equal(getChampionshipEventCar(chosen.championship,'KNOCKOUT'),'ae86');
  assert.deepEqual(chosen.championship.fourWide.results,original.fourWide.results);
  assert.deepEqual(existing,original,'selection must not mutate an existing saved heat');
  assert.strictEqual(selectChampionshipFourWideCar(chosen.championship,'ef',registered,registered).championship,
    chosen.championship,'same car choice is idempotent');
  assert.match(selectChampionshipFourWideCar(existing,'s15',registered,['s15']).error,
    /THREE CHAMPIONSHIP REGISTERED CARS/);
  assert.match(selectChampionshipFourWideCar(existing,'ef',registered,['ae86']).error,
    /THREE CHAMPIONSHIP REGISTERED CARS/);
  assert.match(lockChampionshipEventCar({...existing,stage:'KNOCKOUT'},'KNOCKOUT','ef',
    registered,registered).error,/CAR LOCKED FOR THIS CHAMPIONSHIP EVENT/);
});

test('championship Four-Wide race entry accepts paddock switching while knockout remains fixed',()=>{
  const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
  assert.match(panel,/mode==='CHAMP_FOUR'\)\{/);
  assert.match(panel,/selectChampionshipFourWideCar\(state,carId,registered,owned\)/);
  assert.match(panel,/CAR LOCKED FOR THIS CHAMPIONSHIP EVENT/);
  assert.match(entry,/selectChampionshipFourWideCar\(saved,id,registered/);
  assert.match(screens,/if\(registered\.includes\(selected\)\)return selected/);
});
