// One shared pink-slip lottery per completed race across requests, incoming
// challenges and meet refreshes. Random requests/refreshes add zero tickets.
import { getBaseCarId } from './carOwnership.js?v=20261006-r388';
import { MARKET_BASE_PRICES } from './centralTokyo.js?v=20261006-r388';

export const PINK_SLIP_VALUE_RATIO_LIMIT = 2;
export const PINK_SLIP_MEDIAN_RACES = Object.freeze({ EASY: 25, STANDARD: 30, HARD: 35 });
const LN_2 = Math.log(2);
function read(source, key, fallback = null) {
  const value = typeof source?.get === 'function' ? source.get(key) : source?.[key];
  return value == null ? fallback : value;
}
export function getCompletedRaces(source) {
  return Math.max(0, Number(read(source, 'wins', 0) || 0)) +
    Math.max(0, Number(read(source, 'losses', 0) || 0));
}
export function getPinkSlipMedianRaces(source) {
  const difficulty = String(read(source, 'playerDifficulty', 'STANDARD') || 'STANDARD').toUpperCase();
  return PINK_SLIP_MEDIAN_RACES[difficulty] || PINK_SLIP_MEDIAN_RACES.STANDARD;
}
export function getPinkSlipOpportunityChance(source) {
  const lastWinRace = Math.max(0, Number(read(source, 'pinkSlipLastWinRace', 0) || 0));
  const racesSinceWin = Math.max(1, getCompletedRaces(source) - lastWinRace);
  const median = getPinkSlipMedianRaces(source);
  // Discrete Weibull hazard. One eligible draw per completed race yields
  // 50% cumulative opportunity probability by exactly 'median' races.
  return -Math.expm1(-LN_2 * (2 * racesSinceWin - 1) / (median * median));
}
export function isPinkSlipValueEligible(playerCarId, rivalCarId) {
  const playerValue = Number(MARKET_BASE_PRICES[getBaseCarId(playerCarId)] || 0);
  const rivalValue = Number(MARKET_BASE_PRICES[getBaseCarId(rivalCarId)] || 0);
  return playerValue > 0 && rivalValue > 0 &&
    rivalValue <= playerValue * PINK_SLIP_VALUE_RATIO_LIMIT;
}
export function rollPinkSlipOpportunity(registry, random = Math.random) {
  const raceCount = getCompletedRaces(registry);
  if (Number(read(registry, 'pinkSlipOpportunityRace', -1)) === raceCount) {
    return Boolean(read(registry, 'pinkSlipOpportunityGranted', false)) &&
      !Boolean(read(registry, 'pinkSlipOpportunityUsed', false));
  }
  const granted = random() < getPinkSlipOpportunityChance(registry);
  registry.set('pinkSlipOpportunityRace', raceCount);
  registry.set('pinkSlipOpportunityGranted', granted);
  registry.set('pinkSlipOpportunityUsed', false);
  return granted;
}
export function consumePinkSlipOpportunity(registry) {
  if (Number(read(registry, 'pinkSlipOpportunityRace', -1)) !== getCompletedRaces(registry) ||
      !read(registry, 'pinkSlipOpportunityGranted', false) ||
      read(registry, 'pinkSlipOpportunityUsed', false)) return false;
  registry.set('pinkSlipOpportunityUsed', true);
  return true;
}
export function recordPinkSlipVictory(registry) {
  const raceCount = getCompletedRaces(registry);
  registry.set('pinkSlipLastWinRace', raceCount);
  registry.set('pinkSlipOpportunityRace', raceCount);
  registry.set('pinkSlipOpportunityGranted', false);
  registry.set('pinkSlipOpportunityUsed', true);
  registry.set('specialChallenger', null);
  registry.set('challengerMisses', 0);
  registry.set('challengerCooldown', 0);
}
