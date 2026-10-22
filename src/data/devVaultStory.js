// R641 — non-canonical Arkon Den/private-vault interactive story rehearsal.
// Opts in only when the named developer takes a CURRENT Ginza vault loan and
// chooses Shibuya Dogenzaka on the real map.
import { isNamedArkonDen } from './ginzaGallery.js?v=20261021-r629';
import { isGinzaLoanActive } from './ginzaLoanAccess.js?v=20261022-r636';

export const DEV_VAULT_STORY_ID = 'devVaultNightOut';
export const DEV_VAULT_HERO_CAR = 'minesR34';
export const DEV_VAULT_EPISODE_KEY = 'devVaultNightOutR641';
export const DEV_VAULT_RACE_ACTIVE_KEY = '__devVaultStoryRaceActive';
export const DEV_VAULT_RACE_OUTCOME_KEY = '__devVaultStoryRaceOutcome';
const RACE_FIELDS = [
  'selectedRaceCategory','selectedRaceType','selectedRaceDistanceM',
  'selectedRaceDeal','selectedRaceStake','selectedRaceSpecialChallenge',
  'selectedRaceMeetOffer','selectedOpponentCarId','selectedOpponentCharacterId',
  'selectedOpponentEncounterRating','selectedOpponentEncounterAi',
  'selectedOpponentBuildState','selectedOpponentBuildRating',
  'selectedOpponentBuildArchetype','selectedOpponentDifficulty',
  'selectedOpponentPaintColor','selectedRacePlayerCharacterId',
  'raceReturnScene','raceTimeOfDay','raceDistrict','raceLocationLabel',
];

const read = (source, key) =>
  typeof source?.get === 'function' ? source.get(key) : source?.[key];

export function isArkonVaultStoryLoan(source) {
  const loan = read(source, 'ginzaTestDrive');
  // Named Arkon's vault loan is the permission: his dev profile does not
  // necessarily persist the old devMode flag on every restored save.
  return isNamedArkonDen(source) && isGinzaLoanActive(source) &&
    loan?.carId === read(source, 'selectedCarId');
}
export function shouldLaunchDevVaultStoryForDestination(source,locationId) {
  return isArkonVaultStoryLoan(source) &&
    locationId === 'shibuyaDogenzaka' &&
    read(source, 'ginzaTestDrive')?.[DEV_VAULT_EPISODE_KEY] === 'armed';
}
export function shouldLaunchDevVaultStory(source) {
  return shouldLaunchDevVaultStoryForDestination(source,read(source,'meetLocation'));
}

export function armDevVaultStoryLoan(source) {
  if (!isArkonVaultStoryLoan(source)) return false;
  const loan = read(source, 'ginzaTestDrive');
  source.set('ginzaTestDrive', {...loan, [DEV_VAULT_EPISODE_KEY]:'armed'});
  return true;
}

export function claimDevVaultStoryLoan(source) {
  if (!shouldLaunchDevVaultStory(source)) return false;
  const loan = read(source, 'ginzaTestDrive');
  source.set('ginzaTestDrive', {...loan, [DEV_VAULT_EPISODE_KEY]:'started'});
  return true;
}

export function prepareDevVaultHeroRace(source, carExists) {
  if (!isArkonVaultStoryLoan(source) || !carExists(DEV_VAULT_HERO_CAR)) return false;
  const old = Object.fromEntries(RACE_FIELDS.map(key => [key, read(source,key)]));
  source.set('__devVaultPriorRace',old);
  const values = {
    selectedRaceCategory:'SINGLE',selectedRaceType:'Standing Start',
    selectedRaceDistanceM:402.336,selectedRaceDeal:'BET',
    selectedRaceStake:0,selectedRaceSpecialChallenge:false,
    selectedRaceMeetOffer:null,selectedOpponentCarId:DEV_VAULT_HERO_CAR,
    selectedOpponentCharacterId:'ayaKurose',
    selectedOpponentEncounterRating:4,selectedOpponentEncounterAi:null,
    selectedOpponentBuildState:null,selectedOpponentBuildRating:4,
    selectedOpponentBuildArchetype:null,selectedOpponentDifficulty:'HARD',
    selectedOpponentPaintColor:null,selectedRacePlayerCharacterId:null,
    raceReturnScene:'DevVaultStoryScene',raceTimeOfDay:'night',
    raceDistrict:'SHIBUYA',raceLocationLabel:'DOGENZAKA // PRIVATE CHALLENGE',
  };
  Object.entries(values).forEach(([key,value]) => source.set(key,value));
  source.set(DEV_VAULT_RACE_OUTCOME_KEY,null);
  source.set(DEV_VAULT_RACE_ACTIVE_KEY,true);
  return true;
}

export function finishDevVaultHeroRace(source) {
  if (!read(source,DEV_VAULT_RACE_ACTIVE_KEY)) return false;
  const previous = read(source,'__devVaultPriorRace') || {};
  for (const key of RACE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(previous,key))
      source.set(key,previous[key] === undefined ? null : previous[key]);
  }
  source.set('__devVaultPriorRace',null);
  source.set(DEV_VAULT_RACE_ACTIVE_KEY,false);
  return true;
}
