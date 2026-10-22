import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ARKON_CHAPTER_04 } from '../src/data/arkonChapter04.js';
import { STORY_DIRECTOR_SCRIPTS } from '../src/data/storyDirectorScripts.js';
import { validateStoryScript } from '../src/story/StoryScript.js';
import { recordArkonRwbPurchase, ARKON_RWB_AUCTION_PRICE } from '../src/data/arkonChapter04Ledger.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';

const source=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const registry=(initial={})=>{
  const state={...initial};
  return {get:k=>state[k],set:(k,v)=>{state[k]=v;},state};
};

test('R659 Chapter 04 is a registered, valid script with correct story gates',()=>{
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter04,ARKON_CHAPTER_04);
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_04));
  assert.ok(ARKON_CHAPTER_04.steps.length>=50);
  assert.equal(ARKON_CHAPTER_04.steps.filter(s=>s.type==='ARKON_RWB_PURCHASE').length,1);
  assert.equal(ARKON_CHAPTER_04.steps.filter(s=>s.type==='CHOICE').length,3);
  assert.ok(ARKON_CHAPTER_04.steps.some(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryChapter04Done'));
  assert.ok(ARKON_CHAPTER_04.steps.at(-1).type==='END');
});

test('R659 complete chapter uses the established stage geometry, not bespoke offsets',()=>{
  const stages=ARKON_CHAPTER_04.steps.filter(s=>s.type==='STAGE');
  assert.ok(stages.length>=8);
  assert.ok(stages.every(s=>s.backgroundId==='$CURRENT_WORKSHOP'));
  assert.ok(stages.every(s=>s.stageMode==='native'));
  assert.ok(stages.every(s=>s.characters.every(c=>!('x' in c)&&!('y' in c)&&!('ground' in c)&&!('height' in c))));
  assert.ok(stages.every(s=>s.cars.every(c=>!('x' in c)&&!('width' in c)&&!('ground' in c))));
  assert.ok(stages.some(s=>s.cars.some(c=>c.carId==='rwbStellaPorsche')));
  const stageSrc=source('../src/ui/StoryStage.js');
  assert.match(stageSrc,/\$CURRENT_WORKSHOP/);
  assert.match(stageSrc,/scene\.buildWorkshopHeroLayout\(c\.model\)/);
  assert.match(stageSrc,/getNativeCastPlacement\(template,i,actors\.length,a\.role\)/);
});

test('R659 all chapter scene establishing shots require player-controlled progress',()=>{
  const steps=ARKON_CHAPTER_04.steps;
  assert.equal(steps.filter(s=>s.type==='WAIT_MS').length,0);
  assert.ok(steps.filter(s=>s.type==='HOLD_SCENE').length>=9);
  for(let i=0;i<steps.length;i++){
    if(steps[i].type==='STAGE'){
      assert.equal(steps[i+1]?.type,'HOLD_SCENE');
    }
  }
  assert.ok(steps.every(s=>!['START_RACE','ARKON_MX5_RACE','ARKON_CHALLENGE_RACE','OPEN_MAP'].includes(s.type)));
  const director=source('../src/story/StoryDirector.js');
  assert.match(director,/sceneName\(scene\)!=='GarageScene'/);
  assert.match(director,/ARKON_RWB_PURCHASE/);
  const objective=source('../src/ui/ArkonStoryObjective.js');
  assert.match(objective,/BEGIN CHAPTER 04/);
  assert.match(objective,/scene\.time\.delayedCall\(1,/);
});

test('R659 RWB auction stores a safe restoration project, cash paid only once',()=>{
  const reg=registry({gameMode:'arkonStory',arkonStoryChapter03Done:true,cash:16000});
  assert.equal(recordArkonRwbPurchase(reg),true);
  assert.equal(reg.get('cash'),10000);
  const car=reg.get('arkonStoryRwbProject');
  assert.equal(car.acquired,true);
  assert.equal(car.carId,'rwbStellaPorsche');
  assert.equal(car.roadworthy,false);
  assert.equal(car.purchasePrice,ARKON_RWB_AUCTION_PRICE);
  assert.equal(car.deposit,6000);
  assert.equal(car.outstandingFinance,ARKON_RWB_AUCTION_PRICE-6000);
  assert.equal(recordArkonRwbPurchase(reg),true);
  assert.equal(reg.get('cash'),10000);
  assert.ok(!reg.get('ownedCarIds')?.includes('rwbStellaPorsche'));
  const poor=registry({gameMode:'arkonStory',arkonStoryChapter03Done:true,cash:1000});
  assert.equal(recordArkonRwbPurchase(poor),true);
  assert.equal(poor.get('cash'),0);
  const career=registry({gameMode:'career',arkonStoryChapter03Done:true,cash:10000});
  assert.equal(recordArkonRwbPurchase(career),false);
  assert.equal(career.get('cash'),10000);
});

test('R659 persists Chapter 04 project on Arkon Story only',()=>{
  const values={...createDefaultGameState(),firstName:'Arkon',lastName:'Den',gameMode:'arkonStory',
    arkonStoryChapter03Done:true,arkonStoryChapter04Done:true,
    arkonStoryRwbProject:{acquired:true,carId:'rwbStellaPorsche',
      status:'structural-and-engine-restoration-required',roadworthy:false,
      deposit:6000,purchasePrice:ARKON_RWB_AUCTION_PRICE,
      outstandingFinance:ARKON_RWB_AUCTION_PRICE-6000}};
  const story=normaliseState(values);
  assert.equal(story.arkonStoryChapter04Done,true);
  assert.equal(story.arkonStoryRwbProject.carId,'rwbStellaPorsche');
  assert.equal(story.arkonStoryRwbProject.roadworthy,false);
  const career=normaliseState({...values,gameMode:'career'});
  assert.equal(career.arkonStoryChapter04Done,false);
  assert.equal(career.arkonStoryRwbProject,null);
});

test('R659 no side effects on regular Meet offers or Career Ginza',()=>{
  const script=source('../src/data/arkonChapter04.js');
  assert.doesNotMatch(script,/selectedRaceDeal|selectedOpponentCarId|arkonStoryGinzaUnlocked/);
  const director=source('../src/story/StoryDirector.js');
  assert.match(director,/scene\._arkonStoryObjectiveOpen/);
  const objective=source('../src/ui/ArkonStoryObjective.js');
  assert.match(objective,/!scene\.registry\.get\('storyDirectorProgress'\)/);
});
