import {
  characters,
} from '../data/characters.js?v=20260925-r182';
import {
  getCutscene,
  getCutsceneList,
  getCutsceneCharacterIds,
  hasSeenCutscene,
  markCutsceneSeen,
} from '../data/cutscenes.js?v=20260925-r184';
import {
  createCharacterProfile,
} from '../characters/CharacterProfileRenderer.js?v=20260925-r182';
import { saveSessionState } from '../state/GameState.js?v=20260925-r184';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const CUTSCENE_DEPTH = 500;
const PAGE_DEBOUNCE_MS = 190;

const destroyObject = obj => {
  try { obj?.destroy?.(); } catch (e) {}
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function resolvePlayerName(scene, playerId) {
  const first = String(scene.registry.get('firstName') || '').trim();
  const last = String(scene.registry.get('lastName') || '').trim();
  return [first, last].filter(Boolean).join(' ')
    || characters[playerId]?.name
    || 'DRIVER';
}

function resolveText(value, tokens = {}) {
  return String(value || '').replace(/\{([A-Z0-9_]+)\}/gi, (_, key) => {
    const token = tokens[String(key).toUpperCase()];
    return token == null ? '{' + key + '}' : String(token);
  });
}

function getResolvedCharacters(scene, definition, options = {}) {
  const playerId = scene.registry.get('playerCharacterId') || 'renMizuno';
  const override = options.characterOverrides || {};
  const resolveSide = side => {
    if (override[side]) return override[side];
    const raw = definition.characters?.[side];
    if (raw === '$PLAYER') return playerId;
    if (raw && !String(raw).startsWith('$')) return raw;
    return null;
  };

  return {
    playerId,
    left: resolveSide('left'),
    right: resolveSide('right'),
    center: resolveSide('center'),
  };
}

function profilePathsForCharacter(characterId) {
  const visual = characters[characterId]?.visual || {};
  return [
    [visual.spriteKey, visual.path],
    [visual.winSpriteKey, visual.winPath],
    [visual.lossSpriteKey, visual.lossPath],
  ].filter(([key, path]) => key && path);
}

export function preloadMangaCutsceneAssets(scene) {
  if (!scene?.load || !scene?.textures) return 0;

  const playerId = scene.registry?.get?.('playerCharacterId') || 'renMizuno';
  const ids = new Set([
    playerId,
    ...getCutsceneCharacterIds(),
  ]);

  let queued = 0;
  ids.forEach(id => {
    profilePathsForCharacter(id).forEach(([key, path]) => {
      if (!scene.textures.exists(key)) {
        scene.load.image(key, path + '?v=20260925-r184');
        queued += 1;
      }
    });
  });

  return queued;
}

export function sceneCutsceneActive(scene) {
  return Boolean(scene?._mangaCutsceneActive);
}

function makeDialoguePointer(scene, x, y, speaker, depth) {
  const g = scene.add.graphics().setDepth(depth);
  g.fillStyle(0xfaf8f1, 1);
  g.lineStyle(4, 0x090b0d, 1);

  if (speaker === 'left') {
    g.fillTriangle(x - 310, y - 22, x - 365, y + 6, x - 306, y + 20);
    g.strokeTriangle(x - 310, y - 22, x - 365, y + 6, x - 306, y + 20);
  } else if (speaker === 'right') {
    g.fillTriangle(x + 310, y - 22, x + 365, y + 6, x + 306, y + 20);
    g.strokeTriangle(x + 310, y - 22, x + 365, y + 6, x + 306, y + 20);
  }

  return g;
}

export function playMangaCutscene(scene, cutsceneId, options = {}) {
  if (!scene || sceneCutsceneActive(scene)) return null;

  const definition = getCutscene(cutsceneId);
  if (!definition) return null;

  const preview = Boolean(options.preview);
  const historyKey = String(options.historyKey || cutsceneId);

  if (
    definition.once &&
    !preview &&
    !options.force &&
    hasSeenCutscene(scene.registry, historyKey)
  ) {
    options.onComplete?.({
      id: cutsceneId,
      historyKey,
      alreadySeen: true,
    });
    return null;
  }

  const W = Math.max(1, Number(scene.scale?.width || 1560));
  const H = Math.max(1, Number(scene.scale?.height || 840));
  const depth = Number(options.depth || CUTSCENE_DEPTH);
  const resolved = getResolvedCharacters(scene, definition, options);
  const playerDisplayName = resolvePlayerName(scene, resolved.playerId);
  const tokenDefaults = {
    PLAYER: playerDisplayName,
    REGION: 'Shinagawa',
    TUNER: 'Spoon Sports',
  };
  const tokens = Object.fromEntries(
    Object.entries({ ...tokenDefaults, ...(options.tokens || {}) })
      .map(([key, value]) => [String(key).toUpperCase(), value])
  );

  const state = {
    id: cutsceneId,
    definition,
    options,
    preview,
    historyKey,
    pageIndex: -1,
    lastAdvanceAt: 0,
    finishing: false,
    cleaned: false,
    characters: resolved,
    poses: { left: 'idle', right: 'idle', center: 'idle' },
    profiles: { left: null, right: null, center: null },
    profileDimmed: { left: false, right: false, center: false },
    staticObjects: [],
    dialogueObjects: [],
    introObjects: [],
    previousTimeScale: Number(scene.time?.timeScale ?? 1),
    previousControlsEnabled: scene.controls
      ? Boolean(scene.controls.enabled)
      : null,
  };

  scene._mangaCutsceneActive = true;
  scene._mangaCutsceneController = state;

  if (scene.time) scene.time.timeScale = 0;
  if (scene.controls && 'enabled' in scene.controls) scene.controls.enabled = false;

  const addStatic = obj => {
    if (obj) state.staticObjects.push(obj);
    return obj;
  };

  const overlay = addStatic(
    scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.54)
      .setDepth(depth)
      .setScrollFactor(0)
      .setInteractive()
  );
  overlay.on('pointerdown', () => {});

  const topRule = addStatic(
    scene.add.rectangle(W / 2, 6, W, 12, 0x090b0d, 0.95)
      .setDepth(depth + 1)
      .setScrollFactor(0)
  );

  const title = resolveText(options.title || definition.title || '', tokens);
  if (title) {
    addStatic(
      scene.add.text(28, 22, title.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#f5f1e9',
        backgroundColor: '#090b0ddd',
        padding: { x: 9, y: 6 },
      })
        .setDepth(depth + 12)
        .setScrollFactor(0)
    );
  }

  if (preview) {
    addStatic(
      scene.add.text(W / 2, 24, 'DEV PREVIEW // NO STORY STATE CHANGES', {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#ffb0ce',
        backgroundColor: '#1a0911dd',
        padding: { x: 9, y: 5 },
      })
        .setOrigin(0.5, 0)
        .setDepth(depth + 12)
        .setScrollFactor(0)
    );
  }

  const frameHeight = Math.min(H * 0.91, 730);
  const frameWidth = Math.min(W * 0.43, 650);
  const frameY = H / 2 + H * 0.035;
  const leftX = 24 + frameWidth / 2;
  const rightX = W - 24 - frameWidth / 2;
  const centerX = W / 2;

  const sidePosition = side => ({
    left: { x: leftX, y: frameY },
    right: { x: rightX, y: frameY },
    center: { x: centerX, y: frameY },
  }[side]);

  const profileTargetAlpha = side => (
    state.profileDimmed[side] ? 0.72 : 1
  );

  const destroyProfile = side => {
    const profile = state.profiles[side];
    if (!profile) return;
    profile.destroy?.();
    state.profiles[side] = null;
  };

  const renderProfile = (side, pose = 'idle', { initial = false } = {}) => {
    const characterId = state.characters[side];
    if (!characterId || !characters[characterId]) {
      destroyProfile(side);
      return null;
    }

    const previous = state.profiles[side];
    const position = sidePosition(side);
    const next = createCharacterProfile(scene, {
      characterId,
      pose,
      x: position.x,
      y: position.y,
      frameWidth,
      frameHeight,
      side,
      depth: depth + 3,
      flipInward: side === 'left' || side === 'right',
      dimmed: state.profileDimmed[side],
      mask: true,
    });

    if (!next) return previous || null;

    state.profiles[side] = next;
    state.poses[side] = pose;

    const desiredAlpha = profileTargetAlpha(side);
    next.image.setAlpha(0);

    scene.tweens.add({
      targets: next.image,
      alpha: desiredAlpha,
      duration: initial ? 240 : 135,
      ease: 'Sine.easeOut',
    });

    if (previous) {
      scene.tweens.add({
        targets: previous.image,
        alpha: 0,
        duration: 120,
        ease: 'Sine.easeIn',
        onComplete: () => previous.destroy?.(),
      });
    }

    return next;
  };

  const setSideDimmed = (side, dimmed) => {
    const profile = state.profiles[side];
    state.profileDimmed[side] = Boolean(dimmed);
    if (!profile) return;

    const fromAlpha = profile.image.alpha;
    profile.setDimmed(Boolean(dimmed));
    const targetAlpha = profile.image.alpha;
    profile.image.setAlpha(fromAlpha);

    scene.tweens.add({
      targets: profile.image,
      alpha: targetAlpha,
      duration: 130,
      ease: 'Sine.easeInOut',
    });
  };

  ['left', 'right', 'center'].forEach(side => {
    if (state.characters[side]) renderProfile(side, 'idle', { initial: true });
  });

  const clearDialogue = () => {
    state.dialogueObjects.forEach(destroyObject);
    state.dialogueObjects = [];
  };

  const clearIntro = () => {
    state.introObjects.forEach(destroyObject);
    state.introObjects = [];
  };

  const showIntroCard = () => {
    const intro = options.introCard === false
      ? null
      : (options.introCard || definition.introCard);
    if (!intro) return;

    const side = intro.character || 'left';
    const characterId = state.characters[side];
    const character = characters[characterId];
    const defaultName = character?.name || '';
    const name = resolveText(
      options.introName || intro.name || defaultName,
      tokens
    );
    const subtitle = resolveText(
      options.introSubtitle || intro.subtitle || '',
      tokens
    );
    const x = side === 'right' ? W - 312 : 312;
    const y = H - 255;

    const plate = scene.add.rectangle(x, y, 430, 78, 0x090b0d, 0.96)
      .setStrokeStyle(3, 0xf8f6ef, 0.95)
      .setDepth(depth + 18)
      .setScrollFactor(0)
      .setAlpha(0);
    const nameText = scene.add.text(x - 195, y - 20, String(name).toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#ffffff',
    }).setDepth(depth + 19).setScrollFactor(0).setAlpha(0);
    const subText = scene.add.text(x - 195, y + 14, String(subtitle).toUpperCase(), {
      fontFamily: BODY_FONT,
      fontSize: '9px',
      color: '#b8c2c8',
      fontStyle: '700',
    }).setDepth(depth + 19).setScrollFactor(0).setAlpha(0);

    state.introObjects.push(plate, nameText, subText);

    scene.tweens.add({
      targets: [plate, nameText, subText],
      alpha: 1,
      duration: 150,
      yoyo: true,
      hold: 800,
      onComplete: clearIntro,
    });
  };

  const speakerDisplayName = (page, speaker) => {
    if (page.nameOverride) return resolveText(page.nameOverride, tokens);
    if (page.speakerLabel) return resolveText(page.speakerLabel, tokens);

    const characterId = state.characters[speaker];
    if (!characterId) return 'TOKYO SHIFT';
    if (characterId === resolved.playerId) return playerDisplayName;
    return characters[characterId]?.name || 'RIVAL';
  };

  const applyPagePoses = page => {
    const desired = {
      left: page.leftPose || state.poses.left,
      right: page.rightPose || state.poses.right,
      center: page.centerPose || state.poses.center,
    };

    if (page.pose && (page.speaker === 'left' || page.speaker === 'right' || page.speaker === 'center')) {
      desired[page.speaker] = page.pose;
    }

    ['left', 'right', 'center'].forEach(side => {
      if (
        state.characters[side] &&
        desired[side] &&
        desired[side] !== state.poses[side]
      ) {
        renderProfile(side, desired[side]);
      }
    });
  };

  const finish = (reason = 'complete') => {
    if (state.finishing || state.cleaned) return;
    state.finishing = true;

    clearDialogue();
    clearIntro();

    const normalCompletion = !preview;
    if (normalCompletion) {
      markCutsceneSeen(scene.registry, historyKey);
      saveSessionState(scene.registry);
    }

    const fadeTargets = [
      overlay,
      topRule,
      ...Object.values(state.profiles)
        .filter(Boolean)
        .map(profile => profile.image),
    ].filter(Boolean);

    const cleanup = invokeCallback => {
      if (state.cleaned) return;
      state.cleaned = true;

      ['left', 'right', 'center'].forEach(destroyProfile);
      state.staticObjects.forEach(destroyObject);
      state.staticObjects = [];
      clearDialogue();
      clearIntro();

      if (scene.time) scene.time.timeScale = state.previousTimeScale;
      if (
        scene.controls &&
        state.previousControlsEnabled != null &&
        'enabled' in scene.controls
      ) {
        scene.controls.enabled = state.previousControlsEnabled;
      }

      scene._mangaCutsceneActive = false;
      scene._mangaCutsceneController = null;
      scene.events?.off?.(Phaser.Scenes.Events.SHUTDOWN, onSceneShutdown);

      if (invokeCallback && !preview) {
        options.onComplete?.({
          id: cutsceneId,
          historyKey,
          reason,
        });
      }
    };

    if (!fadeTargets.length) {
      cleanup(normalCompletion);
      return;
    }

    scene.tweens.add({
      targets: fadeTargets,
      alpha: 0,
      duration: 190,
      ease: 'Sine.easeIn',
      onComplete: () => cleanup(normalCompletion),
    });
  };

  const onSceneShutdown = () => {
    if (state.cleaned) return;
    state.finishing = true;
    state.cleaned = true;

    ['left', 'right', 'center'].forEach(destroyProfile);
    state.staticObjects.forEach(destroyObject);
    clearDialogue();
    clearIntro();

    if (scene.time) scene.time.timeScale = state.previousTimeScale;
    if (
      scene.controls &&
      state.previousControlsEnabled != null &&
      'enabled' in scene.controls
    ) {
      scene.controls.enabled = state.previousControlsEnabled;
    }

    scene._mangaCutsceneActive = false;
    scene._mangaCutsceneController = null;
  };

  scene.events?.once?.(Phaser.Scenes.Events.SHUTDOWN, onSceneShutdown);

  const renderPage = index => {
    clearDialogue();

    const page = definition.pages?.[index];
    if (!page) {
      finish('complete');
      return;
    }

    state.pageIndex = index;
    applyPagePoses(page);

    const speaker = page.speaker || 'system';
    ['left', 'right', 'center'].forEach(side => {
      if (!state.characters[side]) return;
      const dim = (
        speaker === 'system'
          ? false
          : speaker !== side
      );
      setSideDimmed(side, dim);
    });

    const cardWidth = Math.min(820, W * 0.55);
    const cardHeight = Math.min(154, H * 0.21);
    const cardY = H - cardHeight / 2 - 24;
    const cardShift = speaker === 'left'
      ? 110
      : speaker === 'right'
        ? -110
        : 0;
    const cardX = clamp(W / 2 + cardShift, cardWidth / 2 + 40, W - cardWidth / 2 - 40);

    const card = scene.add.rectangle(
      cardX,
      cardY,
      cardWidth,
      cardHeight,
      0xfaf8f1,
      1
    )
      .setStrokeStyle(5, 0x090b0d, 1)
      .setDepth(depth + 20)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    state.dialogueObjects.push(card);

    if (speaker === 'left' || speaker === 'right') {
      state.dialogueObjects.push(
        makeDialoguePointer(scene, cardX, cardY, speaker, depth + 19)
      );
    }

    const name = speakerDisplayName(page, speaker);
    const namePlateWidth = Math.min(270, Math.max(150, String(name).length * 13));
    const namePlateX = cardX - cardWidth / 2 + namePlateWidth / 2 + 18;
    const namePlateY = cardY - cardHeight / 2 + 22;

    const namePlate = scene.add.rectangle(
      namePlateX,
      namePlateY,
      namePlateWidth,
      34,
      0x090b0d,
      1
    )
      .setDepth(depth + 21)
      .setScrollFactor(0);

    const nameText = scene.add.text(
      namePlateX,
      namePlateY,
      String(name).toUpperCase(),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#ffffff',
        align: 'center',
      }
    )
      .setOrigin(0.5)
      .setDepth(depth + 22)
      .setScrollFactor(0);

    const text = scene.add.text(
      cardX - cardWidth / 2 + 32,
      cardY - 18,
      resolveText(page.text, tokens),
      {
        fontFamily: BODY_FONT,
        fontSize: '14px',
        color: '#090b0d',
        fontStyle: '700',
        lineSpacing: 6,
        wordWrap: { width: cardWidth - 64 },
      }
    )
      .setOrigin(0, 0.5)
      .setDepth(depth + 22)
      .setScrollFactor(0);

    const finalPage = index >= (definition.pages?.length || 1) - 1;
    const actionLabel = finalPage
      ? String(options.finalActionLabel || definition.finalActionLabel || 'CONTINUE').toUpperCase()
      : 'NEXT';

    const action = scene.add.text(
      cardX + cardWidth / 2 - 24,
      cardY + cardHeight / 2 - 22,
      actionLabel + '  >',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#090b0d',
      }
    )
      .setOrigin(1, 0.5)
      .setDepth(depth + 22)
      .setScrollFactor(0);

    state.dialogueObjects.push(namePlate, nameText, text, action);

    const advance = () => {
      const now = Date.now();
      if (now - state.lastAdvanceAt < PAGE_DEBOUNCE_MS || state.finishing) return;
      state.lastAdvanceAt = now;

      if (finalPage) finish('complete');
      else renderPage(index + 1);
    };

    card.on('pointerdown', advance);
    action.setInteractive({ useHandCursor: true });
    action.on('pointerdown', advance);

    state.dialogueObjects.forEach(obj => {
      if (!obj?.setAlpha) return;
      obj.setAlpha(0);
      scene.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 115,
        ease: 'Sine.easeOut',
      });
    });
  };

  if (options.skipAllowed !== false) {
    const skip = addStatic(
      scene.add.rectangle(W - 78, 30, 108, 38, 0xfaf8f1, 0.96)
        .setStrokeStyle(3, 0x090b0d, 1)
        .setDepth(depth + 30)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
    );

    addStatic(
      scene.add.text(W - 78, 30, 'SKIP', {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#090b0d',
      })
        .setOrigin(0.5)
        .setDepth(depth + 31)
        .setScrollFactor(0)
    );

    skip.on('pointerdown', () => finish('skip'));
  }

  showIntroCard();

  scene.tweens.add({
    targets: overlay,
    alpha: 0.54,
    duration: 120,
    onComplete: () => renderPage(0),
  });
  overlay.setAlpha(0);

  return {
    id: cutsceneId,
    state,
    finish,
    skip: () => finish('skip'),
  };
}

