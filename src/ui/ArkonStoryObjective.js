// R648 — spoiler-free, only visible in Aruken's separate Story Mode.
const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';

import { ARKON_CHAPTER_01 } from '../data/arkonChapter01.js?v=20261022-r649';
import { ARKON_CHAPTER_01_REVISED } from '../data/arkonChapter01Revised.js?v=20261024-r678';
import { ARKON_CHAPTER_02 } from '../data/arkonChapter02.js?v=20261024-r678';
import { ARKON_CHAPTER_03 } from '../data/arkonChapter03.js?v=20261024-r678';
import { ARKON_CHAPTER_04 } from '../data/arkonChapter04.js?v=20261024-r678';
import {getArkonCh4WorkProgress} from '../data/arkonChapter04Work.js?v=20261023-r667';
import { ARKON_CHAPTER_05 } from '../data/arkonChapter05.js?v=20261024-r678';
import {ARKON_CHAPTER_06} from '../data/arkonChapter06.js?v=20261024-r675';
import {ch6Progress} from '../data/arkonChapter06Work.js?v=20261024-r675';
import {ARKON_CHAPTER_07} from '../data/arkonChapter07.js?v=20261024-r678';
import {ch7Progress} from '../data/arkonChapter07Progress.js?v=20261024-r678';
import {ARKON_CHAPTER_08} from '../data/arkonChapter08.js?v=20261023-r672';
import {ARKON_CHAPTER_09} from '../data/arkonChapter09.js?v=20261023-r673';
import {ARKON_CHAPTER_10} from '../data/arkonChapter10.js?v=20261023-r674';
import { getRegionalChampionshipCount } from '../data/careerProgression.js?v=20261017-r553';

