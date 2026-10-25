// R674 — Chapter 10 milestones are Arkon Story-only. No Career save mutations.
import {cars} from './cars.js';
import {normaliseCarGarageLocations} from './workshopProgression.js';

const read=(s,k)=>s?.get?.(k);
const write=(s,k,v)=>s.set(k,v);
const eligible=s=>read(s,'gameMode')==='arkonStory' &&
  read(s,'arkonStoryChapter09Done') && read(s,'arkonStoryChapter09Refused') &&
  !read(s,'arkonStoryChapter10Done') && typeof s?.set==='function';

export const ARKON_CH10_PROJECTS=Object.freeze([
  Object.freeze({carId:'ae86',title:'THE FORGOTTEN CLASSIC',
    client:'LONG-TIME OWNER // AE86',fee:140000,
    tasks:['Inspect chassis and service history','Renew worn driveline and suspension','Check brakes and safely road-test']}),
  Object.freeze({carId:'gc8',title:'AN OLD CONNECTION',
    client:'REGIONAL MECHANIC COLLABORATION // GC8',fee:180000,
    tasks:['Agree a shared restoration plan','Recondition engine and driveline together','Verify dyno readings and roadworthiness']}),
  Object.freeze({carId:'r32',title:'SOMETHING SPECIAL',
    client:'COLLECTOR CONSERVATION // R32',fee:210000,
    tasks:['Document provenance and original components','Restore without chasing maximum power','Complete independent condition checks']}),
]);
export function recordArkonCh10Project(s,index){
  if(!eligible(s)||!Number.isInteger(index)||index<0||index>=3 ||
    !cars[ARKON_CH10_PROJECTS[index].carId] ||
    Number(read(s,'arkonStoryChapter10ProjectsDone')||0)!==index)return false;
  const fee=ARKON_CH10_PROJECTS[index].fee;
  write(s,'arkonStoryChapter10ProjectsDone',index+1);
  write(s,'arkonStoryChapter10FeesEarned',
    Math.max(0,Number(read(s,'arkonStoryChapter10FeesEarned')||0))+fee);
  write(s,'cash',Math.min(1e9,Math.max(0,Number(read(s,'cash')||0))+fee));
  return true;
}
const FIELDS=Object.freeze([
  'selectedRaceCategory','selectedRaceType','selectedRaceDistanceM',
  'selectedRaceDeal','selectedRaceStake','selectedRaceSpecialChallenge',
  'selectedRaceMeetOffer','selectedOpponentCarId','selectedOpponentCharacterId',
  'selectedOpponentEncounterRating','selectedOpponentEncounterAi',
  'selectedOpponentBuildState','selectedOpponentBuildRating','selectedOpponentDifficulty',
  'selectedOpponentPaintColor','selectedRacePlayerCharacterId','raceReturnScene',
  'raceTimeOfDay','raceDistrict','raceLocationLabel',
]);
export function startArkonCh10Race(s){
  if(!eligible(s)||Number(read(s,'arkonStoryChapter10ProjectsDone')||0)<2 ||
    read(s,'arkonStoryChapter10RaceDone')||read(s,'arkonStoryChapter10Race')?.active ||
    !read(s,'ownedCarIds')?.includes('arkonLibertyWalk240z')||
    !cars.arkonLibertyWalk240z||!cars.gc8)return false;
  const prior=Object.fromEntries(FIELDS.map(k=>[k,read(s,k)??null]));
  write(s,'arkonStoryChapter10Race',{active:true,prior,
    previousSelected:read(s,'selectedCarId'),
    previousPreferred:read(s,'preferredCarId')});
  write(s,'arkonStoryChapter10RaceResult',null);
  write(s,'selectedCarId','arkonLibertyWalk240z');
  write(s,'preferredCarId','arkonLibertyWalk240z');
  for(const [k,v] of Object.entries({
    selectedRaceCategory:'SINGLE',selectedRaceType:'Standing Start',
    selectedRaceDistanceM:402.336,selectedRaceDeal:'STORY',selectedRaceStake:0,
    selectedRaceSpecialChallenge:false,selectedRaceMeetOffer:null,
    selectedOpponentCarId:'gc8',selectedOpponentCharacterId:'tetsuoMori',
    selectedOpponentEncounterRating:3,selectedOpponentEncounterAi:null,
    selectedOpponentBuildState:null,selectedOpponentBuildRating:3,
    selectedOpponentDifficulty:'STANDARD',selectedOpponentPaintColor:null,
    selectedRacePlayerCharacterId:'arkonDen',raceReturnScene:'MeetScene',
    raceTimeOfDay:'night',raceDistrict:'DAIKOKU',
    raceLocationLabel:'CHAPTER 10 // FRIENDLY VALIDATION',
  }))write(s,k,v);
  return true;
}
export function finishArkonCh10Race(s){
  const ctx=read(s,'arkonStoryChapter10Race');
  const outcome=read(s,'arkonStoryChapter10RaceResult');
  if(!eligible(s)||!ctx?.active||!['won','lost','forfeit'].includes(outcome))return false;
  FIELDS.forEach(k=>write(s,k,ctx.prior?.[k]??null));
  const owned=read(s,'ownedCarIds')||[];
  const selected=[ctx.previousSelected,ctx.previousPreferred,'arkonLibertyWalk240z']
    .find(id=>owned.includes(id)&&cars[id])||'arkonLibertyWalk240z';
  write(s,'selectedCarId',selected);
  write(s,'preferredCarId',owned.includes(ctx.previousPreferred)&&cars[ctx.previousPreferred]
    ?ctx.previousPreferred:selected);
  write(s,'arkonStoryChapter10Race',null);
  write(s,'arkonStoryChapter10RaceDone',true);
  write(s,'arkonStoryChapter10RaceOutcome',outcome);
  return true;
}
export function openArkonCh10Ginza(s){
  if(!eligible(s)||Number(read(s,'arkonStoryChapter10ProjectsDone')||0)!==3 ||
     !read(s,'arkonStoryChapter10RaceDone'))return false;
  if(read(s,'arkonStoryGinzaPartnership'))return true;
  if(read(s,'arkonStoryChapter10ZSale')?.status!=='sold')return false;
  // A modest, sustainably funded gallery partnership. The RWB remains
  // Sayaka's personal car; neither founder owns every consignment.
  write(s,'arkonStoryGinzaPartnership',{
    business:'Ginza Motor Gallery',owners:['arkonDen','sayakaFujieda'],
    shares:{arkonDen:50,sayakaFujieda:50},
    curator:'sayakaFujieda',status:'open',funding:'earned-restoration-and-consignment',
  });
  write(s,'arkonStoryGinzaUnlocked',true);
  return true;
}
export function recordArkonCh10Investment(s){
  if(!eligible(s)||!read(s,'arkonStoryGinzaPartnership'))return false;
  if(read(s,'arkonStoryCareerSeed'))return true;
  // This is a private offer of practical support, NOT a payout to a Career save.
  write(s,'arkonStoryCareerSeed',{
    supportedWorkshop:'daichiSakamoto',
    newDriver:'careerPlayer',
    relationship:'sayaka-family-friend',
    starterCar:'arkon-restored-affordable-choice',
    fundedBy:['arkonDen','sayakaFujieda'],
    noRaceManipulation:true,
  });
  return true;
}
export function prepareArkonCh10Yokohama(s){
  if(!eligible(s)||!read(s,'arkonStoryCareerSeed')||
     !read(s,'arkonStoryGinzaPartnership')||!read(s,'arkonStoryRwbProject')?.gifted||
     read(s,'arkonStoryChapter10ZSale')?.status!=='sold')return false;
  write(s,'meetLocation','yokohamaMinatoMirai');
  write(s,'district','YOKOHAMA');
  write(s,'arkonStoryTimeOfDay','night');
  return true;
}

