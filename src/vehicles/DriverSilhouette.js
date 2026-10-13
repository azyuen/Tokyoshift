import { resolveCharacterFaceAnchor } from '../characters/CharacterFaceAnchor.js?v=20261013-driverface';

// One anchor per car and one face centre per character. This sprite is always
// below the vehicle body, so its cutout appears only through clear windows.
const clamp = (value, low, high) => Math.max(low, Math.min(high, Number(value)));
const finite = (value, fallback) => value != null && Number.isFinite(Number(value))
  ? Number(value) : fallback;

/**
 * Source-space position of the centre of the driver's face relative to the
 * car's actual Phaser image origin. Standard-reference cars use bottom-right
 * (1,1); older regular and hero cars use centre (0.5,0.5).
 */
export function resolveDriverSeat(visualOrCar = {}, sourceWidth = 0, sourceHeight = 0) {
  const visual = visualOrCar?.visual || visualOrCar || {};
  const width = Math.max(1, finite(sourceWidth > 0 ? sourceWidth : null, visual.referenceCanvasWidth || 1200));
  const height = Math.max(1, finite(sourceHeight > 0 ? sourceHeight : null, visual.referenceCanvasHeight || 500));
  const authored = visual.driverFace;
  const override = visual.driverSeat || {};
  const originX = visual.referenceStandard ? 1 : 0.5;
  const originY = visual.referenceStandard ? 1 : 0.5;

  if (authored) {
    return {
      x: (clamp(finite(authored.x, 0.54), 0, 1) - originX) * width,
      y: (clamp(finite(authored.y, 0.22), 0, 1) - originY) * height,
      height: clamp(finite(authored.height, 0.13), 0.04, 0.35) * height,
      alpha: clamp(finite(authored.alpha, 0.52), 0.05, 1),
    };
  }

  // Keep deliberately calibrated legacy hero-car overrides intact.
  if (override.x != null && override.y != null) {
    return {
      x: finite(override.x, 0), y: finite(override.y, -height * 0.25),
      height: Math.max(1, finite(override.height, height * 0.13)),
      alpha: clamp(finite(override.alpha, 0.52), 0.05, 1),
    };
  }

  // Safe placement for as-yet uncalibrated cars; never derive a vertical
  // coordinate from wheelOffsetY (it has different origins by car family).
  return {
    x: (0.54 - originX) * width,
    y: (0.24 - originY) * height,
    height: height * 0.13,
    alpha: 0.52,
  };
}

export function resolveDriverHead(character = {}, source = null, spriteKey = '') {
  const visual = character?.visual || {};
  const face = resolveCharacterFaceAnchor(source, spriteKey, visual, 'idle');
  const override = visual.driverHead || {};
  return {
    ...face,
    offsetX: finite(override.offsetX, 0),
    offsetY: finite(override.offsetY, 0),
    scale: clamp(finite(override.scale, 1), 0.5, 1.75),
  };
}

export function createDriverSilhouette(scene, visualOrCar, character, {
  bodyX = 0,
  bodyY = 0,
  bodyScale = 1,
  depth = 0,
  flipX = false,
  alpha = null,
  sourceWidth = 0,
  sourceHeight = 0,
} = {}) {
  const spriteKey = character?.visual?.spriteKey;
  if (!spriteKey || !scene?.textures?.exists?.(spriteKey)) return null;
  const source = scene.textures.get(spriteKey).getSourceImage();
  if (!source?.width || !source?.height) return null;

  const seat = resolveDriverSeat(visualOrCar, sourceWidth, sourceHeight);
  const head = resolveDriverHead(character, source, spriteKey);

  // Keep the source crop tight around the HEAD. A full torso positioned at
  // the window used to leak under the sill on cars with dark-tinted windows.
  const desiredCropH = Math.max(8, head.headHeight * 1.32);
  const cropH = Math.min(source.height, Math.round(desiredCropH));
  const cropW = Math.min(source.width, Math.max(6, Math.round(cropH * 0.86)));
  const cropX = Math.round(clamp(head.x - cropW * 0.5, 0, source.width - cropW));
  const cropY = Math.round(clamp(head.y - cropH * 0.47, 0, source.height - cropH));
  const renderedHeight = Math.max(4, seat.height * bodyScale * head.scale);
  const spriteScale = renderedHeight / cropH;

  // setCrop does NOT move the source-image origin: compensate using the
  // canonical face's coordinates within the *whole* sprite. The face centre
  // now lands exactly on the car's source-space anchor for any sprite size.
  const faceTargetX = bodyX + (seat.x * bodyScale) + head.offsetX * renderedHeight;
  const faceTargetY = bodyY + (seat.y * bodyScale) + head.offsetY * renderedHeight;
  const renderX = faceTargetX - (head.x - source.width * 0.5) * spriteScale;
  const renderY = faceTargetY - (head.y - source.height * 0.5) * spriteScale;

  const silhouette = scene.add.image(renderX, renderY, spriteKey)
    .setOrigin(0.5, 0.5)
    .setCrop(cropX, cropY, cropW, cropH)
    .setScale(spriteScale)
    .setFlipX(Boolean(flipX))
    .setTint(0x05070a)
    .setAlpha(alpha == null ? seat.alpha : clamp(alpha, 0.05, 1))
    .setDepth(depth);

  const offsetX = renderX - bodyX;
  const offsetY = renderY - bodyY;
  silhouette.setData('driverSilhouette', true);
  silhouette.setData('driverSeatOffsetX', offsetX);
  silhouette.setData('driverSeatOffsetY', offsetY);
  silhouette.setData('driverFaceTargetX', faceTargetX);
  silhouette.setData('driverFaceTargetY', faceTargetY);

  return {
    image: silhouette,
    seat,
    head,
    targetHeight: renderedHeight,
    offsetX,
    offsetY,
  };
}
