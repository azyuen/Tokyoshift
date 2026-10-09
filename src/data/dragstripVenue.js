// Tokyo SHIFT professional race-venue art selection.
// All sets use the same art layout and world-space placement: five image
// components × three spectator capacities × two shared Tokyo clock phases.
//
// Keep event/attendance logic here, separate from Phaser. Phase 3 can supply
// crowdTier from season attendance, event prestige or driver ranking without
// editing the car/track renderer or renaming images.
export const DRAGSTRIP_CROWD_TIERS = Object.freeze(['low', 'half', 'full']);
export const DRAGSTRIP_PHASES = Object.freeze(['day', 'night']);
export const DRAGSTRIP_COMPONENTS = Object.freeze([
  'complex', 'frontcrowd', 'standleft', 'standmid', 'standright',
]);

export const DRAGSTRIP_EVENT_CROWDS = Object.freeze({
  streetShootout: 'low',
  midnightCup: 'half',
  tokyoInvitational: 'half', // legacy saved cup: no longer in the three public slots
  fourWideOpen: 'full',
});

export function getDragstripCrowdTier(eventId, crowdOverride = null) {
  if (DRAGSTRIP_CROWD_TIERS.includes(crowdOverride)) return crowdOverride;
  return DRAGSTRIP_EVENT_CROWDS[String(eventId || '')] || 'low';
}

export function resolveDragstripVenue({
  eventId = null,
  phase = 'night',
  crowdTier = null,
} = {}) {
  const time = String(phase).toLowerCase() === 'day' ? 'day' : 'night';
  const crowd = getDragstripCrowdTier(eventId, crowdTier);
  const prefix = 'assets/CentralTokyo/dragstrip/';
  const sprites = Object.fromEntries(DRAGSTRIP_COMPONENTS.map(component => [
    component,
    {
      key: `dragstrip_${crowd}_${component}_${time}`,
      path: `${prefix}${crowd}_${component}_${time}.png`,
    },
  ]));
  return {
    eventId: String(eventId || ''),
    phase: time,
    crowdTier: crowd,
    sprites,
    skyline: {
      key: `dragstrip_shinjuku_skyline_${time}`,
      path: `assets/Race/Skylines/skyline_shinjuku_${time}.webp`,
    },
  };
}