export function settleArkonCh10Dispute(s){
  if(!eligible(s))return false;
  if(read(s,'arkonStoryChapter10Settlement'))return true;
  // Costs are once-only, capped at available cash. The original unresolved
  // obligations are settled with professional advice, not magically erased.
  const cash=Math.max(0,Number(read(s,'cash')||0));
  const paid=Math.min(cash,300000);
  write(s,'cash',cash-paid);
  write(s,'arkonStoryChapter10Settlement',{
    resolved:false,paid,remainingLiability:4800000,
    method:'independent advice and negotiated settlements',
    reputation:'rebuilding',workshop:'retained-pending-final-payment',
  });
  write(s,'arkonStoryChapter09ExitStatus','negotiated; secured-liability-pending; workshop-retained');
  return true;
}


// Aruken voluntarily sells his own Liberty Walk 240Z after its final
// friendly Chapter 10 race. This is a story-owned one-time transfer, never
// a gift/transfer of Sayaka's RWB Porsche or an ordinary Career sale.
export function sellArkonCh10LibertyWalk(s){
  if(!eligible(s))return false;
  if(read(s,'arkonStoryChapter10ZSale')?.status==='sold')return true;
  const settlement=read(s,'arkonStoryChapter10Settlement');
  if(!read(s,'arkonStoryChapter10RaceDone')||!settlement||
    !(read(s,'ownedCarIds')||[]).includes('arkonLibertyWalk240z'))return false;
  const liability=Math.max(0,Number(settlement.remainingLiability??4800000));
  const salePrice=5200000;
  if(liability>salePrice)return false;
  const owned=(read(s,'ownedCarIds')||[]).filter(id=>id!=='arkonLibertyWalk240z');
  const formerStates=read(s,'carStates')||{};
  const lastState=structuredClone(formerStates.arkonLibertyWalk240z||{});
  const states={...formerStates};
  delete states.arkonLibertyWalk240z;
  const sites={...(read(s,'carGarageLocations')||{})};
  delete sites.arkonLibertyWalk240z;
  let runaboutCost=0;
  if(!owned.some(id=>cars[id])){
    if(!cars.ef)return false;
    // Keep at least one ordinary usable car for the saved garage; its
    // purchase is deducted from sale proceeds, with no free hero replacement.
    owned.push('ef');runaboutCost=300000;
    states.ef={stock:true,tuneLevel:0,nosInstalled:false,tuning:{},
      acquiredVia:'arkon-story-used-runabout'};
    sites.ef='shinonomeWarehouseStrip';
  }
  const remainingCash=Math.max(0,Number(read(s,'cash')||0))+
    salePrice-liability-runaboutCost;
  const now=Date.now();
  const history=[...(read(s,'carHistory')||[])];
  const original=[...history].reverse().find(e=>
    e?.carId==='arkonLibertyWalk240z'&&e.status==='OWNED');
  if(original){
    const idx=history.indexOf(original);
    history[idx]={...original,status:'SOLD',departedAt:now,
      departureReason:'chapter10-contract-settlement',salePrice,lastState};
  }else{
    history.push({id:'arkonLibertyWalk240z:arkon-r679-sale',
      carId:'arkonLibertyWalk240z',acquiredAt:0,acquiredVia:'story-built',
      status:'SOLD',departedAt:now,departureReason:'chapter10-contract-settlement',
      salePrice,lastState});
  }
  if(runaboutCost)history.push({id:'ef:arkon-r679-runabout',carId:'ef',
    acquiredAt:now,acquiredVia:'arkon-story-used-runabout',status:'OWNED',salePrice:0});
  write(s,'ownedCarIds',owned);
  write(s,'carStates',states);
  write(s,'carGarageLocations',normaliseCarGarageLocations(owned,sites,
    Math.max(2,Number(read(s,'garageTier')||2))));
  const choice=owned.find(id=>cars[id])||null;
  write(s,'selectedCarId',choice);write(s,'preferredCarId',choice);
  write(s,'carHistory',history);
  write(s,'cash',Math.min(1e9,remainingCash));
  write(s,'arkonStoryChapter10ZSale',{
    status:'sold',carId:'arkonLibertyWalk240z',salePrice,
    settledLiability:liability,runaboutCost,completedAt:now,lastState,
    buyer:'independent collector',reason:'honour-negotiated-contract-obligations',
  });
  write(s,'arkonStoryChapter10Settlement',{
    ...settlement,resolved:true,workshop:'retained',remainingLiability:0,
    finalLiabilityPaid:liability,
    funding:'voluntary-sale-of-arkon-liberty-walk-240z',
  });
  write(s,'arkonStoryChapter09ExitStatus',
    'resolved-with-advisers; Z-sold; workshop-retained');
  return true;
}


