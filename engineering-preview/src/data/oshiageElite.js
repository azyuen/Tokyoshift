// Oshiage's two independent Elite street showdowns.
// Only the seven existing regional championships open this bonus venue.
import { cars } from './cars.js';
import { characters, rivalCharacterOrder } from './characters.js';
import { CREW_REGIONS } from './crewRoster.js';
import { WHEEL_CATALOG } from './wheels.js';
import { getEncounterAi } from './encounterProfiles.js';
import { createRivalBuildState } from './rivalBuilds.js';
import { selectMixedCarPaint } from './streetPaintPalettes.js';

export const OSHIAGE_ELITE_COOLDOWN_MS = 15 * 60 * 1000;
export const OSHIAGE_ELITE_VENUES = Object.freeze({
  underpass: Object.freeze({
    id: 'underpass', label: 'SKYTREE UNDERPASS', backgroundStem: 'oshiage_skytree01',
    entryFee: 50000, prizeCash: 150000, distanceM: 402.336, raceType: 'Standing Start', rounds: 3, couponCount: 2,
  }),
  plaza: Object.freeze({
    id: 'plaza', label: 'SKYTREE PLAZA', backgroundStem: 'oshiage_skytree02',
    entryFee: 75000, prizeCash: 250000, distanceM: 804.672, raceType: 'Standing Start', rounds: 3, couponCount: 3,
  }),
});
export const OSHIAGE_ELITE_VENUE_IDS = Object.freeze(Object.keys(OSHIAGE_ELITE_VENUES));
const STANDARD_ELITE_CARS = Object.freeze(['r34', 'r32', 'jza80', 'rx7fd', 'evo6', 'gc8', 'nsx', 's2000', 'evo5']);
const COUPON_CARS = Object.freeze(['r34', 'jza80', 'nsx', 'evo6', 'gc8', 'rx7fd', 'r32', 's2000']);
const value = (source, key, fallback = null) => {
  const found = source?.get ? source.get(key) : source?.[key];
  return found == null ? fallback : found;
};

// The Skytree series is an endgame challenge: rating-5 rival builds do not
// automatically guarantee Level 3 in every mechanical category. Upgrade the
// relevant mechanical parts explicitly without giving a factory-NA car an
// unrequested turbo conversion, or changing the shared rival physics model.
export function makeOshiageEliteStageThreeBuild(config = {}, buildState = {}) {
  const state = {
    ...buildState,
    tuning: { ...(buildState.tuning || {}) },
    drivetrainTuning: { ...(buildState.drivetrainTuning || {}) },
    chassisTuning: { ...(buildState.chassisTuning || {}) },
    exhaustNosTuning: { ...(buildState.exhaustNosTuning || {}) },
  };
  const raise = (category, names) => names.forEach(name => {
    state[category][name] = 3;
  });
  raise('tuning', ['engine', 'intake', 'ecu']);
  if (Number(config.maximumBoost || 0) > 0.01 ||
      Number(state.tuning.turbo || 0) > 0) {
    raise('tuning', ['turbo', 'intercooler']);
  }
  raise('drivetrainTuning', ['clutch', 'gearbox', 'differential', 'suspension']);
  raise('chassisTuning', ['tyres', 'weightReduction']);
  raise('exhaustNosTuning', ['headers', 'exhaust', 'muffler']);
  // NOS is still archetype-dependent, just as for other Expert/Elite rivals.
  return state;
}

export function getOshiageEliteProgress(source) {
  const state = value(source, 'tunerTeamChallenges', {}) || {};
  const completed = CREW_REGIONS.filter(region => Boolean(
    state[region]?.championEarned || state[region]?.completed
  ));
  return { count: completed.length, required: CREW_REGIONS.length, complete:
    completed.length === CREW_REGIONS.length || Boolean(value(source, 'devMode', false)) };
}

export function getOshiageEliteCooldownUntil(source, venueId) {
  if (!OSHIAGE_ELITE_VENUES[venueId]) return 0;
  const raw = value(source, 'oshiageEliteCooldowns', {}) || {};
  const stamp = Number(raw[venueId] || 0);
  return Number.isFinite(stamp) ? Math.max(0, stamp) : 0;
}

export function getOshiageEliteRemainingMs(source, venueId, now = Date.now()) {
  return Math.max(0, getOshiageEliteCooldownUntil(source, venueId) - now);
}

