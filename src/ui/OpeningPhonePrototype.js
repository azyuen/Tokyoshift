// Opening-only prototype for the phone-call choreography. Other authored
// phone scenes continue to use PhoneConversation until this design is approved.
import {
  characters, getCharacterAssetUrl, getCharacterVisualAsset,
} from '../data/characters.js';
import { createRaceDialogueHud } from './RaceCoachHud.js';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", sans-serif';
const PHONE_TEXTURE = 'openingIncomingPhone';
const PHONE_PATH = 'assets/Ui/phone.png?v=20261011-r480';
const DEPTH = 308;

export const OPENING_PHONE_LAYOUT = Object.freeze({
  phone: { x: 780, y: 370, maxSize: 260, pickupY: 606 },
  card: { x: 780, y: 432, width: 1040, height: 288, portraitWidth: 260 },
  transitionMs: 420,
});

// Same uncaged face crop and white/blue race speech bubble as in-race
// dialogue, repositioned entirely into the TOP THIRD for this phone call.
// Right layout mirrors the left when the player answers.
export const OPENING_PHONE_DIALOGUE_LAYOUTS = Object.freeze({
  left: Object.freeze({
    face: { x: 38, y: 65, width: 210, height: 210,
      targetX: 143, targetY: 172, headHeight: 174 },
    bubble: { left: 249, right: 814, top: 83, bottom: 269,
      notchDepth: 27, notchHalfHeight: 27,
      headingX: 286, headingY: 102,
      textX: 286, textY: 133, textWidth: 487 },
  }),
  right: Object.freeze({
    face: { x: 1312, y: 65, width: 210, height: 210,
      targetX: 1417, targetY: 172, headHeight: 174 },
    bubble: { left: 746, right: 1311, top: 83, bottom: 269,
      notchDepth: 27, notchHalfHeight: 27,
      headingX: 783, headingY: 102,
      textX: 783, textY: 133, textWidth: 487 },
  }),
});
const safeDestroy = object => { try { object?.destroy?.(); } catch (_) {} };
const withAlpha = object => object?.setAlpha?.(0);

export function getOpeningPhoneAssets(callerId, pose, playerCharacterId) {
  return {
    caller: getCharacterVisualAsset(callerId, pose),
    player: getCharacterVisualAsset(playerCharacterId, 'idle'),
  };
}

function makeDialogueCard(scene, {
  side, asset, characterVisual, speaker, text, onContinue, finalPage,
}) {
  const layout = OPENING_PHONE_DIALOGUE_LAYOUTS[side === 'right' ? 'right' : 'left'];
  const speech = layout.bubble;
  const sprites = [];
  const depth = DEPTH + 5;
  // This is the ACTUAL race dialogue component: transparent cropped head,
  // separate side-mounted speech bubble, mirrored tail for player replies.
  const hud = createRaceDialogueHud(scene, {
    theme: 'phone',
    depth,
    layout,
    side,
    speaker,
    initialPose: 'idle',
    spriteKeyForPose: () => asset?.key || '',
    characterVisual,
    phoneIconKey: PHONE_TEXTURE,
  });
  hud.dialogue.setText(text).setFontSize('19px').setLineSpacing(5);
  const add = item => { sprites.push(item); return item; };
  const buttonX = side === 'right' ? speech.left + 116 : speech.right - 116;
  const buttonY = speech.bottom + 29;
  const button = add(scene.add.rectangle(buttonX, buttonY, 208, 46,
    0x1e6a9e, 1).setStrokeStyle(2, 0xaee1ff)
    .setInteractive({ useHandCursor: true }));
  add(scene.add.text(buttonX, buttonY,
    finalPage ? 'END CALL >' : 'CONTINUE >', {
      fontFamily: PIXEL, fontSize: '10px', color: '#ffffff',
    }).setOrigin(0.5));
  const group = scene.add.container(0, 0,
    [...hud.objects, ...sprites]).setScrollFactor(0).setDepth(depth);
  // The portrait's crop uses a geometry mask. Keep that mask aligned while
  // the whole call swipes vertically, instead of clipping the head mid-swipe.
  const alignMask = () => hud.maskShape?.setY(group.y);
  let destroyed = false;
  const dispose = () => {
    if (destroyed) return;
    destroyed = true;
    scene.tweens?.killTweensOf?.(group);
    hud.destroy();
    group.destroy(true);
  };
  button.on('pointerdown', () => onContinue?.(group, button, alignMask));
  return { group, dispose, alignMask };
}

