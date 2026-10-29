// R570 — Story Archive: player-facing, spoiler-safe chapter library.
// Only canonical chapters appear. Dev micro-scenes remain in
// Arkon Den's existing D) SCENES panel.
import { availableStoryChapters } from '../data/storyChapters.js?v=20261027-r693';
import { beginStoryArchiveSceneReplay } from './StoryReplaySession.js?v=20261017-r574';
import { startInteractiveChapter08Replay } from './Chapter08DevReplay.js?v=20261017-r574';
import { startChapter09 } from './Chapter09Story.js?v=20261027-r693';
import { playMangaCutscene } from './MangaCutscene.js?v=20261027-r693';
import { beginProSponsorPlayableReplay } from './ProSponsorReplay.js?v=20261027-r693';
const FONT='"Silkscreen", monospace';
const BODY='"Rajdhani", monospace';
export function showStoryArchivePanel(scene) {
  if(!scene || scene._storyArchiveOverlay?.length)return;
  const objects=[];let detail=[];
  const add=obj=>{objects.push(obj);return obj;};
  const discardDetail=()=>{detail.forEach(obj=>obj?.destroy?.());detail=[];};
  const close=()=>{
    discardDetail();objects.forEach(obj=>obj?.destroy?.());
    scene._storyArchiveOverlay=[];
  };
  scene._storyArchiveOverlay=objects;
  const depth=430;
  add(scene.add.rectangle(780,420,1560,840,0x02060d,.88).setDepth(depth)
    .setScrollFactor(0).setInteractive());
  add(scene.add.rectangle(780,420,1375,756,0x091525,.99).setStrokeStyle(3,0x8ad6f4)
    .setDepth(depth+1).setScrollFactor(0));
  add(scene.add.text(155,104,'STORY ARCHIVE',{
    fontFamily:FONT,fontSize:'20px',color:'#ffffff',
  }).setDepth(depth+3).setScrollFactor(0));
  const dev=Boolean(scene.registry.get('devMode'));
  const chapters=availableStoryChapters(scene.registry,{dev});
  const cleared=chapters.filter(ch=>ch.completed).length;
  add(scene.add.text(154,139,
    dev?'DEV VIEW // ALL CHAPTERS':'RELIVE YOUR JOURNEY // '+cleared+' OF '+chapters.length+' CHAPTERS',
    {fontFamily:BODY,fontSize:'15px',color:'#a9c8d9',fontStyle:'700'})
    .setDepth(depth+3).setScrollFactor(0));
  const exit=add(scene.add.rectangle(1360,110,150,47,0x152538,.98)
    .setStrokeStyle(2,0x9cd4ee).setDepth(depth+3)
    .setScrollFactor(0).setInteractive({useHandCursor:true}));
  add(scene.add.text(1360,110,'CLOSE',{
    fontFamily:FONT,fontSize:'9px',color:'#ffffff',
  }).setOrigin(.5).setDepth(depth+4).setScrollFactor(0));
  exit.on('pointerdown',close);

  const launch=(id,interactive=false)=>{
    // Prepare the temporary sandbox FIRST. A snapshot error or missing car
    // must never close the archive and leave a blank/stuck workshop screen.
    const started=id==='chapter08'
      ? startInteractiveChapter08Replay(scene,{
          allowPlayer:true,returnToOffice:true,skipRace:!interactive,
        })
      : id==='chapter09'
        ? startChapter09(scene,{preview:true})
        : id==='chapter10'
          ? (interactive
            ? beginProSponsorPlayableReplay(scene,{
                returnToArchive:true,includeChapter09Welcome:false,
              })
            : Boolean(playMangaCutscene(scene,'proSponsorIntroduction',{
                preview:true,preloadPagePosesOnly:true,
                onPreviewComplete:()=>playMangaCutscene(scene,'proSponsorEpilogue',{
                  preview:true,preloadPagePosesOnly:true,
                }),
              })?.played))
          : id==='chapter11' || id==='chapter12'
            ? Boolean(playMangaCutscene(scene,
                id==='chapter11'?'tokyoChampionshipOpening':'tokyoChampionshipVictory',{
                  preview:true,preloadPagePosesOnly:true,
                })?.played)
            : beginStoryArchiveSceneReplay(scene,id,{skipMagazine:!interactive});
    if(!started) {
      detail.push(scene.add.text(780,550,
        'REPLAY COULD NOT START // CHECK YOUR CAR AND TRY AGAIN',{
          fontFamily:FONT,fontSize:'8px',color:'#ffc9d6',
          backgroundColor:'#152235',padding:{x:12,y:10},
        }).setOrigin(.5).setDepth(depth+22).setScrollFactor(0));
      return false;
    }
    close();
    // The scene transition now runs AFTER this click via SafeSceneTransition,
    // avoiding same-frame iPad Phaser restarts.
    scene.closeOpeningOffice?.();
    return true;
  };
  const openChapter=chapter=>{
    if(!chapter.completed)return;
    const lift=obj=>{detail.push(obj);return obj;};
    lift(scene.add.rectangle(780,420,1560,840,0x01050b,.8)
      .setDepth(depth+15).setScrollFactor(0).setInteractive());
    lift(scene.add.rectangle(780,410,885,425,0x0e2030,.99)
      .setStrokeStyle(3,0xffafd5).setDepth(depth+16).setScrollFactor(0));
    lift(scene.add.text(780,275,'CHAPTER '+String(chapter.number).padStart(2,'0'),{
      fontFamily:FONT,fontSize:'10px',color:'#f5b8d2',
    }).setOrigin(.5).setDepth(depth+17).setScrollFactor(0));
    lift(scene.add.text(780,322,chapter.title.toUpperCase(),{
      fontFamily:FONT,fontSize:'16px',color:'#ffffff',
      align:'center',wordWrap:{width:750},
    }).setOrigin(.5).setDepth(depth+17).setScrollFactor(0));
    lift(scene.add.text(780,377,
      'Your original choices, cash, cars and progress will not change.',{
      fontFamily:BODY,fontSize:'15px',fontStyle:'700',color:'#b9cfdd',
      align:'center',
    }).setOrigin(.5).setDepth(depth+17).setScrollFactor(0));
    const choice=(x,y,w,title,subtitle,action)=>{
      const bg=lift(scene.add.rectangle(x,y,w,76,0x17354a,.99)
        .setStrokeStyle(2,0x83daef).setDepth(depth+17)
        .setScrollFactor(0).setInteractive({useHandCursor:true}));
      lift(scene.add.text(x,y-13,title,{
        fontFamily:FONT,fontSize:'9px',color:'#ffffff',
      }).setOrigin(.5).setDepth(depth+18).setScrollFactor(0));
      lift(scene.add.text(x,y+13,subtitle,{
        fontFamily:BODY,fontSize:'12px',color:'#bcd8e7',
      }).setOrigin(.5).setDepth(depth+18).setScrollFactor(0));
      bg.on('pointerdown',()=>{
        bg.disableInteractive();
        // Do not destroy the pressed modal while Safari is still processing
        // its pointer event. Prepare/close the replay on the following turn.
        window.setTimeout(()=>{
          action();
          if(bg.active)bg.setInteractive({useHandCursor:true});
        },0);
      });
    };
    if(chapter.id==='chapter08'){
      choice(566,484,350,'WATCH STORY','No race required',()=>launch(chapter.id,false));
      choice(996,484,350,'RELIVE CHAPTER','Play the Porsche race',()=>{
        if(!launch(chapter.id,true)){
          // A driveable owned car is needed for the optional race.
          lift(scene.add.text(780,553,'A DRIVEABLE CAR IS REQUIRED FOR THE RACE',{
            fontFamily:FONT,fontSize:'8px',color:'#ffc9d6',
          }).setOrigin(.5).setDepth(depth+19).setScrollFactor(0));
        }
      });
    } else if(chapter.id==='chapter10'){
      choice(566,484,350,'WATCH STORY','Aruken signing and send-off',()=>launch(chapter.id,false));
      choice(996,484,350,'RELIVE CHAPTER','Race the Liberty Walk 240Z',
        ()=>launch(chapter.id,true));
    } else if(chapter.id==='chapter09'){
      choice(780,483,470,'WATCH CHAPTER','Drag Complex welcome and team briefing',
        ()=>launch(chapter.id,false));
    } else if(chapter.id==='chapter01'){
      choice(566,484,350,'WATCH STORY','Opening scenes',()=>launch(chapter.id,false));
      choice(996,484,350,'RELIVE CHAPTER','Flip Issue 01 and choose a car',()=>launch(chapter.id,true));
    } else {
      choice(780,483,470,'REPLAY CHAPTER','Original cinematics and interactions',
        ()=>launch(chapter.id,false));
    }
    const back=lift(scene.add.text(780,591,'< BACK TO ARCHIVE',{
      fontFamily:FONT,fontSize:'9px',color:'#d1dfec',
      backgroundColor:'#182a3b',padding:{x:14,y:9},
    }).setOrigin(.5).setDepth(depth+18).setScrollFactor(0)
      .setInteractive({useHandCursor:true}));
    back.on('pointerdown',discardDetail);
  };
  chapters.forEach((chapter,i)=>{
    // Two columns of six; the sixth row fits inside the 756px archive.
    const leftColumn=i<6;
    const x=leftColumn?449:1111;
    const y=209+(leftColumn?i:i-6)*105;
    const available=chapter.completed;
    const title=available?chapter.title.toUpperCase():'???';
    const subtitle=available?chapter.subtitle:'Complete this chapter to unlock replay';
    const rect=add(scene.add.rectangle(x,y,590,98,
      available?0x12283a:0x111924,.99)
      .setStrokeStyle(2,available?0x5288a4:0x344657,.9)
      .setDepth(depth+3).setScrollFactor(0));
    add(scene.add.text(x-267,y-27,'CHAPTER '+String(chapter.number).padStart(2,'0'),{
      fontFamily:FONT,fontSize:'8px',color:available?'#95d9f3':'#718493',
    }).setDepth(depth+4).setScrollFactor(0));
    add(scene.add.text(x-267,y-4,title,{
      fontFamily:FONT,fontSize:'10px',color:available?'#ffffff':'#718493',
    }).setDepth(depth+4).setScrollFactor(0));
    add(scene.add.text(x-267,y+21,subtitle,{
      fontFamily:BODY,fontSize:'11px',color:available?'#b3cfde':'#708697',
      wordWrap:{width:450},
    }).setDepth(depth+4).setScrollFactor(0));
    add(scene.add.text(x+265,y,available?'REPLAY >':'LOCKED',{
      fontFamily:FONT,fontSize:'8px',color:available?'#ffc1dc':'#738594',
    }).setOrigin(1,.5).setDepth(depth+4).setScrollFactor(0));
    if(available){
      rect.setInteractive({useHandCursor:true});
      rect.on('pointerover',()=>rect.setStrokeStyle(3,0xf2acc8));
      rect.on('pointerout',()=>rect.setStrokeStyle(2,0x5288a4));
      rect.on('pointerdown',()=>openChapter(chapter));
    }
  });
}
