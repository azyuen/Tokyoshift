import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_04} from '../src/data/arkonChapter04.js';
import {validateStoryScript,STORY_COMMANDS} from '../src/story/StoryScript.js';
import {getArkonCh4WorkProgress,startArkonCh4Work,recordArkonCh4Race,
  ARKON_CH4_BUILD_PARTS} from '../src/data/arkonChapter04Work.js';
import {normaliseState,createDefaultGameState} from '../src/state/GameState.js';

const src=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const reg=(values={})=>({values,get(k){return this.values[k]},set(k,v){this.values[k]=v}});
const story=()=>reg({gameMode:'arkonStory',arkonStoryChapter03Done:true,
  wins:31,carStates:{'240z':{}},ownedCarIds:['240z']});
const full=()=>({
  tuning:{engine:1,intake:1,ecu:1,turbo:1,intercooler:1},
  drivetrainTuning:{clutch:1,gearbox:1,differential:1,suspension:1},
  chassisTuning:{tyres:1,weightReduction:1},
  exhaustNosTuning:{headers:1,exhaust:1,muffler:1,nosKit:1,nitrousShot:1},
});
test('R667 authored pause is between 240Z setback and Kenji callback, before auction',()=>{
 assert.ok(STORY_COMMANDS.has('ARKON_CH4_WORK'));
 assert.ok(STORY_COMMANDS.has('ARKON_RWB_CONTRACT'));
 assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_04));
 const steps=ARKON_CHAPTER_04.steps;
 const pause=steps.findIndex(x=>x.type==='ARKON_CH4_WORK');
 const phone=steps.findIndex(x=>x.type==='PHONE'&&x.title?.includes('OLD REPORT'));
 const bid=steps.findIndex(x=>x.type==='ARKON_RWB_PURCHASE');
 const contract=steps.findIndex(x=>x.type==='ARKON_RWB_CONTRACT');
 assert.ok(pause>0&&pause<phone&&phone<bid&&contract===bid+1);
 assert.equal(steps[pause-1].value,'chapter04Rebuild');
 assert.equal(steps[phone].callerId,'kenjiOkabe');
 assert.equal(steps[phone].callerName,'KENJI OKABE');
});

test('R667 240Z work goal requires each one of 16 real mechanical parts',()=>{
 const r=story();
 assert.equal(ARKON_CH4_BUILD_PARTS,16);
 assert.equal(startArkonCh4Work(r),true);
 assert.equal(getArkonCh4WorkProgress(r).partsDone,0);
 r.set('carStates',{'240z':full()});
 let p=getArkonCh4WorkProgress(r);
 assert.equal(p.partsDone,16);
 assert.equal(p.ready,false);
 for(let i=0;i<3;i++)
   assert.equal(recordArkonCh4Race(r,{carId:'240z',mode:'SINGLE',deal:'BET',playerWon:true}),true);
 p=getArkonCh4WorkProgress(r);
 assert.equal(p.cashWins,3);assert.equal(p.ready,false);
 assert.equal(recordArkonCh4Race(r,{carId:'240z',mode:'COMPETITION',
   playerWon:true,competitionWon:true}),true);
 assert.equal(getArkonCh4WorkProgress(r).ready,true);
});

test('R667 only genuine 240Z cash wins and completed showdown advance, after pause',()=>{
 const r=story();
 assert.equal(recordArkonCh4Race(r,{carId:'240z',mode:'SINGLE',deal:'BET',playerWon:true}),false);
 startArkonCh4Work(r);
 for(const invalid of [
   {carId:'r32',mode:'SINGLE',deal:'BET',playerWon:true},
   {carId:'240z',mode:'SINGLE',deal:'PINK_SLIP',playerWon:true},
   {carId:'240z',mode:'SINGLE',deal:'BET',playerWon:false},
   {carId:'240z',mode:'COMPETITION',playerWon:true,competitionWon:false},
   {carId:'240z',mode:'OSHIAGE_ELITE',playerWon:true,competitionWon:true},
 ])assert.equal(recordArkonCh4Race(r,invalid),false);
 assert.equal(getArkonCh4WorkProgress(r).cashWins,0);
 assert.equal(getArkonCh4WorkProgress(r).showdownWins,0);
 const career=reg({gameMode:'career',arkonStoryChapter03Done:true});
 assert.equal(startArkonCh4Work(career),false);
});

test('R667 interrupted progression survives save/load with bounded counters',()=>{
 const s={...createDefaultGameState(),firstName:'Arkon',lastName:'Den',
   gameMode:'arkonStory',arkonStoryChapter03Done:true,garageTier:1,
   arkonStoryChapter04Work:{started:true,cashWins:2,showdownWins:1},
   carStates:{'240z':full()}};
 const result=normaliseState(s);
 assert.equal(result.arkonStoryChapter04Work.cashWins,2);
 assert.equal(result.arkonStoryChapter04Work.showdownWins,1);
 const other=normaliseState({...s,gameMode:'career'});
 assert.equal(other.arkonStoryChapter04Work,null);
});

test('R667 anonymous portrait uses contain scaling only for unknown image',()=>{
 const source=src('../src/ui/RaceCoachHud.js');
 assert.match(source,/if\(key===ANONYMOUS_CALLER_TEXTURE\)/);
 assert.match(source,/Math\.min\(\(face\.width-padding\*2\)\/sw,/);
 assert.match(source,/portrait\.setPosition\(face\.x\+/);
 const script=src('../src/data/arkonChapter04.js');
 assert.doesNotMatch(script,/callerName:'INDEPENDENT APPRAISER'/);
 const normal=src('../src/ui/PhoneConversation.js');
 const swipe=src('../src/ui/OpeningPhonePrototype.js');
 assert.match(normal,/ANONYMOUS_CALLER_PATH/);
 assert.match(swipe,/ANONYMOUS_CALLER_PATH/);
});

test('R667 big ¥3m loan acknowledgment is an explicit gated story beat',()=>{
 const contract=src('../src/ui/ArkonRwbContract.js');
 assert.match(contract,/ARKON_RWB_LOAN_AMOUNT/);
 assert.match(contract,/ACKNOWLEDGE THE ¥3,000,000 DEBT/);
 assert.match(contract,/onContinue\?\.\(\)/);
 const director=src('../src/story/StoryDirector.js');
 assert.match(director,/showArkonRwbContract\(scene,/);
 assert.match(director,/getArkonCh4WorkProgress\(scene\.registry\)/);
 assert.match(director,/this\.stop\(\);/);
 assert.match(director,/checkpoint\.id==='arkonChapter04'/);
 const objectives=src('../src/ui/ArkonStoryObjective.js');
 assert.match(objectives,/CONTINUE CHAPTER 04/);
 assert.match(objectives,/L1 PARTS /);
 const race=src('../src/scenes/RaceScene.js');
 assert.match(race,/recordArkonCh4Race\(this\.registry,/);
 assert.match(race,/competitionWon:true/);
});
