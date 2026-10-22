// R648 — spoiler-free, only visible in Arkon's separate Story Mode.
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';

export function getArkonStoryObjective(registry) {
  const get=key=>registry?.get?.(key);
  if(get('gameMode')!=='arkonStory') return null;
  const wins=Math.max(0,Number(get('wins')||0));
  if(get('arkonStoryChapter01AfterHoursDone'))
    return {heading:'CHAPTER 01 COMPLETE',message:'You have finished the first chapter. The next chapter is still being built.',progress:'STORY PROGRESS SAVED'};
  if(get('arkonStoryChapter01Done'))
    return {heading:'AFTER HOURS',message:wins>=4
      ? 'Return to a street meet to continue the story.'
      : 'Win street races, then return to a meet for the next scene.',
      progress:'RACE WINS  '+Math.min(wins,4)+' / 4'};
  return {heading:'CHAPTER 01 // FIRST RUNS',
    message:wins>=2?'Return to a street meet. There is more to tonight.'
      :'Win two street races in your own car. Tuning and cash races both count.',
    progress:'RACE WINS  '+Math.min(wins,2)+' / 2'};
}

export function addArkonStoryObjectiveButton(scene,x=985,y=35) {
  if(!getArkonStoryObjective(scene?.registry)) return null;
  const button=scene.add.rectangle(x,y,47,38,0x0b1724,1)
    .setStrokeStyle(1,0x4c9eb5,1).setDepth(43)
    .setInteractive({useHandCursor:true});
  const label=scene.add.text(x,y,'?',{
    fontFamily:PIXEL,fontSize:'18px',color:'#a4edff'
  }).setOrigin(.5).setDepth(44);
  button.on('pointerover',()=>button.setStrokeStyle(2,0x75e5ff,1));
  button.on('pointerout',()=>button.setStrokeStyle(1,0x4c9eb5,1));
  button.on('pointerdown',()=>showArkonStoryObjective(scene));
  return {button,label};
}

export function showArkonStoryObjective(scene) {
  if(scene?._arkonStoryObjectiveOpen)return false;
  const info=getArkonStoryObjective(scene?.registry);
  if(!info)return false;
  scene._arkonStoryObjectiveOpen=true;
  const depth=1180,objects=[],add=item=>(objects.push(item),item);
  const close=()=>{
    objects.forEach(obj=>obj?.destroy?.());
    scene._arkonStoryObjectiveOpen=false;
    scene.events?.off?.('shutdown',close);
  };
  add(scene.add.rectangle(780,420,1560,840,0x020811,.70)
    .setDepth(depth).setInteractive());
  add(scene.add.rectangle(780,420,820,385,0x091a27,.99)
    .setStrokeStyle(2,0x69cada,1).setDepth(depth+1));
  add(scene.add.text(780,286,'ARKON DEN // STORY MODE',{
    fontFamily:PIXEL,fontSize:'17px',color:'#f4fbff'
  }).setOrigin(.5).setDepth(depth+2));
  add(scene.add.text(780,338,info.heading,{
    fontFamily:PIXEL,fontSize:'12px',color:'#8ee6f4'
  }).setOrigin(.5).setDepth(depth+2));
  add(scene.add.text(780,420,info.message,{
    fontFamily:BODY,fontSize:'25px',color:'#ffffff',
    align:'center',wordWrap:{width:680}
  }).setOrigin(.5).setDepth(depth+2));
  add(scene.add.text(780,493,info.progress,{
    fontFamily:PIXEL,fontSize:'11px',color:'#f6da8d'
  }).setOrigin(.5).setDepth(depth+2));
  const done=add(scene.add.rectangle(780,555,215,50,0x153847,1)
    .setStrokeStyle(2,0x64cde2,1).setDepth(depth+2)
    .setInteractive({useHandCursor:true}));
  add(scene.add.text(780,555,'BACK TO GAME',{
    fontFamily:PIXEL,fontSize:'10px',color:'#ffffff'
  }).setOrigin(.5).setDepth(depth+3));
  done.on('pointerdown',close);
  scene.events?.once?.('shutdown',close);
  return true;
}