export function closeCutsceneTester(scene) {
  const overlay = scene?._cutsceneTesterOverlay;
  if (!overlay) return;

  overlay.objects?.forEach(destroyObject);
  if (overlay.wheelHandler) {
    try { scene.input.off('wheel', overlay.wheelHandler); } catch (e) {}
  }
  scene._cutsceneTesterOverlay = null;
}

export function showCutsceneTester(scene) {
  if (!scene?.registry?.get?.('devMode')) return;
  if (sceneCutsceneActive(scene) || scene._cutsceneTesterOverlay) return;

  const W = Math.max(1, Number(scene.scale?.width || 1560));
  const H = Math.max(1, Number(scene.scale?.height || 840));
  const definitions = getCutsceneList();
  const depth = 440;
  const objects = [];
  const add = obj => { objects.push(obj); return obj; };

  add(scene.add.rectangle(W / 2, H / 2, W, H, 0x02050b, 0.78)
    .setDepth(depth)
    .setScrollFactor(0)
    .setInteractive());

  add(scene.add.rectangle(W / 2, H / 2, 980, Math.min(690, H - 70), 0x09121b, 0.995)
    .setStrokeStyle(3, 0xff72aa, 0.96)
    .setDepth(depth + 1)
    .setScrollFactor(0));

  add(scene.add.text(W / 2 - 440, 82, 'DEV // CUTSCENE TESTER', {
    fontFamily: PIXEL_FONT,
    fontSize: '14px',
    color: '#fff4f8',
  }).setDepth(depth + 2).setScrollFactor(0));

  add(scene.add.text(W / 2 - 440, 118, 'Preview over the current screen. No progression or save flags are changed.', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#aebcc5',
    fontStyle: '600',
  }).setDepth(depth + 2).setScrollFactor(0));

  const close = add(scene.add.rectangle(W / 2 + 405, 92, 110, 38, 0x161b22, 1)
    .setStrokeStyle(1, 0x71818b, 1)
    .setDepth(depth + 2)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true }));

  add(scene.add.text(W / 2 + 405, 92, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#d9e6ec',
  }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

  close.on('pointerdown', () => closeCutsceneTester(scene));

  const visibleCount = Math.min(5, definitions.length);
  let offset = 0;
  let rowObjects = [];

  const clearRows = () => {
    rowObjects.forEach(destroyObject);
    rowObjects = [];
  };

  const rowAdd = obj => {
    rowObjects.push(obj);
    objects.push(obj);
    return obj;
  };

  const previewDefinition = definition => {
    closeCutsceneTester(scene);
    playMangaCutscene(scene, definition.id, {
      preview: true,
      force: true,
      tokens: {
        REGION: 'Shinagawa',
        TUNER: 'Spoon Sports',
      },
    });
  };

  const renderRows = () => {
    clearRows();
    const slice = definitions.slice(offset, offset + visibleCount);
    slice.forEach((definition, index) => {
      const y = 190 + index * 104;
      const row = rowAdd(scene.add.rectangle(
        W / 2,
        y,
        860,
        86,
        0x111822,
        1
      ).setStrokeStyle(2, 0x3f5360, 1)
        .setDepth(depth + 2)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true }));

      const left = definition.characters?.left || '—';
      const right = definition.characters?.right || '—';

      rowAdd(scene.add.text(W / 2 - 400, y - 25, definition.title, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#fff5f8',
      }).setDepth(depth + 3).setScrollFactor(0));

      rowAdd(scene.add.text(W / 2 - 400, y + 8,
        definition.id + '  //  ' + (definition.pages?.length || 0) + ' PAGES',
        {
          fontFamily: BODY_FONT,
          fontSize: '9px',
          color: '#9eb0bb',
          fontStyle: '700',
        }
      ).setDepth(depth + 3).setScrollFactor(0));

      rowAdd(scene.add.text(W / 2 + 400, y + 8,
        String(left) + '  ↔  ' + String(right),
        {
          fontFamily: BODY_FONT,
          fontSize: '8px',
          color: '#bfccd3',
          fontStyle: '700',
        }
      ).setOrigin(1, 0).setDepth(depth + 3).setScrollFactor(0));

      row.on('pointerover', () => row.setFillStyle(0x2a1721, 1));
      row.on('pointerout', () => row.setFillStyle(0x111822, 1));
      row.on('pointerdown', () => previewDefinition(definition));
    });

    if (definitions.length > visibleCount) {
      const up = rowAdd(scene.add.rectangle(W / 2 - 100, H - 74, 160, 38, 0x151c25, 1)
        .setStrokeStyle(1, 0x657783, 1)
        .setDepth(depth + 2).setScrollFactor(0)
        .setInteractive({ useHandCursor: true }));
      const down = rowAdd(scene.add.rectangle(W / 2 + 100, H - 74, 160, 38, 0x151c25, 1)
        .setStrokeStyle(1, 0x657783, 1)
        .setDepth(depth + 2).setScrollFactor(0)
        .setInteractive({ useHandCursor: true }));

      rowAdd(scene.add.text(W / 2 - 100, H - 74, '▲ UP', {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#d9e6ec',
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));
      rowAdd(scene.add.text(W / 2 + 100, H - 74, 'DOWN ▼', {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#d9e6ec',
      }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0));

      up.on('pointerdown', () => {
        offset = Math.max(0, offset - 1);
        renderRows();
      });
      down.on('pointerdown', () => {
        offset = Math.min(
          Math.max(0, definitions.length - visibleCount),
          offset + 1
        );
        renderRows();
      });
    }
  };

  renderRows();
  scene._cutsceneTesterOverlay = { objects, renderRows };
}

export function addDevCutsceneButton(scene, x = 862, y = 35, {
  width = 112,
  height = 38,
  depth = 43,
  label = 'SCENES',
} = {}) {
  if (!scene?.registry?.get?.('devMode')) return null;
  if (scene._devCutsceneButton?.button?.active) return scene._devCutsceneButton;

  const button = scene.add.rectangle(x, y, width, height, 0x21121a, 0.98)
    .setStrokeStyle(1, 0xff72aa, 0.95)
    .setDepth(depth)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  const text = scene.add.text(x, y, label, {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#ffb3ce',
  }).setOrigin(0.5)
    .setDepth(depth + 1)
    .setScrollFactor(0);

  button.on('pointerover', () => button.setFillStyle(0x3a1727, 1));
  button.on('pointerout', () => button.setFillStyle(0x21121a, 0.98));
  button.on('pointerdown', () => showCutsceneTester(scene));

  const api = { button, text };
  scene._devCutsceneButton = api;
  return api;
}
