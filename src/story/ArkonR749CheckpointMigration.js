// R749 — Chapter 10 adds two steps immediately after Aruken sells his Z:
// CLEAR_STAGE, then a forced GarageScene refresh against the new owned roster.
// Existing R748 in-progress numeric checkpoints must retain their scene.
export function migrateArkonR749Checkpoint(compiled,checkpoint){
  if(compiled?.script?.id!=='arkonChapter10' ||
      checkpoint?.id!=='arkonChapter10' ||
      checkpoint?.vars?.storyR749)return null;
  const steps=compiled.script.steps;
  const sale=steps.findIndex(step=>step.type==='ARKON_CH10_SELL_Z');
  if(sale<0)return null;
  const oldIndex=Math.max(0,Math.floor(Number(checkpoint.index)||0));
  // Checkpoints created by R748 recorded the next step after sale as
  // sale+1; in R749 that same stage begins at sale+3.
  const newIndex=Math.min(steps.length-1,oldIndex>sale?oldIndex+2:oldIndex);
  return {index:newIndex,vars:{...(checkpoint.vars||{}),storyR749:true}};
}
