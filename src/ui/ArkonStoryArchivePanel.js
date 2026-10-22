// R649 — Arkon's own Story archive (the normal Office Story Archive is Career).
// Recount previews NEVER save money, cars, results or unlocks. Restart is opt-in.
import { ARKON_CHAPTER_01 } from '../data/arkonChapter01.js?v=20261022-r649';
import { ARKON_CHAPTER_01_REVISED } from '../data/arkonChapter01Revised.js?v=20261023-r653';
import { validateStoryScript, checkStoryCondition } from '../story/StoryScript.js?v=20261023-r652';
import { playMangaCutscene } from './MangaCutscene.js?v=20261023-r652';
import { resetArkonStoryState } from '../state/GameState.js?v=20261023-r652';

const PIXEL='"Silkscreen", monospace',BODY='"Rajdhani", sans-serif';
const script=validateStoryScript(ARKON_CHAPTER_01);

export function getArkonRecountScenes(registry) {
  const get=key=>registry?.get?.(key);
  if(get('gameMode')!=='arkonStory') return [];
  const progress=get('storyDirectorProgress');
  const revised=progress?.id==='arkonChapter01Revised' ||
    Boolean(get('arkonStoryChapter01RevisedDone'));
  const source=revised?ARKON_CHAPTER_01_REVISED:ARKON_CHAPTER_01;
  const compiled=validateStoryScript(source);
  const limit=(revised && get('arkonStoryChapter01RevisedDone')) ||
    (!revised && get('arkonStoryChapter01FullDone'))
    ? source.steps.length
    : progress?.id===source.id ? progress.index : 0;
  const choices={...(get('arkonStoryChoices')||{}),...(progress?.vars||{})};
  if(get('arkonStoryFirstChoice'))choices.firstApproach=get('arkonStoryFirstChoice');
  if(get('arkonStoryFirstReply'))choices.firstReply=get('arkonStoryFirstReply');
  const getValue=key=>Object.prototype.hasOwnProperty.call(choices,key)
    ? choices[key] : get(key);
  const result=[];
  let index=0;
  for(let budget=0;budget<1000 && index<limit && index<source.steps.length;budget++){
    const step=source.steps[index];
    if(step.type==='END')break;
    if(step.type==='CHOICE'){
      const chosen=step.choices.find(x=>x.id===getValue(step.key||'choice'));
      if(!chosen)break;
      index=(compiled.labels.get(chosen.to)??-1)+1;
      continue;
    }
    if(step.type==='GOTO'){
      index=(compiled.labels.get(step.to)??-1)+1;
      continue;
    }
    if(step.type==='IF'){
      const dest=checkStoryCondition(step,getValue)?step.then:step.else;
      index=dest?(compiled.labels.get(dest)??-1)+1:index+1;
      continue;
    }
    if(step.type==='MANGA')result.push(step);
    index++;
  }
  return result;
}

export function playArkonStoryRecount(scene) {
  if(!scene?.registry || scene.registry.get('__arkonStoryRecountActive'))return false;
  const scenes=getArkonRecountScenes(scene.registry);
  if(!scenes.length)return false;
  scene.registry.set('__arkonStoryRecountActive',true);
  let index=0,active=true;
  const done=()=>{
    if(!active)return;
    active=false;
    scene.events?.off?.('shutdown',done);
    scene.registry.set('__arkonStoryRecountActive',false);
  };
  scene.events?.once?.('shutdown',done);
  const next=()=>{
    if(!active||!scene.sys?.isActive?.())return done();
    if(index>=scenes.length)return done();
    const step=scenes[index++];
    const definition={
      id:'arkon-recount-'+index,once:false,
      title:step.title||ARKON_CHAPTER_01.title,
      characters:step.characters||{left:'arkonDen',right:'sayakaFujieda'},
      pages:step.pages,
      presentationMode:step.presentationMode||'openingSwipe',
    };
    const started=playMangaCutscene(scene,definition,{
      preview:true,
      onPreviewComplete:()=>{
        // Give the previous overlay time to unfreeze/destroy itself.
        if(active)scene.time.delayedCall(1,next);
      },
      onCancel:done,
    });
    if(!started?.played)done();
  };
  next();
  return true;
}

