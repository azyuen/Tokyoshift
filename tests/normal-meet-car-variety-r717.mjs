import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {cars,carOrder} from '../src/data/cars.js';
import {stockClassFor} from '../src/data/stockClasses.js';
import {LOCATION_ENCOUNTERS,getEncounterProfile} from '../src/data/encounterProfiles.js';
import {
  NORMAL_MEET_CLASS_FOCUS,NORMAL_MEET_CANDIDATE_COUNT,
  getNormalMeetCandidateCars,getNormalMeetPreferredClasses,
} from '../src/data/normalMeetCarSelection.js';
import {createMeetOpponentMatch} from '../src/data/meetMatchmaking.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const rng=(seed=1)=>()=>{
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  return seed/4294967296;
};

test('normal Meet candidate car selection is regional, varied and character-independent',()=>{
  const seen=new Set();
  let focused=0,total=0,outliers=0;
  for(const locationId of Object.keys(LOCATION_ENCOUNTERS)){
    const profile=getEncounterProfile(locationId);
    const focus=new Set(getNormalMeetPreferredClasses(locationId));
    assert.ok(focus.size>0,locationId+' missing factory-class preference');
    for(let round=1;round<=16;round++){
      const args={locationId,preferredCars:profile.likelyCars,
        playerCarId:'ae86',random:rng(12000+round*317+locationId.length*137)};
      const pool=getNormalMeetCandidateCars(args);
      assert.equal(pool.length,NORMAL_MEET_CANDIDATE_COUNT);
      assert.equal(new Set(pool).size,pool.length);
      for(const carId of pool){
        assert.ok(carOrder.includes(carId));
        assert.ok(!cars[carId].collector&&!cars[carId].tuningLocked);
        const match=focus.has(stockClassFor(cars[carId]));
        focused+=Number(match);
        outliers+=Number(!match);
        total++;seen.add(carId);
      }
    }
  }
  assert.ok(focused/total>.68,'region-preferred classes should dominate');
  assert.ok(outliers>0,'occasional class outsiders still appear');
  assert.ok(seen.has('rx8')&&seen.has('rx7fd'),'all regular Mazda models are eligible');
  assert.ok(seen.size>30,'wide variety of stock cars across regions');
});

test('rival signature cars are NOT required on regular Meets, but stay in career',()=>{
  const meet=read('src/scenes/MeetScene.js');
  const start=meet.indexOf('  generateOffersForLocation(locationId) {');
  const end=meet.indexOf('  meetRosterHasDuplicatePeople(',start);
  assert.ok(start>=0&&end>start);
  const regular=meet.slice(start,end);
  assert.match(regular,/getNormalMeetCandidateCars\(\{/);
  assert.match(regular,/preferredClasses: getNormalMeetPreferredClasses\(locationId\)/);
  assert.doesNotMatch(regular,/requiredCarId:/);
  assert.match(regular,/isMainRival: false/);
  assert.match(regular,/MEET_ROSTER_VERSION/);
  assert.match(meet,/const MEET_ROSTER_VERSION = 'R717'/);
  assert.match(read('src/data/tunerChallenges.js'),/getRegionalRivalSignatureCarId\(key, characterId, round\.carId\)/);
  assert.match(read('src/data/crewSystem.js'),/createStockOpponentState\(baseCarId\)/);
  assert.match(read('src/data/crewSystem.js'),/buildTunerTeamChallengeRounds\(key, ''\)/);
  assert.match(read('src/data/meetMatchmaking.js'),/options\.requiredCarId/);
});

test('physical matcher still selects a real developed rival from the bounded shortlist',()=>{
  const loc='tatsumiSkylineVista';
  const preferred=getEncounterProfile(loc).likelyCars;
  const candidates=getNormalMeetCandidateCars({
    locationId:loc,preferredCars:preferred,random:rng(7),playerCarId:'ae86',
  });
  const options={
    playerCarId:'ae86',playerState:{},ownedCarIds:['ae86'],
    usedCarIds:[],preferredCars:preferred,candidateCarIds:candidates,
    preferredClasses:getNormalMeetPreferredClasses(loc),
    raceType:'Standing Start',difficulty:'MED',playerDifficulty:'STANDARD',
    locationId:loc,refreshSeed:100,slotIndex:0,random:rng(8),
  };
  const a=createMeetOpponentMatch(options);
  assert.ok(a&&candidates.includes(a.carId));
  assert.ok(a.buildState&&Number.isFinite(a.ratio));
  assert.ok(Number.isFinite(a.playerPerformanceIndex));
  assert.ok(Number.isFinite(a.opponentPerformanceIndex));
  // A required signature-car choice (used by authored event callers) continues
  // to override any ordinary-Meet shortlist.
  const signature=createMeetOpponentMatch({...options,
    requiredCarId:'rx8',candidateCarIds:['ae86'],random:rng(8)});
  assert.equal(signature?.carId,'rx8');
});

test('R717 modifies only normal Meet runtime and does not change R716 Showdown',()=>{
  assert.equal(JSON.parse(read('version.json')).build,'R717');
  assert.match(read('index.html'),/id="build-stamp">R717/);
  assert.match(read('index.html'),/main\.js\?v=20261029-r717/);
  assert.match(read('src/main.js'),/MeetScene\.js\?v=20261029-r717/);
  assert.match(read('sw.js'),/const BUILD = 'R717'/);
  assert.match(read('sw.js'),/const ASSET_CACHE = 'tokyoshift-assets-r688'/);
  assert.match(read('src/scenes/MeetScene.js'),/streetShowdownCouponHunt\.js\?v=20261029-r716b/);
  const showdown=read('src/data/streetShowdowns.js');
  assert.match(showdown,/export function createStreetShowdownRounds\(/);
  assert.doesNotMatch(showdown,/normalMeetCarSelection/);
});
