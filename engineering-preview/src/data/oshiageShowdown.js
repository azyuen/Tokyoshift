// Oshiage follows the normal three-heat Street Showdown lifecycle: pay one
// entry fee, keep one car, race all three opponents without returning to the
// venue selection screen between heats, then receive the grand prize.
import { cars } from './cars.js';
import { getBaseCarId } from './carOwnership.js';
import { isGinzaLoanActive } from './ginzaLoanAccess.js';
import {
  OSHIAGE_ELITE_VENUES, OSHIAGE_ELITE_COOLDOWN_MS,
  getOshiageEliteProgress, getOshiageEliteRemainingMs,
  getOshiageEliteLineup, eligibleOshiageEliteDrivers, getOshiageElitePrize,
} from './oshiageElite.js';

const read = (source, key, fallback = null) =>
  (source?.get ? source.get(key) : source?.[key]) ?? fallback;

export function getOshiageShowdownLineup(source, venueId, now = Date.now()) {
  const series = read(source, 'oshiageEliteSeries');
  if (series?.active && series.venueId === venueId &&
      Array.isArray(series.lineup) && series.lineup.length === 3) {
    return series.lineup;
  }
  const anchoredAt = series?.active && series.venueId === venueId
    ? Number(series.startedAt || now) : now;
  const startingWins = series?.active && series.venueId === venueId
    ? Number(series.startingWins ?? Math.max(0,
        Number(read(source, 'wins', 0) || 0) - Number(series.roundIndex || 0)))
    : null;
  return getOshiageEliteLineup(source, venueId, anchoredAt, startingWins);
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
  // The collector car is temporary, but explicitly entrusted for street
  // racing and Skytree showdowns. This bypass applies ONLY to the exact
  // active gallery loan, never to arbitrary unowned cars or crew loans.
  const isActiveGalleryLoan = isGinzaLoanActive(source) &&
    read(source, 'ginzaTestDrive')?.carId === id && car?.ginzaDemo;
  if (!car || car.crewLoan ||
      (!isActiveGalleryLoan && !((read(source, 'ownedCarIds', []) || []).includes(id))))
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
  const exactLoan = isGinzaLoanActive(registry) &&
    registry.get('ginzaTestDrive')?.carId === series.playerCarId &&
    cars[series.playerCarId]?.ginzaDemo;
  if (!exactLoan &&
      !(registry.get('ownedCarIds') || []).includes(series.playerCarId)) return false;
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

export function beginOshiageShowdown(registry, venueId, now = Date.now(), offeredLineup = null) {
  const access = getOshiageShowdownAccess(registry, venueId, now);
  if (!access.allowed) return { ok: false, reason: access.reason };
  const validDrivers = new Set(eligibleOshiageEliteDrivers(registry));
  const offered = Array.isArray(offeredLineup) && offeredLineup.length === 3 &&
    new Set(offeredLineup.map(driver => driver?.characterId)).size === 3 &&
    offeredLineup.every(driver =>
      driver?.characterId && driver?.carId && cars[driver.carId] &&
      validDrivers.has(driver.characterId));
  // The displayed roster is authoritative when the player enters. A fresh
  // fallback is safe for older saves or invalid/stale offers.
  const lineup = offered ? offeredLineup : getOshiageEliteLineup(registry, venueId, now);
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
    // Award exactly what the right panel promised at event entry. Gaining
    // career wins in heats 1/2 must not rotate a wheel/coupon award.
    prize: getOshiageElitePrize(registry, venueId,
      Number(read(registry, 'wins', 0) || 0) + 3),
    lineup,
  };
  const cashBefore = Number(registry.get('cash') || 0);
  const cooldownBefore = registry.get('oshiageEliteCooldowns') || {};
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
  const stableSeries = Array.isArray(series.lineup) && series.lineup.length === 3
    ? series
    : { ...series, lineup: getOshiageShowdownLineup(registry, series.venueId) };
  if (stableSeries.lineup.length !== 3) return false;
  registry.set('oshiageEliteSeries', stableSeries);
  return applyOshiageShowdownHeat(registry, stableSeries);
}
