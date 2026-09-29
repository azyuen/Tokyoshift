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
    color: '#FFFFFF',
    textureKey: 'tunerDecalEsprit',
    suggestedPath: 'assets/Decals/esprit.png',
  },
  jun: {
    id: 'jun',
    label: 'JUN',
    color: '#FFFFFF',
    textureKey: 'tunerDecalJun',
    suggestedPath: 'assets/Decals/jun.png',
  },
  amuse: {
    id: 'amuse',
    label: 'AMUSE',
    color: '#FFFFFF',
    textureKey: 'tunerDecalAmuse',
    suggestedPath: 'assets/Decals/amuse.png',
  },
  topSecret: {
    id: 'topSecret',
    label: 'TOP SECRET',
    color: '#FFFFFF',
    textureKey: 'tunerDecalTopSecret',
    suggestedPath: 'assets/Decals/top_secret.png',
  },
  mines: {
    id: 'mines',
    label: "MINE'S",
    color: '#FFFFFF',
    textureKey: 'tunerDecalMines',
    suggestedPath: 'assets/Decals/mines.png',
  },
  reAmemiya: {
    id: 'reAmemiya',
    label: 'RE AMEMIYA',
    color: '#FFFFFF',
    textureKey: 'tunerDecalReAmemiya',
    suggestedPath: 'assets/Decals/re_amemiya.png',
  },
  spoon: {
    id: 'spoon',
    label: 'SPOON',
    color: '#FFFFFF',
    textureKey: 'tunerDecalSpoon',
    suggestedPath: 'assets/Decals/spoon.png',
  },
};

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, Number(value) || 0));

const normaliseHex = (value, fallback = '#FFFFFF') => {
  const raw = String(value || '').trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(raw)) return raw;
  if (/^#[0-9A-F]{3}$/.test(raw)) {
    return '#' + raw.slice(1).split('').map(ch => ch + ch).join('');
  }
  return fallback;
};

const hexToTint = color =>
  Number.parseInt(normaliseHex(color).slice(1), 16);

export function normaliseTunerDecals(carState = {}) {
  const source = carState?.tunerDecals && typeof carState.tunerDecals === 'object'
    ? carState.tunerDecals
    : {};

  const result = {};

  Object.entries(source).forEach(([decalId, raw]) => {
    if (!raw || typeof raw !== 'object') return;
    const style = TUNER_DECAL_STYLES[decalId];

    result[decalId] = {
      x: clamp(raw.x ?? 0.05, -0.42, 0.42),
      y: clamp(raw.y ?? -0.02, -0.30, 0.30),
      scale: clamp(raw.scale ?? 0.13, 0.055, 0.24),
      rotation: clamp(raw.rotation ?? 0, -35, 35),
      color: normaliseHex(raw.color, style?.color || '#FFFFFF'),
    };
  });

  return result;
}

export function preloadTunerDecalAssets(scene, carState = {}, cacheBust = '') {
  const suffix = cacheBust ? '?v=' + encodeURIComponent(cacheBust) : '';
  const decals = normaliseTunerDecals(carState);
  let queued = 0;

  Object.keys(decals).forEach(decalId => {
    const style = TUNER_DECAL_STYLES[decalId];
    if (!style?.textureKey || !style?.suggestedPath) return;
    if (scene.textures.exists(style.textureKey)) return;
    scene.load.image(style.textureKey, style.suggestedPath + suffix);
    queued += 1;
  });

  return queued;
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

export function setTunerDecalObjectColor(object, color = '#FFFFFF') {
  if (!object) return object;

  const safe = normaliseHex(color);

  if (object.__tunerDecalUsesTexture && typeof object.setTint === 'function') {
    object.setTint(hexToTint(safe));
  } else if (typeof object.setColor === 'function') {
    object.setColor(safe);
  } else if (typeof object.setTint === 'function') {
    object.setTint(hexToTint(safe));
  }

  object.__tunerDecalColor = safe;
  return object;
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
    color: normaliseHex(placement.color, style.color || '#FFFFFF'),
  };

  let object;

  if (style.textureKey && scene.textures.exists(style.textureKey)) {
    object = scene.add.image(x, y, style.textureKey).setOrigin(0.5);
    object.__tunerDecalUsesTexture = true;
  } else {
    // Safe fallback until the final transparent white shop-logo PNG is supplied.
    object = scene.add.text(x, y, style.label, {
      fontFamily: '"Teko", "Arial Black", sans-serif',
      fontSize: '44px',
      fontStyle: '700',
      color: normalised.color,
      padding: { x: 2, y: 0 },
    }).setOrigin(0.5);
    object.__tunerDecalUsesTexture = false;
  }

  const rawWidth = Math.max(1, Number(object.width || object.displayWidth || 1));
  const targetWidth = Math.max(22, Number(displayWidth || 600) * normalised.scale);
  object.setScale(targetWidth / rawWidth);
  object.setDepth(depth);
  object.setRotation(
    Phaser.Math.DegToRad(normalised.rotation * (flipX ? -1 : 1))
  );
  setTunerDecalObjectColor(object, normalised.color);

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
    const offsetX = (flipX ? -placement.x : placement.x) * displayWidth;
    const offsetY = placement.y * displayHeight;
    const px = x + offsetX;
    const py = y + offsetY;

    const object = createTunerDecalObject(scene, decalId, {
      x: px,
      y: py,
      displayWidth,
      depth,
      placement,
      flipX,
    });

    // Keep the decal's body-relative offset attached to the render object.
    // Animated scenes such as RaceScene move the whole car every frame and
    // must preserve this offset rather than snapping the decal to body centre.
    object.setData?.('tunerDecalLayer', true);
    object.setData?.('tunerDecalOffsetX', offsetX);
    object.setData?.('tunerDecalOffsetY', offsetY);
    object.setData?.('tunerDecalId', decalId);

    return object;
  });
}
