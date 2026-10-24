// R668 — interactive, stage-by-stage RWB structural restoration.
// Narrative workshop interaction, not a pretend engineering simulation.
import {CH6_RESTORATION,ch6Progress} from '../data/arkonChapter06Work.js';
import {showStoryStage} from './StoryStage.js';
import {CINEMATIC_FRAMES} from '../data/storyBackgroundCatalog.js';

const PIXEL='"Silkscreen", monospace',BODY='"Rajdhani", sans-serif';
const money=n=>'¥ '+Number(n||0).toLocaleString('en-AU');
export function showArkonRwbRestoration(scene,index,{onComplete}={}){
  if(!scene?.add||!scene.sys?.isActive?.()||scene._arkonCh6Restoration?.active ||
     !Number.isInteger(index)||index<0||index>2)return null;
  const job=CH6_RESTORATION[index],progress=ch6Progress(scene.registry);
  if(progress.restorationDone!==index)return null;
  const depth=1850,objects=[],add=o=>(objects.push(o),o);
  let closed=false;let control=null;const checked=new Set();
  const clean=()=>{
    if(closed)return;
    closed=true;stage?.destroy?.();
    objects.forEach(o=>o?.destroy?.());
    scene.events?.off?.('shutdown',clean);
    if(scene._arkonCh6Restoration===control)scene._arkonCh6Restoration=null;
  };
  // Input blocker only. Leave the real Warehouse backdrop clearly
  // visible instead of painting a second black full-screen garage.
  add(scene.add.rectangle(780,420,1560,840,0x050911,.0001)
    .setDepth(depth).setScrollFactor(0).setInteractive());
  const stage=showStoryStage(scene,{
    // Native layout is essential here: canonical hero car is x=708,
    // wheel contact y=500, and mechanic Arkon's feet are at x=282/y=558.
    // Never use the "garage-panel" perspective projection for this scene.
    backgroundId:'$CURRENT_WORKSHOP',
    stageMode:'native',depth:depth+1,composition:'car-behind-cast',
    workshopRepairPair:true,
    cars:[{carId:'rwbStellaPorsche'}],
    characters:[
      {id:'arkonDen',
       pose:index===0?'storyMechanicCrouch':'storyMechanicEngine',
       role:'rwbMechanic',flipX:true},
      {id:'sayakaFujieda',pose:index===1?'homeHappy':'homeNormal',
       role:'rwbSayaka'},
    ],
  });
  if(!stage){clean();return null;}
  const W=CINEMATIC_FRAMES.workshop;
  const box=(x,y,w,h,color=0x0b1c2c)=>add(scene.add.rectangle(x,y,w,h,color,0.98)
    .setStrokeStyle(2,0x35617c).setDepth(depth+19).setScrollFactor(0));
  const label=(x,y,value,size=12,color='#f2f7ff',font=PIXEL)=>add(scene.add.text(x,y,value,{
    fontFamily:font,fontSize:size+'px',color,wordWrap:{width:330}
  }).setOrigin(0,.5).setDepth(depth+22).setScrollFactor(0));
  box(780,43,1512,72);
  label(47,42,'RWB PORSCHE  //  CERTIFIED RESTORATION',15);
  label(1010,42,'RESERVED FUNDS  '+money(progress.escrow),11,'#f9de9a');
  box(1360,454,352,724); // Right strip, workshop image remains full-size.
  label(1204,130,'RESTORATION '+(index+1)+' / 3',10,'#a6def0');
  label(1204,178,job.title,14,'#ffe09e');
  const desc=label(1204,241,job.description,16,'#dbe6ed',BODY);
  desc.setWordWrapWidth(306);
  label(1204,308,'DOCUMENTED CHECKLIST',10,'#a6def0');
  const checks=[];
  job.checks.forEach((line,i)=>{
    const y=371+i*68;
    const hit=add(scene.add.rectangle(1358,y,300,57,0x142b38,1)
      .setStrokeStyle(1,0x517e8a).setDepth(depth+22)
      .setInteractive({useHandCursor:true}).setScrollFactor(0));
    const item=label(1220,y,line,12,'#f5f8fa',BODY);
    item.setWordWrapWidth(265);
    hit.on('pointerdown',()=>{
      if(closed)return;
      checked.has(i)?checked.delete(i):checked.add(i);
      hit.setStrokeStyle(2,checked.has(i)?0x91e2ac:0x517e8a);
      hit.setFillStyle(checked.has(i)?0x1b453f:0x142b38,1);
      refresh();
    });
    checks.push(hit);
  });
  const cost=label(1211,676,'PROJECT COST '+money(job.cost),12,'#f9de9a');
  void cost;
  const button=add(scene.add.rectangle(1360,758,298,65,0x193f3b,1)
    .setStrokeStyle(2,0x78d4b7).setDepth(depth+23).setScrollFactor(0)
    .setInteractive({useHandCursor:true}));
  // Labels MUST sit above the interactive green rectangle and use its centre.
  const buttonText=label(1360,758,'VERIFY ALL FOUR ITEMS',10,'#ffffff');
  buttonText.setOrigin(.5,.5).setDepth(depth+24).setWordWrapWidth(285);
  button.on('pointerdown',()=>{
    if(closed||checked.size!==job.checks.length)return;
    if(onComplete?.(index)!==true)return;
    clean();
  });
  function refresh(){
    const ready=checked.size===job.checks.length;
    button.setFillStyle(ready?0x17624b:0x193f3b,1);
    buttonText.setText(ready?
      (index===2?'ACCEPT SAFETY SIGN-OFF':'COMPLETE WORK PACKAGE'):
      'VERIFIED  '+checked.size+' / '+job.checks.length);
  }
  control={active:true,destroy:clean,checks};
  scene._arkonCh6Restoration=control;
  scene.events?.once?.('shutdown',clean);
  refresh();
  return control;
}
