import test from 'node:test';
import assert from 'node:assert/strict';
import { cars } from '../src/data/cars.js';
import { engines } from '../src/data/engines.js';
import { RIVAL_BUILD_ARCHETYPES } from '../src/data/progressionBalance.js';
import { buildTunerTeamChallengeRounds } from '../src/data/tunerChallenges.js';
import { materialiseRegionalChallengeRounds } from '../src/data/regionalChallengeBuilds.js';
import { getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';

const roundBuild = (region, difficulty = 'STANDARD') =>
  materialiseRegionalChallengeRounds(buildTunerTeamChallengeRounds(region, '', difficulty), 90);
const REGIONS = ['ODAIBA', 'SHINAGAWA', 'TATSUMI', 'SHIBUYA', 'YOKOHAMA', 'DAIKOKU', 'SHINJUKU'];

test('late-model FD 13B-REW makes its rated 314 Nm at 5000 rpm and ~206 kW at 6500', () => {
  assert.equal(cars.rx7fd.torqueNm, 314);
  assert.equal(cars.rx7fd.powerKW, 206);
  const engine = engines[cars.rx7fd.engine];
  const torqueAt = rpm => engine.torqueCurve.find(point => point[0] === rpm)?.[1];
  assert.equal(torqueAt(5000), 314);
  assert.equal(torqueAt(6500), 303);
  const curvePower = engine.torqueCurve.map(([rpm, torque]) => torque * rpm / 9549);
  const peak = Math.max(...curvePower);
  assert.ok(peak >= 205 && peak <= 207, 'engine torque curve should agree with rated 206 kW');
  assert.equal(curvePower.indexOf(peak), engine.torqueCurve.findIndex(([rpm]) => rpm === 6500));
  assert.ok(torqueAt(8000) < torqueAt(6500), 'FD should not make more torque at redline than at peak power');
});

test('regional archetypes never allocate their forbidden upgrades', () => {
  for (const region of REGIONS) {
    for (const round of roundBuild(region)) {
      const state = round.opponentBuildState;
      const archetype = RIVAL_BUILD_ARCHETYPES[round.opponentBuildArchetype];
      assert.ok(archetype, 'unknown archetype ' + round.opponentBuildArchetype);
      for (const id of archetype.forbidden || []) {
        const [category, part] = id.split('.');
        const group = { engine: 'tuning', drivetrain: 'drivetrainTuning', chassis: 'chassisTuning', exhaust: 'exhaustNosTuning' }[category];
        assert.equal(state[group][part], 0, region + ' round ' + round.stageIndex + ' has forbidden ' + id);
      }
    }
  }
});

test('ordinary NA regional rivals keep NA engines; only TURBO / ROLL can convert', () => {
  for (const region of REGIONS) {
    for (const round of roundBuild(region)) {
      const state = round.opponentBuildState;
      if (Number(cars[round.carId]?.maximumBoost || 0) > 0.01) continue;
      if (state.buildArchetype !== 'turboRoll') {
        assert.equal(state.tuning.turbo, 0, region + ' round ' + round.stageIndex + ' surprise turbo conversion');
        assert.equal(state.tuning.intercooler, 0, region + ' round ' + round.stageIndex + ' unusable intercooler');
      } else if (round.workshopEra === 'CANAL') {
        assert.ok(state.tuning.turbo <= 1, region + ' round ' + round.stageIndex + ' premature L2 turbo conversion');
      }
    }
  }
});

test('Tatsumi half-mile S2000 is NA high-rev and cannot overpower a Canal-maxed FD by hardware alone', () => {
  const round = roundBuild('TATSUMI')[4];
  assert.equal(round.carId, 's2000');
  assert.equal(round.raceType, 'Roll Race');
  assert.equal(round.distanceM, 804.672);
  assert.equal(round.opponentBuildArchetype, 'naHighRev');
  assert.equal(round.opponentBuildState.tuning.turbo, 0);
  assert.equal(round.opponentBuildState.tuning.intercooler, 0);
  const fdCanal = {
    tuning: { engine: 2, intake: 2, ecu: 2, turbo: 2, intercooler: 2 },
    drivetrainTuning: { clutch: 2, gearbox: 2, differential: 2, suspension: 2 },
    chassisTuning: { tyres: 2, weightReduction: 2 },
    exhaustNosTuning: { headers: 2, exhaust: 2, muffler: 2, nosKit: 0, nitrousShot: 0 },
  };
  const fd = getVehiclePerformance('rx7fd', fdCanal, { raceType: 'Roll Race' });
  const s2000 = getVehiclePerformance('s2000', round.opponentBuildState, { raceType: 'Roll Race' });
  assert.ok(fd.car.powerKW > s2000.car.powerKW, 'fully tuned FD should have more outright power');
  assert.ok(fd.index.rolling > s2000.index.rolling, 'fully tuned FD must be a viable rolling-race choice');
});


test('Tatsumi Standard develops gradually and Canal-maxed 22B can beat both Expert EVOs', () => {
  const rounds = roundBuild('TATSUMI');
  assert.deepEqual(rounds.map(round => round.tuningPointCap), [12, 15, 17, 19, 20, 21, 25]);
  assert.ok(rounds.every(round =>
    round.workshopEra === 'CANAL' &&
    round.maxTuningLevel === 2 &&
    round.opponentBuildState.specialistTuning.length === 0
  ), 'Tatsumi rivals must stay within Canal Yard hardware');

  const sixth = rounds[5];
  const seventh = rounds[6];
  assert.equal(sixth.carId, 'evo3');
  assert.equal(seventh.carId, 'evo3');
  assert.equal(sixth.encounterRating, 4);
  assert.equal(seventh.encounterRating, 4);

  const fullCanal22B = {
    tuning: { engine: 2, intake: 2, ecu: 2, turbo: 2, intercooler: 2 },
    drivetrainTuning: { clutch: 2, gearbox: 2, differential: 2, suspension: 2 },
    chassisTuning: { tyres: 2, weightReduction: 2 },
    exhaustNosTuning: { headers: 2, exhaust: 2, muffler: 2, nosKit: 2, nitrousShot: 2 },
  };
  const player = getVehiclePerformance('wrx22b', fullCanal22B);
  const standingEvo = getVehiclePerformance('evo3', sixth.opponentBuildState);
  const rollingEvo = getVehiclePerformance('evo3', seventh.opponentBuildState);
  // Drivers still matter: this is a physical performance margin, not a
  // guaranteed win. Expert AI retains its optimal launch/shift behaviour.
  assert.ok(player.index.standing > standingEvo.index.standing * 1.10,
    'round 6 half-mile Expert EVO leaves too little margin for manual driving');
  assert.ok(player.index.rolling > rollingEvo.index.rolling * 1.10,
    'round 7 half-mile Expert EVO leaves too little margin for manual driving');
});
