// Generic in-car driver silhouette.
//
// Reuses the existing full-body character artwork: crop the upper portion,
// tint it almost black, and position it BEHIND the car body. Cars with
// translucent windows then reveal only a simple head/upper-body silhouette.
//
// Optional per-car override:
// visual.driverSeat = { x, y, height, alpha, cropX, cropY, cropW, cropH }
// x/y/height use the same source-pixel coordinate system as the wheel offsets.
// crop values are normalised 0..1 fractions of the character texture.

const DEFAULT_CROP = {
  cropX: 0.18,
  cropY: 0.00,
  cropW: 0.64,
  cropH: 0.40,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

export function resolveDriverSeat(visualOrCar = {}) {
  const visual = visualOrCar?.visual || visualOrCar || {};
  const rear = Number(visual.rearOffsetX || -520);
  const front = Number(visual.frontOffsetX || 520);
  const wheelY = Number(visual.wheelOffsetY || 170);
  const wheelbase = Math.max(500, Math.abs(front - rear));
  const override = visual.driverSeat || {};

  const fallbackX = rear + (front - rear) * 0.62;
  const fallbackY = wheelY - wheelbase * 0.22;
  const fallbackHeight = wheelbase * 0.235;

  return {
    x: Number.isFinite(Number(override.x)) ? Number(override.x) : fallbackX,
    y: Number.isFinite(Number(override.y)) ? Number(override.y) : fallbackY,
    height: Number.isFinite(Number(override.height)) ? Number(override.height) : fallbackHeight,
    alpha: clamp(
      Number.isFinite(Number(override.alpha)) ? Number(override.alpha) : 0.46,
      0.05,
      1
    ),
    cropX: clamp(
      Number.isFinite(Number(override.cropX)) ? Number(override.cropX) : DEFAULT_CROP.cropX,
      0,
      0.90
    ),
    cropY: clamp(
      Number.isFinite(Number(override.cropY)) ? Number(override.cropY) : DEFAULT_CROP.cropY,
      0,
      0.90
    ),
    cropW: clamp(
      Number.isFinite(Number(override.cropW)) ? Number(override.cropW) : DEFAULT_CROP.cropW,
      0.05,
      1
    ),
    cropH: clamp(
      Number.isFinite(Number(override.cropH)) ? Number(override.cropH) : DEFAULT_CROP.cropH,
      0.05,
      1
    ),
  };
}

export function createDriverSilhouette(
  scene,
  visualOrCar,
  character,
  {
    bodyX = 0,
    bodyY = 0,
    bodyScale = 1,
    depth = 0,
    flipX = false,
    alpha = null,
  } = {}
) {
  const spriteKey = character?.visual?.spriteKey;
  if (!spriteKey || !scene?.textures?.exists?.(spriteKey)) return null;

  const source = scene.textures.get(spriteKey).getSourceImage();
  if (!source?.width || !source?.height) return null;

  const seat = resolveDriverSeat(visualOrCar);
  const cropX = Math.round(source.width * seat.cropX);
  const cropY = Math.round(source.height * seat.cropY);
  const cropW = Math.max(
    1,
    Math.round(source.width * Math.min(seat.cropW, 1 - seat.cropX))
  );
  const cropH = Math.max(
    1,
    Math.round(source.height * Math.min(seat.cropH, 1 - seat.cropY))
  );

  const targetHeight = Math.max(12, seat.height * bodyScale);
  const silhouetteScale = targetHeight / cropH;
  const centreX = bodyX + seat.x * bodyScale;
  const centreY = bodyY + seat.y * bodyScale;
  const topY = centreY - targetHeight * 0.52;

  const image = scene.add.image(centreX, topY, spriteKey)
    .setOrigin(0.5, 0)
    .setCrop(cropX, cropY, cropW, cropH)
    .setScale(silhouetteScale)
    .setFlipX(Boolean(flipX))
    .setTint(0x05070a)
    .setAlpha(alpha == null ? seat.alpha : clamp(alpha, 0.05, 1))
    .setDepth(depth);

  image.setData('driverSilhouette', true);
  image.setData('driverSeatOffsetX', seat.x * bodyScale);
  image.setData('driverSeatOffsetY', seat.y * bodyScale - targetHeight * 0.52);

  return {
    image,
    seat,
    targetHeight,
    offsetX: seat.x * bodyScale,
    offsetY: seat.y * bodyScale - targetHeight * 0.52,
  };
}
