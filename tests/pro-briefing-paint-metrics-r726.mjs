import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getProRaceRivalPaint,PRO_RACE_RIVAL_PAINTS} from '../src/data/proRacePaint.js';
import {getCarPaintColor} from '../src/vehicles/CarAppearance.js';

const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const briefing=read('src/ui/ProDriverBriefing.js');
const race=read('src/scenes/FourLaneTestScene.js');

test('first individual/trophy opponent car preview matches its live race paint, not factory white',()=>{
  assert.deepEqual(PRO_RACE_RIVAL_PAINTS,[0xd04a59,0x63b3d4,0xefca66]);
  assert.equal(getProRaceRivalPaint(0),0xd04a59);
  assert.equal(getCarPaintColor({paintColor:getProRaceRivalPaint(0)}),getProRaceRivalPaint(0));
  assert.match(race,/paint: getProRaceRivalPaint\(index\)/);
  assert.match(briefing,/safeCarPreview\(round\.carId,545,743,211,225,\{/);
  assert.match(briefing,/paintColor:getProRaceRivalPaint\(0\)/);
  assert.doesNotMatch(race,/paint: \[0xd04a59, 0x63b3d4, 0xefca66\]\[index\]/);
  for(let i=0;i<3;i++)assert.ok(Number.isInteger(getProRaceRivalPaint(i)));
});

test('Daichi tuning popup is wider and right-hand live metrics do not cover the tune rows',()=>{
  assert.match(briefing,/const x=377,y=46,w=1140,h=738,side=36,mid=206/);
  assert.match(briefing,/wordWrap:\{width:835\},lineSpacing:4/);
  assert.match(briefing,/const railX=1276,railY=216,railW=226,railH=455/);
  assert.match(briefing,/label:'POWER',field:'power'/);
  assert.match(briefing,/label:'TORQUE',field:'torque'/);
  assert.match(briefing,/label:'WEIGHT',field:'mass'/);
  assert.match(briefing,/label:'SCRUTINEERING',field:'status'/);
  const metric=briefing.slice(briefing.indexOf('  function addLiveEngineeringMetrics('),
    briefing.indexOf('  function openForfeit('));
  assert.doesNotMatch(metric,/rectangle\(820,229,820,64/);
  assert.doesNotMatch(metric,/const cols=/);
  assert.match(metric,/return check/);
  assert.ok(377+1140<=1560,'dialogue remains within 1560px game width');
  assert.ok(1276+226<=377+1140-8,'metrics remain within callout border');
  assert.ok(1276>820+826/2+20,'metrics begin beyond calibration cards');
  assert.ok(216+455<730-25,'metrics remain clear of lower action buttons');
  assert.ok(835+377+25<1276,'instruction text does not intrude into metric rail');
  // Both the part selection and the Stage III tuning share these metrics.
  assert.equal((briefing.match(/const previewMetrics=addLiveEngineeringMetrics\(carState\)/g)||[]).length,2);
  assert.match(briefing,/previewMetrics\(previewState\)/);
  assert.match(briefing,/previewMetrics\(\{\.\.\.carState,stage3Calibration:/);
});
