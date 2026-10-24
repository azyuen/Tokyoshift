// Aruken's suited portrait in manga is distinct from his full-height
// standing ginzaSuit actor. Talking and listening use the existing suited
// Dev portraits; explicit emotional Dev poses override them in scripts.
// Do not apply this to StoryStage, Career or mechanic/casual outfits.
export function resolveArkonSuitedMangaPose(characterId,pose,speaking=false){
  if(characterId!=='arkonDen' || String(pose||'').toLowerCase()!=='ginzasuit')
    return pose;
  return speaking?'devTalking':'devIdle';
}
