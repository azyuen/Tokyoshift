import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_01_REVISED} from '../src/data/arkonChapter01Revised.js';
import {ARKON_CHAPTER_01} from '../src/data/arkonChapter01.js';
import {ARKON_CHAPTER_01_EXTENDED_STEPS} from '../src/data/arkonChapter01Extended.js';
import {ARKON_CHAPTER_10} from '../src/data/arkonChapter10.js';
import {createArkonStoryState,createDefaultGameState,normaliseState} from '../src/state/GameState.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const textOf=step=>(step?.pages||[]).map(p=>p.text||'').join(' ');
test('the real fresh Aruken Story car is his own Datsun 240Z, not a Civic',()=>{
  const state=createArkonStoryState(0);
  assert.equal(state.starterCarId,'240z');
  assert.equal(state.selectedCarId,'240z');
  assert.ok(state.ownedCarIds.includes('240z'));
  assert.ok(!state.ownedCarIds.includes('ef'));
  const choice=ARKON_CHAPTER_01_REVISED.steps.find(s=>s.type==='CHOICE'&&s.key==='arkonMoneyDisclosure');
  assert.equal(choice.title,'SHE ASKS ABOUT THE Z');
  const aruken=ARKON_CHAPTER_01_REVISED.steps.find(s=>s.type==='MANGA'&&s.title==='AN OLD DATSUN');
  assert.match(textOf(aruken),/old 240Z/i);
  const aoi=ARKON_CHAPTER_01_REVISED.steps.find(s=>s.type==='STAGE'&&s.characters?.some(c=>c.id==='aoiShindou'));
  assert.equal(aoi.cars[0].carId,'240z');
  assert.ok(ARKON_CHAPTER_01_REVISED.steps.some(s=>s.type==='WAIT_FLAG'&&s.key==='wins'&&s.atLeast===3));
  assert.ok(ARKON_CHAPTER_01_REVISED.steps.some(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryChapter01RevisedDone'&&s.value===true));
});
test('old chapter scripts preserve progression and do not misname a retained Civic or current Z',()=>{
  const old=[...ARKON_CHAPTER_01.steps,...ARKON_CHAPTER_01_EXTENDED_STEPS];
  const dialogue=old.map(textOf).join(' ');
  assert.doesNotMatch(dialogue,/\bCivic\b/i);
  assert.match(dialogue,/old car/i);
  assert.ok(ARKON_CHAPTER_01.steps.some(s=>s.type==='WAIT_FLAG'&&s.key==='wins'&&s.atLeast===2));
  assert.ok(ARKON_CHAPTER_01.steps.some(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryChapter01FullDone'&&s.value===true));
  const upgradedEf={...createDefaultGameState({starterCarId:'ef'}),
    firstName:'Arkon',lastName:'Den',gameMode:'arkonStory',starterCarId:'ef',
    ownedCarIds:['ef'],selectedCarId:'ef',preferredCarId:'ef',
    carStates:{ef:{acquiredVia:'starter',stock:false,tuneLevel:2,
      tuning:{engine:2},nosInstalled:false}}};
  const saved=normaliseState(upgradedEf);
  assert.ok(saved.ownedCarIds.includes('ef'),'upgraded legacy Civic cannot disappear');
  assert.equal(saved.selectedCarId,'ef');
});
test('Sayaka first tells Aruken about Daichi; nothing claims they already met',()=>{
  const scene=ARKON_CHAPTER_10.steps.find(s=>s.type==='MANGA'&&s.title==='A LITTLE OPPORTUNITY');
  assert.ok(scene);
  const words=textOf(scene);
  assert.match(words,/I met a young mechanic named Daichi/i);
  assert.match(words,/You think he has potential\?/i);
  assert.match(words,/I do\. And there is someone else/i);
  assert.match(words,/affordable workshop space for Daichi/i);
  assert.match(words,/handle the lease through the office/i);
  assert.match(words,/child of old family friends/i);
  assert.match(words,/AE86 or a Civic EF/i);
  assert.doesNotMatch(words,/Do you remember Daichi|He is a good mechanic|already met Daichi|worked with Daichi/i);
  const ending=ARKON_CHAPTER_10.steps.find(s=>s.type==='MANGA'&&s.title==='THE SAME VIEW');
  assert.doesNotMatch(textOf(ending),/Daichi is counting on us/i);
  assert.match(textOf(ending),/two have their own futures to build/i);
});
test('R679 ending and chapter save actions remain intact',()=>{
  const steps=ARKON_CHAPTER_10.steps;
  const at=type=>steps.findIndex(s=>s.type===type);
  assert.ok(at('ARKON_CH10_RACE')>=0);
  assert.ok(at('ARKON_CH10_RACE')<at('ARKON_CH10_SELL_Z'));
  assert.ok(at('ARKON_CH10_SELL_Z')<at('ARKON_CH10_GINZA'));
  assert.ok(at('ARKON_CH10_GINZA')<at('ARKON_CH10_INVEST'));
  assert.ok(at('ARKON_CH10_INVEST')<at('ARKON_CH10_DRIVE'));
  assert.ok(at('ARKON_CH10_DRIVE')<at('ARKON_CH10_FINALE'));
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter01Revised,ARKON_CHAPTER_01_REVISED);
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter10,ARKON_CHAPTER_10);
  assert.match(read('src/ui/ArkonStoryArchivePanel.js'),/arkonChapter10\.js\?v=20261024-r681/);
  assert.match(read('docs/CAREER_R680_PRE_PRO_CONTINUITY.md'),/first meeting with Daichi/i);
  assert.match(read('docs/ARKON_R681_240Z_DAICHI_CONTINUITY.md'),/No professional sponsorship cutscene is implemented here/i);
});
