import { resolveCharacterFaceAnchor } from '../characters/CharacterFaceAnchor.js';

// One geometry source for live race dialogue and phone-call dialogue.
// Coordinates use Tokyo SHIFT's native 1560 x 840 landscape viewport.
export const RACE_COACH_LAYOUT = Object.freeze({
  face: Object.freeze({
    x: 45, y: 94, width: 214, height: 218,
    targetX: 147, targetY: 202, headHeight: 183,
  }),
  bubble: Object.freeze({
    left: 259, right: 790, top: 111, bottom: 312,
    notchDepth: 27, notchHalfHeight: 27,
    headingX: 290, headingY: 132,
    textX: 290, textY: 160, textWidth: 455,
  }),
  badge: Object.freeze({
    x: 1337, y: 192, radius: 83,
    labelY: 135, valueY: 190, footerY: 248,
  }),
});

export const RACE_DIALOGUE_THEMES = Object.freeze({
  standard: Object.freeze({
    fill: 0xfffcf1, fillAlpha: 0.985,
    border: 0x111111, heading: '#141820', text: '#121820',
  }),
  phone: Object.freeze({
    fill: 0xe4f5ff, fillAlpha: 0.92,
    border: 0x287bb5, heading: '#145b8d', text: '#11304b',
  }),
});

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", sans-serif';
const POSES = new Set(['neutral', 'explaining', 'happy', 'concerned']);

function drawMangaSpeechBubble(scene, layout, theme, depth = 80) {
  const mid = (layout.top + layout.bottom) / 2;
  const bubble = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  const redraw = borderColor => {
    bubble.clear();
    bubble.fillStyle(theme.fill, theme.fillAlpha);
    bubble.lineStyle(4, borderColor ?? theme.border, 1);
    bubble.beginPath();
    bubble.moveTo(layout.left, layout.top);
    bubble.lineTo(layout.right, layout.top);
    bubble.lineTo(layout.right, layout.bottom);
    bubble.lineTo(layout.left, layout.bottom);
    bubble.lineTo(layout.left, mid + layout.notchHalfHeight);
    // An OUTWARD triangular tail added to the intact rectangle.
    bubble.lineTo(layout.left - layout.notchDepth, mid);
    bubble.lineTo(layout.left, mid - layout.notchHalfHeight);
    bubble.closePath();
    bubble.fillPath();
    bubble.strokePath();
  };
  redraw();
  return { bubble, redraw };
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
  plate.fillStyle(0xd33542, 1);
  plate.fillTriangle(x - r + 10, y - 57, x - r + 35, y - 78, x - r + 42, y - 54);
  plate.fillTriangle(x + r - 9, y + 58, x + r - 34, y + 77, x + r - 43, y + 52);
  plate.lineStyle(3, 0xd33542, 1);
  plate.lineBetween(x - 42, y + 43, x - 20, y + 43);
  plate.lineBetween(x + 21, y + 43, x + 43, y + 43);
  return plate;
}

