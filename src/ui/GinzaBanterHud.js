import { createRaceDialogueHud } from './RaceCoachHud.js?v=20261017-r572';
import { characters } from '../data/characters.js?v=20261021-r629';

// Keep a generous open centre lane and leave the bottom HUD/pedals untouched.
// Sayaka speaks from the LEFT, Arkon from the RIGHT; only the speaker's
// translucent card is visible at a time.
const GINZA_CHAT_LAYOUT = Object.freeze({
  left: {
    face: { x: 24, y: 115, width: 148, height: 155,
      targetX: 99, targetY: 216, headHeight: 158 },
    bubble: { left: 180, right: 574, top: 135, bottom: 265,
      notchDepth: 18, notchHalfHeight: 18,
      headingX: 198, headingY: 150,
      textX: 198, textY: 177, textWidth: 352 },
  },
  right: {
    face: { x: 1390, y: 115, width: 146, height: 155,
      targetX: 1462, targetY: 216, headHeight: 158 },
    bubble: { left: 987, right: 1378, top: 135, bottom: 265,
      notchDepth: 18, notchHalfHeight: 18,
      headingX: 1005, headingY: 150,
      textX: 1005, textY: 177, textWidth: 351 },
  },
});

export function createGinzaBanterHud(scene) {
  const sayakaVisual = characters.sayakaFujieda.visual;
  const arkonVisual = characters.arkonDen.visual;
  const sayakaKey = sayakaVisual.poseAssets.ginzaDress.key;
  const arkonKey = arkonVisual.poseAssets.ginzaSuit.key;
  if (!scene.textures.exists(sayakaKey) || !scene.textures.exists(arkonKey)) {
    return null;
  }
  const create = (speaker, visual, key, side, layout) =>
    createRaceDialogueHud(scene, {
      speaker, theme: 'standard', depth: 81, side, layout,
      spriteKeyForPose: () => key, characterVisual: visual,
      initialPose: side === 'left' ? 'ginzaDress' : 'ginzaSuit',
    });
  const left = create('SAYAKA', sayakaVisual, sayakaKey, 'left', GINZA_CHAT_LAYOUT.left);
  const right = create('ARKON', arkonVisual, arkonKey, 'right', GINZA_CHAT_LAYOUT.right);
  const toggle = (hud, visible) => hud.objects.forEach(obj => obj?.setVisible?.(visible));
  const hide = () => { toggle(left, false); toggle(right, false); };
  hide();

  return {
    show(speaker, text) {
      hide();
      const active = speaker === 'arkon' ? right : left;
      active.dialogue.setText(String(text || ''));
      toggle(active, true);
    },
    hide,
    destroy() { left.destroy(); right.destroy(); },
  };
}
