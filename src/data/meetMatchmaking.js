import { cars, carOrder } from './cars.js?v=20260928-r232';
import { PROGRESSION_BALANCE } from './progressionBalance.js?v=20260928-r234';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20260928-r234';

function weightedChoice(entries, random = Math.random) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight || 0)), 0);
  if (total <= 0) return entries[0]?.value ?? null;
  let cursor = random() * total;
  for (const entry of entries) {
    cursor -= Math.max(0, Number(entry.weight || 0));
    if (cursor <= 0) return entry.value;
  }
  return entries[entries.length - 1]?.value ?? null;
}

export function rollMeetDriverRating(random = Math.random) {
  return Number(weightedChoice(
    PROGRESSION_BALANCE.meetMatchmaking.driverRatings.map(item => ({ value: item.rating, weight: item.weight })),
    random
  ) || 3);
}

export function rollMeetPerformanceBand(random = Math.random) {
  const bands = PROGRESSION_BALANCE.meetMatchmaking.performanceBands;
  return weightedChoice(
    Object.entries(bands).map(([key, value]) => ({ value: key, weight: value.weight })),
    random
  ) || 'comparable';
}

function candidateWeight(candidate, context) {
  const cfg = PROGRESSION_BALANCE.meetMatchmaking;
  const preferred = new Set(context.preferredCars || []);
  const owned = new Set(context.ownedCarIds || []);
  const used = new Set(context.usedCarIds || []);
  const band = cfg.performanceBands[context.bandId] || cfg.performanceBands.comparable;

  let weight = 1;
  if (preferred.has(candidate.carId)) weight *= cfg.preferredRegionalModelWeight;
  if (!owned.has(candidate.carId)) weight *= cfg.unownedCarWeight;
  if (candidate.carId === context.playerCarId) weight *= cfg.sameModelWeight;
  if (used.has(candidate.carId)) weight *= 0.10;

  const distance = Math.abs(candidate.ratio - Number(band.targetRatio || 1));
  weight *= 1 / (0.055 + distance);
  return weight;
}

function chooseWildcard(candidates, random) {
  const cfg = PROGRESSION_BALANCE.meetMatchmaking;
  const stronger = candidates.filter(candidate => candidate.ratio >= cfg.performanceBands.stronger.maxRatio);
  const weaker = candidates.filter(candidate => candidate.ratio <= cfg.performanceBands.weaker.minRatio);
  const wantStrong = random() < cfg.wildcardStrongBias;
  if (wantStrong && stronger.length) return stronger;
  if (!wantStrong && weaker.length) return weaker;
  return stronger.length ? stronger : weaker.length ? weaker : candidates;
}

export function createMeetOpponentMatch(options = {}) {
  const random = options.random || Math.random;
  const cfg = PROGRESSION_BALANCE.meetMatchmaking;
  const playerPerformance = getVehiclePerformance(
    options.playerCarId,
    options.playerState || {},
    { raceType: options.raceType }
  );
  if (!playerPerformance) return null;

  const playerIndex = Math.max(1, Number(playerPerformance.index.selected || playerPerformance.index.overall || 1));
  const bandId = options.bandId || rollMeetPerformanceBand(random);
  const band = cfg.performanceBands[bandId] || cfg.performanceBands.comparable;
  const candidates = [];

  for (const carId of carOrder) {
    const car = cars[carId];
    if (!car || car.collector || car.tuningLocked) continue;

    for (const buildRating of cfg.candidateBuildRatings) {
      const seed = [
        options.locationId || 'meet',
        options.slotIndex || 0,
        options.raceType || 'street',
        carId,
        buildRating,
      ].join(':');

      const buildState = createRivalBuildState(car, buildRating, {
        raceType: options.raceType,
        seed,
      });
      const performance = getVehiclePerformance(carId, buildState, { raceType: options.raceType });
      if (!performance) continue;
      const opponentIndex = Math.max(1, Number(performance.index.selected || performance.index.overall || 1));
      const ratio = opponentIndex / playerIndex;
      if (ratio < cfg.fallbackRatioFloor || ratio > cfg.fallbackRatioCeiling) continue;

      candidates.push({
        carId,
        buildRating,
        buildArchetype: buildState.buildArchetype,
        buildState,
        performance,
        ratio,
      });
    }
  }

  if (!candidates.length) return null;

  let pool = bandId === 'wildcard'
    ? chooseWildcard(candidates, random)
    : candidates.filter(candidate => candidate.ratio >= band.minRatio && candidate.ratio <= band.maxRatio);

  // Sparse edges (very slow or very fast builds) fall back to the closest
  // physically-generated option rather than inventing a hidden multiplier.
  if (!pool.length) {
    pool = [...candidates]
      .sort((a, b) => Math.abs(a.ratio - band.targetRatio) - Math.abs(b.ratio - band.targetRatio))
      .slice(0, Math.min(12, candidates.length));
  }

  const weighted = pool.map(candidate => ({
    value: candidate,
    weight: candidateWeight(candidate, {
      ...options,
      bandId,
    }),
  }));
  const chosen = weightedChoice(weighted, random) || pool[0];

  return {
    ...chosen,
    performanceBand: bandId,
    playerPerformanceIndex: playerIndex,
    opponentPerformanceIndex: chosen.performance.index.selected,
  };
}
