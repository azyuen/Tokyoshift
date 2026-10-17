// R580: one continuous registration-room stage for the ENTIRE Chapter 09.
// Same renderer for first career visit, Arkon Den and completed-story replay.
// No races, transitions or prizes. Page history is saved only in career mode.
import { CHAPTER09_SEQUENCE, CHAPTER09_SCENES } from '../data/chapter09.js?v=20261018-r580';
import { characters, getCharacterAssetUrl, getCharacterVisualAsset } from '../data/characters.js?v=20261017-r578';
import { markCutsceneSeen } from '../data/cutscenes.js?v=20261017-r578';
import { saveSessionState } from '../state/GameState.js?v=20261017-r565';

const FONT='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
const BASE=920;
const LEFT=Object.freeze([
  {id:'sayakaFujieda',pose:'track',x:.135,height:280},
  {id:'daichiSakamoto',pose:'idle',x:.267,height:279},
  {id:'$PLAYER',pose:'idle',x:.393,height:290},
]);
const RIGHT=Object.freeze([
  {id:'ryujiTakahashi',pose:'normal',x:.68,height:286},
  {id:'masatoKuroda',pose:'normal',x:.807,height:271},
  {id:'hiroshiSato',pose:'normal',x:.926,height:270},
]);
const MIKA=Object.freeze({id:'mikaHayaseChampion',pose:'idle',x:.548,height:292});
export const CHAPTER09_GROUPS=Object.freeze({left:LEFT,right:RIGHT,mika:MIKA});

export function chapter09ShotAssets(scene) {
  const phase=String(scene?.worldPhase||'night').toLowerCase()==='day'?'day':'night';
  const background={
    key:'chapter09RegoRoom'+(phase==='day'?'Day':'Night'),
    path:'assets/CentralTokyo/dragcomplex/regoroom_'+phase+'.png',
  };
  const playerId=scene?.registry?.get?.('playerCharacterId')||'renMizuno';
  const resolve=entry=>{
    const id=entry.id==='$PLAYER'?playerId:entry.id;
    return {...entry,id,asset:getCharacterVisualAsset(id,entry.pose,{playerCharacterId:playerId})};
  };
  return {background,left:LEFT.map(resolve),right:RIGHT.map(resolve),
    mika:resolve(MIKA),playerId};
}

function chapter09PortraitAssets(assets) {
  const result=new Map();
  const insert=asset=>{
    if(asset?.key&&asset?.path)result.set(asset.key,getCharacterAssetUrl(asset.path));
  };
  for(const person of [...assets.left,...assets.right,assets.mika])insert(person.asset);
  for(const id of CHAPTER09_SEQUENCE){
    const pages=CHAPTER09_SCENES[id]?.pages||[];
    for(const page of pages){
      const who=page.speaker==='right'?assets.playerId:
        page.leftCharacter || '';
      const pose=page.speaker==='right'?(page.pose||'idle'):
        (page.leftPose||page.pose||'idle');
      if(who)insert(getCharacterVisualAsset(who,pose,{playerCharacterId:assets.playerId}));
    }
  }
  return result;
}

