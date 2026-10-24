import { resolveCharacterFaceAnchor } from '../characters/CharacterFaceAnchor.js';
import { COMPACT_DIALOGUE_LAYOUTS } from './CompactDialogueLayout.js';
import { applyStoryDialogueTypography } from './StoryDialogueTypography.js';

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

// Phone and compact share placement; phone retains its independent colours,
// outlined bubble, caller/player sides and floating phone icon.
export const PHONE_DIALOGUE_LAYOUTS = COMPACT_DIALOGUE_LAYOUTS;

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

// Global phone-call presentation template used by BOTH call engines (the
// vibrating pick-up choreography and the standard phone dialogue fallback).
// Leave race coaching untouched: its separate 'standard' theme has no veil.
export const PHONE_CALL_PRESENTATION = Object.freeze({
  backdropColor: 0x071421,
  backdropOpacity: 0.42,
  iconSize: 62,
  iconOffsetX: -27,
  iconOffsetY: -12,
});

// Reusable anonymous incoming caller portrait. Phaser draws a neutral grey
// head-and-shoulders silhouette once into a transparent texture; it never
// reveals the identity of an intentionally unknown customer (including Sayaka).
export const ANONYMOUS_CALLER_TEXTURE='phoneAnonymousCallerSilhouette';
export const ANONYMOUS_CALLER_PATH='assets/Ui/phone_unknown.png';
export const ANONYMOUS_CALLER_VISUAL=Object.freeze({
  faceAnchor:Object.freeze({x:.5,y:.37,headHeight:.37}),
});
export function ensureAnonymousCallerPortrait(scene){
  if(!scene?.textures || !scene?.make?.graphics)return '';
  if(scene.textures.exists(ANONYMOUS_CALLER_TEXTURE))return ANONYMOUS_CALLER_TEXTURE;
  const g=scene.make.graphics({add:false});
  g.fillStyle(0x3b4752,1);
  g.fillEllipse(128,248,248,148);
  g.fillRoundedRect(103,143,50,68,16);
  g.fillEllipse(128,101,120,146);
  g.fillStyle(0x68747f,1);
  g.fillEllipse(128,107,94,116);
  g.fillStyle(0x46525d,1);
  g.fillEllipse(128,249,212,110);
  g.generateTexture(ANONYMOUS_CALLER_TEXTURE,256,256);
  g.destroy();
  return ANONYMOUS_CALLER_TEXTURE;
}

export function createPhoneCallBackdrop(scene, { depth = 305 } = {}) {
  const width = Number(scene.scale?.width || 1560);
  const height = Number(scene.scale?.height || 840);
  return scene.add.rectangle(
    width / 2, height / 2, width, height,
    PHONE_CALL_PRESENTATION.backdropColor,
    PHONE_CALL_PRESENTATION.backdropOpacity,
  ).setScrollFactor(0).setDepth(depth).setInteractive();
}

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", sans-serif';
const POSES = new Set(['neutral', 'explaining', 'happy', 'concerned']);

function drawMangaSpeechBubble(scene, layout, theme, depth = 80, side = 'left') {
  const mid = (layout.top + layout.bottom) / 2;
  const bubble = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  const redraw = borderColor => {
    bubble.clear();
    bubble.fillStyle(theme.fill, theme.fillAlpha);
    bubble.lineStyle(4, borderColor ?? theme.border, 1);
    bubble.beginPath();
    bubble.moveTo(layout.left, layout.top);
    bubble.lineTo(layout.right, layout.top);
    if (side === 'right') {
      // The speaker is to the RIGHT of the bubble; mirror the speech tail.
      bubble.lineTo(layout.right, mid - layout.notchHalfHeight);
      bubble.lineTo(layout.right + layout.notchDepth, mid);
      bubble.lineTo(layout.right, mid + layout.notchHalfHeight);
      bubble.lineTo(layout.right, layout.bottom);
      bubble.lineTo(layout.left, layout.bottom);
    } else {
      bubble.lineTo(layout.right, layout.bottom);
      bubble.lineTo(layout.left, layout.bottom);
      bubble.lineTo(layout.left, mid + layout.notchHalfHeight);
      // An outward triangular tail to the left-side portrait.
      bubble.lineTo(layout.left - layout.notchDepth, mid);
      bubble.lineTo(layout.left, mid - layout.notchHalfHeight);
    }
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
// head and speech geometry as coaching, but a blue tint and a larger floating phone glyph.
export function createRaceDialogueHud(scene, {
  speaker = '',
  theme = 'standard',
  depth = 80,
  spriteKeyForPose = () => '',
  characterVisual = {},
  initialPose = 'neutral',
  phoneIconKey = '',
  layout = RACE_COACH_LAYOUT,
  side = 'left',
} = {}) {
  const { face, bubble } = layout;
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

  const speech = drawMangaSpeechBubble(scene, bubble, style, depth, side);
  own(speech.bubble);
  const heading = own(scene.add.text(bubble.headingX, bubble.headingY, speaker, {
    fontFamily: PIXEL, fontSize: '10px', color: style.heading,
  }).setScrollFactor(0).setDepth(depth + 3));
  const dialogue = own(scene.add.text(bubble.textX, bubble.textY, '', {
    fontFamily: BODY, fontSize: '17px', fontStyle: 'bold',
    color: style.text, lineSpacing: 4,
    wordWrap: { width: bubble.textWidth },
  }).setScrollFactor(0).setDepth(depth + 4));

  if (theme === 'phone') {
    // Apply the exact same FINAL rendered font size as normal manga dialogue.
    // Both ordinary calls and opening/swipe calls use this shared HUD,
    // so neither scene is allowed to override typography locally.
    applyStoryDialogueTypography({ heading, dialogue });
    // Icon floats ABOVE the top-right bubble edge; never surround it with a
    // circle. This is consistent for normal calls and the swiping phone scene.
    const iconX = bubble.right + PHONE_CALL_PRESENTATION.iconOffsetX;
    const iconY = bubble.top + PHONE_CALL_PRESENTATION.iconOffsetY;
    if (phoneIconKey && scene.textures.exists(phoneIconKey)) {
      const source = scene.textures.get(phoneIconKey).getSourceImage();
      const icon = own(scene.add.image(iconX, iconY, phoneIconKey)
        .setScrollFactor(0).setDepth(depth + 6));
      icon.setScale(Math.min(
        PHONE_CALL_PRESENTATION.iconSize / Math.max(1, source.width || 1),
        PHONE_CALL_PRESENTATION.iconSize / Math.max(1, source.height || 1),
      ));
    } else {
      own(scene.add.text(iconX, iconY, '☎', {
        fontFamily: BODY, fontSize: '60px', color: '#17639b', fontStyle: 'bold',
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
    if(key===ANONYMOUS_CALLER_TEXTURE){
      // phone_unknown.png is a COMPLETE graphic, not a character face.
      // Fit its whole canvas within the regular phone portrait aperture.
      // Face detection otherwise zooms into a tiny section of the artwork.
      const sw=Math.max(1,Number(source.naturalWidth||source.width||1));
      const sh=Math.max(1,Number(source.naturalHeight||source.height||1));
      const padding=5;
      const zoom=Math.min((face.width-padding*2)/sw,
        (face.height-padding*2)/sh);
      portrait.setScale(zoom);
      portrait.setPosition(face.x+(face.width-sw*zoom)/2,
        face.y+(face.height-sh*zoom)/2);
      return;
    }
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
