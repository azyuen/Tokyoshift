// R648 — spoiler-free, only visible in Arkon's separate Story Mode.
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';

import { ARKON_CHAPTER_01 } from '../data/arkonChapter01.js?v=20261022-r649';
import { ARKON_CHAPTER_01_REVISED } from '../data/arkonChapter01Revised.js?v=20261023-r653';
import { ARKON_CHAPTER_02 } from '../data/arkonChapter02.js?v=20261023-r657';
import { ARKON_CHAPTER_03 } from '../data/arkonChapter03.js?v=20261023-r656';
import { ARKON_CHAPTER_04 } from '../data/arkonChapter04.js?v=20261023-r659';
import { ARKON_CHAPTER_05 } from '../data/arkonChapter05.js?v=20261023-r666';
import { getRegionalChampionshipCount } from '../data/careerProgression.js?v=20261017-r553';

export function getArkonStoryObjective(registry) {
  const get=key=>registry?.get?.(key);
  if(get('gameMode')!=='arkonStory')return null;
  const wins=Math.max(0,Number(get('wins')||0));
  const active=get('storyDirectorProgress');
  const revised=active?.id===ARKON_CHAPTER_01_REVISED.id ||
    Boolean(get('arkonStoryChapter01RevisedDone'));
  if(get('arkonStoryChapter05Done'))return {
    heading:'CHAPTER 05 COMPLETE',
    message:'The Fastest Pair in Tokyo. Word is spreading about Arkon\'s work. Chapter 06 comes next.',
    progress:'THE FASTEST PAIR IN TOKYO // COMPLETED',
  };
  if(active?.id===ARKON_CHAPTER_05.id){
    const phase=get('arkonStoryPhase')||'chapter05Breakthrough';
    const stages={
      chapter05Breakthrough:['THE FIRST BIG BREAK','Inspect the Mine\'s R34 and bring it to the Shinagawa meet.'],
      chapter05R34Test:['THE FIRST TEST','Drive the customer\'s Mine\'s R34 and return it after the race.'],
      chapter05Rotary:['THE ROTARY COMMISSION','Prepare and test the RE Amemiya FD at Daikoku.'],
      chapter05Supra:['THE PRESTIGE WORK','Take the Top Secret Supra to Shinjuku for its test.'],
      chapter05Daigo:['A FAMILIAR AE86','Complete Daigo Kirishima\'s challenge with Sayaka beside you.'],
    };
    const [heading,message]=stages[phase]||['THE FASTEST PAIR IN TOKYO','Continue the chapter at the workshop or meet.'];
    return {heading,message,progress:'ARKON DEN // CHAPTER 05'};
  }
  if(get('arkonStoryChapter04Done'))return {
    canStartChapter05:true,
    heading:'CHAPTER 04 COMPLETE',
    message:'The Price of Trust. The RWB Porsche is an unsafe restoration project, not a race-ready car.',
    progress:'THE PRICE OF TRUST // COMPLETED',
  };
  if(active?.id===ARKON_CHAPTER_04.id){
    const phase=get('arkonStoryPhase')||'chapter04Arrival';
    const stages={
      chapter04Arrival:['THE NEW COMMISSION','Continue the arrival at the workshop.'],
      chapter04Porsche:['A RARE PORSCHE','Examine the RWB and speak with Sayaka.'],
      chapter04Inspection:['THE INSPECTION','Investigate the suspicious structural findings.'],
      chapter04Ethics:['A DIFFICULT DECISION','Respond to the client honestly.'],
      chapter04LowPoint:['THE COST OF PRINCIPLE','Continue the quiet evening at Canal Yard.'],
      chapter04Auction:['A CHANCE TO REBUILD','Consider the repossession auction and the debt.'],
      chapter04Finale:['THE TRANSPORTER RETURNS','Complete Chapter 04 at the workshop.'],
    };
    const [heading,message]=stages[phase]||['THE PRICE OF TRUST','Return to the workshop and continue the story.'];
    return {heading,message,progress:'ARKON DEN // CHAPTER 04'};
  }
  if(get('arkonStoryChapter03Done'))return {
    canStartChapter04:true,
    heading:'CHAPTER 04 // THE PRICE OF TRUST',
    message:'Return to Canal Yard workshop, open this Story Objective, then choose BEGIN CHAPTER 04. It will never launch over a Meet.',
    progress:'THE NIGHT SHIFT // COMPLETED',
  };
  if(active?.id===ARKON_CHAPTER_03.id){
    const jobs=Math.max(0,Number(get('arkonStoryCustomerJobsDone')||0));
    const phase=get('arkonStoryPhase')||'chapter03Jobs';
    const line=phase==='chapter03Jobs'
      ? ['THE NIGHT SHIFT','Tune five customer cars to their requested kW.','CUSTOMER JOBS '+Math.min(5,jobs)+' / 5']
      :phase==='chapter03MaxBuild'
        ? ['SAYAKA\'S MX-5','Tune her MX-5 to the Canal Yard maximum.','MAXIMUM PERFORMANCE']
        :phase==='chapter03GuestRace'
          ? ['THE ROLLING CHALLENGE','Finish the MX-5 race and return to the Meet.','SAYAKA\'S CAR']
          :['THE NIGHT SHIFT','Continue the scene with Sayaka.','CHAPTER 03'];
    return {heading:line[0],message:line[1],progress:line[2]};
  }
  if(get('arkonStoryChapter02Done') && getRegionalChampionshipCount(registry)>=1)return {
    heading:'CHAPTER 03 // THE NIGHT SHIFT',
    message:'Visit a street meet to begin the next story chapter.',
    progress:'REGIONAL CHAMPION',
  };
  if(get('arkonStoryChapter02Done'))return {
    heading:'CHAPTER 02 COMPLETE',
    message:'Go to an Odaiba street meet and press the crowned REGIONAL CHALLENGE button.',
    progress:'THE LONG WAY HOME // COMPLETED',
  };
  if(active?.id===ARKON_CHAPTER_02.id){
    const phase=get('arkonStoryPhase')||'chapter02Opening';
    const wins=Math.max(0,Number(get('wins')||0));
    const marker=phase==='chapter02Earn'?'ch2BeforeDock'
      :phase==='chapter02MeetRepair'?'ch2BeforeRepair'
      :phase==='chapter02AfterWorkshop'?'ch2BeforeFriendlyRace':null;
    const baseline=marker && Number.isFinite(Number(active.vars?.[marker]))
      ? Number(active.vars[marker]) : null;
    const progress=marker && baseline!==null
      ? 'WINS '+Math.min(2,Math.max(0,wins-baseline))+' / 2' : 'STORY SCENE';
    const goals={
      chapter02Opening:['UNWELCOME COMPANY','Continue Chapter 02 at the Meet.'],
      chapter02Earn:['KEEP YOUR FOOT IN','Win two street races. Arkon needs another way to earn money.'],
      chapter02MeetRepair:['THE 240Z NEEDS WORK','Win two more races, then return to a Meet.'],
      chapter02Driving:['THE LONG WAY HOME','Complete the rolling drive with Sayaka. If interrupted, return to a Meet to resume.'],
      chapter02AfterWorkshop:['ONE MORE TEST','Win two more races. Daigo wants another run.'],
      chapter02RivalRace:['FRIENDLY REMATCH','Complete the race with Daigo, then return to the Meet.'],
    };
    const [heading,message]=goals[phase]||['THE LONG WAY HOME','Continue the current story scene.'];
    return {heading,message,progress};
  }
  if(get('arkonStoryChapter01RevisedDone') && !active)return {
    heading:'CHAPTER 02 // THE LONG WAY HOME',
    message:'Visit a street meet to begin Arkon\'s next chapter.',
    progress:'CHAPTER 01 COMPLETE',
  };
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
  add(scene.add.text(780,530,'REPLAY / RESTART  //  OFFICE > RECOUNT STORY',{
    fontFamily:PIXEL,fontSize:'8px',color:'#91c2d6',
  }).setOrigin(.5).setDepth(depth+2));
  const canBegin=Boolean((info.canStartChapter04||info.canStartChapter05) &&
    scene.sys?.settings?.key==='GarageScene' && !scene.crewMode &&
    scene.registry.get('workshopLocationId')==='shinonomeCanalYard' &&
    !scene.game?.storyDirector?.status?.active &&
    !scene.registry.get('storyDirectorProgress'));
  if(canBegin){
    const begin=add(scene.add.rectangle(780,565,415,47,0x20514b,1)
      .setStrokeStyle(2,0x8af2c6).setDepth(depth+2)
      .setInteractive({useHandCursor:true}));
    const chapterId=info.canStartChapter05?'arkonChapter05':'arkonChapter04';
    const beginLabel=info.canStartChapter05?'BEGIN CHAPTER 05':'BEGIN CHAPTER 04';
    add(scene.add.text(780,565,beginLabel,{
      fontFamily:PIXEL,fontSize:'11px',color:'#ffffff',
    }).setOrigin(.5).setDepth(depth+3));
    begin.on('pointerdown',()=>{
      close();
      // Defer out of the pointer handler that destroys this modal. No
      // automatic hand-off, no underlying Meet invitation gets a click.
      scene.time.delayedCall(1,()=>{
        if(scene.sys?.isActive?.() && !scene.game?.storyDirector?.start?.(chapterId))
          scene.showWorkshopToast?.('CHAPTER 04 COULD NOT START');
      });
    });
  }
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
