// R570: Chapter 01–07 archival playback across authentic workshop/crew rooms.
// This is an in-memory rehearsal, not a separate save or a progress reset.
import { getActiveProfileIndex } from '../state/GameState.js';
import { cars } from '../data/cars.js';
import { queueSafeSceneStart } from './SafeSceneTransition.js';
import { getStoryChapter, isStoryChapterComplete } from '../data/storyChapters.js';
const sessions=new WeakMap();
const ACTIVE='__storyArchiveSceneReplay', OWNER='__storyArchiveOwnerSlot';
export const isStoryArchiveSceneReplay=registry=>Boolean(registry?.get?.(ACTIVE)) &&
  Number(registry.get(OWNER))===getActiveProfileIndex();
export function beginStoryArchiveSceneReplay(scene,chapterId,{skipMagazine=false}={}) {
  const registry=scene?.registry;
  if(!registry?.getAll || !getStoryChapter(chapterId) || chapterId==='chapter08' ||
      sessions.has(registry) || isStoryArchiveSceneReplay(registry) ||
      (!registry.get('devMode') && !isStoryChapterComplete(registry,chapterId))) return false;
  let values;
  try {values=structuredClone(registry.getAll());}
  catch(error){console.warn('[TOKYO SHIFT] Story replay snapshot failed',error);return false;}
  const workshop = chapterId==='chapter04'?'shinonomeCanalYard':
    ['chapter05','chapter06','chapter07'].includes(chapterId)
      ? 'shinonomeWarehouseStrip'
      : chapterId==='chapter01'?'shinonomeWorkshop'
      :(registry.get('workshopLocationId')||'shinonomeWorkshop');
  const tier=workshop==='shinonomeWarehouseStrip'?2:
    workshop==='shinonomeCanalYard'?1:0;
  const crew=chapterId==='chapter07';
  sessions.set(registry,{values,slot:getActiveProfileIndex()});
  registry.set(ACTIVE,true);
  registry.set(OWNER,getActiveProfileIndex());
  registry.set('__storyArchiveSkipMagazine',Boolean(skipMagazine));
  registry.set('garageTier',Math.max(tier,Number(registry.get('garageTier')||0)));
  registry.set('workshopLocationId',workshop);
  registry.set('crewSpaceActive',crew);
  if (!crew) {
    const owned=(registry.get('ownedCarIds')||[]).filter(id=>cars[id]&&!cars[id].crewLoan);
    const selected=owned.includes(registry.get('selectedCarId'))
      ? registry.get('selectedCarId'):owned[0];
    if(selected){
      registry.set('selectedCarId',selected);
      registry.set('preferredCarId',selected);
      registry.set('carGarageLocations',{
        ...(registry.get('carGarageLocations')||{}),[selected]:workshop,
      });
    }
  }
  // Chapter 01's full first-car magazine is interactive only in rehearsal.
  if(chapterId==='chapter01')registry.set('openingChapter',null);
  // Scene 07 belongs to its own real CrewSpaceScene. Replaying it through
  // GarageScene crewMode creates a second, cropped presentation and can stall
  // during the same-scene Warehouse/Crew lifecycle.
  queueSafeSceneStart(scene,crew?'CrewSpaceScene':'GarageScene',{
    crewMode:crew,workshopLocationId:workshop,storyArchiveChapter:chapterId,
  });
  return true;
}
export function endStoryArchiveSceneReplay(scene) {
  const registry=scene?.registry;
  if(!registry)return false;
  const session=sessions.get(registry);
  if(!session || session.slot!==getActiveProfileIndex())return false;
  sessions.delete(registry);
  const current=registry.getAll();
  for(const key of Object.keys(current)){
    if(!(key in session.values))registry.remove?.(key);
  }
  for(const [key,value] of Object.entries(session.values))registry.set(key,value);
  registry.remove?.(ACTIVE);registry.remove?.(OWNER);
  // Player returns to the Office's chapter list without saving replay state.
  queueSafeSceneStart(scene,'GarageScene',{crewMode:false,openStoryArchive:true});
  return true;
}
