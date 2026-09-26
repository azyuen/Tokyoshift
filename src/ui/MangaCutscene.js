import { characters } from '../data/characters.js?v=20260926-r213';
import {
  getCutscene,
  hasSeenCutscene,
  markCutsceneSeen,
} from '../data/cutscenes.js?v=20260926-r204';
import {
  createCharacterProfile,
  getCharacterProfileTexture,
  resolveCharacterProfile,
  PROFILE_REFERENCE_HEIGHT,
  PROFILE_HEAD_SAFE_RATIO,
  PROFILE_DEFAULT_ZOOM,
} from '../characters/CharacterProfileRenderer.js?v=20260926-r213';
import { saveSessionState } from '../state/GameState.js?v=20260926-r213';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const BASE_DEPTH = 900;
const PAGE_DEBOUNCE_MS = 110;
const CHARACTER_FADE_MS = 230;
const POSE_CROSSFADE_MS = 100;
const SPEAKER_DIM_MS = 70;

const SIDES = ['left', 'right', 'center'];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const sourceValue = (source, key, fallback = null) => {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
};

const destroySafely = obj => {
  try { obj?.destroy?.(); } catch (e) {}
};

const interpolate = (value, variables = {}) => String(value ?? '').replace(
  /\{([A-Z0-9_]+)\}/g,
  (_, key) => variables[key] == null ? '' : String(variables[key])
);

export function sceneCutsceneActive(scene) {
  return Boolean(scene?._mangaCutscene?.active);
}

function playerDisplayName(scene, playerCharacterId) {
  const first = String(scene.registry.get('firstName') || '').trim();
  const last = String(scene.registry.get('lastName') || '').trim();
  return [first, last].filter(Boolean).join(' ')
    || characters[playerCharacterId]?.name
    || 'PLAYER';
}

function buildContext(scene, definition, options) {
  const previewDefaults = options.preview ? (definition.preview || {}) : {};
  const characterOverrides = {
    ...(previewDefaults.characterOverrides || {}),
    ...(options.characterOverrides || {}),
  };
  const variables = {
    ...(previewDefaults.variables || {}),
    ...(options.variables || {}),
  };

  const playerCharacterId = scene.registry.get('playerCharacterId') || 'renMizuno';
  const displayName = playerDisplayName(scene, playerCharacterId);
  const nameParts = displayName.split(/\s+/).filter(Boolean);

  variables.PLAYER_NAME ??= displayName.toUpperCase();
  variables.PLAYER_FIRST_NAME ??= (nameParts[0] || displayName).toUpperCase();
  variables.PLAYER_LAST_NAME ??= (nameParts.slice(1).join(' ') || '').toUpperCase();

  return {
    scene,
    definition,
    options,
    preview: Boolean(options.preview),
    characterOverrides,
    variables,
    playerCharacterId,
  };
}

function resolveCharacterToken(token, context) {
  if (!token) return null;
  if (token === '$PLAYER') return context.playerCharacterId;

  if (String(token).startsWith('$')) {
    const key = String(token).slice(1);
    return context.characterOverrides[key] || null;
  }

  return String(token);
}

function pageCharacterToken(definition, page, side) {
  const direct = page?.[side + 'Character'];
  if (direct != null) return direct;
  return definition.characters?.[side] || null;
}

function resolvePageCharacter(context, page, side) {
  return resolveCharacterToken(
    pageCharacterToken(context.definition, page, side),
    context
  );
}

function collectCutsceneCharacterIds(context) {
  const ids = new Set();
  const pages = context.definition.pages || [];

  const addToken = token => {
    const id = resolveCharacterToken(token, context);
    if (id && characters[id]) ids.add(id);
  };

  SIDES.forEach(side => addToken(context.definition.characters?.[side]));
  pages.forEach(page => {
    SIDES.forEach(side => addToken(page?.[side + 'Character']));
  });

  return [...ids];
}

function queueCharacterAssets(scene, characterIds) {
  let queued = 0;
  characterIds.forEach(id => {
    const visual = characters[id]?.visual;
    if (!visual) return;

    [
      [visual.spriteKey, visual.path],
      [visual.winSpriteKey, visual.winPath],
      [visual.lossSpriteKey, visual.lossPath],
    ].forEach(([key, path]) => {
      if (!key || !path || scene.textures.exists(key)) return;
      scene.load.image(key, path + '?v=20260925-r184');
      queued += 1;
    });
  });
  return queued;
}

