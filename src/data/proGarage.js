// Tokyo Drag Complex three-car secured paddock. The source of truth for
// vehicle ownership/tuning remains the ordinary garage registry; this only
// changes physical workshop assignment, never car or part inventory.
import { normaliseProCircuitState } from './proCircuit.js';
import { getProQualification, getProDriverDrivetrain } from './proSeason.js';
import {
  PRO_GARAGE_ID, WORKSHOP_TIERS, getUnlockedWorkshops,
  normaliseCarGarageLocations,
} from './workshopProgression.js';

export const PRO_GARAGE_BAYS = Object.freeze([
  Object.freeze({number:'04',drive:'AWD'}),
  Object.freeze({number:'05',drive:'RWD'}),
  Object.freeze({number:'06',drive:'FWD'}),
]);

export function stageProGarage(raw,ownedCarIds=[],locations={},garageTier=0){
  const c=normaliseProCircuitState(raw);
  if(c.seasonStatus!=='ACTIVE'||!Array.isArray(c.registeredDriverCars)||
    c.registeredDriverCars.length!==3)return {error:'THREE REGISTERED PRO SEASON CARS REQUIRED'};
  if(c.proGarageOrigins&&Object.keys(c.proGarageOrigins).length===3)
    return {circuit:c,carGarageLocations:normaliseCarGarageLocations(ownedCarIds,locations,garageTier)};
  const assignments=normaliseCarGarageLocations(ownedCarIds,locations,garageTier);
  const origins={};
  for(const id of c.registeredDriverCars){
    if(!ownedCarIds.includes(id)||!assignments[id]||
      assignments[id]==='crewSpace'||assignments[id]===PRO_GARAGE_ID)
      return {error:'REGISTERED CAR MUST BE IN A PERSONAL GARAGE'};
    origins[id]=assignments[id];
  }
  const transferred={...assignments};
  for(const id of c.registeredDriverCars)transferred[id]=PRO_GARAGE_ID;
  return {circuit:{...c,proGarageOrigins:origins},carGarageLocations:transferred};
}

export function releaseProGarage(raw,ownedCarIds=[],locations={},garageTier=0){
  const c=normaliseProCircuitState(raw);
  const origins=c.proGarageOrigins;
  if(!origins||!Object.keys(origins).length)
    return {circuit:c,carGarageLocations:normaliseCarGarageLocations(ownedCarIds,locations,garageTier),changed:false};
  const unlocked=getUnlockedWorkshops(garageTier);
  const validHomes=new Set(unlocked.map(w=>w.id));
  const current={...locations};
  for(const [id,original] of Object.entries(origins)){
    if(current[id]===PRO_GARAGE_ID&&ownedCarIds.includes(id))
      current[id]=validHomes.has(original)?original:WORKSHOP_TIERS[0].id;
  }
  const reassigned=normaliseCarGarageLocations(ownedCarIds,current,garageTier);
  return {circuit:{...c,proGarageOrigins:null},carGarageLocations:reassigned,changed:true};
}

export function shouldReleaseProGarage(raw){
  const c=normaliseProCircuitState(raw);
  if(!c.proGarageOrigins)return false;
  if(c.seasonStatus==='OPEN')return true;
  if(c.activeChampionship?.completed)return true;
  if(c.seasonStatus!=='COMPLETE')return false;
  // Qualified seasons retain their cars until the Tokyo Championship has
  // concluded; unsuccessful eight-round seasons release cars immediately.
  return !getProQualification(c).qualified;
}

export function getProGarageBayCars(raw,ownedCarIds=[]){
  const c=normaliseProCircuitState(raw);
  if(!c.proGarageOrigins||!Array.isArray(c.registeredDriverCars))return [];
  return PRO_GARAGE_BAYS.map(bay=>{
    const id=c.registeredDriverCars.find(carId=>
      getProDriverDrivetrain(carId)===bay.drive);
    return {...bay,carId:ownedCarIds.includes(id)?id:null};
  });
}
