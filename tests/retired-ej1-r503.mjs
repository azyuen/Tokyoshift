import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { cars, carOrder } from '../src/data/cars.js';
import { REFERENCE_CAR_GAME_IDS } from '../src/data/carReferenceGeometry.js';
import { getCarAssetPaths } from '../src/vehicles/CarAppearance.js';
import { AUTO_MARKET_LISTINGS, MARKET_BASE_PRICES, GINZA_LISTINGS } from '../src/data/centralTokyo.js';
import { REGION_TEAM_CHARACTER_IDS } from '../src/data/characters.js';
import { REGIONAL_CREW_ROSTERS } from '../src/data/crewRoster.js';
import { getEncounterProfile, LOCATION_ENCOUNTERS } from '../src/data/encounterProfiles.js';
import { buildTunerTeamChallengeRounds } from '../src/data/tunerChallenges.js';
import { migrateRetiredEJ1 } from '../src/data/carRetirement.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';

test('all 28 deployed regular cars use the new BODY/PAINT reference sprite system',()=>{
  assert.equal(carOrder.length,28);
  assert.equal(new Set(carOrder).size,28);
  assert.equal(Object.keys(REFERENCE_CAR_GAME_IDS).length,28);
  assert.deepEqual(new Set(carOrder),new Set(Object.keys(REFERENCE_CAR_GAME_IDS)));
  assert.ok(!('ej1' in cars));
  assert.ok(!carOrder.includes('ej1'));
  for(const id of carOrder){
    const car=cars[id];
    assert.ok(car && car.visual.referenceStandard,id);
    const paths=getCarAssetPaths(car);
    assert.match(paths.body,/\/Ref(?:2)?\//,id+' lacks reference stock body');
    assert.match(paths.paint,/\/Ref(?:2)?\//,id+' lacks reference paint');
    for(const path of [paths.body,paths.paint])
      assert.ok(existsSync(new URL('../'+path,import.meta.url)),id+' missing '+path);
  }
});

test('market, rival preferences, Odaiba championship and crew recruitment never issue EJ1',()=>{
  assert.equal(AUTO_MARKET_LISTINGS.length,28);
  assert.ok(AUTO_MARKET_LISTINGS.every(x=>x.carId!=='ej1'));
  assert.ok(!Object.hasOwn(MARKET_BASE_PRICES,'ej1'));
  assert.equal(GINZA_LISTINGS.length,11);
  for(const region of Object.values(REGIONAL_CREW_ROSTERS)){
    for(const member of region.members) {
      assert.ok(carOrder.includes(member.baseCarId),member.characterId+' uses a retired car');
    }
  }
  assert.equal(REGIONAL_CREW_ROSTERS.ODAIBA.members.find(m=>m.characterId==='aoiShindou').baseCarId,'crx');
  for(const locationId of Object.keys(LOCATION_ENCOUNTERS)){
    const profile=getEncounterProfile(locationId);
    assert.ok(profile.likelyCars.every(id=>carOrder.includes(id)),locationId+' contains a retired favourite');
  }
  const meet=readFileSync(new URL('../src/scenes/MeetScene.js',import.meta.url),'utf8');
  assert.match(meet,/cars\[offer\?\.carId\]/);
  assert.doesNotMatch(meet,/\bej1\b/);
  const challenge=readFileSync(new URL('../src/data/tunerChallenges.js',import.meta.url),'utf8');
  assert.doesNotMatch(challenge,/\bej1\b/);
  assert.match(challenge,/ODAIBA: \['crx', 'ae86', 'ef'/);
});

test('old cached EJ1 rivals, reward and crew records migrate to CR-X without touching the input',()=>{
  const old=createDefaultGameState();
  old.meetRosters={
    odaiba7eleven:[{characterId:'aoiShindou',carId:'ej1',displayCarId:'ej1',opponentBuildRating:1}]
  };
  old.competitionState={active:true,rounds:[{carId:'ej1',characterId:'aoiShindou'}]};
  old.specialChallenger={active:true,characterId:'aoiShindou',carId:'ej1'};
  old.crewMembers={ODAIBA:{characterId:'aoiShindou',baseCarId:'ej1'}};
  old.crewRecruitChallenge={characterId:'aoiShindou',baseCarId:'ej1'};
  old.carCoupons={ej1:3};
  const migrated=migrateRetiredEJ1(old);
  assert.equal(old.meetRosters.odaiba7eleven[0].carId,'ej1','original left unchanged');
  assert.equal(migrated.meetRosters.odaiba7eleven[0].carId,'crx');
  assert.equal(migrated.competitionState.rounds[0].carId,'crx');
  assert.equal(migrated.specialChallenger.carId,'crx');
  assert.equal(migrated.crewMembers.ODAIBA.baseCarId,'crx');
  assert.equal(migrated.crewRecruitChallenge.baseCarId,'crx');
  assert.equal(migrated.carCoupons.crx,3);
  assert.ok(!Object.hasOwn(migrated.carCoupons,'ej1'));
  const loaded=normaliseState(old);
  assert.equal(loaded.meetRosters.odaiba7eleven[0].carId,'crx');
  assert.equal(loaded.competitionState.rounds[0].carId,'crx');
  assert.equal(loaded.specialChallenger.carId,'crx');
  assert.equal(loaded.crewMembers.ODAIBA.baseCarId,'crx');
  assert.equal(loaded.carCoupons.crx,3);
});

test('EJ1 is retired without changing reference geometry, other cars or collector count',()=>{
  assert.equal(cars.evo3.shortName,'GALANT VR-4');
  assert.ok(cars.crx.visual.referenceStandard);
  assert.equal(GINZA_LISTINGS.length,11);
  assert.ok(REGION_TEAM_CHARACTER_IDS.ODAIBA.includes('aoiShindou'));
});
