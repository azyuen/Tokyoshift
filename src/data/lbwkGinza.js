import { LBWK_CONVERSIONS } from './lbwkConversions.js';
// Liberty Walk Ginza — isolated feature configuration.
// Career profiles gain access after the first Pro Season sponsor send-off.
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
// All eight full-works donor models are enabled; sealed conversions include NOS.
export const LBWK_BUILDS = Object.freeze([
  { id: 'libertyWalk240z', model: '240z', enabled: true },
  ...LBWK_CONVERSIONS.map(({ id, donor }) => ({ id, model: donor, enabled: true })),
]);
// The preview helper does not itself authorize ownership or purchase.
// Do not use this flag as an ownership or purchase authorisation check.
export function canPreviewLbwkGinza(isDeveloperProfile, storyUnlocked = false) {
  return Boolean(isDeveloperProfile || storyUnlocked);
}
