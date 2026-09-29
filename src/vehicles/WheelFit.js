// Shared wheel-placement helper.
//
// R244 wheel standard:
//   Every wheel PNG is a centred 384×384 transparent canvas with a consistent
//   visible tyre footprint. Cars with measured wheel wells size the visible tyre
//   directly to the authored rear/front arches, so generic and hero wheels now
//   follow the same geometry rules.
//
// Legacy scale values remain supported for cars without measured wheel wells.
// Those values were calibrated against the old 1254×1254 canvases, so the
// renderer automatically compensates when it sees a standard 384×384 wheel.
//
// Alpha scanning is cached once per texture and is also used for true tyre
// contact height. If measurement is unavailable, the explicit scale fallback
// remains deterministic.

export const LEGACY_WHEEL_RENDER_BOOST = 1.16;
export const LEGACY_WHEEL_CANVAS_SIZE = 1254;
export const STANDARD_WHEEL_CANVAS_SIZE = 384;

// R244/R246 wheel exports were normalized onto the same 384px canvas and
// approximately the same visible tyre footprint. Keep a deterministic fallback
// for older Safari/iPadOS builds where canvas pixel reads can fail even for
// same-origin images. Modern browsers still use the measured alpha bounds.
const STANDARD_WHEEL_VISIBLE_DIAMETER = 332;
const STANDARD_WHEEL_VISIBLE_BOTTOM_FROM_CENTER = 164;

// Compatibility export for older/debug code.
export const WHEEL_RENDER_BOOST = LEGACY_WHEEL_RENDER_BOOST;

const visibleWheelMetricCache = new WeakMap();

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getStandardWheelFallbackMetrics(sourceWidth, sourceHeight) {
  const isStandardWheelCanvas =
    sourceWidth > 0 &&
    sourceHeight > 0 &&
    Math.abs(sourceWidth - STANDARD_WHEEL_CANVAS_SIZE) <= 2 &&
    Math.abs(sourceHeight - STANDARD_WHEEL_CANVAS_SIZE) <= 2;

  if (!isStandardWheelCanvas) return null;

  return {
    visibleWidth: STANDARD_WHEEL_VISIBLE_DIAMETER,
    visibleHeight: STANDARD_WHEEL_VISIBLE_DIAMETER,
    visibleBottomFromCenter: STANDARD_WHEEL_VISIBLE_BOTTOM_FROM_CENTER,
    visibleDiameter: STANDARD_WHEEL_VISIBLE_DIAMETER,
  };
}

