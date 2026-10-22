// R656 — interactive customer work. Uses the game's ENGINE tuning rules
// against guest builds, without modifying the player's own car upgrades.
import {
  ENGINE_PART_ORDER, ENGINE_TUNING_PARTS, normaliseEngineTuning,
} from '../data/tuning.js?v=20261011-r479';
import {
  CANAL_YARD_MAX, getArkonCustomerPower, isArkonCustomerJobComplete,
} from '../data/arkonChapter03Jobs.js?v=20261023-r656';
import { showStoryStage } from './StoryStage.js?v=20261023-r655';

const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
export function showArkonCustomerTuning(scene,job,{onComplete}={}){
  if(!scene?.add||!scene.sys?.isActive?.()||!job||
     scene._arkonCustomerTuning?.active)return null;
  // Stage the appropriate real stock body and Arkon's mechanic artwork.
  // This is a hired Canal Yard bay, not a gifted workshop or a new car.
  showStoryStage(scene,{
    backgroundId:'workshop:shinonomeCanalYard:night',stageMode:'story',
    composition:'car-behind-cast',
    characters:[{id:'arkonDen',pose:'storyMechanicEngine',x:1050,ground:.77,height:295}],
    cars:[{carId:job.carId,x:1110,ground:.82,width:640}],
  });
  const depth=1800,objects=[],add=obj=>(objects.push(obj),obj);
  let closed=false;
  const clean=()=>{
    if(closed)return;
    closed=true;
    objects.forEach(obj=>obj?.destroy?.());
    scene.events?.off?.('shutdown',clean);
    if(scene._arkonCustomerTuning===control)scene._arkonCustomerTuning=null;
  };
  const levels=normaliseEngineTuning();
  const text=(x,y,s,size=16,color='#ffffff',font=BODY)=>{
    return add(scene.add.text(x,y,s,{fontFamily:font,fontSize:size+'px',color})
      .setDepth(depth+3).setScrollFactor(0));
  };
  add(scene.add.rectangle(780,420,1560,840,0x030811,.55)
    .setDepth(depth).setScrollFactor(0).setInteractive());
  add(scene.add.rectangle(444,426,695,650,0x0a1d2b,.98)
    .setStrokeStyle(3,0x65cedf,1).setDepth(depth+1).setScrollFactor(0));
  add(scene.add.rectangle(1138,119,640,125,0x081725,.91)
    .setStrokeStyle(2,0x588b9c).setDepth(depth+1).setScrollFactor(0));
  const subtitle=job.maximum?'SAYAKA // MAXIMUM CANAL YARD SPEC'
    :'CLIENT '+(job.index+1)+' / 5  //  CUSTOMER-FUNDED PARTS';
  text(129,132,'CANAL YARD // TUNING BAY',14,'#e2f7fc',PIXEL);
  text(129,167,subtitle,10,'#81d7e6',PIXEL);
  text(129,205,job.name.toUpperCase(),25,'#ffffff',BODY);
  text(129,241,job.maximum
    ? 'Fit every available Canal Yard engine upgrade.'
    : 'Hit the requested power. Parts are paid by the customer.',17,'#c3d8e3');
  const current=text(842,78,'',23,'#f8ecc0',PIXEL);
  const goal=text(842,118,'',18,'#d7eaf3');
  const reward=text(842,158,'',15,'#a9dbe6');
  const partRows=[];
  for(let i=0;i<ENGINE_PART_ORDER.length;i++){
    const partId=ENGINE_PART_ORDER[i];
    const y=295+i*66;
    const rect=add(scene.add.rectangle(445,y,610,55,0x18394a,.99)
      .setStrokeStyle(2,0x517d91).setDepth(depth+2)
      .setScrollFactor(0).setInteractive({useHandCursor:true}));
    const label=text(151,y-13,'',11,'#e9f4ff',PIXEL);
    const sub=text(151,y+6,'',15,'#b4cdd6');
    const status=text(627,y-7,'',13,'#fff4c7',PIXEL).setOrigin(1,0);
    const max=CANAL_YARD_MAX[partId];
    rect.on('pointerdown',()=>{
      if(closed)return;
      levels[partId]=levels[partId]>=max?0:levels[partId]+1;
      refresh();
    });
    partRows.push({partId,max,rect,label,sub,status});
  }
  const tip=text(140,660,'',14,'#a9c8d6');
  const finishButton=add(scene.add.rectangle(1320,717,290,65,0x164f58,1)
    .setStrokeStyle(3,0x7ce5df).setDepth(depth+2)
    .setScrollFactor(0).setInteractive({useHandCursor:true}));
  const finishLabel=text(1320,704,'COMPLETE JOB',12,'#ffffff',PIXEL)
    .setOrigin(.5,0);
  finishButton.on('pointerdown',()=>{
    if(!isArkonCustomerJobComplete(job,levels)||closed)return;
    clean();
    onComplete?.({carId:job.carId,tuning:{...levels},
      powerKW:getArkonCustomerPower(job.carId,levels)});
  });
  function refresh(){
    const power=getArkonCustomerPower(job.carId,levels);
    const ready=isArkonCustomerJobComplete(job,levels);
    current.setText('OUTPUT  '+power+' kW');
    goal.setText(job.maximum?'MAX AVAILABLE  '+job.maxKW+' kW':
      'CUSTOMER TARGET  '+job.targetKW+' kW');
    reward.setText(job.maximum?'SAYAKA IS COVERING THE PARTS':
      'LABOUR PAY  ¥'+job.pay.toLocaleString('en-AU'));
    for(const row of partRows){
      const level=levels[row.partId];
      const spec=ENGINE_TUNING_PARTS[row.partId].levels[level];
      row.label.setText(ENGINE_TUNING_PARTS[row.partId].name);
      row.sub.setText(spec.name+'  //  TAP TO CHANGE');
      row.status.setText('L'+level+' / '+row.max);
      row.rect.setStrokeStyle(2,level===row.max?0x79d8ac:0x517d91);
    }
    finishButton.setAlpha(ready?1:.42);
    finishLabel.setText(job.maximum?'MAX BUILD COMPLETE':'DELIVER TO CLIENT');
    tip.setText(ready?'Power target reached. Deliver the car when ready.':
      'Choose real engine, intake, ECU, turbo and cooling upgrades.');
  }
  const control={active:true,destroy:clean,levels};
  scene._arkonCustomerTuning=control;
  scene.events?.once?.('shutdown',clean);
  refresh();
  return control;
}
