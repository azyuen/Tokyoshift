// R656 — Arkon's third chapter must not mutate ordinary Career or replay grants.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { ARKON_CHAPTER_03 } from '../src/data/arkonChapter03.js';
import { STORY_DIRECTOR_SCRIPTS } from '../src/data/storyDirectorScripts.js';
import { validateStoryScript } from '../src/story/StoryScript.js';
import { getCharacterVisualAsset } from '../src/data/characters.js';
import {
  CANAL_YARD_MAX,getArkonCustomerJob,getArkonCustomerPower,
  isArkonCustomerJobComplete,recordArkonCustomerJob,
  beginArkonMx5GuestRace,finishArkonMx5GuestRace,
} from '../src/data/arkonChapter03Jobs.js';
import { createArkonStoryState,normaliseState } from '../src/state/GameState.js';
import { getArkonStoryObjective } from '../src/ui/ArkonStoryObjective.js';

const reg=data=>({
  values:{...data},get(key){return this.values[key]},
  set(key,val){this.values[key]=val},
});
const source={gameMode:'arkonStory',arkonStoryChapter03Seed:564,arkonStoryCustomerJobsDone:0,cash:1000};
test('Third chapter is registered, valid and waits for five distinct cars then MX-5 max',()=>{
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter03,ARKON_CHAPTER_03);
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_03));
  assert.equal(ARKON_CHAPTER_03.steps.at(-1).type,'END');
  assert.deepEqual(ARKON_CHAPTER_03.steps.filter(s=>s.type==='ARKON_CUSTOMER_JOB').map(s=>s.index),[0,1,2,3,4,5]);
  assert.ok(ARKON_CHAPTER_03.steps.some(s=>s.key==='arkonStoryChapter03Done'&&s.value===true));
  assert.ok(ARKON_CHAPTER_03.steps.some(s=>s.type==='ARKON_MX5_RACE'));
  assert.ok(ARKON_CHAPTER_03.steps.some(s=>s.type==='ARKON_MX5_RETURN'));
  assert.ok(!JSON.stringify(ARKON_CHAPTER_03).toLowerCase().includes('daichisakamoto'));
});
test('Customer targets obey actual engine model, and fifth customer owns the Mazda',()=>{
  const jobs=Array.from({length:5},(_,i)=>getArkonCustomerJob(source,i));
  assert.equal(new Set(jobs.slice(0,4).map(x=>x.carId)).size,4);
  assert.equal(jobs[4].carId,'mx5');
  for(const job of jobs){
    assert.ok(job.targetKW>job.stockKW);
    assert.ok(job.targetKW<=job.maxKW);
    assert.ok(job.pay>=25000 && job.pay<=40000);
  }
  assert.equal(jobs.reduce((sum,job)=>sum+job.pay,0),160000);
  const max=getArkonCustomerJob(source,5);
  assert.equal(max.carId,'mx5');
  assert.ok(max.maximum);
  assert.equal(max.targetKW,getArkonCustomerPower('mx5',CANAL_YARD_MAX));
  assert.ok(isArkonCustomerJobComplete(max,CANAL_YARD_MAX));
  assert.ok(!isArkonCustomerJobComplete(max,{engine:1,intake:1}));
});
test('Six work orders are paid once; customer cars never transfer to Arkon',()=>{
  const state=reg({...source,ownedCarIds:['ef']});
  let earned=0;
  for(let i=0;i<6;i++){
    const job=getArkonCustomerJob(state,i);
    assert.equal(recordArkonCustomerJob(state,i),true);
    earned+=job.pay;
    assert.equal(recordArkonCustomerJob(state,i),false);
  }
  assert.equal(state.get('cash'),1000+earned);
  assert.deepEqual(state.get('ownedCarIds'),['ef']);
  assert.equal(state.get('arkonStoryCustomerJobsDone'),6);
});
test('Sayaka home expressions and expanded Arkon expressions exist in Main',()=>{
  for(const pose of ['homeNormal','homeHappy','homeSerious','homeBlushing']){
    const asset=getCharacterVisualAsset('sayakaFujieda',pose);
    assert.match(asset.path,/assets\/Characters\/Main\/home_sayaka_/);
    assert.ok(existsSync(asset.path),asset.path);
  }
  for(const pose of ['storyBlushing','storyCoolShy','storyConfidentSmirk','storyShrugging','storyThinking']){
    const asset=getCharacterVisualAsset('arkonDen',pose);
    assert.ok(existsSync(asset.path),asset.path);
  }
  const mx5=getArkonCustomerJob(source,5);
  assert.ok(existsSync('assets/Cars/stock/mx5_stock_body.png'));
  assert.equal(mx5.carId,'mx5');
});
test('MX-5 temporary loan preserves prior ownership, car state and race configuration',()=>{
  const state=reg({
    gameMode:'arkonStory',arkonStoryChapter02Done:true,
    arkonStoryCustomerJobsDone:6,
    ownedCarIds:['ef','mx5'],
    carStates:{ef:{tuning:{engine:1}},mx5:{tuning:{intake:1}}},
    carGarageLocations:{ef:'shinonomeWorkshop',mx5:'shinonomeWorkshop'},
    selectedCarId:'ef',preferredCarId:'ef',
    selectedRaceCategory:'SINGLE',selectedRaceType:'Standing Start',
  });
  assert.equal(beginArkonMx5GuestRace(state),true);
  assert.equal(state.get('selectedCarId'),'mx5');
  assert.equal(state.get('selectedRaceType'),'Roll Race');
  assert.ok(state.get('arkonStoryMx5Loan')?.active);
  assert.equal(beginArkonMx5GuestRace(state),false);
  assert.equal(finishArkonMx5GuestRace(state),true);
  assert.deepEqual(state.get('ownedCarIds'),['ef','mx5']);
  assert.deepEqual(state.get('carStates').mx5,{tuning:{intake:1}});
  assert.equal(state.get('selectedCarId'),'ef');
  assert.equal(state.get('selectedRaceType'),'Standing Start');
  assert.equal(state.get('arkonStoryMx5Loan'),null);
  const newState=reg({...state.values,ownedCarIds:['ef'],carStates:{ef:{}},
    carGarageLocations:{ef:'shinonomeWorkshop'}});
  assert.equal(beginArkonMx5GuestRace(newState),true);
  assert.equal(finishArkonMx5GuestRace(newState),true);
  assert.deepEqual(newState.get('ownedCarIds'),['ef']);
  assert.ok(!newState.get('carStates').mx5);
});
test('Save isolation and progress are exclusive to Arkon Story',()=>{
  const state=createArkonStoryState(1);
  state.arkonStoryChapter03Done=true;
  state.arkonStoryCustomerJobsDone=6;
  state.arkonStoryChapter03Seed=123;
  state.arkonStoryMx5RaceResult='declined';
  const saved=normaliseState(state);
  assert.equal(saved.arkonStoryChapter03Done,true);
  assert.equal(saved.arkonStoryCustomerJobsDone,6);
  assert.equal(saved.arkonStoryMx5RaceResult,'declined');
  const career=normaliseState({...state,gameMode:'career'});
  assert.equal(career.arkonStoryChapter03Done,false);
  assert.equal(career.arkonStoryCustomerJobsDone,0);
  const objective=getArkonStoryObjective(reg(saved));
  assert.match(objective.heading,/CHAPTER 04 \/\/ THE PRICE OF TRUST/);
});
test('Race and Director use no-stakes real physics with Arkon Story restrictions',()=>{
  const race=readFileSync('src/scenes/RaceScene.js','utf8');
  const director=readFileSync('src/story/StoryDirector.js','utf8');
  assert.match(race,/arkonStoryMx5Loan/);
  assert.match(race,/arkonStoryMx5RaceResult/);
  assert.match(director,/getRegionalChampionshipCount\(registry\)>=1/);
  assert.match(director,/showArkonCustomerTuning/);
  assert.match(director,/finishArkonMx5GuestRace/);
});
