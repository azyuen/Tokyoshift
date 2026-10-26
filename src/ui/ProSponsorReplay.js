// R693 — Fully playable, non-persistent Chapter 09 Sponsor Replay.
// A dev's old Pro Season does not prevent playing the actual invitation,
// Aruken reveal, live two-car 240Z race or post-race send-off.
// All registry values are restored verbatim after the run.
import { getActiveProfileIndex } from '../state/GameState.js?v=20261027-r692';
import { cars } from '../data/cars.js?v=20261026-r687';
import { createDefaultProCircuitState } from '../data/proCircuit.js?v=20261017-r575';
import { startProfessionalSeason } from '../data/proSeason.js?v=20261021-r628';
import { queueSafeSceneStart } from './SafeSceneTransition.js?v=20261017-r573';
import { startChapter09 } from './Chapter09Story.js?v=20261027-r693';

const ACTIVE='__proSponsorPlayableReplay';
const OWNER='__proSponsorReplayOwnerSlot';
const PHASE='__proSponsorReplayPhase';
const sessions=new WeakMap();
const seenWithoutSponsor = ids => (ids||[]).filter(id=>
  !['proSponsorIntroduction','proSponsorRacePending','proSponsorRaceComplete',
    'proSponsorEpilogue'].includes(id));

export function isProSponsorPlayableReplay(registry) {
  return registry?.get?.(ACTIVE) === true &&
    Number(registry.get(OWNER)) === getActiveProfileIndex();
}

export function beginProSponsorPlayableReplay(scene,{returnToArchive=false}={}) {
  const registry=scene?.registry;
  if(!registry?.getAll || sessions.has(registry) ||
     registry.get('gameMode')==='arkonStory' ||
     isProSponsorPlayableReplay(registry))return false;
  const owned=(registry.get('ownedCarIds')||[])
    .filter(id=>cars[id]&&!cars[id].crewLoan);
  if(!owned.length)return false;
  let values;
  try{values=structuredClone(registry.getAll());}
  catch(e){console.warn('[Tokyo SHIFT] Cannot snapshot Chapter 09 replay',e);return false;}
  const car=owned.includes(registry.get('selectedCarId'))
    ?registry.get('selectedCarId'):owned[0];
  const circuit=startProfessionalSeason(createDefaultProCircuitState());
  if(!circuit.circuit)return false;
  const sceneKey=scene.sys?.settings?.key||'GarageScene';
  sessions.set(registry,{
    values,slot:getActiveProfileIndex(),
    sceneKey,returnToArchive,
    centralLocation:registry.get('centralTokyoLocation')||'tokyoDragComplex',
  });
  registry.set(OWNER,getActiveProfileIndex());
  registry.set(ACTIVE,true);
  registry.set(PHASE,'welcome');
  registry.set('selectedCarId',car);
  registry.set('crewSpaceActive',false);
  // The chapter first shows the canonical earlier professional briefing,
  // followed by a fresh one-time signing even on an old developer profile.
  registry.set('cutscenesSeen',[...new Set([
    ...seenWithoutSponsor(registry.get('cutscenesSeen')),
    'chapter08Ginza','chapter09Welcome','ginzaInvitation',
    'proCircuitStrategistReveal',
  ])]);
  registry.set('proCircuit',circuit.circuit);
  registry.set('centralTokyoUnlocks',{
    ...(registry.get('centralTokyoUnlocks')||{}),
    ginza:true,dragComplex:true,
  });
  // A developer portrait cannot race against itself. Swap ONLY in sandbox.
  if(registry.get('playerCharacterId')==='arkonDen')
    registry.set('playerCharacterId','renMizuno');
  queueSafeSceneStart(scene,'CentralTokyoScene',{locationId:'tokyoDragComplex'});
  return true;
}

export function startProSponsorReplayWelcome(scene,afterWelcome) {
  if(!isProSponsorPlayableReplay(scene?.registry) ||
    scene.registry.get(PHASE)!=='welcome' ||
    scene.activeLocationId!=='tokyoDragComplex')return false;
  // Set phase now to avoid a second start from a synchronous redraw.
  scene.registry.set(PHASE,'welcoming');
  const result=startChapter09(scene,{preview:true,onPreviewComplete:()=>{
    if(!isProSponsorPlayableReplay(scene.registry))return;
    scene.registry.set(PHASE,'sponsor');
    scene.time.delayedCall(160,()=> {
      if(scene.sys?.isActive?.())afterWelcome?.();
    });
  }});
  if(!result)scene.registry.set(PHASE,'welcome');
  return Boolean(result);
}

export function finishProSponsorPlayableReplay(scene) {
  const registry=scene?.registry;
  const session=registry&&sessions.get(registry);
  if(!session || session.slot!==getActiveProfileIndex())return false;
  sessions.delete(registry);
  for(const key of Object.keys(registry.getAll()))
    if(!(key in session.values))registry.remove?.(key);
  for(const [key,value] of Object.entries(session.values))
    registry.set(key,value);
  registry.remove?.(ACTIVE);registry.remove?.(OWNER);registry.remove?.(PHASE);
  if(session.returnToArchive){
    queueSafeSceneStart(scene,'GarageScene',{crewMode:false,openStoryArchive:true});
  } else {
    const key=['RaceScene','FourLaneTestScene'].includes(session.sceneKey)
      ?'GarageScene':session.sceneKey;
    const data=key==='CentralTokyoScene'?{locationId:session.centralLocation}
      :key==='GarageScene'?{crewMode:false}:undefined;
    queueSafeSceneStart(scene,key,data);
  }
  return true;
}

// Distinct from the race's cancel button: explicitly abandons a sandbox,
// restores the original Pro Season and returns to the Archive / developer UI.
export function addProSponsorReplayExit(scene,x=1430,y=52) {
  if(!isProSponsorPlayableReplay(scene?.registry))return null;
  const depth=1900;
  const plate=scene.add.rectangle(x,y,210,40,0x261826,.98)
    .setStrokeStyle(2,0xff91b8).setScrollFactor(0)
    .setDepth(depth).setInteractive({useHandCursor:true});
  const caption=scene.add.text(x,y,'EXIT REPLAY',{
    fontFamily:'"Silkscreen",monospace',fontSize:'9px',color:'#ffffff',
  }).setOrigin(.5).setDepth(depth+1).setScrollFactor(0);
  plate.on('pointerdown',()=>finishProSponsorPlayableReplay(scene));
  return {plate,caption};
}
