// R668 — Yokohama night ending. A quiet pixel-art rear-view pair.
// Drawn in Phaser so no new image file or third-party art is required.
// It sits over the actual authored Minato Mirai/Ferris-wheel Meet panorama.
import {showStoryStage} from './StoryStage.js?v=20261023-r665';
const PIXEL='"Silkscreen", monospace',BODY='"Rajdhani", sans-serif';
export function showArkonChapter06Finale(scene,{onComplete}={}){
  if(!scene?.add||scene._arkonCh6Finale?.active)return null;
  let closed=false;const depth=1700,items=[],add=o=>(items.push(o),o);
  const stage=showStoryStage(scene,{
    backgroundId:'meet:yokohamaMinatoMirai:night',
    stageMode:'native',privateMeet:true,characters:[],
    cars:[{carId:'rwbStellaPorsche'}],
  });
  if(!stage)return null;
  const clean=()=>{
    if(closed)return;
    closed=true;
    items.forEach(x=>x?.destroy?.());
    stage?.destroy?.();
    scene.events?.off?.('shutdown',clean);
    if(scene._arkonCh6Finale===control)scene._arkonCh6Finale=null;
  };
  add(scene.add.rectangle(780,420,1560,840,0x050a14,.26)
    .setDepth(depth).setInteractive().setScrollFactor(0));
  // Low-opacity foreground vignette, full-screen but panorama stays visible.
  add(scene.add.rectangle(780,743,1560,194,0x02070d,.93)
    .setDepth(depth+3).setScrollFactor(0));
  // Two deliberately back-facing pixel-art figures looking over the bay.
  // Arkon: dark charcoal collar, short hair with grey at the temples.
  const g=add(scene.add.graphics().setDepth(depth+2).setScrollFactor(0));
  g.fillStyle(0x070e18,.40);g.fillEllipse(606,624,270,28);
  // Arkon coat, tapered legs and shoulders.
  g.fillStyle(0x1a2433,1);
  g.fillRect(486,502,108,109);g.fillRect(500,607,37,29);g.fillRect(550,607,35,29);
  g.fillRect(473,518,21,95);g.fillRect(591,518,20,89);
  g.fillStyle(0x0d111b,1);g.fillRect(499,633,38,10);g.fillRect(549,633,38,10);
  g.fillStyle(0x29323f,1);g.fillRect(494,506,10,100);g.fillRect(579,506,10,100);
  g.fillStyle(0xc4a083,1);g.fillRect(513,472,57,36);
  g.fillStyle(0x111820,1);g.fillRect(507,445,70,32);
  g.fillRect(507,463,12,21);g.fillRect(566,463,12,21);
  g.fillStyle(0x7b7b7c,1);g.fillRect(507,468,6,11);g.fillRect(570,468,7,11);
  // Sayaka: shoulder-length dark hair, narrow-waisted coat, slight turn.
  g.fillStyle(0x271d2a,1);
  g.fillRect(646,512,91,97);g.fillRect(659,604,32,31);g.fillRect(702,604,29,31);
  g.fillRect(633,528,18,78);g.fillRect(736,528,19,75);
  g.fillStyle(0x11121a,1);g.fillRect(658,633,33,10);g.fillRect(701,633,33,10);
  g.fillStyle(0x482e3e,1);g.fillRect(656,520,11,82);g.fillRect(724,520,9,81);
  g.fillStyle(0xcba88c,1);g.fillRect(668,471,46,39);
  g.fillStyle(0x171521,1);g.fillRect(659,452,62,23);g.fillRect(655,466,15,66);
  g.fillRect(713,466,13,52);
  // Their arms meet near the center; keep the moment understated.
  g.fillStyle(0x1a2433,1);g.fillRect(594,551,29,15);
  g.fillStyle(0x271d2a,1);g.fillRect(619,553,30,14);
  g.fillStyle(0xb89985,1);g.fillRect(620,556,17,9);
  add(scene.add.text(780,680,'EVERYTHING WE BUILT',{
    fontFamily:PIXEL,fontSize:'22px',color:'#f8ecce'
  }).setOrigin(.5).setDepth(depth+5).setScrollFactor(0));
  add(scene.add.text(780,732,'YOKOHAMA  //  JUST THE TWO OF THEM',{
    fontFamily:BODY,fontSize:'16px',color:'#b5d9e5'
  }).setOrigin(.5).setDepth(depth+5).setScrollFactor(0));
  const button=add(scene.add.rectangle(780,788,344,54,0x123c46,1)
    .setStrokeStyle(2,0x9fe4d8).setDepth(depth+7)
    .setInteractive({useHandCursor:true}).setScrollFactor(0));
  add(scene.add.text(780,788,'COMPLETE CHAPTER 06  >',{
    fontFamily:PIXEL,fontSize:'11px',color:'#f2ffff'
  }).setOrigin(.5).setDepth(depth+8).setScrollFactor(0));
  button.once('pointerdown',()=>{
    if(closed)return;
    clean();onComplete?.();
  });
  const control={active:true,destroy:clean};
  scene._arkonCh6Finale=control;
  scene.events?.once('shutdown',clean);
  return control;
}