function getVisibleWheelMetrics(wheelSource) {
  if (!wheelSource || (typeof wheelSource !== 'object' && typeof wheelSource !== 'function')) {
    return null;
  }

  const cached = visibleWheelMetricCache.get(wheelSource);
  if (cached) return cached;

  const sourceWidth = numberOr(wheelSource.naturalWidth ?? wheelSource.width, 0);
  const sourceHeight = numberOr(wheelSource.naturalHeight ?? wheelSource.height, 0);
  if (sourceWidth <= 0 || sourceHeight <= 0) return null;

  const standardFallback = getStandardWheelFallbackMetrics(sourceWidth, sourceHeight);

  // iPadOS can identify as either iPad or MacIntel. The 384px wheel catalogue
  // is deliberately normalized, so use its authored footprint directly there
  // instead of depending on Safari canvas readback for layout-critical geometry.
  const isIpadLike =
    typeof navigator !== 'undefined' &&
    (
      /iPad/i.test(String(navigator.userAgent || '')) ||
      (
        navigator.platform === 'MacIntel' &&
        Number(navigator.maxTouchPoints || 0) > 1
      )
    );

  if (standardFallback && isIpadLike) return standardFallback;
  if (typeof document === 'undefined') return standardFallback;

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
    if (!ctx) return standardFallback;

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

    if (maxX < minX || maxY < minY) return standardFallback;

    const visibleWidth = (maxX - minX + 1) / sampleScale;
    const visibleHeight = (maxY - minY + 1) / sampleScale;
    const metrics = {
      visibleWidth,
      visibleHeight,
      // Distance from Phaser's default image origin (canvas centre) to the
      // lowest visible tyre pixel. This lets different wheel PNGs share a true
      // visual ground line even when their transparent canvas padding differs.
      visibleBottomFromCenter:
        ((maxY + 1) / sampleScale) - sourceHeight * 0.5,
      // Wheels are circular artwork; using the larger visible axis prevents an
      // export that is one or two pixels taller/wider from under-sizing the tyre.
      visibleDiameter: Math.max(visibleWidth, visibleHeight),
    };

    visibleWheelMetricCache.set(wheelSource, metrics);
    return metrics;
  } catch (error) {
    // Older iPadOS Safari can reject canvas pixel reads for an otherwise valid
    // same-origin image. Standard 384px wheels are normalized, so use their
    // known footprint rather than falling back to the old 1254px-era scale.
    return standardFallback;
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

  const sourceWidth = numberOr(
    wheelSource?.naturalWidth ?? wheelSource?.width,
    0
  );
  const sourceHeight = numberOr(
    wheelSource?.naturalHeight ?? wheelSource?.height,
    0
  );
  const sourceCanvasSize = Math.max(sourceWidth, sourceHeight);
  const isStandardWheelCanvas =
    sourceWidth > 0 &&
    sourceHeight > 0 &&
    Math.abs(sourceWidth - STANDARD_WHEEL_CANVAS_SIZE) <= 2 &&
    Math.abs(sourceHeight - STANDARD_WHEEL_CANVAS_SIZE) <= 2;

  // Explicit legacy wheelScale values were authored while every wheel PNG used
  // a 1254×1254 canvas. If a car has no measured wheel-well radius, preserve
  // the same rendered physical size after the asset was reduced to 384×384.
  const scaleReferenceSize = numberOr(
    visual[prefix + 'WheelScaleReferenceSize'] ?? visual.wheelScaleReferenceSize,
    LEGACY_WHEEL_CANVAS_SIZE
  );
  const canvasCompensation =
    sourceCanvasSize > 0 && isStandardWheelCanvas
      ? scaleReferenceSize / sourceCanvasSize
      : 1;

  let wheelScale = baseWheelScale * scaleRatio * renderBoost * canvasCompensation;

  // R244 wheel standard:
  // All 384×384 wheel assets have the tyre centred and normalised to the same
  // footprint. Any car with a measured wheel arch can therefore size the tyre
  // from visible artwork instead of depending on old per-PNG padding/scale.
  //
  // Older/non-standard wheel assets keep the explicit opt-in behaviour so this
  // remains backward compatible if an unconverted asset is ever encountered.
  const useVisibleWellFit =
    wellRadiusSource > 0 &&
    (
      visual.wheelFitMode === 'visible-well' ||
      isStandardWheelCanvas
    );

  if (useVisibleWellFit) {
    const metrics = getVisibleWheelMetrics(wheelSource);
    if (metrics?.visibleDiameter > 0) {
      const fill = numberOr(
        visual[prefix + 'WheelFill'] ?? visual.wheelFill,
        isStandardWheelCanvas ? 1.0 : 1.035
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

export function getWheelContactOffsetY(wheelSource, wheelScale = 1) {
  const scale = numberOr(wheelScale, 1);
  const sourceHeight = numberOr(
    wheelSource?.naturalHeight ?? wheelSource?.height,
    0
  );
  const metrics = getVisibleWheelMetrics(wheelSource);
  const visibleBottomFromCenter = Number.isFinite(metrics?.visibleBottomFromCenter)
    ? metrics.visibleBottomFromCenter
    : sourceHeight * 0.5;

  return visibleBottomFromCenter * scale;
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

  // Preserve authored wheel centres by default. Older code automatically
  // flattened every single-layer hero car by moving each axle vertically, which
  // made otherwise-correct wheels look off-centre inside their arches.
  // Contact levelling is now opt-in only for assets that explicitly request it.
  if (visual.levelWheelContact === true && wheelSource) {
    const sourceHeight = numberOr(
      wheelSource.naturalHeight ?? wheelSource.height,
      0
    );

    if (sourceHeight > 0) {
      const rearBottom =
        fit.rear.offsetY +
        getWheelContactOffsetY(wheelSource, fit.rear.wheelScale);
      const frontBottom =
        fit.front.offsetY +
        getWheelContactOffsetY(wheelSource, fit.front.wheelScale);
      const sharedBottom = (rearBottom + frontBottom) * 0.5;

      fit.rear.offsetY += sharedBottom - rearBottom;
      fit.front.offsetY += sharedBottom - frontBottom;
    }
  }

  return fit;
}
