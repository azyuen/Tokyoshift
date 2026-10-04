import { cars, carOrder } from './cars.js?v=20261005-r345';
import { getWheelOption } from './wheels.js?v=20260929-r246';

// Complete replacement paint + outline pairs. Both kit layers share the stock
// canvas and inherit the stock paint image's exact transform in every scene.
export const VISUAL_MOD_SLOT_ORDER = ['spoiler', 'bodyKit', 'hoodScoop'];

// Each kit is fitted to its own model's stock wheel arches (source pixels).
const KIT_ALIGNMENT = {
  ae86: [{ scaleX: 1.0197, scaleY: 0.9892, offsetX: 5.5, offsetY: -1.9 }, { scaleX: 1.0166, scaleY: 0.9946, offsetX: 4.5, offsetY: 6.2 }],
  ef: [{ scaleX: 0.9905, scaleY: 1, offsetX: -1.5, offsetY: -3 }, { scaleX: 1.0055, scaleY: 1, offsetX: 4, offsetY: -1 }],
  ek9: [{ scaleX: 0.9986, scaleY: 1.0423, offsetX: -0.5, offsetY: 2.8 }, { scaleX: 1.0041, scaleY: 1.0314, offsetX: -1.4, offsetY: 11.2 }],
  evo3: [{ scaleX: 0.9695, scaleY: 1.0814, offsetX: -5.9, offsetY: 1.5 }, { scaleX: 1.0325, scaleY: 1.0814, offsetX: -14.4, offsetY: 0.4 }],
  evo5: [{ scaleX: 1.0142, scaleY: 1.0359, offsetX: 2.5, offsetY: 21.1 }, { scaleX: 1.0047, scaleY: 1.0359, offsetX: -0.5, offsetY: 46.5 }],
  evo6: [{ scaleX: 0.9848, scaleY: 0.9831, offsetX: -7.2, offsetY: -2.9 }, { scaleX: 0.9804, scaleY: 1.0419, offsetX: -12.6, offsetY: -4.3 }],
  evo9: [{ scaleX: 1, scaleY: 0.9653, offsetX: 2, offsetY: 2.5 }, { scaleX: 1.0284, scaleY: 0.9543, offsetX: -9.1, offsetY: 1.3 }],
};

// These cars have been authored around their stock-paint canvas. Every kit
// layer must inherit that stock layer's complete render transform verbatim.
// Add models here as their assets are normalised to the same convention.
const STOCK_CANVAS_KIT_CARS = new Set(['s2000', 'fc3s', 'rx7fd', 'wrx22b', 'evo3', 'evo5', 'evo9', 'rx8', '3000gt', 'r34', 'a60', 'ej1', 'jza80', 'nsx']);

// SpriteR-authored replacement cars share each model's stock canvas across
// stock/body-kit layers. Do not reintroduce per-kit scaling or offsets: the
// stock body transform and model-specific wheel geometry are the source of truth.
const KIT_WHEEL_GEOMETRY = {};
const KIT_CAR_IDS = carOrder.filter(id => id !== 'r32');
export const VISUAL_MOD_CATALOG = Object.fromEntries(KIT_CAR_IDS.map(carId => {
  const stem = cars[carId].visual.assetStem;
  const kit = (number, price) => ({
    id: 'bodykit' + number,
    name: 'BODY KIT ' + number,
    price,
    replacementBody: true,
    layoutMode: STOCK_CANVAS_KIT_CARS.has(carId) ? 'stock-canvas' : 'legacy-calibrated',
    transform: STOCK_CANVAS_KIT_CARS.has(carId)
      ? null
      : (KIT_ALIGNMENT[carId]?.[number - 1] || null),
    wheelGeometry: KIT_WHEEL_GEOMETRY[carId]?.[number - 1] || null,
    layers: [
      {
        textureKey: 'visualMod_' + stem + '_bodykit' + number + '_paint',
        path: 'assets/Cars/' + stem + '_bodykit' + number + '_paint.png',
        paintMode: 'body',
      },
      {
        textureKey: 'visualMod_' + stem + '_bodykit' + number + '_body',
        path: 'assets/Cars/' + stem + '_bodykit' + number + '_body.png',
        paintMode: 'fixed',
      },
    ],
  });
  return [carId, {
    slots: {
      bodyKit: {
        label: 'BODY KIT',
        options: [
          { id: 'stock', name: 'STOCK BODY', price: 0, layers: [] },
          kit(1, 65000),
          kit(2, 120000),
        ],
      },
    },
  }];
}));

export function getVisualModCatalog(carId) {
  const id = String(carId || '');
  const baseCarId = cars[id]?.crewBaseCarId;
  return VISUAL_MOD_CATALOG[id] ||
    (baseCarId ? VISUAL_MOD_CATALOG[baseCarId] : null) ||
    null;
}

export function hasVisualMods(carId) {
  return Boolean(getVisualModCatalog(carId));
}

export function getVisualModSlotIds(carId) {
  const slots = getVisualModCatalog(carId)?.slots || {};
  return VISUAL_MOD_SLOT_ORDER.filter(id => Boolean(slots[id]));
}

export function preloadVisualModAssets(scene, cacheBust = '', carIds = null) {
  const suffix = cacheBust ? '?v=' + encodeURIComponent(cacheBust) : '';
  const queued = new Set();
  const allowed = Array.isArray(carIds) && carIds.length
    ? new Set(carIds.map(String))
    : null;

  Object.entries(VISUAL_MOD_CATALOG).forEach(([carId, catalog]) => {
    if (allowed && !allowed.has(carId)) return;
    Object.values(catalog.slots).forEach(slot => {
      slot.options.forEach(option => {
        option.layers.forEach(layer => {
          if (queued.has(layer.textureKey) || scene.textures.exists(layer.textureKey)) return;
          queued.add(layer.textureKey);
          scene.load.image(layer.textureKey, layer.path + suffix);
        });
      });
    });
  });

  return queued.size;
}

