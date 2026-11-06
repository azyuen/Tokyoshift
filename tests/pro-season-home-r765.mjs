import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultProCircuitState} from '../src/data/proCircuit.js';
import {getProfessionalSeasonReport} from '../src/data/proSeason.js';

const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
const scene=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');

test('R765: season has a compact header and two separate visual summary cards',()=>{
  const start=panel.indexOf('  if (!openCircuit) {');
  const end=panel.indexOf('  // Rank and sponsorship',start);
  const header=panel.slice(start,end);
  assert.match(header,/text\(s,left,22,'PRO SEASON'/);
  assert.match(header,/'SEASON '\+c\.season/);
  assert.match(header,/CHAMPIONSHIP QUALIFICATION/);
  assert.match(header,/qualification\(55,'DRIVER',q\.driver,q\.driverRequired/);
  assert.match(header,/qualification\(97,'CREW',q\.crew,q\.crewRequired/);
  assert.match(header,/PRO RANKING/);
  assert.match(header,/'DRIVER   #'\+\(driver\?\.seed/);
  assert.match(header,/'CREW     #'\+\(team\?\.seed/);
  assert.doesNotMatch(header,/text\(s,x,132,'TOKYO CHAMPIONSHIP'/);
  assert.doesNotMatch(header,/text\(s,x,164,`DRIVER/);
});

test('R765: season standings remain available while the home rank card links to Pro rankings',()=>{
  const pro=createDefaultProCircuitState();
  const report=getProfessionalSeasonReport(pro);
  assert.ok(Number.isInteger(report.driverStanding));
  assert.ok(Number.isInteger(report.crewStanding));
  assert.match(panel,/const driver=getProCircuitDriverSeeds\(c\)/);
  assert.match(panel,/card\.on\('pointerdown',\(\)=>showProRankings\(s\)\)/);
});

test('R765: Drag Strip Manager stands to the right of the main three with his authored staging',()=>{
  const lineup=scene.slice(scene.indexOf('const dragStaff = CENTRAL_TOKYO_CHARACTER_IDS.dragComplex;'));
  assert.match(lineup,/dragStaff\.manager, pose: 'normal', x: STAGE\.x \+ 1165, feetY: STAGE\.y \+ 685, height: 320/);
  assert.match(lineup,/daichiSakamoto', pose: 'normal', assetKey: 'proSeasonDaichiMechanic', x: STAGE\.x \+ 972, feetY: STAGE\.y \+ 728, height: 378/);
  assert.match(lineup,/sayakaFujieda', pose: 'track', x: STAGE\.x \+ 805, feetY: STAGE\.y \+ 728, height: 356/);
});
