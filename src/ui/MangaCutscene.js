import {
  characters,
  getCharacterAssetUrl,
  getCharacterVisualForContext,
  getCharacterForContext,
} from '../data/characters.js?v=20261017-r578';
import {
  getCutscene,
  hasSeenCutscene,
  markCutsceneSeen,
} from '../data/cutscenes.js?v=20261017-r578';
import {
  createCharacterProfile,
  getCharacterProfileTexture,
  resolveCharacterProfile,
  getCharacterProfilePlacement,
} from '../characters/CharacterProfileRenderer.js?v=20261017-r578';
import { saveSessionState } from '../state/GameState.js?v=20261011-r476';
import { playPhoneConversation } from './PhoneConversation.js?v=20261017-r572';

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

export function sceneCutsceneActive(scene,{ignoreChapter09Stage=false}={}) {
  return Boolean(scene?._mangaCutscene?.active || scene?._phoneConversation?.active ||
    (!ignoreChapter09Stage && scene?._chapter09Stage?.active));
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

  const playerRoleKeys = new Set([
    'PLAYER',
    ...((options.playerRoleTokens || []).map(token =>
      String(token || '').replace(/^\$/, '')
    )),
  ]);

  return {
    scene,
    definition,
    options,
    preview: Boolean(options.preview),
    characterOverrides,
    variables,
    playerCharacterId,
    playerRoleKeys,
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

function tokenUsesPlayerSubstitute(token, context) {
  if (!token) return false;
  const marker = String.fromCharCode(36);
  const raw = String(token);
  const key = raw.startsWith(marker) ? raw.slice(1) : raw;
  if (context.playerRoleKeys?.has(key)) return false;
  const id = resolveCharacterToken(token, context);
  return Boolean(id && id === context.playerCharacterId);
}

function collectCutsceneCharacterRefs(context) {
  const refs = new Map();
  const pages = context.definition.pages || [];

  const addToken = token => {
    const id = resolveCharacterToken(token, context);
    if (!id || !characters[id]) return;
    const rivalContext = tokenUsesPlayerSubstitute(token, context);
    refs.set(id + ':' + (rivalContext ? 'rival' : 'player'), {
      id,
      rivalContext,
    });
  };

  SIDES.forEach(side => addToken(context.definition.characters?.[side]));
  pages.forEach(page => {
    SIDES.forEach(side => addToken(page?.[side + 'Character']));
  });

  return [...refs.values()];
}

function queueCharacterAssets(scene, characterRefs, playerCharacterId, context = null) {
  let queued = 0;
  if (context?.options?.preloadPagePosesOnly) {
    // Small repeatable school cutscenes use only the authored poses actually
    // shown. Loading every lifetime Sayaka look (home / Ginza / track) and all
    // player variants produced an unnecessary pause after each tap.
    const queuedKeys = new Set();
    for (const page of context.definition.pages || []) {
      for (const side of SIDES) {
        const token = pageCharacterToken(context.definition, page, side);
        const id = resolveCharacterToken(token, context);
        if (!id || !characters[id]) continue;
        const pose = page?.[side + 'Pose'] ||
          (page.speaker === side ? page.pose : null) || 'idle';
        const asset = getCharacterProfileTexture(id, pose, {
          rivalContext: tokenUsesPlayerSubstitute(token, context),
          playerCharacterId,
        });
        if (!asset?.key || !asset?.path || queuedKeys.has(asset.key)) continue;
        queuedKeys.add(asset.key);
        if (scene.textures.exists(asset.key)) continue;
        scene.load.image(asset.key, getCharacterAssetUrl(asset.path));
        queued++;
      }
    }
    return queued;
  }
  characterRefs.forEach(({ id, rivalContext }) => {
    const visual = getCharacterVisualForContext(id, {
      rivalContext,
      playerCharacterId,
    });
    if (!visual) return;

    const assets = [
      [visual.spriteKey, visual.path],
      [visual.winSpriteKey, visual.winPath],
      [visual.lossSpriteKey, visual.lossPath],
      ...Object.values(visual.poseAssets || {}).map(asset => [
        asset?.key,
        asset?.path,
      ]),
    ];
    const seen = new Set();

    assets.forEach(([key, path]) => {
      if (!key || !path || seen.has(key) || scene.textures.exists(key)) return;
      seen.add(key);
      scene.load.image(key, getCharacterAssetUrl(path));
      queued += 1;
    });
  });
  return queued;
}

/** Load optional milestone backgrounds only for cutscenes that declare them. */
function queueCutsceneBackdropAssets(scene, definition) {
  let queued = 0;
  const seen = new Set();
  Object.values(definition.backdrops || {}).forEach(spec => {
    const key = String(spec?.key || '');
    const path = String(spec?.path || '');
    if (!key || !path || seen.has(key) || scene.textures.exists(key)) return;
    seen.add(key);
    scene.load.image(key, path);
    queued++;
  });
  return queued;
}

function sizeChapterBackdrop(image, scene) {
  const frame = image?.texture?.getSourceImage?.();
  const width = Math.max(1, Number(frame?.width || 1));
  const height = Math.max(1, Number(frame?.height || 1));
  image.setScale(Math.max(scene.scale.width / width, scene.scale.height / height));
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

function frameFor(scene, side, chapter09RoomBackdrop = false) {
  const width = Number(scene.scale.width || scene.cameras.main.width || 1560);
  const height = Number(scene.scale.height || scene.cameras.main.height || 840);
  // Chapter 09 alone uses a three-portrait composition over the persistent
  // rego room: a smaller player cameo at far left, teammate at left-centre,
  // and the owner/official/visitor at right-centre.
  if (chapter09RoomBackdrop) {
    if (side === 'center') return {
      x: width * .112, y: height * .56,
      frameWidth: Math.min(325, width * .21),
      frameHeight: Math.min(475, height * .56),
    };
    if (side === 'left') return {
      x: width * .356, y: height * .50,
      frameWidth: Math.min(505, width * .306),
      frameHeight: Math.min(620, height * .76),
    };
    if (side === 'right') return {
      x: width * .765, y: height * .50,
      frameWidth: Math.min(505, width * .306),
      frameHeight: Math.min(620, height * .76),
    };
  }
  // Keep the whole silhouette comfortably within the staging area. Earlier
  // cutscenes set their centre at 42% of screen height, which elevated every
  // character relative to the dialogue gutter and cropped hair unnecessarily.
  const frameHeight = Math.min(620, Math.max(450, height * 0.76));
  const frameWidth = Math.min(550, Math.max(410, width * 0.35));
  const y = height * 0.50;

  if (side === 'left') {
    return { x: width * 0.28, y, frameWidth, frameHeight };
  }
  if (side === 'right') {
    return { x: width * 0.72, y, frameWidth, frameHeight };
  }
  return { x: width * 0.50, y, frameWidth: Math.min(700, frameWidth * 1.10), frameHeight };
}

function actorLabel(scene, context, page, side, characterId, rivalContext = false) {
  if (page?.nameOverride) return interpolate(page.nameOverride, context.variables);
  if (page?.speakerLabel) return interpolate(page.speakerLabel, context.variables);

  if (characterId === context.playerCharacterId && !rivalContext) {
    return playerDisplayName(scene, context.playerCharacterId).toUpperCase();
  }

  const displayCharacter = getCharacterForContext(characterId, {
    rivalContext,
    playerCharacterId: context.playerCharacterId,
  });
  return String(displayCharacter?.name || side || 'TOKYO SHIFT').toUpperCase();
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

  const requestedPose = String(pose || 'idle').trim().toLowerCase() || 'idle';
  const visualOptions = {
    rivalContext: Boolean(actor?.rivalContext),
    playerCharacterId:
      actor?.playerCharacterId ||
      scene.registry?.get?.('playerCharacterId') ||
      '',
  };
  const contextualVisual = getCharacterVisualForContext(characterId, visualOptions);
  const textureInfo = getCharacterProfileTexture(
    characterId,
    requestedPose,
    visualOptions
  );

  let spriteKey = textureInfo?.key;
  let actualPose = textureInfo?.pose || 'idle';
  let poseFallback = Boolean(textureInfo?.fallback);

  if (!spriteKey || !scene.textures.exists(spriteKey)) {
    spriteKey = contextualVisual?.spriteKey;
    actualPose = 'idle';
    poseFallback = requestedPose !== 'idle';
  }
  if (!spriteKey || !scene.textures.exists(spriteKey)) return false;

  const resolved = resolveCharacterProfile(characterId, actualPose);
  const texture = scene.textures.get(spriteKey);
  texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  const source = texture.getSourceImage();

  // Pose changes must use precisely the same crown/face-centred geometry as
  // createCharacterProfile. The old shortcut ignored the head anchor and
  // jumped the portrait upward (and sideways) whenever its pose changed.
  const placement = getCharacterProfilePlacement({
    source,
    spriteKey,
    contextualVisual,
    pose: actualPose,
    profile: resolved,
    x: frame.x,
    y: frame.y,
    frameWidth: frame.width,
    frameHeight: frame.height,
    side,
    flipInward: true,
  });

  image
    .setTexture(spriteKey)
    .setPosition(placement.x, placement.y)
    .setScale(placement.scale)
    .setFlipX(placement.flipX);

  profile.requestedPose = requestedPose;
  profile.actualPose = actualPose;
  profile.poseFallback = poseFallback;
  profile.spriteKey = spriteKey;
  profile.profile = resolved;
  // Keep the authored pose spelling for consistent reuse across pages.
  actor.pose = pose;
  return true;
}

function replaceActorProfile(
  controller,
  side,
  characterId,
  pose,
  dimmed,
  firstPage = false,
  rivalContext = false
) {
  const { scene, context } = controller;
  const previous = controller.actors[side];

  if (
    previous?.characterId === characterId &&
    previous?.rivalContext === Boolean(rivalContext) &&
    previous?.profile
  ) {
    if (previous.pose !== pose) {
      updateActorPoseInPlace(scene, previous, side, characterId, pose);
    }
    if (context.options.chapter09RoomBackdrop && side === 'center') {
      previous.profile.setAlpha(dimmed ? .55 : 1);
    }
    previous.profile.setDimmed(dimmed, { duration: SPEAKER_DIM_MS });
    return previous;
  }

  if (!characterId || !characters[characterId]) {
    if (previous?.profile) {
      scene.tweens.killTweensOf(previous.profile.image);
      if (controller.definition.pages?.[controller.pageIndex]?.fadeOutActors) {
        const oldProfile = previous.profile;
        scene.tweens.add({
          targets: oldProfile.image,
          alpha: 0,
          duration: 290,
          ease: 'Sine.easeOut',
          onComplete: () => oldProfile.destroy(),
        });
      } else {
        previous.profile.destroy();
      }
    }
    controller.actors[side] = {
      characterId: null,
      pose,
      profile: null,
      rivalContext: false,
      playerCharacterId: context.playerCharacterId,
    };
    return controller.actors[side];
  }

  const roomPortraits = Boolean(context.options.chapter09RoomBackdrop);
  const frame = frameFor(scene, side, roomPortraits);
  const profile = createCharacterProfile(scene, {
    characterId,
    pose,
    x: frame.x,
    y: frame.y,
    frameWidth: frame.frameWidth,
    frameHeight: frame.frameHeight,
    side,
    depth: BASE_DEPTH + (side === 'center' ? (roomPortraits ? 12 : 18) : 15),
    flipInward: true,
    dimmed,
    // Manga characters are staged as full silhouettes. Profile cards keep
    // their rectangular masks; cutscenes intentionally let hair/arms/poses
    // extend sideways and disappear naturally behind the dialogue gutter.
    mask: false,
    rivalContext,
    playerCharacterId: context.playerCharacterId,
  });

  if (!profile) {
    controller.actors[side] = {
      characterId,
      pose,
      profile: null,
      rivalContext: Boolean(rivalContext),
      playerCharacterId: context.playerCharacterId,
    };
    return controller.actors[side];
  }

  profile.image.setScrollFactor(0);
  profile.maskShape?.setScrollFactor?.(0);
  if (roomPortraits && side === 'center') profile.setAlpha(dimmed ? .55 : 1);
  const targetAlpha = dimmed ? (roomPortraits && side === 'center' ? .396 : .72) : 1;
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
    rivalContext: Boolean(rivalContext),
    playerCharacterId: context.playerCharacterId,
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
  const isPhoneCall = Boolean(page.phoneCall);

  // Compact manga card: with the actors now smaller and staged higher, the
  // dialogue no longer needs to act as a full-width character crop. Keep it
  // broad enough for 2–3 readable lines on phone landscape while revealing
  // more of the frozen game and character silhouettes around it.
  const bottomSafe = Math.max(18, Math.round(height * 0.03));
  const cardWidth = clamp(width * 0.68, 760, 1060);
  const cardHeight = clamp(height * 0.155, 112, 132);
  const x = width / 2;
  const y = height - bottomSafe - cardHeight / 2;

  const speakingActor = SIDES.includes(speaker)
    ? controller.actors[speaker]
    : null;
  const characterId = speakingActor?.characterId || null;
  const label = speaker === 'system'
    ? interpolate(page.speakerLabel || 'TOKYO SHIFT', context.variables)
    : actorLabel(
        scene,
        context,
        page,
        speaker,
        characterId,
        Boolean(speakingActor?.rivalContext)
      );

  const card = scene.add.rectangle(x, y, cardWidth, cardHeight,
    isPhoneCall ? (speaker === 'right' ? 0x16464a : 0x193650) : 0xfffcf1, 1)
    .setStrokeStyle(isPhoneCall ? 4 : 6, isPhoneCall ? 0x78badd : 0x111111, 1)
    .setDepth(BASE_DEPTH + 30)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  const labelWidth = Math.min(330, cardWidth * 0.30);
  const labelHeight = 36;
  const cardTop = y - cardHeight / 2;
  // Speaker name sits outside the dialogue field like a tab. A tiny overlap
  // keeps the tab visually attached to the card border without covering text.
  const labelY = cardTop - labelHeight / 2 + 3;
  const chapter09PlayerSpeaking = Boolean(context.options.chapter09RoomBackdrop && speaker === 'center');
  const labelX = chapter09PlayerSpeaking ? x : speaker === 'right'
    ? x + cardWidth / 2 - labelWidth / 2 - 18
    : x - cardWidth / 2 + labelWidth / 2 + 18;
  const labelBox = scene.add.rectangle(
    labelX,
    labelY,
    labelWidth,
    labelHeight,
    isPhoneCall ? 0x0c253c : 0x111111,
    1
  ).setDepth(BASE_DEPTH + 31).setScrollFactor(0);

  const labelText = scene.add.text(
    chapter09PlayerSpeaking ? labelX : speaker === 'right'
      ? labelX + labelWidth / 2 - 16
      : labelX - labelWidth / 2 + 16,
    labelY,
    isPhoneCall ? (speaker === 'right' ? 'YOU // PHONE' : label + ' // PHONE') : label,
    {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#ffffff',
      align: chapter09PlayerSpeaking ? 'center' : speaker === 'right' ? 'right' : 'left',
    }
  ).setOrigin(chapter09PlayerSpeaking ? .5 : speaker === 'right' ? 1 : 0, 0.5)
    .setDepth(BASE_DEPTH + 32)
    .setScrollFactor(0);

  const body = scene.add.text(
    x - cardWidth / 2 + 38,
    y - 12,
    interpolate(page.text || '', context.variables),
    {
      fontFamily: BODY_FONT,
      fontSize: page.emphasis ? '14px' : '13px',
      color: isPhoneCall ? '#ffffff' : '#111111',
      fontStyle: page.emphasis ? '800' : '700',
      lineSpacing: 5,
      wordWrap: { width: cardWidth - 76 },
    }
  ).setOrigin(0, 0.5)
    .setDepth(BASE_DEPTH + 32)
    .setScrollFactor(0);

  const finalPage = controller.pageIndex >= (definition.pages?.length || 1) - 1;
  const rawAction = page.actionLabel || (finalPage
    ? (definition.finalActionLabel || 'CONTINUE')
    : 'NEXT');
  const actionLabel = interpolate(rawAction, context.variables) + '  >';
  const secondaryRaw = page.secondaryActionLabel != null
    ? page.secondaryActionLabel
    : finalPage ? definition.secondaryFinalActionLabel : null;
  const actionEnabled = !page.disableAction &&
    !(finalPage && context.options.isFinalActionEnabled?.({ page }) === false);
  const secondaryLabel = secondaryRaw
    ? interpolate(secondaryRaw, context.variables)
    : '';
  const hasSecondaryAction = Boolean(secondaryLabel);
  const actionWidth = hasSecondaryAction
    ? Math.min(270, Math.max(220, cardWidth * 0.20))
    : Math.min(300, Math.max(230, cardWidth * 0.22));
  const secondaryWidth = hasSecondaryAction
    ? Math.min(220, Math.max(180, cardWidth * 0.16))
    : 0;
  const actionX = x + cardWidth / 2 - actionWidth / 2 - 18;
  const footerY = y + cardHeight / 2 - 23;

  const actionBox = scene.add.rectangle(
    actionX,
    footerY,
    actionWidth,
    42,
    actionEnabled ? (isPhoneCall ? 0x215b85 : 0x111111) : 0x565656,
    1
  ).setDepth(BASE_DEPTH + 33)
    .setScrollFactor(0);
  if (actionEnabled) actionBox.setInteractive({ useHandCursor: true });

  const actionText = scene.add.text(
    actionX,
    footerY,
    actionLabel,
    {
      fontFamily: PIXEL_FONT,
      fontSize: finalPage ? '7px' : '8px',
      color: actionEnabled ? '#ffffff' : '#cccccc',
      align: 'center',
    }
  ).setOrigin(0.5)
    .setDepth(BASE_DEPTH + 34)
    .setScrollFactor(0);

  let secondaryBox = null;
  let secondaryText = null;
  if (hasSecondaryAction) {
    const secondaryX = actionX - actionWidth / 2 - 14 - secondaryWidth / 2;
    secondaryBox = scene.add.rectangle(
      secondaryX,
      footerY,
      secondaryWidth,
      42,
      0xfffcf1,
      1
    ).setStrokeStyle(3, 0x111111, 1)
      .setDepth(BASE_DEPTH + 33)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    secondaryText = scene.add.text(
      secondaryX,
      footerY,
      secondaryLabel,
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#111111',
        align: 'center',
      }
    ).setOrigin(0.5)
      .setDepth(BASE_DEPTH + 34)
      .setScrollFactor(0);
  }

  const pageCount = Math.max(1, definition.pages?.length || 0);
  const counter = scene.add.text(
    x - cardWidth / 2 + 34,
    footerY,
    String(controller.pageIndex + 1).padStart(2, '0') + ' / ' +
      String(pageCount).padStart(2, '0'),
    {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: isPhoneCall ? '#daeefa' : '#333333',
    }
  ).setOrigin(0, 0.5)
    .setDepth(BASE_DEPTH + 32)
    .setScrollFactor(0);

  const objects = [
    card,
    labelBox,
    labelText,
    body,
    actionBox,
    actionText,
    secondaryBox,
    secondaryText,
    counter,
  ].filter(Boolean);
  objects.forEach(obj => obj.setAlpha?.(0));
  controller.dialogueObjects.push(...objects);

  scene.tweens.add({
    targets: objects,
    alpha: 1,
    duration: 70,
    ease: 'Sine.easeOut',
  });

  card.on('pointerdown', () => controller.advance());
  actionBox.on('pointerdown', () => controller.advance('button'));
  secondaryBox?.on('pointerdown', () => controller.finish('secondary'));
}

// An optional readable data card on the right of the standard manga actor.
// Used by Driving School reports; it remains part of the SAME renderer and
// is torn down with the scene, not a second custom popup above the cutscene.
function drawMangaInfoPanel(controller) {
  const { scene, context } = controller;
  const data = context.options.infoPanel;
  if (!data || !Array.isArray(data.rows)) return;
  const width = Number(scene.scale.width || 1560);
  const height = Number(scene.scale.height || 840);
  const scaleX = width / 1560;
  const scaleY = height / 840;
  const x = 1110 * scaleX;
  const y = 354 * scaleY;
  const w = 744 * scaleX;
  const h = 490 * scaleY;
  const depth = BASE_DEPTH + 24;
  const own = object => {
    object.setScrollFactor(0).setDepth(depth + 1);
    controller.objects.push(object);
    return object;
  };
  own(scene.add.rectangle(x, y, w, h, 0xfffcf1, 0.97)
    .setStrokeStyle(5, 0x111111, 1)).setDepth(depth);
  const left = x - w / 2 + 25 * scaleX;
  const maxWidth = w - 50 * scaleX;
  const writing = (xx, yy, text, size = '10px', color = '#111111', options = {}) =>
    own(scene.add.text(xx, yy, String(text ?? ''), {
      fontFamily: options.body ? BODY_FONT : PIXEL_FONT,
      fontSize: size, color,
      wordWrap: { width: options.wrap || maxWidth },
      fontStyle: options.bold ? '700' : 'normal',
    }));
  writing(left, y - h / 2 + 21 * scaleY, data.title || 'LESSON SUMMARY', '12px');
  if (data.subtitle) writing(left, y - h / 2 + 67 * scaleY, data.subtitle, '9px');
  const headers = data.headers || ['GEAR', 'TARGET RPM', 'YOUR RPM', 'RESULT'];
  const colPositions = [0, 0.21, 0.57, 0.79];
  const headerY = y - h / 2 + 110 * scaleY;
  own(scene.add.rectangle(x, headerY + 10 * scaleY, w - 45 * scaleX, 37 * scaleY, 0xe5e7e4));
  headers.slice(0, 4).forEach((header, i) =>
    writing(left + maxWidth * colPositions[i], headerY, header, '8px'));
  const rows = data.rows.slice(0, 7);
  rows.forEach((row, index) => {
    const ry = headerY + (50 + index * 42) * scaleY;
    if (index % 2 === 0) own(scene.add.rectangle(x, ry + 12 * scaleY, w - 45 * scaleX, 38 * scaleY, 0xf1f2ef));
    const values = Array.isArray(row) ? row : [
      row.label, row.target, row.actual, row.result,
    ];
    values.slice(0, 4).forEach((value, i) => {
      const accent = i === 3 && value === 'IN RANGE' ? '#20744d'
        : i === 3 && value !== '—' ? '#8a3727' : '#141820';
      writing(left + maxWidth * colPositions[i], ry, value, '9px', accent);
    });
  });
  if (data.footer) {
    const bottomY = y + h / 2 - 48 * scaleY;
    writing(left, bottomY, data.footer, '9px');
  }
}


function sceneTweensFadeTitle(controller) {
  if (controller.topTitleHidden) return;
  controller.topTitleHidden = true;
  const objects = controller.topTitleObjects || [];
  controller.scene.tweens.add({
    targets: objects,
    alpha: 0,
    duration: 230,
    ease: 'Sine.easeOut',
  });
}

function renderPage(controller, pageIndex, firstPage = false) {
  const { context, definition } = controller;
  const pages = definition.pages || [];
  const page = pages[pageIndex];
  if (!page) return;

  controller.pageIndex = pageIndex;
  clearDialogue(controller);
  const backdrop = definition.backdrops?.[page.backdrop];
  if (backdrop?.key && controller.backdropImage &&
      context.scene.textures.exists(backdrop.key) &&
      controller.backdropImage.texture.key !== backdrop.key) {
    controller.backdropImage.setTexture(backdrop.key);
    sizeChapterBackdrop(controller.backdropImage, context.scene);
  }

  // When the two equal car bays appear, clear the small opening title plate
  // so it cannot overlap the left-hand car's top header. The main manga
  // dialogue panel, buttons and active cutscene remain untouched.
  if (page.hideSceneTitle && controller.topTitleObjects?.length) {
    sceneTweensFadeTitle(controller);
  }

  SIDES.forEach(side => {
    const current = controller.actors[side];
    const token = pageCharacterToken(definition, page, side);
    const characterId = resolveCharacterToken(token, context);
    const rivalContext = tokenUsesPlayerSubstitute(token, context);
    const pose = desiredPose(page, side, current?.pose || 'idle');
    const dimmed = desiredDimmed(page.speaker, side);
    replaceActorProfile(
      controller,
      side,
      characterId,
      pose,
      dimmed,
      firstPage,
      rivalContext
    );
  });

  // Scene-owned car bays and eligibility must be established BEFORE the
  // dialogue's action buttons are drawn. This is especially important on the
  // crew choice page, where READY TO RACE depends on an eligible car.
  try {
    context.options.onPageChange?.({
      pageIndex,
      pageNumber: pageIndex + 1,
      firstPage,
      page,
      pageCount: pages.length,
    });
  } catch (error) {
    console.warn('[Tokyo SHIFT] Manga page-change callback failed', error);
  }

  drawDialogue(controller, page);
  // Interactive story galleries (Scenes 06/07) own this page until NEXT is
  // tapped. drawDialogue happens AFTER onPageChange starts their overlay:
  // hide the newly created card so touch gestures cannot advance the manga.
  if (context.scene._portraitGallery?.active) {
    context.scene._portraitGallery.hideMangaUI?.();
  }
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
  if (sceneCutsceneActive(scene,{
    ignoreChapter09Stage: Boolean(context?.options?.chapter09RoomBackdrop),
  })) {
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

  // The new translucent white wash retains the standard cutscene silhouettes,
  // title card and dialogue box while leaving a glimpse of the finish line.
  const paperBackground = context.options.backgroundStyle === 'paper';
  const whiteWash = context.options.backgroundStyle === 'wash';
  const shade = scene.add.rectangle(
    width / 2,
    height / 2,
    width,
    height,
    paperBackground || whiteWash ? 0xfffcf1 : 0x000000,
    paperBackground ? 1 : whiteWash ? 0.83 :
      context.options.chapter09RoomBackdrop ? 0.20 : 0.54
  ).setDepth(BASE_DEPTH + 1)
    .setScrollFactor(0)
    .setAlpha(0);

  // Two locations can share one manga cutscene without creating custom UI.
  const openingBackdrop = definition.backdrops?.[definition.pages?.[0]?.backdrop];
  let backdropImage = null;
  let backdropVeil = null;
  if (openingBackdrop?.key && scene.textures.exists(openingBackdrop.key)) {
    backdropImage = scene.add.image(width / 2, height / 2, openingBackdrop.key)
      .setDepth(BASE_DEPTH + 2).setScrollFactor(0);
    sizeChapterBackdrop(backdropImage, scene);
    backdropVeil = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.32)
      .setDepth(BASE_DEPTH + 3).setScrollFactor(0);
  }
  controller.backdropImage = backdropImage;

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

  controller.objects.push(blocker, shade, ...(backdropImage ? [backdropImage, backdropVeil] : []), titlePlate, title, skip);
  controller.topTitleObjects = [titlePlate, title];
  controller.topTitleHidden = false;

  scene.tweens.add({
    targets: shade,
    alpha: 1,
    duration: 210,
    ease: 'Sine.easeOut',
  });
  scene.tweens.add({
    targets: definition.pages?.[0]?.hideSceneTitle
      ? [skip] : [titlePlate, title, skip],
    alpha: 1,
    duration: 180,
    delay: 70,
    ease: 'Sine.easeOut',
  });

  controller.advance = (source = 'ambient') => {
    if (!controller.active || controller.cleaned || controller.finishing) return;
    // Explicit acceptance and READY TO RACE must come from the black button,
    // never from an incidental tap on the dialogue card or shaded backdrop.
    const activePage = definition.pages?.[controller.pageIndex];
    if (activePage?.requireActionButton && source !== 'button') return;
    const now = Date.now();
    if (now - controller.lastAdvanceAt < PAGE_DEBOUNCE_MS) return;
    controller.lastAdvanceAt = now;

    const pages = definition.pages || [];
    const finalPage = controller.pageIndex >= pages.length - 1;
    if (finalPage && (pages[controller.pageIndex]?.disableAction ||
        context.options.isFinalActionEnabled?.({
          page: pages[controller.pageIndex],
        }) === false)) return;
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
      // Sayaka's farewell is allowed a gentler exit than ordinary panels.
      duration: Math.max(190, Number(context.options.exitFadeMs) || 190),
      ease: 'Sine.easeInOut',
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

  drawMangaInfoPanel(controller);
  renderPage(controller, 0, true);
  return controller;
}

export function playMangaCutscene(scene, cutsceneId, options = {}) {
  // Runtime one-off coaching/confirmation cutscenes have dynamic data and do
  // not belong in the saved story canon or developer's fixed cutscene index.
  const definition = cutsceneId && typeof cutsceneId === 'object' &&
    Array.isArray(cutsceneId.pages) ? cutsceneId : getCutscene(cutsceneId);
  if (!scene || !definition) {
    return { played: false, reason: 'missing', active: false };
  }

  if (sceneCutsceneActive(scene,{
    ignoreChapter09Stage: Boolean(options.chapter09RoomBackdrop),
  })) {
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

  // Phone-style scenes use the canonical circular-portrait callout rather
  // than manga silhouettes. Existing character scenes remain unchanged.
  if (definition.presentation === 'phone') {
    const result = playPhoneConversation(scene, {
      callerId: options.callerId || definition.callerId || '',
      callerName: options.callerName || definition.callerName || '',
      callerPose: options.callerPose || definition.callerPose || 'idle',
      presentationMode: options.presentationMode || definition.presentationMode || 'standard',
      label: options.label || definition.label || 'INCOMING CALL',
      speakerStyle: options.speakerStyle || definition.speakerStyle || 'incoming',
      accent: options.accent ?? definition.accent ?? null,
      pages: definition.pages || [],
      variables: {
        ...context.variables,
        // Use the driver's entered spelling, not the manga ALL-CAPS label.
        PLAYER_FIRST_NAME: String(scene.registry.get('firstName') || '').trim() ||
          context.variables.PLAYER_FIRST_NAME,
      },
      onComplete: () => {
        if (!context.preview && definition.once !== false) {
          markCutsceneSeen(scene.registry, historyId);
          saveSessionState(scene.registry);
        }
        const payload = {
          cutsceneId: definition.id, historyId,
          reason: 'action', skipped: false, preview: context.preview,
        };
        if (context.preview) options.onPreviewComplete?.(payload);
        else options.onComplete?.(payload);
      },
      onCancel: payload => options.onCancel?.(payload),
    });
    return result;
  }

  const characterRefs = collectCutsceneCharacterRefs(context);
  const queued = queueCharacterAssets(
    scene,
    characterRefs,
    context.playerCharacterId,
    context
  ) + queueCutsceneBackdropAssets(scene, definition);

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
