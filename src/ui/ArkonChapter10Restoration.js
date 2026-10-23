// R674 — Interactive, properly ordered restoration checklist at Warehouse HQ.
// Temporary customer cars are not silently added to Arkon's garage.
import {showStoryStage} from './StoryStage.js?v=20261023-r674';
import {ARKON_CH10_PROJECTS} from '../data/arkonChapter10Work.js?v=20261023-r674';
const PIXEL='"Silkscreen", monospace', BODY='"Rajdhani", sans-serif';
export function showArkonCh10Restoration(scene,index,{onComplete}={}){
  if(!scene?.add||!scene.sys?.isActive?.()||scene._arkonCh10Restoration?.active||
    !Number.isInteger(index)||!ARKON_CH10_PROJECTS[index])return null;
  const job=ARKON_CH10_PROJECTS[index];
  let closed=false,done=0;
  const objects=[],add=o=>(objects.push(o),o);
  const stage=showStoryStage(scene,{
    backgroundId:'workshop:shinonomeWarehouseStrip:night',
    stageMode:'native',composition:'car-in-front',depth:160,
    characters:[{id:'arkonDen',pose:'storyMechanicEngine',role:'player'}],
    cars:[{carId:job.carId}],
  });
  if(!stage)return null;
  const destroy=()=>{
    if(closed)return;
    closed=true;
    stage.destroy();
    objects.forEach(o=>o?.destroy?.());
    scene.events?.off?.('shutdown',destroy);
    if(scene._arkonCh10Restoration===control)scene._arkonCh10Restoration=null;
  };
  const control={active:true,destroy};
  scene._arkonCh10Restoration=control;
  scene.events?.once?.('shutdown',destroy);
  add(scene.add.rectangle(780,420,1560,840,0x041018,.0001)
    .setDepth(1760).setScrollFactor(0).setInteractive());
  add(scene.add.rectangle(1342,430,367,705,0x091926,.975)
    .setStrokeStyle(2,0x6dbbcb).setDepth(1800).setScrollFactor(0));
  const text=(x,y,t,size=12,c='#f7fdff')=>add(scene.add.text(x,y,t,{
    fontFamily:PIXEL,fontSize:size+'px',color:c,
    wordWrap:{width:310},
  }).setDepth(1802).setScrollFactor(0));
  text(1180,111,'WAREHOUSE HQ',13,'#b3f6eb');
  text(1180,150,'RESTORATION '+(index+1)+' / 3',9,'#a8cbd5');
  text(1180,195,job.title,12);
  add(scene.add.text(1180,248,job.client,{
    fontFamily:BODY,fontSize:'17px',color:'#e7edf3',
    wordWrap:{width:304},
  }).setDepth(1802).setScrollFactor(0));
  const rows=job.tasks.map((task,i)=>{
    const y=334+i*102;
    const rect=add(scene.add.rectangle(1342,y,318,78,0x14303d,1)
      .setStrokeStyle(1,0x5a8599).setDepth(1801).setScrollFactor(0)
      .setInteractive({useHandCursor:true}));
    const label=add(scene.add.text(1193,y,String(i+1)+'. '+task,{
      fontFamily:BODY,fontSize:'17px',color:'#f8fdff',
      wordWrap:{width:280},
    }).setOrigin(0,.5).setDepth(1802).setScrollFactor(0));
    rect.on('pointerdown',()=>{
      if(closed||done!==i)return;
      done++;
      rect.disableInteractive().setFillStyle(0x205548);
      label.setColor('#b8f5d9');
      refresh();
    });
    return {rect,label};
  });
  const finish=add(scene.add.rectangle(1342,683,320,57,0x205548,1)
    .setStrokeStyle(2,0x8be2c6).setDepth(1801).setScrollFactor(0)
    .setInteractive({useHandCursor:true}));
  const finishLabel=add(scene.add.text(1342,683,'DELIVER VERIFIED CAR',{
    fontFamily:PIXEL,fontSize:'9px',color:'#ffffff',
  }).setOrigin(.5).setDepth(1802).setScrollFactor(0));
  const refresh=()=>{
    rows.forEach((r,i)=>r.rect.setAlpha(i>done ? .5 : 1));
    finish.setAlpha(done===3?1:.36);
    finishLabel.setAlpha(done===3?1:.36);
  };
  finish.on('pointerdown',()=>{
    if(closed||done!==3)return;
    destroy();onComplete?.();
  });
  refresh();
  return control;
}