function freezeScene(scene) {
  const world = scene.physics?.world;
  const keyboard = scene.input?.keyboard;
  const pausedTweens = [];
  try {
    const existingTweens = scene.tweens?.getTweens?.() || [];
    existingTweens.forEach(tween => {
      const playing = typeof tween?.isPlaying === 'function'
        ? tween.isPlaying()
        : false;
      if (!playing) return;
      tween.pause?.();
      pausedTweens.push(tween);
    });
  } catch (e) {}

  const state = {
    clockPaused: Boolean(scene.time?.paused),
    keyboardEnabled: keyboard ? keyboard.enabled !== false : null,
    physicsPaused: world ? Boolean(world.isPaused) : null,
    controlsEnabled: scene.controls && 'enabled' in scene.controls
      ? Boolean(scene.controls.enabled)
      : null,
    pausedTweens,
  };

  if (scene.time) scene.time.paused = true;
  if (keyboard) keyboard.enabled = false;
  if (world && !state.physicsPaused && typeof world.pause === 'function') world.pause();
  if (scene.controls && 'enabled' in scene.controls) scene.controls.enabled = false;

  return state;
}

function restoreScene(scene, state) {
  if (!state) return;
  if (scene.time) scene.time.paused = state.clockPaused;

  if (scene.input?.keyboard && state.keyboardEnabled != null) {
    scene.input.keyboard.enabled = state.keyboardEnabled;
  }

  const world = scene.physics?.world;
  if (world && state.physicsPaused === false && typeof world.resume === 'function') {
    world.resume();
  }

  if (scene.controls && state.controlsEnabled != null && 'enabled' in scene.controls) {
    scene.controls.enabled = state.controlsEnabled;
  }

  (state.pausedTweens || []).forEach(tween => {
    try { tween?.resume?.(); } catch (e) {}
  });
}

function frameFor(scene, side) {
  const width = Number(scene.scale.width || scene.cameras.main.width || 1560);
  const height = Number(scene.scale.height || scene.cameras.main.height || 840);
  // Cutscene-only staging: keep the canonical profile metadata, but give
  // silhouettes more breathing room above the manga gutter. The smaller
  // target frame reduces actor scale uniformly; the higher centre lifts both
  // short and tall characters without introducing per-character hacks.
  const frameHeight = Math.min(620, Math.max(450, height * 0.76));
  const frameWidth = Math.min(550, Math.max(410, width * 0.35));
  const y = height * 0.42;

  if (side === 'left') {
    return { x: width * 0.28, y, frameWidth, frameHeight };
  }
  if (side === 'right') {
    return { x: width * 0.72, y, frameWidth, frameHeight };
  }
  return { x: width * 0.50, y, frameWidth: Math.min(700, frameWidth * 1.10), frameHeight };
}

function actorLabel(scene, context, page, side, characterId) {
  if (page?.nameOverride) return interpolate(page.nameOverride, context.variables);
  if (page?.speakerLabel) return interpolate(page.speakerLabel, context.variables);

  if (characterId === context.playerCharacterId) {
    return playerDisplayName(scene, context.playerCharacterId).toUpperCase();
  }

  return String(characters[characterId]?.name || side || 'TOKYO SHIFT').toUpperCase();
}

function createMangaPointer(scene, x, y, speaker, depth) {
  if (speaker !== 'left' && speaker !== 'right') return null;

  const g = scene.add.graphics().setDepth(depth).setScrollFactor(0);
  g.fillStyle(0xfffcf1, 1);
  g.lineStyle(4, 0x111111, 1);

  if (speaker === 'left') {
    g.fillTriangle(x - 300, y - 72, x - 354, y - 36, x - 296, y - 22);
    g.strokeTriangle(x - 300, y - 72, x - 354, y - 36, x - 296, y - 22);
  } else {
    g.fillTriangle(x + 300, y - 72, x + 354, y - 36, x + 296, y - 22);
    g.strokeTriangle(x + 300, y - 72, x + 354, y - 36, x + 296, y - 22);
  }

  return g;
}

