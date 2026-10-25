// R672 — Arkon Chapter 08 private invitational races, Story Mode only.
// Wagers are real and result-dependent but capped to cash on hand. No pink
// slips, global wins, coupons, crew recruitment or scripted victories.
import {cars} from './cars.js';

export const ARKON_CH8_RACES=Object.freeze([
  Object.freeze({district:'SHINAGAWA',venue:'shinagawaTennozu',car:'fc3s',
    rival:'reikaTachibana',stake:120000,label:'SHINAGAWA // THE INVITATION'}),
  Object.freeze({district:'DAIKOKU',venue:'daikokuPA',car:'3000gt',
    rival:'tetsuoMori',stake:300000,label:'DAIKOKU // THE WAGER'}),
  Object.freeze({district:'SHIBUYA',venue:'shibuyaScramble',car:'evo5',
    rival:'renKurosawa',stake:600000,label:'SHIBUYA // PRIVATE INVITATIONAL'}),
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
  read(s,'arkonStoryChapter07Done')&&!read(s,'arkonStoryChapter08Done');
const snapshot=s=>Object.fromEntries(FIELDS.map(k=>[k,read(s,k)??null]));
const hasHero=s=>read(s,'ownedCarIds')?.includes('arkonLibertyWalk240z');
export function startArkonCh8Race(s,index){
  const race=ARKON_CH8_RACES[index],progress=Number(read(s,'arkonStoryChapter08RacesDone')||0);
  if(!allowed(s)||!race||!hasHero(s)||!cars.arkonLibertyWalk240z||
    !cars[race.car]||!Number.isInteger(index)||progress!==index||
    read(s,'arkonStoryChapter08Race')?.active)return false;
  // 15% cash exposure maximum; never force poverty or an unpayable entry.
  const cash=Math.max(0,Number(read(s,'cash')||0));
  const stake=Math.min(race.stake,Math.floor(cash*.15));
  const context={active:true,index,stake,previousSelected:read(s,'selectedCarId'),
    previousPreferred:read(s,'preferredCarId'),prior:snapshot(s)};
  put(s,'arkonStoryChapter08Race',context);
  put(s,'arkonStoryChapter08RaceResult',null);
  put(s,'cash',cash-stake);
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
export function finishArkonCh8Race(s){
  const ctx=read(s,'arkonStoryChapter08Race');
  const result=read(s,'arkonStoryChapter08RaceResult');
  if(!allowed(s)||!ctx?.active||
    !['won','lost','forfeit'].includes(result)||
    Number(read(s,'arkonStoryChapter08RacesDone')||0)!==ctx.index)return false;
  // Win collects both sides of an escrowed even-money wager.
  // Cancel refunds the stake; a genuine loss forfeits it.
  const refund=result==='won'?ctx.stake*2:result==='forfeit'?ctx.stake:0;
  put(s,'cash',Math.min(1e9,Math.max(0,Number(read(s,'cash')||0))+refund));
  for(const k of FIELDS)put(s,k,ctx.prior?.[k]??null);
  const owned=read(s,'ownedCarIds')||[];
  const selected=owned.includes(ctx.previousSelected)&&cars[ctx.previousSelected]
    ?ctx.previousSelected:'arkonLibertyWalk240z';
  put(s,'selectedCarId',selected);
  put(s,'preferredCarId',owned.includes(ctx.previousPreferred)&&cars[ctx.previousPreferred]
    ?ctx.previousPreferred:selected);
  put(s,'arkonStoryChapter08RacesDone',ctx.index+1);
  put(s,'arkonStoryChapter08LastResult',result);
  put(s,'arkonStoryChapter08Race',null);
  return true;
}
export function recordArkonCh8Contract(s){
  if(!allowed(s)||Number(read(s,'arkonStoryChapter08RacesDone')||0)!==3)return false;
  if(read(s,'arkonStoryChapter08ContractSigned'))return true;
  // Real narrative exposure, no premature automatic debt or workshop seizure.
  put(s,'arkonStoryChapter08ContractSigned',true);
  put(s,'arkonStoryChapter08ContractTerms',{
    project:'Private racing engineering programme',
    deadline:'Contractual delivery milestone pending Chapter 09',
    assurance:'Engineering sign-off and performance guarantees',
    security:'Warehouse HQ business assets named as conditional security',
    status:'signed; no default or loss assessed',
  });
  return true;
}
