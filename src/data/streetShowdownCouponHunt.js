// Shared lightweight Street Showdown schedule. Office and Meets inspect the
// SAME day/night slot from the WorldClock; no car assets or opponent physics
// are loaded while discovering where a coupon can actually be won.
import { cars, carOrder } from './cars.js?v=20261026-r687';
import { stockClassFor } from './stockClasses.js?v=20261026-r688';
import { getEncounterProfile } from './encounterProfiles.js?v=20260926-r204';
import { getOpenCircuitRotation } from '../environment/WorldClock.js?v=20261029-r712';
import {
  TRAVEL_REGIONS, isTravelLocationUnlocked, getTravelLocationUnlockLabel,
} from './travelRegions.js?v=20261023-r652';

export const STREET_SHOWDOWN_COUPON_CHANCE = 0.60;
export const STREET_SHOWDOWN_SCHEDULE_VERSION = 'R716-regional-class-clock';

// Street region identities reflect meet pools and progression, not additional
// crew-event eligibility rules (crew limits remain power/NOS/stock based).
export const STREET_SHOWDOWN_CLASS_FOCUS = Object.freeze({
  ODAIBA: Object.freeze(['D','C']),
  SHINAGAWA: Object.freeze(['C','B']),
  TATSUMI: Object.freeze(['C','B']),
  SHIBUYA: Object.freeze(['B','C']),
  YOKOHAMA: Object.freeze(['B','A']),
  DAIKOKU: Object.freeze(['A']),
  SHINJUKU: Object.freeze(['A','B']),
});
const REGION_ORDER = Object.freeze(['ODAIBA','SHINAGAWA','TATSUMI',
  'SHIBUYA','YOKOHAMA','DAIKOKU','SHINJUKU']);
// The focus defines the common stock classes. The envelope admits a much
// rarer neighbouring class; no individual model is assigned a hunting region.
// Each eligible non-collector car follows the same class-based rules.
export const STREET_SHOWDOWN_CLASS_ENVELOPE = Object.freeze({
  ODAIBA: Object.freeze(['D','C','B']),
  SHINAGAWA: Object.freeze(['D','C','B']),
  TATSUMI: Object.freeze(['C','B','A']),
  SHIBUYA: Object.freeze(['C','B','A']),
  YOKOHAMA: Object.freeze(['C','B','A']),
  DAIKOKU: Object.freeze(['B','A']),
  SHINJUKU: Object.freeze(['C','B','A']),
});
const ALLOWED=new Set(REGION_ORDER);
const REGIONAL_LOCATIONS=Object.freeze(REGION_ORDER.flatMap(id=>
  TRAVEL_REGIONS[id].locations.filter(loc=>loc.available!==false)
    .map(loc=>Object.freeze({id:loc.id,regionId:id,regionName:TRAVEL_REGIONS[id].label,
      locationName:loc.label}))));

function hash(input) {
  let value=2166136261;
  for(const ch of String(input))value=Math.imul(value^ch.charCodeAt(0),16777619);
  return value>>>0;
}
function unit(input) {return hash(input)/4294967296;}

function locationRegion(id) {
  return REGIONAL_LOCATIONS.find(loc=>loc.id===id)?.regionId||'';
}
function availableCar(id) {
  return carOrder.includes(id)&&cars[id]&&
    !cars[id].collector&&!cars[id].tuningLocked&&!cars[id].crewLoan;
}