function showIntroCard(controller) {
  const { scene, context, definition } = controller;
  const config = definition.introCard;
  if (!config) return;

  const side = config.character || 'left';
  const actor = controller.actors[side];
  const x = actor?.profile?.frame?.x
    || (side === 'right' ? scene.scale.width * 0.72 : scene.scale.width * 0.28);
  const y = Math.min(scene.scale.height - 230, scene.scale.height * 0.68);
  const name = interpolate(config.name || '', context.variables);
  const subtitle = interpolate(config.subtitle || '', context.variables);
  if (!name && !subtitle) return;

  const plate = scene.add.rectangle(x, y, 390, 78, 0xfffcf1, 0.98)
    .setStrokeStyle(5, 0x111111, 1)
    .setDepth(BASE_DEPTH + 42)
    .setScrollFactor(0);
  const nameText = scene.add.text(x, y - 15, name, {
    fontFamily: PIXEL_FONT,
    fontSize: '10px',
    color: '#111111',
    align: 'center',
  }).setOrigin(0.5).setDepth(BASE_DEPTH + 43).setScrollFactor(0);
  const subtitleText = scene.add.text(x, y + 18, subtitle, {
    fontFamily: BODY_FONT,
    fontSize: '11px',
    color: '#222222',
    fontStyle: '700',
    align: 'center',
  }).setOrigin(0.5).setDepth(BASE_DEPTH + 43).setScrollFactor(0);

  controller.introObjects.push(plate, nameText, subtitleText);

  scene.tweens.add({
    targets: [plate, nameText, subtitleText],
    alpha: 0,
    delay: 900,
    duration: 180,
    ease: 'Sine.easeIn',
    onComplete: () => {
      [plate, nameText, subtitleText].forEach(destroySafely);
      controller.introObjects = controller.introObjects.filter(
        obj => obj !== plate && obj !== nameText && obj !== subtitleText
      );
    },
  });
}

function desiredPose(page, side, currentPose) {
  const explicit = page?.[side + 'Pose'];
  if (explicit) return explicit;

  if (page?.pose && page?.speaker === side) return page.pose;
  return currentPose || 'idle';
}

function desiredDimmed(speaker, side) {
  if (speaker === 'system') return true;
  if (speaker === 'center') return side !== 'center';
  if (speaker === 'left' || speaker === 'right') return side !== speaker;
  return false;
}

function updateActorPoseInPlace(scene, actor, side, characterId, pose) {
  const profile = actor?.profile;
  const image = profile?.image;
  const frame = profile?.frame;
  const character = characters[characterId];
  if (!profile || !image || !frame || !character?.visual) return false;

  const requestedPose = pose === 'win' || pose === 'loss' ? pose : 'idle';
  const textureInfo = getCharacterProfileTexture(characterId, requestedPose);

  let spriteKey = textureInfo?.key;
  let actualPose = textureInfo?.pose || 'idle';
  let poseFallback = Boolean(textureInfo?.fallback);

  if (!spriteKey || !scene.textures.exists(spriteKey)) {
    spriteKey = character.visual.spriteKey;
    actualPose = 'idle';
    poseFallback = requestedPose !== 'idle';
  }
  if (!spriteKey || !scene.textures.exists(spriteKey)) return false;

  const resolved = resolveCharacterProfile(characterId, actualPose);
  const texture = scene.textures.get(spriteKey);
  texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  const source = texture.getSourceImage();

  const inwardFlip = side === 'right';
  const offsetScale = frame.height / PROFILE_REFERENCE_HEIGHT;
  const signedOffsetX = resolved.offsetX * offsetScale * (inwardFlip ? -1 : 1);
  const topY = frame.y - frame.height / 2;
  const baseScale = (frame.height * PROFILE_DEFAULT_ZOOM) / Math.max(1, source.height);

  image
    .setTexture(spriteKey)
    .setPosition(
      Math.round(frame.x + signedOffsetX),
      Math.round(topY + frame.height * PROFILE_HEAD_SAFE_RATIO + resolved.offsetY * offsetScale)
    )
    .setScale(baseScale * resolved.scale)
    .setFlipX(inwardFlip);

  profile.requestedPose = requestedPose;
  profile.actualPose = actualPose;
  profile.poseFallback = poseFallback;
  profile.spriteKey = spriteKey;
  profile.profile = resolved;
  actor.pose = requestedPose;
  return true;
}

