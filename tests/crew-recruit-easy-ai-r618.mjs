import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCrewRecruitmentChallengeRules } from '../src/data/crewSystem.js';
import { getEncounterAi, boostAiForStandingStart } from '../src/data/encounterProfiles.js';
import { applyDifficultyToRivalAi } from '../src/data/playerDifficulty.js';

// Performance estimates now run the real vehicle/AI physics in Node. Match
// the minimal Phaser math shim already used by tests/ai-driving.mjs.
globalThis.Phaser ??= { Math: {
  Clamp: (v,a,b) => Math.max(a,Math.min(b,v)),
  Linear: (a,b,t) => a+(b-a)*t,
} };

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const meet = read('src/scenes/MeetScene.js');
const race = read('src/scenes/RaceScene.js');
const profileSource = read('src/data/playerDifficulty.js');

const rules = mode => {
  const state = { playerDifficulty:mode, carStates:{}, ownedCarIds:['ae86'] };
  const source = { get(key){return state[key];} };
  return getCrewRecruitmentChallengeRules(source, {
    regionId:'ODAIBA', characterId:'aoiShindou', baseCarId:'ae86',
  });
};

test('Easy crew recruitment is a consistent Rookie (rating 2) independent of the rival',()=>{
  const easy=rules('EASY');
  assert.equal(easy.playerDifficulty,'EASY');
  assert.equal(easy.aiTier,'ROOKIE');
  assert.equal(easy.aiRating,2);
  assert.equal(easy.carRule,'STOCK');
  assert.match(meet,/const encounterAi = getEncounterAi\(rating\)/);
  assert.match(meet,/this\.registry\.set\('selectedOpponentEncounterRating', rating\)/);
  assert.match(meet,/this\.registry\.set\('selectedOpponentEncounterAi', encounterAi\)/);
});

test('Easy crew AI is substantially slower at reaction, launch and shifting than Expert',()=>{
  const easy=applyDifficultyToRivalAi(
    boostAiForStandingStart(getEncounterAi(rules('EASY').aiRating),2),'EASY'
  );
  const expert=getEncounterAi(4);
  for(const key of ['reactionSkill','launchSkill','shiftSkill','aggression']){
    assert.ok(easy[key]<expert[key],key+' Easy needs to be easier than Expert');
  }
  assert.ok(easy.launchSkill < .70);
  assert.ok(easy.shiftSkill < .70);
  // Actual RaceScene executes the same shared physics, just changed driver
  // skills and existing Easy-mode AI assist.
  assert.match(race,/rivalAI = applyDifficultyToRivalAi\(/);
  assert.match(race,/this\.raceMode === 'CREW_RECRUIT' && this\.playerDifficulty === 'STANDARD'/);
});

test('Standard recruitment uses Skilled 3 rather than Expert 4',()=>{
  const std=rules('STANDARD');
  assert.equal(std.aiRating,3);
  assert.equal(std.aiTier,'SKILLED');
  assert.match(meet,/const rating = recruitRules\.aiRating/);
  assert.match(meet,/const encounterAi = getEncounterAi\(rating\)/);
  assert.deepEqual(applyDifficultyToRivalAi(getEncounterAi(3),'STANDARD'),getEncounterAi(3));
  for(const key of ['reactionSkill','launchSkill','shiftSkill','aggression']){
    assert.ok(getEncounterAi(3)[key]<getEncounterAi(4)[key],key+' Skilled should be below former Expert');
  }
});

test('Hard recruitment uses Expert 4 rather than Elite 5',()=>{
  const hard=rules('HARD');
  assert.equal(hard.aiRating,4);
  assert.equal(hard.aiTier,'EXPERT');
  assert.match(meet,/const encounterAi = getEncounterAi\(rating\)/);
  // Hard's usual driver modifier remains, but a tier-four recruit should
  // still be slower than the former tier-five recruit after that modifier.
  const newHard=applyDifficultyToRivalAi(
    boostAiForStandingStart(getEncounterAi(4),4),'HARD'
  );
  const oldHard=applyDifficultyToRivalAi(
    boostAiForStandingStart(getEncounterAi(5),5),'HARD'
  );
  for(const key of ['reactionSkill','launchSkill','shiftSkill','aggression']){
    assert.ok(newHard[key]<oldHard[key],key+' Hard Expert should be below former Elite');
  }
});

test('All three modes preserve stock matching and vehicle power class',()=>{
  const easy=rules('EASY'),standard=rules('STANDARD'),hard=rules('HARD');
  assert.deepEqual(easy.powerClass,standard.powerClass);
  assert.deepEqual(hard.powerClass,standard.powerClass);
  assert.deepEqual(easy.eligibleCarIds,standard.eligibleCarIds);
  assert.deepEqual(hard.eligibleCarIds,standard.eligibleCarIds);
  assert.match(meet,/createStockOpponentState\(challenge\.baseCarId\)/);
  assert.match(meet,/this\.registry\.set\('selectedOpponentBuildRating', 1\)/);
});

test('Global difficulty profile stays untouched by recruitment-only change',()=>{
  assert.match(profileSource,/aiSkillMultiplier: 0\.84/);
  assert.match(profileSource,/STANDARD: Object\.freeze/);
  assert.match(profileSource,/HARD: Object\.freeze/);
});
