import { cars, carOrder } from './cars.js?v=20261011-r479';
import { RIVAL_BUILD_ARCHETYPES } from './progressionBalance.js?v=20260929-r271';
import { chooseRivalBuildArchetype } from './rivalBuilds.js?v=20260928-r234';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261008-r428';
import { canInstallTuningLevel, WORKSHOP_TIERS } from './workshopProgression.js?v=20261005-r354';

const PARTS = Object.freeze({
  'engine.engine': ['engine', 'engine', 'tuning'],
  'engine.intake': ['engine', 'intake', 'tuning'],
  'engine.ecu': ['engine', 'ecu', 'tuning'],
  'engine.turbo': ['engine', 'turbo', 'tuning'],
  'engine.intercooler': ['engine', 'intercooler', 'tuning'],
  'drivetrain.clutch': ['drivetrain', 'clutch', 'drivetrainTuning'],
  'drivetrain.gearbox': ['drivetrain', 'gearbox', 'drivetrainTuning'],
  'drivetrain.differential': ['drivetrain', 'differential', 'drivetrainTuning'],
  'drivetrain.suspension': ['drivetrain', 'suspension', 'drivetrainTuning'],
  'chassis.tyres': ['chassis', 'tyres', 'chassisTuning'],
  'chassis.weightReduction': ['chassis', 'weightReduction', 'chassisTuning'],
  'exhaust.headers': ['exhaustNos', 'headers', 'exhaustNosTuning'],
  'exhaust.exhaust': ['exhaustNos', 'exhaust', 'exhaustNosTuning'],
  'exhaust.muffler': ['exhaustNos', 'muffler', 'exhaustNosTuning'],
  'exhaust.nosKit': ['exhaustNos', 'nosKit', 'exhaustNosTuning'],
  'exhaust.nitrousShot': ['exhaustNos', 'nitrousShot', 'exhaustNosTuning'],
});

const ERA = Object.freeze([
  { name: 'HOME', maxLevel: 1, ranges: [[0, 6], [0, 8], [0, 10]] },
  { name: 'CANAL', maxLevel: 2, ranges: [[0, 16], [0, 22], [0, 28]] },
  { name: 'WAREHOUSE', maxLevel: 3, ranges: [[0, 33], [0, 40], [0, 46]] },
]);

// Prize value, rather than garage age alone, determines the driving talent in
// all three rounds. Low-value cash events are a genuine stepping stone toward
// the first Street Showdown win needed to unlock Shibuya and Yokohama.
// These are driver tiers, not extra engine/physics modifiers.
const CASH_DRIVER_RATINGS = Object.freeze({
  ENTRY: Object.freeze([2, 2, 3]), // ¥20k: Rookie, Rookie, Skilled
  LOCAL: Object.freeze([3, 3, 3]), // ¥32k: Skilled all the way
  HIGH: Object.freeze([3, 3, 4]),  // ¥48k: Expert final
  TOP: Object.freeze([3, 4, 4]),   // ¥70k: Expert finish
});
const COUPON_DRIVER_RATINGS = Object.freeze([3, 4, 4]);

export function getStreetShowdownDriverRatings(options = {}) {
  const profile = String(options.playerDifficulty || 'STANDARD').toUpperCase();
  const coupon = options.prizeType === 'COUPON' || options.prizeType === 'CAR';

  if (coupon) {
    return profile === 'EASY' ? [3, 3, 4]
      : profile === 'HARD' ? [4, 4, 5]
      : [...COUPON_DRIVER_RATINGS];
  }

  // New offers pass baseCashPrize; saved R454-era sessions have prizeCash
  // including up to three rolling-start bonuses, so wider legacy boundaries
  // ensure that a ¥20k event remains in the entry tier on resume.
  const prize = Math.max(0, Number(options.baseCashPrize || options.prizeCash || 20000));
  const band = prize <= (options.baseCashPrize ? 20000 : 27000) ? 'ENTRY'
    : prize <= (options.baseCashPrize ? 32000 : 43000) ? 'LOCAL'
    : prize <= (options.baseCashPrize ? 48000 : 63500) ? 'HIGH'
    : 'TOP';
  const base = CASH_DRIVER_RATINGS[band];
  if (profile === 'EASY') return base.map(rating => Math.max(1, rating - 1));
  if (profile === 'HARD') {
    // Even Hard's smallest cash event must not exceed SKILLED.
    return band === 'ENTRY' ? [2, 3, 3]
      : base.map(rating => Math.min(5, rating + 1));
  }
  return [...base];
}

function emptyState(archetype, maxLevel) {
  return {
    stock: false, nosInstalled: false, buildArchetype: archetype,
    buildRating: Math.min(5, maxLevel + 2), tuneLevel: 0,
    acquiredVia: 'streetShowdown', specialistTuning: [],
    tuning: { engine: 0, intake: 0, ecu: 0, turbo: 0, intercooler: 0 },
    drivetrainTuning: { clutch: 0, gearbox: 0, differential: 0, suspension: 0 },
    chassisTuning: { tyres: 0, weightReduction: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 0, muffler: 0, nosKit: 0, nitrousShot: 0 },
  };
}

function availableLevels(tier, wins) {
  const workshop = WORKSHOP_TIERS[tier]?.id || WORKSHOP_TIERS[0].id;
  return Object.fromEntries(Object.entries(PARTS).map(([id, [category, part]]) => {
    let level = 0;
    for (let next = 1; next <= ERA[tier].maxLevel; next += 1) {
      if (!canInstallTuningLevel(category, part, next, workshop, wins)) break;
      level = next;
    }
    return [id, level];
  }));
}

