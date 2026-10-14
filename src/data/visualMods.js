import { cars, carOrder } from './cars.js?v=20261011-r479';
import { getWheelOption } from './wheels.js?v=20260929-r246';

// Complete replacement paint + outline pairs. Both kit layers share the stock
// canvas and inherit the stock paint image's exact transform in every scene.
export const VISUAL_MOD_SLOT_ORDER = ['spoiler', 'bodyKit', 'hoodScoop'];

// Each kit is fitted to its own model's stock wheel arches (source pixels).
const KIT_ALIGNMENT = {
  ae86: [{ scaleX: 1.0197, scaleY: 0.9892, offsetX: 5.5, offsetY: -1.9 }, { scaleX: 1.0166, scaleY: 0.9946, offsetX: 4.5, offsetY: 6.2 }],
  ef: [{ scaleX: 0.9905, scaleY: 1, offsetX: -1.5, offsetY: -3 }, { scaleX: 1.0055, scaleY: 1, offsetX: 4, offsetY: -1 }],
  ek9: [{ scaleX: 0.9986, scaleY: 1.0423, offsetX: -0.5, offsetY: 2.8 }, { scaleX: 1.0041, scaleY: 1.0314, offsetX: -1.4, offsetY: 11.2 }],
  galant: [{ scaleX: 0.9695, scaleY: 1.0814, offsetX: -5.9, offsetY: 1.5 }, { scaleX: 1.0325, scaleY: 1.0814, offsetX: -14.4, offsetY: 0.4 }],
  evo5: [{ scaleX: 1.0142, scaleY: 1.0359, offsetX: 2.5, offsetY: 21.1 }, { scaleX: 1.0047, scaleY: 1.0359, offsetX: -0.5, offsetY: 46.5 }],
  evo6: [{ scaleX: 0.9848, scaleY: 0.9831, offsetX: -7.2, offsetY: -2.9 }, { scaleX: 0.9804, scaleY: 1.0419, offsetX: -12.6, offsetY: -4.3 }],
};

// These cars have been authored around their stock-paint canvas. Every kit
// layer must inherit that stock layer's complete render transform verbatim.
// Add models here as their assets are normalised to the same convention.
const STOCK_CANVAS_KIT_CARS = new Set(['s2000', 'fc3s', 'rx7fd', 'gc8', 'galant', 'evo5', 'rx8', '3000gt', 'r34', 'a60', 'jza80', 'nsx']);

// SpriteR-authored replacement cars share each model's stock canvas across
// stock/body-kit layers. Do not reintroduce per-kit scaling or offsets: the
// stock body transform and model-specific wheel geometry are the source of truth.
const KIT_WHEEL_GEOMETRY = {};
const KIT_CAR_IDS = carOrder.filter(id => id !== 'r32' && !cars[id].visual?.referenceStandard);
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

// Retired R501: the old bodykit PNGs do not fit the Ref2 sprites.
// Keep source catalogue above for later re-authoring, but offer no kits now.
export function getVisualModCatalog(_carId) {
  return null;
}

export function hasVisualMods(carId) {
  return Boolean(getVisualModCatalog(carId));
}

export function getVisualModSlotIds(carId) {
  const slots = getVisualModCatalog(carId)?.slots || {};
  return VISUAL_MOD_SLOT_ORDER.filter(id => Boolean(slots[id]));
}

export function preloadVisualModAssets(_scene, _cacheBust = '', _carIds = null) {
  return 0;
}

export function preloadVisualModSelectionAssets(_scene, _carId, _source = {}, _cacheBust = '') {
  return 0;
}

export function getVisualModOptions(carId, slotId) {
  return getVisualModCatalog(carId)?.slots?.[slotId]?.options || [];
}

export function getVisualModOption(carId, slotId, optionId) {
  const options = getVisualModOptions(carId, slotId);
  return options.find(option => option.id === optionId) || options[0] || null;
}

export function normaliseVisualMods(_carId, _source = {}) {
  // Existing bodykit selections are overridden to stock. Custom wheel IDs
  // are entirely separate and intentionally remain unchanged.
  return { spoiler: 'stock', bodyKit: 'stock', hoodScoop: 'stock' };
}

export function hasNonStockVisualMods(carId, source = {}) {
  const mods = normaliseVisualMods(carId, source);
  return getVisualModSlotIds(carId).some(slotId => mods[slotId] !== 'stock');
}

// Resolve wheel geometry from the same body-kit selection used by the body
// renderer. Cars without a kit-specific calibration keep their stock visual.
export function getVisualModWheelVisual(car, source = {}) {
  const visual = car?.visual || {};
  const customWheel = getWheelOption(source?.customWheelId);
  return customWheel
    ? { ...visual, wheelKey: customWheel.textureKey, wheelPath: customWheel.path }
    : { ...visual };
}

export function getVisualModChangeCost(_carId, _currentSource = {}, _pendingSource = {}) {
  return 0;
}

// Assets are authored PNGs; there are no generated textures to prepare.
export function ensureVisualModTextures() {}

// All production renderers call this helper. One central no-op guarantees
// legacy kits never obscure newly anchored stock cars, including in races.
export function createVisualModLayers(_scene, _car, _state = {}, _options = {}) {
  return [];
}
