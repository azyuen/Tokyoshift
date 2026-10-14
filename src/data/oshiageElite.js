// Oshiage's two independent Elite street showdowns.
// Only the seven existing regional championships open this bonus venue.
import { cars } from './cars.js?v=20261011-r479';
import { characters, rivalCharacterOrder } from './characters.js?v=20261013-r494';
import { CREW_REGIONS } from './crewRoster.js?v=20261009-r457';
import { WHEEL_CATALOG } from './wheels.js?v=20260929-r246';
import { getEncounterAi } from './encounterProfiles.js?v=20261005-r334';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';

export const OSHIAGE_ELITE_COOLDOWN_MS = 15 * 60 * 1000;
export const OSHIAGE_ELITE_VENUES = Object.freeze({
  underpass: Object.freeze({
    id: 'underpass', label: 'SKYTREE UNDERPASS', backgroundStem: 'oshiage_skytree01',
    prizeCash: 500000, distanceM: 402.336, raceType: 'Standing Start', rounds: 3, couponCount: 2,
  }),
  plaza: Object.freeze({
    id: 'plaza', label: 'SKYTREE PLAZA', backgroundStem: 'oshiage_skytree02',
    prizeCash: 750000, distanceM: 804.672, raceType: 'Standing Start', rounds: 3, couponCount: 3,
  }),
});
export const OSHIAGE_ELITE_VENUE_IDS = Object.freeze(Object.keys(OSHIAGE_ELITE_VENUES));
const STANDARD_ELITE_CARS = Object.freeze(['r34', 'r32', 'jza80', 'rx7fd', 'evo6', 'gc8', 'nsx', 's2000', 'evo5']);
const COUPON_CARS = Object.freeze(['r34', 'jza80', 'nsx', 'evo6', 'gc8', 'rx7fd', 'r32', 's2000']);
const value = (source, key, fallback = null) => {
  const found = source?.get ? source.get(key) : source?.[key];
  return found == null ? fallback : found;
};

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

export function getOshiageEliteOpponent(source, venueId, now = Date.now(), roundIndex = 0) {
  const venue = OSHIAGE_ELITE_VENUES[venueId];
  if (!venue) return null;
  const drivers = eligibleOshiageEliteDrivers(source);
  if (!drivers.length) return null;
  const wins = Math.max(0, Number(value(source, 'wins', 0) || 0));
  const period = Math.floor(now / OSHIAGE_ELITE_COOLDOWN_MS);
  const shift = (venueId === 'plaza' ? 17 : 0) + Math.max(0, Number(roundIndex) || 0) * 7;
  const index = ((Math.imul(period + wins + shift, 31) >>> 0) % drivers.length);
  const characterId = drivers[index];
  const character = characters[characterId];
  const preferred = (character.preferredCars || []).filter(carId => Boolean(cars[carId]) &&
    !cars[carId]?.tuningLocked && !cars[carId]?.collector);
  const fallback = STANDARD_ELITE_CARS.filter(carId => Boolean(cars[carId]));
  const pool = preferred.length ? preferred : fallback;
  if (!pool.length) return null;
  const carId = pool[(index + wins + Math.max(0, Number(roundIndex) || 0)) % pool.length];
  const paintColor = [0xd83f56, 0x4d83e5, 0xc3d1dc, 0xf7c459][index % 4];
  const buildState = createRivalBuildState(cars[carId], 5, {
    seed: 'oshiage:' + venueId + ':' + characterId + ':' + period + ':' + roundIndex,
    raceType: venue.raceType, paintColor,
  });
  return {
    venueId, characterId, carId, paintColor, buildState,
    encounterRating: 5, encounterAi: getEncounterAi(5),
    difficulty: 'ELITE', raceType: venue.raceType, distanceM: venue.distanceM,
  };
}

export function getOshiageElitePrize(source, venueId, index = 0) {
  const venue = OSHIAGE_ELITE_VENUES[venueId];
  if (!venue) return null;
  const ownedWheels = value(source, 'ownedWheelIds', []) || [];
  const heroWheels = WHEEL_CATALOG.filter(item => item.tier === 'HERO' || item.tier === 'TUNER');
  const availableWheels = heroWheels.filter(item => !ownedWheels.includes(item.id));
  // Underpass favours coupon packs. Plaza favours new limited wheels, then
  // falls back to coupons so every win continues to have a meaningful prize.
  if (venueId === 'plaza' && availableWheels.length) {
    const wheel = availableWheels[index % availableWheels.length];
    return { cash: venue.prizeCash, wheelId: wheel.id, wheelLabel: wheel.label,
      couponCarId: null, coupons: 0 };
  }
  const availableCars = COUPON_CARS.filter(id => Boolean(cars[id]));
  const carId = availableCars[index % availableCars.length] || 'r32';
  return { cash: venue.prizeCash, couponCarId: carId, coupons: venue.couponCount,
    wheelId: null, wheelLabel: null };
}
