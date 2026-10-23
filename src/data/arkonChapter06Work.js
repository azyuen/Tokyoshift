// R668 — Chapter 06 finances and RWB provenance: separate earned invoices
// from spendable cash. Every milestone is idempotent, Story-only and auditable.
import {getArkonCustomerJob} from './arkonChapter03Jobs.js?v=20261023-r660';
import {normaliseCarGarageLocations} from './workshopProgression.js?v=20261023-r662';
import {cars} from './cars.js?v=20261017-r565';

const read=(s,k)=>typeof s?.get==='function'?s.get(k):s?.[k];
const set=(s,k,v)=>s.set(k,v);
const story=s=>read(s,'gameMode')==='arkonStory'&&
  read(s,'arkonStoryChapter05Done')&&!read(s,'arkonStoryChapter06Done')&&
  typeof s?.set==='function';
const n=x=>Math.max(0,Math.floor(Number(x)||0));
export const CH6_FEES=Object.freeze([1400000,1600000,1800000]);
export const CH6_WAREHOUSE_COST=750000;
export const CH6_RESTORATION=Object.freeze([
  Object.freeze({title:'STRUCTURAL REBUILD',cost:450000,
    description:'Remove the damaged support panels; measure, jig and repair the shell.',
    checks:['Record chassis reference points','Replace damaged structural metal',
      'Measure geometry against factory specification','Independent weld and alignment inspection']}),
  Object.freeze({title:'ENGINE AND DRIVELINE',cost:250000,
    description:'Rebuild the Porsche powertrain for reliability, not a quick dyno headline.',
    checks:['Inspect crankcase and oil system','Renew compromised engine components',
      'Refit mounts and inspect driveline','Warm-run leak and pressure checks']}),
  Object.freeze({title:'SAFETY CERTIFICATION',cost:200000,
    description:'Independent sign-off before road use: tyres, brakes, restraint systems and structural certificate.',
    checks:['Verify brakes, tyres and steering','Document all repairs and safety systems',
      'Independent structural sign-off','Record roadworthiness and registration clearance']}),
]);
export const CH6_RACE_KEYS=Object.freeze([
  'selectedRaceCategory','selectedRaceType','selectedRaceDistanceM',
  'selectedRaceDeal','selectedRaceStake','selectedRaceSpecialChallenge',
  'selectedRaceMeetOffer','selectedOpponentCarId','selectedOpponentCharacterId',
  'selectedOpponentEncounterRating','selectedOpponentEncounterAi',
  'selectedOpponentBuildState','selectedOpponentBuildRating',
  'selectedOpponentDifficulty','selectedRacePlayerCharacterId',
  'raceReturnScene','raceTimeOfDay','raceDistrict','raceLocationLabel',
]);

const accounts=s=>read(s,'arkonStoryChapter06Accounts')||{
  jobsDone:0,escrow:0,warehousePaid:false,financeCleared:false,
  restorationDone:0,restorationCost:0,distributed:false};
