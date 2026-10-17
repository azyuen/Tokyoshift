// R579: full-screen establishing shot before Chapter 09's four dialogue
// scenes. Pure presentation: no story flags, payments, rewards or scene travel.
import { CENTRAL_TOKYO_LOCATIONS } from '../data/centralTokyo.js?v=20261017-r579';
import { getCharacterAssetUrl, getCharacterVisualAsset } from '../data/characters.js?v=20261017-r578';

const PIXEL_FONT='"Silkscreen", monospace';
const LEFT_CREW=Object.freeze([
  {id:'sayakaFujieda',pose:'track',x:.145,height:278},
  {id:'daichiSakamoto',pose:'idle',x:.257,height:294},
  {id:'$PLAYER',pose:'idle',x:.374,height:302},
]);
const RIGHT_CREW=Object.freeze([
  {id:'ryujiTakahashi',pose:'normal',x:.624,height:294},
  {id:'masatoKuroda',pose:'normal',x:.716,height:270},
  {id:'hiroshiSato',pose:'normal',x:.795,height:254},
  {id:'kentaIshikawa',pose:'normal',x:.87,height:239},
  {id:'tomoSakamoto',pose:'normal',x:.947,height:226},
]);
export const CHAPTER09_GROUPS=Object.freeze({left:LEFT_CREW,right:RIGHT_CREW});

export function chapter09ShotAssets(scene) {
  const phase=String(scene?.worldPhase || 'night').toLowerCase()==='day'?'day':'night';
  const background=CENTRAL_TOKYO_LOCATIONS.drag.phaseBackgrounds[phase];
  const playerId=scene?.registry?.get?.('playerCharacterId') || 'renMizuno';
  const resolved=group=>group.map(entry=>({
    ...entry,id:entry.id==='$PLAYER'?playerId:entry.id,
    asset:getCharacterVisualAsset(entry.id==='$PLAYER'?playerId:entry.id,entry.pose,{
      playerCharacterId:playerId,
    }),
  }));
  return {background,left:resolved(LEFT_CREW),right:resolved(RIGHT_CREW)};
}

