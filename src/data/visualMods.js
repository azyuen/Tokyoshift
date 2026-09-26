import { cars, carOrder } from './cars.js?v=20260927-r216';

// Complete replacement paint + outline pairs. Both kit layers share the stock
// canvas and inherit the stock paint image's exact transform in every scene.
export const VISUAL_MOD_SLOT_ORDER = ['spoiler', 'bodyKit', 'hoodScoop'];

const KIT_CAR_IDS = carOrder.filter(id => id !== 'r32');
export const VISUAL_MOD_CATALOG = Object.fromEntries(KIT_CAR_IDS.map(carId => {
  const stem = cars[carId].visual.assetStem;
  const kit = (number, price) => ({
    id: 'bodykit' + number,
    name: 'BODY KIT ' + number,
    price,
    replacementBody: true,
    // The uploaded 22B second kit is 1672×941. Fit its wheel arches to the
    // stock 1200×400 axle positions without distorting the artwork.
    transform: stem === '22b' && number === 2
      ? { sourceScale: 0.682, offsetX: 26, offsetY: 32 }
      : null,
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
  return VISUAL_MOD_CATALOG[carId] || null;
}

export function hasVisualMods(carId) {
  return Boolean(getVisualModCatalog(carId));
}

export function getVisualModSlotIds(carId) {
  const slots = getVisualModCatalog(carId)?.slots || {};
  return VISUAL_MOD_SLOT_ORDER.filter(id => Boolean(slots[id]));
}

export function preloadVisualModAssets(scene, cacheBust = '') {
  const suffix = cacheBust ? '?v=' + encodeURIComponent(cacheBust) : '';
  const queued = new Set();
  Object.values(VISUAL_MOD_CATALOG).forEach(catalog => {
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
    const transform = option.transform;
    const unit = base.displayWidth / 1200;
    const source = scene.textures.get(layer.textureKey).getSourceImage();
    const width = transform
      ? source.width * transform.sourceScale * unit
      : base.displayWidth;
    const height = transform
      ? source.height * transform.sourceScale * unit
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