export function preloadVisualModSelectionAssets(
  scene,
  carId,
  source = {},
  cacheBust = ''
) {
  const suffix = cacheBust ? '?v=' + encodeURIComponent(cacheBust) : '';
  const selected = normaliseVisualMods(carId, source);
  const queued = new Set();

  getVisualModSlotIds(carId).forEach(slotId => {
    const option = getVisualModOption(carId, slotId, selected[slotId]);
    (option?.layers || []).forEach(layer => {
      if (!layer?.textureKey || !layer?.path) return;
      if (scene.textures.exists(layer.textureKey) || queued.has(layer.textureKey)) return;
      queued.add(layer.textureKey);
      scene.load.image(layer.textureKey, layer.path + suffix);
    });
  });

  return queued.size;
}

export function getVisualModOptions(carId, slotId) {
  return getVisualModCatalog(carId)?.slots?.[slotId]?.options || [];
}

export function getVisualModOption(carId, slotId, optionId) {
  const options = getVisualModOptions(carId, slotId);
  return options.find(option => option.id === optionId) || options[0] || null;
}

export function normaliseVisualMods(carId, source = {}) {
  const input = source?.visualMods || source || {};
  const legacyBodyKit = {
    street: 'bodykit1',
    rocketBunny: 'bodykit2',
    streetAero: 'bodykit1',
    trackAero: 'bodykit2',
  };
  const result = {};
  VISUAL_MOD_SLOT_ORDER.forEach(slotId => {
    const requested = String(input?.[slotId] || 'stock');
    const migrated = slotId === 'bodyKit' ? (legacyBodyKit[requested] || requested) : requested;
    result[slotId] = getVisualModOptions(carId, slotId).some(option => option.id === migrated)
      ? migrated
      : 'stock';
  });
  return result;
}

export function hasNonStockVisualMods(carId, source = {}) {
  const mods = normaliseVisualMods(carId, source);
  return getVisualModSlotIds(carId).some(slotId => mods[slotId] !== 'stock');
}

// Resolve wheel geometry from the same body-kit selection used by the body
// renderer. Cars without a kit-specific calibration keep their stock visual.
export function getVisualModWheelVisual(car, source = {}) {
  const visual = car?.visual || {};
  const selected = normaliseVisualMods(car?.id, source);
  const option = getVisualModOption(car?.id, 'bodyKit', selected.bodyKit);
  const geometry = option?.wheelGeometry
    ? { ...visual, ...option.wheelGeometry }
    : { ...visual };
  const customWheel = getWheelOption(source?.customWheelId);

  return customWheel
    ? {
        ...geometry,
        wheelKey: customWheel.textureKey,
        wheelPath: customWheel.path,
      }
    : geometry;
}

export function getVisualModChangeCost(carId, currentSource = {}, pendingSource = {}) {
  const current = normaliseVisualMods(carId, currentSource);
  const pending = normaliseVisualMods(carId, pendingSource);
  return getVisualModSlotIds(carId).reduce((sum, slotId) => {
    if (current[slotId] === pending[slotId]) return sum;
    return sum + Math.max(0, Number(getVisualModOption(carId, slotId, pending[slotId])?.price || 0));
  }, 0);
}

// Assets are authored PNGs; there are no generated textures to prepare.
export function ensureVisualModTextures() {}

export function createVisualModLayers(
  scene, car, state = {},
  {
    paintColor = 0xffffff,
    visualMods = null,
    bodyLayers = null,
    depth = 0,
  } = {}
) {
  const selected = normaliseVisualMods(car?.id, visualMods || state);
  const option = getVisualModOption(car?.id, 'bodyKit', selected.bodyKit);
  if (!option?.replacementBody || !bodyLayers?.primary) return [];

  const [paintLayer, outlineLayer] = option.layers;
  // A missing upload must leave the stock car visible, not create an empty shell.
  if (!scene.textures.exists(paintLayer.textureKey) ||
      !scene.textures.exists(outlineLayer.textureKey)) return [];

  const base = bodyLayers.primary;
  const makeLayer = (layer, depthOffset) => {
    // A stock-canvas kit is not permitted to introduce any independent image
    // transform. This includes offsets, scale, origin, rotation and flipping.
    const transform = option.layoutMode === 'stock-canvas' ? null : option.transform;
    const unit = base.displayWidth / 1200;
    const source = scene.textures.get(layer.textureKey).getSourceImage();
    const width = transform
      ? source.width * transform.scaleX * unit
      : base.displayWidth;
    const height = transform
      ? source.height * transform.scaleY * unit
      : base.displayHeight;
    const x = base.x + (base.flipX ? -1 : 1) * (transform?.offsetX || 0) * unit;
    const y = base.y + (transform?.offsetY || 0) * unit;
    const image = scene.add.image(x, y, layer.textureKey)
      .setOrigin(base.originX, base.originY)
      .setRotation(base.rotation)
      .setFlipX(base.flipX)
      .setFlipY(base.flipY)
      .setDisplaySize(width, height)
      .setDepth(depth + depthOffset)
      .setAlpha(1)
      .setBlendMode(Phaser.BlendModes.NORMAL);
    if (layer.paintMode === 'body') {
      image.setTint(paintColor);
      image.setData('carPaintLayer', true);
    }
    return image;
  };

  const pair = [makeLayer(paintLayer, 0), makeLayer(outlineLayer, 0.025)];
  (bodyLayers.objects || []).forEach(object => object?.setVisible?.(false));
  return pair;
}
