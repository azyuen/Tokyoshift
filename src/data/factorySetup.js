// Park performance hardware without deleting purchases, history or saved presets.
const fields=['tuning','engineTuning','drivetrainTuning','chassisTuning','exhaustNosTuning','specialistTuning','stage3Calibration','tuneLevel','nosInstalled','nosPower','nosShots','nosCapacitySeconds'];
const clone=x=>JSON.parse(JSON.stringify(x));
export function parkPerformanceParts(state={}){
 if(state.parkedPerformanceParts)return state;
 const next=clone(state),parked={};for(const key of fields){if(key in state)parked[key]=clone(state[key]);next[key]=key==='nosInstalled'?false:['tuneLevel','nosPower','nosShots','nosCapacitySeconds'].includes(key)?0:key==='specialistTuning'?[]:{};}
 next.parkedPerformanceParts=parked;next.stock=true;return next;
}
export function restorePerformanceParts(state={}){
 if(!state.parkedPerformanceParts)return state;
 const next=clone(state),stored=next.parkedPerformanceParts;
 for(const key of fields){const old=stored[key],current=next[key];if(old===undefined)continue;
  if(key==='specialistTuning'){
   const ids=x=>Array.isArray(x)?x:Object.keys(x||{}).filter(k=>x[k]);next[key]=[...new Set([...ids(old),...ids(current)])];
  }else if(key==='stage3Calibration')next[key]=old;
  else if(old&&typeof old==='object')next[key]=Object.fromEntries([...new Set([...Object.keys(old),...Object.keys(current||{})])].map(k=>[k,Math.max(Number(old[k]||0),Number(current?.[k]||0))]));
  else next[key]=typeof old==='boolean'?Boolean(old||current):Math.max(Number(old||0),Number(current||0));
 }
 delete next.parkedPerformanceParts;next.stock=false;return next;
}
