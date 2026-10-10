// Canonical phone-style cutscene UI for Tokyo SHIFT.
// Single and multi-page calls share the same portrait, bubble, navigation
// and input guard; callers may also invoke this through playMangaCutscene
// with presentation: 'phone'.
import {
  characters,
  getCharacterAssetUrl,
  getCharacterVisualAsset,
} from '../data/characters.js?v=20261011-r477';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const PHONE_ICON_KEY = 'phoneCutsceneIcon';
const PHONE_ICON_PATH = 'assets/Ui/phone.png?v=20261011-r478';
const DEPTH = 305;
const BOX = Object.freeze({ x: 430, y: 304, width: 880, height: 220, radius: 34 });
const PORTRAIT = Object.freeze({ x: 405, y: 421, radius: 91 });

const toColor = (value, fallback) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(String(value || '').replace(/^#/, ''), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function formatPhoneMessage(text, variables = {}) {
  // Authored scene JSON sometimes contains literal "\n" text. Both forms
  // should render as a real line break, never backslash + n on screen.
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
  callerId = '',
  callerName = '',
  callerPose = 'idle',
  label = 'INCOMING CALL',
  pages = [],
  variables = {},
  accent = 0xd94479,
  onComplete = null,
  onCancel = null,
} = {}) {
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
  const state = {
    played: true,
    active: true,
    pageIndex: 0,
    close: null,
  };
  scene._phoneConversation = state;

  const color = toColor(accent, 0xd94479);
  const objects = [];
  const add = obj => { objects.push(obj); return obj; };
  let maskShape = null;
  let portraitMask = null;
  let messageText = null;
  let nextText = null;
  let nextButton = null;
  let pageCounter = null;
  let lastAdvanceAt = 0;

  const cleanup = () => {
    if (!state.active) return false;
    state.active = false;
    scene.events?.off?.('shutdown', shutdown);
    scene.events?.off?.('destroy', shutdown);
    objects.forEach(obj => {
      scene.tweens?.killTweensOf?.(obj);
      safeDestroy(obj);
    });
    safeDestroy(portraitMask);
    safeDestroy(maskShape);
    if (scene._phoneConversation === state) scene._phoneConversation = null;
    return true;
  };
  const shutdown = () => {
    if (cleanup()) onCancel?.({ reason: 'shutdown' });
  };
  scene.events?.once?.('shutdown', shutdown);
  scene.events?.once?.('destroy', shutdown);

  state.close = (reason = 'action') => {
    if (!cleanup()) return;
    if (reason === 'action') onComplete?.({ reason, pages: normalisedPages.length });
    else onCancel?.({ reason });
  };

  const begin = () => {
    if (!state.active) return;

    // Dim the office/garage but keep the location clearly visible.
    add(scene.add.rectangle(780, 420, 1560, 840, 0x080c15, 0.34)
      .setScrollFactor(0).setDepth(DEPTH).setInteractive());

    const panel = add(scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 1));
    panel.fillStyle(0x000000, 0.22);
    panel.fillRoundedRect(BOX.x + 6, BOX.y + 9, BOX.width, BOX.height, BOX.radius);
    panel.fillStyle(0xffedf2, 0.98);
    panel.fillRoundedRect(BOX.x, BOX.y, BOX.width, BOX.height, BOX.radius);
    panel.lineStyle(3, color, 0.95);
    panel.strokeRoundedRect(BOX.x, BOX.y, BOX.width, BOX.height, BOX.radius);

    // The small manga speech tail points to the overlapping caller portrait.
    panel.fillStyle(0xffedf2, 1);
    panel.fillTriangle(BOX.x + 15, BOX.y + 102, BOX.x - 34, BOX.y + 132,
      BOX.x + 22, BOX.y + 144);
    panel.lineStyle(3, color, 0.88);
    panel.lineBetween(BOX.x + 15, BOX.y + 102, BOX.x - 34, BOX.y + 132);
    panel.lineBetween(BOX.x - 34, BOX.y + 132, BOX.x + 22, BOX.y + 144);

    // The head-and-shoulders crop is consistent regardless of source dimensions.
    // A circular geometry mask is used rather than a square image background.
    add(scene.add.circle(PORTRAIT.x + 3, PORTRAIT.y + 5,
      PORTRAIT.radius + 9, 0x101727, 0.25).setDepth(DEPTH + 2));
    add(scene.add.circle(PORTRAIT.x, PORTRAIT.y,
      PORTRAIT.radius + 7, color, 1).setDepth(DEPTH + 3));
    add(scene.add.circle(PORTRAIT.x, PORTRAIT.y,
      PORTRAIT.radius, 0xf6d6df, 1).setDepth(DEPTH + 4));

    if (portraitAsset?.key && scene.textures.exists(portraitAsset.key)) {
      const texture = scene.textures.get(portraitAsset.key);
      texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
      const source = texture.getSourceImage();
      const w = Number(source?.naturalWidth || source?.width || 1);
      const h = Number(source?.naturalHeight || source?.height || 1);
      const cropSize = Math.max(1, Math.min(w * 0.84, h * 0.42));
      const cropX = (w - cropSize) * 0.5;
      // Character artwork includes a full-length body; prioritise the head.
      const cropY = Math.min(h - cropSize, Math.max(0, h * 0.035));
      const scale = (PORTRAIT.radius * 2.12) / cropSize;
      const image = add(scene.add.image(PORTRAIT.x, PORTRAIT.y, portraitAsset.key)
        .setScrollFactor(0).setDepth(DEPTH + 5).setScale(scale));
      image.setCrop(cropX, cropY, cropSize, cropSize);
      image.setPosition(
        PORTRAIT.x - ((cropX + cropSize * 0.5) - w * 0.5) * scale,
        PORTRAIT.y - ((cropY + cropSize * 0.5) - h * 0.5) * scale
      );
      maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillCircle(PORTRAIT.x, PORTRAIT.y, PORTRAIT.radius);
      portraitMask = maskShape.createGeometryMask();
      image.setMask(portraitMask);
    } else {
      add(scene.add.text(PORTRAIT.x, PORTRAIT.y, '?', {
        fontFamily: PIXEL_FONT, fontSize: '36px', color: '#41343e',
      }).setScrollFactor(0).setOrigin(0.5).setDepth(DEPTH + 5));
    }

    const pill = add(scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 6));
    pill.fillStyle(color, 1);
    pill.fillRoundedRect(507, 280, 320, 51, 25);
    const nameText = String(label || 'CALLER').toUpperCase() + ': ' + name;
    add(scene.add.text(531, 305, nameText, {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffffff',
    }).setScrollFactor(0).setOrigin(0, 0.5).setDepth(DEPTH + 7));

    // Phone sprite is deliberately tiny: it supplements, not replaces, a face.
    if (scene.textures.exists(PHONE_ICON_KEY)) {
      const icon = add(scene.add.image(796, 305, PHONE_ICON_KEY)
        .setScrollFactor(0).setDepth(DEPTH + 8));
      const src = scene.textures.get(PHONE_ICON_KEY).getSourceImage();
      icon.setScale(Math.min(26 / (src.width || 1), 26 / (src.height || 1)));
    }

    messageText = add(scene.add.text(538, 355, '', {
      fontFamily: BODY_FONT,
      fontSize: '26px',
      fontStyle: '700',
      color: '#242431',
      lineSpacing: 9,
      align: 'left',
      wordWrap: { width: 706 },
    }).setScrollFactor(0).setDepth(DEPTH + 7));

    nextButton = add(scene.add.rectangle(1198, 550, 200, 51, color, 1)
      .setStrokeStyle(2, 0xffcbd9, 1)
      .setScrollFactor(0).setDepth(DEPTH + 8)
      .setInteractive({ useHandCursor: true }));
    nextText = add(scene.add.text(1198, 550, 'NEXT >', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffffff',
    }).setScrollFactor(0).setOrigin(0.5).setDepth(DEPTH + 9));
    pageCounter = add(scene.add.text(1265, 510, '', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#92596b',
    }).setScrollFactor(0).setOrigin(1, 1).setDepth(DEPTH + 7));

    const showPage = () => {
      const page = normalisedPages[state.pageIndex] || {};
      const vars = { ...localVariables, ...(page.variables || {}) };
      messageText.setText(formatPhoneMessage(page.text, vars));
      nextText.setText(state.pageIndex < normalisedPages.length - 1 ? 'NEXT >' : 'CONTINUE >');
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
    if (!scene.load.isLoading()) scene.load.start();
  } else {
    begin();
  }

  return state;
}
