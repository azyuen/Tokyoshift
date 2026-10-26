// First-season Ginza sponsorship: a one-time story interlude, separate from
// Open Circuit and the repeatable eight-round Pro Season economy.
// Every checkpoint is stored in cutscenesSeen (which already survives saves).
import { cars } from '../data/cars.js?v=20261026-r687';
import { hasSeenCutscene, markCutsceneSeen } from '../data/cutscenes.js?v=20261024-r680';
import { saveSessionState } from '../state/GameState.js?v=20261023-r652';
import { playMangaCutscene, sceneCutsceneActive } from './MangaCutscene.js?v=20261025-r683';

const strip = 'tokyoDragComplex';

function firstActiveSeason(scene) {
  const c = scene?.registry?.get('proCircuit');
  return scene?.registry?.get('gameMode') !== 'arkonStory' &&
    c?.season === 1 && c?.seasonStatus === 'ACTIVE' &&
    hasSeenCutscene(scene.registry, 'chapter09Welcome');
}

function selectOwnedCar(registry) {
  const owned = registry.get('ownedCarIds') || [];
  const selected = registry.get('selectedCarId');
  return owned.includes(selected) && cars[selected] && !cars[selected].crewLoan
    ? selected
    : owned.find(id => cars[id] && !cars[id].crewLoan) || null;
}

export function startProSponsorRace(scene) {
  if (!scene?.sys?.isActive?.() || sceneCutsceneActive(scene) ||
      !firstActiveSeason(scene) ||
      hasSeenCutscene(scene.registry, 'proSponsorRaceComplete')) return false;
  const registry = scene.registry;
  const playerCarId = selectOwnedCar(registry);
  if (!playerCarId || !cars.libertyWalk240z) {
    scene.proError = 'AN OWNED CAR IS REQUIRED FOR THE SPONSOR EXHIBITION';
    scene.renderLocation?.(strip);
    return false;
  }

  // Flag first so reloading after a scene interruption can offer the same
  // no-stakes race again. It never changes the calendar, cars or race payouts.
  markCutsceneSeen(registry, 'proSponsorRacePending');
  registry.set('selectedCarId', playerCarId);
  registry.set('crewSpaceActive', false);
  registry.set('selectedRacePlayerCharacterId', null);
  registry.set('selectedOpponentCarId', 'libertyWalk240z');
  registry.set('selectedOpponentCharacterId', 'arkonDen');
  registry.set('selectedOpponentEncounterRating', 4);
  registry.set('selectedOpponentEncounterAi', null);
  registry.set('selectedOpponentBuildState', null);
  registry.set('selectedOpponentBuildRating', null);
  registry.set('selectedOpponentBuildArchetype', null);
  registry.set('selectedRaceCategory', 'PRO_SPONSOR');
  registry.set('selectedRaceType', 'Standing Race');
  registry.set('selectedRaceDistanceM', 402.336);
  registry.set('selectedRaceDeal', 'PRO_SPONSOR');
  registry.set('selectedRaceStake', 0);
  registry.set('selectedRaceSpecialChallenge', false);
  registry.set('selectedRaceMeetOffer', null);
  registry.set('raceDistrict', 'OSHIAGE');
  registry.set('raceLocationLabel', 'TOKYO DRAG COMPLEX // SPONSOR EXHIBITION');
  registry.set('raceReturnScene', 'CentralTokyoScene');
  registry.set('raceTimeOfDay', 'day');
  saveSessionState(registry);
  scene.scene.start('RaceScene');
  return true;
}

// Called after the first registration commit and when returning to the strip.
// This recovers gracefully if the app was closed mid-dialogue/mid-race.
export function maybePlayProSponsorStory(scene) {
  if (!scene?.sys?.isActive?.() || scene.activeLocationId !== strip ||
      sceneCutsceneActive(scene) || !firstActiveSeason(scene)) return false;
  const source = scene.registry;
  if (hasSeenCutscene(source, 'proSponsorEpilogue')) return false;

  if (hasSeenCutscene(source, 'proSponsorRaceComplete')) {
    const result = playMangaCutscene(scene, 'proSponsorEpilogue', {
      preloadPagePosesOnly: true,
      onComplete: () => {
        if (scene.sys?.isActive?.()) scene.renderLocation(strip);
      },
    });
    return Boolean(result?.played);
  }

  if (hasSeenCutscene(source, 'proSponsorIntroduction')) {
    return startProSponsorRace(scene);
  }

  const result = playMangaCutscene(scene, 'proSponsorIntroduction', {
    preloadPagePosesOnly: true,
    onComplete: () => startProSponsorRace(scene),
  });
  return Boolean(result?.played);
}
