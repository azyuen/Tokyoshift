import test from 'node:test';
import assert from 'node:assert/strict';
import {getEncounterProfile} from '../src/data/encounterProfiles.js';
import {PROGRESSION_BALANCE} from '../src/data/progressionBalance.js';
import {buildTunerTeamChallengeRounds} from '../src/data/tunerChallenges.js';
import {getCrewRecruitmentChallengeRules} from '../src/data/crewSystem.js';
import {getEncounterAi} from '../src/data/encounterProfiles.js';

test('all Shinjuku Meets offer mostly or exclusively Elite drivers',()=>{
  for(const id of ['shinjuku3dCat','shinjukuMetroGov','shinjukuGodzilla']){
    const profile=getEncounterProfile(id);
    assert.equal(profile.difficulty,'ELITE');
    assert.ok(profile.ratingSlots.every(r=>r>=4));
    assert.ok(profile.ratingSlots.filter(r=>r===5).length>=2);
  }
});

test('Shinjuku 7-stage regional challenge has Elite drivers throughout',()=>{
  const rounds=buildTunerTeamChallengeRounds('SHINJUKU','', 'STANDARD');
  assert.equal(rounds.length,7);
  assert.ok(rounds.every(r=>r.encounterRating===5));
  assert.ok(rounds.every(r=>r.encounterAi.shiftSkill>=getEncounterAi(5).shiftSkill));
  assert.ok(rounds.every(r=>r.maxTuningLevel===3&&r.tuningPointCap===48));
});

test('only late-game ELITE matchup pools are increased',()=>{
  const cfg=PROGRESSION_BALANCE.meetMatchmaking.difficultyVehicleProfiles;
  assert.deepEqual(cfg.ELITE.normalBuildRatings,[4,5]);
  assert.ok(cfg.ELITE.bandWeights.stronger>cfg.ELITE.bandWeights.weaker);
  assert.deepEqual(cfg.HARD.normalBuildRatings,[2,3,4]);
  assert.deepEqual(cfg.MED.normalBuildRatings,[1,2,3]);
});

test('stock crew recruitment difficulty follows region and player setting',()=>{
  const rules=(region,difficulty)=>{
    const state={playerDifficulty:difficulty,carStates:{},ownedCarIds:['ae86']};
    return getCrewRecruitmentChallengeRules(
      {get:key=>state[key]}, {regionId:region,baseCarId:'ae86'});
  };
  assert.equal(rules('SHINJUKU','STANDARD').aiRating,5);
  assert.equal(rules('DAIKOKU','STANDARD').aiRating,5);
  assert.equal(rules('ODAIBA','STANDARD').aiRating,4);
  assert.equal(rules('ODAIBA','EASY').aiRating,2);
  assert.equal(rules('SHINJUKU','EASY').aiRating,2);
  assert.equal(rules('ODAIBA','HARD').aiRating,5);
  assert.deepEqual(rules('SHINJUKU','STANDARD').eligibleCarIds,
    rules('SHINJUKU','EASY').eligibleCarIds);
});
