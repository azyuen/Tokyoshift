// Visual modification system.
//
// Designed so every modifiable car can opt into the same three independent
// slots without scene-specific code. Final production assets should be
// transparent PNGs on the exact same canvas as the car body. The Evo III uses
// runtime-generated proof-of-concept textures so the architecture can be
// validated before we invest in final art.

export const VISUAL_MOD_SLOT_ORDER = ['spoiler', 'bodyKit', 'hoodScoop'];

export const VISUAL_MOD_CATALOG = {
  evo3: {
    protectedTextureKey: 'visualMod_evo3_protected',
    protectedSourceKey: 'carOverlay_evo_iii',
    slots: {
      spoiler: {
        label: 'SPOILER',
        options: [
          { id: 'stock', name: 'STOCK WING', price: 0, layers: [] },
          {
            id: 'rallyHigh',
            name: 'HIGH RALLY WING',
            price: 60000,
            layers: [
              { textureKey: 'visualMod_evo3_spoiler_rally', paintMode: 'body' },
              { textureKey: 'visualMod_evo3_spoiler_rally_detail', paintMode: 'fixed' },
            ],
          },
          {
            id: 'gtWing',
            name: 'GT WING',
            price: 120000,
            layers: [
              { textureKey: 'visualMod_evo3_spoiler_gt', paintMode: 'fixed' },
            ],
          },
        ],
      },
      bodyKit: {
        label: 'BODY KIT',
        options: [
          { id: 'stock', name: 'STOCK AERO', price: 0, layers: [] },
          {
            id: 'streetAero',
            name: 'STREET AERO KIT',
            price: 160000,
            layers: [
              { textureKey: 'visualMod_evo3_bodykit_street', paintMode: 'body' },
              { textureKey: 'visualMod_evo3_bodykit_street_detail', paintMode: 'fixed' },
            ],
          },
          {
            id: 'trackAero',
            name: 'TRACK AERO KIT',
            price: 260000,
            layers: [
              { textureKey: 'visualMod_evo3_bodykit_track', paintMode: 'body' },
              { textureKey: 'visualMod_evo3_bodykit_track_detail', paintMode: 'fixed' },
            ],
          },
        ],
      },
      hoodScoop: {
        label: 'HOOD SCOOP',
        options: [
          { id: 'stock', name: 'STOCK HOOD', price: 0, layers: [] },
          {
            id: 'rallyScoop',
            name: 'RALLY SCOOP',
            price: 45000,
            layers: [
              { textureKey: 'visualMod_evo3_scoop_rally', paintMode: 'body' },
              { textureKey: 'visualMod_evo3_scoop_rally_detail', paintMode: 'fixed' },
            ],
          },
          {
            id: 'ventedScoop',
            name: 'VENTED SCOOP',
            price: 75000,
            layers: [
              { textureKey: 'visualMod_evo3_scoop_vented', paintMode: 'fixed' },
            ],
          },
        ],
      },
    },
  },

  ae86: {
    // R177 production experiment: one transparent PNG per option.
    // White/light-grey pixels receive the Phaser body tint; black/dark
    // linework remains dark because tinting is multiplicative.
    // All assets share the exact 1774×887 AE86 master canvas.
    slots: {
      spoiler: {
        label: 'SPOILER',
        options: [
          { id: 'stock', name: 'STOCK WING', price: 0, layers: [] },
          {
            id: 'gtWing',
            name: 'TIME ATTACK GT WING',
            price: 35000,
            layers: [
              {
                textureKey: 'visualMod_ae86_spoiler_1',
                path: 'assets/Cars/ae86/ae86_spoiler_1.png',
                paintMode: 'body',
              },
            ],
          },
          {
            id: 'ducktail',
            name: 'EXTENDED DUCKTAIL',
            price: 28000,
            layers: [
              {
                textureKey: 'visualMod_ae86_spoiler_2',
                path: 'assets/Cars/ae86/ae86_spoiler_2.png',
                paintMode: 'body',
              },
            ],
          },
        ],
      },
      bodyKit: {
        label: 'BODY KIT',
        options: [
          { id: 'stock', name: 'STOCK AERO', price: 0, layers: [] },
          {
            id: 'rivetWidebody',
            name: 'RIVET WIDEBODY',
            price: 65000,
            layers: [
              {
                textureKey: 'visualMod_ae86_bodykit_1',
                path: 'assets/Cars/ae86/ae86_bodykit_1.png',
                paintMode: 'body',
              },
            ],
          },
          {
            id: 'aeroWidebody',
            name: 'AERO WIDEBODY',
            price: 90000,
            layers: [
              {
                textureKey: 'visualMod_ae86_bodykit_2',
                path: 'assets/Cars/ae86/ae86_bodykit_2.png',
                paintMode: 'body',
              },
            ],
          },
        ],
      },
    },
  },
};

