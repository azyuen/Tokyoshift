// Shared wheel-placement helper.
//
// Wheel fit is authored per axle.  Every car may specify independent front/rear
// X, Y and scale values.  That is important because the source sprites do not
// have identical wheel arches, and some wheel PNGs include different amounts
// of transparent padding.
//
// Normal cars historically used wheelScale with a global 1.16 visual correction.
// We preserve that ONLY as a fallback for old/unconverted configs.  Once a car
// has rearWheelScale/frontWheelScale, those values are the final authored scales
// at visual.bodyScale and no global hero/normal multiplier is applied.
//
// Wheel-well radii are used only for the dark cavity backing.  They MUST NOT be
// used to derive tyre size: image-canvas dimensions are not the visible tyre
// diameter and were the cause of the hero-car sizing regression.

export const LEGACY_WHEEL_RENDER_BOOST = 1.16;
// Kept for compatibility with any external/debug code that imports this name.
export const WHEEL_RENDER_BOOST = LEGACY_WHEEL_RENDER_BOOST;

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getAxleWheelFit(
  visual = {},
  axle = 'rear',
  bodyScale = null,
  flipX = false,
  _wheelSource = null
) {
  const isFront = axle === 'front';
  const prefix = isFront ? 'front' : 'rear';

  const authoredBodyScale = numberOr(visual.bodyScale, 1) || 1;
  const renderBodyScale = Number.isFinite(Number(bodyScale))
    ? Number(bodyScale)
    : authoredBodyScale;
  const scaleRatio = authoredBodyScale > 0
    ? renderBodyScale / authoredBodyScale
    : 1;

  const explicitScaleRaw = visual[prefix + 'WheelScale'];
  const hasExplicitAxleScale =
    explicitScaleRaw !== undefined &&
    explicitScaleRaw !== null &&
    Number.isFinite(Number(explicitScaleRaw));

  const baseWheelScale = hasExplicitAxleScale
    ? Number(explicitScaleRaw)
    : numberOr(visual.wheelScale, 0.039);

  // Explicit axle scales are already calibrated.  The old 1.16 boost is used
  // only for legacy configs that still expose a single wheelScale.
  const defaultBoost = hasExplicitAxleScale ? 1 : LEGACY_WHEEL_RENDER_BOOST;
  const renderBoost = numberOr(
    visual[prefix + 'WheelRenderBoost'] ?? visual.wheelRenderBoost,
    defaultBoost
  );

  const legacyOffsetX = isFront
    ? numberOr(visual.frontOffsetX, 0)
    : numberOr(visual.rearOffsetX, 0);

  const offsetXSource = numberOr(
    visual[prefix + 'WheelOffsetX'],
    legacyOffsetX
  );

  const offsetYSource = numberOr(
    visual[prefix + 'WheelOffsetY'],
    numberOr(visual.wheelOffsetY, 0)
  );

  const backingRadiusSource = numberOr(
    visual[prefix + 'WheelBackingRadius'],
    numberOr(visual[prefix + 'WheelWellRadius'], 0)
  );

  return {
    offsetX: (flipX ? -offsetXSource : offsetXSource) * renderBodyScale,
    offsetY: offsetYSource * renderBodyScale,
    wheelScale: baseWheelScale * scaleRatio * renderBoost,
    backingRadius: backingRadiusSource > 0
      ? Math.max(5, backingRadiusSource * renderBodyScale * 1.01)
      : null,
    wellRadiusSource: backingRadiusSource,
  };
}

export function getWheelPairFit(
  visual = {},
  bodyScale = null,
  flipX = false,
  wheelSource = null
) {
  return {
    rear: getAxleWheelFit(visual, 'rear', bodyScale, flipX, wheelSource),
    front: getAxleWheelFit(visual, 'front', bodyScale, flipX, wheelSource),
  };
}