export function playChapter09RegoRoom(scene,{preview=false,onComplete=null,onCancel=null}={}) {
  if(!scene?.load||!scene?.textures||scene._chapter09Stage?.active)return null;
  const scenes=preview?[...CHAPTER09_SEQUENCE]:
    CHAPTER09_SEQUENCE.filter(id=>!(
      (scene.registry.get('cutscenesSeen')||[]).includes(id)
    ));
  if(!scenes.length)return null;

  const assets=chapter09ShotAssets(scene),objects=[],temporaries=[],timers=[];
  const state={active:true,preview,scenes,index:0,pageIndex:0,phase:'loading',cancel:null,
    characters:new Map(),objects};
  scene._chapter09Stage=state;
  let loadHandler=null,shuttingDown=false;
  const add=o=>{objects.push(o);return o;};
  const disposable=o=>{temporaries.push(o);return o;};
  const removeDialogue=()=>{
    for(const o of temporaries.splice(0)){
      try {scene.tweens.killTweensOf(o);o?.destroy?.();}catch(_){}
    }
  };
  const later=(delay,fn)=>{
    const timer=scene.time.delayedCall(delay,()=>{if(state.active&&scene.sys?.isActive?.())fn();});
    timers.push(timer);
    return timer;
  };
  const cleanup=()=>{
    if(!state.active)return false;
    state.active=false;
    if(loadHandler)scene.load.off(Phaser.Loader.Events.COMPLETE,loadHandler);
    timers.forEach(t=>t?.remove?.(false));
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN,shutdown);
    scene.events.off(Phaser.Scenes.Events.DESTROY,shutdown);
    removeDialogue();
    objects.forEach(o=>{
      try {scene.tweens.killTweensOf(o);o?.destroy?.();}catch(_){}
    });
    if(scene._chapter09Stage===state)scene._chapter09Stage=null;
    return true;
  };
  const shutdown=()=>{
    shuttingDown=true;
    if(cleanup())onCancel?.();
  };
  state.cancel=shutdown;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,shutdown);
  scene.events.once(Phaser.Scenes.Events.DESTROY,shutdown);

  const start=()=>{
    if(!state.active||!scene.sys?.isActive?.())return;
    const w=Number(scene.scale?.width||1560),h=Number(scene.scale?.height||840);
    const floorY=h*.8;
    const tex=scene.textures;
    const tween=(target,alpha,duration=230)=>scene.tweens.add({
      targets:target,alpha,duration,ease:'Sine.easeInOut',
    });
    add(scene.add.rectangle(w/2,h/2,w,h,0x071018,1)
      .setScrollFactor(0).setDepth(BASE));
    if(tex.exists(assets.background.key)){
      const b=add(scene.add.image(w/2,h/2,assets.background.key)
        .setScrollFactor(0).setDepth(BASE+1));
      const source=tex.get(assets.background.key).getSourceImage();
      b.setScale(Math.max(w/Math.max(1,source.width),h/Math.max(1,source.height)));
      tex.get(assets.background.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    }
    add(scene.add.rectangle(w/2,h/2,w,h,0x020713,.13)
      .setScrollFactor(0).setDepth(BASE+2));
    // Six permanent cast members, occupying the room floor. Mika enters only
    // in the visitor scene and exits before the closing scene.
    function createActor(entry,right=false,mika=false){
      if(!entry.asset?.key||!tex.exists(entry.asset.key))return;
      const img=tex.get(entry.asset.key);
      img.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
      const source=img.getSourceImage();
      const targetHeight=h*entry.height/840;
      const maxWidth=w*(mika ? .118 : right ? .116 : .12);
      const scale=Math.min(targetHeight/Math.max(1,source.height),
        maxWidth/Math.max(1,source.width));
      const x=w*entry.x;
      const shadow=add(scene.add.ellipse(x,floorY-4,Math.max(35,scale*source.width*.5),
        15,0x000000,.34).setScrollFactor(0).setDepth(BASE+4).setAlpha(0));
      const sprite=add(scene.add.image(x,floorY,entry.asset.key)
        .setOrigin(.5,1).setScale(scale).setFlipX(Boolean(right))
        .setScrollFactor(0).setDepth(BASE+5).setAlpha(0));
      state.characters.set(entry.id,{sprite,shadow,pose:entry.pose,height:targetHeight,
        maxWidth,right,visible:!mika,asset:entry.asset});
    }
    for(const entry of assets.left)createActor(entry,false);
    for(const entry of assets.right)createActor(entry,true);
    createActor(assets.mika,false,true);

    const label=(x,y,str,size,color='#fff',depth=BASE+18)=>add(scene.add.text(x,y,str,{
      fontFamily:FONT,fontSize:size+'px',color,stroke:'#0b111d',strokeThickness:3,
    }).setOrigin(.5).setScrollFactor(0).setDepth(depth));
    const chapterTitle=label(w/2,h*.093,'CHAPTER 09 // WELCOME TO THE BIG LEAGUES',13,'#f8f0ec');
    const sectionTitle=label(w/2,h*.144,'TOKYO DRAG COMPLEX // REGISTRATION ROOM',10,'#e7b8c4');
    state.sectionTitle=sectionTitle;
    add(scene.add.rectangle(w/2,h/2,w,h,0,0.001).setDepth(BASE+12)
      .setScrollFactor(0).setInteractive({useHandCursor:true})
      .on('pointerdown',()=>{if(state.phase==='dialogue')advance();}));
    const skip=label(w-65,42,'SKIP CHAPTER  >',8,'#f7e5e9',BASE+42)
      .setInteractive({useHandCursor:true});
    skip.on('pointerdown',()=>complete(true));

    const curtain=add(scene.add.rectangle(w/2,h/2,w,h,0x000000,1)
      .setDepth(BASE+50).setScrollFactor(0));
    state.phase='opening';
    tween(curtain,0,980);
    later(260,()=>{
      for(const [id,actor] of state.characters){
        if(id===MIKA.id)continue;
        tween([actor.sprite,actor.shadow],.85,820);
      }
    });
    later(1750,()=>{state.phase='dialogue';drawPage();});

    function speakerFor(page){
      if(page.speaker==='right')return assets.playerId;
      if(page.speaker==='left')return page.leftCharacter || 'daichiSakamoto';
      return null;
    }
    function portraitPose(id,pose){
      const actor=state.characters.get(id);
      if(!actor)return;
      const asset=getCharacterVisualAsset(id,pose,{playerCharacterId:assets.playerId});
      if(!asset?.key||!tex.exists(asset.key)||actor.pose===pose)return;
      actor.pose=pose;
      actor.sprite.setTexture(asset.key);
      const source=tex.get(asset.key).getSourceImage();
      actor.sprite.setScale(Math.min(actor.height/Math.max(1,source.height),
        actor.maxWidth/Math.max(1,source.width)));
    }
    function brighten(speaker){
      for(const [id,actor] of state.characters){
        if(id===MIKA.id&&!actor.visible)continue;
        // Active character steps forward visually without moving their feet.
        const target=id===speaker?1:.77;
        tween(actor.sprite,target,150);
        tween(actor.shadow,id===speaker ? .44 : .3,150);
      }
    }
    function setMika(visible){
      const actor=state.characters.get(MIKA.id);
      if(!actor||actor.visible===visible)return;
      actor.visible=visible;
      tween(actor.sprite,visible ? .84 : 0,750);
      tween(actor.shadow,visible ? .3 : 0,750);
    }
    function drawPage(){
      if(!state.active||state.phase!=='dialogue')return;
      removeDialogue();
      const id=scenes[state.index],definition=CHAPTER09_SCENES[id];
      const page=definition?.pages?.[state.pageIndex];
      if(!page)return;
      if(id==='chapter09Visitor')setMika(true);
      else if(id==='chapter09Welcome')setMika(false);
      sectionTitle.setText('SCENE '+String(state.index+1)+'/'+scenes.length+
        ' // '+definition.title.replace(/^CHAPTER 09\s*\/\/\s*/,''));
      const speaker=speakerFor(page);
      if(speaker){
        const pose=speaker===assets.playerId?(page.pose||'idle'):
          (page.leftPose||page.pose||'idle');
        portraitPose(speaker,pose);
      }
      brighten(speaker);
      const width=Math.min(w-100,1100),height=158;
      const cx=w/2,cy=h-105;
      const card=disposable(scene.add.rectangle(cx,cy,width,height,0xfffcf1,.98)
        .setStrokeStyle(5,0x101016).setDepth(BASE+22)
        .setScrollFactor(0).setInteractive({useHandCursor:true}));
      card.on('pointerdown',advance);
      let speakerName=page.speakerLabel || characters[speaker]?.name || 'TOKYO SHIFT';
      if(speaker===assets.playerId){
        const first=String(scene.registry.get('firstName')||'').trim();
        const last=String(scene.registry.get('lastName')||'').trim();
        speakerName=([first,last].filter(Boolean).join(' ')||characters[speaker]?.name||'PLAYER');
      }
      const nameWidth=Math.min(365,width*.39),x0=cx-width/2;
      disposable(scene.add.rectangle(x0+nameWidth/2+18,cy-height/2-12,nameWidth,34,0x101016,1)
        .setDepth(BASE+24).setScrollFactor(0));
      disposable(scene.add.text(x0+36,cy-height/2-12,speakerName.toUpperCase(),{
        fontFamily:FONT,fontSize:'10px',color:'#ffffff',
        wordWrap:{width:nameWidth-28},
      }).setOrigin(0,.5).setDepth(BASE+25).setScrollFactor(0));
      disposable(scene.add.text(x0+34,cy-21,String(page.text||''),{
        fontFamily:BODY,fontSize:'17px',fontStyle:'700',color:'#111111',
        wordWrap:{width:width-68},lineSpacing:5,
      }).setOrigin(0,.5).setDepth(BASE+25).setScrollFactor(0));
      const last=state.pageIndex===definition.pages.length-1;
      const actionText=last?definition.finalActionLabel||'CONTINUE':'NEXT';
      const bx=cx+width/2-150,by=cy+height/2-21;
      const btn=disposable(scene.add.rectangle(bx,by,265,36,0x111111,1)
        .setDepth(BASE+26).setScrollFactor(0).setInteractive({useHandCursor:true}));
      btn.on('pointerdown',advance);
      disposable(scene.add.text(bx,by,actionText+'  >',{
        fontFamily:FONT,fontSize:'8px',color:'#ffffff',
      }).setOrigin(.5).setDepth(BASE+27).setScrollFactor(0));
      disposable(scene.add.text(x0+36,by,
        String(state.pageIndex+1).padStart(2,'0')+' / '+
        String(definition.pages.length).padStart(2,'0'),{
          fontFamily:FONT,fontSize:'8px',color:'#333333',
        }).setOrigin(0,.5).setDepth(BASE+27).setScrollFactor(0));
    }
    function advance(){
      if(!state.active||state.phase!=='dialogue')return;
      if(state.lastAdvanceAt && Date.now()-state.lastAdvanceAt<110)return;
      state.lastAdvanceAt=Date.now();
      const id=scenes[state.index],def=CHAPTER09_SCENES[id];
      if(state.pageIndex+1<def.pages.length){
        state.pageIndex++;
        drawPage();
        return;
      }
      if(!preview){
        markCutsceneSeen(scene.registry,id);
        saveSessionState(scene.registry);
      }
      state.index++;
      state.pageIndex=0;
      if(state.index>=scenes.length){complete(false);return;}
      drawPage(); // same background and cast objects — NO scene rebuild
    }
    function complete(skipped){
      if(!state.active||state.phase==='closing')return;
      state.phase='closing';
      if(skipped&&!preview){
        for(const id of scenes.slice(state.index))markCutsceneSeen(scene.registry,id);
        saveSessionState(scene.registry);
      }
      removeDialogue();
      // The registration room stays visible until its final fade to black.
      scene.tweens.add({
        targets:curtain,alpha:1,duration:440,ease:'Sine.easeIn',
        onComplete:()=>{
          if(!cleanup()||shuttingDown)return;
          onComplete?.({preview,skipped});
        },
      });
    }
    state.advance=advance;
    state.skip=()=>complete(true);
    state.showScene=(i)=>{
      if(i<0||i>=scenes.length)return;
      state.index=i;state.pageIndex=0;state.phase='dialogue';drawPage();
    };
  };

  const missing=new Map();
  if(!scene.textures.exists(assets.background.key))
    missing.set(assets.background.key,assets.background.path+'?v=20261018-r580');
  for(const [key,path] of chapter09PortraitAssets(assets)){
    if(!scene.textures.exists(key))missing.set(key,path);
  }
  if(!missing.size)start();
  else{
    for(const [key,path] of missing)scene.load.image(key,path);
    loadHandler=()=>{loadHandler=null;start();};
    scene.load.once(Phaser.Loader.Events.COMPLETE,loadHandler);
    if(!scene.load.isLoading?.())scene.load.start();
  }
  return state;
}
