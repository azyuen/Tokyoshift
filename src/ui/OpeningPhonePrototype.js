// Opening-only prototype for the phone-call choreography. Other authored
// phone scenes continue to use PhoneConversation until this design is approved.
import {
  characters, getCharacterAssetUrl, getCharacterVisualAsset,
} from '../data/characters.js';
import { resolveCharacterFaceAnchor } from '../characters/CharacterFaceAnchor.js';

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

const CARD_THEME = Object.freeze({
  fill: 0xe5f4ff,
  fillAlpha: 0.92,
  portraitFill: 0xd4ebfa,
  portraitAlpha: 0.87,
  stroke: 0x287bb5,
});
const safeDestroy = object => { try { object?.destroy?.(); } catch (_) {} };
const withAlpha = object => object?.setAlpha?.(0);

export function getOpeningPhoneAssets(callerId, pose, playerCharacterId) {
  return {
    caller: getCharacterVisualAsset(callerId, pose),
    player: getCharacterVisualAsset(playerCharacterId, 'idle'),
  };
}

function addPortrait(scene, sprites, asset, characterVisual, x, y, width, height) {
  sprites.push(scene.add.rectangle(x, y, width, height,
    CARD_THEME.portraitFill, CARD_THEME.portraitAlpha));
  if (!asset?.key || !scene.textures.exists(asset.key)) {
    sprites.push(scene.add.text(x, y, '?', {
      fontFamily: PIXEL, fontSize: '22px', color: '#287bb5',
    }).setOrigin(0.5));
    return;
  }
  const texture = scene.textures.get(asset.key);
  texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  const source = texture.getSourceImage();
  const sw = Number(source.naturalWidth || source.width || 1);
  const sh = Number(source.naturalHeight || source.height || 1);
  const anchor = resolveCharacterFaceAnchor(source, asset.key, characterVisual, 'idle');
  // Show the face through the neckline, not the full-length sprite. Cropping
  // avoids a geometry mask that would stay stationary when the card swipes.
  const size = Math.max(1, Math.min(sw, sh,
    Math.max(anchor.headHeight * 2.1, sh * 0.19)));
  const left = Math.max(0, Math.min(sw - size, anchor.x - size * 0.5));
  const top = Math.max(0, Math.min(sh - size, anchor.y - size * 0.28));
  const scale = Math.max(width, height) / size;
  const image = scene.add.image(
    x - (left + size / 2 - sw / 2) * scale,
    y - (top + size / 2 - sh / 2) * scale, asset.key,
  ).setScale(scale);
  image.setCrop(left, top, size, size);
  sprites.push(image);
}

function makeDialogueCard(scene, {
  side, asset, characterVisual, speaker, text, onContinue, finalPage,
}) {
  const { card } = OPENING_PHONE_LAYOUT;
  const x1 = card.x - card.width / 2;
  const x2 = card.x + card.width / 2;
  const top = card.y - card.height / 2;
  const bottom = card.y + card.height / 2;
  const actorOnRight = side === 'right';
  const cellX = actorOnRight
    ? x2 - card.portraitWidth / 2
    : x1 + card.portraitWidth / 2;
  const dividingX = actorOnRight
    ? x2 - card.portraitWidth : x1 + card.portraitWidth;
  const textboxLeft = actorOnRight ? x1 + 38 : dividingX + 38;
  const textboxWidth = card.width - card.portraitWidth - 75;
  const sprites = [];
  const add = obj => { sprites.push(obj); return obj; };

  // One continuous bordered card, with the portrait inside a joined panel.
  add(scene.add.rectangle(card.x, card.y, card.width, card.height,
    CARD_THEME.fill, CARD_THEME.fillAlpha).setStrokeStyle(5, CARD_THEME.stroke));
  add(scene.add.rectangle(cellX, card.y, card.portraitWidth - 8,
    card.height - 8, CARD_THEME.portraitFill, CARD_THEME.portraitAlpha));
  add(scene.add.rectangle(dividingX, card.y, 3, card.height - 10,
    CARD_THEME.stroke, 0.9));

  addPortrait(scene, sprites, asset, characterVisual,
    cellX, card.y, card.portraitWidth - 16, card.height - 16);

  add(scene.add.text(textboxLeft, top + 32, speaker, {
    fontFamily: PIXEL, fontSize: '13px', color: '#135780',
  }));
  add(scene.add.text(textboxLeft, top + 85, text, {
    fontFamily: BODY, fontSize: '24px', fontStyle: 'bold',
    color: '#142d45', lineSpacing: 8,
    wordWrap: { width: textboxWidth },
  }));

  const buttonX = actorOnRight ? dividingX - 116 : x2 - 116;
  const buttonY = bottom - 36;
  const button = add(scene.add.rectangle(buttonX, buttonY, 185, 45,
    0x1e6a9e, 1).setStrokeStyle(2, 0xaee1ff)
    .setInteractive({ useHandCursor: true }));
  add(scene.add.text(buttonX, buttonY,
    finalPage ? 'END CALL >' : 'CONTINUE >', {
      fontFamily: PIXEL, fontSize: '10px', color: '#ffffff',
    }).setOrigin(0.5));
  const group = scene.add.container(0, 0, sprites).setScrollFactor(0)
    .setDepth(DEPTH + 5);
  const dispose = () => {
    scene.tweens?.killTweensOf?.(group);
    group.destroy(true);
  };
  button.on('pointerdown', () => onContinue?.(group, button));
  return { group, dispose };
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
      onContinue: (group, button) => {
        if (guard || !state.active) return;
        guard = true;
        button.disableInteractive();
        state.phase = 'transition';
        // Entire caller card swipes vertically off the screen before the
        // opposite-handed player card slides into its place.
        doTween(group, {
          y: -460, alpha: 0, duration: OPENING_PHONE_LAYOUT.transitionMs,
          ease: 'Cubic.In', onComplete: () => {
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
    card.group.setY(500).setAlpha(0);
    doTween(card.group, {
      y: 0, alpha: 1, duration: OPENING_PHONE_LAYOUT.transitionMs,
      ease: 'Cubic.Out',
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
