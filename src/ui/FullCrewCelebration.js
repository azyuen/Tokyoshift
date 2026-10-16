// Scene 07: full-crew group reveal, using the REAL seven saved recruits.
// No hard-coded crew cast, no changes to saved cars, drivers or progression.
import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261011-r477';
import { getCrewMembers } from '../data/crewSystem.js?v=20261011-r479';
import { CREW_REGIONS, REGIONAL_CREW_ROSTERS } from '../data/crewRoster.js?v=20261011-r479';

import { openSwipePortraitGallery, PORTRAIT_GALLERY_FLAGS } from './SwipePortraitGallery.js?v=20261017-r562';

export function getCelebrationCrew(source, { preview = false } = {}) {
  const recruited = getCrewMembers(source);
  return CREW_REGIONS.flatMap(regionId => {
    const saved = recruited[regionId];
    if (saved?.characterId) return [{ regionId, characterId: saved.characterId }];
    // The tester previews a sample cast for missing slots, never writes it
    // into the save and never represents it as a recruited member in gameplay.
    const candidate = preview
      ? REGIONAL_CREW_ROSTERS[regionId]?.members?.find(m => m.recruitable)
      : null;
    return candidate ? [{ regionId, characterId: candidate.characterId }] : [];
  });
}

export function preloadFullCrewCelebrationAssets(scene, { preview = false } = {}, onReady = null) {
  if (!scene?.textures || !scene?.load) { onReady?.();return 0; }
  const ids = [
    ...getCelebrationCrew(scene.registry, { preview }).map(m => m.characterId),
    scene.registry.get('playerCharacterId') || 'renMizuno',
    'daichiSakamoto',
    'sayakaFujieda',
  ];
  const needed = new Map();
  for (const id of new Set(ids)) {
    const visual = characters[id]?.visual;
    if (visual?.spriteKey && visual?.path && !scene.textures.exists(visual.spriteKey)) {
      needed.set(visual.spriteKey, getCharacterAssetUrl(visual.path));
    }
  }
  // Shared gallery displays the office's regional flags at a FIXED left
  // position. Crew Space does not otherwise queue these textures.
  for (const regionId of CREW_REGIONS) {
    const flagKey = PORTRAIT_GALLERY_FLAGS[regionId];
    if (flagKey && !scene.textures.exists(flagKey)) {
      needed.set(flagKey,
        'assets/Garage/flag_' + regionId.toLowerCase() + '.png?v=20261005-r362');
    }
  }
  for (const phase of ['day','night']) {
    const key = phase === 'day' ? 'crewSpaceDayBg' : 'crewSpaceNightBg';
    if (!scene.textures.exists(key)) {
      needed.set(key, 'assets/Garage/shinonome_crewspace_' + phase + '.png?v=20261005-r349');
    }
  }
  if (!needed.size) { onReady?.();return 0; }
  for (const [key,url] of needed) scene.load.image(key,url);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => onReady?.());
  if (!scene.load.isLoading?.()) scene.load.start();
  return needed.size;
}

export function showFullCrewCelebration(scene, { preview = false } = {}) {
  if (!scene) return null;
  const group = getCelebrationCrew(scene.registry, { preview });
  if (!preview && group.length !== 7) return null;
  // Same size, manga headshots and fanned grey silhouettes as Scene 06.
  // Crucially: NO opaque backdrop or additional crew-space background image.
  // The real Crew Space stays visible beneath the transparent gallery.
  return openSwipePortraitGallery(scene, {
    entries: group.map(member => ({
      characterId: member.characterId,
      regionId: member.regionId,
      rivalContext: false,
    })),
    transparentBackground: true,
    title: 'ONE CREW // SEVEN ROADS',
    ownerKey: '_fullCrewCelebration',
  });
}
