// R648 — spoiler-free, only visible in Arkon's separate Story Mode.
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';

import { ARKON_CHAPTER_01 } from '../data/arkonChapter01.js?v=20261022-r649';
import { ARKON_CHAPTER_01_REVISED } from '../data/arkonChapter01Revised.js?v=20261023-r653';

export function getArkonStoryObjective(registry) {
  const get=key=>registry?.get?.(key);
  if(get('gameMode')!=='arkonStory')return null;
  const wins=Math.max(0,Number(get('wins')||0));
  const revised=get('storyDirectorProgress')?.id===ARKON_CHAPTER_01_REVISED.id ||
    Boolean(get('arkonStoryChapter01RevisedDone'));
  if(revised){
    const phase=get('arkonStoryPhase')||'opening';
    const current=get('wins')||0;
    const goals={
      opening:['FIRST IMPRESSIONS','Continue the opening scene to begin your first night.','CHAPTER 01'],
      firstThree:['FIRST RUNS','Win three street races. Sayaka may be somewhere in the crowd.','RACE WINS '+Math.min(3,current)+' / 3'],
      meetNotice:['SOMEONE AT THE MEET','Look towards the edge of the main Meet stage. Tap YOU NOTICE HER.','MEET ENCOUNTER'],
      rivalRace:['A PERSONAL CHALLENGE','Complete the race and return to the Meet. The result is yours.','NO SCRIPTED OUTCOME'],
      practice:['A FEW MORE RUNS','Keep racing until you have six wins in total.','RACE WINS '+Math.min(6,current)+' / 6'],
      goSchool:['YOUR COMPLIMENTARY LESSON','Travel to Oshiage Driving School, then complete your introductory lesson.','OSHIAGE // DRIVING SCHOOL'],
      lesson:['A REAL DRIVING LESSON','Complete the basic driving lesson in Oshiage and return to the school.','INTRODUCTORY LESSON'],
      complete:['CHAPTER 01 COMPLETE','You can replay scenes at Office > Recount Story. More chapters are to come.','STORY PROGRESS SAVED'],
    };
    const [heading,message,progress]=goals[phase]||goals.opening;
    return {heading,message,progress};
  }
  if(get('arkonStoryChapter01FullDone'))return {
    heading:'CHAPTER 01 COMPLETE',
    message:'Chapter 01 is complete. Visit Office > Recount Story to relive it or restart.',
    progress:'STORY PROGRESS SAVED',
  };
  const index=Math.max(0,Math.floor(Number(get('storyDirectorProgress')?.index)||0));
  const steps=ARKON_CHAPTER_01.steps;
  const here=steps[index];
  if(here?.type==='WAIT_SCENE')return {
    heading:'CHAPTER 01 // AFTER HOURS',
    message:here.scene==='GarageScene'
      ? 'Return to your workshop to continue the story.'
      : 'Return to a street meet to continue the story.',
    progress:'RACE WINS  '+wins,
  };
  const next=steps.slice(index).find(step=>step.type==='WAIT_FLAG'&&step.key==='wins');
  if(next)return {
    heading:'CHAPTER 01 // AFTER HOURS',
    message:wins>=Number(next.atLeast)
      ? 'Your next scene is ready. Keep playing or return to the location indicated.'
      : 'Win more street races to advance Chapter 01. Cash and tuning remain yours.',
    progress:'RACE WINS  '+Math.min(wins,next.atLeast)+' / '+next.atLeast,
  };
  return {
    heading:'CHAPTER 01 // AFTER HOURS',
    message:'Continue the current scene to advance your story.',
    progress:'RACE WINS  '+wins,
  };
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
  add(scene.add.rectangle(780,420,820,535,0x091a27,.99)
    .setStrokeStyle(2,0x69cada,1).setDepth(depth+1));
  add(scene.add.text(780,230,'ARKON DEN // STORY MODE',{
    fontFamily:PIXEL,fontSize:'17px',color:'#f4fbff'
  }).setOrigin(.5).setDepth(depth+2));
  add(scene.add.text(780,293,info.heading,{
    fontFamily:PIXEL,fontSize:'12px',color:'#8ee6f4'
  }).setOrigin(.5).setDepth(depth+2));
  add(scene.add.text(780,395,info.message,{
    fontFamily:BODY,fontSize:'25px',color:'#ffffff',
    align:'center',wordWrap:{width:680}
  }).setOrigin(.5).setDepth(depth+2));
  add(scene.add.text(780,509,info.progress,{
    fontFamily:PIXEL,fontSize:'11px',color:'#f6da8d'
  }).setOrigin(.5).setDepth(depth+2));
  add(scene.add.text(780,552,'REPLAY / RESTART  //  OFFICE > RECOUNT STORY',{
    fontFamily:PIXEL,fontSize:'8px',color:'#91c2d6',
  }).setOrigin(.5).setDepth(depth+2));
  const done=add(scene.add.rectangle(780,620,215,50,0x153847,1)
    .setStrokeStyle(2,0x64cde2,1).setDepth(depth+2)
    .setInteractive({useHandCursor:true}));
  add(scene.add.text(780,620,'BACK TO GAME',{
    fontFamily:PIXEL,fontSize:'10px',color:'#ffffff'
  }).setOrigin(.5).setDepth(depth+3));
  done.on('pointerdown',close);
  scene.events?.once?.('shutdown',close);
  return true;
}
