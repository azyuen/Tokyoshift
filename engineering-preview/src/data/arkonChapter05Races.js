// R666 — Arkon Chapter 05: customer-owned prestige test cars and real races.
// A temporary loan is not a prize, a Ginza purchase, or a permanent car.
// Result and labour fees are settled exactly once on return from RaceScene.
import { cars } from './cars.js';

const read=(s,k)=>typeof s?.get==='function'?s.get(k):s?.[k];
const put=(s,k,v)=>s.set(k,v);
export const ARKON_CH5_LOAN_KEY='arkonStoryChapter05Loan';
export const ARKON_CH5_COMMISSIONS=Object.freeze([
  Object.freeze({carId:'minesR34',opponentCarId:'fc3s',opponentId:'reikaTachibana',
    district:'SHINAGAWA',venue:'shinagawaTennozu',fee:450000,
    client:'PRIVATE SKYLINE COLLECTOR',label:'SHINAGAWA // MINE\'S R34'}),
  Object.freeze({carId:'reAmemiyaRx7',opponentCarId:'3000gt',opponentId:'tetsuoMori',
    district:'DAIKOKU',venue:'daikokuPA',fee:600000,
    client:'ROTARY COLLECTION',label:'DAIKOKU // RE AMEMIYA FD'}),
  Object.freeze({carId:'topSecretSupra',opponentCarId:'evo5',opponentId:'renKurosawa',
    district:'SHINJUKU',venue:'shinjukuGodzilla',fee:780000,
    client:'PRIVATE SUPRA OWNER',label:'SHINJUKU // TOP SECRET SUPRA'}),
  Object.freeze({carId:null,opponentCarId:'ae86',opponentId:'storyDaigoKirishima',
    district:'SHIBUYA',venue:'shibuyaDogenzaka',fee:0,
    client:'DAIGO KIRISHIMA',label:'SHIBUYA // A FAMILIAR AE86'}),
]);
const RACE_KEYS=Object.freeze([
  'selectedRaceCategory','selectedRaceType','selectedRaceDistanceM',
  'selectedRaceDeal','selectedRaceStake','selectedRaceSpecialChallenge',
  'selectedRaceMeetOffer','selectedOpponentCarId','selectedOpponentCharacterId',
  'selectedOpponentEncounterRating','selectedOpponentEncounterAi',
  'selectedOpponentBuildState','selectedOpponentBuildRating',
  'selectedOpponentDifficulty','selectedOpponentPaintColor',
  'selectedRacePlayerCharacterId','raceReturnScene','raceTimeOfDay',
  'raceDistrict','raceLocationLabel',
]);

