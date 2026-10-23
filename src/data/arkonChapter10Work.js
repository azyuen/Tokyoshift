// R674 — Chapter 10 milestones are Arkon Story-only. No Career save mutations.
import {cars} from './cars.js?v=20261023-r669';

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
     !read(s,'arkonStoryGinzaPartnership')||!read(s,'arkonStoryRwbProject')?.gifted)return false;
  write(s,'meetLocation','yokohamaMinatoMirai');
  write(s,'district','YOKOHAMA');
  write(s,'arkonStoryTimeOfDay','night');
  return true;
}
