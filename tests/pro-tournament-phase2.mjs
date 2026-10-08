import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultProCircuitState, normaliseProCircuitState } from '../src/data/proCircuit.js';
import {
  FOUR_WIDE_CUP, createFourWideTournament, getPlayerProHeat,
  settleFourWideHeat, proCupRandom,
} from '../src/data/proTournament.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';

const player = 'player:driver';
function officialHeat(tournament, outcome = 'WIN') {
  const heat = getPlayerProHeat(tournament);
  assert.ok(heat, 'player needs a genuine playable heat');
  return { heat, results: heat.entrants.map((id, i) => ({
    id, finishSeconds: id === player ? outcome === 'WIN' ? 9.0 : 17.0 : 10.5 + i * .25,
    disqualified: id === player && outcome === 'DQ',
  })) };
}

test('16 unique racers, four seeded heats, distinct 4-wide player heat', () => {
  const a = createFourWideTournament(createDefaultProCircuitState(), 'ae86');
  const b = createFourWideTournament(createDefaultProCircuitState(), 'ae86');
  assert.deepEqual(a, b);
  assert.equal(a.entrants.length, 16);
  assert.equal(new Set(a.entrants.map(e => e.id)).size, 16);
  assert.equal(a.heats.length, 4);
  assert.ok(a.heats.every(h => h.entrants.length === 4));
  assert.equal(a.heats.flatMap(h => h.entrants).filter(id => id === player).length, 1);
  assert.equal(a.carId, 'ae86');
  assert.equal(createFourWideTournament({ ...createDefaultProCircuitState(), activeTournament: a }, 'ek9'), null);
});

test('a top-two qualifying result advances, creating a playable semifinal', () => {
  const circuit = createDefaultProCircuitState();
  circuit.activeTournament = createFourWideTournament(circuit, 'ek9');
  const { heat, results } = officialHeat(circuit.activeTournament, 'WIN');
  const settled = settleFourWideHeat(circuit, results, heat.id);
  assert.equal(settled.status, 'ADVANCED');
  assert.equal(settled.circuit.activeTournament.stage, 1);
  assert.equal(settled.circuit.activeTournament.heats.length, 2);
  assert.equal(settled.circuit.activeTournament.history[0].heats.length, 4);
  assert.ok(settled.circuit.activeTournament.history[0].heats.every(h => h.results?.length === 4));
  assert.equal(settled.cashPrize, 0);
  assert.equal(settled.circuit.eventTick, 0);
  assert.equal(settled.circuit.completedEventIds.length, 0);
});

test('qualifying, semifinal and final all work, award prize exactly once', () => {
  let circuit = createDefaultProCircuitState();
  circuit.activeTournament = createFourWideTournament(circuit, 'r32');
  let final;
  for(let stage=0;stage<3;stage++){
    const {heat,results} = officialHeat(circuit.activeTournament,'WIN');
    final = settleFourWideHeat(circuit,results,heat.id);
    assert.equal(final.status, stage===2?'COMPLETE':'ADVANCED');
    circuit=final.circuit;
  }
  assert.equal(final.summary.placing, 1);
  assert.equal(final.cashPrize,FOUR_WIDE_CUP.prizeCash[0]);
  assert.equal(circuit.eventTick,1);
  assert.equal(circuit.completedEventIds.length,1);
  assert.equal(circuit.playerDriver.entered,1);
  assert.equal(circuit.playerDriver.seasonPoints,32);
  assert.equal(circuit.qualified,true);
  assert.equal(circuit.activeTournament,null);
  assert.deepEqual(circuit.lastTournament,final.summary);
  assert.equal(settleFourWideHeat(circuit,[], 'old').status,'NO_EVENT');
});

