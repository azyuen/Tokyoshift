import { createRaceDialogueHud } from './RaceCoachHud.js?v=20261023-r664';
import { characters } from '../data/characters.js?v=20261021-r629';
import { COMPACT_DIALOGUE_LAYOUTS } from './CompactDialogueLayout.js?v=20261022-r640';

// Both speakers share the notch-safe compact reading zone. Sayaka's portrait anchors the
// left edge; Aruken's portrait faces in from the RIGHT of the same bubble.
// Longer/wider bubbles hold 4-5 lines without clipping; the centre/right
// driving field, bottom pedals and speed cluster remain unobstructed.
const GINZA_CHAT_LAYOUT = COMPACT_DIALOGUE_LAYOUTS;

export function createGinzaBanterHud(scene,{storyCruise=false,chapter03=false}={}) {
  const sayakaVisual = characters.sayakaFujieda.visual;
  const arkonVisual = characters.arkonDen.visual;
  const sayakaPose=chapter03?'homeNormal':storyCruise?'oshiageRelaxed':'devIdle';
  const arkonPose=(storyCruise||chapter03)?'storyIdle':'devIdle';
  const sayakaKey = sayakaVisual.poseAssets[sayakaPose].key;
  const arkonKey = arkonVisual.poseAssets[arkonPose].key;
  if (!scene.textures.exists(sayakaKey) || !scene.textures.exists(arkonKey)) {
    return null;
  }
  const create = (speaker, visual, key, side, layout,initialPose) =>
    createRaceDialogueHud(scene, {
      speaker, theme: 'standard', depth: 81, side, layout,
      spriteKeyForPose: pose => visual.poseAssets?.[pose]?.key || key,
      characterVisual: visual,
      initialPose,
    });
  const left = create('SAYAKA', sayakaVisual, sayakaKey, 'left', GINZA_CHAT_LAYOUT.left,sayakaPose);
  const right = create('ARUKEN', arkonVisual, arkonKey, 'right', GINZA_CHAT_LAYOUT.right,arkonPose);
  const toggle = (hud, visible) => hud.objects.forEach(obj => obj?.setVisible?.(visible));
  const hide = () => { toggle(left, false); toggle(right, false); };
  hide();

  return {
    show(speaker, text, pose = chapter03?'homeNormal':storyCruise?'oshiageRelaxed':'devIdle') {
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
