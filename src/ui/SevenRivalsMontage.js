// Scene 06 — the seven conquered regional leaders flow through one continuous
// centre-stage manga portrait position. Future leaders fan behind in grey;
// the centre portrait becomes full colour, then moves left and desaturates.
// Office flags stay at one fixed LEFT position and crossfade for each rival.
import {
  characters,
  getCharacterForContext,
  getCharacterVisualAsset,
  getCharacterAssetUrl,
} from '../data/characters.js?v=20261011-r477';
import {
  createCharacterProfile,
} from '../characters/CharacterProfileRenderer.js?v=20261011-r477';

const PIXEL_FONT = '"Silkscreen", monospace';
const REGIONAL_MEMORIES = Object.freeze([
  ['ODAIBA', 'emiKanzaki', 'officeFlagOdaiba'],
  ['SHINAGAWA', 'renMizuno', 'officeFlagShinagawa'],
  ['TATSUMI', 'kaitoFujimori', 'officeFlagTatsumi'],
  ['SHIBUYA', 'ayaKurose', 'officeFlagShibuya'],
  ['YOKOHAMA', 'haruTachibana', 'officeFlagYokohama'],
  ['DAIKOKU', 'reinaShibata', 'officeFlagDaikoku'],
  ['SHINJUKU', 'rikuAkamine', 'officeFlagShinjuku'],
]);

// In career gameplay GarageScene preloads these. Developer previews can run
// from MeetScene/RaceScene too, where neither the flags nor the rival portraits
// are otherwise guaranteed to be in the Phaser texture cache.
export function preloadSevenRivalsMontageAssets(scene, onReady) {
  if (!scene?.textures || !scene?.load) {
    onReady?.();
    return 0;
  }
  const playerCharacterId = scene.registry?.get?.('playerCharacterId') || '';
  const pending = new Map();
  for (const [region, characterId, flagKey] of REGIONAL_MEMORIES) {
    const asset = getCharacterVisualAsset(characterId, 'idle', {
      rivalContext: true, playerCharacterId,
    });
    if (asset?.key && asset.path && !scene.textures.exists(asset.key)) {
      pending.set(asset.key, getCharacterAssetUrl(asset.path));
    }
    if (!scene.textures.exists(flagKey)) {
      pending.set(flagKey, 'assets/Garage/flag_' +
        region.toLowerCase() + '.png?v=20261005-r362');
    }
  }
  if (!pending.size) {
    onReady?.();
    return 0;
  }
  for (const [key, path] of pending) scene.load.image(key, path);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => onReady?.());
  if (!scene.load.isLoading?.()) scene.load.start();
  return pending.size;
}

const mix = (a, b, t) => a + (b - a) * t;
const destroySafely = obj => { try { obj?.destroy?.(); } catch (_) {} };

function portraitPosition(delta, centreX, centreY) {
  const distance = Math.abs(delta);
  if (delta >= 0) {
    return {
      x: centreX + (distance ? 143 + (distance - 1) * 110 : 0),
      y: centreY + Math.min(46, distance * 10),
      size: Math.max(0.73, 1 - distance * 0.052),
      colour: distance ? 0 : 1,
      grey: distance ? Math.max(0.16, 0.60 - distance * 0.075) : 0,
    };
  }
  return {
    x: centreX - 185 * distance,
    y: centreY + Math.min(40, distance * 10),
    size: Math.max(0.76, 1 - distance * 0.07),
    colour: 0,
    // Just-passed rivals grey out as they slide left and fade away.
    grey: Math.max(0, 0.36 - (distance - 1) * 0.26),
  };
}

