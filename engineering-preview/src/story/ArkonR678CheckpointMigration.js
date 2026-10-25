// R678 semantic recovery for R677 active Story checkpoints.
// Old chapters stored numerical script positions, not durable scene IDs. New
// R678 screenplay steps must NEVER interpret those old indices as new actions.
// Already-completed chapters are unaffected. Recovery selects a nearby
// milestone using documented save progress; it never grants money or cars.
const MODIFIED=new Set(['arkonChapter01Revised','arkonChapter02','arkonChapter03',
  'arkonChapter04','arkonChapter05','arkonChapter07']);
export const isR678StoryScript=id=>MODIFIED.has(id);
const get=(s,key)=>typeof s?.get==='function'?s.get(key):s?.[key];

export function migrateArkonR678Checkpoint(compiled,checkpoint,registry){
  if(!compiled?.script||!MODIFIED.has(checkpoint?.id)||
     checkpoint?.vars?.storyR678===true)return null;
  const steps=compiled.script.steps;
  const find=fn=>steps.findIndex(fn);
  const type=(t)=>find(s=>s.type===t);
  const phase=String(get(registry,'arkonStoryPhase')||'');
  let index=checkpoint.index;
  if(checkpoint.id==='arkonChapter01Revised'){
    if(['rivalRace','practice','goSchool','lesson','complete'].includes(phase)){
      // Finish an old intro rather than replaying a settled wager or voucher.
      // The new Shibuya/school material appears in the following chapter.
      index=find(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryChapter01RevisedDone');
    }else if(phase==='meetNotice'){
      const repair=find(s=>s.type==='STAGE'&&s.characters?.some(a=>a.id==='aoiShindou'));
      if(repair>=0)index=Math.min(index,repair);
    }
  }else if(checkpoint.id==='arkonChapter02'){
    const win=key=>find(s=>s.type==='WAIT_WIN_DELTA'&&s.key===key);
    if(phase==='chapter02MeetRepair')index=win('ch2BeforeRepair');
    if(phase==='chapter02Driving'){
      index=get(registry,'arkonStoryCruiseComplete')
        ?find(s=>s.type==='MANGA'&&s.title==='AFTER THE DRIVE')
        :type('STORY_CRUISE');
    }
    if(phase==='chapter02AfterWorkshop')index=win('ch2BeforeFriendlyRace');
    if(phase==='chapter02RivalRace'){
      const result=get(registry,'arkonStoryChapter02RivalResult');
      index=result==='won'||result==='lost'
        ?find(s=>s.type==='IF'&&s.key==='arkonStoryChapter02RivalResult')
        :type('ARKON_CHALLENGE_RACE');
    }
  }else if(checkpoint.id==='arkonChapter03'){
    const done=Number(get(registry,'arkonStoryCustomerJobsDone')||0);
    if(phase==='chapter03Jobs'&&done>=3&&done<=5)
      index=find(s=>s.type==='ARKON_CUSTOMER_JOB'&&s.index===done);
    if(phase==='chapter03MaxBuild')
      index=find(s=>s.type==='ARKON_CUSTOMER_JOB'&&s.index===5);
    if(['chapter03Driving','chapter03GuestRace'].includes(phase))
      index=get(registry,'arkonStoryMx5RaceResult')
        ?type('ARKON_MX5_RETURN'):type('ARKON_MX5_RACE');
  }else if(checkpoint.id==='arkonChapter04'){
    const work=type('ARKON_CH4_WORK');
    if(phase==='chapter04Rebuild'&&index>work){
      // The genuine tuning/showdown requirement was already completed.
      index=find(s=>s.type==='PHONE'&&s.title==='CANAL YARD // AN OLD REPORT');
    }
    if(phase==='chapter04Finale')
      index=find(s=>s.type==='MANGA'&&s.title==='A TERRIBLE FINANCIAL DECISION');
  }else if(checkpoint.id==='arkonChapter05'){
    const done=Number(get(registry,'arkonStoryChapter05JobsDone')||0);
    const results=get(registry,'arkonStoryChapter05Results')||{};
    if(['chapter05Breakthrough','chapter05R34Test','chapter05Rotary','chapter05Supra','chapter05Daigo'].includes(phase)){
      const target=Math.min(3,Math.max(0,done));
      const firstAdded=find(s=>s.type==='STAGE'&&s.characters?.some(a=>a.id==='reinaKuroda'));
      // Before the first new consultation, old and new steps still align.
      if(!(phase==='chapter05Breakthrough'&&index<firstAdded)){
        const race=find(s=>s.type==='ARKON_CH5_RACE'&&s.index===target);
        const next=steps.findIndex((s,i)=>i>race&&s.type==='SET_FLAG'&&s.key==='arkonStoryPhase');
        index=Object.prototype.hasOwnProperty.call(results,target)&&next>=0?next:race;
      }
    }
  }else if(checkpoint.id==='arkonChapter07'){
    const work=get(registry,'arkonStoryChapter07Work')||{};
    if(work.converted){
      index=find(s=>s.type==='MANGA'&&s.title==='AN EXTRAORDINARY MACHINE');
    }else if(Number(work.racesDone)>=2){
      index=type('ARKON_CH7_CONVERT');
    }else if(Number(work.stage)>=3){
      // Earlier four-shop builds can continue: never fabricate seven paid
      // specialist purchases or force a prior-completed build to be repaid.
      index=find(s=>s.type==='ARKON_CH7_RACE'&&s.index===1);
    }
  }
  if(!Number.isInteger(index)||index<0||index>=steps.length)index=checkpoint.index;
  return {index,vars:{...(checkpoint.vars||{}),storyR678:true}};
}
