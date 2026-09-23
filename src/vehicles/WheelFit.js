// Shared wheel-placement helper.
//
// Normal cars keep the legacy single wheelScale / wheelOffsetY values.
// Cars with asymmetric arches (notably the Ginza hero cars) may provide
// independent rear/front wheel scales, vertical offsets and well radii.
//
// Values are authored in the body PNG's source-pixel coordinate space so the
// fit remains identical in the garage, meet scenes, races and result cards.

export const WHEEL_RENDER_BOOST = 1.16;

export function getAxleWheelFit(visual = {}, axle = 'rear', bodyScale = null, flipX = false) {
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

  return {
    offsetX: (flipX ? -offsetX : offsetX) * renderBodyScale,
    offsetY: offsetY * renderBodyScale,
    wheelScale: baseWheelScale * scaleRatio * WHEEL_RENDER_BOOST,
    // The backing should fill the cavity, while the tyre itself is authored
    // about 5% larger so it tucks naturally under the fender lip.
    backingRadius: wellRadiusSource > 0
      ? Math.max(5, wellRadiusSource * renderBodyScale * 1.01)
      : null,
    wellRadiusSource,
  };
}

export function getWheelPairFit(visual = {}, bodyScale = null, flipX = false) {
  return {
    rear: getAxleWheelFit(visual, 'rear', bodyScale, flipX),
    front: getAxleWheelFit(visual, 'front', bodyScale, flipX),
  };
}
