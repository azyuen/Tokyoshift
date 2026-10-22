// R661 — fully playable Arkon chapter replay; chapter-local job and race
// milestones are reset so a completed chapter actually replays its mechanics.
// Never writes into the real
// Arkon Story or Developer save. The live profile is restored on exit, and a
// page reload simply loads the untouched persisted save.
import {getActiveProfileIndex} from '../state/GameState.js?v=20261023-r657';
import {createStoryCheckpoint} from '../story/StoryScript.js?v=20261023-r657';
import {queueSafeSceneStart} from './SafeSceneTransition.js?v=20261017-r573';
import {normaliseCarGarageLocations} from '../data/workshopProgression.js?v=20261023-r662';

const ACTIVE='__arkonStoryPlayableReplay';
const OWNER='__arkonStoryPlayableReplayOwner';
const sessions=new WeakMap();
const scriptId=chapter=>chapter===1?'arkonChapter01Revised':
  chapter===2?'arkonChapter02':chapter===3?'arkonChapter03':
  chapter===4?'arkonChapter04':null;

export function isArkonPlayableReplay(registry){
  return Boolean(registry?.get?.(ACTIVE)) &&
    Number(registry.get(OWNER))===getActiveProfileIndex();
}
export function getArkonPlayableChapters(registry){
  if(registry?.get?.('gameMode')!=='arkonStory')return [];
  const c2=registry.get('arkonStoryChapter01RevisedDone') ||
    registry.get('arkonStoryChapter02Done') ||
    ['arkonChapter02','arkonChapter03'].includes(registry.get('storyDirectorProgress')?.id);
  const c3=registry.get('arkonStoryChapter02Done') ||
    registry.get('storyDirectorProgress')?.id==='arkonChapter03';
  const c4=registry.get('arkonStoryChapter03Done') ||
    ['arkonChapter04'].includes(registry.get('storyDirectorProgress')?.id);
  return [1,...(c2?[2]:[]),...(c3?[3]:[]),...(c4?[4]:[])];
}
export function beginArkonPlayableReplay(scene,chapter) {
  const registry=scene?.registry,slot=getActiveProfileIndex();
  if(!registry?.getAll || !getArkonPlayableChapters(registry).includes(chapter) ||
    sessions.has(registry) || isArkonPlayableReplay(registry) ||
    !scriptId(chapter))return false;
  let original;
  try{original=structuredClone(registry.getAll());}
  catch(error){console.error('[Arkon replay] Cannot snapshot save',error);return false;}
  sessions.set(registry,{original,slot,chapter});
  // Mark replay FIRST so StoryDirector.stop() and any gameplay shutdown saves
  // cannot touch the persisted profile.
  registry.set(ACTIVE,true);
  registry.set(OWNER,slot);
  registry.set('__arkonStoryPlayableReplayChapter',chapter);
  scene.game?.storyDirector?.stop?.();
  registry.set('arkonStoryPhase',chapter===1?'opening':
    chapter===2?'chapter02Opening':chapter===3?'chapter03Jobs':'chapter04Arrival');
  registry.set('arkonStoryChapter',chapter);
  registry.set('arkonStoryChapter01RevisedDone',chapter>1);
  registry.set('arkonStoryChapter02Done',chapter>2);
  registry.set('arkonStoryChapter03Done',chapter>3);
  registry.set('arkonStoryChapter04Done',false);
  registry.set('arkonStoryRwbProject',null);
  registry.set('arkonStoryChapter02FishPaid',false);
  registry.set('arkonStoryChapter02RivalResult',null);
  registry.set('arkonStoryRivalResult',null);
  registry.set('arkonStoryCruiseComplete',false);
  // Rehearse exactly the workshops available in the selected chapter,
  // rather than inheriting a future chapter's HQ or Career unlocks.
  const canal=chapter>=3;
  registry.set('arkonStoryCanalYardUnlocked',canal);
  registry.set('arkonStoryWarehouseUnlocked',false);
  registry.set('garageTier',canal?1:0);
  registry.set('workshopLocationId',canal?'shinonomeCanalYard':'shinonomeWorkshop');
  const owned=registry.get('ownedCarIds')||[];
  const selected=registry.get('selectedCarId');
  const locations={...(registry.get('carGarageLocations')||{})};
  if(selected&&owned.includes(selected))
    locations[selected]=canal?'shinonomeCanalYard':'shinonomeWorkshop';
  registry.set('carGarageLocations',normaliseCarGarageLocations(
    owned,locations,canal?1:0));
  if(chapter===3){
    // Without this reset, any previously completed Chapter 03 skips every
    // ARKON_CUSTOMER_JOB in StoryDirector (done > step.index), showing only
    // manga panels even when the player selects FULL GAMEPLAY.
    // Preserve the original random seed so the same customer models appear.
    // Everything is sandboxed and restored from the original registry image.
    registry.set('arkonStoryCustomerJobsDone',0);
    registry.set('arkonStoryMx5CustomerTuning',null);
    registry.set('arkonStoryMx5RaceResult',null);
    registry.set('arkonStoryMx5Loan',null);
  }
  if(chapter===1){
    registry.set('wins',0);
    registry.set('losses',0);
    registry.set('regionWins',{});
    registry.set('arkonStorySayakaNoticed',false);
    registry.set('arkonStoryAtSchool',false);
    registry.set('arkonStoryLessonCompleted',false);
    registry.set('arkonStorySchoolRevealed',false);
    registry.set('arkonStoryLessonCredits',0);
  }
  registry.set('storyDirectorProgress',createStoryCheckpoint(scriptId(chapter),0,slot));
  const target=chapter===2?'MeetScene':'GarageScene';
  const scheduled=queueSafeSceneStart(scene,target,
    target==='GarageScene'?{workshopLocationId:canal
      ?'shinonomeCanalYard':'shinonomeWorkshop',crewMode:false}:undefined);
  if(!scheduled){
    // Revert immediately if the scene cannot be entered.
    restore(registry,original);
    sessions.delete(registry);
    return false;
  }
  return true;
}
function restore(registry,original) {
  for(const key of Object.keys(registry.getAll())) {
    if(!Object.prototype.hasOwnProperty.call(original,key))registry.remove?.(key);
  }
  for(const [key,value] of Object.entries(original))registry.set(key,value);
  registry.remove?.(ACTIVE);
  registry.remove?.(OWNER);
  registry.remove?.('__arkonStoryPlayableReplayChapter');
}
export function endArkonPlayableReplay(scene,{toOffice=true}={}) {
  const registry=scene?.registry;
  const session=registry&&sessions.get(registry);
  if(!session || session.slot!==getActiveProfileIndex())return false;
  if(scene.game?.storyDirector?.session)scene.game.storyDirector.stop();
  // Restore even if the player completed a race, received job pay or sold
  // something in the replay; none of it should persist beyond this session.
  restore(registry,session.original);
  sessions.delete(registry);
  if(toOffice)queueSafeSceneStart(scene,'GarageScene',{
    crewMode:false,workshopLocationId:registry.get('workshopLocationId'),
    openStoryArchive:true,
  });
  return true;
}