export function startSevenRivalsPortraitMontage(scene) {
  if (!scene || scene._sevenRivalsMontage?.active) return scene?._sevenRivalsMontage;
  const width = Number(scene.scale?.width || 1560);
  const height = Number(scene.scale?.height || 840);
  const centreX = width * 0.55;
  const centreY = height * 0.50;
  const flagX = width * 0.19;
  const flagY = height * 0.40;
  // EXACT same portrait geometry and character art as manga Daichi / player.
  const frameHeight = Math.min(620, Math.max(450, height * 0.76));
  const frameWidth = Math.min(700,
    Math.min(550, Math.max(410, width * 0.35)) * 1.10);
  const playerId = scene.registry?.get?.('playerCharacterId') || '';

  const objects = [];
  const portraits = [];
  const flags = [];
  const baseActorAlphas = [];
  let animation = null;
  let pendingHold = null;
  let active = true;
  const own = object => { if (object) objects.push(object);return object; };
  const state = {
    active: true,
    stop() {
      if (!active) return;
      active = false;
      state.active = false;
      animation?.stop?.();
      pendingHold?.stop?.();
      objects.forEach(destroySafely);
      portraits.forEach(item => item.profile?.destroy?.());
      baseActorAlphas.forEach(({ image, alpha }) => {
        if (image?.active) {
          scene.tweens?.killTweensOf?.(image);
          image.setAlpha(alpha);
        }
      });
      scene.events?.off?.('shutdown', state.stop);
      scene.events?.off?.('destroy', state.stop);
      if (scene._sevenRivalsMontage === state) scene._sevenRivalsMontage = null;
    },
  };
  scene._sevenRivalsMontage = state;
  scene.events?.once?.('shutdown', state.stop);
  scene.events?.once?.('destroy', state.stop);

  // The player's 'I remember every race' line is spoken BEFORE this beat.
  // When that dialogue is acknowledged, dissolve the player and Daichi over
  // a full second, while the first rival and the Crew flags emerge slowly.
  const currentPage = scene._mangaCutscene?.definition?.pages?.[
    scene._mangaCutscene?.pageIndex
  ];
  for (const side of ['left', 'right']) {
    const image = scene._mangaCutscene?.actors?.[side]?.profile?.image;
    if (!image?.active) continue;
    const alpha = currentPage?.speaker === side ? 1 : 0.72;
    baseActorAlphas.push({ image, alpha });
    scene.tweens?.killTweensOf?.(image);
  }

  const curtain = own(scene.add.rectangle(width / 2, height / 2, width, height,
    0x090d15, 0.84).setDepth(949).setScrollFactor(0)
    .setInteractive().setAlpha(0));
  // The blocker absorbs taps during the memory sequence. A tap dismisses the
  // montage and returns to the normal third manga page instead of trapping
  // the player behind a non-interactive dark overlay.
  curtain.on('pointerdown', () => state.stop());
  const guest = Object.freeze({ rivalContext: true, playerCharacterId: playerId });

  REGIONAL_MEMORIES.forEach(([region, characterId, flagKey], index) => {
    const profile = createCharacterProfile(scene, {
      characterId, pose: 'idle', x: centreX, y: centreY,
      frameWidth, frameHeight, side: 'center', flipInward: false,
      depth: 964, dimmed: false, mask: false,
      rivalContext: true, playerCharacterId: playerId,
    });
    if (profile?.image) {
      const colour = profile.image.setScrollFactor(0);
      const baseX = colour.x, baseY = colour.y, baseScale = colour.scaleX;
      // A duplicate grey silhouette covers the real full-colour portrait.
      // Crossfading this layer yields actual grey -> colour, rather than a
      // dim tinted character that keeps its original saturated colours.
      const grey = own(scene.add.image(baseX, baseY, profile.spriteKey)
        .setOrigin(0.5, 0).setScale(baseScale)
        .setFlipX(colour.flipX).setTintFill(0x727780)
        .setScrollFactor(0).setDepth(965));
      portraits.push({ profile, colour, grey, baseX, baseY, baseScale, index });
    }
    if (scene.textures.exists(flagKey)) {
      const flag = own(scene.add.image(flagX, flagY, flagKey)
        .setDepth(983).setScrollFactor(0).setAlpha(0));
      const src = scene.textures.get(flagKey).getSourceImage();
      flag.setScale(Math.min(282 / Math.max(1, src?.width || 1),
        208 / Math.max(1, src?.height || 1)));
      flags.push({ index, flag });
    }
  });

  const regionNames = REGIONAL_MEMORIES.map(([region], index) => ({
    index,
    object: own(scene.add.text(flagX, flagY + 133, region, {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#f2f4fa', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(984).setAlpha(0)),
  }));
  const personName = own(scene.add.text(centreX, height * 0.785, '', {
    fontFamily: PIXEL_FONT, fontSize: '10px', color: '#eaf3ff', align: 'center',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(985));
  const chapterLabel = own(scene.add.text(centreX, height * 0.12,
    'SEVEN REGIONAL CHAMPIONS', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#b4c9db',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(985));
  const skipHint = own(scene.add.text(width - 46, 58, 'TAP TO SKIP MEMORIES', {
    fontFamily: PIXEL_FONT, fontSize: '7px', color: '#d1dbe7',
    backgroundColor: '#101824cc', padding: { x: 12, y: 7 },
  }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(997)
    .setInteractive({ useHandCursor: true }).setAlpha(0));
  skipHint.on('pointerdown', () => state.stop());

  const paint = (index, next = index, t = 0) => {
    if (!active) return;
    for (const item of portraits) {
      const before = portraitPosition(item.index - index, centreX, centreY);
      const after = portraitPosition(item.index - next, centreX, centreY);
      const x = mix(before.x, after.x, t);
      const y = mix(before.y, after.y, t);
      const size = mix(before.size, after.size, t);
      item.colour.setPosition(item.baseX + x - centreX,
        item.baseY + y - centreY).setScale(item.baseScale * size);
      item.grey.setPosition(item.colour.x, item.colour.y)
        .setScale(item.baseScale * size);
      const relative = Math.abs(item.index - mix(index, next, t));
      const depth = 963 + Math.max(0, 8 - relative) * 1.6;
      item.colour.setDepth(depth);
      item.grey.setDepth(depth + 0.1);
      item.colour.setAlpha(mix(before.colour, after.colour, t));
      item.grey.setAlpha(mix(before.grey, after.grey, t));
    }
    // Every region flag occupies EXACTLY the same left-side position.
    // Only opacity changes: old fades out while incoming flag fades in.
    for (const { index: i, flag } of flags) {
      flag.setAlpha((i === index ? 1 - t : 0) + (i === next ? t : 0));
    }
    for (const { index: i, object } of regionNames) {
      object.setAlpha((i === index ? 1 - t : 0) + (i === next ? t : 0));
    }
    const id = REGIONAL_MEMORIES[t < 0.5 ? index : next]?.[1];
    personName.setText(String(getCharacterForContext(id, guest)?.name ||
      characters[id]?.name || '').toUpperCase());
  };

  // MangaCutscene.freezeScene PAUSES scene.time. A scene.time.delayedCall
  // will never fire until the manga ends (i.e. the original first-rival
  // hang). Scene tweens are deliberately left running by that freeze state.
  // Drive BOTH holds and movements from the tween clock instead.
  const queue = (ms, fn) => {
    const wait = { progress: 0 };
    pendingHold = scene.tweens.add({
      targets: wait, progress: 1, duration: ms, ease: 'Linear',
      onComplete: () => {
        pendingHold = null;
        if (active) fn();
      },
    });
  };

  const showIndex = index => {
    if (!active) return;
    if (index >= REGIONAL_MEMORIES.length - 1) {
      queue(850, () => {
        const dissolve = { amount: 1 };
        // Preserve base alpha: never multiply by the prior frame (which would
        // make the silhouettes fade exponentially and leave animation ghosts).
        const fadeTargets = [
          ...portraits.flatMap(p => [p.colour, p.grey]),
          ...flags.map(item => item.flag),
          ...regionNames.map(item => item.object),
          personName, chapterLabel,
        ].map(obj => ({ obj, alpha: obj.alpha }));
        animation = scene.tweens.add({
          targets: dissolve, amount: 0, duration: 550,
          ease: 'Sine.easeInOut',
          onUpdate: () => {
            curtain.setAlpha(0.84 * dissolve.amount);
            fadeTargets.forEach(({ obj, alpha }) => {
              if (obj?.active) obj.setAlpha(alpha * dissolve.amount);
            });
            baseActorAlphas.forEach(({ image, alpha }) => {
              if (image?.active) image.setAlpha(mix(alpha, 0.035, dissolve.amount));
            });
          },
          onComplete: () => state.stop(),
        });
      });
      return;
    }
    queue(index === 0 ? 800 : 410, () => {
      const shift = { t: 0 };
      animation = scene.tweens.add({
        targets: shift, t: 1, duration: 980, ease: 'Sine.easeInOut',
        onUpdate: () => paint(index, index + 1, shift.t),
        onComplete: () => {
          paint(index + 1);
          showIndex(index + 1);
        },
      });
    });
  };

  // Paint layout first, then fade the entire composition IN together. Doing
  // so prevents an instant first portrait from popping over the player.
  paint(0);
  const stageObjects = [
    ...portraits.flatMap(item => [item.colour, item.grey]),
    ...flags.map(item => item.flag),
    ...regionNames.map(item => item.object),
    personName, chapterLabel,
  ].map(obj => ({ obj, alpha: obj.alpha }));
  stageObjects.forEach(({ obj }) => obj.setAlpha(0));
  const entrance = { t: 0 };
  animation = scene.tweens.add({
    targets: entrance, t: 1, duration: 1250,
    ease: 'Sine.easeInOut',
    onUpdate: () => {
      if (!active) return;
      curtain.setAlpha(0.84 * entrance.t);
      stageObjects.forEach(({ obj, alpha }) => {
        if (obj?.active) obj.setAlpha(alpha * entrance.t);
      });
      skipHint.setAlpha(entrance.t * 0.85);
      baseActorAlphas.forEach(({ image, alpha }) => {
        if (image?.active) image.setAlpha(mix(alpha, 0.035, entrance.t));
      });
    },
    onComplete: () => {
      if (active) showIndex(0);
    },
  });
  return state;
}