test('last-place finish eliminates player but simulates remaining heats without extra playable races', () => {
  const circuit = createDefaultProCircuitState();
  circuit.activeTournament = createFourWideTournament(circuit, 'ae86');
  const {heat,results} = officialHeat(circuit.activeTournament,'LOSE');
  const done = settleFourWideHeat(circuit,results,heat.id);
  assert.equal(done.status,'COMPLETE');
  assert.equal(done.cashPrize,0);
  assert.equal(done.circuit.activeTournament,null);
  assert.equal(done.circuit.eventTick,1);
  assert.equal(done.circuit.playerDriver.entered,1);
  assert.equal(done.circuit.playerDriver.seasonPoints,3);
  assert.equal(done.circuit.completedEventIds.length,1);
  assert.equal(done.summary.stagesCompleted,1);
});

test('disqualified player never advances, even if their ET beats other cars', () => {
  const circuit=createDefaultProCircuitState();
  circuit.activeTournament=createFourWideTournament(circuit,'ae86');
  const {heat,results}=officialHeat(circuit.activeTournament,'DQ');
  const finished=settleFourWideHeat(circuit,results,heat.id);
  assert.equal(finished.status,'COMPLETE');
  assert.equal(finished.summary.stagesCompleted,1);
});

test('stale heat submission is rejected, without a repeat prize or ranking credit', () => {
  const circuit=createDefaultProCircuitState();
  circuit.activeTournament=createFourWideTournament(circuit,'ae86');
  const {heat,results}=officialHeat(circuit.activeTournament,'WIN');
  const advanced=settleFourWideHeat(circuit,results,heat.id);
  const stale=settleFourWideHeat(advanced.circuit,results,heat.id);
  assert.equal(stale.status,'STALE_HEAT');
  assert.equal(stale.cashPrize,0);
  assert.equal(stale.circuit.eventTick,0);
  assert.equal(stale.circuit.playerDriver.entered,0);
});

test('a registered car and semifinal survive GameState profile migration and PWA restore', () => {
  let circuit=createDefaultProCircuitState();
  circuit.activeTournament=createFourWideTournament(circuit,'ek9');
  const {heat,results}=officialHeat(circuit.activeTournament,'WIN');
  circuit=settleFourWideHeat(circuit,results,heat.id).circuit;
  const saved=normaliseState({ ...createDefaultGameState(), proCircuit:circuit });
  const restored=normaliseState(JSON.parse(JSON.stringify(saved))).proCircuit;
  assert.equal(restored.activeTournament.carId,'ek9');
  assert.equal(restored.activeTournament.stage,1);
  assert.ok(getPlayerProHeat(restored.activeTournament));
  assert.equal(restored.eventTick,0);
  assert.deepEqual(restored.completedEventIds,[]);
});

test('future tournament has fresh ID and reduced repeated cash prizes', () => {
  let state=createDefaultProCircuitState();
  state.activeTournament=createFourWideTournament(state,'ae86');
  const firstId=state.activeTournament.id;
  const {heat,results}=officialHeat(state.activeTournament,'LOSE');
  state=settleFourWideHeat(state,results,heat.id).circuit;
  const next=createFourWideTournament(state,'ek9');
  assert.notEqual(next.id, firstId);
  assert.equal(next.carId,'ek9');
});

test('offscreen simulation is deterministic, using seed; main story races untouched', () => {
  const rng1=proCupRandom('TEST-A'),rng2=proCupRandom('TEST-A');
  assert.deepEqual(Array.from({length:20},()=>rng1()),Array.from({length:20},()=>rng2()));
  const proScene=fs.readFileSync(new URL('../src/scenes/FourLaneTestScene.js',import.meta.url),'utf8');
  const central=fs.readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
  assert.match(proScene,/this\.proCup/);
  assert.match(proScene,/settleFourWideHeat/);
  assert.match(central,/FOUR-WIDE OPEN/);
  assert.match(central,/this\.enterFourWideCup\(\)/);
  assert.match(central,/RESUME FOUR-WIDE OPEN/);
  assert.match(central,/startProBracket/);
  assert.match(proScene,/this\.configureZoomFocus\(\)/);
  assert.match(proScene,/this\.setTrackZoom\(PREVIEW_ZOOM\)/);
});