function replaceActorProfile(controller, side, characterId, pose, dimmed, firstPage = false) {
  const { scene } = controller;
  const previous = controller.actors[side];

  if (
    previous?.characterId === characterId &&
    previous?.profile
  ) {
    if (previous.pose !== pose) {
      updateActorPoseInPlace(scene, previous, side, characterId, pose);
    }
    previous.profile.setDimmed(dimmed, { duration: SPEAKER_DIM_MS });
    return previous;
  }

  if (!characterId || !characters[characterId]) {
    if (previous?.profile) {
      scene.tweens.killTweensOf(previous.profile.image);
      previous.profile.destroy();
    }
    controller.actors[side] = {
      characterId: null,
      pose,
      profile: null,
    };
    return controller.actors[side];
  }

  const frame = frameFor(scene, side);
  const profile = createCharacterProfile(scene, {
    characterId,
    pose,
    x: frame.x,
    y: frame.y,
    frameWidth: frame.frameWidth,
    frameHeight: frame.frameHeight,
    side,
    depth: BASE_DEPTH + (side === 'center' ? 18 : 15),
    flipInward: true,
    dimmed,
    // Manga characters are staged as full silhouettes. Profile cards keep
    // their rectangular masks; cutscenes intentionally let hair/arms/poses
    // extend sideways and disappear naturally behind the dialogue gutter.
    mask: false,
  });

  if (!profile) {
    controller.actors[side] = {
      characterId,
      pose,
      profile: null,
    };
    return controller.actors[side];
  }

  profile.image.setScrollFactor(0);
  profile.maskShape?.setScrollFactor?.(0);
  const targetAlpha = dimmed ? 0.72 : 1;
  profile.image.setAlpha(0);

  scene.tweens.add({
    targets: profile.image,
    alpha: targetAlpha,
    duration: firstPage ? CHARACTER_FADE_MS : POSE_CROSSFADE_MS,
    ease: 'Sine.easeOut',
  });

  if (previous?.profile) {
    const oldProfile = previous.profile;
    scene.tweens.killTweensOf(oldProfile.image);
    scene.tweens.add({
      targets: oldProfile.image,
      alpha: 0,
      duration: POSE_CROSSFADE_MS,
      ease: 'Sine.easeIn',
      onComplete: () => oldProfile.destroy(),
    });
  }

  controller.actors[side] = {
    characterId,
    pose,
    profile,
  };
  return controller.actors[side];
}

function clearDialogue(controller) {
  controller.dialogueObjects.forEach(obj => {
    controller.scene.tweens.killTweensOf(obj);
    destroySafely(obj);
  });
  controller.dialogueObjects = [];
}

