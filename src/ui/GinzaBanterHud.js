import { createRaceDialogueHud } from './RaceCoachHud.js?v=20261017-r572';
import { characters } from '../data/characters.js?v=20261021-r629';

// Both speakers share the LEFT reading zone. Sayaka's portrait anchors the
// left edge; Arkon's portrait faces in from the RIGHT of the same bubble.
// Longer/wider bubbles hold 4-5 lines without clipping; the centre/right
// driving field, bottom pedals and speed cluster remain unobstructed.
const GINZA_CHAT_LAYOUT = Object.freeze({
  left: {
    face: { x: 22, y: 114, width: 150, height: 170,
      targetX: 96, targetY: 226, headHeight: 162 },
    bubble: { left: 184, right: 726, top: 118, bottom: 326,
      notchDepth: 18, notchHalfHeight: 18,
      headingX: 207, headingY: 140,
      textX: 207, textY: 170, textWidth: 488 },
  },
  right: {
    face: { x: 755, y: 114, width: 150, height: 170,
      targetX: 830, targetY: 226, headHeight: 162 },
    bubble: { left: 194, right: 733, top: 118, bottom: 326,
      notchDepth: 18, notchHalfHeight: 18,
      headingX: 217, headingY: 140,
      textX: 217, textY: 170, textWidth: 486 },
  },
});

export function createGinzaBanterHud(scene) {
  const sayakaVisual = characters.sayakaFujieda.visual;
  const arkonVisual = characters.arkonDen.visual;
  const sayakaKey = sayakaVisual.poseAssets.devIdle.key;
  const arkonKey = arkonVisual.poseAssets.devIdle.key;
  if (!scene.textures.exists(sayakaKey) || !scene.textures.exists(arkonKey)) {
    return null;
  }
  const create = (speaker, visual, key, side, layout) =>
    createRaceDialogueHud(scene, {
      speaker, theme: 'standard', depth: 81, side, layout,
      spriteKeyForPose: pose => visual.poseAssets?.[pose]?.key || key,
      characterVisual: visual,
      initialPose: 'devIdle',
    });
  const left = create('SAYAKA', sayakaVisual, sayakaKey, 'left', GINZA_CHAT_LAYOUT.left);
  const right = create('ARKON', arkonVisual, arkonKey, 'right', GINZA_CHAT_LAYOUT.right);
  const toggle = (hud, visible) => hud.objects.forEach(obj => obj?.setVisible?.(visible));
  const hide = () => { toggle(left, false); toggle(right, false); };
  hide();

  return {
    show(speaker, text, pose = 'devIdle') {
      hide();
      const active = speaker === 'arkon' ? right : left;
      active.setPortrait(pose);
      active.dialogue.setText(String(text || ''));
      toggle(active, true);
    },
    hide,
    destroy() { left.destroy(); right.destroy(); },
  };
}
