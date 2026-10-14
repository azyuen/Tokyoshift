import { resolveCharacterFaceAnchor } from '../characters/CharacterFaceAnchor.js?v=20261013-driverface';

// Shared compact in-race coaching HUD. Coordinates refer to the game's native
// 1560 x 840 landscape canvas; the Phaser scene scales that canvas uniformly.
export const RACE_COACH_LAYOUT = Object.freeze({
  face: Object.freeze({
    x: 23, y: 94, width: 214, height: 218,
    targetX: 122, targetY: 202, headHeight: 183,
  }),
  bubble: Object.freeze({
    left: 245, right: 790, top: 111, bottom: 312,
    notchDepth: 26, notchHalfHeight: 27,
    headingX: 291, headingY: 132,
    textX: 291, textY: 160, textWidth: 459,
  }),
  badge: Object.freeze({
    x: 1337, y: 192, radius: 83,
    labelY: 135, valueY: 190, footerY: 248,
  }),
});

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", sans-serif';
const POSES = new Set(['neutral', 'explaining', 'happy', 'concerned']);

function drawMangaSpeechBubble(scene, layout) {
  const mid = (layout.top + layout.bottom) / 2;
  const bubble = scene.add.graphics().setScrollFactor(0).setDepth(80);
  bubble.fillStyle(0xfffcf1, 0.985);
  bubble.lineStyle(4, 0x111111, 1);
  bubble.beginPath();
  bubble.moveTo(layout.left, layout.top);
  bubble.lineTo(layout.right, layout.top);
  bubble.lineTo(layout.right, layout.bottom);
  bubble.lineTo(layout.left, layout.bottom);
  bubble.lineTo(layout.left, mid + layout.notchHalfHeight);
  // An inward triangular bite from the left edge points back to the face.
  bubble.lineTo(layout.left + layout.notchDepth, mid);
  bubble.lineTo(layout.left, mid - layout.notchHalfHeight);
  bubble.closePath();
  bubble.fillPath();
  bubble.strokePath();
  return bubble;
}

function drawRaceTargetDecal(scene, layout) {
  const { x, y, radius: r } = layout;
  const plate = scene.add.graphics().setScrollFactor(0).setDepth(79);
  plate.fillStyle(0xfffcf3, 0.975);
  plate.fillCircle(x, y, r);
  plate.lineStyle(6, 0xc92c3b, 1);
  plate.strokeCircle(x, y, r - 2);
  plate.lineStyle(2, 0x8e1d2b, 1);
  plate.strokeCircle(x, y, r - 12);
  // Off-axis racing livery cuts: compact, recognisable and not distracting.
  plate.fillStyle(0xd33542, 1);
  plate.fillTriangle(x - r + 10, y - 57, x - r + 35, y - 78, x - r + 42, y - 54);
  plate.fillTriangle(x + r - 9, y + 58, x + r - 34, y + 77, x + r - 43, y + 52);
  plate.lineStyle(3, 0xd33542, 1);
  plate.lineBetween(x - 42, y + 43, x - 20, y + 43);
  plate.lineBetween(x + 21, y + 43, x + 43, y + 43);
  return plate;
}

export function createRaceCoachHud(scene, {
  speaker = 'LADY INSTRUCTOR // OSHIAGE',
  spriteKeyForPose = pose => 'characterSayakaOshiage' +
    pose.charAt(0).toUpperCase() + pose.slice(1),
  characterVisual = {},
  initialPose = 'explaining',
} = {}) {
  const { face, bubble, badge } = RACE_COACH_LAYOUT;
  // Transparent cut-out head, no panel, border, drop shadow or tint.
  const maskShape = scene.make.graphics({ add: false });
  maskShape.fillStyle(0xffffff);
  maskShape.fillRect(face.x, face.y, face.width, face.height);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => maskShape.destroy());

  const portrait = scene.add.image(face.x, face.y, spriteKeyForPose(initialPose))
    .setOrigin(0, 0).setDepth(82).setScrollFactor(0)
    .setMask(maskShape.createGeometryMask());

  drawMangaSpeechBubble(scene, bubble);
  scene.add.text(bubble.headingX, bubble.headingY, speaker, {
    fontFamily: PIXEL, fontSize: '10px', color: '#141820',
  }).setScrollFactor(0).setDepth(83);
  const dialogue = scene.add.text(bubble.textX, bubble.textY, '', {
    fontFamily: BODY, fontSize: '17px', fontStyle: 'bold',
    color: '#121820', lineSpacing: 4,
    wordWrap: { width: bubble.textWidth },
  }).setScrollFactor(0).setDepth(84);

  drawRaceTargetDecal(scene, badge);
  const label = scene.add.text(badge.x, badge.labelY, 'RECOMMENDED', {
    fontFamily: PIXEL, fontSize: '8px', color: '#a41e30',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(82);
  const value = scene.add.text(badge.x, badge.valueY, '', {
    fontFamily: PIXEL, fontSize: '13px', color: '#141820',
    align: 'center', lineSpacing: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(84);
  const footer = scene.add.text(badge.x, badge.footerY, '', {
    fontFamily: PIXEL, fontSize: '8px', color: '#8e1d2b',
    align: 'center',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(84);

  const setPortrait = (pose = 'neutral') => {
    const safePose = POSES.has(pose) ? pose : 'neutral';
    const key = spriteKeyForPose(safePose);
    if (!scene.textures.exists(key)) return;
    portrait.setTexture(key);
    const texture = scene.textures.get(key);
    texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    const source = texture.getSourceImage();
    const anchor = resolveCharacterFaceAnchor(source, key, characterVisual, 'oshiage' +
      safePose[0].toUpperCase() + safePose.slice(1));
    const zoom = Math.max(0.12, Math.min(2.2, face.headHeight / Math.max(1, anchor.headHeight)));
    portrait.setScale(zoom);
    portrait.setPosition(
      face.targetX - anchor.x * zoom,
      face.targetY - anchor.y * zoom,
    );
  };
  setPortrait(initialPose);
  return { portrait, dialogue, label, value, footer, setPortrait, maskShape };
}