function drawDialogue(controller, page) {
  const { scene, context, definition } = controller;
  const width = Number(scene.scale.width || 1560);
  const height = Number(scene.scale.height || 840);
  const speaker = page.speaker || 'system';

  // Compact manga card: with the actors now smaller and staged higher, the
  // dialogue no longer needs to act as a full-width character crop. Keep it
  // broad enough for 2–3 readable lines on phone landscape while revealing
  // more of the frozen game and character silhouettes around it.
  const bottomSafe = Math.max(18, Math.round(height * 0.03));
  const cardWidth = clamp(width * 0.68, 760, 1060);
  const cardHeight = clamp(height * 0.155, 112, 132);
  const x = width / 2;
  const y = height - bottomSafe - cardHeight / 2;

  const characterId = SIDES.includes(speaker)
    ? controller.actors[speaker]?.characterId
    : null;
  const label = speaker === 'system'
    ? interpolate(page.speakerLabel || 'TOKYO SHIFT', context.variables)
    : actorLabel(scene, context, page, speaker, characterId);

  const card = scene.add.rectangle(x, y, cardWidth, cardHeight, 0xfffcf1, 1)
    .setStrokeStyle(6, 0x111111, 1)
    .setDepth(BASE_DEPTH + 30)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  const labelWidth = Math.min(330, cardWidth * 0.30);
  const labelHeight = 36;
  const cardTop = y - cardHeight / 2;
  // Speaker name sits outside the dialogue field like a tab. A tiny overlap
  // keeps the tab visually attached to the card border without covering text.
  const labelY = cardTop - labelHeight / 2 + 3;
  const labelX = speaker === 'right'
    ? x + cardWidth / 2 - labelWidth / 2 - 18
    : x - cardWidth / 2 + labelWidth / 2 + 18;
  const labelBox = scene.add.rectangle(
    labelX,
    labelY,
    labelWidth,
    labelHeight,
    0x111111,
    1
  ).setDepth(BASE_DEPTH + 31).setScrollFactor(0);

  const labelText = scene.add.text(
    speaker === 'right'
      ? labelX + labelWidth / 2 - 16
      : labelX - labelWidth / 2 + 16,
    labelY,
    label,
    {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#ffffff',
      align: speaker === 'right' ? 'right' : 'left',
    }
  ).setOrigin(speaker === 'right' ? 1 : 0, 0.5)
    .setDepth(BASE_DEPTH + 32)
    .setScrollFactor(0);

  const body = scene.add.text(
    x - cardWidth / 2 + 38,
    y - 12,
    interpolate(page.text || '', context.variables),
    {
      fontFamily: BODY_FONT,
      fontSize: page.emphasis ? '14px' : '13px',
      color: '#111111',
      fontStyle: page.emphasis ? '800' : '700',
      lineSpacing: 5,
      wordWrap: { width: cardWidth - 76 },
    }
  ).setOrigin(0, 0.5)
    .setDepth(BASE_DEPTH + 32)
    .setScrollFactor(0);

  const finalPage = controller.pageIndex >= (definition.pages?.length || 1) - 1;
  const rawAction = finalPage
    ? (definition.finalActionLabel || 'CONTINUE')
    : 'NEXT';
  const actionLabel = interpolate(rawAction, context.variables) + '  >';
  const actionWidth = Math.min(300, Math.max(230, cardWidth * 0.22));
  const actionX = x + cardWidth / 2 - actionWidth / 2 - 18;
  const footerY = y + cardHeight / 2 - 23;

  const actionBox = scene.add.rectangle(
    actionX,
    footerY,
    actionWidth,
    42,
    0x111111,
    1
  ).setDepth(BASE_DEPTH + 33)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  const actionText = scene.add.text(
    actionX,
    footerY,
    actionLabel,
    {
      fontFamily: PIXEL_FONT,
      fontSize: finalPage ? '7px' : '8px',
      color: '#ffffff',
      align: 'center',
    }
  ).setOrigin(0.5)
    .setDepth(BASE_DEPTH + 34)
    .setScrollFactor(0);

  const pageCount = Math.max(1, definition.pages?.length || 0);
  const counter = scene.add.text(
    x - cardWidth / 2 + 34,
    footerY,
    String(controller.pageIndex + 1).padStart(2, '0') + ' / ' +
      String(pageCount).padStart(2, '0'),
    {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#333333',
    }
  ).setOrigin(0, 0.5)
    .setDepth(BASE_DEPTH + 32)
    .setScrollFactor(0);

  const objects = [card, labelBox, labelText, body, actionBox, actionText, counter]
    .filter(Boolean);
  objects.forEach(obj => obj.setAlpha?.(0));
  controller.dialogueObjects.push(...objects);

  scene.tweens.add({
    targets: objects,
    alpha: 1,
    duration: 70,
    ease: 'Sine.easeOut',
  });

  card.on('pointerdown', () => controller.advance());
  actionBox.on('pointerdown', () => controller.advance());
}

function renderPage(controller, pageIndex, firstPage = false) {
  const { context, definition } = controller;
  const pages = definition.pages || [];
  const page = pages[pageIndex];
  if (!page) return;

  controller.pageIndex = pageIndex;
  clearDialogue(controller);

  SIDES.forEach(side => {
    const current = controller.actors[side];
    const characterId = resolvePageCharacter(context, page, side);
    const pose = desiredPose(page, side, current?.pose || 'idle');
    const dimmed = desiredDimmed(page.speaker, side);
    replaceActorProfile(controller, side, characterId, pose, dimmed, firstPage);
  });

  drawDialogue(controller, page);

  if (firstPage) showIntroCard(controller);
}