export function playChapter09EstablishingShot(scene,{onComplete=null,onCancel=null}={}) {
  if(!scene?.textures || !scene?.load || scene._chapter09Establishing?.active)return null;
  const assets=chapter09ShotAssets(scene), objects=[], timers=[];
  const state={active:true,exiting:false,cancel:null};
  scene._chapter09Establishing=state;
  const add=obj=>{objects.push(obj);return obj;};
  const later=(ms,fn)=>timers.push(scene.time.delayedCall(ms,()=>{
    if(state.active && scene?.sys?.isActive?.())fn();
  }));
  let loadDone=null;
  const cleanup=()=>{
    if(!state.active)return false;
    state.active=false;
    timers.forEach(t=>t?.remove?.(false));
    if(loadDone)scene.load.off(Phaser.Loader.Events.COMPLETE,loadDone);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN,cancel);
    scene.events.off(Phaser.Scenes.Events.DESTROY,cancel);
    objects.forEach(obj=>{
      try {scene.tweens.killTweensOf(obj);obj?.destroy?.();} catch(e){}
    });
    if(scene._chapter09Establishing===state)scene._chapter09Establishing=null;
    return true;
  };
  const cancel=()=>{
    if(cleanup())onCancel?.();
  };
  state.cancel=cancel;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,cancel);
  scene.events.once(Phaser.Scenes.Events.DESTROY,cancel);

  const start=()=>{
    if(!state.active || !scene?.sys?.isActive?.())return;
    const w=Number(scene.scale?.width||1560),h=Number(scene.scale?.height||840);
    const imageScale=(source,bw,bh)=>Math.max(bw/Math.max(1,source.width),bh/Math.max(1,source.height));
    const footY=h*.823;
    add(scene.add.rectangle(w/2,h/2,w,h,0x04090f,1)
      .setDepth(820).setScrollFactor(0));
    if(scene.textures.exists(assets.background.key)){
      const backdrop=add(scene.add.image(w/2,h/2,assets.background.key)
        .setDepth(821).setScrollFactor(0));
      const source=scene.textures.get(assets.background.key).getSourceImage();
      backdrop.setScale(imageScale(source,w,h));
      scene.textures.get(assets.background.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
    }
    add(scene.add.rectangle(w/2,h/2,w,h,0x06101a,.19)
      .setDepth(822).setScrollFactor(0));
    // Ground the silhouettes at the track foreground instead of floating
    // them in MangaCutscene's close-up portrait positions.
    const groupSprites={left:[],right:[]};
    const renderCrew=(group,side)=>{
      for(const entry of group){
        if(!entry.asset?.key || !scene.textures.exists(entry.asset.key))continue;
        const source=scene.textures.get(entry.asset.key).getSourceImage();
        const height=h*entry.height/840;
        const scale=Math.min(height/Math.max(1,source.height),
          (side==='left'?w*.107:w*.086)/Math.max(1,source.width));
        const x=w*entry.x;
        const shadow=add(scene.add.ellipse(x,footY-5,Math.max(42,scale*source.width*.67),18,
          0x000000,.5).setDepth(824).setScrollFactor(0).setAlpha(0));
        const sprite=add(scene.add.image(x,footY,entry.asset.key)
          .setOrigin(.5,1).setScale(scale)
          .setFlipX(side==='right').setDepth(825)
          .setScrollFactor(0).setAlpha(0));
        scene.textures.get(entry.asset.key).setFilter?.(Phaser.Textures.FilterMode.NEAREST);
        groupSprites[side].push(sprite,shadow);
      }
    };
    renderCrew(assets.left,'left');
    renderCrew(assets.right,'right');
    const tag=(x,y,str,size,color='#ffffff')=>add(scene.add.text(x,y,str,{
      fontFamily:PIXEL_FONT,fontSize:size+'px',color,
      stroke:'#081019',strokeThickness:4,
    }).setOrigin(.5).setDepth(832).setScrollFactor(0).setAlpha(0));
    const headline=tag(w/2,h*.12,'TOKYO DRAG COMPLEX',Math.max(12,w*.013));
    const subheading=tag(w/2,h*.172,'CHAPTER 09 // WELCOME TO THE BIG LEAGUES',Math.max(8,w*.0077),'#ffe4e9');
    const leftLabel=tag(w*.26,h*.88,'THE NEW CREW',Math.max(8,w*.008));
    const rightLabel=tag(w*.78,h*.88,'THE OLD GUARD',Math.max(8,w*.008));
    const hint=tag(w/2,h*.948,'TAP TO CONTINUE',Math.max(8,w*.007),'#ffffff');
    const curtain=add(scene.add.rectangle(w/2,h/2,w,h,0x000000,1)
      .setDepth(855).setScrollFactor(0));
    const touch=add(scene.add.rectangle(w/2,h/2,w,h,0x000000,.001)
      .setDepth(860).setScrollFactor(0).setInteractive({useHandCursor:true}));
    const fadeIn=targets=>scene.tweens.add({
      targets,alpha:1,duration:680,ease:'Sine.easeOut',
    });
    const finish=()=>{
      if(!state.active || state.exiting)return;
      state.exiting=true;
      touch.disableInteractive();
      scene.tweens.add({targets:curtain,alpha:1,duration:400,ease:'Sine.easeIn',
        onComplete:()=>{
          if(!cleanup())return;
          onComplete?.();
        },
      });
    };
    touch.on('pointerdown',()=>{
      // Ignore accidental taps during fade-in, but allow early continuation
      // after both groups are visible on touchscreens.
      if(state.readyForTap)finish();
    });
    scene.tweens.add({targets:curtain,alpha:0,duration:1050,ease:'Sine.easeInOut'});
    later(680,()=>{
      fadeIn(groupSprites.left);
      fadeIn(groupSprites.right);
      fadeIn([headline,subheading,leftLabel,rightLabel]);
    });
    later(1850,()=>{state.readyForTap=true;fadeIn([hint]);});
    later(4850,finish); // automatic continuation, no mandatory tap
  };

  const missing=new Map();
  if(!scene.textures.exists(assets.background.key))
    missing.set(assets.background.key,assets.background.path+'?v=20261017-r579');
  for(const entry of [...assets.left,...assets.right]){
    if(entry.asset?.key && entry.asset?.path && !scene.textures.exists(entry.asset.key))
      missing.set(entry.asset.key,getCharacterAssetUrl(entry.asset.path));
  }
  if(!missing.size){
    start();
  }else{
    for(const [key,path] of missing)scene.load.image(key,path);
    loadDone=()=>{loadDone=null;start();};
    scene.load.once(Phaser.Loader.Events.COMPLETE,loadDone);
    if(!scene.load.isLoading?.())scene.load.start();
  }
  return state;
}
