// Chapter 04 pause: genuine post-setback 240Z progression, not pre-existing wins.
// No special race offers, free upgrades, or hidden power modifiers.
import {ENGINE_PART_ORDER,getEngineTuning} from './tuning.js?v=20260926-r211';
import {DRIVETRAIN_PART_ORDER,CHASSIS_PART_ORDER,EXHAUST_NOS_PART_ORDER,
  getDrivetrainTuning,getChassisTuning,getExhaustNosTuning
} from './secondaryTuning.js?v=20261008-r428';

export const ARKON_CH4_RACE_GOAL=3;
export const ARKON_CH4_SHOWDOWN_GOAL=1;
export const ARKON_CH4_BUILD_PARTS=ENGINE_PART_ORDER.length+
  DRIVETRAIN_PART_ORDER.length+CHASSIS_PART_ORDER.length+EXHAUST_NOS_PART_ORDER.length;
const read=(reg,key)=>typeof reg?.get==='function'?reg.get(key):reg?.[key];
const qualifies=reg=>read(reg,'gameMode')==='arkonStory' &&
  read(reg,'arkonStoryChapter03Done')&&!read(reg,'arkonStoryChapter04Done');
const num=value=>Math.max(0,Math.trunc(Number(value)||0));

export function getArkonCh4WorkProgress(reg){
  const work=read(reg,'arkonStoryChapter04Work');
  const state=read(reg,'carStates')?.['240z']||{};
  const groups=[
    [ENGINE_PART_ORDER,getEngineTuning(state)],
    [DRIVETRAIN_PART_ORDER,getDrivetrainTuning(state)],
    [CHASSIS_PART_ORDER,getChassisTuning(state)],
    [EXHAUST_NOS_PART_ORDER,getExhaustNosTuning(state)],
  ];
  const partsDone=groups.reduce((n,[names,levels])=>
    n+names.filter(part=>num(levels[part])>=1).length,0);
  const cashWins=num(work?.cashWins);
  const showdownWins=num(work?.showdownWins);
  const started=Boolean(work?.started);
  return {started,partsDone,partsTotal:ARKON_CH4_BUILD_PARTS,
    cashWins,requiredCashWins:ARKON_CH4_RACE_GOAL,
    showdownWins,requiredShowdownWins:ARKON_CH4_SHOWDOWN_GOAL,
    ready:started && partsDone===ARKON_CH4_BUILD_PARTS &&
      cashWins>=ARKON_CH4_RACE_GOAL && showdownWins>=ARKON_CH4_SHOWDOWN_GOAL};
}
export function startArkonCh4Work(reg){
  if(!qualifies(reg)||typeof reg?.set!=='function')return false;
  if(read(reg,'arkonStoryChapter04Work')?.started)return true;
  reg.set('arkonStoryChapter04Work',{started:true,cashWins:0,showdownWins:0});
  return true;
}
// Call only from RaceScene after normal settlement. Exactly one earned
// increment per ordinary 240Z cash win and one per completed Street Showdown.
export function recordArkonCh4Race(reg,{carId,mode,deal,playerWon,competitionWon}={}){
  if(!qualifies(reg)||typeof reg?.set!=='function'||!playerWon||
     !read(reg,'arkonStoryChapter04Work')?.started||carId!=='240z')return false;
  const old=read(reg,'arkonStoryChapter04Work');
  const cash=mode==='SINGLE'&&deal==='BET';
  const showdown=mode==='COMPETITION'&&competitionWon===true;
  if(!cash&&!showdown)return false;
  const cashWins=cash?Math.min(ARKON_CH4_RACE_GOAL,num(old.cashWins)+1):num(old.cashWins);
  const showdownWins=showdown?Math.min(ARKON_CH4_SHOWDOWN_GOAL,num(old.showdownWins)+1):num(old.showdownWins);
  reg.set('arkonStoryChapter04Work',{...old,cashWins,showdownWins});
  return true;
}
