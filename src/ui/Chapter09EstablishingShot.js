// R583: Persistent registration-room background UNDER the original manga.
// One stage lives from the opening group tableau through all four dialogues.
// The manga is drawn on top (900+); the room and sprites stay at 810–858.
import {getCharacterAssetUrl,getCharacterVisualAsset} from '../data/characters.js?v=20261022-r635';

const FONT='"Silkscreen", monospace';
export const CHAPTER09_STAGE_DEPTH=810;
// R585: larger (150% of R583), closer and subtly staggered as two
// conversational groups instead of six evenly spaced cutouts.
const LEFT=Object.freeze([
  {id:'sayakaFujieda',pose:'track',x:.187,feet:.816,height:420},
  {id:'daichiSakamoto',pose:'idle',x:.280,feet:.790,height:418.5},
  {id:'$PLAYER',pose:'idle',x:.386,feet:.825,height:435},
]);
const RIGHT=Object.freeze([
  {id:'ryujiTakahashi',pose:'normal',x:.644,feet:.824,height:429},
  {id:'masatoKuroda',pose:'normal',x:.745,feet:.790,height:406.5},
  {id:'hiroshiSato',pose:'normal',x:.857,feet:.815,height:405},
]);
const MIKA=Object.freeze({id:'mikaHayaseChampion',pose:'idle',x:.523,feet:.814,height:438});
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
    // Chapter 09 begins in the SAME ordinary clothes as the street career.
    // The team changes only after the final dialogue, on the room stage.
    return {...entry,id,asset:getCharacterVisualAsset(id,entry.pose,{playerCharacterId:playerId})};
  };
  const proPlayer=getCharacterVisualAsset(playerId,'idle',{
    playerCharacterId:playerId,proCircuit:true,
  });
  const costumes=[
    {id:'daichiSakamoto',asset:{
      key:'chapter09DaichiProfessional',path:'assets/Characters/Main/pro_daichi_sakamoto.png',
    }},
    {id:playerId,asset:proPlayer},
  ];
  return {background,left:LEFT.map(resolve),right:RIGHT.map(resolve),
    mika:resolve(MIKA),costumes};
}

