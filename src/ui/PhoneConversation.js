// Canonical caller dialogue. Phone conversations now share the same floating
// face and outward-tail manga speech layout as in-race coaching; their blue
// border, pale-blue fill and corner phone icon distinguish remote calls.
import {
  characters,
  getCharacterAssetUrl,
  getCharacterVisualAsset,
} from '../data/characters.js?v=20261011-r477';
import {
  createRaceDialogueHud, RACE_COACH_LAYOUT,
} from './RaceCoachHud.js?v=20261014-r514';

const PIXEL_FONT = '"Silkscreen", monospace';
const PHONE_ICON_KEY = 'openingIncomingPhone';
const PHONE_ICON_PATH = 'assets/Ui/phone.png?v=20261011-r480';
const DEPTH = 305;

export const PHONE_ACCENTS = Object.freeze({
  incoming: 0x287bb5, // blue phone border
  player: 0x165b9a,   // deeper blue for spoken replies
});

const toColor = (value, fallback) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(String(value || '').replace(/^#/, ''), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function getPhoneAccent(speakerStyle = 'incoming', override = null) {
  const style = speakerStyle === 'player' ? 'player' : 'incoming';
  return override == null
    ? PHONE_ACCENTS[style]
    : toColor(override, PHONE_ACCENTS[style]);
}

export function formatPhoneMessage(text, variables = {}) {
  return String(text ?? '')
    .replace(/\\n/g, '\n')
    .replace(/\{([A-Z0-9_]+)\}/g, (_, name) =>
      variables[name] == null ? '' : String(variables[name])
    );
}

export function getPhoneCallerPortrait(callerId, pose = 'idle') {
  return getCharacterVisualAsset(callerId, pose) ||
    getCharacterVisualAsset(callerId, 'idle');
}

const safeDestroy = value => {
  try { value?.destroy?.(); } catch (_) {}
};

export function playPhoneConversation(scene, {
  presentationMode = 'standard',
  callerId = '',
  callerName = '',
  callerPose = 'idle',
  label = 'INCOMING CALL',
  pages = [],
  variables = {},
  speakerStyle = 'incoming',
  accent = null,
  onComplete = null,
  onCancel = null,
} = {}) {
  if (presentationMode === 'openingSwipe') {
    // This one-off scene must not be an eager module dependency of the entire
    // game. An unavailable prototype asset on iOS used to crash every scene
    // during boot even for players nowhere near the opening phone call.
    if (!scene || scene._phoneConversation?.active) {
      return { played: false, reason: 'active', active: false };
    }
    const callPages = (Array.isArray(pages) ? pages : [pages]).filter(Boolean);
    if (!callPages.length) {
      return { played: false, reason: 'empty', active: false };
    }

    // Return synchronously to existing MangaCutscene callers. When the module
    // becomes available, delegate close to the real controller; otherwise use
    // the standard production phone presentation as a functional fallback.
    const pending = { played: true, active: true, phase: 'loading', close: null };
    let controller = null;
    scene._phoneConversation = pending;

    const detach = () => {
      scene.events?.off?.('shutdown', abort);
      scene.events?.off?.('destroy', abort);
      if (scene._phoneConversation === pending) scene._phoneConversation = null;
    };
    const abort = () => {
      if (!pending.active) return;
      detach();
      pending.active = false;
      onCancel?.({ reason: 'shutdown' });
    };
    scene.events?.once?.('shutdown', abort);
    scene.events?.once?.('destroy', abort);

    const finish = (...args) => { pending.active = false; onComplete?.(...args); };
    const cancel = (...args) => { pending.active = false; onCancel?.(...args); };
    const common = {
      callerId, callerName, callerPose, label, pages, variables,
      onComplete: finish, onCancel: cancel,
    };
    const startCall = factory => {
      if (!pending.active) return;
      detach();
      controller = factory();
      if (!controller?.played) {
        pending.active = false;
        cancel({ reason: controller?.reason || 'unavailable' });
      } else {
        pending.phase = controller.phase || 'active';
      }
    };
    pending.close = (reason = 'cancel') => {
      if (controller) return controller.close?.(reason);
      if (!pending.active) return;
      detach();
      pending.active = false;
      onCancel?.({ reason });
    };

    const standardFallback = error => {
      if (!pending.active) return;
      console.warn('[Tokyo SHIFT] opening phone module unavailable; using standard call', error);
      try {
        startCall(() => playPhoneConversation(scene, {
          ...common, presentationMode: 'standard', speakerStyle, accent,
        }));
      } catch (fallbackError) {
        console.error('[Tokyo SHIFT] standard phone fallback failed', fallbackError);
        pending.active = false;
        cancel({ reason: 'load-error' });
      }
    };

    import('./OpeningPhonePrototype.js?v=20261015-r524')
      .then(module => {
        if (!pending.active) return;
        if (typeof module.playOpeningPhonePrototype !== 'function') {
          standardFallback(new Error('Opening phone renderer unavailable'));
          return;
        }
        try {
          startCall(() => module.playOpeningPhonePrototype(scene, {
            ...common, formatMessage: formatPhoneMessage,
          }));
        } catch (error) {
          standardFallback(error);
        }
      })
      .catch(standardFallback);
    return pending;
  }
  if (!scene || scene._phoneConversation?.active) {
    return { played: false, reason: 'active', active: false };
  }
  const normalisedPages = (Array.isArray(pages) ? pages : [pages])
    .map(page => typeof page === 'string' ? { text: page } : page)
    .filter(Boolean);
  if (!normalisedPages.length) {
    return { played: false, reason: 'empty', active: false };
  }

  const caller = characters[callerId];
  const name = String(callerName || caller?.name || 'UNKNOWN CALLER').toUpperCase();
  const portraitAsset = getPhoneCallerPortrait(callerId, callerPose);
  const localVariables = {
    PLAYER_FIRST_NAME: String(scene.registry?.get?.('firstName') || 'there').trim() || 'there',
    ...variables,
  };
  const state = { played: true, active: true, pageIndex: 0, close: null };
  scene._phoneConversation = state;

  const objects = [];
  const add = object => { objects.push(object); return object; };
  let panel = null;
  let nextButton = null;
  let nextText = null;
  let pageCounter = null;
  let lastAdvanceAt = 0;

  const cleanup = () => {
    if (!state.active) return false;
    state.active = false;
    scene.events?.off?.('shutdown', shutdown);
    scene.events?.off?.('destroy', shutdown);
    objects.forEach(object => {
      scene.tweens?.killTweensOf?.(object);
      safeDestroy(object);
    });
    panel?.destroy?.();
    if (scene._phoneConversation === state) scene._phoneConversation = null;
    return true;
  };
  const shutdown = () => { if (cleanup()) onCancel?.({ reason: 'shutdown' }); };
  scene.events?.once?.('shutdown', shutdown);
  scene.events?.once?.('destroy', shutdown);

  state.close = (reason = 'action') => {
    if (!cleanup()) return;
    if (reason === 'action') onComplete?.({ reason, pages: normalisedPages.length });
    else onCancel?.({ reason });
  };

  const begin = () => {
    if (!state.active) return;
    const b = RACE_COACH_LAYOUT.bubble;
    // Input shield prevents clicking through an active call without obscuring
    // the garage. The blue-tinted bubble alone denotes the remote speaker.
    add(scene.add.rectangle(780, 420, 1560, 840, 0x070f19, 0.001)
      .setScrollFactor(0).setDepth(DEPTH).setInteractive());
    panel = createRaceDialogueHud(scene, {
      theme: 'phone',
      depth: DEPTH + 1,
      speaker: String(label || 'CALLER').toUpperCase() + ': ' + name,
      initialPose: callerPose,
      spriteKeyForPose: () => portraitAsset?.key || '',
      characterVisual: caller?.visual || {},
      phoneIconKey: PHONE_ICON_KEY,
    });
    if (!portraitAsset?.key || !scene.textures.exists(portraitAsset.key)) {
      add(scene.add.text(RACE_COACH_LAYOUT.face.targetX,
        RACE_COACH_LAYOUT.face.targetY, '?', {
        fontFamily: PIXEL_FONT, fontSize: '24px', color: '#145b8d',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 5));
    }

    nextButton = add(scene.add.rectangle(b.right - 92, b.bottom + 34, 176, 43,
      PHONE_ACCENTS.incoming, 1)
      .setStrokeStyle(2, 0xd5ecfb, 1)
      .setScrollFactor(0).setDepth(DEPTH + 8)
      .setInteractive({ useHandCursor: true }));
    nextText = add(scene.add.text(b.right - 92, b.bottom + 34, 'NEXT >', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff',
    }).setScrollFactor(0).setOrigin(0.5).setDepth(DEPTH + 9));
    pageCounter = add(scene.add.text(b.left + 10, b.bottom + 34, '', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#155987',
    }).setScrollFactor(0).setOrigin(0, 0.5).setDepth(DEPTH + 8));

    const showPage = () => {
      const page = normalisedPages[state.pageIndex] || {};
      const vars = { ...localVariables, ...(page.variables || {}) };
      const pageStyle = page.speakerStyle ||
        (page.speaker === 'player' ? 'player' : speakerStyle);
      const color = getPhoneAccent(pageStyle, page.accent ?? accent);
      panel.setAccent(color);
      nextButton.setFillStyle(color, 1);
      const isPlayer = pageStyle === 'player';
      panel.heading.setText(isPlayer
        ? 'YOU: ' + String(vars.PLAYER_FIRST_NAME || 'DRIVER').toUpperCase()
        : String(label || 'CALLER').toUpperCase() + ': ' + name);
      panel.dialogue.setText(formatPhoneMessage(page.text, vars));
      nextText.setText(state.pageIndex < normalisedPages.length - 1
        ? 'NEXT >' : 'CONTINUE >');
      pageCounter.setText(normalisedPages.length > 1
        ? String(state.pageIndex + 1).padStart(2, '0') + ' / ' +
          String(normalisedPages.length).padStart(2, '0')
        : '');
    };

    nextButton.on('pointerdown', () => {
      if (!state.active) return;
      const now = Date.now();
      if (now - lastAdvanceAt < 200) return;
      lastAdvanceAt = now;
      if (state.pageIndex + 1 < normalisedPages.length) {
        state.pageIndex++;
        showPage();
      } else {
        nextButton.disableInteractive();
        state.close('action');
      }
    });
    showPage();
  };

  const queued = [];
  if (portraitAsset?.key && portraitAsset?.path &&
      !scene.textures.exists(portraitAsset.key)) {
    queued.push([portraitAsset.key, getCharacterAssetUrl(portraitAsset.path)]);
  }
  if (!scene.textures.exists(PHONE_ICON_KEY)) {
    queued.push([PHONE_ICON_KEY, PHONE_ICON_PATH]);
  }
  if (queued.length) {
    queued.forEach(([key, path]) => scene.load.image(key, path));
    const ready = () => { if (state.active) begin(); };
    scene.load.once(Phaser.Loader.Events.COMPLETE, ready);
    if (!scene.load.isLoading?.()) scene.load.start();
  } else {
    begin();
  }
  return state;
}
