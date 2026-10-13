import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars, carOrder } from '../src/data/cars.js';
import { LOCATION_ENCOUNTERS, NEW_MEET_MODELS_BY_REGION, getEncounterProfile, getMeetPreferredCars } from '../src/data/encounterProfiles.js';
import { getCharacterProfilePlacement, PROFILE_EYE_TARGET_RATIO } from '../src/characters/CharacterProfileRenderer.js';
import { resolveCharacterFaceAnchor } from '../src/characters/CharacterFaceAnchor.js';

const sceneSource = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const nearly=(actual,expected,msg)=>assert.ok(Math.abs(actual-expected)<0.51, msg+': '+actual+' vs '+expected);
const ref2New = ['z32','z33','240z','crx','dc2','eclipse','familia','180sx','st205','jzx100','b4rsk'];

test('new Ref2 models are in regional meet preference pools, not only in the car dealership', () => {
  const preferredAcrossLocations = new Set();
  const locations = Object.keys(LOCATION_ENCOUNTERS);
  assert.ok(locations.length >= 20);
  for (const id of locations) {
    const profile = getEncounterProfile(id);
    assert.ok(profile.likelyCars.length >= 5,id);
    for (const carId of profile.likelyCars) {
      assert.ok(cars[carId], id+' refers to nonexistent car '+carId);
      assert.ok(carOrder.includes(carId), id+' refers to unplayable car '+carId);
      assert.ok(!cars[carId].collector, id+' favours collector car '+carId);
      preferredAcrossLocations.add(carId);
    }
  }
  for(const carId of ref2New) {
    assert.ok(preferredAcrossLocations.has(carId),'new '+carId+' not recommended by any meet');
  }
  assert.equal(Object.keys(NEW_MEET_MODELS_BY_REGION).length,7);
  assert.deepEqual(getMeetPreferredCars('unmapped',{some:'non-array'}),[]);
});

test('starter meets stay recognisable and late regions add new cars without bypassing matchmaker',()=>{
  const odaiba=getEncounterProfile('odaiba7eleven');
  const daikoku=getEncounterProfile('daikokuOpenLot');
  assert.ok(odaiba.likelyCars.includes('ae86'));
  assert.ok(odaiba.likelyCars.includes('240z'));
  assert.ok(!odaiba.likelyCars.includes('r34'),'R34 is not a preferred rookie opponent');
  assert.ok(daikoku.likelyCars.includes('r34'));
  assert.ok(daikoku.likelyCars.includes('jzx100'));
  assert.deepEqual(getMeetPreferredCars('shibuyaScramble',['ek9','ek9']).filter(x=>x==='ek9'),['ek9']);
  const matchmaking=sceneSource('src/data/meetMatchmaking.js');
  assert.match(matchmaking,/for \(const carId of carOrder\)/);
  assert.match(matchmaking,/getVehiclePerformance\(carId, buildState/);
  assert.match(matchmaking,/allowedBuildRatings/);
  const meet=sceneSource('src/scenes/MeetScene.js');
  assert.match(meet,/preferredCars: profile\.likelyCars/);
  assert.match(meet,/MEET_ROSTER_VERSION = 'R500'/);
  assert.match(meet,/offer\?\.matchmakingVersion === MEET_ROSTER_VERSION/);
});

test('all portrait poses use the same canonical face anchor and target lower eye position', () => {
  assert.ok(PROFILE_EYE_TARGET_RATIO >= 0.35);
  const source={width:1000,height:1500};
  const visual={faceAnchor:{
    x:.48,y:.16,headHeight:.14,
    poses:{ win:{x:.53,y:.12}, loss:{x:.43,y:.18} },
  }};
  for(const [pose,side]of [['idle','left'],['win','right'],['loss','left']]){
    const face=resolveCharacterFaceAnchor(source,'r500-synthetic-face',visual,pose);
    const frame={x:500,y:420,frameWidth:440,frameHeight:600,side,flipInward:true};
    const placement=getCharacterProfilePlacement({
      source,spriteKey:'r500-synthetic-face',contextualVisual:visual,pose,
      profile:{scale:1,offsetX:0,offsetY:0},...frame,
    });
    const faceOnStageX=placement.x+(face.x-source.width/2)*placement.scale*(placement.flipX?-1:1);
    const faceOnStageY=placement.y+face.y*placement.scale;
    nearly(faceOnStageX,frame.x,pose+' face X');
    nearly(faceOnStageY,frame.y-frame.frameHeight/2+frame.frameHeight*PROFILE_EYE_TARGET_RATIO,pose+' face Y');
  }
});

test('cutscene pose change reuses the exact creation-placement helper and a lowered frame',()=>{
  const manga=sceneSource('src/ui/MangaCutscene.js');
  assert.match(manga,/const y = height \* 0\.50;/);
  assert.match(manga,/const placement = getCharacterProfilePlacement\(\{/);
  assert.match(manga,/\.setPosition\(placement\.x, placement\.y\)/);
  assert.doesNotMatch(manga,/PROFILE_HEAD_SAFE_RATIO/);
  const characterSource=sceneSource('src/characters/CharacterProfileRenderer.js');
  assert.match(characterSource,/const placement = getCharacterProfilePlacement\(\{/);
  assert.match(characterSource,/\.setScale\(placement\.scale\)/);
  // The driver seat anchor belongs to separate rendering and must remain unchanged.
  const driver=sceneSource('src/vehicles/DriverSilhouette.js');
  assert.doesNotMatch(driver,/PROFILE_EYE_TARGET_RATIO/);
});
