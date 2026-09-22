// Generic in-car driver silhouette.
//
// The system intentionally reuses the existing full-body character artwork.
// We crop the upper portion, tint it almost black, and position it BEHIND the
// car body. Cars with translucent windows then reveal only the head/upper-body
// silhouette, so no bespoke driver art is required for each car/character pair.
//
// Any car can override the automatic seat placement with:
// visual.driverSeat = { x, y, height, alpha, cropX, cropY, cropW, cropH }
// x/y/height are expressed in the same source-pixel coordinate system used by
// rearOffsetX/frontOffsetX/wheelOffsetY, so they scale with the car naturally.

const DEFAULT_CROP = {
  x: 0.18,
  y: 0.00,
  w: 0.64,
  h: 0.40,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

export function resolveDriverSeat(visualOrCar = {}) {
  const visual = visualOrCar?.visual || visualOrCar || {};
  const rear = Number(visual.rearOffsetX || -520);
  const front = Number(visual.frontOffsetX || 520);
  const wheelY = Number(visual.wheelOffsetY || 170);
  const wheelbase = Math.max(500, Math.abs(front - rear));

  const automatic = {
    // Roughly 62% of the way from rear axle to front axle puts the driver in
    // the front half of the cabin for the right-facing side-profile sprites.
    x: rear + (front - rear) * 0.62,
    // Place the head above the axle line in proportion to wheelbase.
    y: wheelY - wheelbase * 0.22,
    // Source-space target height for the cropped head/shoulders.
    height: wheelbase * 0.235,
    alpha: 0.66,
    ...DEFAULT_CROP,
  };

  const override = visual.driverSeat || {};

  return {
    x: Number.isFinite(Number(override.x)) ? Number(override.x) : automatic.x,
    y: Number.isFinite(Number(override.y)) ? Number(override.y) : automatic.y,
    height: Number.isFinite(Number(override.height)) ? Number(override.height) : automatic.height,
    alpha: clamp(
      Number.isFinite(Number(override.alpha)) ? Number(override.alpha) : automatic.alpha,
      0.05,
      1
    ),
    cropX: clamp(
      Number.isFinite(Number(override.cropX)) ? Number(override.cropX) : automatic.x,
      -100000,
      100000
    ),
    cropY: clamp(
      Number.isFinite(Number(override.cropY)) ? Number(override.cropY) : automatic.y,
      -100000,
      100000
    ),
    cropW: clamp(
      Number.isFinite(Number(override.cropW)) ? Number(override.cropW) : automatic.w,
      0.05,
      1
    ),
    cropH: clamp(
      Number.isFinite(Number(override.cropH)) ? Number(override.cropH) : automatic.h,
      0.05,
      1
    ),
    cropXRatio: clamp(
      Number.isFinite(Number(override.cropX)) ? Number(override.cropX) : DEFAULT_CROP.x,
      0,
      0.9
    ),
    cropYRatio: clamp(
      Number.isFinite(Number(override.cropY)) ? Number(override.cropY) : DEFAULT_CROP.y,
      0,
      0.9
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
  if (!spriteKey || !scene?.textures?.exists?.(spriteKey)) {
    return null;
  }

  const source = scene.textures.get(spriteKey).getSourceImage();
  if (!source?.width || !source?.height) return null;

  const seat = resolveDriverSeat(visualOrCar);
  const cropX = Math.round(source.width * seat.cropXRatio);
  const cropY = Math.round(source.height * seat.cropYRatio);
  const cropW = Math.max(
    1,
    Math.round(source.width * Math.min(seat.cropW, 1 - seat.cropXRatio))
  );
  const cropH = Math.max(
    1,
    Math.round(source.height * Math.min(seat.cropH, 1 - seat.cropYRatio))
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
