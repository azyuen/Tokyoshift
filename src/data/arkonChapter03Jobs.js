// R656 — Chapter 03 uses customer-owned cars, not player-owned car slots.
// Parts on customer jobs are supplied by the customer; Arkon earns labour.
import { cars } from './cars.js?v=20261017-r565';
import { engines } from './engines.js?v=20261015-r527';
import {
  ENGINE_PART_ORDER, applyEngineTuning, normaliseEngineTuning,
} from './tuning.js?v=20261011-r479';
import { getRequiredWorkshopTier } from './workshopProgression.js?v=20261005-r362';

const read = (source,key) => typeof source?.get==='function'
  ? source.get(key) : source?.[key];
const CUSTOMER_CAR_POOL = Object.freeze([
  'fto','mx6','starion','prelude','sa22c','sw20',
  's15','forester','gdb','gf8','dc2','fc3s',
]);
export const ARKON_JOB_PAY = Object.freeze([25000,30000,30000,35000,40000]);
export const ARKON_CH3_RACE_ACTIVE = 'arkonStoryMx5Loan';

export const CANAL_YARD_MAX = Object.freeze(Object.fromEntries(
  ENGINE_PART_ORDER.map(id => {
    let max=0;
    for(let level=1;level<=3;level++){
      if(getRequiredWorkshopTier('engine',id,level)<=1)max=level;
    }
    return [id,max];
  })
));

