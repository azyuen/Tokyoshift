// Oshiage follows the normal three-heat Street Showdown lifecycle: pay one
// entry fee, keep one car, race all three opponents without returning to the
// venue selection screen between heats, then receive the grand prize.
import { cars } from './cars.js?v=20261011-r479';
import { getBaseCarId } from './carOwnership.js?v=20261011-r479';
import {
  OSHIAGE_ELITE_VENUES, OSHIAGE_ELITE_COOLDOWN_MS,
  getOshiageEliteProgress, getOshiageEliteRemainingMs,
  getOshiageEliteLineup,
} from './oshiageElite.js?v=20261015-r521';

const read = (source, key, fallback = null) =>
  (source?.get ? source.get(key) : source?.[key]) ?? fallback;

export function getOshiageShowdownLineup(source, venueId, now = Date.now()) {
  const series = read(source, 'oshiageEliteSeries');
  if (series?.active && series.venueId === venueId &&
      Array.isArray(series.lineup) && series.lineup.length === 3) {
    return series.lineup;
  }
  return getOshiageEliteLineup(source, venueId, now);
}

export function getOshiageShowdownAccess(source, venueId, now = Date.now()) {
  const venue = OSHIAGE_ELITE_VENUES[venueId];
  if (!venue) return { allowed: false, reason: 'UNKNOWN VENUE' };
  const series = read(source, 'oshiageEliteSeries');
  if (series?.active) return {
    allowed: false, reason: 'SHOWDOWN ALREADY IN PROGRESS',
  };
  if (!getOshiageEliteProgress(source).complete) return {
    allowed: false, reason: 'COMPLETE ALL SEVEN REGIONAL CHAMPIONSHIPS',
  };
  const cooldown = getOshiageEliteRemainingMs(source, venueId, now);
  if (cooldown > 0) return { allowed: false, reason: '15-MINUTE COOLDOWN', cooldown };
  const id = String(read(source, 'selectedCarId', '') || '');
  const car = cars[id] || cars[getBaseCarId(id)];
  if (!car || !((read(source, 'ownedCarIds', []) || []).includes(id)) || car.crewLoan)
    return { allowed: false, reason: 'SELECT YOUR OWN CAR' };
  if (Number(read(source, 'cash', 0) || 0) < venue.entryFee)
    return { allowed: false, reason: 'NOT ENOUGH CASH FOR ENTRY' };
  return { allowed: true, entryFee: venue.entryFee, carId: id };
}

export function applyOshiageShowdownHeat(registry, series) {
  if (!series?.active || !OSHIAGE_ELITE_VENUES[series.venueId]) return false;
  const round = Math.max(0, Math.min(2, Number(series.roundIndex || 0)));
  const opponent = series.lineup?.[round];
  const venue = OSHIAGE_ELITE_VENUES[series.venueId];
  if (!opponent || !cars[opponent.carId] || !cars[series.playerCarId]) return false;
  if (!(registry.get('ownedCarIds') || []).includes(series.playerCarId)) return false;
  registry.set('oshiageEliteVenue', series.venueId);
  registry.set('oshiageLocation', 'oshiageSkytreeMeet');
  registry.set('district', 'OSHIAGE');
  registry.set('selectedCarId', series.playerCarId);
  registry.set('selectedOpponentCarId', opponent.carId);
  registry.set('selectedOpponentPaintColor', opponent.paintColor);
  registry.set('selectedOpponentCharacterId', opponent.characterId);
  registry.set('selectedOpponentEncounterRating', opponent.encounterRating || 5);
  registry.set('selectedOpponentEncounterAi', opponent.encounterAi);
  registry.set('selectedOpponentDifficulty', 'ELITE');
  registry.set('selectedOpponentBuildRating', 5);
  registry.set('selectedOpponentBuildArchetype', opponent.buildState?.buildArchetype);
  registry.set('selectedOpponentBuildState', opponent.buildState);
  registry.set('selectedRaceCategory', 'OSHIAGE_ELITE');
  registry.set('selectedRaceType', opponent.raceType || venue.raceType);
  registry.set('selectedRaceDistanceM', opponent.distanceM || venue.distanceM);
  registry.set('selectedRaceDeal', 'OSHIAGE_ELITE');
  registry.set('selectedRaceStake', 0);
  registry.set('selectedRaceSpecialChallenge', false);
  registry.set('selectedRaceMeetOffer', null);
  registry.set('raceReturnScene', 'OshiageScene');
  registry.set('raceTimeOfDay', read(registry, 'worldPhase', 'day'));
  registry.set('raceDistrict', 'OSHIAGE');
  registry.set('raceLocationLabel', venue.label + ' // HEAT ' + (round + 1) + ' OF 3');
  return true;
}

export function beginOshiageShowdown(registry, venueId, now = Date.now()) {
  const access = getOshiageShowdownAccess(registry, venueId, now);
  if (!access.allowed) return { ok: false, reason: access.reason };
  const lineup = getOshiageEliteLineup(registry, venueId, now);
  if (lineup.length !== 3) return { ok: false, reason: 'NO ELITE DRIVERS AVAILABLE' };
  const venue = OSHIAGE_ELITE_VENUES[venueId];
  const series = {
    active: true,
    venueId,
    roundIndex: 0,
    playerCarId: access.carId,
    startedAt: now,
    startingWins: Number(read(registry, 'wins', 0) || 0),
    entryFee: venue.entryFee,
    lineup,
  };
  const cashBefore = Number(registry.get('cash') || 0);
  const cooldownBefore = registry.get('oshiageEliteCooldowns') || {};
  const oldSeries = registry.get('oshiageEliteSeries');
  // Build the complete next-race selection BEFORE charging for the attempt.
  if (!applyOshiageShowdownHeat(registry, series)) return {
    ok: false, reason: 'CAR UNAVAILABLE',
  };
  registry.set('cash', cashBefore - venue.entryFee);
  registry.set('oshiageEliteSeries', series);
  registry.set('oshiageEliteCooldowns', {
    ...cooldownBefore, [venueId]: now + OSHIAGE_ELITE_COOLDOWN_MS,
  });
  return { ok: true, series, charged: venue.entryFee };
}

export function prepareNextOshiageShowdownHeat(registry) {
  const series = registry.get('oshiageEliteSeries');
  if (!series?.active || ![1, 2].includes(Number(series.roundIndex))) return false;
  return applyOshiageShowdownHeat(registry, series);
}
