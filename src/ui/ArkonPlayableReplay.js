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
  chapter===4?'arkonChapter04':chapter===5?'arkonChapter05':
  chapter===6?'arkonChapter06':chapter===7?'arkonChapter07':null;

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
  const c5=registry.get('arkonStoryChapter04Done') ||
    registry.get('storyDirectorProgress')?.id==='arkonChapter05';
  const c6=registry.get('arkonStoryChapter05Done')||
    registry.get('storyDirectorProgress')?.id==='arkonChapter06'||
    registry.get('arkonStoryChapter06Done');
  const c7=registry.get('arkonStoryChapter06Done') ||
    registry.get('storyDirectorProgress')?.id==='arkonChapter07' ||
    registry.get('arkonStoryChapter07Done');
  return [1,...(c2?[2]:[]),...(c3?[3]:[]),...(c4?[4]:[]),...(c5?[5]:[]),...(c6?[6]:[]),...(c7?[7]:[])];
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
    chapter===2?'chapter02Opening':chapter===3?'chapter03Jobs':
    chapter===4?'chapter04Arrival':chapter===5?'chapter05Breakthrough':
    chapter===6?'chapter06Commissions':'chapter07Business');
  registry.set('arkonStoryChapter',chapter);
  registry.set('arkonStoryChapter01RevisedDone',chapter>1);
  registry.set('arkonStoryChapter02Done',chapter>2);
  registry.set('arkonStoryChapter03Done',chapter>3);
  registry.set('arkonStoryChapter04Done',chapter>=5);
  registry.set('arkonStoryChapter04Work',null);
  registry.set('arkonStoryChapter05Done',chapter>=6);
  registry.set('arkonStoryChapter06Done',chapter>=7);
  registry.set('arkonStoryChapter07Done',false);
  registry.set('arkonStoryChapter07Work',null);
  registry.set('arkonStoryChapter07Race',null);
  registry.set('arkonStoryChapter07RaceResult',null);
  registry.set('arkonStoryChapter07Solo',null);
  registry.set('arkonStoryChapter07SoloFinished',false);
  // Rebuild the ORIGINAL 240Z inside the temporary replay if an authentic
  // Chapter 07 run already converted it. Restore the save verbatim on exit.
  if((registry.get('ownedCarIds')||[]).includes('arkonLibertyWalk240z')){
    const owned=(registry.get('ownedCarIds')||[]).map(id=>
      id==='arkonLibertyWalk240z'?'240z':id);
    const states={...(registry.get('carStates')||{})};
    states['240z']={...(states.arkonLibertyWalk240z||{})};
    delete states.arkonLibertyWalk240z;
    const sites={...(registry.get('carGarageLocations')||{})};
    sites['240z']=sites.arkonLibertyWalk240z||'shinonomeWarehouseStrip';
    delete sites.arkonLibertyWalk240z;
    registry.set('ownedCarIds',owned);
    registry.set('carStates',states);
    registry.set('carGarageLocations',sites);
    registry.set('selectedCarId','240z');
    registry.set('preferredCarId','240z');
  }
  if(chapter===7){
    const states={...(registry.get('carStates')||{})};
    // The chapter's full-play replay performs paid L2/L3 upgrades for real.
    // Only temporary replay state is reset; persisted ownership is unchanged.
    const atOne={engine:1,intake:1,ecu:1,turbo:1,intercooler:1,
      clutch:1,gearbox:1,differential:1,suspension:1,tyres:1,
      weightReduction:1,headers:1,exhaust:1,muffler:1,nosKit:1,nitrousShot:1};
    states['240z']={...(states['240z']||{}),tuning:{...atOne},
      engineTuning:{...atOne},drivetrainTuning:{...atOne},
      chassisTuning:{...atOne},exhaustNosTuning:{...atOne}};
    registry.set('carStates',states);
  }
  registry.set('arkonStoryChapter06Accounts',null);
  registry.set('arkonStoryChapter06Cruise',null);
  registry.set('arkonStoryChapter06CruiseFinished',false);
  registry.set('arkonStoryChapter05JobsDone',0);
  registry.set('arkonStoryChapter05RaceResult',null);
  registry.set('arkonStoryChapter05Results',{});
  registry.set('arkonStoryChapter05Loan',null);
  if(chapter<5)registry.set('arkonStoryRwbProject',null);
  if(chapter>=5){
    // Completed Chapter 06 saves no longer own the gifted Porsche.
    // Restore an UNREPAIRED project only inside this temporary replay.
    const raw=registry.get('arkonStoryRwbProject')||{};
    registry.set('arkonStoryRwbProject',{
      ...raw,acquired:true,gifted:false,owner:'arkonDen',
      carId:'rwbStellaPorsche',roadworthy:false,restorationStage:0,
      independentInspection:false,certification:null,outstandingFinance:3000000,
      status:'structural-and-engine-restoration-required'
    });
    registry.set('ownedCarIds',[...new Set([
      ...(registry.get('ownedCarIds')||[]),'rwbStellaPorsche'])]);
    registry.set('carStates',{...(registry.get('carStates')||{}),
      rwbStellaPorsche:{immutable:true,tuningLocked:true,storedProject:true,
        roadworthy:false,collector:true}});
    registry.set('carGarageLocations',{...(registry.get('carGarageLocations')||{}),
      rwbStellaPorsche:'shinonomeCanalYard'});
  }
  // Earlier chapters and Chapter 04's opening must not inherit the later
  // acquired project. Sandbox it away and restore it verbatim on exit.
  const originalCars=[...(registry.get('ownedCarIds')||[])];
  if(chapter<5 && originalCars.includes('rwbStellaPorsche')){
    registry.set('ownedCarIds',originalCars.filter(id=>id!=='rwbStellaPorsche'));
    const states={...(registry.get('carStates')||{})};delete states.rwbStellaPorsche;
    registry.set('carStates',states);
    const sites={...(registry.get('carGarageLocations')||{})};delete sites.rwbStellaPorsche;
    registry.set('carGarageLocations',sites);
    if(registry.get('selectedCarId')==='rwbStellaPorsche')
      registry.set('selectedCarId',originalCars.find(id=>id!=='rwbStellaPorsche')||null);
  }
  registry.set('arkonStoryChapter02FishPaid',false);
  registry.set('arkonStoryChapter02RivalResult',null);
  registry.set('arkonStoryRivalResult',null);
  registry.set('arkonStoryCruiseComplete',false);
  // Rehearse exactly the workshops available in the selected chapter,
  // rather than inheriting a future chapter's HQ or Career unlocks.
  const canal=chapter>=3;
  registry.set('arkonStoryCanalYardUnlocked',canal);
  registry.set('arkonStoryWarehouseUnlocked',chapter>=7);
  registry.set('garageTier',chapter>=7?2:canal?1:0);
  registry.set('workshopLocationId',chapter>=7?'shinonomeWarehouseStrip':
    canal?'shinonomeCanalYard':'shinonomeWorkshop');
  const owned=registry.get('ownedCarIds')||[];
  const selected=registry.get('selectedCarId');
  const locations={...(registry.get('carGarageLocations')||{})};
  if(selected&&owned.includes(selected) && chapter!==4 && selected!=='rwbStellaPorsche')
    locations[selected]=chapter>=7?'shinonomeWarehouseStrip':
      canal?'shinonomeCanalYard':'shinonomeWorkshop';
  registry.set('carGarageLocations',normaliseCarGarageLocations(
    owned,locations,chapter>=7?2:canal?1:0));
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
    target==='GarageScene'?{workshopLocationId:chapter>=7?'shinonomeWarehouseStrip':
      canal?'shinonomeCanalYard':'shinonomeWorkshop',crewMode:false}:undefined);
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
