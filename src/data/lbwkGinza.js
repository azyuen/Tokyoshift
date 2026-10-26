import { LBWK_CONVERSIONS } from './lbwkConversions.js';
// Liberty Walk Ginza — isolated feature configuration.
// The location remains unavailable to ordinary profiles until a future story unlock.
export const LBWK_GINZA = Object.freeze({
  id: 'ginzaLibertyWalk',
  region: 'centralTokyo',
  category: 'TUNER SHOP',
  name: 'LIBERTY WALK',
  subtitle: 'FULL WORKS',
  background: 'assets/Locations/TunerShops/ginza_lbwk_day.png',
  defaultDisplay: 'lbwk240z',
  specialistTuning: false,
  decals: false,
  outrightSales: false,
});
// Only the 240Z is enabled until the other hero art is ready.
export const LBWK_BUILDS = Object.freeze([
  { id: 'libertyWalk240z', model: '240z', enabled: true },
  ...LBWK_CONVERSIONS.map(({ id, donor }) => ({ id, model: donor, enabled: true })),
]);
// Only the developer profile may preview this location until the story gate exists.
// Do not use this flag as an ownership or purchase authorisation check.
export function canPreviewLbwkGinza(isDeveloperProfile, storyUnlocked = false) {
  return Boolean(isDeveloperProfile || storyUnlocked);
}