// Temporarily drive Sayaka's gifted Porsche as a scenic, non-race chapter
// vehicle. Never grant it to Aruken's garage or the Career player.
export function startArkonCh10PorscheCruise(s){
  const gifted=read(s,'arkonStoryRwbProject');
  if(!eligible(s)||!read(s,'arkonStoryCareerSeed')||
      !read(s,'arkonStoryGinzaPartnership')||
      read(s,'arkonStoryChapter10ZSale')?.status!=='sold' ||
      !gifted?.gifted||!gifted.roadworthy||!cars.rwbStellaPorsche||
      read(s,'arkonStoryChapter10Cruise')?.active||
      read(s,'arkonStoryChapter10CruiseFinished'))return false;
  const prior=Object.fromEntries(FIELDS.map(k=>[k,read(s,k)??null]));
  write(s,'arkonStoryChapter10Cruise',{
    active:true,completed:false,prior,
    previousSelected:read(s,'selectedCarId'),
    previousPreferred:read(s,'preferredCarId'),
  });
  write(s,'selectedCarId','rwbStellaPorsche');
  write(s,'preferredCarId','rwbStellaPorsche');
  for(const [k,v] of Object.entries({
    selectedRaceCategory:'ARKON_CH10_RWB_CRUISE',
    selectedRaceType:'Roll Race',selectedRaceDistanceM:804.672,
    selectedRaceDeal:'STORY',selectedRaceStake:0,
    selectedRaceSpecialChallenge:false,selectedRaceMeetOffer:null,
    selectedOpponentCarId:'ae86',
    selectedOpponentCharacterId:'storyDaigoKirishima',
    selectedOpponentEncounterRating:1,selectedOpponentEncounterAi:null,
    selectedOpponentBuildState:null,selectedOpponentBuildRating:1,
    selectedOpponentDifficulty:'STANDARD',selectedOpponentPaintColor:null,
    selectedRacePlayerCharacterId:'arkonDen',raceReturnScene:'MeetScene',
    raceTimeOfDay:'night',raceDistrict:'YOKOHAMA',
    raceLocationLabel:'CHAPTER 10 // SAYAKA DRIVING // NO RACE',
  }))write(s,k,v);
  return true;
}
export function finishArkonCh10PorscheCruise(s){
  const cruise=read(s,'arkonStoryChapter10Cruise');
  if(!eligible(s)||!cruise?.active||!cruise.completed)return false;
  const owned=read(s,'ownedCarIds')||[];
  const selected=[cruise.previousSelected,cruise.previousPreferred,...owned]
    .find(id=>owned.includes(id)&&cars[id])||null;
  FIELDS.forEach(k=>write(s,k,cruise.prior?.[k]??null));
  write(s,'selectedCarId',selected);
  write(s,'preferredCarId',selected);
  write(s,'arkonStoryChapter10Cruise',null);
  write(s,'arkonStoryChapter10CruiseFinished',true);
  return true;
}
