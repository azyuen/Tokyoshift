import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPinkSlipOpportunityChance, isPinkSlipValueEligible, rollPinkSlipOpportunity,
  consumePinkSlipOpportunity, recordPinkSlipVictory,
} from '../src/data/pinkSlipProgression.js';

function registry(seed = {}) {
  const values = { wins: 0, losses: 0, playerDifficulty: 'STANDARD', ...seed };
  return { get: key => values[key], set: (key, value) => { values[key] = value; } };
}
test('AE86 and EF still have an actual early pink-slip car pool', () => {
  for (const starter of ['ae86', 'ef']) {
    for (const rival of ['ae86', 'ef', 'ej1', 'ek9', 'fc3s']) {
      assert.equal(isPinkSlipValueEligible(starter, rival), true, starter + ' vs ' + rival);
    }
    assert.equal(isPinkSlipValueEligible(starter, 'r32'), false);
  }
  assert.equal(isPinkSlipValueEligible('ae86', 'rx8'), false);
  assert.equal(isPinkSlipValueEligible('ef', 'rx8'), true);
  assert.equal(isPinkSlipValueEligible('ef', 'a60'), true);
  assert.equal(isPinkSlipValueEligible('ae86__copy2', 'fc3s'), true);
});
test('cumulative chance reaches 50% by the intended completed-race median', () => {
  for (const [difficulty, median] of [['EASY', 45], ['STANDARD', 30], ['HARD', 35]]) {
    let none = 1;
    for (let n = 1; n <= median; n++) {
      none *= 1 - getPinkSlipOpportunityChance(registry({
        wins: n, pinkSlipLastWinRace: 0, playerDifficulty: difficulty,
      }));
    }
    assert.ok(Math.abs(none - 0.5) < 1e-9, difficulty);
  }
});
test('three channels cannot reroll the same race or present multiple offers', () => {
  const r = registry({ wins: 30 });
  let calls = 0;
  const random = () => { calls++; return 0; };
  assert.equal(rollPinkSlipOpportunity(r, random), true);
  assert.equal(rollPinkSlipOpportunity(r, random), true);
  assert.equal(calls, 1);
  assert.equal(consumePinkSlipOpportunity(r), true);
  assert.equal(consumePinkSlipOpportunity(r), false);
  assert.equal(rollPinkSlipOpportunity(r, random), false);
  r.set('losses', 1);
  assert.equal(rollPinkSlipOpportunity(r, random), true);
  assert.equal(calls, 2);
});
test('winning resets probability, caches and pending challenger', () => {
  const r = registry({ wins: 60, losses: 6, specialChallenger: { active: true } });
  rollPinkSlipOpportunity(r, () => 0);
  recordPinkSlipVictory(r);
  assert.equal(r.get('pinkSlipLastWinRace'), 66);
  assert.equal(r.get('specialChallenger'), null);
  assert.equal(rollPinkSlipOpportunity(r, () => 0), false);
  r.set('wins', 61);
  assert.ok(getPinkSlipOpportunityChance(r) < 0.001);
});
