import { resolveCharacterFaceAnchor } from './CharacterFaceAnchor.js?v=20261013-driverface';
import {
  characters,
  DEFAULT_CHARACTER_PROFILE,
  getCharacterVisualAsset,
  getCharacterVisualForContext,
} from '../data/characters.js?v=20261017-r578';

export const PROFILE_REFERENCE_HEIGHT = 188;
export const PROFILE_HEAD_SAFE_RATIO = 0.07;
export const PROFILE_EYE_TARGET_RATIO = 0.36;
export const PROFILE_TORSO_CROP_RATIO = 0.82;
export const PROFILE_DEFAULT_ZOOM = 3.65;

const normalisePose = pose => (
  String(pose || 'idle').trim().toLowerCase() || 'idle'
);

export function getCharacterProfileTexture(characterId, pose = 'idle', options = {}) {
  return getCharacterVisualAsset(characterId, normalisePose(pose), options);
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

// Central image placement for idle, win, loss and cutscene pose changes.
// Only the profile renderers use this target: in-car driver face anchors must
// not be moved when adjusting portrait framing.
export function getCharacterProfilePlacement({
  source,
  spriteKey = '',
  contextualVisual = {},
  pose = 'idle',
  profile = {},
  x = 0,
  y = 0,
  frameWidth = 188,
  frameHeight = 188,
  side = 'center',
  flipInward = false,
} = {}) {
  const width = Math.max(1, Number(frameWidth) || 1);
  const height = Math.max(1, Number(frameHeight) || 1);
  const sourceWidth = Math.max(1, Number(source?.naturalWidth || source?.width || 1));
  const sourceHeight = Math.max(1, Number(source?.naturalHeight || source?.height || 1));
  const inwardFlip = Boolean(flipInward && side === 'right');
  const offsetScale = height / PROFILE_REFERENCE_HEIGHT;
  const signedOffsetX = Number(profile.offsetX || 0) * offsetScale * (inwardFlip ? -1 : 1);
  const topY = (Number(y) || 0) - height * 0.5;
  const face = resolveCharacterFaceAnchor(source, spriteKey, contextualVisual, pose);
  const scale = (height * PROFILE_DEFAULT_ZOOM / sourceHeight) * Number(profile.scale ?? 1);
  const subjectCentreDelta = (face.x - sourceWidth * 0.5) * scale;
  return {
    x: Math.round((Number(x) || 0) + signedOffsetX - subjectCentreDelta * (inwardFlip ? -1 : 1)),
    y: Math.round(topY + height * PROFILE_EYE_TARGET_RATIO +
      Number(profile.offsetY || 0) * offsetScale - face.y * scale),
    scale,
    flipX: inwardFlip,
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
  rivalContext = false,
  playerCharacterId = null,
  proCircuit = false,
} = {}) {
  const character = characters[characterId];
  if (!character?.visual) return null;

  const activePlayerCharacterId = String(
    playerCharacterId ||
    scene?.registry?.get?.('playerCharacterId') ||
    ''
  );
  const visualOptions = {
    rivalContext: Boolean(rivalContext),
    playerCharacterId: activePlayerCharacterId,
    proCircuit: Boolean(proCircuit),
  };
  const contextualVisual = getCharacterVisualForContext(characterId, visualOptions);
  if (!contextualVisual) return null;

  const textureInfo = getCharacterProfileTexture(characterId, pose, visualOptions);
  let spriteKey = textureInfo?.key;
  let actualPose = textureInfo?.pose || 'idle';
  let poseFallback = Boolean(textureInfo?.fallback);

  if (!spriteKey || !scene.textures.exists(spriteKey)) {
    spriteKey = contextualVisual.spriteKey;
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

  const placement = getCharacterProfilePlacement({
    source, spriteKey, contextualVisual, pose: actualPose, profile,
    x: centreX, y: centreY, frameWidth: width, frameHeight: height,
    side, flipInward,
  });

  const image = scene.add.image(placement.x, placement.y, spriteKey)
    .setOrigin(0.5, 0)
    .setDepth(depth)
    .setScale(placement.scale)
    .setFlipX(placement.flipX);

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
    rivalContext: Boolean(rivalContext),
    playerCharacterId: activePlayerCharacterId,
    visualSubstituted: contextualVisual !== character.visual,
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