export function getArkonCustomerJob(source,index){
  if(!Number.isInteger(index)||index<0||index>5)return null;
  const seed=(Number(read(source,'arkonStoryChapter03Seed'))>>>0)||1;
  const pool=[...CUSTOMER_CAR_POOL].filter(id=>cars[id]);
  let random=seed;
  for(let i=pool.length-1;i>0;i--){
    random=(1664525*random+1013904223)>>>0;
    const j=random%(i+1);
    [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  const carId=index>=4?'mx5':pool[index];
  const car=cars[carId];
  if(!car)return null;
  const maxPower=getArkonCustomerPower(carId,CANAL_YARD_MAX);
  const factor=[.11,.15,.19,.23,.25][Math.min(index,4)];
  const requested=Math.ceil((Number(car.powerKW||100)*(1+factor))/5)*5;
  return {
    index,carId,name:car.shortName||car.name,
    stockKW:Math.round(Number(car.powerKW||0)),
    targetKW:index===5?maxPower:Math.min(requested,maxPower),
    maxKW:maxPower,pay:index===5?0:ARKON_JOB_PAY[index],
    maximum:index===5,
  };
}
export function getArkonCustomerPower(carId,input={}){
  const car=cars[carId], engine=car&&engines[car.engine];
  if(!car)return 0;
  if(!engine)return Math.round(Number(car.powerKW)||0);
  return Math.round(applyEngineTuning(car,engine,{tuning:normaliseEngineTuning(input)}).car.powerKW);
}
export function isArkonCustomerJobComplete(job,levels){
  if(!job)return false;
  const tuning=normaliseEngineTuning(levels);
  if(job.maximum)return ENGINE_PART_ORDER.every(id=>tuning[id]===CANAL_YARD_MAX[id]);
  return getArkonCustomerPower(job.carId,tuning)>=job.targetKW;
}
export function recordArkonCustomerJob(source,index){
  if(read(source,'gameMode')!=='arkonStory')return false;
  const done=Math.max(0,Math.min(6,Number(read(source,'arkonStoryCustomerJobsDone')||0)));
  if(index!==done||index<0||index>5)return false;
  const job=getArkonCustomerJob(source,index);
  if(!job)return false;
  source.set('arkonStoryCustomerJobsDone',done+1);
  if(job.pay)source.set('cash',Math.min(1e9,
    Math.max(0,Number(read(source,'cash')||0))+job.pay));
  return true;
}

const RACE_KEYS = Object.freeze([
  'selectedRaceCategory','selectedRaceType','selectedRaceDistanceM',
  'selectedRaceDeal','selectedRaceStake','selectedRaceSpecialChallenge',
  'selectedRaceMeetOffer','selectedOpponentCarId','selectedOpponentCharacterId',
  'selectedOpponentEncounterRating','selectedOpponentEncounterAi',
  'selectedOpponentBuildState','selectedOpponentBuildRating',
  'selectedOpponentDifficulty','selectedRacePlayerCharacterId',
  'raceReturnScene','raceTimeOfDay','raceDistrict','raceLocationLabel',
]);
export function beginArkonMx5GuestRace(source){
  if(read(source,'gameMode')!=='arkonStory'||
     !read(source,'arkonStoryChapter02Done')||
     Number(read(source,'arkonStoryCustomerJobsDone')||0)<6||
     read(source,ARKON_CH3_RACE_ACTIVE)?.active)return false;
  const owned=[...(read(source,'ownedCarIds')||[])];
  const states=read(source,'carStates')||{};
  const locations=read(source,'carGarageLocations')||{};
  const loan={
    active:true,
    hadCar:owned.includes('mx5'),
    previousSelected:read(source,'selectedCarId')||null,
    previousPreferred:read(source,'preferredCarId')||null,
    previousState:states.mx5??null,
    previousLocation:locations.mx5??null,
    race:Object.fromEntries(RACE_KEYS.map(key=>[key,read(source,key)??null])),
  };
  source.set(ARKON_CH3_RACE_ACTIVE,loan);
  source.set('ownedCarIds',[...new Set([...owned,'mx5'])]);
  source.set('carStates',{...states,mx5:{...states.mx5,
    stock:false,tuning:{...CANAL_YARD_MAX},engineTuning:{...CANAL_YARD_MAX}}});
  source.set('carGarageLocations',{...locations,mx5:'shinonomeCanalYard'});
  source.set('selectedCarId','mx5');
  source.set('preferredCarId','mx5');
  const race={
    selectedRaceCategory:'SINGLE',selectedRaceType:'Roll Race',
    selectedRaceDistanceM:402.336,selectedRaceDeal:'BET',
    selectedRaceStake:0,selectedRaceSpecialChallenge:false,
    selectedRaceMeetOffer:null,selectedOpponentCarId:'s15',
    selectedOpponentCharacterId:'sotaKisaragi',
    selectedOpponentEncounterRating:3,selectedOpponentEncounterAi:null,
    selectedOpponentBuildState:null,selectedOpponentBuildRating:3,
    selectedOpponentDifficulty:'STANDARD',selectedRacePlayerCharacterId:null,
    raceReturnScene:'MeetScene',raceTimeOfDay:'night',raceDistrict:'TATSUMI',
    raceLocationLabel:'CHAPTER 03 // THE NIGHT SHIFT',
  };
  Object.entries(race).forEach(([key,val])=>source.set(key,val));
  source.set('arkonStoryMx5RaceResult',null);
  return true;
}
export function finishArkonMx5GuestRace(source){
  const loan=read(source,ARKON_CH3_RACE_ACTIVE);
  if(read(source,'gameMode')!=='arkonStory'||!loan?.active)return false;
  const owned=(read(source,'ownedCarIds')||[]).filter(id=>loan.hadCar||id!=='mx5');
  const states={...(read(source,'carStates')||{})};
  const locations={...(read(source,'carGarageLocations')||{})};
  if(loan.previousState==null)delete states.mx5;else states.mx5=loan.previousState;
  if(loan.previousLocation==null)delete locations.mx5;
  else locations.mx5=loan.previousLocation;
  source.set('ownedCarIds',owned);
  source.set('carStates',states);
  source.set('carGarageLocations',locations);
  source.set('selectedCarId',loan.previousSelected||
    owned.find(id=>cars[id])||null);
  source.set('preferredCarId',loan.previousPreferred||
    loan.previousSelected||owned[0]||null);
  for(const key of RACE_KEYS)source.set(key,loan.race?.[key]??null);
  source.set(ARKON_CH3_RACE_ACTIVE,null);
  return true;
}