export function ch6Progress(s){return {...accounts(s)};}
export function getArkonCh6Job(s,index){
  if(!Number.isInteger(index)||index<0||index>=3)return null;
  const original=getArkonCustomerJob(s,index);
  return original?{...original,pay:CH6_FEES[index],
    client:'INDEPENDENT PREMIUM SERVICE // CONTRACT '+(index+1)}:null;
}
export function recordArkonCh6Job(s,index){
  if(!story(s)||!read(s,'arkonStoryRwbProject')?.acquired)return false;
  const a=accounts(s);
  if(a.jobsDone!==index||index<0||index>2)return false;
  // Reserved for the structural rebuild, paid Porsche finance, and new HQ.
  set(s,'arkonStoryChapter06Accounts',{...a,
    jobsDone:a.jobsDone+1,escrow:n(a.escrow)+CH6_FEES[index]});
  return true;
}
export function leaseArkonCh6Warehouse(s){
  if(!story(s))return false;
  const a=accounts(s);
  if(a.warehousePaid)return true;
  if(a.jobsDone!==3||n(a.escrow)<CH6_WAREHOUSE_COST)return false;
  // Use paid-work receipts, not free developer unlocks or Career trophies.
  set(s,'arkonStoryChapter06Accounts',{...a,warehousePaid:true,
    escrow:n(a.escrow)-CH6_WAREHOUSE_COST});
  set(s,'arkonStoryWarehouseUnlocked',true);
  set(s,'garageTier',2);
  set(s,'workshopLocationId','shinonomeWarehouseStrip');
  const owned=read(s,'ownedCarIds')||[];
  const sites={...(read(s,'carGarageLocations')||{})};
  sites.rwbStellaPorsche='shinonomeWarehouseStrip';
  set(s,'carGarageLocations',normaliseCarGarageLocations(owned,sites,2));
  return true;
}
export function settleArkonCh6PorscheLoan(s){
  if(!story(s))return false;
  const a=accounts(s),p=read(s,'arkonStoryRwbProject');
  if(a.financeCleared)return true;
  if(!a.warehousePaid||!p?.acquired||p.gifted)return false;
  const due=n(p.outstandingFinance);
  if(due<=0||n(a.escrow)<due)return false;
  set(s,'arkonStoryChapter06Accounts',{...a,financeCleared:true,
    escrow:n(a.escrow)-due});
  set(s,'arkonStoryRwbProject',{...p,outstandingFinance:0,
    status:'finance-cleared-structural-restoration-in-progress'});
  return true;
}
export function recordArkonCh6Restoration(s,index){
  if(!story(s))return false;
  const a=accounts(s),p=read(s,'arkonStoryRwbProject');
  if(!p?.acquired||p.gifted||!a.financeCleared||!a.warehousePaid ||
    a.restorationDone!==index || index<0 || index>2)return false;
  const step=CH6_RESTORATION[index];
  if(n(a.escrow)<step.cost)return false;
  const done=index+1;
  set(s,'arkonStoryChapter06Accounts',{...a,restorationDone:done,
    restorationCost:n(a.restorationCost)+step.cost,
    escrow:n(a.escrow)-step.cost});
  set(s,'arkonStoryRwbProject',{...p,
    status:done===3?'certified-roadworthy':'restoration-stage-'+done,
    restorationStage:done,
    roadworthy:done===3,
    independentInspection:done===3,
    certification:done===3?'independent-roadworthiness-and-structural-signoff':null,
  });
  set(s,'carStates',{...(read(s,'carStates')||{}),
    rwbStellaPorsche:{...(read(s,'carStates')?.rwbStellaPorsche||{}),
      roadworthy:done===3,storedProject:true,immutable:true,tuningLocked:true}});
  return true;
}
export function beginArkonCh6NightDrive(s){
  if(!story(s)||!cars.rwbStellaPorsche)return false;
  const a=accounts(s),p=read(s,'arkonStoryRwbProject');
  if(a.restorationDone!==3||!a.financeCleared||!p?.roadworthy||
    n(p.outstandingFinance)!==0 ||read(s,'arkonStoryChapter06Cruise')?.active||
    read(s,'arkonStoryChapter06CruiseFinished'))return false;
  const loan={
    active:true,completed:false,previousSelected:read(s,'selectedCarId')||null,
    previousPreferred:read(s,'preferredCarId')||null,
    race:Object.fromEntries(CH6_RACE_KEYS.map(k=>[k,read(s,k)??null])),
  };
  set(s,'arkonStoryChapter06Cruise',loan);
  set(s,'selectedCarId','rwbStellaPorsche');
  set(s,'preferredCarId','rwbStellaPorsche');
  Object.entries({
    selectedRaceCategory:'ARKON_RWB_CRUISE',selectedRaceType:'Roll Race',
    selectedRaceDistanceM:804.672,selectedRaceDeal:'STORY',selectedRaceStake:0,
    selectedRaceSpecialChallenge:false,selectedRaceMeetOffer:null,
    selectedOpponentCarId:'ae86',selectedOpponentCharacterId:'storyDaigoKirishima',
    selectedOpponentEncounterRating:1,selectedOpponentEncounterAi:null,
    selectedOpponentBuildState:null,selectedOpponentBuildRating:1,
    selectedOpponentDifficulty:'EASY',selectedRacePlayerCharacterId:'arkonDen',
    raceReturnScene:'MeetScene',raceTimeOfDay:'night',raceDistrict:'YOKOHAMA',
    raceLocationLabel:'CHAPTER 06 // JUST THE TWO OF US',
  }).forEach(([k,v])=>set(s,k,v));
  return true;
}
export function finishArkonCh6NightDrive(s){
  const cruise=read(s,'arkonStoryChapter06Cruise');
  if(!story(s)||!cruise?.active||!cruise.completed)return false;
  const owned=read(s,'ownedCarIds')||[];
  const selected=[cruise.previousSelected,cruise.previousPreferred,'240z',
    ...owned].find(id=>owned.includes(id)&&id!=='rwbStellaPorsche'&&cars[id])||null;
  set(s,'selectedCarId',selected);
  set(s,'preferredCarId',selected);
  CH6_RACE_KEYS.forEach(k=>set(s,k,cruise.race?.[k]??null));
  set(s,'arkonStoryChapter06Cruise',null);
  set(s,'arkonStoryChapter06CruiseFinished',true);
  return true;
}
export function giftArkonCh6Porsche(s){
  if(!story(s))return false;
  const a=accounts(s),p=read(s,'arkonStoryRwbProject');
  if(p?.gifted)return true;
  if(a.restorationDone!==3||!a.financeCleared||!a.warehousePaid||
    !read(s,'arkonStoryChapter06CruiseFinished')||
    !p?.independentInspection||!p.roadworthy||n(p.outstandingFinance)!==0)return false;
  const owned=(read(s,'ownedCarIds')||[]).filter(id=>id!=='rwbStellaPorsche');
  set(s,'ownedCarIds',owned);
  const states={...(read(s,'carStates')||{})};delete states.rwbStellaPorsche;
  set(s,'carStates',states);
  const sites={...(read(s,'carGarageLocations')||{})};delete sites.rwbStellaPorsche;
  set(s,'carGarageLocations',normaliseCarGarageLocations(owned,sites,2));
  if(read(s,'selectedCarId')==='rwbStellaPorsche')set(s,'selectedCarId',
    owned.find(id=>cars[id])||null);
  if(read(s,'preferredCarId')==='rwbStellaPorsche')set(s,'preferredCarId',
    owned.find(id=>cars[id])||null);
  // A private personal transfer, not Ginza Gallery inventory or Career reward.
  set(s,'arkonStoryRwbProject',{...p,gifted:true,owner:'sayakaFujieda',
    status:'gifted-to-sayaka-with-roadworthiness-certificate',acquired:true,
    giftLocation:'yokohamaMinatoMirai',giftChapter:6});
  if(!a.distributed){
    set(s,'cash',Math.min(1e9,n(read(s,'cash'))+n(a.escrow)));
    set(s,'arkonStoryChapter06Accounts',{...a,escrow:0,distributed:true});
  }
  return true;
}
