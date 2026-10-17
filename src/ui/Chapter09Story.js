// R582 — Chapter 09's original zoomed portrait manga dialogues, punctuated
// by two full-screen scenes in the Drag Complex registration room.
import { CHAPTER09_SEQUENCE } from '../data/chapter09.js?v=20261017-r578';
import { getProCircuitAccess } from '../data/proCircuit.js?v=20261017-r575';
import { hasSeenCutscene } from '../data/cutscenes.js?v=20261017-r578';
import { playMangaCutscene, sceneCutsceneActive } from './MangaCutscene.js?v=20261018-r580';
import { playChapter09RegoRoom } from './Chapter09EstablishingShot.js?v=20261018-r582';

export function chapter09ShouldBegin(source){
  return hasSeenCutscene(source,'chapter08Ginza') &&
    getProCircuitAccess(source).unlocked &&
    !hasSeenCutscene(source,'chapter09Welcome');
}

export function startChapter09(scene,{preview=false}={}){
  if(!scene || sceneCutsceneActive(scene) || scene._chapter09Playing)return false;
  if(!preview && (!chapter09ShouldBegin(scene.registry) ||
    scene.activeLocationId!=='tokyoDragComplex'))return false;

  // Preview replays ALL four manga sections with both room beats.
  // A partially played career resumes from its first unfinished chapter,
  // and presents the Mika entrance if that is the next section.
  const sequence=preview?[...CHAPTER09_SEQUENCE]:
    CHAPTER09_SEQUENCE.filter(id=>!hasSeenCutscene(scene.registry,id));
  if(!sequence.length)return false;
  scene._chapter09Playing=true;
  let index=0,mikaRevealed=false,stopped=false;
  const cleanup=()=>{
    if(stopped)return false;
    stopped=true;
    scene._chapter09Playing=false;
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN,abort);
    scene.events.off(Phaser.Scenes.Events.DESTROY,abort);
    return true;
  };
  const abort=()=>{cleanup();};
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,abort);
  scene.events.once(Phaser.Scenes.Events.DESTROY,abort);

  const finish=()=>{
    if(!cleanup())return;
    if(!preview && scene.sys?.isActive?.() &&
      scene.activeLocationId==='tokyoDragComplex')
      scene.renderLocation(scene.activeLocationId);
  };
  const later=fn=>scene.time.delayedCall(130,()=>{
    if(!stopped && scene.sys?.isActive?.())fn();
  });
  const stage=(mode,after)=>{
    const beat=playChapter09RegoRoom(scene,{
      mode,
      onComplete:()=>{if(!stopped)later(after);},
      onCancel:abort,
    });
    if(!beat)abort();
    return Boolean(beat);
  };
  const playDialogue=()=>{
    if(stopped)return;
    const id=sequence[index];
    const done=payload=>{
      if(stopped)return;
      if(payload?.reason==='shutdown'){abort();return;}
      index++;
      later(advance);
    };
    const out=playMangaCutscene(scene,id,{
      preview,
      preloadPagePosesOnly:true,
      onComplete:done,
      onPreviewComplete:done,
      onCancel:abort,
    });
    if(!out?.played){
      if(out?.reason==='seen'){index++;later(advance);}
      else abort();
    }
  };
  const advance=()=>{
    if(stopped)return;
    if(!scene.sys?.isActive?.()){abort();return;}
    if(sceneCutsceneActive(scene))return;
    if(index>=sequence.length){finish();return;}
    // Put away the zoomed manga portraits BEFORE Mika arrives, so her
    // fade-in occurs in the complete registration-room group shot.
    if(sequence[index]==='chapter09Visitor'&&!mikaRevealed){
      mikaRevealed=true;
      stage('mika',playDialogue);
      return;
    }
    playDialogue();
  };
  // The opening room tableau starts the story; after CONTINUE we restore
  // the original Chapter 09 manga style for the Old Guard and briefing.
  if(sequence[0]==='chapter09OldGuard')return stage('opening',advance);
  advance();
  return true;
}
