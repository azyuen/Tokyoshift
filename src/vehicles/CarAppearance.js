export const DEFAULT_PAINT_COLOR = 0xffffff;

export const PAINT_PRESETS = [
  { name: 'WHITE', color: 0xffffff },
  { name: 'SILVER', color: 0xc7cdd4 },
  { name: 'BLACK', color: 0x2c3036 },
  { name: 'RED', color: 0xe84b52 },
  { name: 'BLUE', color: 0x3c78e8 },
  { name: 'YELLOW', color: 0xf0c743 },
  { name: 'GREEN', color: 0x42ad70 },
  { name: 'PURPLE', color: 0x9a68d7 },
  { name: 'TEAL', color: 0x28b8ad },
  { name: 'ORANGE', color: 0xec8245 },
];

export const RIVAL_PAINT_COLORS = PAINT_PRESETS
  .filter(item => !['WHITE', 'SILVER', 'BLACK'].includes(item.name))
  .map(item => item.color);

const cleanAssetStem = value => String(value || 'car')
  .trim()
  .replace(/[^a-zA-Z0-9_-]+/g, '_');

export function getCarAssetStem(visualOrCar = {}) {
  const visual = visualOrCar?.visual || visualOrCar || {};
  return cleanAssetStem(
    visual.assetStem
    || visualOrCar?.assetStem
    || visualOrCar?.id
    || 'car'
  );
}

export function getCarTextureKeys(visualOrCar = {}) {
  const stem = getCarAssetStem(visualOrCar);
  return {
    body: 'carBody_' + stem,
    paint: 'carPaint_' + stem,
    overlay: 'carOverlay_' + stem,
  };
}

export function getCarAssetPaths(visualOrCar = {}, cacheBust = '') {
  const stem = getCarAssetStem(visualOrCar);
  const suffix = cacheBust ? '?v=' + encodeURIComponent(cacheBust) : '';

  return {
    body: 'assets/Cars/' + stem + '_body.png' + suffix,
    paint: 'assets/Cars/' + stem + '_body_paint.png' + suffix,
    overlay: 'assets/Cars/' + stem + '_body_overlay.png' + suffix,
  };
}

/**
 * Standard cars use the 3-file appearance convention:
 *   <assetStem>_body.png          legacy/dev fallback
 *   <assetStem>_body_paint.png    grayscale tint layer
 *   <assetStem>_body_overlay.png  fixed windows/lights/trim/details
 *
 * Unique hero cars can set visual.singleBody = true and provide only the
 * finished <assetStem>_body.png.
 */
export function preloadCarAppearanceAssets(scene, carMap = {}, cacheBust = '') {
  Object.values(carMap || {}).forEach(car => {
    const keys = getCarTextureKeys(car);
    const paths = getCarAssetPaths(car, cacheBust);

    scene.load.image(keys.body, paths.body);

    // Ginza hero cars are deliberately fixed one-off builds. They ship as one
    // finished body PNG and must never request paint/overlay layers.
    if (car?.visual?.singleBody) return;

    scene.load.image(keys.paint, paths.paint);
    scene.load.image(keys.overlay, paths.overlay);
  });
}

export function normalisePaintColor(value, fallback = DEFAULT_PAINT_COLOR) {
  if (value == null || value === '') return fallback;

  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/^#/, '');
    if (/^[0-9a-f]{6}$/i.test(cleaned)) return parseInt(cleaned, 16);
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(0xffffff, Math.round(numeric)));
}

export function getCarPaintColor(carState = {}, fallback = DEFAULT_PAINT_COLOR) {
  return normalisePaintColor(carState?.paintColor, fallback);
}

export function paintColorToHex(value) {
  return '#' + normalisePaintColor(value).toString(16).padStart(6, '0').toUpperCase();
}

export function paintColorToRgb(value) {
  const color = normalisePaintColor(value);
  return {
    r: (color >> 16) & 255,
    g: (color >> 8) & 255,
    b: color & 255,
  };
}

export function rgbToPaintColor(r, g, b) {
  const clamp = value => Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
  return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
}

export function hasLayeredPaintAssets(scene, visualOrCar) {
  const visual = visualOrCar?.visual || visualOrCar || {};
  if (visual.singleBody) return false;

  const keys = getCarTextureKeys(visualOrCar);
  return Boolean(
    scene?.textures?.exists?.(keys.paint)
    && scene?.textures?.exists?.(keys.overlay)
  );
}

export function getCarBodyTextureKey(scene, visualOrCar) {
  const keys = getCarTextureKeys(visualOrCar);
  return hasLayeredPaintAssets(scene, visualOrCar) ? keys.paint : keys.body;
}

export function createCarBodyLayers(
  scene,
  visualOrCar,
  {
    x = 0,
    y = 0,
    scale = 1,
    depth = 0,
    flipX = false,
    paintColor = DEFAULT_PAINT_COLOR,
  } = {}
) {
  const color = normalisePaintColor(paintColor);
  const keys = getCarTextureKeys(visualOrCar);

  if (hasLayeredPaintAssets(scene, visualOrCar)) {
    const paint = scene.add.image(x, y, keys.paint)
      .setScale(scale)
      .setFlipX(flipX)
      .setTint(color)
      .setDepth(depth);

    const overlay = scene.add.image(x, y, keys.overlay)
      .setScale(scale)
      .setFlipX(flipX)
      .setDepth(depth + 0.02);

    paint.setData('carPaintLayer', true);
    overlay.setData('carOverlayLayer', true);

    return {
      layered: true,
      primary: paint,
      paint,
      overlay,
      objects: [paint, overlay],
    };
  }

  const body = scene.add.image(x, y, keys.body)
    .setScale(scale)
    .setFlipX(flipX)
    .setDepth(depth);

  return {
    layered: false,
    primary: body,
    paint: null,
    overlay: null,
    objects: [body],
  };
}

export function setCarBodyPaint(objects = [], color = DEFAULT_PAINT_COLOR) {
  const tint = normalisePaintColor(color);
  let changed = false;

  objects.forEach(obj => {
    if (obj?.getData?.('carPaintLayer')) {
      obj.setTint(tint);
      changed = true;
    }
  });

  return changed;
}
