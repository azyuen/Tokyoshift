// R660 — Aruken's paid guest-car jobs use the same THREE-PANEL framing and
// foreground coordinates as the ordinary Canal Yard Garage. All customer cars
// remain temporary displays; changes never mutate owned cars or player tuning.
import {
  ENGINE_PART_ORDER, ENGINE_TUNING_PARTS, normaliseEngineTuning,
} from '../data/tuning.js?v=20261026-r687';
import {
  CANAL_YARD_MAX, getArkonCustomerPower, isArkonCustomerJobComplete,
} from '../data/arkonChapter03Jobs.js?v=20261023-r660';
import { getFactoryPaintPalette } from '../data/factoryPaintPalettes.js?v=20261020-r623';
import { WORKSHOP_PRESENTATION } from '../data/workshopPresentation.js?v=20260929-r267';
import { CINEMATIC_FRAMES } from '../data/storyBackgroundCatalog.js?v=20261022-r644';
import { showStoryStage } from './StoryStage.js?v=20261023-r665';

const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
const STAGE=CINEMATIC_FRAMES.workshop;
const SIDE=Object.freeze({x:1180,y:92,w:356,h:724});
const STRIP=Object.freeze({x:24,y:644,w:1138,h:172});
const money=value=>'¥ '+Math.max(0,Number(value)||0).toLocaleString('en-AU');

