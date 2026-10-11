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
