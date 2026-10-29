// New Career review beat: Pro Season qualification failure (not Tokyo loss).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getCutscene,getCutsceneIds} from '../src/data/cutscenes.js';
import {createDefaultProCircuitState} from '../src/data/proCircuit.js';
import {getProfessionalSeasonReport} from '../src/data/proSeason.js';

const ui=readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');
const scene=getCutscene('proSeasonNotQualified');

function report(round,driver,crew,season=1){
  const c=createDefaultProCircuitState();
  c.calendar.round=round;c.seasonStatus=round===8?'COMPLETE':'ACTIVE';
  c.playerDriver.seasonPoints=driver;c.playerTeam.seasonPoints=crew;c.season=season;
  return getProfessionalSeasonReport(c);
}
test('scene has five short frames, established actors, and standard review action',()=>{
  assert.ok(scene);
  assert.equal(scene.once,true);
  assert.equal(scene.pages.length,5);
  assert.equal(scene.characters.left,'sayakaFujieda');
  assert.equal(scene.characters.right,'$PLAYER');
  assert.ok(scene.pages.some(p=>p.leftCharacter==='daichiSakamoto'));
  assert.equal(scene.finalActionLabel,'VIEW SEASON REPORT');
  assert.ok(getCutsceneIds().includes('proSeasonNotQualified'));
  assert.ok(scene.pages.every(p=>typeof p.text==='string'&&p.text.length>12));
});
test('cutscene only qualifies after all eight rounds and unmet 60/40 thresholds',()=>{
  assert.equal(report(7,20,20).outcome,'IN_PROGRESS');
  assert.equal(report(8,60,40).outcome,'QUALIFIED');
  assert.equal(report(8,59,40).outcome,'NOT_QUALIFIED');
  assert.equal(report(8,60,39).outcome,'NOT_QUALIFIED');
  assert.equal(report(8,0,0).outcome,'NOT_QUALIFIED');
  assert.equal(report(8,59,40).completed,true);
  assert.equal(report(8,60,39).canEnterTokyo,false);
});
test('one save-persistent history marker per failed season, no reroll on reopen',()=>{
  const body=ui.slice(ui.indexOf('export function showSeasonRecords('),
    ui.indexOf('export function showTokyoChampionship('));
  assert.match(body,/if\(report\.outcome==='NOT_QUALIFIED'\)/);
  assert.match(body,/playMangaCutscene\(s,'proSeasonNotQualified'/);
  assert.match(body,/historyId:'proSeasonNotQualified:s'\+c\.season/);
  assert.notEqual('proSeasonNotQualified:s1','proSeasonNotQualified:s2');
});
test('nonqualification reflection is honest and does not promise automatic entry',()=>{
  const all=scene.pages.map(p=>p.text).join(' ');
  assert.match(all,/eight rounds/);
  assert.match(all,/qualification targets/);
  assert.match(all,/Driver and Crew events/);
  assert.doesNotMatch(all,/guarantee|automatically|free title|\bqualified\b/i);
});