export function showArkonCustomerTuning(scene,job,{onComplete}={}){
  if(!scene?.add||!scene.sys?.isActive?.()||!job||
     scene._arkonCustomerTuning?.active)return null;

  const depth=1800,objects=[],add=obj=>(objects.push(obj),obj);
  let closed=false,stage=null;
  let arriving=true,uiReady=false;
  const paints=getFactoryPaintPalette(job.carId);
  let paintIndex=job.allowPaint===false?0:
    paints.length ? ((job.index*3+2)%paints.length) : 0;
  const paint=()=>paints[paintIndex]||{name:'STOCK',color:0xffffff};
  const clean=()=>{
    if(closed)return;
    closed=true;
    stage?.destroy?.();
    objects.forEach(obj=>obj?.destroy?.());
    scene.events?.off?.('shutdown',clean);
    if(scene._arkonCustomerTuning===control)scene._arkonCustomerTuning=null;
  };
  const levels=normaliseEngineTuning(job.index===5
    ? scene.registry?.get?.('arkonStoryMx5CustomerTuning') : {});

  // An opaque input shield protects other scene controls while the client
  // car is being tuned. The staged background/car are drawn ABOVE it.
  add(scene.add.rectangle(780,420,1560,840,0x030811,1)
    .setDepth(depth).setScrollFactor(0).setInteractive());

  // Match the normal 620px Canal Yard car and 500px wheel-contact line.
  // Aruken stands a little smaller and BEHIND the car, not over its bonnet.
  // The customer's wheels track the slow drive-in distance until it stops.
  stage=showStoryStage(scene,{
    backgroundId:'workshop:shinonomeCanalYard:night',
    stageMode:'garage-panel',depth:depth+1,
    composition:'car-in-front',motion:'roll-in-left',
    onArrivalComplete:()=>{
      arriving=false;
      if(uiReady&&!closed)refresh();
    },
    characters:[{
      id:'arkonDen',pose:'storyMechanicEngine',
      x:STAGE.x+STAGE.w-164,
      y:WORKSHOP_PRESENTATION.heroCar.tyreContactY+
        WORKSHOP_PRESENTATION.daichi.engine.feetOffsetY,
      height:Math.round(WORKSHOP_PRESENTATION.daichi.engine.targetHeight*.86),
    }],
    cars:[{
      carId:job.carId,paintColor:paint().color,
      x:WORKSHOP_PRESENTATION.heroCar.x,
      groundY:WORKSHOP_PRESENTATION.heroCar.tyreContactY,
      width:WORKSHOP_PRESENTATION.heroCar.targetWidth,
    }],
  });
  if(!stage){
    objects.forEach(obj=>obj?.destroy?.());
    return null;
  }

  const panelDepth=depth+20;
  const panel=(x,y,w,h)=>{
    return add(scene.add.rectangle(x,y,w,h,0x07111d,.985)
      .setStrokeStyle(2,0x17354d,1)
      .setDepth(panelDepth).setScrollFactor(0));
  };
  const text=(x,y,value,size=12,color='#e8f6ff',font=PIXEL,originX=0)=>{
    return add(scene.add.text(x,y,value,{
      fontFamily:font,fontSize:size+'px',color,
    }).setOrigin(originX,0.5).setDepth(panelDepth+2).setScrollFactor(0));
  };
  const line=(x,y,w)=>{
    add(scene.add.rectangle(x+w/2,y,w,1,0x315470,.9)
      .setDepth(panelDepth+1).setScrollFactor(0));
  };
  // Exact Garage panel boundaries, with an unobstructed full-width car bay.
  add(scene.add.rectangle(STAGE.x+STAGE.w/2,STAGE.y+STAGE.h/2,
    STAGE.w,STAGE.h,0x000000,0).setStrokeStyle(2,0x17354d,1)
    .setDepth(panelDepth).setScrollFactor(0));
  panel(780,43,1512,72);
  panel(SIDE.x+SIDE.w/2,SIDE.y+SIDE.h/2,SIDE.w,SIDE.h);
  panel(STRIP.x+STRIP.w/2,STRIP.y+STRIP.h/2,STRIP.w,STRIP.h);

  const subtitle=job.maximum?'SAYAKA  //  MAXIMUM CANAL YARD BUILD'
    :job.chapter===6?'PRESTIGE CONTRACT '+(job.index+1)+' / 3  //  PARTS FUNDED'
    :'CUSTOMER '+(job.index+1)+' / 5  //  PARTS PAID BY CLIENT';
  text(50,35,'CANAL YARD  //  CUSTOMER TUNING',16);
  text(50,62,subtitle,9,'#8cc8ec');
  text(1163,24,'ARUKEN BANK BALANCE',9,'#8cc8ec',PIXEL,1);
  text(1512,52,money(scene.registry?.get?.('cash')),17,'#ffe08a',PIXEL,1);

  text(SIDE.x+20,SIDE.y+26,'ENGINE MODIFICATIONS',11,'#8cc8ec');
  text(SIDE.x+20,SIDE.y+58,job.maximum?'FINAL MX-5 BUILD':'CUSTOMER WORK ORDER',9,'#e1f7ff');
  text(SIDE.x+20,SIDE.y+97,String(job.name||'CUSTOMER CAR').toUpperCase(),17,'#ffffff',BODY);
  text(SIDE.x+20,SIDE.y+130,job.maximum?'SAYAKA  //  PARTS COVERED'
    :'LABOUR FEE  '+money(job.pay),10,'#ffe08a');
  line(SIDE.x+18,SIDE.y+155,SIDE.w-36);

  const partRows=[];
  ENGINE_PART_ORDER.forEach((partId,i)=>{
    const y=SIDE.y+184+i*72;
    const rect=add(scene.add.rectangle(SIDE.x+SIDE.w/2,y,SIDE.w-36,62,0x0b1724,1)
      .setStrokeStyle(1,0x315470,1).setDepth(panelDepth+1)
      .setScrollFactor(0).setInteractive({useHandCursor:true}));
    const label=text(SIDE.x+24,y-15,'',9,'#eff8ff');
    const sub=text(SIDE.x+24,y+13,'',10,'#a8c5d4',BODY);
    const status=text(SIDE.x+SIDE.w-24,y-15,'',9,'#ffe08a',PIXEL,1);
    const max=job.limits?.[partId]??CANAL_YARD_MAX[partId];
    rect.on('pointerdown',()=>{
      if(closed||arriving||max===0)return;
      levels[partId]=levels[partId]>=max?0:levels[partId]+1;
      refresh();
    });
    partRows.push({partId,max,rect,label,sub,status});
  });

  const tip=text(SIDE.x+20,SIDE.y+573,'',14,'#b4cbd7',BODY);
  tip.setWordWrapWidth(SIDE.w-40,true);
  const deliver=add(scene.add.rectangle(
    SIDE.x+SIDE.w/2,SIDE.y+674,SIDE.w-36,55,0x174f49,1
  ).setStrokeStyle(2,0x66dbb8,1).setDepth(panelDepth+1)
    .setScrollFactor(0).setInteractive({useHandCursor:true}));
  const deliverText=text(SIDE.x+SIDE.w/2,SIDE.y+662,
    'DELIVER TO CLIENT',8,'#f3fffb',PIXEL,.5);
  const deliverPay=text(SIDE.x+SIDE.w/2,SIDE.y+687,
    job.pay ? '+'+money(job.pay) : '',8,'#ffe08a',PIXEL,.5);
  deliver.on('pointerdown',()=>{
    if(closed||arriving||!isArkonCustomerJobComplete(job,levels)||
      Object.entries(job.limits||{}).some(([part,max])=>levels[part]>max))return;
    const result={carId:job.carId,tuning:{...levels},
      powerKW:getArkonCustomerPower(job.carId,levels)};
    clean();
    onComplete?.(result);
  });

  text(STRIP.x+25,STRIP.y+28,'CLIENT VEHICLE',10,'#8cc8ec');
  text(STRIP.x+25,STRIP.y+74,String(job.name||'').toUpperCase(),24,'#ffffff',BODY);
  text(STRIP.x+25,STRIP.y+121,job.maximum
    ? 'SAYAKA // FULL CANAL YARD SPEC'
    : 'CUSTOMER PARTS FUNDED',13,'#a1c3d6',BODY);
  // Use the freed-up bottom-left strip for the signed build restriction.
  if(job.restrictionLabel)
    text(STRIP.x+25,STRIP.y+148,job.restrictionLabel,10,'#ffd2a2');
  // Story clients have already specified their colour: paint is NOT part
  // of a workshop labour agreement. Keep Chapter 03's legacy selector only.
  const paintLabel=job.allowPaint===false?null:
    text(STRIP.x+198,STRIP.y+148,'',9,'#f0edf2',BODY);
  if(job.allowPaint!==false && paints.length>1){
    for(const [direction,x] of [[-1,STRIP.x+23],[1,STRIP.x+359]]){
      const hit=add(scene.add.rectangle(x,STRIP.y+147,42,33,0x183848,1)
        .setDepth(panelDepth+2).setStrokeStyle(1,0x67aacc)
        .setScrollFactor(0).setInteractive({useHandCursor:true}));
      text(x,STRIP.y+147,direction<0?'<':'>',12,'#e8fcff',PIXEL,.5);
      hit.on('pointerdown',()=>{
        if(closed||arriving)return;
        paintIndex=(paintIndex+direction+paints.length)%paints.length;
        stage?.setPaintColor(paint().color);
        paintLabel?.setText('PAINT  '+paint().name.toUpperCase());
      });
    }
  }
  paintLabel?.setText('PAINT  '+paint().name.toUpperCase());
  add(scene.add.rectangle(STRIP.x+395,STRIP.y+STRIP.h/2,1,STRIP.h-35,
    0x315470,.85).setDepth(panelDepth+1).setScrollFactor(0));
  text(STRIP.x+448,STRIP.y+33,'CURRENT OUTPUT',11,'#8cc8ec');
  const current=text(STRIP.x+448,STRIP.y+90,'',27,'#ffe08a');
  text(STRIP.x+804,STRIP.y+33,job.maximum?'MAX AVAILABLE':'TARGET OUTPUT',
    11,'#8cc8ec');
  const target=text(STRIP.x+804,STRIP.y+90,'',27,'#ffffff');
  const achieved=text(STRIP.x+804,STRIP.y+131,'',12,'#8cc8ec',BODY);

  function refresh(){
    const power=getArkonCustomerPower(job.carId,levels);
    const restrictionOkay=Object.entries(job.limits||{}).every(
      ([part,max])=>(Number(levels[part])||0)<=max);
    const ready=restrictionOkay&&isArkonCustomerJobComplete(job,levels);
    current.setText(power+' kW').setColor(ready?'#89ebc2':'#ffe08a');
    target.setText((job.maximum?job.maxKW:job.targetKW)+' kW');
    achieved.setText(ready?'TARGET ACHIEVED':'MODIFY ENGINE TO REACH TARGET')
      .setColor(ready?'#89ebc2':'#8cc8ec');
    for(const row of partRows){
      const level=levels[row.partId];
      const spec=ENGINE_TUNING_PARTS[row.partId].levels[level];
      row.label.setText(ENGINE_TUNING_PARTS[row.partId].name.toUpperCase());
      row.sub.setText(row.max===0?'CLIENT SAYS: LEAVE FACTORY SPEC':
        spec.name+'  //  TAP TO CHANGE');
      row.status.setText('L'+level+' / '+row.max);
      row.rect.setStrokeStyle(1,row.max===0?0xdb9872:
        level===row.max?0x66dbb8:0x315470,1);
    }
    deliver.setFillStyle(ready&&!arriving?0x174f49:0x102226,1)
      .setStrokeStyle(2,ready&&!arriving?0x66dbb8:0x3e5e63,1);
    deliverText.setText(job.maximum?'DELIVER TO SAYAKA':'DELIVER TO CLIENT')
      .setColor(ready?'#f3fffb':'#78959c');
    deliverPay.setText(job.pay?'+'+money(job.pay):'')
      .setColor(ready?'#ffe08a':'#8b8981');
    if(ready&&!arriving)deliver.setInteractive({useHandCursor:true});
    else deliver.disableInteractive();
    for(const row of partRows){
      if(arriving||row.max===0)row.rect.disableInteractive();
      else row.rect.setInteractive({useHandCursor:true});
    }
    tip.setText(arriving?'CUSTOMER VEHICLE ARRIVING // WAIT FOR THE CAR TO STOP'
      : ready
      ? 'Requested specification reached. The car is ready for handover.'
      : job.maximum
        ? 'Fit every Canal Yard engine upgrade to complete the build.'
        : 'Tap each part to select upgrades. Client pays parts; Aruken earns labour.');
  }

  const control={active:true,destroy:clean,levels};
  scene._arkonCustomerTuning=control;
  scene.events?.once?.('shutdown',clean);
  uiReady=true;
  refresh();
  return control;
}
