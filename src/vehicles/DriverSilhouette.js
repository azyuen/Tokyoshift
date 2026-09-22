// Generic in-car driver silhouette.
//
// Scalability rule:
//   - each CAR may define visual.driverSeat once
//   - each CHARACTER may define visual.driverHead once
// Any car + character combination then works without pair-specific artwork.
//
// The character crop is tinted almost black and positioned BEHIND every body
// layer. It is only visible through transparent/translucent glass in the car PNG.

const DEFAULT_HEAD = {
  cropX: 0.18,
  cropY: 0.00,
  cropW: 0.64,
  cropH: 0.40,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

export function resolveDriverSeat(visualOrCar = {}) {
  const visual = visualOrCar?.visual || visualOrCar || {};
  const rear = Number(visual.rearOffsetX || -520);
  const front = Number(visual.frontOffsetX || 520);
  const wheelY = Number(visual.wheelOffsetY || 170);
  const wheelbase = Math.max(500, Math.abs(front - rear));
  const override = visual.driverSeat || {};

  // Automatic baseline. Most road cars land close enough that only unusual
  // cabins need a small driverSeat override in cars.js.
  const fallbackX = rear + (front - rear) * 0.62;
  const fallbackY = wheelY - wheelbase * 0.22;
  const fallbackHeight = wheelbase * 0.235;

  return {
    x: Number.isFinite(Number(override.x)) ? Number(override.x) : fallbackX,
    y: Number.isFinite(Number(override.y)) ? Number(override.y) : fallbackY,
    height: Number.isFinite(Number(override.height)) ? Number(override.height) : fallbackHeight,
    alpha: clamp(
      Number.isFinite(Number(override.alpha)) ? Number(override.alpha) : 0.50,
      0.05,
      1
    ),
  };
}

export function resolveDriverHead(character = {}) {
  const override = character?.visual?.driverHead || {};
  return {
    cropX: clamp(
      Number.isFinite(Number(override.cropX)) ? Number(override.cropX) : DEFAULT_HEAD.cropX,
      0,
      0.90
    ),
    cropY: clamp(
      Number.isFinite(Number(override.cropY)) ? Number(override.cropY) : DEFAULT_HEAD.cropY,
      0,
      0.90
    ),
    cropW: clamp(
      Number.isFinite(Number(override.cropW)) ? Number(override.cropW) : DEFAULT_HEAD.cropW,
      0.05,
      1
    ),
    cropH: clamp(
      Number.isFinite(Number(override.cropH)) ? Number(override.cropH) : DEFAULT_HEAD.cropH,
      0.05,
      1
    ),
    offsetX: Number.isFinite(Number(override.offsetX)) ? Number(override.offsetX) : 0,
    offsetY: Number.isFinite(Number(override.offsetY)) ? Number(override.offsetY) : 0,
    scale: clamp(
      Number.isFinite(Number(override.scale)) ? Number(override.scale) : 1,
      0.50,
      1.75
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
  const head = resolveDriverHead(character);

  const cropX = Math.round(source.width * head.cropX);
  const cropY = Math.round(source.height * head.cropY);
  const cropW = Math.max(
    1,
    Math.round(source.width * Math.min(head.cropW, 1 - head.cropX))
  );
  const cropH = Math.max(
    1,
    Math.round(source.height * Math.min(head.cropH, 1 - head.cropY))
  );

  const targetHeight = Math.max(12, seat.height * bodyScale * head.scale);
  const silhouetteScale = targetHeight / cropH;

  const centreX =
    bodyX +
    seat.x * bodyScale +
    head.offsetX * targetHeight;

  const centreY =
    bodyY +
    seat.y * bodyScale +
    head.offsetY * targetHeight;

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

  const offsetX = centreX - bodyX;
  const offsetY = topY - bodyY;
  image.setData('driverSeatOffsetX', offsetX);
  image.setData('driverSeatOffsetY', offsetY);

  return {
    image,
    seat,
    head,
    targetHeight,
    offsetX,
    offsetY,
  };
}
