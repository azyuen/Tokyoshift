import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultProCircuitState } from '../src/data/proCircuit.js';
import { forfeitProfessionalSeason, isOpenCircuitAvailable } from '../src/data/proSeason.js';

const panel=fs.readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');

test('forfeit button remains accessible from the right panel throughout Tokyo Championship',()=>{
  const block=panel.slice(panel.indexOf('export function showProSeasonAction'),panel.indexOf('/** Deliberate commitment'));
  assert.match(block,/c\.seasonStatus==='ACTIVE'/);
  assert.match(block,/c\.seasonStatus==='COMPLETE'/);
  assert.match(block,/WITHDRAW \/ FORFEIT SEASON/);
  assert.match(block,/showProSeasonWithdrawal\(s\)/);
  assert.match(block,/side\.y\+624/);
  const header=panel.slice(panel.indexOf('export function drawSeasonHeader'),panel.indexOf('export function drawCrewSidebar'));
  assert.match(header,/const height=openCircuit\?111:c\.activeChampionship\?176:158/);
  assert.doesNotMatch(header,/WITHDRAW \/ FORFEIT SEASON/);
});

test('forfeit during a Tokyo Championship returns to open events without deleting trophies',()=>{
  const circuit=createDefaultProCircuitState();
  circuit.seasonStatus='ACTIVE';
  circuit.calendar.round=8;
  circuit.playerDriver.seasonPoints=60;
  circuit.playerTeam.seasonPoints=40;
  circuit.trophyWins.shutoSpeed=2;
  circuit.activeChampionship={season:1,stage:'KNOCKOUT',completed:false};
  const result=forfeitProfessionalSeason(circuit);
  assert.ok(result.circuit);
  assert.equal(result.circuit.seasonStatus,'OPEN');
  assert.equal(result.circuit.season,2);
  assert.equal(result.circuit.calendar.round,0);
  assert.equal(result.circuit.activeChampionship,null);
  assert.equal(result.circuit.playerDriver.seasonPoints,0);
  assert.equal(result.circuit.playerTeam.seasonPoints,0);
  assert.equal(result.circuit.trophyWins.shutoSpeed,2);
  assert.equal(result.circuit.calendar.archives.at(-1).forfeited,true);
  assert.equal(isOpenCircuitAvailable(result.circuit),true);
});

test('forfeit screen keeps separate confirmation and cancels without modifying a save',()=>{
  const withdrawal=panel.slice(panel.indexOf('export function showProSeasonWithdrawal'));
  assert.match(withdrawal,/confirmLabel:'CONFIRM FORFEIT'/);
  assert.match(panel,/action\(x-180,'CANCEL',close,false\)/);
  assert.match(withdrawal,/CONFIRM FORFEIT/);
  assert.match(withdrawal,/forfeitProfessionalSeason\(circuit\(s\)\)/);
  assert.match(withdrawal,/commit\(s,changes\)/);
  assert.match(withdrawal,/changes\.competitionState=null/);
});
