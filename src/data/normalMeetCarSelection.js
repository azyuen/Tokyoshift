// Lightweight regional car lottery for REGULAR, three-minute Meet races.
// Street Showdowns and every authored career/crew race deliberately do not
// use this pool. No vehicle tuning, physics or AI parameters are modified.
import { cars, carOrder } from './cars.js?v=20261026-r687';
import { stockClassFor } from './stockClasses.js?v=20261026-r688';

// Follows the regional factory-class identity, without banning unusual visitors.
export const NORMAL_MEET_CLASS_FOCUS = Object.freeze({
  ODAIBA: Object.freeze(['D','C']),
  SHINAGAWA: Object.freeze(['C','B']),
  TATSUMI: Object.freeze(['C','B']),
  SHIBUYA: Object.freeze(['B','C']),
  YOKOHAMA: Object.freeze(['B','A']),
  DAIKOKU: Object.freeze(['A']),
  SHINJUKU: Object.freeze(['A','B']),
});
export const NORMAL_MEET_CANDIDATE_COUNT=8;

export function getNormalMeetPreferredClasses(locationId) {
  const id=String(locationId||'').toUpperCase();
  const region=Object.keys(NORMAL_MEET_CLASS_FOCUS)
    .find(key=>id.startsWith(key));
  return region?NORMAL_MEET_CLASS_FOCUS[region]:[];
}

function weightedPick(entries,random) {
  const total=entries.reduce((sum,entry)=>sum+entry.weight,0);
  let cursor=Math.max(0,Math.min(.999999999,Number(random())||0))*total;
  for(const entry of entries) {
    cursor-=entry.weight;
    if(cursor<0)return entry;
  }
  return entries[entries.length-1]||null;
}

// Select a small, distinct subset before the approved VehiclePerformance
// matcher tries tune/build combinations. Avoid a 43-car physics sweep per
// rival, which would slow loading relative to the previous fixed-car system.
export function getNormalMeetCandidateCars({
  locationId='',preferredCars=[],usedCarIds=[],playerCarId='',
  random=Math.random,maxCandidates=NORMAL_MEET_CANDIDATE_COUNT,
}={}) {
  const preferredClass=new Set(getNormalMeetPreferredClasses(locationId));
  const preferred=new Set(preferredCars||[]);
  const used=new Set(usedCarIds||[]);
  const remaining=carOrder.filter(id=>cars[id]&&!cars[id].collector&&
    !cars[id].tuningLocked&&!cars[id].crewLoan&&stockClassFor(cars[id]));
  const result=[];
  const limit=Math.max(1,Math.min(remaining.length,Math.floor(maxCandidates)||8));
  while(result.length<limit&&remaining.length) {
    const entries=remaining.map(id=>{
      let weight=preferredClass.has(stockClassFor(cars[id]))?4:0.45;
      if(preferred.has(id))weight*=1.65;
      if(used.has(id))weight*=0.08;
      if(id===playerCarId)weight*=0.65;
      return {id,weight};
    });
    const choice=weightedPick(entries,random);
    if(!choice)break;
    result.push(choice.id);
    remaining.splice(remaining.indexOf(choice.id),1);
  }
  return result;
}