// All cars in the region's permitted factory-class envelope can eventually
// appear, including models absent from the authored Meet favourites. Actual
// regional affinity is a weighting, not a model-specific hard-coded exception.
export function getStreetShowdownCouponPool(locationId) {
  const region=locationRegion(String(locationId||''));
  const allowed=new Set(STREET_SHOWDOWN_CLASS_ENVELOPE[region]||[]);
  if(!ALLOWED.has(region))return [];
  return carOrder.filter(carId=>availableCar(carId)&&
    allowed.has(stockClassFor(cars[carId])));
}
export function rollStreetShowdownCouponPrize(random=Math.random) {
  return Number(random())<STREET_SHOWDOWN_COUPON_CHANCE;
}
export function getStreetShowdownScheduleSlot(now=Date.now()) {
  return getOpenCircuitRotation(now);
}
function weightedPrizeCar(locationId, rotationIndex) {
  const pool=getStreetShowdownCouponPool(locationId);
  const region=locationRegion(locationId);
  const focus=new Set(STREET_SHOWDOWN_CLASS_FOCUS[region]||[]);
  const local=new Set(getEncounterProfile(locationId).likelyCars||[]);
  const focused=pool.filter(id=>focus.has(stockClassFor(cars[id])));
  const regional=focused.filter(id=>local.has(id));
  const visiting=focused.filter(id=>!local.has(id));
  const wildcard=pool.filter(id=>!focus.has(stockClassFor(cars[id])));
  // 80% region-favourite within the focused classes; 15% other models in
  // those same classes; 5% a neighbouring-class wildcard. Every model is
  // treated identically, by class and by existing Meet-region affinity.
  const sample=unit(rotationIndex+':'+locationId+':car-band');
  const candidates=sample<.80
    ? (regional.length?regional:focused.length?focused:pool)
    : sample<.95
      ? (visiting.length?visiting:focused.length?focused:pool)
      : (wildcard.length?wildcard:focused.length?focused:pool);
  return candidates.length
    ? candidates[hash(rotationIndex+':'+locationId+':car-choice')%candidates.length]
    : null;
}
// No pre-rendering, no heavy vehicle simulations, no remote calls.
// A slot is recomputable and independent of the player's selected car:
// switching cars does not change an Office-advertised prize.
export function getStreetShowdownScheduledOffer(locationId, {
  now=Date.now(),rotationIndex=null,
}={}) {
  if(!locationRegion(locationId))return null;
  const rotation=rotationIndex==null
    ? getStreetShowdownScheduleSlot(now).rotationIndex
    : Number(rotationIndex);
  const coupon=rollStreetShowdownCouponPrize(
    ()=>unit(rotation+':'+locationId+':prize-type'));
  const carId=coupon?weightedPrizeCar(locationId,rotation):null;
  return Object.freeze({
    locationId, rotationIndex:rotation,
    prizeType: coupon&&carId?'COUPON':'CASH',
    prizeCarId:coupon?carId:null,
    scheduleVersion:STREET_SHOWDOWN_SCHEDULE_VERSION,
  });
}
export function getActiveStreetShowdownCouponOffers(carId,source,opts={}) {
  if(!availableCar(carId))return [];
  const wins=Number(source?.get?.('wins')??source?.wins??0);
  const remaining=Math.max(0,Number(source?.get?.('competitionCooldownUntil')??
    source?.competitionCooldownUntil??0)-(opts.now||Date.now()));
  return REGIONAL_LOCATIONS.map(loc=>{
    const scheduled=getStreetShowdownScheduledOffer(loc.id,opts);
    const unlocked=isTravelLocationUnlocked(source,loc.id);
    return {...loc,...scheduled,unlocked,
      accessLabel:unlocked?(wins<1?'WIN 1 RACE':remaining>0?'COOLDOWN':'READY')
        :getTravelLocationUnlockLabel(source,loc.id)};
  }).filter(row=>row.prizeType==='COUPON'&&row.prizeCarId===carId)
    .sort((a,b)=>Number(b.unlocked)-Number(a.unlocked)||
      REGION_ORDER.indexOf(a.regionId)-REGION_ORDER.indexOf(b.regionId));
}
// Potential hunting regions are displayed separately from exact live offers.
export function getStreetShowdownCouponHunts(carId,source) {
  if(!availableCar(carId))return [];
  return REGION_ORDER.map(regionId=>{
    const region=TRAVEL_REGIONS[regionId];
    const matching=region.locations.filter(loc=>loc.available!==false&&
      getStreetShowdownCouponPool(loc.id).includes(carId));
    if(!matching.length)return null;
    const focus=STREET_SHOWDOWN_CLASS_FOCUS[regionId]||[];
    const focusMatch=focus.includes(stockClassFor(cars[carId]));
    const favourites=matching.filter(loc=>
      (getEncounterProfile(loc.id).likelyCars||[]).includes(carId));
    const huntTier=focusMatch
      ? favourites.length?'REGIONAL FAVOURITE':'CLASS MATCH'
      : 'RARE WILDCARD';
    const unlocked=matching.filter(loc=>isTravelLocationUnlocked(source,loc.id));
    const suggested=unlocked.find(loc=>favourites.includes(loc))||
      unlocked[0]||favourites[0]||matching[0];
    return {
      regionId,regionName:region.label,
      locationId:suggested.id,locationName:suggested.label,
      eligibleMeetCount:matching.length,unlockedMeetCount:unlocked.length,
      huntTier,focusMatch,
      unlocked:unlocked.length>0,
      unlockLabel:unlocked.length?'OPEN':getTravelLocationUnlockLabel(source,suggested.id),
    };
  }).filter(Boolean).sort((a,b)=>
    (a.huntTier==='REGIONAL FAVOURITE'?0:a.huntTier==='CLASS MATCH'?1:2)-
      (b.huntTier==='REGIONAL FAVOURITE'?0:b.huntTier==='CLASS MATCH'?1:2)||
    Number(b.unlocked)-Number(a.unlocked)||
    b.unlockedMeetCount-a.unlockedMeetCount||
    b.eligibleMeetCount-a.eligibleMeetCount);
}
