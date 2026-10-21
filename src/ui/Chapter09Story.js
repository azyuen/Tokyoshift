// R583 — The registration room persists under the ORIGINAL manga renderer.
// All four dialogue sections and both establishing beats share one room stage.
import { CHAPTER09_SEQUENCE, chapter09TeamPortraitManga } from '../data/chapter09.js?v=20261018-r586';
import { getProCircuitAccess } from '../data/proCircuit.js?v=20261017-r575';
import { hasSeenCutscene } from '../data/cutscenes.js?v=20261017-r578';
import { playMangaCutscene, sceneCutsceneActive } from './MangaCutscene.js?v=20261018-r586';
import { playChapter09RegoRoom } from './Chapter09EstablishingShot.js?v=20261022-r635';

export function chapter09ShouldBegin(source){
  return hasSeenCutscene(source,'chapter08Ginza') &&
    getProCircuitAccess(source).unlocked &&
    !hasSeenCutscene(source,'chapter09Welcome');
}

export function startChapter09(scene,{preview=false}={}){
  if(!scene || sceneCutsceneActive(scene) || scene._chapter09Playing)return false;
  if(!preview && (!chapter09ShouldBegin(scene.registry) ||
    scene.activeLocationId!=='tokyoDragComplex'))return false;

  const sequence=preview?[...CHAPTER09_SEQUENCE]:
    CHAPTER09_SEQUENCE.filter(id=>!hasSeenCutscene(scene.registry,id));
  if(!sequence.length)return false;

  scene._chapter09Playing=true;
  let index=0,mikaRevealed=false,stopped=false,stage=null;
  const cleanup=()=>{
    if(stopped)return false;
    stopped=true;
    scene._chapter09Playing=false;
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN,abort);
    scene.events.off(Phaser.Scenes.Events.DESTROY,abort);
    return true;
  };
  const abort=()=>{
    if(!cleanup())return;
    // A cancelled manga must not leave the registration room over the game.
    stage?.destroy?.();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,abort);
  scene.events.once(Phaser.Scenes.Events.DESTROY,abort);

  const finish=()=>{
    if(stopped)return;
    stage?.finish?.(()=>{
      if(!cleanup())return;
      if(!preview && scene.sys?.isActive?.() &&
        scene.activeLocationId==='tokyoDragComplex')
        scene.renderLocation(scene.activeLocationId);
    });
  };
  const later=fn=>scene.time.delayedCall(130,()=>{
    if(!stopped && scene.sys?.isActive?.())fn();
  });
  const playDialogue=()=>{
    if(stopped||!stage?.active||stage.phase!=='background')return;
    const id=sequence[index];
    const done=payload=>{
      if(stopped)return;
      if(payload?.reason==='shutdown'){abort();return;}
      if(id==='chapter09Visitor')stage?.hideMika?.();
      index++;
      later(advance);
    };
    // Stage is kept UNDER the close-up manga. Never release it between pages
    // or the Warehouse HQ scene will appear behind the portraits.
    const definition=chapter09TeamPortraitManga(id);
    const out=playMangaCutscene(scene,definition,{
      preview,preloadPagePosesOnly:true,
      chapter09RoomBackdrop:true,
      onComplete:done,onPreviewComplete:done,onCancel:abort,
    });
    if(!out?.played){
      if(out?.reason==='seen'){index++;later(advance);}
      else abort();
    }
  };
  const advance=()=>{
    if(stopped)return;
    if(!scene.sys?.isActive?.()){abort();return;}
    if(sceneCutsceneActive(scene,{ignoreChapter09Stage:true}))return;
    if(index>=sequence.length){finish();return;}
    if(sequence[index]==='chapter09Visitor'&&!mikaRevealed){
      mikaRevealed=true;
      if(!stage?.showMika?.(()=>later(playDialogue)))abort();
      return;
    }
    playDialogue();
  };

  // Only ONE room renderer for the whole chapter, including previews from
  // Arkon Den's D) SCENES and the player's Story Archive (GarageScene).
  stage=playChapter09RegoRoom(scene,{
    onContinue:()=>later(advance),
    onCancel:abort,
  });
  if(!stage){abort();return false;}
  return true;
}
