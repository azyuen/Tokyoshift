// Targeted presentation guardrails for the R801 Championship UI cleanup.
// Behavioural scoring/save tests run separately in tokyoChampionship.simulation.test.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=readFileSync(new URL('../src/ui/TokyoChampionshipScreens.js',import.meta.url),'utf8');

test('the hub has one two-wing scoreboard and one three-event ribbon',()=>{
  assert.match(file,/LIVE STANDINGS/);
  assert.match(file,/YOUR CHAMPIONSHIP/);
  assert.match(file,/THE ROAD TO THE TITLE/);
  assert.match(file,/STAGES\.forEach\(\(stage,i\)=>/);
  assert.match(file,/FULL 16-DRIVER STANDINGS/);
  assert.match(file,/CHAMPIONSHIP RULES/);
});
test('the knockout bracket uses persisted round pairings and winners',()=>{
  assert.match(file,/state\.knockout\?\.bracket\|\|seedKnockoutBracket/);
  assert.match(file,/history\[r\]\?\.matches\?\.\[i\]\?\.winner/);
  assert.match(file,/TBD/);
  assert.match(file,/roundNames=\['TOP 16','QUARTERS','SEMIS','FINAL'\]/);
  assert.match(file,/pair\.includes\('player:driver'\)/);
});
test('crew progress and four-wide lanes use real saved event data',()=>{
  assert.match(file,/state\.crew\?\.results/);
  assert.match(file,/results\.filter\(r=>r\.won\)/);
  assert.match(file,/result\?\(result\.won\?'WIN':'LOSS'\)/);
  assert.match(file,/state\.fourWide\?\.results/);
  assert.match(file,/getChampionshipFourWideHeat\(state\)/);
  assert.match(file,/heat\?\.entrants\?\.\[lane\]/);
  assert.match(file,/mine\?GOLD/);
});
test('strategy, paddock, race and profile navigation stay functional',()=>{
  assert.match(file,/adviceByEvent:\{\.\.\.\(current\.adviceByEvent\|\|\{\}\),\[stage\]:note\}/);
  assert.match(file,/saveProTransaction\(s\.registry/);
  assert.match(file,/openPaddock\(s,state,'DRIVER'\)/);
  assert.match(file,/showPaddockCrewPicker\(s,actions,\[\]\)/);
  assert.match(file,/actions\.startRace\(stage==='KNOCKOUT'\?'CHAMP_KO':'CHAMP_FOUR'/);
  assert.match(file,/showCarPicker\(s,stage,actions\)/);
  assert.match(file,/view:'PROFILE',driverId:r\.id/);
});
