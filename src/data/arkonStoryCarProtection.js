// Aruken's personal Datsun 240Z is story-critical. Its only authorised
// transfer is the authored Chapter 10 settlement (which uses its own handler).
// Market trading remains available for every ordinary Career vehicle.
const read=(source,key)=>typeof source?.get==='function'?source.get(key):source?.[key];

export function isArkonStory240zProtected(source,carId){
  if(read(source,'gameMode')!=='arkonStory')return false;
  if(!['240z','arkonLibertyWalk240z'].includes(String(carId||'')))return false;
  return read(source,'arkonStoryChapter10ZSale')?.status!=='sold';
}
