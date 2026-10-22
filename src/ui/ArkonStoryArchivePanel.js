// R661 — Arkon's Story recount opens FULL GAMEPLAY replay by default.
// Watching only the dialogue is a separately labelled, optional shortcut.
// Neither path changes the real profile, and restart remains opt-in.
import { ARKON_CHAPTER_01 } from '../data/arkonChapter01.js?v=20261022-r649';
import { ARKON_CHAPTER_01_REVISED } from '../data/arkonChapter01Revised.js?v=20261023-r662';
import { ARKON_CHAPTER_02 } from '../data/arkonChapter02.js?v=20261023-r662';
import { ARKON_CHAPTER_03 } from '../data/arkonChapter03.js?v=20261023-r662';
import { ARKON_CHAPTER_04 } from '../data/arkonChapter04.js?v=20261023-r662';
import { getArkonPlayableChapters, beginArkonPlayableReplay } from './ArkonPlayableReplay.js?v=20261023-r662';
import { validateStoryScript, checkStoryCondition } from '../story/StoryScript.js?v=20261023-r652';
import { playMangaCutscene } from './MangaCutscene.js?v=20261023-r658';
import { resetArkonStoryState } from '../state/GameState.js?v=20261023-r653';

const PIXEL='"Silkscreen", monospace',BODY='"Rajdhani", sans-serif';
const script=validateStoryScript(ARKON_CHAPTER_01);

