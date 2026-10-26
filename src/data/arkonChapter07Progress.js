// R669 — Arkon Chapter 07 progression. All work, visits and racing are
// Arkon Story-only. No paid shortcuts, physics boosts or Career unlocks.
import {cars} from './cars.js?v=20261026-r687';
import {ENGINE_PART_ORDER,getEngineTuning} from './tuning.js?v=20261026-r687';
import {DRIVETRAIN_PART_ORDER,CHASSIS_PART_ORDER,EXHAUST_NOS_PART_ORDER,
  getDrivetrainTuning,getChassisTuning,getExhaustNosTuning} from './secondaryTuning.js?v=20261026-r687';
import {getArkonCustomerJob} from './arkonChapter03Jobs.js?v=20261023-r660';
import {normaliseCarGarageLocations} from './workshopProgression.js?v=20261024-r675';
import {TUNER_SHOPS,getInstalledSpecialistTuning} from './tunerShops.js?v=20261025-r684';

export const CH7_HERO_ID='arkonLibertyWalk240z';
export const CH7_JOB_FEES=Object.freeze([1100000,1300000,1500000]);
export const CH7_RACES=Object.freeze([
  Object.freeze({district:'YOKOHAMA',venue:'yokohamaMinatoMirai',opponentCarId:'r32',
    opponentId:'masatoIshikawa',label:'YOKOHAMA // MASATO\'S R32'}),
  Object.freeze({district:'DAIKOKU',venue:'daikokuPA',opponentCarId:'evo6',
    opponentId:'tetsuoMori',label:'DAIKOKU // THE FULL BUILD'}),
]);
const RACE_KEYS=Object.freeze([
  'selectedRaceCategory','selectedRaceType','selectedRaceDistanceM',
  'selectedRaceDeal','selectedRaceStake','selectedRaceSpecialChallenge',
  'selectedRaceMeetOffer','selectedOpponentCarId','selectedOpponentCharacterId',
  'selectedOpponentEncounterRating','selectedOpponentEncounterAi',
  'selectedOpponentBuildState','selectedOpponentBuildRating','selectedOpponentDifficulty',
  'selectedOpponentPaintColor','selectedRacePlayerCharacterId','raceReturnScene',
  'raceTimeOfDay','raceDistrict','raceLocationLabel',
]);
const get=(s,k)=>typeof s?.get==='function'?s.get(k):s?.[k];
const put=(s,k,v)=>s.set(k,v);
const story=s=>get(s,'gameMode')==='arkonStory'&&get(s,'arkonStoryChapter06Done')&&
  !get(s,'arkonStoryChapter07Done')&&typeof s?.set==='function';
