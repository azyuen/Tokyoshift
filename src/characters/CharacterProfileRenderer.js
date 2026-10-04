import {
  characters,
  DEFAULT_CHARACTER_PROFILE,
} from '../data/characters.js?v=20261004-r333';

export const PROFILE_REFERENCE_HEIGHT = 188;
export const PROFILE_HEAD_SAFE_RATIO = 0.07;
export const PROFILE_EYE_TARGET_RATIO = 0.30;
export const PROFILE_TORSO_CROP_RATIO = 0.82;
export const PROFILE_DEFAULT_ZOOM = 3.65;

const PROFILE_METRICS_CACHE = new Map();
const PROFILE_ALPHA_SAMPLE_MAX = 256;
const PROFILE_HEAD_FROM_CENTRAL_TOP_RATIO = 0.055;

function getProfileSubjectMetrics(source, cacheKey = '') {
  const sourceWidth = Math.max(1, Number(source?.naturalWidth || source?.width || 1));
  const sourceHeight = Math.max(1, Number(source?.naturalHeight || source?.height || 1));
  const key = String(cacheKey || source?.src || (sourceWidth + 'x' + sourceHeight));
  if (PROFILE_METRICS_CACHE.has(key)) return PROFILE_METRICS_CACHE.get(key);

  const fallback = {
    centreX: sourceWidth * 0.5,
    headY: sourceHeight * 0.063,
    top: 0,
    bottom: sourceHeight,
  };

  if (typeof document === 'undefined') {
    PROFILE_METRICS_CACHE.set(key, fallback);
    return fallback;
  }

  try {
    const sampleScale = Math.min(
      1,
      PROFILE_ALPHA_SAMPLE_MAX / Math.max(sourceWidth, sourceHeight)
    );
    const sampleWidth = Math.max(1, Math.round(sourceWidth * sampleScale));
    const sampleHeight = Math.max(1, Math.round(sourceHeight * sampleScale));
    const canvas = document.createElement('canvas');
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('profile canvas unavailable');

    ctx.clearRect(0, 0, sampleWidth, sampleHeight);
    ctx.drawImage(source, 0, 0, sampleWidth, sampleHeight);
    const pixels = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;

    let minX = sampleWidth;
    let minY = sampleHeight;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const alpha = pixels[(y * sampleWidth + x) * 4 + 3];
        if (alpha <= 12) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) throw new Error('empty profile sprite');

    const subjectWidth = Math.max(1, maxX - minX + 1);
    const subjectHeight = Math.max(1, maxY - minY + 1);
    const centreX = minX + subjectWidth * 0.5;

    // Raised hands and victory poses can extend above the hair. Find the first
    // opaque row through the middle of the body instead of trusting the raw
    // topmost alpha pixel; this keeps idle/win/loss portraits aimed at the head.
    const bandLeft = Math.max(minX, Math.floor(centreX - subjectWidth * 0.16));
    const bandRight = Math.min(maxX, Math.ceil(centreX + subjectWidth * 0.16));
    let centralTop = minY;

    outer:
    for (let y = minY; y <= maxY; y += 1) {
      let hits = 0;
      for (let x = bandLeft; x <= bandRight; x += 1) {
        if (pixels[(y * sampleWidth + x) * 4 + 3] > 12) hits += 1;
        if (hits >= 2) {
          centralTop = y;
          break outer;
        }
      }
    }

    const inv = 1 / sampleScale;
    const metrics = {
      centreX: centreX * inv,
      headY: (
        centralTop +
        subjectHeight * PROFILE_HEAD_FROM_CENTRAL_TOP_RATIO
      ) * inv,
      top: minY * inv,
      bottom: (maxY + 1) * inv,
    };
    PROFILE_METRICS_CACHE.set(key, metrics);
    return metrics;
  } catch (e) {
    PROFILE_METRICS_CACHE.set(key, fallback);
    return fallback;
  }
}

const POSE_KEYS = {
  idle: ['spriteKey', 'path'],
  win: ['winSpriteKey', 'winPath'],
  loss: ['lossSpriteKey', 'lossPath'],
};

const normalisePose = pose => (
  pose === 'win' || pose === 'loss' ? pose : 'idle'
);

export function getCharacterProfileTexture(characterId, pose = 'idle') {
  const character = characters[characterId];
  if (!character?.visual) return null;

  const resolvedPose = normalisePose(pose);
  const [keyField, pathField] = POSE_KEYS[resolvedPose];
  const key = character.visual[keyField];
  const path = character.visual[pathField];

  if (key) return { key, path, pose: resolvedPose, fallback: false };

  return {
    key: character.visual.spriteKey,
    path: character.visual.path,
    pose: 'idle',
    fallback: resolvedPose !== 'idle',
  };
}

export function resolveCharacterProfile(
  characterId,
  pose = 'idle',
  profileOverride = null
) {
  const character = characters[characterId];
  const profile = character?.visual?.profile || DEFAULT_CHARACTER_PROFILE;
  const resolvedPose = normalisePose(pose);
  const poseOverride = profile?.poses?.[resolvedPose] || {};

  return {
    scale: Number(profile?.scale ?? DEFAULT_CHARACTER_PROFILE.scale),
    offsetX: Number(profile?.offsetX ?? DEFAULT_CHARACTER_PROFILE.offsetX),
    offsetY: Number(profile?.offsetY ?? DEFAULT_CHARACTER_PROFILE.offsetY),
    ...poseOverride,
    ...(profileOverride || {}),
  };
}

