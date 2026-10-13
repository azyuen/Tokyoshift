// Tokyo SHIFT standard-car reference geometry.
// Calibrated in GIMP against AE86 and validated in the nine-car reference screen.
// Source pixels use bottom-right PNG origin (Phaser setOrigin(1, 1));
// PNG bottom is the contact/ground line. Never auto-fit individual car widths.
//
// Every standard car shares masterScale for a given scene display multiplier.
// Axle X values are negative source-pixel offsets from the PNG RIGHT EDGE.
// Tyre diameter is selected from two common source-pixel sizes (S / L).
// Do not change this authored geometry when migrating scene renderers.
export const STANDARD_CAR_REFERENCE = {
  note: 'Source pixels. Common bottom-right origin. Global scale from AE86.',
  masterScale: 0.32,
  wheelDiameters: {
    S: 182,
    L: 194,
  },
  cars: {
    r34: { rearX: -922, frontX: -248, size: 'L' },
    '180sx': { rearX: -932, frontX: -248, size: 'L' },
    '240z': { rearX: -887, frontX: -224, size: 'S' },
    '3000gt': { rearX: -947, frontX: -258, size: 'L' },
    '300zx': { rearX: -964, frontX: -252, size: 'S' },
    '350Z': { rearX: -944, frontX: -196, size: 'L' },
    'B4RSK': { rearX: -974, frontX: -248, size: 'L' },
    'a60': { rearX: -988, frontX: -258, size: 'S' },
    'celicaGT4': { rearX: -926, frontX: -244, size: 'S' },
    'chaser': { rearX: -962, frontX: -248, size: 'S' },
    'crx': { rearX: -908, frontX: -222, size: 'S' },
    'dc2': { rearX: -943, frontX: -254, size: 'S' },
    'eclipse': { rearX: -980, frontX: -244, size: 'L' },
    'evo5': { rearX: -950, frontX: -252, size: 'S' },
    'familia': { rearX: -946, frontX: -244, size: 'L' },
    'jza80': { rearX: -972, frontX: -260, size: 'S' },
    'nsx': { rearX: -968, frontX: -258, size: 'L' },
    's2000': { rearX: -916, frontX: -228, size: 'S' },
    ae86: { rearX: -921, frontX: -247, size: 'S' },
    ef: { rearX: -877, frontX: -195, size: 'S' },
    ek9: { rearX: -931, frontX: -231, size: 'S' },
    '22b': { rearX: -901, frontX: -253, size: 'S' },
    evo6: { rearX: -972, frontX: -280, size: 'S' },
    r32: { rearX: -988, frontX: -268, size: 'L' },
    rx7fc: { rearX: -936, frontX: -260, size: 'L' },
    rx7fd: { rearX: -922, frontX: -218, size: 'L' },
    rx8: { rearX: -986, frontX: -246, size: 'L' },
  },
};

export const STANDARD_CAR_REFERENCE_ROOT = 'assets/Cars/Ref';

// Original Ref batch and the corrected Ref2 batch share scale and origin.
export const REF2_CAR_STEMS = Object.freeze(["r34", "180sx", "240z", "3000gt", "300zx", "350Z", "B4RSK", "a60", "celicaGT4", "chaser", "crx", "dc2", "eclipse", "evo5", "familia", "jza80", "nsx", "s2000"]);
export function getReferenceAssetRoot(stem) {
  return REF2_CAR_STEMS.includes(stem) ? 'assets/Cars/Ref2' : STANDARD_CAR_REFERENCE_ROOT;
}
export const REFERENCE_CAR_GAME_IDS = Object.freeze({
  r34: 'r34',
  'z32': '300zx',
  'z33': '350Z',
  '240z': '240z',
  'crx': 'crx',
  'dc2': 'dc2',
  'eclipse': 'eclipse',
  'familia': 'familia',
  '180sx': '180sx',
  'st205': 'celicaGT4',
  'jzx100': 'chaser',
  'b4rsk': 'B4RSK',
  '3000gt': '3000gt',
  'a60': 'a60',
  'evo5': 'evo5',
  'jza80': 'jza80',
  'nsx': 'nsx',
  's2000': 's2000',
  ae86: 'ae86',
  ef: 'ef',
  ek9: 'ek9',
  wrx22b: '22b',
  evo6: 'evo6',
  r32: 'r32',
  fc3s: 'rx7fc',
  rx7fd: 'rx7fd',
  rx8: 'rx8',
});

// Source canvas dimensions measured from authored GIMP PNGs.
export const REFERENCE_CAR_CANVAS = Object.freeze({
  r34: [1200, 500],
  '180sx': [1300, 440],
  '240z': [1300, 440],
  '3000gt': [1300, 440],
  '300zx': [1300, 440],
  '350Z': [1300, 440],
  'B4RSK': [1300, 440],
  'a60': [1300, 440],
  'celicaGT4': [1300, 440],
  'chaser': [1300, 440],
  'crx': [1300, 440],
  'dc2': [1300, 440],
  'eclipse': [1300, 440],
  'evo5': [1300, 440],
  'familia': [1300, 440],
  'jza80': [1300, 440],
  'nsx': [1300, 440],
  's2000': [1300, 440],
  ae86: [1166, 420],
  ef: [1166, 420],
  ek9: [1166, 420],
  '22b': [1166, 420],
  evo6: [1250, 440],
  r32: [1300, 440],
  rx7fc: [1300, 440],
  rx7fd: [1300, 440],
  rx8: [1300, 440],
});

// Scene-based zoom uses the AE86 source width rather than each car's width.
// Thus targetWidth=900 means AE86=900 and R32=1003, with shared pixel scale.
export const REFERENCE_AE86_SOURCE_WIDTH = 1166;

export function getReferenceCarVisual(visualOrCar = {}) {
  const visual = visualOrCar?.visual || visualOrCar || {};
  return visual.referenceStandard ? visual : null;
}

export function getReferenceRightX(visualOrCar, virtualX, renderScale) {
  return getReferenceCarVisual(visualOrCar)
    ? virtualX + (REFERENCE_AE86_SOURCE_WIDTH * renderScale * 0.5)
    : virtualX;
}
