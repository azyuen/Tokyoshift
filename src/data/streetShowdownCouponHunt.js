// Street Showdown coupon hunting: real regional car preferences are shared
// between invitation generation and the Office search guide. No fictitious
// "live offers" or guarantees are presented.
import { cars, carOrder } from './cars.js?v=20261026-r687';
import { getEncounterProfile } from './encounterProfiles.js?v=20260926-r204';
import {
  TRAVEL_REGIONS, isTravelLocationUnlocked, getTravelLocationUnlockLabel,
} from './travelRegions.js?v=20261023-r652';

export const STREET_SHOWDOWN_COUPON_CHANCE=0.60;
// Existing meet favourites omitted both RX-7 FD and RX-8, despite offering
// coupons for them. Give these models realistic regional hunting venues.
export const EXTRA_SHOWDOWN_COUPON_MODELS=Object.freeze({
  TATSUMI:Object.freeze(['rx8']),
  SHIBUYA:Object.freeze(['rx8']),
  YOKOHAMA:Object.freeze(['rx7fd']),
  DAIKOKU:Object.freeze(['rx7fd']),
});

export function rollStreetShowdownCouponPrize(random=Math.random) {
  return Number(random()) < STREET_SHOWDOWN_COUPON_CHANCE;
}

export function getStreetShowdownCouponPool(locationId) {
  const id=String(locationId||'');
  const region=Object.keys(TRAVEL_REGIONS).find(key=>
    TRAVEL_REGIONS[key].locations.some(item=>item.id===id));
  if(!region||!['ODAIBA','SHINAGAWA','TATSUMI','SHIBUYA',
    'YOKOHAMA','DAIKOKU','SHINJUKU'].includes(region))return [];
  const liked=getEncounterProfile(id).likelyCars||[];
  const preferred=new Set([...liked,...(EXTRA_SHOWDOWN_COUPON_MODELS[region]||[])]);
  return carOrder.filter(carId=>preferred.has(carId)&&cars[carId]&&
    !cars[carId].collector&&!cars[carId].crewLoan&&!cars[carId].tuningLocked);
}

// These entries represent eligible regional coupon-model pools, not a scan
// of currently rolled offers. Some models will be chosen only when their
// performance is a credible match for the player car.
export function getStreetShowdownCouponHunts(carId,source) {
  if(!cars[carId]||!carOrder.includes(carId))return [];
  const regions=['ODAIBA','SHINAGAWA','TATSUMI','SHIBUYA',
    'YOKOHAMA','DAIKOKU','SHINJUKU'];
  const rows=[];
  for(const regionId of regions) {
    const region=TRAVEL_REGIONS[regionId];
    const matching=region.locations.filter(loc=>loc.available!==false&&
      getStreetShowdownCouponPool(loc.id).includes(carId));
    if(!matching.length)continue;
    const unlocked=matching.filter(loc=>isTravelLocationUnlocked(source,loc.id));
    const suggested=unlocked[0]||matching[0];
    rows.push({
      regionId,regionName:region.label,
      locationId:suggested.id,locationName:suggested.label,
      eligibleMeetCount:matching.length,unlockedMeetCount:unlocked.length,
      unlocked:unlocked.length>0,
      unlockLabel:unlocked.length?'OPEN':getTravelLocationUnlockLabel(source,suggested.id),
    });
  }
  return rows.sort((a,b)=>Number(b.unlocked)-Number(a.unlocked)||
    b.unlockedMeetCount-a.unlockedMeetCount||
    b.eligibleMeetCount-a.eligibleMeetCount||
    regions.indexOf(a.regionId)-regions.indexOf(b.regionId));
}