export function createCharacterProfile(scene, {
  characterId,
  pose = 'idle',
  x,
  y,
  frameWidth,
  frameHeight,
  side = 'center',
  depth = 0,
  flipInward = false,
  dimmed = false,
  mask = true,
  profileOverride = null,
} = {}) {
  const character = characters[characterId];
  if (!character?.visual) return null;

  const textureInfo = getCharacterProfileTexture(characterId, pose);
  let spriteKey = textureInfo?.key;
  let actualPose = textureInfo?.pose || 'idle';
  let poseFallback = Boolean(textureInfo?.fallback);

  if (!spriteKey || !scene.textures.exists(spriteKey)) {
    spriteKey = character.visual.spriteKey;
    actualPose = 'idle';
    poseFallback = normalisePose(pose) !== 'idle';
  }
  if (!spriteKey || !scene.textures.exists(spriteKey)) return null;

  const width = Math.max(1, Number(frameWidth) || 1);
  const height = Math.max(1, Number(frameHeight) || 1);
  const centreX = Number(x) || 0;
  const centreY = Number(y) || 0;
  const profile = resolveCharacterProfile(characterId, actualPose, profileOverride);
  const texture = scene.textures.get(spriteKey);
  texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  const source = texture.getSourceImage();

  const inwardFlip = flipInward && side === 'right';
  const offsetScale = height / PROFILE_REFERENCE_HEIGHT;
  const signedOffsetX = profile.offsetX * offsetScale * (inwardFlip ? -1 : 1);
  const topY = centreY - height / 2;
  const sourceWidth = Math.max(1, Number(source?.naturalWidth || source?.width || 1));
  const sourceHeight = Math.max(1, Number(source?.naturalHeight || source?.height || 1));
  const metrics = getProfileSubjectMetrics(source, spriteKey);
  const baseScale = (height * PROFILE_DEFAULT_ZOOM) / sourceHeight;
  const finalScale = baseScale * profile.scale;
  const subjectCentreDelta = (metrics.centreX - sourceWidth * 0.5) * finalScale;
  const signedSubjectCentreDelta = subjectCentreDelta * (inwardFlip ? -1 : 1);
  const targetHeadY =
    topY +
    height * PROFILE_EYE_TARGET_RATIO +
    profile.offsetY * offsetScale;

  const image = scene.add.image(
    Math.round(centreX + signedOffsetX - signedSubjectCentreDelta),
    Math.round(targetHeadY - metrics.headY * finalScale),
    spriteKey
  ).setOrigin(0.5, 0)
    .setDepth(depth)
    .setScale(finalScale)
    .setFlipX(inwardFlip);

  let maskShape = null;
  let geometryMask = null;
  if (mask) {
    maskShape = scene.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(
      Math.round(centreX - width / 2),
      Math.round(centreY - height / 2),
      Math.round(width),
      Math.round(height)
    );
    geometryMask = maskShape.createGeometryMask();
    image.setMask(geometryMask);
  }

  let externalAlpha = 1;
  let externalTint = null;
  let isDimmed = false;

  const applyVisualState = () => {
    image.setAlpha(externalAlpha * (isDimmed ? 0.72 : 1));
    if (externalTint != null) {
      image.setTint(externalTint);
    } else if (isDimmed) {
      image.setTint(0x76808a);
    } else {
      image.clearTint();
    }
  };

  const api = {
    character,
    characterId,
    requestedPose: normalisePose(pose),
    actualPose,
    poseFallback,
    spriteKey,
    image,
    maskShape,
    mask: geometryMask,
    profile,
    frame: { x: centreX, y: centreY, width, height, side },
    setDimmed(value = true, options = {}) {
      isDimmed = Boolean(value);
      const duration = Math.max(0, Number(options?.duration || 0));

      if (externalTint != null) {
        image.setTint(externalTint);
      } else if (isDimmed) {
        image.setTint(0x76808a);
      } else {
        image.clearTint();
      }

      const targetAlpha = externalAlpha * (isDimmed ? 0.72 : 1);
      if (duration > 0 && scene?.tweens) {
        scene.tweens.killTweensOf(image);
        scene.tweens.add({
          targets: image,
          alpha: targetAlpha,
          duration,
          ease: options?.ease || 'Sine.easeOut',
          onComplete: options?.onComplete,
        });
      } else {
        image.setAlpha(targetAlpha);
        options?.onComplete?.();
      }
      return api;
    },
    setAlpha(value = 1) {
      externalAlpha = Number.isFinite(Number(value)) ? Number(value) : 1;
      applyVisualState();
      return api;
    },
    setTint(value = null) {
      externalTint = value == null ? null : Number(value);
      applyVisualState();
      return api;
    },
    destroy() {
      image?.destroy?.();
      maskShape?.destroy?.();
    },
  };

  isDimmed = Boolean(dimmed);
  applyVisualState();
  return api;
}
