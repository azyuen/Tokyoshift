import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultProCircuitState } from '../src/data/proCircuit.js';
import { forfeitProfessionalSeason, isOpenCircuitAvailable } from '../src/data/proSeason.js';

const panel=fs.readFileSync(new URL('../src/ui/ProSeasonPanel.js',import.meta.url),'utf8');

test('withdraw remains a full-size touch button when Tokyo Championship is active',()=>{
  const header=panel.match(/export function drawSeasonHeader\(s,stage\) \{([\s\S]*?)\n\}/)?.[1]||'';
  assert.match(header,/const height=openCircuit\?158:c\.activeChampionship\?248:214/);
  assert.match(header,/if\(c\.activeChampionship\)\{/);
  assert.match(header,/if\(c\.seasonStatus==='ACTIVE'\|\|\(c\.seasonStatus==='COMPLETE'&&q\.qualified\)\)\s*\{/);
  assert.match(header,/button\(s,x\+\(w-10\)\/2,y\+\(c\.activeChampionship\?201:173\),w-10,/);
  assert.match(header,/WITHDRAW \/ FORFEIT SEASON/);
  assert.doesNotMatch(header,/else if\(c\.seasonStatus/);
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
  assert.match(withdrawal,/KEEP RACING/);
  assert.match(withdrawal,/CONFIRM FORFEIT/);
  assert.match(withdrawal,/forfeitProfessionalSeason\(circuit\(s\)\)/);
  assert.match(withdrawal,/commit\(s,changes\)/);
  assert.match(withdrawal,/changes\.competitionState=null/);
});
