// R674 — paired Yokohama finale. Neither car is confiscated or gifted again.
import {showStoryStage} from './StoryStage.js?v=20261023-r674';
const PIXEL='"Silkscreen", monospace',BODY='"Rajdhani", sans-serif';
export const ARKON_CH10_PAIR_ASSET={
  key:'arkonSayakaHoldingHandsR674',
  path:'assets/Characters/Main/arkon_sayaka_holdinghands.png',
};
export function showArkonChapter10Finale(scene,{onComplete}={}){
  if(!scene?.add||scene._arkonCh10Finale?.active||
    scene.registry?.get?.('gameMode')!=='arkonStory'||
    scene.selectedMeetLocation!=='yokohamaMinatoMirai'||
    scene.worldPhase!=='night')return null;
  const objects=[],add=o=>(objects.push(o),o);
  let closed=false,ending=false;
  const stage=showStoryStage(scene,{
    backgroundId:'$CURRENT_MEET',stageMode:'native',depth:158,
    characters:[],meetCarLayout:'yokohamaFinale',
    cars:[{carId:'rwbStellaPorsche'},{carId:'arkonLibertyWalk240z'}],
  });
  if(!stage)return null;
  const display=()=>{
    if(closed||scene.sys?.isActive?.()===false||
       !scene.textures.exists(ARKON_CH10_PAIR_ASSET.key))return;
    const src=scene.textures.get(ARKON_CH10_PAIR_ASSET.key).getSourceImage();
    const height=350,width=height*(src?.width||1024)/Math.max(1,src?.height||1536);
    const pair=add(scene.add.image(545,650,ARKON_CH10_PAIR_ASSET.key)
      .setOrigin(.5,1).setDisplaySize(width,height).setDepth(1450).setScrollFactor(0));
    pair.setAlpha(0);
    scene.tweens?.add?.({targets:pair,alpha:1,duration:2400,ease:'Sine.InOut'});
  };
  const destroy=()=>{
    if(closed)return;
    closed=true;
    scene.load?.off?.(Phaser.Loader.Events.COMPLETE,display);
    objects.forEach(o=>{scene.tweens?.killTweensOf?.(o);o?.destroy?.();});
    stage.destroy();
    scene.events?.off?.('shutdown',destroy);
    if(scene._arkonCh10Finale===control)scene._arkonCh10Finale=null;
  };
  const control={active:true,destroy};
  scene._arkonCh10Finale=control;
  scene.events?.once?.('shutdown',destroy);
  add(scene.add.rectangle(780,420,1560,840,0x000000,.0001)
    .setDepth(1400).setScrollFactor(0).setInteractive());
  if(scene.textures.exists(ARKON_CH10_PAIR_ASSET.key))display();
  else{
    scene.load.image(ARKON_CH10_PAIR_ASSET.key,ARKON_CH10_PAIR_ASSET.path);
    scene.load.once(Phaser.Loader.Events.COMPLETE,display);
    if(!scene.load.isLoading())scene.load.start();
  }
  add(scene.add.text(780,131,'THE ROAD AHEAD',{
    fontFamily:PIXEL,fontSize:'18px',color:'#fff2dd',
    stroke:'#172233',strokeThickness:5,
  }).setOrigin(.5).setDepth(1490).setScrollFactor(0));
  add(scene.add.text(780,164,'YOKOHAMA  //  TOGETHER',{
    fontFamily:BODY,fontSize:'16px',color:'#dfedf4',
    stroke:'#172233',strokeThickness:4,
  }).setOrigin(.5).setDepth(1490).setScrollFactor(0));
  const button=add(scene.add.rectangle(1354,747,345,63,0x173a42,.96)
    .setStrokeStyle(2,0x90e7d6).setDepth(1510).setScrollFactor(0)
    .setInteractive({useHandCursor:true}));
  const label=add(scene.add.text(1354,747,'FINISH ARUKEN STORY  >',{
    fontFamily:PIXEL,fontSize:'10px',color:'#ffffff',
  }).setOrigin(.5).setDepth(1511).setScrollFactor(0));
  const black=add(scene.add.rectangle(780,420,1560,840,0x02060e,1)
    .setAlpha(0).setDepth(1700).setScrollFactor(0));
  button.once('pointerdown',()=>{
    if(closed||ending)return;
    ending=true;button.disableInteractive().setVisible(false);label.setVisible(false);
    scene.tweens.add({targets:black,alpha:1,duration:4800,ease:'Sine.InOut',
      onComplete:()=>{
        if(closed)return;
        add(scene.add.text(780,355,'TOKYO SHIFT',{
          fontFamily:PIXEL,fontSize:'22px',color:'#fff1d5',
        }).setOrigin(.5).setDepth(1720).setScrollFactor(0));
        add(scene.add.text(780,414,'ARUKEN DENZAKI  //  THE END',{
          fontFamily:PIXEL,fontSize:'14px',color:'#d6efe9',
        }).setOrigin(.5).setDepth(1720).setScrollFactor(0));
        const exit=add(scene.add.rectangle(780,515,330,57,0x1d5756,1)
          .setStrokeStyle(2,0x9be7dc).setDepth(1721)
          .setScrollFactor(0).setInteractive({useHandCursor:true}));
        add(scene.add.text(780,515,'RETURN TO TOKYO',{
          fontFamily:PIXEL,fontSize:'11px',color:'#ffffff',
        }).setOrigin(.5).setDepth(1722).setScrollFactor(0));
        exit.once('pointerdown',()=>{destroy();onComplete?.();});
      },
    });
  });
  return control;
}
