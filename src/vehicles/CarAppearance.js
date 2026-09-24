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
    bodyKitPaint: 'carBodyKitPaint_' + stem,
    bodyKit: 'carBodyKit_' + stem,
    spoilerPaint: 'carSpoilerPaint_' + stem,
    spoiler: 'carSpoiler_' + stem,
  };
}

export function getCarAssetPaths(visualOrCar = {}, cacheBust = '') {
  const visual = visualOrCar?.visual || visualOrCar || {};
  const stem = getCarAssetStem(visualOrCar);
  const suffix = cacheBust ? '?v=' + encodeURIComponent(cacheBust) : '';
  const modularRoot = visual.modularAssetRoot
    ? String(visual.modularAssetRoot).replace(/\/+$/g, '')
    : '';
  const modularStem = cleanAssetStem(visual.modularAssetStem || (stem + '_car'));
  const bodyKitId = cleanAssetStem(String(visual.stockBodyKitId ?? '0'));
  const spoilerId = cleanAssetStem(String(visual.stockSpoilerId ?? '0'));

  if (modularRoot) {
    const hasBodyKit = visual.stockBodyKit !== false;
    const hasSpoiler = visual.stockSpoiler !== false;

    return {
      // Foldered modular cars keep every appearance layer together. The body
      // path remains a complete preview/fallback; normal rendering uses the
      // paint/overlay/aero layers below.
      body: (visual.bodyPath || (modularRoot + '/' + stem + '_preview_full.png')) + suffix,
      paint: modularRoot + '/' + modularStem + '_paint.png' + suffix,
      overlay: modularRoot + '/' + modularStem + '_overlay.png' + suffix,
      bodyKitPaint: hasBodyKit && visual.stockBodyKitPaint !== false
        ? modularRoot + '/' + modularStem + '_bodykit_' + bodyKitId + '_paint.png' + suffix
        : null,
      bodyKit: hasBodyKit
        ? modularRoot + '/' + modularStem + '_bodykit_' + bodyKitId + '.png' + suffix
        : null,
      spoilerPaint: hasSpoiler && visual.stockSpoilerPaint !== false
        ? modularRoot + '/' + modularStem + '_spoiler_' + spoilerId + '_paint.png' + suffix
        : null,
      spoiler: hasSpoiler
        ? modularRoot + '/' + modularStem + '_spoiler_' + spoilerId + '.png' + suffix
        : null,
    };
  }

  return {
    // Hero/template assets may provide an exact case-sensitive path. This is
    // important on GitHub Pages, where .PNG and .png are different files.
    body: (visual.bodyPath || ('assets/Cars/' + stem + '_body.png')) + suffix,
    paint: 'assets/Cars/' + stem + '_body_paint.png' + suffix,
    overlay: 'assets/Cars/' + stem + '_body_overlay.png' + suffix,
    bodyKitPaint: null,
    bodyKit: null,
    spoilerPaint: null,
    spoiler: null,
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
    const loadIfPresent = (key, path) => {
      if (path) scene.load.image(key, path);
    };

    loadIfPresent(keys.body, paths.body);

    // Ginza hero cars are deliberately fixed one-off builds. They ship as one
    // finished body PNG and must never request paint/overlay layers.
    if (car?.visual?.singleBody) return;

    // Single-layer modular cars use one complete base PNG plus independently
    // tintable visual-mod PNGs on the same canvas. No legacy paint/overlay or
    // stock aero textures are required.
    if (car?.visual?.singleLayerModular) return;

    // Some foldered cars use their coherent full preview as the geometry
    // authority and derive their stock modular textures from it at boot. This
    // guarantees every stock layer shares exactly the same source pixels.
    if (car?.visual?.deriveModularFromPreview) return;

    loadIfPresent(keys.paint, paths.paint);
    loadIfPresent(keys.overlay, paths.overlay);

    // Foldered modular cars can split stock aero from the permanent shell.
    // Every file uses the same canvas/origin, so replacement parts can later
    // swap only their own slot without scene-specific alignment code.
    loadIfPresent(keys.bodyKitPaint, paths.bodyKitPaint);
    loadIfPresent(keys.bodyKit, paths.bodyKit);
    loadIfPresent(keys.spoilerPaint, paths.spoilerPaint);
    loadIfPresent(keys.spoiler, paths.spoiler);
  });
}

function createCanvasTextureFromPixels(scene, key, width, height, pixels) {
  if (scene.textures.exists(key)) scene.textures.remove(key);

  const texture = scene.textures.createCanvas(key, width, height);
  const ctx = texture.getContext();
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
  texture.refresh();
  return texture;
}

