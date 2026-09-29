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

    // Use the established AE86 reference only to derive a common tyre baseline.
    // baselineOffsetY lets us move every workshop car vertically without
    // changing its size or per-model wheel geometry.
    baselineReferenceCarId: 'ae86',
    baselineReferenceBodyY: 306,
    baselineReferenceWidth: 690,
    baselineOffsetY: 26,
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
