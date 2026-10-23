// R671 — the ACTUAL approved Arkon/Sayaka rear-view asset replaces the
// provisional block silhouettes. No artificial black footer over Yokohama.
// After a long uninterrupted fade, Chapter 06's conclusion appears.
import {showStoryStage} from './StoryStage.js?v=20261023-r671';
const PIXEL='"Silkscreen", monospace',BODY='"Rajdhani", sans-serif';
const WATCH_ASSET={
  key:'arkonSayakaWatchingStory',
  path:'assets/Characters/Main/arkon_sayaka_watching.png',
};
export function showArkonChapter06Finale(scene,{onComplete}={}){
  if(!scene?.add||scene._arkonCh6Finale?.active)return null;
  let closed=false,ending=false;
  const objects=[],add=o=>(objects.push(o),o);
  // The Meet was switched to the Ferris wheel before RaceScene exited.
  // Reuse its live scenery and only draw the lifted, smaller RWB on top.
  const stage=showStoryStage(scene,{
    backgroundId:'$CURRENT_MEET',
    stageMode:'native',characters:[],depth:158,
    cars:[{carId:'rwbStellaPorsche'}],
    meetCarLayout:'yokohamaGift',
  });
  if(!stage)return null;
  const destroy=()=>{
    if(closed)return;
    closed=true;
    scene.load?.off?.(Phaser.Loader.Events.COMPLETE,displayPair);
    objects.forEach(o=>{
      scene.tweens?.killTweensOf?.(o);
      o?.destroy?.();
    });
    stage?.destroy?.();
    scene.events?.off?.('shutdown',destroy);
    if(scene._arkonCh6Finale===control)scene._arkonCh6Finale=null;
  };
  const control={active:true,destroy};
  scene._arkonCh6Finale=control;
  scene.events?.once?.('shutdown',destroy);
  const blocker=add(scene.add.rectangle(780,420,1560,840,0x000000,.0001)
    .setDepth(1400).setScrollFactor(0).setInteractive());
  // The complete photograph remains unobstructed: no black baseline/strip.
  const displayPair=()=>{
    if(closed||scene.sys?.isActive?.()===false ||
      !scene.textures?.exists?.(WATCH_ASSET.key))return;
    const texture=scene.textures.get(WATCH_ASSET.key);
    const src=texture.getSourceImage();
    const height=382;
    const width=height*(src?.width||1024)/Math.max(1,src?.height||1536);
    const pair=add(scene.add.image(461,613,WATCH_ASSET.key)
      .setOrigin(.5,1).setDisplaySize(width,height)
      .setDepth(1450).setScrollFactor(0));
    pair.setAlpha(0);
    scene.tweens?.add?.({targets:pair,alpha:1,duration:1800,ease:'Sine.InOut'});
  };
  if(scene.textures.exists(WATCH_ASSET.key))displayPair();
  else{
    scene.load.image(WATCH_ASSET.key,WATCH_ASSET.path);
    scene.load.once(Phaser.Loader.Events.COMPLETE,displayPair);
    if(!scene.load.isLoading())scene.load.start();
  }
  const title=add(scene.add.text(790,137,'EVERYTHING WE BUILT',{
    fontFamily:PIXEL,fontSize:'17px',color:'#fff2dd',
    stroke:'#172233',strokeThickness:5,
  }).setOrigin(.5).setDepth(1490).setScrollFactor(0));
  const subtitle=add(scene.add.text(790,171,'YOKOHAMA  //  JUST THE TWO OF THEM',{
    fontFamily:BODY,fontSize:'15px',color:'#d5e9f0',
    stroke:'#172233',strokeThickness:4,
  }).setOrigin(.5).setDepth(1490).setScrollFactor(0));
  void title;void subtitle;void blocker;
  // An unobtrusive Continue control lives in the right action column;
  // the waterfront image is not hidden by large bottom bars.
  const button=add(scene.add.rectangle(1360,748,322,64,0x173a42,.96)
    .setStrokeStyle(2,0x90e7d6)
    .setDepth(1510).setScrollFactor(0)
    .setInteractive({useHandCursor:true}));
  const label=add(scene.add.text(1360,748,'FINISH CHAPTER 06  >',{
    fontFamily:PIXEL,fontSize:'11px',color:'#ffffff',
  }).setOrigin(.5).setDepth(1511).setScrollFactor(0));
  const black=add(scene.add.rectangle(780,420,1560,840,0x02060e,1)
    .setAlpha(0).setDepth(1700).setScrollFactor(0));
  const showEndingCard=()=>{
    if(closed)return;
    const popup=add(scene.add.rectangle(780,421,845,337,0x0a1d2b,.99)
      .setStrokeStyle(2,0x9bcad7)
      .setDepth(1720).setScrollFactor(0));
    const headline=add(scene.add.text(780,352,'CHAPTER 06 COMPLETE',{
      fontFamily:PIXEL,fontSize:'22px',color:'#ffe7b7',
    }).setOrigin(.5).setDepth(1721).setScrollFactor(0));
    const description=add(scene.add.text(780,410,
      'EVERYTHING WE BUILT\nTHE PORSCHE NOW BELONGS TO SAYAKA',{
        fontFamily:BODY,fontSize:'20px',color:'#e4edf5',
        align:'center',lineSpacing:9,
      }).setOrigin(.5).setDepth(1721).setScrollFactor(0));
    const exit=add(scene.add.rectangle(780,518,334,58,0x1d5756,1)
      .setStrokeStyle(2,0x9be7dc).setDepth(1722)
      .setScrollFactor(0).setInteractive({useHandCursor:true}));
    const exitLabel=add(scene.add.text(780,518,'RETURN TO TOKYO',{
      fontFamily:PIXEL,fontSize:'12px',color:'#ffffff',
    }).setOrigin(.5).setDepth(1723).setScrollFactor(0));
    void popup;void headline;void description;void exitLabel;
    exit.once('pointerdown',()=>{
      if(closed)return;
      destroy();onComplete?.();
    });
  };
  button.once('pointerdown',()=>{
    if(ending||closed)return;
    ending=true;
    button.disableInteractive().setVisible(false);
    label.setVisible(false);
    // 5 seconds, no immediate popup: let the final waterfront image fade
    // completely into black before revealing the chapter completion.
    scene.tweens.add({targets:black,alpha:1,duration:5000,
      ease:'Sine.InOut',onComplete:()=>{
        if(!closed)scene.time.delayedCall(900,showEndingCard);
      }});
  });
  return control;
}
