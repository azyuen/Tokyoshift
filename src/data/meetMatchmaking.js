import { cars, carOrder } from './cars.js?v=20261005-r345';
import { getBaseCarId } from './carOwnership.js?v=20261006-r376';
import { PROGRESSION_BALANCE } from './progressionBalance.js?v=20260929-r271';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261004-r325';
import { applyDifficultyToMeetBands } from './playerDifficulty.js?v=20260929-r271';

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

function getDifficultyVehicleProfile(difficulty = 'MED') {
  const profiles = PROGRESSION_BALANCE.meetMatchmaking.difficultyVehicleProfiles || {};
  const key = String(difficulty || 'MED').toUpperCase();
  return profiles[key] || profiles.MED || null;
}

function getAllowedBuildRatings(difficulty = 'MED', bandId = 'comparable') {
  const profile = getDifficultyVehicleProfile(difficulty);
  const configured = bandId === 'wildcard'
    ? profile?.wildcardBuildRatings
    : profile?.normalBuildRatings;
  const fallback = PROGRESSION_BALANCE.meetMatchmaking.candidateBuildRatings || [1, 2, 3, 4, 5];
  const source = Array.isArray(configured) && configured.length ? configured : fallback;

  return [...new Set(source
    .map(value => Math.max(1, Math.min(5, Math.round(Number(value) || 1))))
  )].sort((a, b) => a - b);
}

function getPerformanceBands(
  raceType = 'Standing Start',
  difficulty = 'MED',
  playerDifficulty = 'STANDARD'
) {
  const configured = PROGRESSION_BALANCE.meetMatchmaking.performanceBands || {};
  const rolling = String(raceType || '').toLowerCase().includes('roll');
  const selected = rolling ? configured.rolling : configured.standing;
  const base = selected || configured.standing || configured;
  const profile = getDifficultyVehicleProfile(difficulty);
  const weights = profile?.bandWeights || {};
  const comparableTarget = rolling
    ? Number(profile?.rollingComparableTarget)
    : Number(profile?.standingComparableTarget);

  const regionalBands = Object.fromEntries(
    Object.entries(base).map(([key, value]) => [
      key,
      {
        ...value,
        weight: Number.isFinite(Number(weights[key])) ? Number(weights[key]) : value.weight,
        targetRatio: key === 'comparable' && Number.isFinite(comparableTarget)
          ? comparableTarget
          : value.targetRatio,
      },
    ])
  );

  return applyDifficultyToMeetBands(
    regionalBands,
    playerDifficulty,
    { rollingStart: rolling }
  );
}

export function rollMeetPerformanceBand(
  random = Math.random,
  raceType = 'Standing Start',
  difficulty = 'MED',
  playerDifficulty = 'STANDARD'
) {
  const bands = getPerformanceBands(raceType, difficulty, playerDifficulty);
  return weightedChoice(
    Object.entries(bands).map(([key, value]) => ({ value: key, weight: value.weight })),
    random
  ) || 'comparable';
}

function candidateWeight(candidate, context) {
  const cfg = PROGRESSION_BALANCE.meetMatchmaking;
  const preferred = new Set((context.preferredCars || []).map(getBaseCarId));
  const owned = new Set((context.ownedCarIds || []).map(getBaseCarId));
  const used = new Set((context.usedCarIds || []).map(getBaseCarId));
  const playerCarId = getBaseCarId(context.playerCarId);
  const bands = context.performanceBands || getPerformanceBands(
    context.raceType,
    context.difficulty,
    context.playerDifficulty
  );
  const band = bands[context.bandId] || bands.comparable;

  let weight = 1;
  if (preferred.has(candidate.carId)) weight *= cfg.preferredRegionalModelWeight;
  if (!owned.has(candidate.carId)) weight *= cfg.unownedCarWeight;
  if (candidate.carId === playerCarId) weight *= cfg.sameModelWeight;
  if (used.has(candidate.carId)) weight *= 0.10;

  const distance = Math.abs(candidate.ratio - Number(band.targetRatio || 1));
  weight *= 1 / (0.055 + distance);
  return weight;
}

function chooseWildcard(candidates, random, bands) {
  const cfg = PROGRESSION_BALANCE.meetMatchmaking;
  const stronger = candidates.filter(candidate => candidate.ratio >= bands.stronger.maxRatio);
  const weaker = candidates.filter(candidate => candidate.ratio <= bands.weaker.minRatio);
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
  const performanceBands = getPerformanceBands(
    options.raceType,
    options.difficulty,
    options.playerDifficulty
  );
  const bandId = options.bandId || rollMeetPerformanceBand(
    random,
    options.raceType,
    options.difficulty,
    options.playerDifficulty
  );
  const band = performanceBands[bandId] || performanceBands.comparable;
  const allowedBuildRatings = getAllowedBuildRatings(options.difficulty, bandId);
  const candidates = [];

  for (const carId of carOrder) {
    const car = cars[carId];
    if (!car || car.collector || car.tuningLocked) continue;

    for (const buildRating of allowedBuildRatings) {
      const seed = [
        options.locationId || 'meet',
        options.refreshSeed || '',
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

  const boundedCandidates = candidates.filter(candidate =>
    candidate.ratio >= cfg.fallbackRatioFloor && candidate.ratio <= cfg.fallbackRatioCeiling
  );
  const availableCandidates = boundedCandidates.length ? boundedCandidates : candidates;

  let pool = bandId === 'wildcard'
    ? chooseWildcard(availableCandidates, random, performanceBands)
    : availableCandidates.filter(candidate => candidate.ratio >= band.minRatio && candidate.ratio <= band.maxRatio);

  // Sparse edges (very slow or very fast player builds) fall back to the
  // closest opponent that ACTUALLY belongs in this difficulty's build pool.
  // Never escape the local build ceiling just to manufacture an equal race.
  if (!pool.length) {
    pool = [...availableCandidates]
      .sort((a, b) => Math.abs(a.ratio - band.targetRatio) - Math.abs(b.ratio - band.targetRatio))
      .slice(0, Math.min(12, availableCandidates.length));
  }

  const weighted = pool.map(candidate => ({
    value: candidate,
    weight: candidateWeight(candidate, {
      ...options,
      bandId,
      performanceBands,
    }),
  }));
  const chosen = weightedChoice(weighted, random) || pool[0];

  return {
    ...chosen,
    performanceBand: bandId,
    playerPerformanceIndex: playerIndex,
    opponentPerformanceIndex: chosen.performance.index.selected,
    allowedBuildRatings,
    buildCeiling: Math.max(...allowedBuildRatings),
  };
}
