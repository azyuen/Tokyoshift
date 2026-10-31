// R748 — one-time semantic migration for the shorter Chapter 10 conclusion.
// R679 migration must run first. Do not replay paid jobs, old car sale,
// the one-time Ginza agreement, sponsorship seed, or a completed Porsche drive.
const get=(s,key)=>typeof s?.get==='function'?s.get(key):s?.[key];
export function migrateArkonR748Checkpoint(compiled,checkpoint,registry){
  if(compiled?.script?.id!=='arkonChapter10'||
     checkpoint?.id!=='arkonChapter10'||checkpoint.vars?.storyR748)return null;
  const steps=compiled.script.steps;
  const find=fn=>steps.findIndex(fn);
  const type=t=>find(s=>s.type===t);
  const phase=String(get(registry,'arkonStoryPhase')||'');
  const old=Math.max(0,Math.floor(Number(checkpoint.index)||0));
  const cutoff=find(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryPhase'&&s.value==='chapter10Ginza');
  let index=old;
  if(old>=cutoff&&cutoff>=0){
    const cruise=get(registry,'arkonStoryChapter10Cruise');
    if(cruise?.active)index=cruise.completed?type('ARKON_CH10_DRIVE_RETURN'):
      type('WAIT_SCENE');
    else if(get(registry,'arkonStoryChapter10CruiseFinished'))index=type('ARKON_CH10_YOKOHAMA');
    else if(get(registry,'arkonStoryCareerSeed'))index=type('ARKON_CH10_TIME_JUMP');
    else if(get(registry,'arkonStoryGinzaPartnership'))index=type('ARKON_CH10_INVEST');
    else index=cutoff;
  }
  if(index<0||index>=steps.length)index=Math.max(0,Math.min(old,steps.length-1));
  return {index,vars:{...(checkpoint.vars||{}),storyR748:true}};
}
