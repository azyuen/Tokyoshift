// Lightweight tuner-house decal overlay system.
//
// Decal placements live on each owned car's state so opponent cars that share
// the same model id never inherit the player's stickers. Coordinates are stored
// normalised against the rendered body image, making them portable across
// garage, race and tuner-shop display scales.

export const TUNER_DECAL_STYLES = {
  esprit: {
    id: 'esprit',
    label: 'ESPRIT',
    color: '#F4F5F6',
    textureKey: 'tunerDecalEsprit',
    suggestedPath: 'assets/Decals/esprit.png',
  },
  jun: {
    id: 'jun',
    label: 'JUN',
    color: '#F2C230',
    textureKey: 'tunerDecalJun',
    suggestedPath: 'assets/Decals/jun.png',
  },
};

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, Number(value) || 0));

export function normaliseTunerDecals(carState = {}) {
  const source = carState?.tunerDecals && typeof carState.tunerDecals === 'object'
    ? carState.tunerDecals
    : {};

  const result = {};

  Object.entries(source).forEach(([decalId, raw]) => {
    if (!raw || typeof raw !== 'object') return;

    result[decalId] = {
      x: clamp(raw.x ?? 0.05, -0.42, 0.42),
      y: clamp(raw.y ?? -0.02, -0.30, 0.30),
      scale: clamp(raw.scale ?? 0.13, 0.055, 0.24),
      rotation: clamp(raw.rotation ?? 0, -35, 35),
    };
  });

  return result;
}

export function hasTunerDecal(carState = {}, decalId) {
  return Boolean(normaliseTunerDecals(carState)[decalId]);
}

export function withTunerDecal(carState = {}, decalId, placement = null) {
  const decals = normaliseTunerDecals(carState);

  if (!placement) {
    delete decals[decalId];
  } else {
    decals[decalId] = normaliseTunerDecals({
      tunerDecals: { [decalId]: placement },
    })[decalId];
  }

  return {
    ...carState,
    tunerDecals: decals,
  };
}

export function carHasShopTune(carState = {}, shop = null) {
  if (!shop) return false;

  const installed = new Set(
    Array.isArray(carState?.specialistTuning)
      ? carState.specialistTuning.map(String)
      : Object.entries(carState?.specialistTuning || {})
          .filter(([, value]) => Boolean(value))
          .map(([id]) => id)
  );

  return (shop.tuningOptions || []).some(option => installed.has(option.id));
}

export function createTunerDecalObject(
  scene,
  decalId,
  {
    x = 0,
    y = 0,
    displayWidth = 600,
    depth = 20,
    placement = {},
    flipX = false,
  } = {}
) {
  const style = TUNER_DECAL_STYLES[decalId] || {
    id: decalId,
    label: String(decalId || 'TUNER').toUpperCase(),
    color: '#FFFFFF',
    textureKey: '',
  };

  const normalised = {
    x: Number(placement.x || 0),
    y: Number(placement.y || 0),
    scale: clamp(placement.scale ?? 0.13, 0.055, 0.24),
    rotation: clamp(placement.rotation ?? 0, -35, 35),
  };

  let object;

  if (style.textureKey && scene.textures.exists(style.textureKey)) {
    object = scene.add.image(x, y, style.textureKey).setOrigin(0.5);
  } else {
    // Safe fallback until final transparent shop-logo PNGs are uploaded.
    object = scene.add.text(x, y, style.label, {
      fontFamily: '"Teko", "Arial Black", sans-serif',
      fontSize: '44px',
      fontStyle: '700',
      color: style.color,
      stroke: '#101010',
      strokeThickness: 2,
      padding: { x: 2, y: 0 },
    }).setOrigin(0.5);
  }

  const rawWidth = Math.max(1, Number(object.width || object.displayWidth || 1));
  const targetWidth = Math.max(22, Number(displayWidth || 600) * normalised.scale);
  object.setScale(targetWidth / rawWidth);
  object.setDepth(depth);
  object.setRotation(
    Phaser.Math.DegToRad(normalised.rotation * (flipX ? -1 : 1))
  );

  return object;
}

export function createTunerDecalLayers(
  scene,
  carState = {},
  {
    x = 0,
    y = 0,
    displayWidth = 600,
    displayHeight = 300,
    depth = 20,
    flipX = false,
  } = {}
) {
  const decals = normaliseTunerDecals(carState);

  return Object.entries(decals).map(([decalId, placement]) => {
    const px = x + (flipX ? -placement.x : placement.x) * displayWidth;
    const py = y + placement.y * displayHeight;

    return createTunerDecalObject(scene, decalId, {
      x: px,
      y: py,
      displayWidth,
      depth,
      placement,
      flipX,
    });
  });
}
