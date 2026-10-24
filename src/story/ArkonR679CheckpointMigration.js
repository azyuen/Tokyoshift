// R679: migrate old raw numeric Aruken Story indices after authored inserts.
// Never re-run Chapter 10's completed race, contracts or paid restorations.
const MODIFIED=new Set(['arkonChapter05','arkonChapter06','arkonChapter10']);
export const isR679StoryScript=id=>MODIFIED.has(id);
const get=(s,k)=>typeof s?.get==='function'?s.get(k):s?.[k];
export function migrateArkonR679Checkpoint(compiled,checkpoint,registry){
  if(!compiled?.script||!MODIFIED.has(checkpoint?.id)||
      checkpoint?.vars?.storyR679===true)return null;
  let index=Math.max(0,Math.floor(Number(checkpoint.index)||0));
  if(checkpoint.id==='arkonChapter05'){
    if(index>=60)index+=1;
  }else if(checkpoint.id==='arkonChapter06'){
    if(index>=41)index+=1;
  }else if(checkpoint.id==='arkonChapter10'){
    // Original R674 indices: Z farewell insertion at 32 (+9);
    // Ginza reciprocity before old 45 (+1); road dialogue before old 56 (+5).
    const ownsZ=(get(registry,'ownedCarIds')||[]).includes('arkonLibertyWalk240z');
    const sale=get(registry,'arkonStoryChapter10ZSale');
    const raceDone=get(registry,'arkonStoryChapter10RaceDone');
    if(index>=32&&ownsZ&&sale?.status!=='sold'&&raceDone){
      // Resume at the actual retirement of the hero car, not a Ginza or
      // Yokohama scene referring to a sale that never occurred.
      index=32;
    }else{
      index+=index>=56?13:index>=45?10:index>=32?9:0;
    }
  }
  if(!Number.isInteger(index)||index<0||
      index>=compiled.script.steps.length)return null;
  return {index,vars:{...(checkpoint.vars||{}),storyR679:true}};
}
