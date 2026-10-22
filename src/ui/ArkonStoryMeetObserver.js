// R652 — optional character interaction layered on the REAL Meet stage.
// Never modifies normal rival rosters. Only appears in Arkon's private Story.
import { SHOWDOWN_STAGE, SHOWDOWN_HERO_CHARACTER } from './ShowdownLayout.js?v=20261022-r651';
import { saveSessionState } from '../state/GameState.js?v=20261023-r653';
const KEY='arkonStorySayakaObserver';
const PATH='assets/Characters/Main/oshiage_sayaka_fujieda_neutral.png?v=20261023-r652';

export function preloadArkonMeetObserver(scene){
  if(scene.registry?.get?.('gameMode')!=='arkonStory')return;
  if(!scene.textures.exists(KEY))scene.load.image(KEY,PATH);
}

export function attachArkonMeetObserver(scene){
  if(scene.registry?.get?.('gameMode')!=='arkonStory')return;
  let objects=[],tween=null;
  const clear=()=>{
    if(tween?.isPlaying?.())tween.stop();
    tween=null;
    objects.forEach(o=>{if(o?.active)o.destroy();});
    objects=[];
  };
  const update=()=>{
    const phase=scene.registry?.get?.('arkonStoryPhase');
    const visible=['firstThree','meetNotice'].includes(phase) &&
      !scene.registry.get('arkonStorySayakaNoticed') &&
      !scene._storyEncounterActive && !scene._storyDirectorStage &&
      scene.sys?.isActive?.();
    if(!visible){if(objects.length)clear();return;}
    const ready=Number(scene.registry.get('wins')||0)>=3;
    if(objects.length){
      const button=objects[1],label=objects[2];
      button?.setVisible?.(ready);
      label?.setVisible?.(ready);
      return;
    }
    if(!scene.textures.exists(KEY))return;
    const feet=SHOWDOWN_HERO_CHARACTER.feetY;
    const x=SHOWDOWN_STAGE.x+SHOWDOWN_STAGE.w-100;
    const height=SHOWDOWN_HERO_CHARACTER.height;
    const source=scene.textures.get(KEY).getSourceImage();
    const person=scene.add.image(x,feet,KEY).setOrigin(.5,1)
      .setScale(height/Math.max(1,source.height)).setDepth(95);
    if(scene.stageMask)person.setMask(scene.stageMask);
    const y=feet-height-18;
    const button=scene.add.rectangle(x,y,202,47,0x12364b,.97)
      .setStrokeStyle(2,0x90f6ff,1).setDepth(105)
      .setInteractive({useHandCursor:true});
    const label=scene.add.text(x,y,'YOU NOTICE HER  ›',{
      fontFamily:'"Silkscreen",monospace',
      fontSize:'10px',color:'#ffffff',
    }).setOrigin(.5).setDepth(106);
    const choose=()=>{
      if(!ready || scene.registry.get('arkonStorySayakaNoticed'))return;
      scene.registry.set('arkonStorySayakaNoticed',true);
      saveSessionState(scene.registry);
      clear();
    };
    button.on('pointerdown',choose);
    label.setInteractive({useHandCursor:true}).on('pointerdown',choose);
    button.setVisible(ready);
    label.setVisible(ready);
    tween=scene.tweens.add({targets:[button],alpha:{from:.62,to:1},
      duration:720,yoyo:true,repeat:-1});
    objects=[person,button,label];
  };
  update();
  const timer=scene.time.addEvent({delay:450,loop:true,callback:update});
  const finish=()=>{timer.remove();clear();};
  scene.events.once('shutdown',finish);
}