export function getArkonStoryObjective(registry) {
  const get=key=>registry?.get?.(key);
  if(get('gameMode')!=='arkonStory')return null;
  const wins=Math.max(0,Number(get('wins')||0));
  const active=get('storyDirectorProgress');
  const revised=active?.id===ARKON_CHAPTER_01_REVISED.id ||
    Boolean(get('arkonStoryChapter01RevisedDone'));
  if(get('arkonStoryChapter10Done'))return {
    heading:'ARUKEN\'S STORY // COMPLETE',
    message:'Ginza Gallery is open. Aruken and Sayaka are business partners, and their quiet investment in Daichi and a new driver begins another story.',
    progress:'THE ROAD AHEAD // THE END',
  };
  if(active?.id===ARKON_CHAPTER_10.id){
    const phase=get('arkonStoryPhase')||'chapter10Recovery';
    const count=Math.max(0,Number(get('arkonStoryChapter10ProjectsDone')||0));
    const stages={
      chapter10Recovery:['A FAMILIAR SOUND','The dispute is partly resolved, but the final liabilities remain. Return to honest work.'],
      chapter10Restorations:['BACK TO THE CRAFT','Complete the customer restorations and prepare to meet the remaining obligations.'],
      chapter10TestDrive:['JUST FOR FUN','Run the friendly Daikoku test. No stakes, no special advantages.'],
      chapter10Ginza:['GINZA GALLERY','After the Z sale settles the liabilities, build a gallery as equal partners with Sayaka.'],
      chapter10Investment:['A LITTLE OPPORTUNITY','Support Daichi and a promising family friend who loves cars.'],
      chapter10FinalDrive:['THE ROAD AHEAD','Travel together in Sayaka\'s RWB Porsche to Yokohama.'],
    };
    const [heading,message]=stages[phase]||['THE ROAD AHEAD','Continue Chapter 10.'];
    return {heading,message,progress:'RESTORATIONS '+count+'/3  //  CHAPTER 10'};
  }
  if(get('arkonStoryChapter09Done'))return {
    canStartChapter10:Boolean(get('arkonStoryChapter09Refused')),
    heading:'CHAPTER 10 // THE ROAD AHEAD',
    message:'Return to Warehouse HQ for the final chapter: rebuild honestly, open Ginza with Sayaka, and discover what comes next.',
    progress:'NO WAY OUT // COMPLETED',
  };
  if(active?.id===ARKON_CHAPTER_09.id){
    const phase=get('arkonStoryPhase')||'chapter09Contracts';
    const count=Math.max(0,Number(get('arkonStoryChapter09RacesDone')||0));
    const steps={
      chapter09Contracts:['THE GOLDEN CAGE','Check the new private programme and complete the first real demonstration race.'],
      chapter09Pressure:['DAIKOKU // RAISED PRESSURE','The paperwork no longer adds up. Complete the second demonstration race.'],
      chapter09SayakaReturns:['THE PORSCHE RETURNS','Talk with Sayaka. She cannot decide for Aruken, but she can stand beside him.'],
      chapter09FinalMeet:['THE LAST SIGNATURE','Decline the unverifiable certification and leave the meet with independent support.'],
      chapter09RoadHome:['THE ROAD HOME','An honest decision does not erase the consequences.'],
    };
    const [heading,message]=steps[phase]||['NO WAY OUT','Continue Chapter 09.'];
    return {heading,message,progress:'DEMONSTRATION RACES '+count+'/2  //  ARUKEN DENZAKI // CHAPTER 09'};
  }
  if(get('arkonStoryChapter08Done'))return {
    canStartChapter09:Boolean(get('arkonStoryChapter08ContractSigned')),
    heading:'CHAPTER 08 COMPLETE',
    message:'The Shibuya deal is signed. Warehouse HQ is committed under a conditional guarantee. Aruken and Sayaka are still speaking, but something has changed.',
    progress:'THE PRICE OF AMBITION // COMPLETED',
  };
  if(active?.id===ARKON_CHAPTER_08.id){
    const phase=get('arkonStoryPhase')||'chapter08Together';
    const count=Math.max(0,Number(get('arkonStoryChapter08RacesDone')||0));
    const entries={
      chapter08Together:['STILL TOGETHER','Sayaka has come by the workshop. An exclusive invitation awaits.'],
      chapter08FirstRace:['SHINAGAWA // FIRST INVITATION','Race with Sayaka beside you. The outcome is genuine, with a capped cash stake.'],
      chapter08SecondRace:['DAIKOKU // RAISED STAKES','Another private race. The stakes are growing.'],
      chapter08Invitation:['AN EVENING IN SHIBUYA','Ask Sayaka to accompany you to the exclusive VIP event.'],
      chapter08ThirdRace:['SHIBUYA // LAST INVITATIONAL','Drive the third and final private race before the party.'],
      chapter08VipParty:['THE SHIBUYA PARTY','An uncomfortable offer, a difficult conversation, and a consequential decision.'],
    };
    const [heading,message]=entries[phase]||['THE PRICE OF AMBITION','Continue Chapter 08.'];
    return {heading,message,progress:'PRIVATE RACES '+count+'/3  //  ARUKEN DENZAKI // CHAPTER 08'};
  }
  if(get('arkonStoryChapter07Done'))return {
    canStartChapter08:true,
    heading:'CHAPTER 08 // THE PRICE OF AMBITION',message:'Begin at Warehouse HQ. Three private invitational races and the Shibuya VIP event await.',
    progress:'NEVER ENOUGH // COMPLETED',
  };
  if(active?.id===ARKON_CHAPTER_07.id){
    const phase=get('arkonStoryPhase')||'chapter07Business';
    const p=ch7Progress(registry);
    if(['chapter07FirstBuild','chapter07FinalBuild'].includes(phase)){
      const first=phase==='chapter07FirstBuild';
      const done=first?p.level2:p.level3;
      return {
        heading:first?'THE 240Z // REGIONAL BUILD':'THE 240Z // MAXIMUM BUILD',
        message:first
          ? 'Upgrade your 240Z to Level 2. Visit AMUSE (Shibuya) and MINE\'S (Yokohama); meet their specialists on arrival. Then return to Warehouse HQ.'
          : 'Warehouse HQ now offers paid Level 3 parts for your 240Z without the usual win restriction. Upgrade every part, visit all seven specialists and purchase one eligible treatment at each.',
        progress:'LEVEL '+(first?'2':'3')+' PARTS '+done+'/'+p.partsTotal+
          ' // SHOPS '+(first?(p.firstIntroductions?.length||0):(p.shops?.length||0))+'/'+p.shopGoal+
          (first?'':' // SPECIALIST TUNES '+(p.treatments?.length||0)+'/7'),
        canResumeChapter07:p.ready,
      };
    }
    const goals={
      chapter07Business:['THE MAN IN THE SUIT','Complete the first signed commission and launch the 240Z build.'],
      chapter07MoreBusiness:['ANOTHER BIG CONTRACT','Complete another customer commission and speak to Sayaka.'],
      chapter07Bodywork:['LIBERTY WALK // 240Z','Finish the bespoke bodywork and reveal the converted car.'],
      chapter07SoloDrive:['THE LONELIEST DRIVE','A cinematic solo drive. The passenger seat is empty.'],
    };
    const [heading,message]=goals[phase]||['NEVER ENOUGH','Continue Chapter 07.'];
    return {heading,message,progress:'ARUKEN DENZAKI // CHAPTER 07'};
  }
  if(get('arkonStoryChapter06Done'))return {
    canStartChapter07:true,
    heading:'CHAPTER 07 // NEVER ENOUGH',
    message:'At Warehouse HQ, open Story Objective and begin Chapter 07. Contracts, specialist tuner visits and the 240Z await.',
    progress:'EVERYTHING WE BUILT // COMPLETED',
  };

  if(active?.id===ARKON_CHAPTER_06.id){
    const phase=get('arkonStoryPhase')||'chapter06Commissions';
    const a=ch6Progress(registry);
    const stages={
      chapter06Commissions:['THREE NEW COMMISSIONS','Complete three customer tuning orders. The signed labour invoices are reserved for workshop and Porsche obligations.'],
      chapter06Warehouse:['WAREHOUSE HQ','The new workshop expansion is paid for. Continue the transfer and finance settlement.'],
      chapter06Restoration:['THE RWB REBUILD','Complete all three documented structural, mechanical and safety inspection packages.'],
      chapter06NightDrive:['THE YOKOHAMA DRIVE','Watch the restored Porsche cruise to the Ferris wheel. There is no race or timing.'],
    };
    const [heading,message]=stages[phase]||['EVERYTHING WE BUILT','Continue Chapter 06.'];
    return {heading,message,
      progress:phase==='chapter06Commissions'
        ? 'CONTRACTS '+a.jobsDone+'/3  //  RESERVED  ¥ '+Number(a.escrow||0).toLocaleString('en-AU')
        :phase==='chapter06Restoration'
        ? 'VERIFIED WORK '+a.restorationDone+'/3  //  FINANCE '+(a.financeCleared?'PAID':'DUE')
        :'ARUKEN DENZAKI // CHAPTER 06'};
  }
  if(get('arkonStoryChapter05Done'))return {
    canStartChapter06:true,
    heading:'CHAPTER 06 // EVERYTHING WE BUILT',
    message:'Return to Canal Yard, open Story Objective, and begin the next chapter. Three new clients, Warehouse HQ and the unfinished Porsche await.',
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
    return {heading,message,progress:'ARUKEN DENZAKI // CHAPTER 05'};
  }
  if(get('arkonStoryChapter04Done'))return {
    canStartChapter05:true,
    heading:'CHAPTER 05 // THE FASTEST PAIR',
    message:'A collector wants Aruken to restore and test a Mine\'s R34. Return to Canal Yard and choose BEGIN CHAPTER 05. The RWB stays under restoration.',
    progress:'CHAPTER 04 COMPLETED // A NEW COMMISSION',
  };
  if(active?.id===ARKON_CHAPTER_04.id){
    const phase=get('arkonStoryPhase')||'chapter04Arrival';
    if(phase==='chapter04Rebuild'){
      const work=getArkonCh4WorkProgress(registry);
      return {
        heading:work.ready?'THE 240Z IS READY':'REBUILD YOUR REPUTATION',
        message:work.ready
          ?'All goals complete. Return to Canal Yard and choose CONTINUE CHAPTER 04 to find out what happens next.'
          :'Fit at least Level 1 in ALL 16 tuning parts on the 240Z (use Canal Yard for the workshop-only upgrades). Win 3 regular cash races and one complete Street Showdown in your 240Z.',
        progress:'L1 PARTS '+work.partsDone+'/'+work.partsTotal+
          '   //   RACES '+work.cashWins+'/3'+
          '   //   SHOWDOWN '+work.showdownWins+'/1',
        canResumeChapter04:work.ready,
      };
    }
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
    return {heading,message,progress:'ARUKEN DENZAKI // CHAPTER 04'};
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
      chapter02Earn:['KEEP YOUR FOOT IN','Win two street races. Aruken needs another way to earn money.'],
      chapter02MeetRepair:['SHIBUYA // A DIFFICULT REPAIR','Win two more races, then return to a Meet for an unexpected commission.'],
      chapter02GoSchool:['OSHIAGE // A FREE LESSON','Visit Oshiage Driving School to meet the instructor Sayaka recommended.'],
      chapter02Lesson:['OSHIAGE // THE INSTRUCTOR','Complete the introductory driving lesson with Sayaka, then return to the School.'],
      chapter02Driving:['THE LONG WAY HOME','Complete the rolling drive with Sayaka. If interrupted, return to a Meet to resume.'],
      chapter02AfterWorkshop:['ONE MORE TEST','Win two more races. Daigo wants another run.'],
      chapter02RivalRace:['FRIENDLY REMATCH','Complete the race with Daigo, then return to the Meet.'],
    };
    const [heading,message]=goals[phase]||['THE LONG WAY HOME','Continue the current story scene.'];
    return {heading,message,progress};
  }
  if(get('arkonStoryChapter01RevisedDone') && !active)return {
    heading:'CHAPTER 02 // THE LONG WAY HOME',
    message:'Visit a street meet to begin Aruken\'s next chapter.',
    progress:'CHAPTER 01 COMPLETE',
  };
  if(revised){
    const phase=get('arkonStoryPhase')||'opening';
    const current=get('wins')||0;
    const goals={
      opening:['FIRST IMPRESSIONS','Continue the opening scene to begin your first night.','CHAPTER 01'],
      firstThree:['FIRST RUNS','Win three street races. Aoi and Haru may need help with their 240Z.','RACE WINS '+Math.min(3,current)+' / 3'],
      meetNotice:['SOMEONE AT THE MEET','At the Meet, tap YOU NOTICE HER to begin an encounter that changes Aruken\'s life.','MEET ENCOUNTER'],
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
  add(scene.add.text(780,230,'ARUKEN DENZAKI // STORY MODE',{
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
  const checkpoint=scene.registry.get('storyDirectorProgress');
  const isResume=Boolean(info.canResumeChapter04 &&
    checkpoint?.id==='arkonChapter04' ||
    info.canResumeChapter07 && checkpoint?.id==='arkonChapter07');
  const canBegin=Boolean((info.canStartChapter04||info.canStartChapter05||info.canStartChapter06||info.canStartChapter07||info.canStartChapter08||info.canStartChapter09||info.canStartChapter10||isResume) &&
    scene.sys?.settings?.key==='GarageScene' && !scene.crewMode &&
    (scene.registry.get('workshopLocationId')==='shinonomeCanalYard' ||
     ((info.canStartChapter06||info.canStartChapter07||info.canStartChapter08||info.canStartChapter09||info.canStartChapter10||info.canResumeChapter07) &&
       scene.registry.get('workshopLocationId')==='shinonomeWarehouseStrip')) &&
    !scene.game?.storyDirector?.status?.active &&
    (isResume||!checkpoint));
  if(canBegin){
    const begin=add(scene.add.rectangle(780,565,415,47,0x20514b,1)
      .setStrokeStyle(2,0x8af2c6).setDepth(depth+2)
      .setInteractive({useHandCursor:true}));
    const chapterId=info.canStartChapter10?'arkonChapter10':
      info.canStartChapter09?'arkonChapter09':
      info.canStartChapter08?'arkonChapter08':
      info.canStartChapter07||info.canResumeChapter07?'arkonChapter07':
      info.canStartChapter06?'arkonChapter06':
      info.canStartChapter05?'arkonChapter05':'arkonChapter04';
    const beginLabel=isResume?'CONTINUE '+(info.canResumeChapter07?'CHAPTER 07':'CHAPTER 04'):
      info.canStartChapter10?'BEGIN CHAPTER 10':
      info.canStartChapter09?'BEGIN CHAPTER 09':
      info.canStartChapter08?'BEGIN CHAPTER 08':
      info.canStartChapter07?'BEGIN CHAPTER 07':
      info.canStartChapter06?'BEGIN CHAPTER 06':
      info.canStartChapter05?'BEGIN CHAPTER 05':'BEGIN CHAPTER 04';
    add(scene.add.text(780,565,beginLabel,{
      fontFamily:PIXEL,fontSize:'11px',color:'#ffffff',
    }).setOrigin(.5).setDepth(depth+3));
    begin.on('pointerdown',()=>{
      close();
      // Defer out of the pointer handler that destroys this modal. No
      // automatic hand-off, no underlying Meet invitation gets a click.
      scene.time.delayedCall(1,()=>{
        const opts=isResume?{index:checkpoint.index,vars:checkpoint.vars||{}}:undefined;
        if(scene.sys?.isActive?.() && !scene.game?.storyDirector?.start?.(chapterId,opts))
          scene.showWorkshopToast?.('CHAPTER COULD NOT CONTINUE');
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