function restoreSingleLayerDarkDetails(scene, car) {
  const visual = car?.visual || {};
  if (!visual.singleLayerModular) return false;
  const keys = getCarTextureKeys(car);
  if (!scene.textures.exists(keys.body)) return false;

  const source = scene.textures.get(keys.body).getSourceImage();
  const width = Number(source?.naturalWidth || source?.width || 0);
  const height = Number(source?.naturalHeight || source?.height || 0);
  if (!width || !height || typeof document === 'undefined') return false;

  // Do not chroma-key black. PNG alpha is authoritative. This pass exists
  // specifically to ensure Phaser never derives transparency from RGB value.
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const px = imageData.data;
    for (let i = 0; i < px.length; i += 4) {
      // Preserve all authored opaque/semitransparent pixels exactly,
      // including RGB 0/0/0. Never infer alpha from colour.
      if (px[i + 3] > 0) px[i + 3] = Math.max(px[i + 3], 1);
    }
    ctx.putImageData(imageData, 0, 0);
    const texture = scene.textures.createCanvas(keys.body + '_rgbaSafe', width, height);
    const tctx = texture.getContext();
    tctx.clearRect(0, 0, width, height);
    tctx.drawImage(canvas, 0, 0);
    texture.refresh();
    visual.runtimeBodyTextureKey = keys.body + '_rgbaSafe';
    return true;
  } catch (e) {
    return false;
  }
}

function deriveModularTexturesFromPreview(scene, car) {
  const visual = car?.visual || {};
  if (!visual.deriveModularFromPreview) return false;

  const keys = getCarTextureKeys(car);
  if (!scene.textures.exists(keys.body)) return false;

  const source = scene.textures.get(keys.body).getSourceImage();
  const width = Number(source?.naturalWidth || source?.width || 0);
  const height = Number(source?.naturalHeight || source?.height || 0);
  if (!width || !height || typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    const src = ctx.getImageData(0, 0, width, height).data;

    const paint = new Uint8ClampedArray(src.length);
    const overlay = new Uint8ClampedArray(src.length);
    const bodyKitPaint = new Uint8ClampedArray(src.length);
    const bodyKitPixels = new Uint8ClampedArray(src.length);
    const spoilerPaint = new Uint8ClampedArray(src.length);
    const spoiler = new Uint8ClampedArray(src.length);

    const copyPixel = (target, index) => {
      target[index] = src[index];
      target[index + 1] = src[index + 1];
      target[index + 2] = src[index + 2];
      target[index + 3] = src[index + 3];
    };

    // The AE86 master is a coherent completed sprite. We partition those exact
    // pixels rather than trying to line up independently-generated artwork.
    // Normalised geometry keeps the split stable if this master is re-exported
    // at another resolution with the same framing.
    const split = visual.derivedModularSplit || {};
    const spoilerBox = split.spoilerBox || {
      xMin: 0.045, xMax: 0.106,
      yMin: 0.390, yMax: 0.470,
    };
    const bodyKitConfig = split.bodyKit || {
      allBelowY: 0.560,
      darkFromY: 0.505,
      darkMax: 165,
    };

    for (let y = 0; y < height; y += 1) {
      const yn = y / height;
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        const a = src[i + 3];
        if (!a) continue;

        const r = src[i];
        const g = src[i + 1];
        const b = src[i + 2];
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const saturationSpan = maxC - minC;
        const xn = x / width;

        const inSpoiler = (
          xn >= spoilerBox.xMin && xn <= spoilerBox.xMax &&
          yn >= spoilerBox.yMin && yn <= spoilerBox.yMax
        );

        if (inSpoiler) {
          // White/light-grey spoiler faces are tintable; the dark lip/outline is fixed.
          if (saturationSpan < 55 && maxC > 120) copyPixel(spoilerPaint, i);
          else copyPixel(spoiler, i);
          continue;
        }

        const coloured = saturationSpan > 55 && maxC > 60;
        const inBodyKit = (
          yn >= bodyKitConfig.allBelowY ||
          (yn >= bodyKitConfig.darkFromY && (maxC < bodyKitConfig.darkMax || coloured))
        );

        if (inBodyKit) {
          // Stock AE86 lower aero is black/charcoal plastic in the master.
          // Keep the paint layer empty for stock; later aftermarket kits may
          // provide their own tintable bodyKitPaint PNG.
          copyPixel(bodyKitPixels, i);
          continue;
        }

        const paintLike = saturationSpan < 42 && maxC > 105;
        if (paintLike) copyPixel(paint, i);
        else copyPixel(overlay, i);
      }
    }

    createCanvasTextureFromPixels(scene, keys.paint, width, height, paint);
    createCanvasTextureFromPixels(scene, keys.overlay, width, height, overlay);
    createCanvasTextureFromPixels(scene, keys.bodyKitPaint, width, height, bodyKitPaint);
    createCanvasTextureFromPixels(scene, keys.bodyKit, width, height, bodyKitPixels);
    createCanvasTextureFromPixels(scene, keys.spoilerPaint, width, height, spoilerPaint);
    createCanvasTextureFromPixels(scene, keys.spoiler, width, height, spoiler);
    return true;
  } catch (error) {
    console.warn('Could not derive modular car textures', car?.id, error);
    return false;
  }
}