function finaliseController(controller, {
  reason = 'complete',
  invokeComplete = true,
  markSeen = true,
} = {}) {
  if (controller.cleaned) return;
  controller.cleaned = true;
  controller.active = false;

  const { scene, context, definition } = controller;

  clearDialogue(controller);
  controller.introObjects.forEach(destroySafely);
  controller.introObjects = [];

  Object.values(controller.actors).forEach(actor => {
    if (!actor?.profile) return;
    scene.tweens.killTweensOf(actor.profile.image);
    actor.profile.destroy();
  });

  controller.objects.forEach(obj => {
    scene.tweens.killTweensOf(obj);
    destroySafely(obj);
  });
  controller.objects = [];

  restoreScene(scene, controller.freezeState);

  try {
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, controller.shutdownHandler);
    scene.events.off(Phaser.Scenes.Events.DESTROY, controller.shutdownHandler);
  } catch (e) {}

  if (scene._mangaCutscene === controller) {
    scene._mangaCutscene = null;
  }

  if (!context.preview && markSeen && definition.once !== false) {
    markCutsceneSeen(scene.registry, controller.historyId);
    saveSessionState(scene.registry);
  }

  const payload = {
    cutsceneId: definition.id,
    historyId: controller.historyId,
    reason,
    skipped: reason === 'skip',
    preview: context.preview,
  };

  if (context.preview) {
    context.options.onPreviewComplete?.(payload);
  } else if (invokeComplete) {
    context.options.onComplete?.(payload);
  }
}

function beginOverlay(scene, definition, context, historyId, existingFreezeState = null) {
  if (sceneCutsceneActive(scene)) {
    return { played: false, reason: 'active', active: false };
  }

  const controller = {
    active: true,
    played: true,
    cleaned: false,
    finishing: false,
    scene,
    definition,
    context,
    historyId,
    pageIndex: 0,
    lastAdvanceAt: 0,
    objects: [],
    dialogueObjects: [],
    introObjects: [],
    actors: {
      left: null,
      right: null,
      center: null,
    },
    freezeState: null,
    advance: null,
    finish: null,
    skip: null,
    shutdownHandler: null,
  };

  scene._mangaCutscene = controller;
  controller.freezeState = existingFreezeState || freezeScene(scene);

  const width = Number(scene.scale.width || 1560);
  const height = Number(scene.scale.height || 840);

  const blocker = scene.add.rectangle(
    width / 2,
    height / 2,
    width,
    height,
    0x000000,
    0
  ).setDepth(BASE_DEPTH)
    .setScrollFactor(0)
    .setInteractive();

  const shade = scene.add.rectangle(
    width / 2,
    height / 2,
    width,
    height,
    0x000000,
    0.54
  ).setDepth(BASE_DEPTH + 1)
    .setScrollFactor(0)
    .setAlpha(0);

  const titleText = interpolate(definition.title || definition.id, context.variables);
  const titlePlate = scene.add.rectangle(
    52 + Math.min(520, Math.max(280, titleText.length * 17)) / 2,
    52,
    Math.min(520, Math.max(280, titleText.length * 17)),
    52,
    0xfffcf1,
    0.96
  ).setStrokeStyle(4, 0x111111, 1)
    .setDepth(BASE_DEPTH + 25)
    .setScrollFactor(0)
    .setAlpha(0);

  const title = scene.add.text(68, 52, titleText, {
    fontFamily: PIXEL_FONT,
    fontSize: '9px',
    color: '#111111',
  }).setOrigin(0, 0.5)
    .setDepth(BASE_DEPTH + 26)
    .setScrollFactor(0)
    .setAlpha(0);

  const skip = scene.add.text(width - 52, 45, 'SKIP', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#ffffff',
    backgroundColor: '#111111cc',
    padding: { x: 12, y: 8 },
  }).setOrigin(1, 0.5)
    .setDepth(BASE_DEPTH + 60)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true })
    .setAlpha(0);

  controller.objects.push(blocker, shade, titlePlate, title, skip);

  scene.tweens.add({
    targets: shade,
    alpha: 1,
    duration: 210,
    ease: 'Sine.easeOut',
  });
  scene.tweens.add({
    targets: [titlePlate, title, skip],
    alpha: 1,
    duration: 180,
    delay: 70,
    ease: 'Sine.easeOut',
  });

  controller.advance = () => {
    if (!controller.active || controller.cleaned || controller.finishing) return;
    const now = Date.now();
    if (now - controller.lastAdvanceAt < PAGE_DEBOUNCE_MS) return;
    controller.lastAdvanceAt = now;

    const pages = definition.pages || [];
    const finalPage = controller.pageIndex >= pages.length - 1;
    if (finalPage) {
      controller.finish('action');
      return;
    }

    renderPage(controller, controller.pageIndex + 1, false);
  };

  controller.finish = (reason = 'complete') => {
    if (!controller.active || controller.cleaned || controller.finishing) return;
    controller.finishing = true;

    clearDialogue(controller);
    controller.introObjects.forEach(obj => {
      scene.tweens.killTweensOf(obj);
      destroySafely(obj);
    });
    controller.introObjects = [];

    const fadeTargets = [
      shade,
      titlePlate,
      title,
      skip,
      ...Object.values(controller.actors)
        .map(actor => actor?.profile?.image)
        .filter(Boolean),
    ].filter(obj => obj?.active !== false);

    if (!fadeTargets.length) {
      finaliseController(controller, { reason });
      return;
    }

    scene.tweens.add({
      targets: fadeTargets,
      alpha: 0,
      duration: 190,
      ease: 'Sine.easeIn',
      onComplete: () => finaliseController(controller, { reason }),
    });
  };

  controller.skip = () => controller.finish('skip');

  skip.on('pointerdown', () => controller.skip());
  blocker.on('pointerdown', () => controller.advance());

  controller.shutdownHandler = () => {
    finaliseController(controller, {
      reason: 'shutdown',
      invokeComplete: false,
      markSeen: false,
    });
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, controller.shutdownHandler);
  scene.events.once(Phaser.Scenes.Events.DESTROY, controller.shutdownHandler);

  renderPage(controller, 0, true);
  return controller;
}

