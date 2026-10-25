// Global workshop presentation geometry.
//
// Home Workshop, Canal Yard and Warehouse HQ must all use these same foreground
// anchors. Keep workshop-specific differences in the background art/data, not in
// car or character placement. This file is the single place to calibrate the
// workshop composition after visual review.
export const WORKSHOP_PRESENTATION = Object.freeze({
  heroCar: Object.freeze({
    x: 708,
    targetWidth: 620,

    // Absolute visible tyre-contact line in workshop scene coordinates.
    // Never derive this from another car's texture: workshops lazy-load only
    // their local cars, so a reference car may not be present.
    tyreContactY: 500,
  }),

  thumbnail: Object.freeze({
    targetWidth: 176,
    bodyYOffset: -15,
  }),

  player: Object.freeze({
    x: 282,
    feetY: 558,
    targetHeight: 350,
  }),

  daichi: Object.freeze({
    engine: Object.freeze({
      frontWheelOffsetX: 100,
      rightInset: 110,
      feetOffsetY: 4,
      targetHeight: 292,
    }),
    drivetrain: Object.freeze({
      x: 875,
      feetY: 494,
      targetHeight: 282,
    }),
    exhaustNos: Object.freeze({
      xMode: 'car-centre',
      feetOffsetY: 22,
      targetHeight: 282,
    }),
    chassis: Object.freeze({
      frontWheelOffsetX: 92,
      minFromCarCentre: 160,
      rightInset: 88,
      feetY: 510,
      targetHeight: 282,
    }),
  }),
});