export function ensureDerivedModularCarTextures(scene, carMap = {}) {
  Object.values(carMap || {}).forEach(car => {
    if (car?.visual?.deriveModularFromPreview) {
      deriveModularTexturesFromPreview(scene, car);
    }
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
  if (visual.singleLayerModular) {
    const keys = getCarTextureKeys(visualOrCar);
    return Boolean(scene?.textures?.exists?.(keys.body));
  }

  const keys = getCarTextureKeys(visualOrCar);
  return Boolean(
    scene?.textures?.exists?.(keys.paint)
    && scene?.textures?.exists?.(keys.overlay)
  );
}

export function getCarBodyTextureKey(scene, visualOrCar) {
  const visual = visualOrCar?.visual || visualOrCar || {};
  const keys = getCarTextureKeys(visualOrCar);
  if (visual.singleLayerModular) return visual.runtimeBodyTextureKey || keys.body;
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
  const visual = visualOrCar?.visual || visualOrCar || {};

  if (visual.singleLayerModular || visualOrCar?.singleLayerModular) {
    const bodyKey = visual.runtimeBodyTextureKey || keys.body;
    const body = scene.add.image(x, y, bodyKey)
      .setScale(scale)
      .setFlipX(flipX)
      .setDepth(depth)
      .setTint(color);
    body.setData('carPaintLayer', true);
    body.setData('carBasePaintLayer', true);
    return {
      layered: true,
      primary: body,
      paint: body,
      overlay: null,
      bodyKitPaint: null,
      bodyKit: null,
      spoilerPaint: null,
      spoiler: null,
      stockSlots: { bodyKit: [], spoiler: [] },
      objects: [body],
    };
  }

  if (hasLayeredPaintAssets(scene, visualOrCar)) {
    const addLayer = (key, depthOffset, { tint = false, dataKey = null, slot = null } = {}) => {
      if (!scene?.textures?.exists?.(key)) return null;

      const image = scene.add.image(x, y, key)
        .setScale(scale)
        .setFlipX(flipX)
        .setDepth(depth + depthOffset);

      if (tint) {
        image.setTint(color);
        image.setData('carPaintLayer', true);
      }
      if (dataKey) image.setData(dataKey, true);
      if (slot) image.setData('carStockSlot', slot);
      return image;
    };

    // Paint first, then permanent linework, then the stock aero detail layers.
    // The paintable aero layers share the body tint but remain individually
    // addressable so a later aftermarket option can hide only that stock slot.
    const paint = addLayer(keys.paint, 0, { tint: true, dataKey: 'carBasePaintLayer' });
    const bodyKitPaint = addLayer(keys.bodyKitPaint, 0.003, { tint: true, slot: 'bodyKit' });
    const spoilerPaint = addLayer(keys.spoilerPaint, 0.004, { tint: true, slot: 'spoiler' });
    const overlay = addLayer(keys.overlay, 0.020, { dataKey: 'carOverlayLayer' });
    const bodyKit = addLayer(keys.bodyKit, 0.024, { slot: 'bodyKit' });
    const spoiler = addLayer(keys.spoiler, 0.026, { slot: 'spoiler' });

    const objects = [
      paint,
      bodyKitPaint,
      spoilerPaint,
      overlay,
      bodyKit,
      spoiler,
    ].filter(Boolean);

    return {
      layered: true,
      primary: paint,
      paint,
      overlay,
      bodyKitPaint,
      bodyKit,
      spoilerPaint,
      spoiler,
      stockSlots: {
        bodyKit: [bodyKitPaint, bodyKit].filter(Boolean),
        spoiler: [spoilerPaint, spoiler].filter(Boolean),
      },
      objects,
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
    bodyKitPaint: null,
    bodyKit: null,
    spoilerPaint: null,
    spoiler: null,
    stockSlots: { bodyKit: [], spoiler: [] },
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
