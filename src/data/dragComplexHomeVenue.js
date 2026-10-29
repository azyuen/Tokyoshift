// Central Tokyo Drag Complex HOME crowd follows the individual player's
// Pro DRIVER ranking alone. Event choices and trophy prestige must never
// reload the venue or change its attendance tier.
// Trophy/major-event atmosphere belongs to the separate post-entry cutscene.
import {
  getProCircuitDriverSeeds,
} from './proCircuit.js?v=20261029-r714';

export const DRAG_COMPLEX_HOME_CROWDS = Object.freeze(['empty', 'half', 'full']);

export function getDragComplexHomeCrowdTier({ circuit = null } = {}) {
  const driverRank = getProCircuitDriverSeeds(circuit)
    .find(row => row.id === 'player:driver')?.seed ?? 32;

  // Subtle progression based only on persistent individual rank.
  // #1–5: full; #6–12: half; #13+: empty.
  return driverRank <= 5 ? 'full' : driverRank <= 12 ? 'half' : 'empty';
}

export function resolveDragComplexHomeBackground({
  phase = 'night', circuit = null,
} = {}) {
  const time = String(phase).toLowerCase() === 'day' ? 'day' : 'night';
  const crowdTier = getDragComplexHomeCrowdTier({ circuit });
  const capitalise = value => value.charAt(0).toUpperCase() + value.slice(1);
  return {
    key: `centralTokyoDrag${capitalise(crowdTier)}${capitalise(time)}Bg`,
    path: `assets/CentralTokyo/dragcomplex/dragstrip_${crowdTier}_${time}.png`,
    crowdTier,
  };
}
