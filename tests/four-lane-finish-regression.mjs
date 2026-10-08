import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  FOUR_LANE_FINISH_TIMING, getFourLaneFinishCue,
} from '../src/data/fourLaneFinish.js';
import {
  createFourWideTournament, getPlayerProHeat, settleFourWideHeat,
} from '../src/data/proTournament.js';
import { createDefaultProCircuitState } from '../src/data/proCircuit.js';
import { rankFourLaneFinishers } from '../src/data/fourLanePrototype.js';

test('meet-style finish choreography locks camera early and always ends within 2.1s', () => {
  assert.deepEqual(getFourLaneFinishCue({ now: 5, greenClock: null }),
    { lockCamera: false, showResults: false, timedOut: false });
  const start = 10;
  const pending = getFourLaneFinishCue({ now: start + .12, greenClock: 1,
    firstFinishClock: start });
  assert.equal(pending.lockCamera, false);
  assert.equal(pending.showResults, false);
  const locked = getFourLaneFinishCue({ now: start + .26, greenClock: 1,
    firstFinishClock: start, allFinished: false });
  assert.equal(locked.lockCamera, true);
  assert.equal(locked.showResults, false);
  assert.equal(getFourLaneFinishCue({ now: start + .8, greenClock: 1,
    firstFinishClock: start, allFinished: true }).showResults, false);
  assert.equal(getFourLaneFinishCue({ now: start + .91, greenClock: 1,
    firstFinishClock: start, allFinished: true }).showResults, true);
  assert.equal(getFourLaneFinishCue({ now: start + 2.11, greenClock: 1,
    firstFinishClock: start, allFinished: false }).showResults, true);
  assert.equal(FOUR_LANE_FINISH_TIMING.maximumFlyPast, 2.1);
});

test('no competitor reaches finish: timeout produces result rather than endless drive', () => {
  assert.equal(getFourLaneFinishCue({ now: 37.9, greenClock: 0,
    firstFinishClock: null }).showResults, false);
  assert.deepEqual(getFourLaneFinishCue({ now: 38.2, greenClock: 0,
    firstFinishClock: null }),
  { lockCamera: false, showResults: true, timedOut: true });
});

test('real four-lane runner IDs match saved bracket IDs so result settlement cannot throw', () => {
  const state = createDefaultProCircuitState();
  state.activeTournament = createFourWideTournament(state, 'ae86');
  const heat = getPlayerProHeat(state.activeTournament);
  const runnerIds = ['player:driver', ...heat.entrants.filter(id => id !== 'player:driver')];
  assert.equal(runnerIds.length, 4);
  const crossingData = [
    { id: runnerIds[0], lane: 1, label: 'YOU', finishSeconds: 10.987 },
    { id: runnerIds[1], lane: 2, label: 'RIVAL 1', finishSeconds: 10.2 },
    { id: runnerIds[2], lane: 3, label: 'RIVAL 2', finishSeconds: 11.3 },
    { id: runnerIds[3], lane: 4, label: 'RIVAL 3', finishSeconds: 10.7 },
  ];
  const displayed = rankFourLaneFinishers(crossingData);
  assert.deepEqual(displayed.map(r=>r.id), [
    runnerIds[1],runnerIds[3],runnerIds[0],runnerIds[2],
  ]);
  const result = settleFourWideHeat(state, crossingData, heat.id);
  assert.equal(result.status, 'COMPLETE');
  assert.equal(result.settled, true);
  assert.equal(result.circuit.eventTick, 1);
  assert.equal(result.summary.stagesCompleted, 1);
  // Entered event completed once; same official heat cannot re-award anything.
  assert.equal(settleFourWideHeat(result.circuit, crossingData, heat.id).cashPrize, 0);
});

test('second place advances to semifinal and preserves correct driver ID', () => {
  const state = createDefaultProCircuitState();
  state.activeTournament = createFourWideTournament(state, 'ek9');
  const heat = getPlayerProHeat(state.activeTournament);
  const rows = heat.entrants.map((id, i) => ({
    id, finishSeconds: id === 'player:driver' ? 10.4 : [9.8, 11.2, 11.6][i - (i > heat.entrants.indexOf('player:driver') ? 1 : 0)],
  }));
  const result = settleFourWideHeat(state, rows, heat.id);
  assert.equal(result.status, 'ADVANCED');
  assert.equal(result.circuit.activeTournament.stage, 1);
  assert.ok(getPlayerProHeat(result.circuit.activeTournament));
});

test('actual scene references the official ID and locked camera and gives preheat briefing', () => {
  const path = new URL('../src/scenes/FourLaneTestScene.js', import.meta.url);
  const source = fs.readFileSync(path, 'utf8');
  assert.match(source, /id: this\.proCup \? 'player:driver' : 'player'/);
  assert.match(source, /this\.finishCameraPx = null/);
  assert.match(source, /this\.cameraPx = this\.finishCameraPx \?\? chaseCameraPx/);
  assert.match(source, /this\.firstFinishClock/);
  assert.match(source, /this\.beginFinishTransition\(\)/);
  assert.match(source, /this\.showFourLaneResults\(\)/);
  assert.match(source, /this\.showTournamentBriefing\(\)/);
  assert.match(source, /briefingSeen: true/);
  assert.match(source, /YOUR FIRST HEAT/);
  assert.match(source, /TOP TWO ADVANCE/);
  assert.match(source, /READY TO RACE/);
  assert.doesNotMatch(source, /this\.raceClock - this\.firstFinishClock > 10/);
});