export function showArkonStoryArchivePanel(scene) {
  if(!scene?.add || scene.registry?.get?.('gameMode')!=='arkonStory' ||
    scene._arkonStoryArchiveOpen)return false;
  scene._arkonStoryArchiveOpen=true;
  const depth=610,objects=[],add=item=>(objects.push(item),item);
  const close=()=>{
    objects.forEach(obj=>obj?.destroy?.());
    scene._arkonStoryArchiveOpen=false;
    scene.events?.off?.('shutdown',close);
  };
  scene.events?.once?.('shutdown',close);
  add(scene.add.rectangle(780,420,1560,840,0x01060d,.88)
    .setDepth(depth).setInteractive());
  add(scene.add.rectangle(780,415,950,535,0x0b1d2d,.995)
    .setStrokeStyle(3,0x79d6e8).setDepth(depth+1));
  add(scene.add.text(780,208,'ARKON DEN // RECOUNT STORY',{
    fontFamily:PIXEL,fontSize:'19px',color:'#f2faff',
  }).setOrigin(.5).setDepth(depth+2));
  add(scene.add.text(780,267,'CHAPTER 01 // PLAYED SCENES',{
    fontFamily:PIXEL,fontSize:'11px',color:'#84dce7',
  }).setOrigin(.5).setDepth(depth+2));
  add(scene.add.text(780,315,
    'Rewatch the conversations you have already seen, or begin the Story again.\nNeither option touches your other drivers or Arkon Dev Career.',{
      fontFamily:BODY,fontSize:'20px',color:'#d5e4ec',
      align:'center',wordWrap:{width:820},
    }).setOrigin(.5).setDepth(depth+2));
  const action=(y,label,color,fn)=>{
    const button=add(scene.add.rectangle(780,y,580,58,0x153247,1)
      .setStrokeStyle(2,color).setDepth(depth+2)
      .setInteractive({useHandCursor:true}));
    add(scene.add.text(780,y,label,{
      fontFamily:PIXEL,fontSize:'11px',color:'#ffffff',
    }).setOrigin(.5).setDepth(depth+3));
    button.on('pointerdown',fn);
  };
  const count=getArkonRecountScenes(scene.registry).length;
  action(405,count?'REWATCH PLAYED CUTSCENES':'NO CUTSCENES TO REWATCH',0x6fdae2,()=>{
    if(!count)return;
    close();
    scene.closeOpeningOffice?.();
    playArkonStoryRecount(scene);
  });
  let confirming=false;
  action(486,'RESTART ARKON STORY FROM THE BEGINNING',0xe898a7,()=>{
    if(confirming)return;
    confirming=true;
    const confirm=add(scene.add.rectangle(780,420,950,535,0x081523,.997)
      .setStrokeStyle(3,0xff9eab).setDepth(depth+10));
    add(scene.add.text(780,323,'ERASE STORY PROGRESS ONLY?',{
      fontFamily:PIXEL,fontSize:'16px',color:'#ffbdca',
    }).setOrigin(.5).setDepth(depth+11));
    add(scene.add.text(780,386,
      'Your Arkon Story races, cars, money and choices will reset.\nOther profiles and Arkon Dev Career are not changed.',{
        fontFamily:BODY,fontSize:'21px',color:'#ffffff',
        align:'center',wordWrap:{width:790},
      }).setOrigin(.5).setDepth(depth+11));
    const confirmButton=add(scene.add.rectangle(614,512,290,55,0x3b1825)
      .setStrokeStyle(2,0xff8e9c).setDepth(depth+12).setInteractive());
    add(scene.add.text(614,512,'YES, RESTART STORY',{
      fontFamily:PIXEL,fontSize:'10px',color:'#ffffff',
    }).setOrigin(.5).setDepth(depth+13));
    const cancelButton=add(scene.add.rectangle(962,512,235,55,0x143243)
      .setStrokeStyle(2,0x80dce9).setDepth(depth+12).setInteractive());
    add(scene.add.text(962,512,'CANCEL',{
      fontFamily:PIXEL,fontSize:'10px',color:'#ffffff',
    }).setOrigin(.5).setDepth(depth+13));
    cancelButton.on('pointerdown',close);
    confirmButton.on('pointerdown',()=>{
      if(!resetArkonStoryState()){
        scene.showWorkshopToast?.('STORY RESTART FAILED // SAVE NOT CHANGED');
        close();return;
      }
      scene.game?.storyDirector?.stop?.();
      try{
        sessionStorage.setItem('tokyoShiftInternalReload','1');
        sessionStorage.setItem('tokyoShiftForceGarage','1');
      }catch(_){}
      window.location.reload();
    });
    void confirm;
  });
  action(577,'BACK TO OFFICE',0x4e96ab,close);
  return true;
}
