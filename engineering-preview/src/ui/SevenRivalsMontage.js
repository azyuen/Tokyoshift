// Scene 06 — the seven conquered regional leaders flow through one continuous
// centre-stage manga portrait position. Future leaders fan behind in grey;
// the centre portrait becomes full colour, then moves left and desaturates.
// Office flags stay at one fixed LEFT position and crossfade for each rival.
import {
  characters,
  getCharacterForContext,
  getCharacterVisualAsset,
  getCharacterAssetUrl,
} from '../data/characters.js';
import { openSwipePortraitGallery } from './SwipePortraitGallery.js';

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

// Both scenes now use the SAME portrait size, fan geometry, swipe controls,
// fixed regional flag crossfades and NEXT-to-resume behaviour.
export function startSevenRivalsPortraitMontage(scene) {
  const entries = REGIONAL_MEMORIES.map(([regionId, characterId]) => ({
    regionId, characterId, rivalContext: true,
  }));
  return openSwipePortraitGallery(scene, {
    entries,
    transparentBackground: false,
    title: 'SEVEN REGIONAL CHAMPIONS',
    ownerKey: '_sevenRivalsMontage',
  });
}
