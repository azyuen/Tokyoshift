import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  getDriverPowerPartLevelInfo,setDriverPowerPartLevels,restoreDriverPowerParts,
} from '../src/data/proDriverBriefing.js';
import {getProfessionalRoundEvents,PRO_SEASON_LENGTH} from '../src/data/proSeason.js';

const scene=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
const briefing=readFileSync(new URL('../src/ui/ProSeasonDriverBriefing.js',import.meta.url),'utf8');

test('PRO SEASON replaces generic page header and Pro Paddock sits above the race cards',()=>{
  assert.match(scene,/isOpen \? 'Open Circuit' : 'PRO SEASON'/);
  assert.match(scene,/const x=SIDE\.x\+SIDE\.w\/2,y=SIDE\.y\+133/);
  assert.match(scene,/PRO PADDOCK  \/\/  04 AWD · 05 RWD · 06 FF/);
  assert.doesNotMatch(scene,/PRO GARAGE  \/\/  04 AWD/);
  // Main drawNavigation owns the footer GO TO MAP action at y+674.
  assert.match(scene,/this\.drawNavigation\(/);
  assert.doesNotMatch(scene,/const x=SIDE\.x\+SIDE\.w\/2,y=SIDE\.y\+674;/);
});

test('season rankings box omits redundant yellow forecast while preserving standings',()=>{
  assert.doesNotMatch(panel,/text\(s,x,y\+148,status/);
  assert.match(panel,/VIEW ALL PROFESSIONAL RANKINGS/);
  assert.match(panel,/bar\(y\+39,'DRIVER'/);
  assert.match(panel,/bar\(y\+92,'CREW'/);
});

test('season cards display round names and single-line possible points rather than sponsorship',()=>{
  assert.match(scene,/getProSeasonEventNames\(round\)/);
  assert.match(scene,/label:proNames\.crew/);
  assert.match(scene,/label: proNames\.driver/);
  assert.match(scene,/UP TO 20 SEASON POINTS/);
  assert.doesNotMatch(scene,/ARUKEN SPONSORED/);
  assert.doesNotMatch(scene,/DRIVER POINTS \/\/ 20 MAX/);
  assert.equal(PRO_SEASON_LENGTH,8);
});

test('season sidebar no longer lists entry, registered car, attempt or redundant power limits',()=>{
  const section=scene.slice(scene.indexOf('    if(!openCircuit&&seasonRules){'),
    scene.indexOf('\n    drawProEventSidebarDetails(this,SIDE,desc);'));
  assert.ok(section.length>300,'season sidebar condensed override exists');
  assert.match(section,/desc\.splice\(0,desc\.length/);
  assert.match(section,/SEASON POINTS  UP TO 20/);
  assert.match(section,/CHAMPION CASH/);
  assert.match(section,/POWER  /);
  assert.doesNotMatch(section,/REGISTERED CAR|ATTEMPT|ENTRY  |PRO COMP \/\//);
});

test('out-of-class or over-limit current selected car still opens free Daichi preparation',()=>{
  assert.match(scene,/const hasRegisteredSeasonCar/);
  assert.match(scene,/openCircuit\?openEntryCarOk:hasRegisteredSeasonCar/);
  assert.match(scene,/showProSeasonDriverBriefing\(this,event,preparedBuild/);
  assert.match(briefing,/CHOOSE ONE OF YOUR THREE REGISTERED CARS/);
  assert.match(briefing,/DAICHI \/\/ FREE EVENT PREPARATION/);
  assert.match(briefing,/setDriverPowerPartLevels\(draft/);
  assert.match(briefing,/getProfessionalCarEligibility\(selected,drafts\[selected\],rules\)/);
  assert.match(briefing,/saveProTransaction\(s\.registry/);
  assert.match(briefing,/selectedCarId:selected/);
  assert.match(briefing,/GO TO GRID/);
});

test('Daichi may downgrade and restore already-owned levels without purchases',()=>{
  const saved={tuning:{turbo:3,ecu:2},drivetrainTuning:{clutch:2}};
  const lower=setDriverPowerPartLevels(saved,{turbo:0,ecu:1,clutch:0});
  assert.equal(getDriverPowerPartLevelInfo(lower,'turbo').current,0);
  assert.equal(getDriverPowerPartLevelInfo(lower,'turbo').original,3);
  assert.equal(getDriverPowerPartLevelInfo(lower,'clutch').original,2);
  const restored=restoreDriverPowerParts(lower);
  assert.equal(getDriverPowerPartLevelInfo(restored,'turbo').current,3);
  assert.equal(getDriverPowerPartLevelInfo(restored,'ecu').current,2);
  assert.equal(getDriverPowerPartLevelInfo(restored,'clutch').current,2);
});

test('all eight scheduled rounds still expose normal event rules',()=>{
  for(let i=0;i<PRO_SEASON_LENGTH;i++){
    const round=getProfessionalRoundEvents(i);
    assert.ok(round.driver.format, 'driver format '+i);
    assert.ok(round.crew.format, 'crew format '+i);
  }
});
