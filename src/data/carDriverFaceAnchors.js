// Source-canvas face positions, not wheel-based estimates. Each car is drawn
// pointing RIGHT. x/y are fractions of its own PNG canvas (top-left = 0,0).
// 'height' is the approximate full silhouette crop height as a fraction of
// the car canvas height. Values are intentionally data, not character-specific.
// Future SpriteR cars need only one extra entry here after window alignment.
export const CAR_DRIVER_FACE_ANCHORS = Object.freeze({
  'familia': { x: 0.55, y: 0.22, height: 0.13 },
  'eclipse': { x: 0.56, y: 0.19, height: 0.13 },
  'dc2': { x: 0.56, y: 0.24, height: 0.13 },
  'crx': { x: 0.62, y: 0.24, height: 0.13 },
  'jzx100': { x: 0.55, y: 0.17, height: 0.13 },
  'st205': { x: 0.56, y: 0.28, height: 0.13 },
  'b4rsk': { x: 0.58, y: 0.18, height: 0.13 },
  'z33': { x: 0.53, y: 0.24, height: 0.13 },
  'z32': { x: 0.56, y: 0.19, height: 0.13 },
  '240z': { x: 0.5, y: 0.23, height: 0.13 },
  '180sx': { x: 0.57, y: 0.2, height: 0.13 },
  ae86:    { x: 0.48, y: 0.205, height: 0.135 },
  ef:      { x: 0.56, y: 0.185, height: 0.135 },
  ek9:     { x: 0.55, y: 0.190, height: 0.135 },
  wrx22b:  { x: 0.54, y: 0.195, height: 0.125 },
  evo6:    { x: 0.55, y: 0.170, height: 0.135 },
  r32:     { x: 0.53, y: 0.190, height: 0.135 },
  fc3s:    { x: 0.53, y: 0.175, height: 0.130 },
  rx7fd:   { x: 0.53, y: 0.190, height: 0.130 },
  rx8:     { x: 0.55, y: 0.180, height: 0.130 },
  evo3:    { x: 0.55, y: 0.195, height: 0.135 }, // Ref2 Galant VR-4 sedan cabin
  'evo5': { x: 0.56, y: 0.2, height: 0.13 },
  'a60': { x: 0.54, y: 0.29, height: 0.13 },
  ej1:     { x: 0.54, y: 0.250, height: 0.130 },
  'jza80': { x: 0.53, y: 0.25, height: 0.13 },
  'nsx': { x: 0.55, y: 0.25, height: 0.13 },
  '3000gt': { x: 0.53, y: 0.2, height: 0.13 },
  r34:     { x: 0.54, y: 0.260, height: 0.130 },
  's2000': { x: 0.55, y: 0.28, height: 0.13 },
});
