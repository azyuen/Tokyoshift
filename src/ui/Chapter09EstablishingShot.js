// R582 — Rego room establishing beats used BETWEEN the original zoomed manga
// cutscenes. This module owns no dialogue or career state.
import { getCharacterAssetUrl, getCharacterVisualAsset } from '../data/characters.js?v=20261017-r578';

const FONT='"Silkscreen", monospace';
const DEPTH=920;
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

export function chapter09ShotAssets(scene){
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
  return {background,left:LEFT.map(resolve),right:RIGHT.map(resolve),mika:resolve(MIKA)};
}

// mode='opening': full six-person lineup, then CONTINUE into normal manga.
// mode='mika': same lineup; Mika's own asset fades in, then CONTINUE into
// the original close-up Mika manga conversation.
export function playChapter09RegoRoom(scene,{mode='opening',onComplete=null,onCancel=null}={}){
  if(!scene?.textures||!scene?.load||scene._chapter09Stage?.active)return null;
  if(!['opening','mika'].includes(mode))return null;
  const assets=chapter09ShotAssets(scene);
  const objects=[],timers=[];
  const state={active:true,mode,phase:'loading',characters:new Map(),continue:null,cancel:null};
  scene._chapter09Stage=state;
  const add=obj=>{objects.push(obj);return obj;};
  let loadHandler=null;
  const cleanup=()=>{
    if(!state.active)return false;
    state.active=false;
    timers.forEach(t=>t?.remove?.(false));
    if(loadHandler)scene.load.off(Phaser.Loader.Events.COMPLETE,loadHandler);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN,cancel);
    scene.events.off(Phaser.Scenes.Events.DESTROY,cancel);
    objects.forEach(obj=>{
      try{scene.tweens.killTweensOf(obj);obj?.destroy?.();}catch(_){}
    });
    if(scene._chapter09Stage===state)scene._chapter09Stage=null;
    return true;
  };
  const cancel=()=>{if(cleanup())onCancel?.();};
  state.cancel=cancel;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,cancel);
  scene.events.once(Phaser.Scenes.Events.DESTROY,cancel);
  const later=(delay,fn)=>{
    const timer=scene.time.delayedCall(delay,()=>{
      if(state.active&&scene.sys?.isActive?.())fn();
    });
    timers.push(timer);
  };

  const start=()=>{
    if(!state.active||!scene.sys?.isActive?.())return;
    const w=Number(scene.scale?.width||1560),h=Number(scene.scale?.height||840);
    const footY=h*.8, tex=scene.textures;
    const tween=(targets,alpha,duration)=>scene.tweens.add({
      targets,alpha,duration,ease:'Sine.easeInOut',
    });
    add(scene.add.rectangle(w/2,h/2,w,h,0x06101a,1).setDepth(DEPTH).setScrollFactor(0));
    const background=add(scene.add.image(w/2,h/2,assets.background.key)
      .setDepth(DEPTH+1).setScrollFactor(0));
    const source=tex.get(assets.background.key).getSourceImage();
    background.setScale(Math.max(w/Math.max(1,source.width),h/Math.max(1,source.height)));
    tex.get(assets.background.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    add(scene.add.rectangle(w/2,h/2,w,h,0x020713,.13)
      .setDepth(DEPTH+2).setScrollFactor(0));

    const createActor=(entry,right=false,isMika=false)=>{
      if(!entry.asset?.key||!tex.exists(entry.asset.key))return;
      const texture=tex.get(entry.asset.key);
      texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
      const s=texture.getSourceImage();
      const size=Math.min((h*entry.height/840)/Math.max(1,s.height),
        (w*(isMika ? .118 : right ? .116 : .12))/Math.max(1,s.width));
      const x=w*entry.x;
      const shadow=add(scene.add.ellipse(x,footY-5,Math.max(40,size*s.width*.55),16,0x000000,.36)
        .setDepth(DEPTH+4).setScrollFactor(0).setAlpha(0));
      const sprite=add(scene.add.image(x,footY,entry.asset.key)
        .setOrigin(.5,1).setScale(size).setFlipX(Boolean(right))
        .setDepth(DEPTH+5+(isMika?1:0)).setScrollFactor(0).setAlpha(0));
      state.characters.set(entry.id,{sprite,shadow});
    };
    assets.left.forEach(entry=>createActor(entry));
    assets.right.forEach(entry=>createActor(entry,true));
    if(mode==='mika')createActor(assets.mika,false,true);

    const label=(x,y,value,size,color='#fff',depth=DEPTH+18)=>{
      return add(scene.add.text(x,y,value,{
        fontFamily:FONT,fontSize:size+'px',color,
        stroke:'#081019',strokeThickness:3,
      }).setOrigin(.5).setDepth(depth).setScrollFactor(0));
    };
    label(w/2,h*.09,'CHAPTER 09 // WELCOME TO THE BIG LEAGUES',13);
    label(w/2,h*.15,'TOKYO DRAG COMPLEX // REGISTRATION ROOM',10,'#f3c6d5');
    if(mode==='mika')label(w/2,h*.23,'AN UNEXPECTED VISITOR',9,'#ffe9b8');

    // A real button, not an automatically advancing slideshow; avoids taking
    // a player's first tap as a dialogue-page advance.
    const buttonY=h*.922,buttonX=w/2;
    const button=add(scene.add.rectangle(buttonX,buttonY,330,52,0x111922,.96)
      .setStrokeStyle(2,0xffc4dc).setDepth(DEPTH+35)
      .setScrollFactor(0).setInteractive({useHandCursor:true}).setAlpha(0));
    const buttonText=label(buttonX,buttonY,'CONTINUE  >',10,'#ffffff',DEPTH+36);
    buttonText.setAlpha(0);
    const curtain=add(scene.add.rectangle(w/2,h/2,w,h,0x000000,1)
      .setDepth(DEPTH+48).setScrollFactor(0));
    state.phase='opening';
    const showContinue=()=>{
      if(!state.active||state.phase!=='opening')return;
      state.phase='ready';
      tween([button,buttonText],1,320);
    };
    state.continue=()=>{
      if(!state.active||state.phase!=='ready')return false;
      state.phase='closing';
      button.disableInteractive();
      scene.tweens.add({targets:curtain,alpha:1,duration:420,ease:'Sine.easeIn',
        onComplete:()=>{
          if(!cleanup())return;
          onComplete?.();
        },
      });
      return true;
    };
    button.on('pointerdown',()=>state.continue());
    tween(curtain,0,930);
    later(280,()=>{
      for(const [id,person]of state.characters){
        if(id===MIKA.id)continue;
        tween([person.sprite,person.shadow],.86,650);
      }
    });
    if(mode==='mika'){
      later(1120,()=>{
        const visitor=state.characters.get(MIKA.id);
        if(visitor)tween([visitor.sprite,visitor.shadow],.98,930);
      });
      later(2200,showContinue);
    }else{
      later(1320,showContinue);
    }
  };

  const missing=new Map();
  if(!scene.textures.exists(assets.background.key))
    missing.set(assets.background.key,assets.background.path+'?v=20261018-r582');
  const participants=[...assets.left,...assets.right,...(mode==='mika'?[assets.mika]:[])];
  for(const person of participants){
    if(person.asset?.key&&person.asset?.path&&!scene.textures.exists(person.asset.key)){
      missing.set(person.asset.key,getCharacterAssetUrl(person.asset.path));
    }
  }
  if(!missing.size)start();
  else{
    for(const [key,path]of missing)scene.load.image(key,path);
    loadHandler=()=>{loadHandler=null;start();};
    scene.load.once(Phaser.Loader.Events.COMPLETE,loadHandler);
    if(!scene.load.isLoading?.())scene.load.start();
  }
  return state;
}