export function getVisualModCatalog(carId) {
  return VISUAL_MOD_CATALOG[carId] || null;
}

export function hasVisualMods(carId) {
  return Boolean(getVisualModCatalog(carId));
}

export function getVisualModSlotIds(carId) {
  const catalog = getVisualModCatalog(carId);
  return VISUAL_MOD_SLOT_ORDER.filter(slotId => Boolean(catalog?.slots?.[slotId]));
}

export function preloadVisualModAssets(scene, cacheBust = '') {
  const suffix = cacheBust ? '?v=' + encodeURIComponent(cacheBust) : '';
  const queued = new Set();

  Object.values(VISUAL_MOD_CATALOG).forEach(catalog => {
    Object.values(catalog?.slots || {}).forEach(slot => {
      (slot?.options || []).forEach(option => {
        (option?.layers || []).forEach(layer => {
          if (!layer?.path || !layer?.textureKey) return;
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
  const catalog = getVisualModCatalog(carId);
  const result = {};

  VISUAL_MOD_SLOT_ORDER.forEach(slotId => {
    const options = catalog?.slots?.[slotId]?.options || [];
    const requested = String(input?.[slotId] || 'stock');
    result[slotId] = options.some(option => option.id === requested)
      ? requested
      : 'stock';
  });

  return result;
}

export function hasNonStockVisualMods(carId, source = {}) {
  const mods = normaliseVisualMods(carId, source);
  return VISUAL_MOD_SLOT_ORDER.some(slotId => mods[slotId] !== 'stock');
}

export function getVisualModChangeCost(carId, currentSource = {}, pendingSource = {}) {
  const current = normaliseVisualMods(carId, currentSource);
  const pending = normaliseVisualMods(carId, pendingSource);

  return getVisualModSlotIds(carId).reduce((sum, slotId) => {
    if (current[slotId] === pending[slotId]) return sum;
    const option = getVisualModOption(carId, slotId, pending[slotId]);
    return sum + Math.max(0, Number(option?.price || 0));
  }, 0);
}

function makeGraphicsTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g, width, height);
  g.generateTexture(key, width, height);
  g.destroy();
}

function fillPoly(g, colour, alpha, points) {
  g.fillStyle(colour, alpha);
  g.fillPoints(points.map(([x, y]) => new Phaser.Geom.Point(x, y)), true);
}

function linePoly(g, colour, alpha, width, points, close = false) {
  g.lineStyle(width, colour, alpha);
  g.strokePoints(points.map(([x, y]) => new Phaser.Geom.Point(x, y)), close);
}

function ensureEvoProtectedTexture(scene, width, height) {
  const catalog = VISUAL_MOD_CATALOG.evo3;
  const targetKey = catalog.protectedTextureKey;
  if (scene.textures.exists(targetKey)) return;

  const sourceKey = catalog.protectedSourceKey;
  if (!scene.textures.exists(sourceKey)) return;

  const source = scene.textures.get(sourceKey).getSourceImage();
  const texture = scene.textures.createCanvas(targetKey, width, height);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, width, height);

  // Copy only the details that should always survive paint/aero overlays:
  // windows/frames, mirror, door handles/lock and front/rear lights.
  const regions = [
    [0.13, 0.27, 0.61, 0.24], // glass + pillars
    [0.58, 0.34, 0.09, 0.16], // mirror
    [0.02, 0.43, 0.10, 0.13], // rear lights
    [0.87, 0.47, 0.12, 0.13], // headlights/indicator
    [0.25, 0.46, 0.10, 0.09], // rear door handle
    [0.43, 0.46, 0.11, 0.09], // front door handle + lock
  ];

  regions.forEach(([rx, ry, rw, rh]) => {
    const sx = Math.round(width * rx);
    const sy = Math.round(height * ry);
    const sw = Math.round(width * rw);
    const sh = Math.round(height * rh);
    ctx.drawImage(source, sx, sy, sw, sh, sx, sy, sw, sh);
  });

  texture.refresh();
}

export function ensureVisualModTextures(scene) {
  const sourceKey = 'carOverlay_evo_iii';
  if (!scene.textures.exists(sourceKey)) return;

  const source = scene.textures.get(sourceKey).getSourceImage();
  const width = source.width;
  const height = source.height;

  ensureEvoProtectedTexture(scene, width, height);

  // Spoiler 1: body-colour high rally wing with dark brackets.
  makeGraphicsTexture(scene, 'visualMod_evo3_spoiler_rally', width, height, (g, w, h) => {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(w * 0.030, h * 0.255, w * 0.145, h * 0.032, 8);
    fillPoly(g, 0xf3f3f3, 1, [
      [w * 0.055, h * 0.286],
      [w * 0.078, h * 0.286],
      [w * 0.085, h * 0.370],
      [w * 0.062, h * 0.370],
    ]);
    fillPoly(g, 0xf3f3f3, 1, [
      [w * 0.132, h * 0.286],
      [w * 0.150, h * 0.286],
      [w * 0.150, h * 0.350],
      [w * 0.132, h * 0.350],
    ]);
  });

  makeGraphicsTexture(scene, 'visualMod_evo3_spoiler_rally_detail', width, height, (g, w, h) => {
    g.lineStyle(Math.max(2, w * 0.002), 0x151a20, 0.95);
    g.strokeRoundedRect(w * 0.030, h * 0.255, w * 0.145, h * 0.032, 8);
    linePoly(g, 0x151a20, 0.95, Math.max(2, w * 0.002), [
      [w * 0.055, h * 0.286], [w * 0.078, h * 0.286], [w * 0.085, h * 0.370]
    ]);
    linePoly(g, 0x151a20, 0.95, Math.max(2, w * 0.002), [
      [w * 0.132, h * 0.286], [w * 0.150, h * 0.286], [w * 0.150, h * 0.350]
    ]);
  });

  // Spoiler 2: fixed dark GT wing.
  makeGraphicsTexture(scene, 'visualMod_evo3_spoiler_gt', width, height, (g, w, h) => {
    g.fillStyle(0x15191f, 1);
    g.fillRoundedRect(w * 0.015, h * 0.225, w * 0.185, h * 0.036, 7);
    g.fillStyle(0x232a32, 1);
    g.fillRect(w * 0.062, h * 0.257, w * 0.018, h * 0.118);
    g.fillRect(w * 0.143, h * 0.257, w * 0.018, h * 0.097);
    g.lineStyle(Math.max(2, w * 0.002), 0x626d78, 0.9);
    g.strokeRoundedRect(w * 0.015, h * 0.225, w * 0.185, h * 0.036, 7);
  });

  // Street body kit: one option controls rear, side and front aero together.
  makeGraphicsTexture(scene, 'visualMod_evo3_bodykit_street', width, height, (g, w, h) => {
    fillPoly(g, 0xffffff, 1, [
      [w * 0.015, h * 0.655], [w * 0.145, h * 0.655],
      [w * 0.140, h * 0.755], [w * 0.030, h * 0.775], [w * 0.012, h * 0.730]
    ]);
    fillPoly(g, 0xffffff, 1, [
      [w * 0.292, h * 0.704], [w * 0.710, h * 0.704],
      [w * 0.700, h * 0.785], [w * 0.302, h * 0.785]
    ]);
    fillPoly(g, 0xffffff, 1, [
      [w * 0.888, h * 0.690], [w * 0.985, h * 0.690],
      [w * 0.995, h * 0.765], [w * 0.895, h * 0.765]
    ]);
  });

  makeGraphicsTexture(scene, 'visualMod_evo3_bodykit_street_detail', width, height, (g, w, h) => {
    g.fillStyle(0x151a20, 0.95);
    g.fillRoundedRect(w * 0.318, h * 0.758, w * 0.350, h * 0.015, 4);
    g.fillRoundedRect(w * 0.906, h * 0.744, w * 0.070, h * 0.014, 4);
    g.fillRoundedRect(w * 0.030, h * 0.748, w * 0.090, h * 0.014, 4);
  });

  // Track kit: deeper skirts + dark splitters/canards.
  makeGraphicsTexture(scene, 'visualMod_evo3_bodykit_track', width, height, (g, w, h) => {
    fillPoly(g, 0xf4f4f4, 1, [
      [w * 0.012, h * 0.640], [w * 0.150, h * 0.640],
      [w * 0.145, h * 0.785], [w * 0.020, h * 0.805], [w * 0.008, h * 0.735]
    ]);
    fillPoly(g, 0xf4f4f4, 1, [
      [w * 0.287, h * 0.690], [w * 0.718, h * 0.690],
      [w * 0.708, h * 0.812], [w * 0.298, h * 0.812]
    ]);
    fillPoly(g, 0xf4f4f4, 1, [
      [w * 0.882, h * 0.670], [w * 0.990, h * 0.670],
      [w * 0.998, h * 0.795], [w * 0.892, h * 0.795]
    ]);
  });

  makeGraphicsTexture(scene, 'visualMod_evo3_bodykit_track_detail', width, height, (g, w, h) => {
    g.fillStyle(0x11151a, 1);
    g.fillRoundedRect(w * 0.300, h * 0.790, w * 0.405, h * 0.020, 5);
    g.fillRoundedRect(w * 0.888, h * 0.777, w * 0.108, h * 0.018, 5);
    g.fillRoundedRect(w * 0.014, h * 0.788, w * 0.130, h * 0.018, 5);
    fillPoly(g, 0x171c22, 1, [
      [w * 0.918, h * 0.655], [w * 0.972, h * 0.635], [w * 0.973, h * 0.650]
    ]);
    fillPoly(g, 0x171c22, 1, [
      [w * 0.922, h * 0.675], [w * 0.976, h * 0.657], [w * 0.976, h * 0.672]
    ]);
  });

  // Hood scoop options.
  makeGraphicsTexture(scene, 'visualMod_evo3_scoop_rally', width, height, (g, w, h) => {
    fillPoly(g, 0xffffff, 1, [
      [w * 0.760, h * 0.430], [w * 0.845, h * 0.420],
      [w * 0.875, h * 0.463], [w * 0.765, h * 0.472]
    ]);
  });

  makeGraphicsTexture(scene, 'visualMod_evo3_scoop_rally_detail', width, height, (g, w, h) => {
    fillPoly(g, 0x11151a, 1, [
      [w * 0.775, h * 0.438], [w * 0.842, h * 0.431],
      [w * 0.856, h * 0.451], [w * 0.782, h * 0.458]
    ]);
  });

  makeGraphicsTexture(scene, 'visualMod_evo3_scoop_vented', width, height, (g, w, h) => {
    g.fillStyle(0x161b21, 1);
    for (let i = 0; i < 4; i += 1) {
      g.fillRoundedRect(
        w * (0.770 + i * 0.022),
        h * (0.432 + i * 0.002),
        w * 0.016,
        h * 0.040,
        5
      );
    }
  });
}

export function createVisualModLayers(
  scene,
  car,
  state = {},
  {
    x = 0,
    y = 0,
    scale = 1,
    depth = 0,
    paintColor = 0xffffff,
    visualMods = null,
    bodyLayers = null,
    flipX = false,
  } = {}
) {
  const catalog = getVisualModCatalog(car?.id);
  if (!catalog) return [];

  const selected = normaliseVisualMods(car.id, visualMods || state);
  const slotIds = getVisualModSlotIds(car.id);
  const active = slotIds.some(slotId => selected[slotId] !== 'stock');
  if (!active) return [];

  const objects = [];

  slotIds.forEach((slotId, slotIndex) => {
    const option = getVisualModOption(car.id, slotId, selected[slotId]);
    (option?.layers || []).forEach((layer, layerIndex) => {
      if (!scene.textures.exists(layer.textureKey)) return;
      const layerScaleX = Number(layer.scaleX ?? 1);
      const layerScaleY = Number(layer.scaleY ?? 1);
      const offsetX = Number(layer.offsetX ?? 0) * scale * (flipX ? -1 : 1);
      const offsetY = Number(layer.offsetY ?? 0) * scale;

      const image = scene.add.image(x + offsetX, y + offsetY, layer.textureKey)
        .setFlipX(flipX)
        .setDepth(depth + slotIndex * 0.002 + layerIndex * 0.0005);

      // Full-canvas modular parts are registered to the base car canvas.
      // Size them to the rendered base rather than trusting the source PNG
      // dimensions. This keeps overlays pixel-registered even if an export
      // accidentally changed the PNG canvas resolution.
      if (car?.visual?.singleLayerModular && bodyLayers?.primary) {
        image.setDisplaySize(
          bodyLayers.primary.displayWidth * layerScaleX,
          bodyLayers.primary.displayHeight * layerScaleY
        );
      } else {
        image.setScale(scale * layerScaleX, scale * layerScaleY);
      }

      if (layer.paintMode === 'body') {
        image.setTint(paintColor);
        image.setData('carPaintLayer', true);
      }

      objects.push(image);
    });
  });

  // Foldered modular cars expose their stock aero as named slots. Hide only
  // the stock slot being replaced, leaving the permanent shell/overlay intact.
  // This makes future AE86 body-kit/spoiler PNGs true drop-in replacements.
  Object.entries(bodyLayers?.stockSlots || {}).forEach(([slotId, slotObjects]) => {
    const replacingStock = selected?.[slotId] && selected[slotId] !== 'stock';
    (slotObjects || []).forEach(obj => obj?.setVisible?.(!replacingStock));
  });
  // The normal overlay contains some stock bumper/skirt artwork that would
  // fight the body kit. While visual mods are active, swap it for a protected
  // detail layer containing only glass, lights, mirror and handles.
  if (
    bodyLayers?.overlay &&
    catalog.protectedTextureKey &&
    scene.textures.exists(catalog.protectedTextureKey)
  ) {
    bodyLayers.overlay.setVisible(false);
    const protectedDetails = scene.add.image(x, y, catalog.protectedTextureKey)
      .setScale(scale)
      .setDepth(depth + 0.02);
    protectedDetails.setData('visualModProtectedLayer', true);
    objects.push(protectedDetails);
  }

  return objects;
}