export function playOpeningPhonePrototype(scene, {
  callerId = 'sayakaFujieda',
  callerName = 'SAYAKA',
  callerPose = 'idle',
  pages = [],
  variables = {},
  formatMessage = text => String(text || ''),
  onComplete = null,
  onCancel = null,
} = {}) {
  if (!scene || scene._phoneConversation?.active) {
    return { played: false, reason: 'active', active: false };
  }
  const chapter = Array.isArray(pages) ? pages : [pages];
  if (!chapter.length) return { played: false, reason: 'empty', active: false };
  const playerCharacterId = scene.registry?.get?.('playerCharacterId') || 'renMizuno';
  const assets = getOpeningPhoneAssets(callerId, callerPose, playerCharacterId);
  const fullVars = {
    PLAYER_FIRST_NAME: String(scene.registry?.get?.('firstName') || 'Driver').trim() || 'Driver',
    ...variables,
  };
  const state = { played: true, active: true, phase: 'loading',
    pageIndex: -1, close: null };
  scene._phoneConversation = state;
  let guard = false;
  let objects = [];
  let currentCard = null;
  let vibrate = null;
  let pendingLoader = null;
  const own = object => { objects.push(object);return object; };
  const cleanup = () => {
    if (!state.active) return false;
    state.active = false;
    scene.events?.off?.('shutdown', shutdown);
    scene.events?.off?.('destroy', shutdown);
    if (pendingLoader) scene.load?.off?.(Phaser.Loader.Events.COMPLETE, pendingLoader);
    vibrate?.remove?.();
    currentCard?.dispose?.();
    objects.forEach(object => { scene.tweens?.killTweensOf?.(object);safeDestroy(object); });
    objects = [];
    if (scene._phoneConversation === state) scene._phoneConversation = null;
    return true;
  };
  const shutdown = () => { if (cleanup()) onCancel?.({ reason: 'shutdown' }); };
  scene.events?.once?.('shutdown', shutdown);
  scene.events?.once?.('destroy', shutdown);
  state.close = (reason = 'action') => {
    if (!cleanup()) return;
    if (reason === 'action') onComplete?.({ reason, pages: chapter.length });
    else onCancel?.({ reason });
  };

  const doTween = (target, config) => {
    if (scene.tweens?.add) return scene.tweens.add({ targets: target, ...config });
    Object.assign(target, { y: config.y ?? target.y,
      alpha: config.alpha ?? target.alpha });
    config.onComplete?.();
    return null;
  };

  const showPage = index => {
    if (!state.active) return;
    state.phase = index === 0 ? 'caller' : 'player';
    state.pageIndex = index;
    const page = chapter[index] || {};
    const player = page.speaker === 'player';
    const actor = player ? characters[playerCharacterId] : characters[callerId];
    const asset = player ? assets.player : assets.caller;
    const vars = { ...fullVars, ...(page.variables || {}) };
    const text = formatMessage(page.text, vars);
    const card = makeDialogueCard(scene, {
      side: player ? 'right' : 'left',
      asset,
      characterVisual: actor?.visual || {},
      speaker: player ? String(vars.PLAYER_FIRST_NAME || 'DRIVER').toUpperCase()
        : String(callerName || actor?.name || 'CALLER').toUpperCase(),
      text,
      finalPage: index === chapter.length - 1,
      onContinue: (group, button, alignMask) => {
        if (guard || !state.active) return;
        guard = true;
        button.disableInteractive();
        state.phase = 'transition';
        // Entire caller card swipes vertically off the screen before the
        // opposite-handed player card slides into its place.
        doTween(group, {
          y: -460, alpha: 0, duration: OPENING_PHONE_LAYOUT.transitionMs,
          ease: 'Cubic.In', onUpdate: alignMask, onComplete: () => {
            card.dispose();
            if (currentCard === card) currentCard = null;
            if (!state.active) return;
            if (index === chapter.length - 1) state.close('action');
            else { guard = false; showPage(index + 1); }
          },
        });
      },
    });
    currentCard = card;
    card.group.setY(400).setAlpha(0);
    card.alignMask();
    doTween(card.group, {
      y: 0, alpha: 1, duration: OPENING_PHONE_LAYOUT.transitionMs,
      ease: 'Cubic.Out', onUpdate: card.alignMask,
    });
  };

  const showIncoming = () => {
    if (!state.active) return;
    state.phase = 'ringing';
    own(scene.add.rectangle(780, 420, 1560, 840,
      0x0b1524, 0.65).setDepth(DEPTH).setScrollFactor(0).setInteractive());
    own(scene.add.text(780, 158, 'INCOMING CALL', {
      fontFamily: PIXEL, fontSize: '26px', color: '#ebfaff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 4));
    own(scene.add.text(780, 230, String(callerName).toUpperCase(), {
      fontFamily: PIXEL, fontSize: '16px', color: '#a4d7f4',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 4));
    const { phone } = OPENING_PHONE_LAYOUT;
    let sprite;
    if (scene.textures.exists(PHONE_TEXTURE)) {
      const source = scene.textures.get(PHONE_TEXTURE).getSourceImage();
      sprite = own(scene.add.image(phone.x, phone.y, PHONE_TEXTURE)
        .setScrollFactor(0).setDepth(DEPTH + 3).setOrigin(0.5));
      sprite.setScale(Math.min(phone.maxSize / Math.max(1, source.width || 1),
        phone.maxSize / Math.max(1, source.height || 1)));
    } else {
      sprite = own(scene.add.text(phone.x, phone.y, '☎', {
        fontFamily: BODY, fontSize: '145px', color: '#c9e8fa',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3));
    }
    // Rotate about the sprite's centre (not the bottom), like a buzzing phone.
    vibrate = scene.tweens?.add?.({
      targets: sprite, angle: { from: -8, to: 8 },
      duration: 88, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    const green = own(scene.add.circle(phone.x, phone.pickupY, 55,
      0x1ab565, 1).setStrokeStyle(5, 0xd4ffdf)
      .setDepth(DEPTH + 6).setScrollFactor(0).setInteractive({ useHandCursor: true }));
    own(scene.add.text(phone.x, phone.pickupY - 6, '☎', {
      fontFamily: BODY, fontSize: '39px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 7));
    own(scene.add.text(phone.x, phone.pickupY + 83, 'PICK UP', {
      fontFamily: PIXEL, fontSize: '13px', color: '#e8ffe9',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 7));
    green.once('pointerdown', () => {
      if (!state.active || state.phase !== 'ringing') return;
      state.phase = 'answering';
      green.disableInteractive();
      vibrate?.remove?.();
      vibrate = null;
      // Keep the see-through shield; remove the phone and ringing captions.
      objects.splice(1).forEach(obj => safeDestroy(obj));
      showPage(0);
    });
  };

  const queued = [];
  for (const asset of [assets.caller, assets.player]) {
    if (asset?.key && asset?.path && !scene.textures.exists(asset.key) &&
        !queued.some(entry => entry[0] === asset.key)) {
      queued.push([asset.key, getCharacterAssetUrl(asset.path)]);
    }
  }
  if (!scene.textures.exists(PHONE_TEXTURE)) queued.push([PHONE_TEXTURE, PHONE_PATH]);
  if (queued.length) {
    queued.forEach(([key, path]) => scene.load.image(key, path));
    pendingLoader = () => { pendingLoader = null; if (state.active) showIncoming(); };
    scene.load.once(Phaser.Loader.Events.COMPLETE, pendingLoader);
    if (!scene.load.isLoading?.()) scene.load.start();
  } else {
    showIncoming();
  }
  return state;
}
