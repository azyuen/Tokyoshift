// R673 — Chapter 09 real-physics private demonstrations without unrelated Career rewards.
import {cars} from './cars.js';

export const ARKON_CH9_RACES=Object.freeze([
  Object.freeze({district:'SHIBUYA',venue:'shibuyaScramble',car:'evo5',
    rival:'renKurosawa',stake:0,label:'SHIBUYA // THE FIRST DEMONSTRATION'}),
  Object.freeze({district:'DAIKOKU',venue:'daikokuPA',car:'3000gt',
    rival:'tetsuoMori',stake:0,label:'DAIKOKU // UNDER PRESSURE'}),
]);
const FIELDS=Object.freeze([
  'selectedRaceCategory','selectedRaceType','selectedRaceDistanceM',
  'selectedRaceDeal','selectedRaceStake','selectedRaceSpecialChallenge',
  'selectedRaceMeetOffer','selectedOpponentCarId','selectedOpponentCharacterId',
  'selectedOpponentEncounterRating','selectedOpponentEncounterAi',
  'selectedOpponentBuildState','selectedOpponentBuildRating','selectedOpponentDifficulty',
  'selectedOpponentPaintColor','selectedRacePlayerCharacterId','raceReturnScene',
  'raceTimeOfDay','raceDistrict','raceLocationLabel',
]);
const read=(s,k)=>s?.get?.(k);
const put=(s,k,v)=>s.set(k,v);
const allowed=s=>read(s,'gameMode')==='arkonStory'&&
  read(s,'arkonStoryChapter08Done')&&read(s,'arkonStoryChapter08ContractSigned')&&!read(s,'arkonStoryChapter09Done');
const snapshot=s=>Object.fromEntries(FIELDS.map(k=>[k,read(s,k)??null]));
const hasHero=s=>read(s,'ownedCarIds')?.includes('arkonLibertyWalk240z');
export function startArkonCh9Race(s,index){
  const race=ARKON_CH9_RACES[index],progress=Number(read(s,'arkonStoryChapter09RacesDone')||0);
  if(!allowed(s)||!race||!hasHero(s)||!cars.arkonLibertyWalk240z||
    !cars[race.car]||!Number.isInteger(index)||progress!==index||
    read(s,'arkonStoryChapter09Race')?.active)return false;
  // No additional stakes: the business risk is narrative, not cash settlement.
  const stake=0;
  const context={active:true,index,stake,previousSelected:read(s,'selectedCarId'),
    previousPreferred:read(s,'preferredCarId'),prior:snapshot(s)};
  put(s,'arkonStoryChapter09Race',context);
  put(s,'arkonStoryChapter09RaceResult',null);
  put(s,'selectedCarId','arkonLibertyWalk240z');
  put(s,'preferredCarId','arkonLibertyWalk240z');
  for(const [k,v] of Object.entries({
    selectedRaceCategory:'SINGLE',selectedRaceType:'Standing Start',
    selectedRaceDistanceM:402.336,selectedRaceDeal:'STORY',selectedRaceStake:0,
    selectedRaceSpecialChallenge:false,selectedRaceMeetOffer:null,
    selectedOpponentCarId:race.car,selectedOpponentCharacterId:race.rival,
    selectedOpponentEncounterRating:index===0?3:4,
    selectedOpponentEncounterAi:null,selectedOpponentBuildState:null,
    selectedOpponentBuildRating:index===0?3:4,
    selectedOpponentDifficulty:index===0?'STANDARD':'HARD',
    selectedOpponentPaintColor:null,selectedRacePlayerCharacterId:'arkonDen',
    raceReturnScene:'MeetScene',raceTimeOfDay:'night',
    raceDistrict:race.district,raceLocationLabel:race.label,
  }))put(s,k,v);
  return true;
}
export function finishArkonCh9Race(s){
  const ctx=read(s,'arkonStoryChapter09Race');
  const result=read(s,'arkonStoryChapter09RaceResult');
  if(!allowed(s)||!ctx?.active||
    !['won','lost','forfeit'].includes(result)||
    Number(read(s,'arkonStoryChapter09RacesDone')||0)!==ctx.index)return false;
  // No payout; the genuine result is recorded for the story.
  for(const k of FIELDS)put(s,k,ctx.prior?.[k]??null);
  const owned=read(s,'ownedCarIds')||[];
  const selected=owned.includes(ctx.previousSelected)&&cars[ctx.previousSelected]
    ?ctx.previousSelected:'arkonLibertyWalk240z';
  put(s,'selectedCarId',selected);
  put(s,'preferredCarId',owned.includes(ctx.previousPreferred)&&cars[ctx.previousPreferred]
    ?ctx.previousPreferred:selected);
  put(s,'arkonStoryChapter09RacesDone',ctx.index+1);
  put(s,'arkonStoryChapter09LastResult',result);
  put(s,'arkonStoryChapter09Race',null);
  return true;
}
export function recordArkonCh9Refusal(s){
  if(!allowed(s)||Number(read(s,'arkonStoryChapter09RacesDone')||0)!==2)return false;
  if(read(s,'arkonStoryChapter09Refused'))return true;
  // The questionable valuation and incomplete history cannot be certified.
  put(s,'arkonStoryChapter09Refused',true);
  put(s,'arkonStoryChapter09ExitStatus','declined-signoff; advisers-consulted; dispute-unresolved');
  const previous=read(s,'arkonStoryChapter08ContractTerms')||{};
  put(s,'arkonStoryChapter08ContractTerms',{
    ...previous,status:'performance/sign-off disputed; no property transfer or automatic penalty',
  });
  return true;
}
