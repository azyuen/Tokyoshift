// Tokyo Drag Complex Pro Paddock is a virtual view of registered personal cars.
// Car ownership, workshop assignment and tuning have one shared registry state.
import { normaliseProCircuitState } from './proCircuit.js?v=20261030-r741';
import { getProQualification } from './proSeason.js?v=20261030-r741';
import {
  PRO_GARAGE_ID, WORKSHOP_TIERS, getUnlockedWorkshops,
  normaliseCarGarageLocations,
} from './workshopProgression.js?v=20261024-r675';

export const PRO_GARAGE_BAYS = Object.freeze([
  Object.freeze({number:'04'}),
  Object.freeze({number:'05'}),
  Object.freeze({number:'06'}),
]);

export function stageProGarage(raw,ownedCarIds=[],locations={},garageTier=0){
  const c=normaliseProCircuitState(raw);
  if((c.seasonStatus!=='ACTIVE'&&!(c.activeChampionship&&!c.activeChampionship.completed))||
    !Array.isArray(c.registeredDriverCars)||
    c.registeredDriverCars.length!==3)return {error:'THREE REGISTERED PRO SEASON CARS REQUIRED'};
  // Migrate older saves which physically moved their cars into the paddock.
  // Preserve each original workshop so the car is visible in both places.
  if(c.proGarageOrigins&&Object.keys(c.proGarageOrigins).length===3){
    const restored={...locations};
    for(const [id,origin] of Object.entries(c.proGarageOrigins)){
      if(restored[id]===PRO_GARAGE_ID)restored[id]=origin;
    }
    return {circuit:c,carGarageLocations:
      normaliseCarGarageLocations(ownedCarIds,restored,garageTier)};
  }
  const assignments=normaliseCarGarageLocations(ownedCarIds,locations,garageTier);
  const origins={};
  for(const id of c.registeredDriverCars){
    if(!ownedCarIds.includes(id)||!assignments[id]||
      assignments[id]==='crewSpace'||assignments[id]===PRO_GARAGE_ID)
      return {error:'REGISTERED CAR MUST BE IN A PERSONAL GARAGE'};
    origins[id]=assignments[id];
  }
  // Do not transfer the cars. Pro Paddock shows references to these same
  // car IDs and their latest carStates, without duplicating the inventory.
  return {circuit:{...c,proGarageOrigins:origins},carGarageLocations:assignments};
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
  const championship=c.activeChampionship;
  // Championship has its own locked trio. The paddock is a virtual view of
  // owned cars and never changes the Pro Season registration or garage homes.
  const championshipCars=championship&&!championship.completed&&
    Array.isArray(championship.championshipRegisteredCars)&&
    championship.championshipRegisteredCars.length===3?
      championship.championshipRegisteredCars:null;
  const roster=championshipCars||
    (c.proGarageOrigins&&Array.isArray(c.registeredDriverCars)?c.registeredDriverCars:null);
  if(!roster)return [];
  return PRO_GARAGE_BAYS.map((bay,index)=>({
    ...bay,carId:ownedCarIds.includes(roster[index])?roster[index]:null,
  }));
}
