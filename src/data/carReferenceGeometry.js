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

// Only these NINE existing gameplay IDs are migrated. All remaining car IDs
// keep assets/Cars, their current individual scales and the legacy wheel fit.
export const REFERENCE_CAR_GAME_IDS = Object.freeze({
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
