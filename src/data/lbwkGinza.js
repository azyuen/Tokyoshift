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
export const LBWK_BUILDS = Object.freeze([
  { id: 'lbwk240z', model: '240z' },
  { id: 'lbwkR32', model: 'r32' },
  { id: 'lbwk180sx', model: '180sx' },
  { id: 'lbwkS15', model: 's15' },
  { id: 'lbwkA60', model: 'a60' },
  { id: 'lbwkRx8', model: 'rx8' },
  { id: 'lbwkMx5', model: 'mx5nb' },
  { id: 'lbwk350z', model: '350z' },
  { id: 'lbwkEk9', model: 'ek9' },
]);
// Only the developer profile may preview this location until the story gate exists.
// Do not use this flag as an ownership or purchase authorisation check.
export function canPreviewLbwkGinza(isDeveloperProfile, storyUnlocked = false) {
  return Boolean(isDeveloperProfile || storyUnlocked);
}
