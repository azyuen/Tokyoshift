// R569 — Full, interactive Chapter 08 developer rehearsal.
// Runs through real Garage -> phone calls -> map -> Race -> Ginza, without
// touching an Arkon Den profile's saved career. This intentionally is NOT
// a synthetic "all chapters complete" save or a separate racing engine.
import { cars } from '../data/cars.js?v=20261026-r687';
import { queueSafeSceneStart } from './SafeSceneTransition.js?v=20261017-r573';
import { getActiveProfileIndex } from '../state/GameState.js?v=20261017-r570';
import { isStoryChapterComplete } from '../data/storyChapters.js?v=20261027-r693';

const SESSION_KEY = '__chapter08DevReplay';
const OWNER_KEY = '__chapter08ReplayProfileSlot';
const sessions = new WeakMap();

export const isChapter08DevReplay = source =>
  Boolean(source?.get?.(SESSION_KEY) &&
    (source?.get?.('devMode') || source?.get?.('__storyArchiveReplay'))) &&
  Number(source.get(OWNER_KEY)) === getActiveProfileIndex();

function copyValues(values) {
  // Phaser's registry is a DataManager holding plain game-state objects.
  // If a third-party plugin inserts an uncloneable object, fail closed before
  // mutating the profile rather than pretending its state was snapshotted.
  return structuredClone(values);
}

export function startInteractiveChapter08Replay(scene, {allowPlayer=false,returnToOffice=false,skipRace=false}={}) {
  const registry = scene?.registry;
  if (!registry?.getAll ||
      (!registry.get('devMode') &&
        !(allowPlayer && isStoryChapterComplete(registry,'chapter08'))) ||
      sessions.has(registry) || isChapter08DevReplay(registry)) return false;
  const selected = registry.get('selectedCarId');
  const owned = (registry.get('ownedCarIds') || [])
    .filter(id => cars[id] && !cars[id].crewLoan);
  const carId = (owned.includes(selected) && selected) || owned[0];
  if (!carId) return false;

  let values;
  try { values = copyValues(registry.getAll()); }
  catch (error) {
    console.warn('[Tokyo SHIFT] dev rehearsal snapshot unavailable', error);
    return false;
  }
  const key = scene.sys?.settings?.key || 'GarageScene';
  const originalLocation = registry.get('centralTokyoLocation') || 'tokyoAutoMarket';
  sessions.set(registry, {
    values, slot: getActiveProfileIndex(), sceneKey: key,
    centralTokyoLocation: originalLocation,
    crewMode: Boolean(registry.get('crewSpaceActive')),
    garageTier: Number(registry.get('garageTier') || 0),
    returnToOffice:Boolean(returnToOffice),
  });
  registry.set(OWNER_KEY, getActiveProfileIndex());
  registry.set(SESSION_KEY, true);
  if(allowPlayer)registry.set('__storyArchiveReplay',true);
  if(skipRace)registry.set('__chapter08ReplaySkipRace',true);
  registry.set('workshopLocationId', 'shinonomeWarehouseStrip');
  registry.set('garageTier', Math.max(2, Number(registry.get('garageTier') || 0)));
  registry.set('crewSpaceActive', false);
  registry.set('selectedCarId', carId);
  const locations = { ...(registry.get('carGarageLocations') || {}) };
  locations[carId] = 'shinonomeWarehouseStrip';
  registry.set('carGarageLocations', locations);

  // Loading the real Warehouse means the scene's backgrounds and controls are
  // identical to career mode, not a manga pasted over the developer's Meet.
  queueSafeSceneStart(scene,'GarageScene', {
    workshopLocationId: 'shinonomeWarehouseStrip', crewMode: false,
  });
  return true;
}

export function finishInteractiveChapter08Replay(scene) {
  const registry = scene?.registry;
  if (!registry) return false;
  const session = sessions.get(registry);
  if (!session || session.slot !== getActiveProfileIndex()) {
    // A reload loses the in-memory rehearsal on purpose. The on-disk career
    // remains untouched; never apply a stale snapshot to another driver slot.
    registry.remove?.(SESSION_KEY);
    registry.remove?.(OWNER_KEY);
    registry.remove?.('__storyArchiveReplay');
    registry.remove?.('__chapter08ReplaySkipRace');
    sessions.delete(registry);
    return false;
  }

  sessions.delete(registry);
  const all = registry.getAll();
  // Remove temporary race fields absent from the original session.
  for (const key of Object.keys(all)) {
    if (!(key in session.values) && key !== SESSION_KEY && key !== OWNER_KEY) {
      registry.remove?.(key);
    }
  }
  for (const [key, value] of Object.entries(session.values)) {
    registry.set(key, value);
  }
  // The sandbox keys were absent from the original session.
  registry.remove?.(SESSION_KEY);
  registry.remove?.(OWNER_KEY);
  registry.remove?.('__storyArchiveReplay');
  registry.remove?.('__chapter08ReplaySkipRace');

  // Do NOT save the restored snapshot: the original disk save was never
  // modified by this rehearsal. Return to the actual scene it started in.
  if(session.returnToOffice){
    queueSafeSceneStart(scene,'GarageScene',{crewMode:false,openStoryArchive:true});
    return true;
  }
  const target = session.sceneKey === 'RaceScene'
    ? 'GarageScene' : session.sceneKey;
  if (target === 'CentralTokyoScene') {
    queueSafeSceneStart(scene,'CentralTokyoScene', {locationId:session.centralTokyoLocation});
  } else if (target === 'GarageScene') {
    queueSafeSceneStart(scene,'GarageScene', {crewMode:session.crewMode});
  } else {
    queueSafeSceneStart(scene,target);
  }
  return true;
}