export function playChapter09RegoRoom(scene,{onContinue=null,onCancel=null}={}){
  if(!scene?.textures||!scene?.load||scene._chapter09Stage?.active)return null;
  const assets=chapter09ShotAssets(scene),objects=[],timers=[];
  const state={active:true,phase:'loading',characters:new Map(),continue:null,
    showMika:null,hideMika:null,showProOutfits:null,finish:null,destroy:null,cancel:null};
  scene._chapter09Stage=state;
  const add=obj=>{objects.push(obj);return obj;};
  let loadHandler=null;
  const cleanup=()=>{
    if(!state.active)return false;
    state.active=false;
    if(loadHandler)scene.load.off(Phaser.Loader.Events.COMPLETE,loadHandler);
    timers.forEach(timer=>timer?.remove?.(false));
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
  state.destroy=cleanup;
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
    const tex=scene.textures,base=CHAPTER09_STAGE_DEPTH;
    const tween=(targets,alpha,duration)=>scene.tweens.add({
      targets,alpha,duration,ease:'Sine.easeInOut',
    });
    // Opaque room image hides Garage / Warehouse / Meet until Chapter 09 ends.
    add(scene.add.rectangle(w/2,h/2,w,h,0x06101a,1)
      .setDepth(base).setScrollFactor(0));
    const background=add(scene.add.image(w/2,h/2,assets.background.key)
      .setDepth(base+1).setScrollFactor(0));
    const source=tex.get(assets.background.key).getSourceImage();
    background.setScale(Math.max(w/Math.max(1,source.width),h/Math.max(1,source.height)));
    tex.get(assets.background.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    add(scene.add.rectangle(w/2,h/2,w,h,0x020713,.12)
      .setDepth(base+2).setScrollFactor(0));

    const createActor=(entry,right=false,isMika=false)=>{
      if(!entry.asset?.key||!tex.exists(entry.asset.key))return;
      const texture=tex.get(entry.asset.key);
      texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
      const s=texture.getSourceImage();
      // Width cap increases with height so large silhouettes are not
      // accidentally reduced back to their former size by the width clamp.
      const scale=Math.min((h*entry.height/840)/Math.max(1,s.height),
        (w*(isMika ? .177 : right ? .174 : .18))/Math.max(1,s.width));
      const x=w*entry.x,footY=h*entry.feet;
      const depthOffset=(entry.feet-.79)*10; // closer feet draw in front
      // Six main characters are always fully visible; only Mika's special
      // entrance/exit uses an individual fade.
      const initialAlpha=isMika?0:1;
      const shadow=add(scene.add.ellipse(x,footY-5,Math.max(52,scale*s.width*.55),
        23,0x000000,.36).setDepth(base+4+depthOffset).setScrollFactor(0).setAlpha(initialAlpha));
      const sprite=add(scene.add.image(x,footY,entry.asset.key)
        .setOrigin(.5,1).setScale(scale).setFlipX(Boolean(right))
        .setDepth(base+5+depthOffset+(isMika ? .1 : 0)).setScrollFactor(0).setAlpha(initialAlpha));
      state.characters.set(entry.id,{sprite,shadow,entry,right,isMika});
    };
    assets.left.forEach(entry=>createActor(entry));
    assets.right.forEach(entry=>createActor(entry,true));
    // Pre-create Mika once, hidden until the manga Rules scene ends.
    createActor(assets.mika,false,true);

    const text=(x,y,value,size,color='#fff',depth=base+18)=>add(scene.add.text(x,y,value,{
      fontFamily:FONT,fontSize:size+'px',color,
      stroke:'#081019',strokeThickness:3,
    }).setOrigin(.5).setDepth(depth).setScrollFactor(0));
    text(w/2,h*.09,'CHAPTER 09 // WELCOME TO THE BIG LEAGUES',13);
    text(w/2,h*.15,'TOKYO DRAG COMPLEX // REGISTRATION ROOM',10,'#f3c6d5');
    // Capture taps outside CONTINUE while no manga dialogue is on-screen.
    // Otherwise a Garage/Meet button underneath the room could be clicked.
    add(scene.add.rectangle(w/2,h/2,w,h,0x000000,.001)
      .setDepth(base+20).setScrollFactor(0).setInteractive());
    const visitorLabel=text(w/2,h*.23,'AN UNEXPECTED VISITOR',9,'#ffe9b8');
    visitorLabel.setAlpha(0);

    const buttonY=h*.922,buttonX=w/2;
    const button=add(scene.add.rectangle(buttonX,buttonY,330,52,0x111922,.96)
      .setStrokeStyle(2,0xffc4dc).setDepth(base+35)
      .setScrollFactor(0).setInteractive({useHandCursor:true}).setAlpha(0));
    const buttonLabel=text(buttonX,buttonY,'CONTINUE  >',10,'#ffffff',base+36);
    buttonLabel.setAlpha(0);
    const curtain=add(scene.add.rectangle(w/2,h/2,w,h,0x000000,1)
      .setDepth(base+48).setScrollFactor(0));
    const hideControls=()=>{
      button.disableInteractive();
      tween([button,buttonLabel],0,170);
    };
    let nextContinue=onContinue;
    const showControls=()=>{
      if(!state.active||state.phase==='ending')return;
      state.phase='ready';
      button.setInteractive({useHandCursor:true});
      tween([button,buttonLabel],1,260);
    };
    state.continue=()=>{
      if(!state.active||state.phase!=='ready')return false;
      state.phase='background';
      hideControls();
      tween(visitorLabel,0,170);
      const callback=nextContinue;
      nextContinue=null;
      // Keep SAME background and sprites alive underneath the entire manga!
      callback?.();
      return true;
    };
    button.on('pointerdown',()=>state.continue());

    state.showMika=(afterReveal)=>{
      if(!state.active||state.phase!=='background')return false;
      state.phase='mika';
      nextContinue=afterReveal;
      tween(visitorLabel,1,220);
      const visitor=state.characters.get(MIKA.id);
      if(visitor)tween([visitor.sprite,visitor.shadow],1,950);
      later(1040,showControls);
      return true;
    };
    state.hideMika=()=>{
      if(!state.active)return;
      const visitor=state.characters.get(MIKA.id);
      if(visitor)tween([visitor.sprite,visitor.shadow],0,470);
    };
    state.showProOutfits=afterContinue=>{
      if(!state.active||state.phase!=='background')return false;
      state.phase='wardrobe';
      // Only Daichi and the driver change. Sayaka already joined in her
      // professional look at the end of Chapter 08.
      const changes=assets.costumes.map(costume=>({
        actor:state.characters.get(costume.id),asset:costume.asset,
      })).filter(({actor,asset})=>actor?.sprite?.active&&
        asset?.key&&tex.exists(asset.key));
      const sprites=changes.map(x=>x.actor.sprite);
      if(!sprites.length){
        nextContinue=afterContinue;
        showControls();
        return true;
      }
      scene.tweens.add({targets:sprites,alpha:0,duration:390,
        ease:'Sine.easeInOut',onComplete:()=>{
          if(!state.active)return;
          changes.forEach(({actor,asset})=>{
            const src=tex.get(asset.key).getSourceImage();
            const height=actor.entry.height;
            const scale=Math.min((h*height/840)/Math.max(1,src.height),
              (w*.18)/Math.max(1,src.width));
            actor.sprite.setTexture(asset.key).setScale(scale);
            tex.get(asset.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
          });
          scene.tweens.add({targets:sprites,alpha:1,duration:570,
            ease:'Sine.easeInOut',onComplete:()=>{
              if(!state.active)return;
              nextContinue=afterContinue;
              showControls();
            },
          });
        },
      });
      return true;
    };
    state.finish=callback=>{
      if(!state.active||state.phase==='ending')return false;
      state.phase='ending';
      hideControls();
      // The room only exits AFTER the last manga page is completed.
      scene.tweens.add({targets:curtain,alpha:1,duration:430,ease:'Sine.easeIn',
        onComplete:()=>{if(cleanup())callback?.();},
      });
      return true;
    };

    state.phase='opening';
    tween(curtain,0,930);
    // Fade the room itself in, without individually fading or dimming the
    // six permanent character sprites. They stay at 100% during manga.
    later(1340,showControls);
  };

  const missing=new Map();
  if(!scene.textures.exists(assets.background.key))
    missing.set(assets.background.key,assets.background.path+'?v=20261018-r583');
  for(const person of [...assets.left,...assets.right,assets.mika,
    ...assets.costumes]){
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