export function getArkonRecountScenes(registry) {
  const get=key=>registry?.get?.(key);
  if(get('gameMode')!=='arkonStory')return [];
  const progress=get('storyDirectorProgress');
  const chapter04=progress?.id===ARKON_CHAPTER_04.id ||
    Boolean(get('arkonStoryChapter04Done'));
  const chapter03=chapter04 || progress?.id===ARKON_CHAPTER_03.id ||
    Boolean(get('arkonStoryChapter03Done'));
  const chapter02=chapter03 || progress?.id===ARKON_CHAPTER_02.id ||
    Boolean(get('arkonStoryChapter02Done'));
  const revised=chapter02 || progress?.id===ARKON_CHAPTER_01_REVISED.id ||
    Boolean(get('arkonStoryChapter01RevisedDone'));
  const scripts=chapter04
    ? [ARKON_CHAPTER_01_REVISED,ARKON_CHAPTER_02,ARKON_CHAPTER_03,ARKON_CHAPTER_04]
    :chapter03
    ? [ARKON_CHAPTER_01_REVISED,ARKON_CHAPTER_02,ARKON_CHAPTER_03]
    :chapter02 ? [ARKON_CHAPTER_01_REVISED,ARKON_CHAPTER_02]
    : [revised?ARKON_CHAPTER_01_REVISED:ARKON_CHAPTER_01];
  const choices={...(get('arkonStoryChoices')||{}),...(progress?.vars||{})};
  if(get('arkonStoryFirstChoice'))choices.firstApproach=get('arkonStoryFirstChoice');
  if(get('arkonStoryFirstReply'))choices.firstReply=get('arkonStoryFirstReply');
  const getValue=key=>Object.prototype.hasOwnProperty.call(choices,key)
    ? choices[key] : get(key);
  const played=[];
  for(const source of scripts){
    const compiled=validateStoryScript(source);
    const completed=source.id===ARKON_CHAPTER_04.id
      ? get('arkonStoryChapter04Done')
      :source.id===ARKON_CHAPTER_03.id
      ? get('arkonStoryChapter03Done')
      :source.id===ARKON_CHAPTER_02.id
      ? get('arkonStoryChapter02Done')
      :source.id===ARKON_CHAPTER_01_REVISED.id
        ? get('arkonStoryChapter01RevisedDone')
        :get('arkonStoryChapter01FullDone');
    const limit=completed ? source.steps.length
      :progress?.id===source.id ? progress.index : 0;
    let index=0;
    for(let budget=0;budget<1000&&index<limit&&index<source.steps.length;budget++){
      const step=source.steps[index];
      if(step.type==='END')break;
      if(step.type==='CHOICE'){
        const chosen=step.choices.find(x=>x.id===getValue(step.key||'choice'));
        if(!chosen)break;
        index=(compiled.labels.get(chosen.to)??-1)+1;continue;
      }
      if(step.type==='GOTO'){index=(compiled.labels.get(step.to)??-1)+1;continue;}
      if(step.type==='IF'){
        const dest=checkStoryCondition(step,getValue)?step.then:step.else;
        index=dest?(compiled.labels.get(dest)??-1)+1:index+1;continue;
      }
      if(step.type==='MANGA')played.push(step);
      index++;
    }
  }
  return played;
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
  add(scene.add.text(780,209,'ARKON DEN // RECOUNT STORY',{
    fontFamily:PIXEL,fontSize:'16px',color:'#f2faff',
  }).setOrigin(.5).setDepth(depth+2));
  const chapter=scene.registry.get('arkonStoryChapter04Done') ||
    scene.registry.get('storyDirectorProgress')?.id===ARKON_CHAPTER_04.id
      ? 'CHAPTERS 01–04 // PLAYED SCENES'
      :scene.registry.get('arkonStoryChapter03Done') ||
    scene.registry.get('storyDirectorProgress')?.id===ARKON_CHAPTER_03.id
      ? 'CHAPTERS 01–03 // PLAYED SCENES'
      :scene.registry.get('arkonStoryChapter02Done') ||
      scene.registry.get('storyDirectorProgress')?.id===ARKON_CHAPTER_02.id
        ? 'CHAPTERS 01 & 02 // PLAYED SCENES' : 'CHAPTER 01 // PLAYED SCENES';
  add(scene.add.text(780,267,chapter,{
    fontFamily:PIXEL,fontSize:'9px',color:'#84dce7',
  }).setOrigin(.5).setDepth(depth+2));
  // The global mobile readability pass scales fonts by 1.6x. Keep this
  // description compact so it cannot overlap the subtitle or first button.
  add(scene.add.text(780,318,
    'FULL REPLAY: racing, car tuning, choices and cutscenes.\nWATCH SCENES: dialogue only. Your saved profile stays unchanged.',{
      fontFamily:BODY,fontSize:'12px',color:'#d5e4ec',
      align:'center',wordWrap:{width:800},
    }).setOrigin(.5).setDepth(depth+2));
  const action=(y,label,color,fn)=>{
    const button=add(scene.add.rectangle(780,y,580,58,0x153247,1)
      .setStrokeStyle(2,color).setDepth(depth+2)
      .setInteractive({useHandCursor:true}));
    add(scene.add.text(780,y,label,{
      fontFamily:PIXEL,fontSize:'10px',color:'#ffffff',
    }).setOrigin(.5).setDepth(depth+3));
    button.on('pointerdown',fn);
  };
  // Primary recount is the interactive chapter picker, NOT an automatic
  // cutscene playlist. The latter remains available as an explicit option.
  action(386,'REPLAY CHAPTER // FULL GAMEPLAY',0x93e5aa,()=>{
    const chapters=getArkonPlayableChapters(scene.registry);
    if(!chapters.length)return;
    const curtain=add(scene.add.rectangle(780,420,950,535,0x071521,.998)
      .setStrokeStyle(3,0x72d8c7).setDepth(depth+12).setInteractive());
    add(scene.add.text(780,211,'SELECT A CHAPTER TO REPLAY',{
      fontFamily:PIXEL,fontSize:'13px',color:'#b5fff0',
    }).setOrigin(.5).setDepth(depth+13));
    add(scene.add.text(780,278,
      'Play the complete chapter with its choices, races and tuning.\nAll progress and payments are temporary.',{
        fontFamily:BODY,fontSize:'12px',color:'#eff9ff',
        align:'center',wordWrap:{width:815},
      }).setOrigin(.5).setDepth(depth+13));
    const titles={1:'01  FIRST IMPRESSIONS',2:'02  THE LONG WAY HOME',
      3:'03  THE NIGHT SHIFT',4:'04  THE PRICE OF TRUST'};
    chapters.forEach((number,index)=>{
      const y=349+index*57;
      const card=add(scene.add.rectangle(780,y,585,53,0x173e43)
        .setStrokeStyle(2,0x72d8c7).setDepth(depth+13)
        .setInteractive({useHandCursor:true}));
      add(scene.add.text(780,y,titles[number],{
        fontFamily:PIXEL,fontSize:'11px',color:'#f4ffff',
      }).setOrigin(.5).setDepth(depth+14));
      card.on('pointerdown',()=>{
        close();scene.closeOpeningOffice?.();
        if(!beginArkonPlayableReplay(scene,number))
          scene.showWorkshopToast?.('CHAPTER REPLAY COULD NOT START');
      });
    });
    const dismiss=add(scene.add.rectangle(780,605,270,43,0x1d3441)
      .setStrokeStyle(1,0x81bacd).setDepth(depth+13).setInteractive());
    add(scene.add.text(780,605,'CANCEL',{
      fontFamily:PIXEL,fontSize:'10px',color:'#ffffff',
    }).setOrigin(.5).setDepth(depth+14));
    dismiss.on('pointerdown',()=>{close();showArkonStoryArchivePanel(scene);});
    void curtain;
  });
  const count=getArkonRecountScenes(scene.registry).length;
  action(452,count?'WATCH CUTSCENES ONLY':'NO CUTSCENES AVAILABLE',0x6fdae2,()=>{
    if(!count)return;
    close();
    scene.closeOpeningOffice?.();
    playArkonStoryRecount(scene);
  });
  let confirming=false;
  action(518,'ERASE STORY PROGRESS // RESTART PROFILE',0xe898a7,()=>{
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
  action(606,'BACK TO OFFICE',0x4e96ab,close);
  return true;
}
