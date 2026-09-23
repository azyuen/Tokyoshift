// Shared wheel-placement helper.
//
// Every car may specify independent front/rear X, Y and scale values.
//
// NORMAL CARS:
//   Keep explicit per-axle calibration (or the legacy 1.16 fallback). They never
//   use the hero wheel-well auto-fit path.
//
// HERO CARS:
//   visual.wheelFitMode === 'visible-well' sizes the *visible tyre artwork*
//   against the measured wheel arch. Hero wheel PNGs have different transparent
//   padding, so using the full PNG canvas as the diameter makes some wheels look
//   much smaller than others. We scan alpha once per wheel source, cache the
//   visible diameter, and fit that diameter to the independently authored rear
//   and front wheel wells.
//
// If alpha measurement is unavailable for any reason, the explicit axle scale
// remains the safe fallback.

export const LEGACY_WHEEL_RENDER_BOOST = 1.16;
// Compatibility export for older/debug code.
export const WHEEL_RENDER_BOOST = LEGACY_WHEEL_RENDER_BOOST;

const visibleWheelMetricCache = new WeakMap();

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getVisibleWheelMetrics(wheelSource) {
  if (!wheelSource || (typeof wheelSource !== 'object' && typeof wheelSource !== 'function')) {
    return null;
  }

  const cached = visibleWheelMetricCache.get(wheelSource);
  if (cached) return cached;

  const sourceWidth = numberOr(wheelSource.naturalWidth ?? wheelSource.width, 0);
  const sourceHeight = numberOr(wheelSource.naturalHeight ?? wheelSource.height, 0);
  if (sourceWidth <= 0 || sourceHeight <= 0 || typeof document === 'undefined') {
    return null;
  }

  try {
    // Downsample large wheel assets before scanning alpha. The result is mapped
    // back into source-pixel coordinates, and this only runs once per wheel PNG.
    const maxScanSide = 512;
    const sampleScale = Math.min(1, maxScanSide / Math.max(sourceWidth, sourceHeight));
    const scanWidth = Math.max(1, Math.round(sourceWidth * sampleScale));
    const scanHeight = Math.max(1, Math.round(sourceHeight * sampleScale));

    const canvas = document.createElement('canvas');
    canvas.width = scanWidth;
    canvas.height = scanHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.clearRect(0, 0, scanWidth, scanHeight);
    ctx.drawImage(wheelSource, 0, 0, scanWidth, scanHeight);

    const pixels = ctx.getImageData(0, 0, scanWidth, scanHeight).data;
    let minX = scanWidth;
    let minY = scanHeight;
    let maxX = -1;
    let maxY = -1;

    // Ignore extremely faint anti-aliasing / export residue at the canvas edge.
    const alphaThreshold = 24;

    for (let y = 0; y < scanHeight; y += 1) {
      for (let x = 0; x < scanWidth; x += 1) {
        const alpha = pixels[(y * scanWidth + x) * 4 + 3];
        if (alpha <= alphaThreshold) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < minX || maxY < minY) return null;

    const visibleWidth = (maxX - minX + 1) / sampleScale;
    const visibleHeight = (maxY - minY + 1) / sampleScale;
    const metrics = {
      visibleWidth,
      visibleHeight,
      // Wheels are circular artwork; using the larger visible axis prevents an
      // export that is one or two pixels taller/wider from under-sizing the tyre.
      visibleDiameter: Math.max(visibleWidth, visibleHeight),
    };

    visibleWheelMetricCache.set(wheelSource, metrics);
    return metrics;
  } catch (error) {
    // Same-origin game assets should be readable, but keep the hand-authored
    // calibration as a deterministic fallback if canvas pixel access ever fails.
    return null;
  }
}

export function getAxleWheelFit(
  visual = {},
  axle = 'rear',
  bodyScale = null,
  flipX = false,
  wheelSource = null
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

  // Explicit per-axle scales are already calibrated. The historic 1.16 boost is
  // retained only for genuinely legacy configurations.
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

  const wellRadiusSource = numberOr(
    visual[prefix + 'WheelWellRadius'],
    0
  );

  const backingRadiusSource = numberOr(
    visual[prefix + 'WheelBackingRadius'],
    wellRadiusSource
  );

  let wheelScale = baseWheelScale * scaleRatio * renderBoost;

  // HERO-ONLY auto-fit. The target is the measured body-source wheel well, but
  // the divisor is the actual visible wheel artwork rather than the PNG canvas.
  if (visual.wheelFitMode === 'visible-well' && wellRadiusSource > 0) {
    const metrics = getVisibleWheelMetrics(wheelSource);
    if (metrics?.visibleDiameter > 0) {
      const fill = numberOr(
        visual[prefix + 'WheelFill'] ?? visual.wheelFill,
        1.035
      );
      wheelScale = (
        wellRadiusSource *
        2 *
        renderBodyScale *
        fill
      ) / metrics.visibleDiameter;
    }
  }

  return {
    offsetX: (flipX ? -offsetXSource : offsetXSource) * renderBodyScale,
    offsetY: offsetYSource * renderBodyScale,
    wheelScale,
    backingRadius: backingRadiusSource > 0
      ? Math.max(5, backingRadiusSource * renderBodyScale * 1.01)
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
  const fit = {
    rear: getAxleWheelFit(visual, 'rear', bodyScale, flipX, wheelSource),
    front: getAxleWheelFit(visual, 'front', bodyScale, flipX, wheelSource),
  };

  // Unique/hero cars use independently-sized front and rear wheel artwork.
  // Flatten their stance by matching the tyre contact points rather than the
  // wheel centres. Split the correction between both axles so the body keeps
  // its authored ride height while neither end looks visibly nose-up/down.
  if (visual.singleBody && wheelSource) {
    const sourceHeight = numberOr(
      wheelSource.naturalHeight ?? wheelSource.height,
      0
    );

    if (sourceHeight > 0) {
      const rearBottom =
        fit.rear.offsetY + sourceHeight * fit.rear.wheelScale * 0.5;
      const frontBottom =
        fit.front.offsetY + sourceHeight * fit.front.wheelScale * 0.5;
      const sharedBottom = (rearBottom + frontBottom) * 0.5;

      fit.rear.offsetY += sharedBottom - rearBottom;
      fit.front.offsetY += sharedBottom - frontBottom;
    }
  }

  return fit;
}