const state=s=>get(s,'arkonStoryChapter07Work')||{stage:0,shops:[],jobsDone:0,racesDone:0,converted:false};
const groups=s=>{
  const car=get(s,'carStates')?.['240z']||{};
  return [
    [ENGINE_PART_ORDER,getEngineTuning(car)],
    [DRIVETRAIN_PART_ORDER,getDrivetrainTuning(car)],
    [CHASSIS_PART_ORDER,getChassisTuning(car)],
    [EXHAUST_NOS_PART_ORDER,getExhaustNosTuning(car)],
  ];
};
export function ch7Progress(s){
  const a=state(s);
  const all=groups(s).flatMap(([parts,levels])=>parts.map(id=>Number(levels[id])||0));
  const level2=all.filter(x=>x>=2).length,level3=all.filter(x=>x>=3).length;
  const requirement=a.stage<=1?2:3;
  const shopGoal=a.stage<=1?2:7;
  const firstIntroductions=['SHIBUYA','YOKOHAMA'].filter(id=>a.shops?.includes(id));
  // Real purchases, not story rewards: one installed signature package from
  // every specialist, ON ARUKEN'S OWN 240Z, before the Liberty Walk conversion.
  const installed=new Set(getInstalledSpecialistTuning(get(s,'carStates')?.['240z']||{}));
  const treatments=Object.entries(TUNER_SHOPS)
    .filter(([,shop])=>(shop.tuningOptions||[]).some(opt=>installed.has(opt.id)))
    .map(([region])=>region);
  const treatmentGoal=a.stage<=1?0:7;
  return {...a,partsTotal:all.length,level2,level3,firstIntroductions,
    treatments,treatmentGoal,shopGoal,partsGoal:requirement,
    ready:Boolean(a.stage===1||a.stage===2) &&
      (a.stage===1?level2:level3)===all.length &&
      (a.stage===1?firstIntroductions.length===2:(a.shops?.length||0)>=shopGoal) &&
      treatments.length>=treatmentGoal};
}
export function startArkonCh7Work(s,stage){
  if(!story(s)||![1,2].includes(stage)||!get(s,'ownedCarIds')?.includes('240z')||
    get(s,'garageTier')<2)return false;
  const a=state(s);
  if(a.stage===stage)return true;
  if(stage===1 && a.stage===0 && a.jobsDone>=1 ||
     stage===2 && a.stage===1 && a.racesDone>=1 && a.jobsDone>=2){
    put(s,'arkonStoryChapter07Work',{...a,stage});return true;
  }
  return false;
}
export function finishArkonCh7Work(s,stage){
  if(!story(s))return false;
  const p=ch7Progress(s);
  if(p.stage!==stage||!p.ready)return false;
  put(s,'arkonStoryChapter07Work',{...state(s),stage:stage+1});
  return true;
}
export function recordArkonCh7TunerVisit(s,region){
  if(!story(s)||![1,2].includes(state(s).stage)||!get(s,'ownedCarIds')?.includes('240z'))return false;
  const name=String(region||'').toUpperCase();
  if(!['ODAIBA','SHIBUYA','SHINJUKU','YOKOHAMA','DAIKOKU','SHINAGAWA','TATSUMI'].includes(name))return false;
  const a=state(s);
  // Only the two introductions count towards the first upgrade milestone.
  if(a.stage===1&&!['SHIBUYA','YOKOHAMA'].includes(name))return false;
  if(a.shops.includes(name))return false;
  put(s,'arkonStoryChapter07Work',{...a,shops:[...a.shops,name]});
  return true;
}
export function getArkonCh7Job(s,index){
  if(!Number.isInteger(index)||index<0||index>2)return null;
  const job=getArkonCustomerJob(s,index);
  return job?{...job,pay:CH7_JOB_FEES[index],
    client:'SIGNED PERFORMANCE CONTRACT // '+(index+1)}:null;
}
export function recordArkonCh7Job(s,index){
  const a=state(s);
  if(!story(s)||a.jobsDone!==index||!getArkonCh7Job(s,index))return false;
  put(s,'arkonStoryChapter07Work',{...a,jobsDone:index+1});
  put(s,'cash',Math.min(1e9,Math.max(0,Number(get(s,'cash')||0))+CH7_JOB_FEES[index]));
  return true;
}
export function startArkonCh7Race(s,index){
  const a=state(s),race=CH7_RACES[index];
  if(!story(s)||!race||a.racesDone!==index||get(s,'arkonStoryChapter07Race')?.active||
    a.stage!==(index===0?2:3)||!get(s,'ownedCarIds')?.includes('240z')||
    !cars['240z']||!cars[race.opponentCarId])return false;
  put(s,'arkonStoryChapter07Race',{active:true,index,
    previousSelected:get(s,'selectedCarId')||null,
    previousPreferred:get(s,'preferredCarId')||null,
    race:Object.fromEntries(RACE_KEYS.map(k=>[k,get(s,k)??null]))});
  put(s,'selectedCarId','240z');put(s,'preferredCarId','240z');
  Object.entries({
    selectedRaceCategory:'SINGLE',selectedRaceType:'Standing Start',
    selectedRaceDistanceM:402.336,selectedRaceDeal:'BET',selectedRaceStake:0,
    selectedRaceSpecialChallenge:false,selectedRaceMeetOffer:null,
    selectedOpponentCarId:race.opponentCarId,
    selectedOpponentCharacterId:race.opponentId,
    selectedOpponentEncounterRating:3,selectedOpponentEncounterAi:null,
    selectedOpponentBuildState:null,selectedOpponentBuildRating:3,
    selectedOpponentDifficulty:'STANDARD',
    selectedRacePlayerCharacterId:'arkonDen',
    raceReturnScene:'MeetScene',raceTimeOfDay:'night',
    raceDistrict:race.district,raceLocationLabel:race.label,
  }).forEach(([k,v])=>put(s,k,v));
  put(s,'arkonStoryChapter07RaceResult',null);
  return true;
}
export function finishArkonCh7Race(s){
  const a=state(s),race=get(s,'arkonStoryChapter07Race');
  if(!story(s)||!race?.active||a.racesDone!==race.index||
    !['won','lost','forfeit'].includes(get(s,'arkonStoryChapter07RaceResult')))return false;
  const owned=get(s,'ownedCarIds')||[];
  const pick=id=>id&&owned.includes(id)&&cars[id];
  const selected=pick(race.previousSelected)?race.previousSelected:'240z';
  put(s,'selectedCarId',selected);
  put(s,'preferredCarId',pick(race.previousPreferred)?race.previousPreferred:selected);
  RACE_KEYS.forEach(k=>put(s,k,race.race?.[k]??null));
  put(s,'arkonStoryChapter07Work',{...a,racesDone:a.racesDone+1});
  put(s,'arkonStoryChapter07Race',null);
  return true;
}
export function convertArkonCh7Car(s){
  if(!story(s)||!cars[CH7_HERO_ID])return false;
  const a=state(s),owned=get(s,'ownedCarIds')||[];
  if(a.converted)return owned.includes(CH7_HERO_ID);
  if(a.stage!==3||a.racesDone!==2||ch7Progress(s).level3!==ch7Progress(s).partsTotal||
     !owned.includes('240z')||owned.includes(CH7_HERO_ID))return false;
  const states={...(get(s,'carStates')||{})};
  const sites={...(get(s,'carGarageLocations')||{})};
  // Transfer the *actual* Level 3 build and tuning, not a fresh prize vehicle.
  states[CH7_HERO_ID]={...(states['240z']||{}),storyLibertyWalk:true};
  delete states['240z'];
  sites[CH7_HERO_ID]=sites['240z']||'shinonomeWarehouseStrip';delete sites['240z'];
  const newOwned=owned.map(id=>id==='240z'?CH7_HERO_ID:id);
  put(s,'ownedCarIds',newOwned);
  put(s,'carStates',states);
  put(s,'carGarageLocations',normaliseCarGarageLocations(newOwned,sites,2));
  put(s,'selectedCarId',CH7_HERO_ID);put(s,'preferredCarId',CH7_HERO_ID);
  put(s,'arkonStoryChapter07Work',{...a,converted:true});
  return true;
}
export function startArkonCh7SoloDrive(s){
  if(!story(s)||!state(s).converted||!get(s,'ownedCarIds')?.includes(CH7_HERO_ID)||
    get(s,'arkonStoryChapter07Solo')?.active||get(s,'arkonStoryChapter07SoloFinished'))return false;
  const context={active:true,completed:false,
    previousSelected:get(s,'selectedCarId'),previousPreferred:get(s,'preferredCarId'),
    race:Object.fromEntries(RACE_KEYS.map(k=>[k,get(s,k)??null]))};
  put(s,'arkonStoryChapter07Solo',context);
  put(s,'selectedCarId',CH7_HERO_ID);put(s,'preferredCarId',CH7_HERO_ID);
  Object.entries({
    selectedRaceCategory:'ARKON_CH7_SOLO',selectedRaceType:'Roll Race',
    selectedRaceDistanceM:804.672,selectedRaceDeal:'STORY',selectedRaceStake:0,
    selectedRaceSpecialChallenge:false,selectedRaceMeetOffer:null,
    selectedOpponentCarId:'ae86',selectedOpponentCharacterId:'storyDaigoKirishima',
    selectedOpponentEncounterRating:1,selectedOpponentEncounterAi:null,
    selectedOpponentBuildState:null,selectedOpponentBuildRating:1,
    selectedOpponentDifficulty:'EASY',selectedRacePlayerCharacterId:'arkonDen',
    raceReturnScene:'MeetScene',raceTimeOfDay:'night',raceDistrict:'SHINJUKU',
    raceLocationLabel:'CHAPTER 07 // THE LONELIEST DRIVE',
  }).forEach(([k,v])=>put(s,k,v));
  return true;
}
export function finishArkonCh7SoloDrive(s){
  const drive=get(s,'arkonStoryChapter07Solo');
  if(!story(s)||!drive?.active||!drive.completed)return false;
  RACE_KEYS.forEach(k=>put(s,k,drive.race?.[k]??null));
  put(s,'selectedCarId',CH7_HERO_ID);put(s,'preferredCarId',CH7_HERO_ID);
  put(s,'arkonStoryChapter07Solo',null);
  put(s,'arkonStoryChapter07SoloFinished',true);
  return true;
}

// Workshop tier remains mandatory, but the scripted Level 3 commission has
// its own access to the existing PAID parts, independent of Career's 40 wins.
export function canArkonCh7BuyStoryParts(source,carId,workshopId,level){
  return story(source)&&state(source).stage===2&&carId==='240z'&&
    workshopId==='shinonomeWarehouseStrip'&&Number(level)===3&&
    (get(source,'ownedCarIds')||[]).includes('240z')&&
    Number(get(source,'garageTier')||0)>=2;
}

export function claimArkonCh7FirstVisitScene(source,region){
  if(!story(source)||state(source).stage!==1)return false;
  const id=String(region||'').toUpperCase();
  if(!['SHIBUYA','YOKOHAMA'].includes(id))return false;
  const p=state(source),seen=Array.isArray(p.firstVisitScenes)?p.firstVisitScenes:[];
  if(seen.includes(id)||!p.shops?.includes(id))return false;
  put(source,'arkonStoryChapter07Work',{...p,firstVisitScenes:[...seen,id]});
  return true;
}
