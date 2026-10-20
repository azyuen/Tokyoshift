// R624 — Street tuner finishes are fictional, not manufacturer factory paints.
// Retain the R623 OEM-style palettes for factory-stock vehicles and new cars.
import { getFactoryPaintPalette } from './factoryPaintPalettes.js?v=20261020-r623';

const palette = (entries, category) => Object.freeze(entries.map(([name,hex]) =>
  Object.freeze({name, color:Number.parseInt(hex,16), code:'', category})
));

export const STREET_TUNED_PAINTS = palette([
  ['Candy Apple Red','AF1741'],
  ['Midnight Violet','40316D'],
  ['Neon Teal Metallic','008E94'],
  ['Burnt Copper','D36723'],
  ['Electric Cobalt','2868C1'],
  ['Lavender Pearl','9C8EAA'],
  ['Smoked Bronze','806446'],
  ['Emerald Chrome','18775D'],
  ['Arctic Ice Blue','68ADCA'],
  ['Rosso Coral','D65758'],
], 'street');

export const SHOW_CAR_PAINTS = palette([
  ['Acid Lime','C7D623'],
  ['Hot Pink Pearl','EB46A0'],
  ['Ultraviolet Candy','8A41EE'],
  ['Electric Cyan','00C3D7'],
  ['Tangerine Flash','FF8222'],
  ['Solar Yellow','F4D517'],
], 'show');

// Both groups are offered in the Street Studio, so even the wildest
// rival paint can be reproduced when the player visits Oshiage.
export const STREET_PAINT_PALETTE = Object.freeze([
  ...STREET_TUNED_PAINTS, ...SHOW_CAR_PAINTS,
]);

// Probabilities are percentages: factory / street / show.
export const RIVAL_PAINT_MIX = Object.freeze({
  DEFAULT: Object.freeze([45,40,15]),
  ODAIBA: Object.freeze([65,30,5]),
  SHINAGAWA: Object.freeze([65,30,5]),
  TATSUMI: Object.freeze([50,40,10]),
  YOKOHAMA: Object.freeze([50,40,10]),
  SHIBUYA: Object.freeze([30,50,20]),
  DAIKOKU: Object.freeze([30,50,20]),
  SHINJUKU: Object.freeze([35,45,20]),
  OSHIAGE: Object.freeze([35,45,20]),
});

// Stable integer hash: seeded market listings stay consistent within a
// refresh and main rivals keep their recognisable finish across visits.
function paintHash(value) {
  let hash=2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash >>> 0;
}

export function getStreetPaintPalette() {
  return STREET_PAINT_PALETTE;
}

export function getStreetPaintName(color) {
  return STREET_PAINT_PALETTE.find(p => p.color === Number(color))?.name || null;
}

// Returns null for special collector/race cars: their authored livery wins.
// seed should be saved for any persistent offer, not regenerated at draw time.
export function selectMixedCarPaint(carId, {
  region='DEFAULT', seed=0, characterId='', isMainRival=false,
}={}) {
  const baseCarId=String(carId || '').replace(/__copy[2-9][0-9]*$/, '');
  const factory=getFactoryPaintPalette(baseCarId);
  if (!factory.length) return null;
  const signature=isMainRival && characterId
    ? 'signature:'+characterId+':'+baseCarId
    : 'scene:'+String(seed)+':'+baseCarId;
  const mix=RIVAL_PAINT_MIX[isMainRival ? 'DEFAULT' : String(region).toUpperCase()]
    || RIVAL_PAINT_MIX.DEFAULT;
  const roll=paintHash('type:'+signature)%10000;
  const group=roll < mix[0]*100 ? 'factory'
    : roll < (mix[0]+mix[1])*100 ? 'street' : 'show';
  const options=group==='factory' ? factory
    : group==='street' ? STREET_TUNED_PAINTS : SHOW_CAR_PAINTS;
  const entry=options[paintHash('finish:'+signature)%options.length];
  return {...entry, category:group};
}