// Reusable presentation surface. The phone variant uses the same floating
// head and speech geometry as coaching, but a blue tint and phone-corner badge.
export function createRaceDialogueHud(scene, {
  speaker = '',
  theme = 'standard',
  depth = 80,
  spriteKeyForPose = () => '',
  characterVisual = {},
  initialPose = 'neutral',
  phoneIconKey = '',
} = {}) {
  const { face, bubble } = RACE_COACH_LAYOUT;
  const style = RACE_DIALOGUE_THEMES[theme] || RACE_DIALOGUE_THEMES.standard;
  const objects = [];
  const own = object => { objects.push(object); return object; };
  const maskShape = scene.make.graphics({ add: false });
  maskShape.fillStyle(0xffffff);
  maskShape.fillRect(face.x, face.y, face.width, face.height);

  // Transparent portrait: no background plate, frame, shadow or tint.
  const portrait = own(scene.add.image(face.x, face.y, spriteKeyForPose(initialPose))
    .setOrigin(0, 0).setDepth(depth + 2).setScrollFactor(0)
    .setMask(maskShape.createGeometryMask()));

  const speech = drawMangaSpeechBubble(scene, bubble, style, depth);
  own(speech.bubble);
  const heading = own(scene.add.text(bubble.headingX, bubble.headingY, speaker, {
    fontFamily: PIXEL, fontSize: '10px', color: style.heading,
  }).setScrollFactor(0).setDepth(depth + 3));
  const dialogue = own(scene.add.text(bubble.textX, bubble.textY, '', {
    fontFamily: BODY, fontSize: '17px', fontStyle: 'bold',
    color: style.text, lineSpacing: 4,
    wordWrap: { width: bubble.textWidth },
  }).setScrollFactor(0).setDepth(depth + 4));

  let iconBadge = null;
  if (theme === 'phone') {
    const badgeX = bubble.right - 1;
    const badgeY = bubble.top;
    iconBadge = own(scene.add.circle(badgeX, badgeY, 31, 0xe2f3ff, 0.99)
      .setStrokeStyle(4, style.border).setScrollFactor(0).setDepth(depth + 5));
    if (phoneIconKey && scene.textures.exists(phoneIconKey)) {
      const source = scene.textures.get(phoneIconKey).getSourceImage();
      const icon = own(scene.add.image(badgeX, badgeY, phoneIconKey)
        .setScrollFactor(0).setDepth(depth + 6));
      icon.setScale(Math.min(37 / Math.max(1, source.width || 1),
        37 / Math.max(1, source.height || 1)));
    } else {
      own(scene.add.text(badgeX, badgeY, '☎', {
        fontFamily: BODY, fontSize: '35px', color: '#17639b', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 6));
    }
  }

  const setPortrait = (pose = 'neutral') => {
    const key = spriteKeyForPose(pose);
    if (!key || !scene.textures.exists(key)) {
      portrait.setVisible(false);
      return;
    }
    portrait.setVisible(true);
    portrait.setTexture(key);
    const texture = scene.textures.get(key);
    texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    const source = texture.getSourceImage();
    const anchor = resolveCharacterFaceAnchor(source, key, characterVisual, pose);
    const zoom = Math.max(0.12, Math.min(2.2,
      face.headHeight / Math.max(1, anchor.headHeight)));
    portrait.setScale(zoom);
    portrait.setPosition(face.targetX - anchor.x * zoom,
      face.targetY - anchor.y * zoom);
  };
  setPortrait(initialPose);

  const setAccent = color => {
    if (theme !== 'phone') return;
    speech.redraw(color);
    iconBadge?.setStrokeStyle(4, color);
  };
  let destroyed = false;
  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    objects.forEach(object => object?.destroy?.());
    maskShape.destroy();
    scene.events?.off?.(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  };
  scene.events?.once?.(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  return { portrait, heading, dialogue, maskShape, objects,
    setPortrait, setAccent, destroy: cleanup };
}

export function createRaceCoachHud(scene, {
  speaker = 'LADY INSTRUCTOR // OSHIAGE',
  spriteKeyForPose = pose => 'characterSayakaOshiage' +
    pose.charAt(0).toUpperCase() + pose.slice(1),
  characterVisual = {},
  initialPose = 'explaining',
} = {}) {
  const panel = createRaceDialogueHud(scene, {
    speaker, spriteKeyForPose, characterVisual, initialPose,
  });
  const badge = RACE_COACH_LAYOUT.badge;
  drawRaceTargetDecal(scene, badge);
  const label = scene.add.text(badge.x, badge.labelY, 'RECOMMENDED', {
    fontFamily: PIXEL, fontSize: '8px', color: '#a41e30',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(82);
  const value = scene.add.text(badge.x, badge.valueY, '', {
    fontFamily: PIXEL, fontSize: '13px', color: '#141820',
    align: 'center', lineSpacing: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(84);
  const footer = scene.add.text(badge.x, badge.footerY, '', {
    fontFamily: PIXEL, fontSize: '8px', color: '#8e1d2b', align: 'center',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(84);
  return { ...panel, label, value, footer };
}