export function startArkonCh5TestRace(source,index) {
  const job=ARKON_CH5_COMMISSIONS[index];
  if(!job || read(source,'gameMode')!=='arkonStory' ||
    !read(source,'arkonStoryChapter04Done') ||
    read(source,'arkonStoryChapter05Done') ||
    read(source,ARKON_CH5_LOAN_KEY)?.active ||
    Number(read(source,'arkonStoryChapter05JobsDone')||0)!==Math.min(index,3) ||
    !ARKON_CH5_COMMISSIONS.every(x=>!x.carId||cars[x.carId]) ||
    !cars[job.opponentCarId] || typeof source?.set!=='function') return false;
  const owned=[...(read(source,'ownedCarIds')||[])];
  const selected=read(source,'selectedCarId');
  const raceCar=job.carId ||
    (owned.includes('240z')?'240z':owned.find(id=>id!=='rwbStellaPorsche'&&
      read(source,'carStates')?.[id]?.roadworthy!==false && cars[id]));
  if(!cars[raceCar] || raceCar==='rwbStellaPorsche')return false;
  const states={...(read(source,'carStates')||{})};
  const sites={...(read(source,'carGarageLocations')||{})};
  const original={active:true,index,carId:raceCar,
    hadCar:owned.includes(raceCar),previousSelected:selected||null,
    previousPreferred:read(source,'preferredCarId')||null,
    previousState:states[raceCar]??null,
    previousLocation:sites[raceCar]??null,
    race:Object.fromEntries(RACE_KEYS.map(key=>[key,read(source,key)??null]))};
  put(source,ARKON_CH5_LOAN_KEY,original);
  if(job.carId){
    put(source,'ownedCarIds',[...new Set([...owned,raceCar])]);
    put(source,'carStates',{...states,[raceCar]:{
      ...(states[raceCar]||{}),collector:true,tuningLocked:true,
      customerLoan:true,immutable:true}});
    put(source,'carGarageLocations',{...sites,[raceCar]:'shinonomeCanalYard'});
  }
  put(source,'selectedCarId',raceCar);
  put(source,'preferredCarId',raceCar);
  const race={
    selectedRaceCategory:'SINGLE',selectedRaceType:'Standing Start',
    selectedRaceDistanceM:402.336,selectedRaceDeal:'BET',selectedRaceStake:0,
    selectedRaceSpecialChallenge:false,selectedRaceMeetOffer:null,
    selectedOpponentCarId:job.opponentCarId,
    selectedOpponentCharacterId:job.opponentId,
    selectedOpponentEncounterRating:3,
    selectedOpponentEncounterAi:null,selectedOpponentBuildState:null,
    selectedOpponentBuildRating:3,selectedOpponentDifficulty:'STANDARD',
    selectedRacePlayerCharacterId:'arkonDen',
    raceReturnScene:'MeetScene',raceTimeOfDay:'night',
    raceDistrict:job.district,raceLocationLabel:job.label,
  };
  Object.entries(race).forEach(([k,v])=>put(source,k,v));
  put(source,'arkonStoryChapter05RaceResult',null);
  return true;
}

export function finishArkonCh5TestRace(source) {
  const loan=read(source,ARKON_CH5_LOAN_KEY);
  if(read(source,'gameMode')!=='arkonStory' ||
     typeof source?.set!=='function'||!loan?.active ||
     !['won','lost','forfeit'].includes(read(source,'arkonStoryChapter05RaceResult')))
     return false;
  const job=ARKON_CH5_COMMISSIONS[loan.index];
  if(!job || job.carId!==null&&loan.carId!==job.carId)return false;
  if(job.carId){
    const owned=[...(read(source,'ownedCarIds')||[])];
    put(source,'ownedCarIds',loan.hadCar?owned:owned.filter(id=>id!==loan.carId));
    const states={...(read(source,'carStates')||{})};
    const sites={...(read(source,'carGarageLocations')||{})};
    if(loan.previousState==null)delete states[loan.carId];
    else states[loan.carId]=loan.previousState;
    if(loan.previousLocation==null)delete sites[loan.carId];
    else sites[loan.carId]=loan.previousLocation;
    put(source,'carStates',states);
    put(source,'carGarageLocations',sites);
  }
  const owned=read(source,'ownedCarIds')||[];
  const safe=id=>id&&owned.includes(id)&&id!=='rwbStellaPorsche'&&cars[id];
  const restored=safe(loan.previousSelected)?loan.previousSelected:
    owned.find(safe)||null;
  put(source,'selectedCarId',restored);
  put(source,'preferredCarId',safe(loan.previousPreferred)?loan.previousPreferred:restored);
  RACE_KEYS.forEach(k=>put(source,k,loan.race?.[k]??null));
  const results={...(read(source,'arkonStoryChapter05Results')||{})};
  results[loan.index]=read(source,'arkonStoryChapter05RaceResult');
  put(source,'arkonStoryChapter05Results',results);
  if(loan.index<3 && Number(read(source,'arkonStoryChapter05JobsDone')||0)===loan.index){
    // Race outcome never changes the agreed restoration labour fee.
    put(source,'arkonStoryChapter05JobsDone',loan.index+1);
    put(source,'cash',Math.min(1e9,Math.max(0,Number(read(source,'cash')||0))+job.fee));
  }
  put(source,ARKON_CH5_LOAN_KEY,null);
  return true;
}
