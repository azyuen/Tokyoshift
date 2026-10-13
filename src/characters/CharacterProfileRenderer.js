import { resolveCharacterFaceAnchor } from './CharacterFaceAnchor.js?v=20261013-driverface';
import {
  characters,
  DEFAULT_CHARACTER_PROFILE,
  getCharacterVisualAsset,
  getCharacterVisualForContext,
} from '../data/characters.js?v=20261011-r477';

export const PROFILE_REFERENCE_HEIGHT = 188;
export const PROFILE_HEAD_SAFE_RATIO = 0.07;
export const PROFILE_EYE_TARGET_RATIO = 0.30;
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

  const inwardFlip = flipInward && side === 'right';
  const offsetScale = height / PROFILE_REFERENCE_HEIGHT;
  const signedOffsetX = profile.offsetX * offsetScale * (inwardFlip ? -1 : 1);
  const topY = centreY - height / 2;
  const sourceWidth = Math.max(1, Number(source?.naturalWidth || source?.width || 1));
  const sourceHeight = Math.max(1, Number(source?.naturalHeight || source?.height || 1));
  const metrics = resolveCharacterFaceAnchor(source, spriteKey, contextualVisual, actualPose);
  const baseScale = (height * PROFILE_DEFAULT_ZOOM) / sourceHeight;
  const finalScale = baseScale * profile.scale;
  const subjectCentreDelta = (metrics.x - sourceWidth * 0.5) * finalScale;
  const signedSubjectCentreDelta = subjectCentreDelta * (inwardFlip ? -1 : 1);
  const targetHeadY =
    topY +
    height * PROFILE_EYE_TARGET_RATIO +
    profile.offsetY * offsetScale;

  const image = scene.add.image(
    Math.round(centreX + signedOffsetX - signedSubjectCentreDelta),
    Math.round(targetHeadY - metrics.y * finalScale),
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