function generateBuild(carId, archetype, points, eligible, maxLevel) {
  const state = emptyState(archetype, maxLevel);
  const source = RIVAL_BUILD_ARCHETYPES[archetype]?.priority || [];
  const order = [...new Set([...source, ...Object.keys(PARTS)])]
    .filter(id => eligible[id] > 0);
  let remaining = Math.max(0, Math.floor(points));
  let cursor = 0;

  while (remaining > 0 && order.length) {
    const id = order[cursor % order.length];
    const [category, part, group] = PARTS[id];
    const current = Number(state[group][part] || 0);
    if (current < eligible[id]) {
      // A nitrous power upgrade needs a bottle, and bottle capacity is
      // useful only if there is at least one installed power shot.
      if (id === 'exhaust.nitrousShot' && !state.exhaustNosTuning.nosKit) {
        cursor += 1;
        if (cursor > order.length * 4) break;
        continue;
      }
      state[group][part] = current + 1;
      remaining -= 1;
    }
    cursor += 1;
    if (cursor > 2000) break;
    if (order.every(key => {
      const [, partName, groupName] = PARTS[key];
      return Number(state[groupName][partName] || 0) >= eligible[key];
    })) break;
  }
  state.nosInstalled = Boolean(state.exhaustNosTuning.nosKit > 0 && state.exhaustNosTuning.nitrousShot > 0);
  state.showdownTuningPoints = Object.values(state.tuning).concat(
    Object.values(state.drivetrainTuning),
    Object.values(state.chassisTuning),
    Object.values(state.exhaustNosTuning)
  ).reduce((sum, level) => sum + Number(level || 0), 0);
  return state;
}

/**
 * Match a three-race Street Showdown to the player's actual performance while
 * obeying the workshop AND career-win upgrade gates. Never scale a rival's
 * physics or quietly grant inaccessible tuning to manufacture an equal race.
 */
export function createStreetShowdownRounds(options = {}) {
  const tier = Math.max(0, Math.min(2, Math.floor(Number(options.garageTier || 0))));
  const era = ERA[tier];
  const eligible = availableLevels(tier, Math.max(0, Number(options.wins || 0)));
  const playerCarId = options.playerCarId;
  const playerState = options.playerState || {};
  const seed = String(options.seed || 'showdown');
  const profile = String(options.playerDifficulty || 'STANDARD').toUpperCase();
  const driverRatings = getStreetShowdownDriverRatings(options);
  const couponEvent = options.prizeType === 'COUPON' || options.prizeType === 'CAR';
  const baselineTargets = profile === 'EASY'
    ? [0.85, 0.91, 0.96]
    : profile === 'HARD'
      ? [0.95, 1.00, 1.035]
      : [0.90, 0.955, 1.005];
  // With five/seven coupons needed per redemption, soften coupon events
  // slightly while retaining more challenge than low-value cash events.
  const targets = couponEvent
    ? baselineTargets.map(value => value - (profile === 'HARD' ? 0.015 : 0.025))
    : baselineTargets;
  const usedCars = new Set();
  const rounds = [];

  for (let roundIndex = 0; roundIndex < 3; roundIndex += 1) {
    const raceType = options.raceTypes?.[roundIndex] || 'Standing Start';
    const player = getVehiclePerformance(playerCarId, playerState, { raceType });
    if (!player) return [];
    const playerPI = Math.max(1, Number(player.index.selected || 1));
    const targetRatio = targets[roundIndex];
    const [low, high] = era.ranges[roundIndex];
    const candidates = [];

    for (const carId of carOrder) {
      const config = cars[carId];
      if (!config || config.collector || config.tuningLocked || config.crewLoan) continue;
      const archetype = chooseRivalBuildArchetype(config, driverRatings[roundIndex], {
        raceType, seed: [seed, roundIndex, carId].join(':'),
      });
      const stride = high >= 25 ? 3 : high >= 15 ? 2 : 1;
      const budgets = [...new Set([
        ...Array.from({ length: Math.floor((high - low) / stride) + 1 },
          (_, index) => low + index * stride),
        high,
      ])];
      for (const points of budgets) {
        const buildState = generateBuild(carId, archetype, points, eligible, era.maxLevel);
        const perf = getVehiclePerformance(carId, buildState, { raceType });
        if (!perf) continue;
        const ratio = Number(perf.index.selected || 1) / playerPI;
        const over = Math.max(0, ratio - Math.max(1.05, targetRatio + 0.045));
        const reused = usedCars.has(carId) ? 0.22 : 0;
        const score = Math.abs(ratio - targetRatio) + over * 4 + reused;
        candidates.push({ carId, buildState, ratio, score });
      }
    }

    if (!candidates.length) return [];
    candidates.sort((a, b) => a.score - b.score);
    const best = candidates[0];
    usedCars.add(best.carId);
    rounds.push({
      carId: best.carId,
      opponentBuildState: best.buildState,
      opponentBuildRating: best.buildState.buildRating,
      opponentBuildArchetype: best.buildState.buildArchetype,
      encounterRating: driverRatings[roundIndex],
      raceType,
      performanceRatio: best.ratio,
      showdownEra: era.name,
      showdownMaxLevel: era.maxLevel,
      showdownTuningPoints: best.buildState.showdownTuningPoints,
    });
  }

  return rounds;
}
