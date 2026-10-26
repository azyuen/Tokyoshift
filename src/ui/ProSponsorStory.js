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
  // An old save halfway through season one must not suddenly receive a
  // first-time signing scene. Resume freely once an R692 chapter has begun.
  const signingStarted = hasSeenCutscene(scene.registry, 'proSponsorIntroduction') ||
    hasSeenCutscene(scene.registry, 'proSponsorRacePending') ||
    hasSeenCutscene(scene.registry, 'proSponsorRaceComplete');
  const notProgressed = Number(c?.calendar?.round || 0) === 0 &&
    !(c?.calendar?.history?.length);
  return scene?.registry?.get('gameMode') !== 'arkonStory' &&
    c?.season === 1 && c?.seasonStatus === 'ACTIVE' &&
    (signingStarted || notProgressed) &&
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
  if (!playerCarId || !cars.arkonLibertyWalk240z) {
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
  registry.set('selectedOpponentCarId', 'arkonLibertyWalk240z');
  registry.set('selectedOpponentCharacterId', 'arkonDen');
  registry.set('selectedOpponentEncounterRating', 5);
  registry.set('selectedOpponentEncounterAi', null);
  // Reuse Aruken's actual Story Mode 240Z body, with a legal full shop tune.
  // His race obeys the same physics and tuning rules as the player's car.
  registry.set('selectedOpponentBuildState', {
    tuning: {engine:3,intake:3,ecu:3,turbo:3,intercooler:3},
    drivetrainTuning: {clutch:3,gearbox:3,differential:3,suspension:3},
    chassisTuning: {tyres:3,weightReduction:3},
    exhaustNosTuning: {headers:3,exhaust:3,muffler:3,nosKit:2,nitrousShot:2},
    nosInstalled: true, buildRating: 5,
  });
  registry.set('selectedOpponentBuildRating', null);
  registry.set('selectedOpponentBuildArchetype', null);
  registry.set('selectedRaceCategory', 'PRO_SPONSOR');
  registry.set('selectedRaceType', 'Standing Start');
  registry.set('selectedRaceDistanceM', 402.336);
  registry.set('selectedRaceDeal', 'PRO_SPONSOR');
  registry.set('selectedRaceStake', 0);
  registry.set('selectedRaceSpecialChallenge', false);
  registry.set('selectedRaceMeetOffer', null);
  registry.set('raceDistrict', 'OSHIAGE');
  registry.set('raceLocationLabel', 'TOKYO EXPRESSWAY // SPONSOR EXHIBITION');
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
