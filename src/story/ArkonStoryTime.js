// Story clock is private to Arkon's story save. Never change the shared
// WorldClock epoch or other accounts' day/night cycle.
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
export function getStoryWorldPhase(source,now=Date.now()){
  const get=key=>typeof source?.get==='function'?source.get(key):source?.[key];
  if(get('gameMode')==='arkonStory'){
    const override=String(get('arkonStoryTimeOfDay')||'').toLowerCase();
    if(override==='day'||override==='night')return override;
  }
  return getWorldPhase(now);
}