export function playMangaCutscene(scene, cutsceneId, options = {}) {
  const definition = getCutscene(cutsceneId);
  if (!scene || !definition) {
    return { played: false, reason: 'missing', active: false };
  }

  if (sceneCutsceneActive(scene)) {
    return { played: false, reason: 'active', active: false };
  }

  const context = buildContext(scene, definition, options);
  const historyId = String(options.historyId || definition.id);

  if (
    !context.preview &&
    definition.once !== false &&
    hasSeenCutscene(scene.registry, historyId) &&
    !options.force
  ) {
    return { played: false, reason: 'seen', active: false };
  }

  const characterIds = collectCutsceneCharacterIds(context);
  const queued = queueCharacterAssets(scene, characterIds);

  if (queued <= 0) {
    return beginOverlay(scene, definition, context, historyId);
  }

  const pending = {
    played: true,
    active: true,
    pending: true,
    reason: 'loading',
    freezeState: freezeScene(scene),
    shutdownHandler: null,
    cancel: () => {
      if (!pending.active) return;
      pending.active = false;
      restoreScene(scene, pending.freezeState);
      pending.freezeState = null;
      if (scene._mangaCutscene === pending) scene._mangaCutscene = null;
      try {
        scene.events.off(Phaser.Scenes.Events.SHUTDOWN, pending.shutdownHandler);
        scene.events.off(Phaser.Scenes.Events.DESTROY, pending.shutdownHandler);
      } catch (e) {}
    },
  };
  scene._mangaCutscene = pending;

  pending.shutdownHandler = () => pending.cancel();
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, pending.shutdownHandler);
  scene.events.once(Phaser.Scenes.Events.DESTROY, pending.shutdownHandler);

  const onComplete = () => {
    if (!pending.active || scene._mangaCutscene !== pending) return;

    try {
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, pending.shutdownHandler);
      scene.events.off(Phaser.Scenes.Events.DESTROY, pending.shutdownHandler);
    } catch (e) {}

    const freezeState = pending.freezeState;
    pending.freezeState = null;
    scene._mangaCutscene = null;
    pending.active = false;
    beginOverlay(scene, definition, context, historyId, freezeState);
  };

  scene.load.once(Phaser.Loader.Events.COMPLETE, onComplete);
  scene.load.start();
  return pending;
}
