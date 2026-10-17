// R580 — one uninterrupted registration-room scene across all four Chapter 09
// sections. Career, Arkon Den and Story Archive all use the same presentation.
import { getProCircuitAccess } from '../data/proCircuit.js?v=20261017-r575';
import { hasSeenCutscene } from '../data/cutscenes.js?v=20261017-r578';
import { sceneCutsceneActive } from './MangaCutscene.js?v=20261018-r580';
import { playChapter09RegoRoom } from './Chapter09EstablishingShot.js?v=20261018-r580';

export function chapter09ShouldBegin(source){
  return hasSeenCutscene(source,'chapter08Ginza') &&
    getProCircuitAccess(source).unlocked &&
    !hasSeenCutscene(source,'chapter09Welcome');
}

export function startChapter09(scene,{preview=false}={}){
  if(!scene || sceneCutsceneActive(scene) || scene._chapter09Playing)return false;
  if(!preview && (!chapter09ShouldBegin(scene.registry) ||
    scene.activeLocationId!=='tokyoDragComplex'))return false;
  scene._chapter09Playing=true;
  const intro=playChapter09RegoRoom(scene,{
    preview,
    onComplete:()=>{
      scene._chapter09Playing=false;
      if(!preview && scene.sys?.isActive?.() &&
        scene.activeLocationId==='tokyoDragComplex')
        scene.renderLocation(scene.activeLocationId);
    },
    onCancel:()=>{scene._chapter09Playing=false;},
  });
  if(!intro){scene._chapter09Playing=false;return false;}
  return true;
}
