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
  assert.match(header,/text\(s,x,28,'PRO SEASON'/);
  assert.match(header,/SEASON \$\{c\.season\}  \/\/  ROUND/);
  assert.match(header,/CHAMPIONSHIP QUALIFICATION/);
  assert.match(header,/qualificationLine\(65,'DRIVER POINTS'/);
  assert.match(header,/qualificationLine\(106,'CREW POINTS'/);
  assert.match(header,/SEASON RANK/);
  assert.match(header,/seasonReport\.driverStanding/);
  assert.match(header,/seasonReport\.crewStanding/);
  assert.doesNotMatch(header,/text\(s,x,132,'TOKYO CHAMPIONSHIP'/);
  assert.doesNotMatch(header,/text\(s,x,164,`DRIVER/);
});

test('R765: actual season standings, not lifetime Pro rankings, feed rank card',()=>{
  const pro=createDefaultProCircuitState();
  const report=getProfessionalSeasonReport(pro);
  assert.ok(Number.isInteger(report.driverStanding));
  assert.ok(Number.isInteger(report.crewStanding));
  assert.match(panel,/const hasCompletedRound=c\.calendar\.round>0/);
  assert.match(panel,/hasCompletedRound&&standing\?'#'\+standing:'—'/);
});

test('R765: Drag Strip Manager is equal scale and slightly right of the main three',()=>{
  const lineup=scene.slice(scene.indexOf('const dragStaff = CENTRAL_TOKYO_CHARACTER_IDS.dragComplex;'));
  assert.match(lineup,/dragStaff\.manager, pose: 'normal', x: STAGE\.x \+ 1146, feetY: STAGE\.y \+ 728, height: 280/);
  assert.match(lineup,/daichiSakamoto', pose: 'normal', x: STAGE\.x \+ 980, feetY: STAGE\.y \+ 728, height: 280/);
  assert.match(lineup,/sayakaFujieda', pose: 'track', x: STAGE\.x \+ 840, feetY: STAGE\.y \+ 728, height: 285/);
});
