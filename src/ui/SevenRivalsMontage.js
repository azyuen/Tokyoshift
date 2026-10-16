// Scene 06 — the seven conquered regional leaders flow through one continuous
// centre-stage manga portrait position. Future leaders fan behind in grey;
// the centre portrait becomes full colour, then moves left and desaturates.
// Office flags stay at one fixed LEFT position and crossfade for each rival.
import {
  characters,
  getCharacterForContext,
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

const limit = (n, min, max) => Math.max(min, Math.min(max, n));
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
  let nextTimer = null;
  let active = true;
  const own = object => { if (object) objects.push(object);return object; };
  const state = {
    active: true,
    stop() {
      if (!active) return;
      active = false;
      state.active = false;
      animation?.stop?.();
      nextTimer?.remove?.(false);
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

  // Leave the existing manga dialogue/characters where they are. Dim the
  // latter almost to zero and restore their exact original alpha afterwards.
  for (const side of ['left', 'right']) {
    const image = scene._mangaCutscene?.actors?.[side]?.profile?.image;
    if (!image?.active) continue;
    baseActorAlphas.push({ image, alpha: image.alpha });
    scene.tweens?.killTweensOf?.(image);
    scene.tweens.add({
      targets: image, alpha: 0.035, duration: 480,
      ease: 'Sine.easeInOut',
    });
  }

  const curtain = own(scene.add.rectangle(width / 2, height / 2, width, height,
    0x090d15, 0.84).setDepth(949).setScrollFactor(0).setInteractive());
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

  const queue = (ms, fn) => {
    nextTimer = scene.time.delayedCall(ms, fn);
  };

  const showIndex = index => {
    if (!active) return;
    if (index >= REGIONAL_MEMORIES.length - 1) {
      queue(850, () => {
        const dissolve = { amount: 1 };
        animation = scene.tweens.add({
          targets: dissolve, amount: 0, duration: 550,
          ease: 'Sine.easeInOut',
          onUpdate: () => {
            curtain.setAlpha(0.84 * dissolve.amount);
            portraits.forEach(item => {
              item.colour.setAlpha(item.colour.alpha * 0.94);
              item.grey.setAlpha(item.grey.alpha * 0.94);
            });
            objects.filter(obj => obj !== curtain && obj !== personName &&
              obj !== chapterLabel).forEach(obj => {
              if (obj?.active && !portraits.some(p => p.grey === obj))
                obj.setAlpha(obj.alpha * 0.94);
            });
            personName.setAlpha(dissolve.amount);
            chapterLabel.setAlpha(dissolve.amount);
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

  paint(0);
  showIndex(0);
  return state;
}
