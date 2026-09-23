// Shared wheel-placement helper.
//
// Normal cars keep the legacy single wheelScale / wheelOffsetY values.
// Cars with asymmetric arches (notably the Ginza hero cars) may provide
// independent rear/front wheel scales, vertical offsets and well radii.
//
// Values are authored in the body PNG's source-pixel coordinate space so the
// fit remains identical in the garage, meet scenes, races and result cards.

export const WHEEL_RENDER_BOOST = 1.0;

export function getAxleWheelFit(
  visual = {},
  axle = 'rear',
  bodyScale = null,
  flipX = false,
  wheelSource = null
) {
  const isFront = axle === 'front';
  const prefix = isFront ? 'front' : 'rear';
  const authoredBodyScale = Number(visual.bodyScale || 1);
  const renderBodyScale = Number.isFinite(Number(bodyScale))
    ? Number(bodyScale)
    : authoredBodyScale;

  const baseWheelScale = Number(
    visual[prefix + 'WheelScale'] ?? visual.wheelScale ?? 0.039
  );

  const offsetX = Number(
    isFront ? visual.frontOffsetX ?? 0 : visual.rearOffsetX ?? 0
  );

  const offsetY = Number(
    visual[prefix + 'WheelOffsetY'] ?? visual.wheelOffsetY ?? 0
  );

  const wellRadiusSource = Number(
    visual[prefix + 'WheelWellRadius'] ?? 0
  );

  const scaleRatio = authoredBodyScale > 0
    ? renderBodyScale / authoredBodyScale
    : 1;

  const wheelSourceDiameter = Math.max(
    Number(wheelSource?.width || wheelSource?.naturalWidth || 0),
    Number(wheelSource?.height || wheelSource?.naturalHeight || 0)
  );

  // Hero cars have measured wheel-well radii in body-source pixels. Size their
  // wheel sprite from the actual wheel image dimensions instead of relying on
  // hand-authored wheelScale guesses. This keeps the tyre filling the arch at
  // every render size and fixes the inconsistent hero-car wheel sizes.
  const measuredWheelScale =
    wellRadiusSource > 0 && wheelSourceDiameter > 0
      ? (
          wellRadiusSource *
          2 *
          renderBodyScale *
          Number(visual[prefix + 'WheelFill'] ?? visual.wheelFill ?? 1.035)
        ) / wheelSourceDiameter
      : null;

  return {
    offsetX: (flipX ? -offsetX : offsetX) * renderBodyScale,
    offsetY: offsetY * renderBodyScale,
    wheelScale: measuredWheelScale ?? (baseWheelScale * scaleRatio * WHEEL_RENDER_BOOST),
    backingRadius: wellRadiusSource > 0
      ? Math.max(5, wellRadiusSource * renderBodyScale * 1.01)
      : null,
    wellRadiusSource,
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
