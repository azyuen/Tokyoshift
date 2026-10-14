import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Vehicle from '../src/vehicles/Vehicle.js';
import { DrivingCoach } from '../src/ai/DrivingCoach.js';
import { getBuiltCar } from '../src/vehicles/VehiclePerformance.js';
import { normaliseState, createDefaultGameState } from '../src/state/GameState.js';

globalThis.Phaser = {
  Math: {
    Clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    Linear: (a, b, t) => a + (b - a) * t,
  },
};

test('physics-informed launch band and individual shift targets adapt to real cars', () => {
  for (const id of ['ae86', 'r34', 'jza80', 'nsx']) {
    const built = getBuiltCar(id, {});
    assert.ok(built, 'missing car ' + id);
    const coach = new DrivingCoach(new Vehicle(built.car, built.engine));
    const launch = coach.launch();
    assert.ok(launch.min > 0 && launch.min <= launch.target && launch.target <= launch.max);
    assert.ok(launch.max < built.engine.limiterRPM);
    assert.equal(coach.shiftBands.length, built.car.gearRatios.length - 1);
    for (const band of coach.shiftBands) {
      assert.ok(band.min <= band.target && band.target <= band.max);
      assert.ok(band.max < built.engine.limiterRPM);
      assert.ok(band.to === band.from + 1);
    }
    const rolling = coach.rollingStart();
    assert.ok(rolling.gear >= 1 && rolling.gear <= built.car.gearRatios.length);
    assert.ok(Number.isFinite(rolling.rpm));
  }
});

test('gear and engine calibration produce updated advice without mutating builds', () => {
  const stock = getBuiltCar('jza80', {});
  const state = {
    engineTuning: { intake: 3, ecu: 3, turbo: 3, intercooler: 3, internals: 3 },
    drivetrainTuning: { clutch: 3, gearbox: 3, differential: 3, suspension: 3 },
    stage3Calibration: { ecuBias: -2, boostBias: 2, gearBias: 2 },
  };
  const tuned = getBuiltCar('jza80', state);
  assert.notDeepEqual(tuned.car.gearRatios, stock.car.gearRatios);
  const frozen = JSON.stringify(tuned);
  const s = new DrivingCoach(new Vehicle(stock.car, stock.engine));
  const t = new DrivingCoach(new Vehicle(tuned.car, tuned.engine));
  assert.notDeepEqual(s.shiftBands, t.shiftBands);
  assert.equal(JSON.stringify(tuned), frozen);
  const response = t.shiftAdvice(1, t.shiftBands[0].target);
  assert.equal(response.pose, 'happy');
  assert.match(t.shiftAdvice(1, t.shiftBands[0].min - 500).verdict, /EARLY/);
});

test('Oshiage sessions are persisted per car, and old saves remain compatible', () => {
  const initial = createDefaultGameState();
  assert.deepEqual(initial.oshiageCoachingProgress, {});
  const state = normaliseState({
    ...initial, oshiageLessonTab: 3, oshiageTrainingLesson: 'rolling',
    oshiageCoachingProgress: { r34: { rolling: { build: 'test', completed: true, bestSeconds: 16.4 } } },
  });
  assert.equal(state.oshiageLessonTab, 3);
  assert.equal(state.oshiageTrainingLesson, 'rolling');
  assert.equal(state.oshiageCoachingProgress.r34.rolling.bestSeconds, 16.4);
  assert.equal(normaliseState({}).oshiageTrainingLesson, null);
});

test('new lessons use tutorial category, keep old tutorial and protect race settlement', () => {
  const school = readFileSync(new URL('../src/scenes/OshiageScene.js', import.meta.url), 'utf8');
  const race = readFileSync(new URL('../src/scenes/RaceScene.js', import.meta.url), 'utf8');
  assert.match(school, /startBasicTutorial\(lessonId = null\)/);
  for (const id of ['launch', 'standing', 'rolling']) {
    assert.match(school, new RegExp("id: '" + id + "'"));
  }
  assert.match(race, /this\.isCoaching = Boolean\(this\.coachingLesson\)/);
  assert.match(race, /if \(this\.isCoaching\) this\.setupCoachedLesson\(\)/);
  assert.match(race, /this\.resultsShown = true/);
  assert.match(race, /if \(this\.isTutorial\) \{\s*saveSessionState\(this\.registry\)/);
  assert.match(race, /this\.coachSpeak\(assessment\.verdict, assessment\.pose\)/);
});
