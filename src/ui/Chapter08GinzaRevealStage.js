// Chapter 08's dedicated full-screen Ginza tableau. The underlying
// Central Tokyo showroom HUD remains mounted but is completely covered.
// The SAME scene survives the pre-reveal manga, Porsche reveal and outfit
// change; it never starts a new gameplay scene or changes race/save state.
import { getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261022-r645';
import { cars } from '../data/cars.js?v=20261026-r687';
import { preloadStoryCar, renderStoryCar } from './StoryCarRenderer.js?v=20261022-r642';

const DEPTH = 800;
const background = {
  key:'chapter08GinzaFullScreenNight',
  path:'assets/CentralTokyo/tokyo_ginza_night.png',
};

export function playChapter08GinzaRevealStage(scene,{onReady=null,onCancel=null}={}) {
  if (!scene?.textures || !scene?.load || scene._chapter08GinzaStage?.active) return null;
  const playerId = scene.registry?.get?.('playerCharacterId') || 'renMizuno';
  const looks = {
    kaede:getCharacterVisualAsset('kaedeTachibana','ginzaIdle',{playerCharacterId:playerId}),
    player:getCharacterVisualAsset(playerId,'idle',{playerCharacterId:playerId}),
    sayaka:getCharacterVisualAsset('sayakaFujieda','ginzaNormal',{playerCharacterId:playerId}),
    proSayaka:getCharacterVisualAsset('sayakaFujieda','track',{playerCharacterId:playerId}),
  };
  const all=[],timers=[];
  let alive=true,loadHandler=null,wardrobeActive=false;
  const actorObjects={};
  const own=obj=>{if(obj)all.push(obj);return obj;};
  const state={
    active:true,ready:false,revealSayaka:null,dismissSayaka:null,
    changeSayakaOutfit:null,restoreAfterOutfit:null,destroy:null,
  };
  scene._chapter08GinzaStage=state;
  const cleanup=()=>{
    if(!alive)return false;
    alive=false;state.active=false;
    if(loadHandler)scene.load.off(Phaser.Loader.Events.COMPLETE,loadHandler);
    timers.forEach(timer=>timer?.remove?.(false));
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN,abort);
    scene.events.off(Phaser.Scenes.Events.DESTROY,abort);
    all.forEach(obj=>{try{scene.tweens.killTweensOf(obj);obj?.destroy?.();}catch(_){}});
    if(scene._chapter08GinzaStage===state)scene._chapter08GinzaStage=null;
    return true;
  };
  const abort=()=>{if(cleanup())onCancel?.({reason:'shutdown'});};
  state.destroy=cleanup;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,abort);
  scene.events.once(Phaser.Scenes.Events.DESTROY,abort);
  const after=(ms,cb)=>{
    const timer=scene.time.delayedCall(ms,()=>{
      if(alive&&scene.sys?.isActive?.())cb();
    });
    timers.push(timer);
  };
  const fade=(target,alpha,duration,done=null)=>scene.tweens.add({
    targets:target,alpha,duration,ease:'Sine.easeInOut',
    ...(done?{onComplete:done}:{}),
  });

  const start=()=>{
    if(!alive||!scene.sys?.isActive?.())return;
    const w=Number(scene.scale.width||1560),h=Number(scene.scale.height||840);
    own(scene.add.rectangle(w/2,h/2,w,h,0x050913,1)
      .setDepth(DEPTH).setScrollFactor(0));
    const bg=own(scene.add.image(w/2,h/2,background.key)
      .setDepth(DEPTH+1).setScrollFactor(0));
    const bsrc=scene.textures.get(background.key).getSourceImage();
    bg.setScale(Math.max(w/Math.max(1,bsrc.width),h/Math.max(1,bsrc.height)));
    scene.textures.get(background.key)
      .setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    own(scene.add.rectangle(w/2,h/2,w,h,0x070b17,.19)
      .setDepth(DEPTH+2).setScrollFactor(0));
    if(cars.rwbStellaPorsche){
      renderStoryCar(scene,cars.rwbStellaPorsche,{
        x:w*.51,groundY:h*.78,targetWidth:w*.58,depth:DEPTH+8,
        paintColor:0xffffff,
      }).forEach(own);
    }

    const addActor=(name,asset,x,feet,height,flip=false)=>{
      if(!asset?.key||!scene.textures.exists(asset.key))return null;
      const src=scene.textures.get(asset.key).getSourceImage();
      const scale=Math.min(h*height/840/Math.max(1,src.height),
        w*.20/Math.max(1,src.width));
      const sprite=own(scene.add.image(w*x,h*feet,asset.key)
        .setOrigin(.5,1).setScale(scale).setFlipX(flip)
        .setDepth(DEPTH+17).setScrollFactor(0));
      actorObjects[name]={sprite,feet,height,asset};
      return sprite;
    };
    addActor('kaede',looks.kaede,.16,.91,450);
    addActor('player',looks.player,.86,.91,465,true);
    const sayaka=addActor('sayaka',looks.sayaka,.41,.91,460);
    sayaka?.setAlpha(0);
    // Full-screen input shield: the persistent showroom controls under this
    // cinematic must never receive accidental taps.
    own(scene.add.rectangle(w/2,h/2,w,h,0xffffff,.0001)
      .setDepth(DEPTH+45).setScrollFactor(0).setInteractive());

    state.revealSayaka=cb=>{
      if(!alive||!state.ready||wardrobeActive)return false;
      const kaede=actorObjects.kaede?.sprite;
      if(kaede)fade(kaede,.08,470);
      if(sayaka)fade(sayaka,1,1040);
      after(1110,()=>cb?.());
      return true;
    };
    state.dismissSayaka=()=>{
      if(!alive||wardrobeActive)return false;
      if(sayaka)fade(sayaka,0,520);
      return true;
    };
    state.changeSayakaOutfit=cb=>{
      if(!alive||wardrobeActive||!looks.proSayaka?.key||
          !scene.textures.exists(looks.proSayaka.key)||!sayaka)return false;
      wardrobeActive=true;
      const savedDepths=all.map(obj=>[obj,obj.depth]);
      // Temporarily bring the real location tableau ABOVE manga so the
      // costume change can be seen without a new scene/loading flash.
      savedDepths.forEach(([obj,depth])=>obj.setDepth(depth+300));
      state.restoreAfterOutfit=()=>{
        if(!alive)return;
        savedDepths.forEach(([obj,depth])=>obj?.active&&obj.setDepth(depth));
        sayaka.setAlpha(0);
        wardrobeActive=false;
      };
      sayaka.setTexture(looks.sayaka.key);
      const before=scene.textures.get(looks.sayaka.key).getSourceImage();
      sayaka.setScale(Math.min(h*actorObjects.sayaka.height/840/Math.max(1,before.height),
        w*.20/Math.max(1,before.width)));
      fade(sayaka,1,480,()=>{
        if(!alive)return;
        after(500,()=>{
          fade(sayaka,0,380,()=>{
            if(!alive)return;
            const src=scene.textures.get(looks.proSayaka.key).getSourceImage();
            sayaka.setTexture(looks.proSayaka.key);
            sayaka.setScale(Math.min(h*actorObjects.sayaka.height/840/Math.max(1,src.height),
              w*.20/Math.max(1,src.width)));
            fade(sayaka,1,690,()=>{if(alive)cb?.();});
          });
        });
      });
      return true;
    };
    state.ready=true;
    onReady?.(state);
  };

  const missing=new Map();
  for(const asset of [background,...Object.values(looks)]){
    if(asset?.key&&asset?.path&&!scene.textures.exists(asset.key))
      missing.set(asset.key,getCharacterAssetUrl(asset.path));
  }
  const carQueued=cars.rwbStellaPorsche
    ? preloadStoryCar(scene,cars.rwbStellaPorsche):0;
  missing.forEach((url,key)=>scene.load.image(key,url));
  if(missing.size||carQueued){
    loadHandler=()=>{loadHandler=null;start();};
    scene.load.once(Phaser.Loader.Events.COMPLETE,loadHandler);
    if(!scene.load.isLoading?.())scene.load.start();
  }else start();
  return state;
}
