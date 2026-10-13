// Source-canvas face positions, not wheel-based estimates. Each car is drawn
// pointing RIGHT. x/y are fractions of its own PNG canvas (top-left = 0,0).
// 'height' is the approximate full silhouette crop height as a fraction of
// the car canvas height. Values are intentionally data, not character-specific.
// Future SpriteR cars need only one extra entry here after window alignment.
export const CAR_DRIVER_FACE_ANCHORS = Object.freeze({
  ae86:    { x: 0.48, y: 0.205, height: 0.135 },
  ef:      { x: 0.56, y: 0.185, height: 0.135 },
  ek9:     { x: 0.55, y: 0.190, height: 0.135 },
  wrx22b:  { x: 0.54, y: 0.195, height: 0.125 },
  evo6:    { x: 0.55, y: 0.170, height: 0.135 },
  r32:     { x: 0.53, y: 0.190, height: 0.135 },
  fc3s:    { x: 0.53, y: 0.175, height: 0.130 },
  rx7fd:   { x: 0.53, y: 0.190, height: 0.130 },
  rx8:     { x: 0.55, y: 0.180, height: 0.130 },
  evo3:    { x: 0.55, y: 0.275, height: 0.135 },
  evo5:    { x: 0.55, y: 0.250, height: 0.135 },
  a60:     { x: 0.53, y: 0.260, height: 0.130 },
  ej1:     { x: 0.54, y: 0.250, height: 0.130 },
  jza80:   { x: 0.53, y: 0.255, height: 0.125 },
  nsx:     { x: 0.54, y: 0.285, height: 0.125 },
  '3000gt':{ x: 0.51, y: 0.265, height: 0.125 },
  r34:     { x: 0.54, y: 0.260, height: 0.130 },
  s2000:   { x: 0.55, y: 0.245, height: 0.120 },
});
