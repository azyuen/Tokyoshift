// R577 — Chapter 09 opens at the real Drag Complex. A separate preview
// uses the same manga renderer without changing career saves.
import { CHAPTER09_SEQUENCE } from '../data/chapter09.js?v=20261017-r577';
import { getProCircuitAccess } from '../data/proCircuit.js?v=20261017-r575';
import { hasSeenCutscene } from '../data/cutscenes.js?v=20261017-r577';
import { playMangaCutscene, sceneCutsceneActive } from './MangaCutscene.js?v=20261017-r577';

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
  let index=0;
  const advance=()=>{
    if(!scene?.sys?.isActive?.()){
      scene._chapter09Playing=false;
      return;
    }
    if(sceneCutsceneActive(scene))return;
    const id=preview?CHAPTER09_SEQUENCE[index++]:
      CHAPTER09_SEQUENCE.find(key=>!hasSeenCutscene(scene.registry,key));
    if(!id){
      scene._chapter09Playing=false;
      if(!preview && scene.activeLocationId==='tokyoDragComplex')
        scene.renderLocation(scene.activeLocationId);
      return;
    }
    const next=()=>scene.time.delayedCall(130,advance);
    const out=playMangaCutscene(scene,id,{
      preview,preloadPagePosesOnly:true,
      onComplete:next,onPreviewComplete:next,
      onCancel:()=>{scene._chapter09Playing=false;},
    });
    if(!out?.played) {
      if(out?.reason==='seen')next();
      else scene._chapter09Playing=false;
    }
  };
  advance();
  return true;
}