export function eligibleOshiageEliteDrivers(source) {
  const recruited = new Set(Object.values(value(source, 'crewMembers', {}) || {})
    .map(item => String(item?.characterId || '')));
  const player = String(value(source, 'playerCharacterId', '') || '');
  return rivalCharacterOrder.filter(id => Boolean(characters[id]) &&
    id !== player && !recruited.has(id) &&
    characters[id].rivalEligible !== false && !characters[id].crewLoan);
}

export function getOshiageEliteOpponent(source, venueId, now = Date.now(), roundIndex = 0, excludedIds = []) {
  const venue = OSHIAGE_ELITE_VENUES[venueId];
  if (!venue) return null;
  const drivers = eligibleOshiageEliteDrivers(source);
  if (!drivers.length) return null;
  const wins = Math.max(0, Number(value(source, 'wins', 0) || 0));
  const period = Math.floor(now / OSHIAGE_ELITE_COOLDOWN_MS);
  const shift = (venueId === 'plaza' ? 17 : 0) + Math.max(0, Number(roundIndex) || 0) * 7;
  const index = ((Math.imul(period + wins + shift, 31) >>> 0) % drivers.length);
  const excluded = new Set(excludedIds);
  const characterId = Array.from({ length: drivers.length }, (_, offset) =>
    drivers[(index + offset) % drivers.length]
  ).find(id => !excluded.has(id));
  if (!characterId) return null;
  const character = characters[characterId];
  const preferred = (character.preferredCars || []).filter(carId => Boolean(cars[carId]) &&
    !cars[carId]?.tuningLocked && !cars[carId]?.collector);
  const fallback = STANDARD_ELITE_CARS.filter(carId => Boolean(cars[carId]));
  const pool = preferred.length ? preferred : fallback;
  if (!pool.length) return null;
  const carId = pool[(index + wins + Math.max(0, Number(roundIndex) || 0)) % pool.length];
  const paintColor = selectMixedCarPaint(carId, {
    region: 'OSHIAGE', characterId, isMainRival: Boolean(character.mainRival),
    seed: venueId + ':' + period + ':' + wins + ':' + roundIndex,
  })?.color ?? [0xd83f56, 0x4d83e5, 0xc3d1dc, 0xf7c459][index % 4];
  const buildState = makeOshiageEliteStageThreeBuild(cars[carId],
    createRivalBuildState(cars[carId], 5, {
      seed: 'oshiage:' + venueId + ':' + characterId + ':' + period + ':' + roundIndex,
      raceType: venue.raceType, paintColor,
    }));
  return {
    venueId, characterId, carId, paintColor, buildState,
    encounterRating: 5, encounterAi: getEncounterAi(5),
    difficulty: 'ELITE', raceType: venue.raceType, distanceM: venue.distanceM,
  };
}

// The complete three-person roster is fixed when the player enters the
// showdown. Wins gained during heat one/two must not regenerate heat three.
export function getOshiageEliteLineup(source, venueId, at = Date.now(), startingWins = null) {
  if (!OSHIAGE_ELITE_VENUES[venueId]) return [];
  const winsSnapshot = startingWins == null
    ? Number(value(source, 'wins', 0) || 0) : Number(startingWins || 0);
  const snapshot = {
    get(key) { return key === 'wins' ? winsSnapshot : value(source, key); },
  };
  const roster = [];
  for (let i = 0; i < 3; i++) {
    const driver = getOshiageEliteOpponent(
      snapshot, venueId, at, i, roster.map(item => item.characterId)
    );
    if (!driver) return [];
    roster.push(driver);
  }
  return roster;
}

export function getOshiageElitePrize(source, venueId, index = 0) {
  const venue = OSHIAGE_ELITE_VENUES[venueId];
  if (!venue) return null;
  const ownedWheels = value(source, 'ownedWheelIds', []) || [];
  const heroWheels = WHEEL_CATALOG.filter(item => item.tier === 'HERO' || item.tier === 'TUNER');
  const availableWheels = heroWheels.filter(item => !ownedWheels.includes(item.id));
  const availableCars = COUPON_CARS.filter(id => Boolean(cars[id]));
  const carId = availableCars[index % availableCars.length] || 'r32';
  // Every successful three-heat run grants car coupons. Plaza can also award
  // rare wheels, but the wheels must never replace the minimum coupon payout.
  if (venueId === 'plaza' && availableWheels.length) {
    const wheel = availableWheels[index % availableWheels.length];
    return { cash: venue.prizeCash, wheelId: wheel.id, wheelLabel: wheel.label,
      couponCarId: carId, coupons: 2 };
  }
  return { cash: venue.prizeCash, couponCarId: carId, coupons: venue.couponCount,
    wheelId: null, wheelLabel: null };
}
