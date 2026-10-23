import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_05} from '../src/data/arkonChapter05.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {CH5_DUEL_GEOMETRY,getChapter05DuelCar,getChapter05DuelActor}
  from '../src/story/Chapter05MeetLayout.js';
import {normaliseState,createDefaultGameState} from '../src/state/GameState.js';
const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const steps=ARKON_CHAPTER_05.steps;
const matches=steps.filter(s=>s.type==='STAGE'&&s.meetDuel);
test('R670 retains whole Chapter 05 progression and races while validating new action',()=>{
 assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_05));
 assert.deepEqual(steps.filter(s=>s.type==='ARKON_CH5_RACE').map(s=>s.index),[0,1,2,3,3]);
 assert.equal(steps.filter(s=>s.type==='ARKON_CH5_RETURN').length,5);
 assert.equal(steps.filter(s=>s.type==='STORY_CAR_EXIT').length,1);
 assert.ok(steps.some(s=>s.type==='FADE_STORY_ACTOR'&&s.actorId==='storyDaigoKirishima'));
 assert.equal(steps.at(-1).type,'END');
});
test('R670 all four meet venues display the two correct cars and 3 arranged cast members',()=>{
 const expected={
 'shinagawaTennozu':['fc3s','reikaTachibana'],
 'daikokuPA':['3000gt','tetsuoMori'],
 'shinjukuGodzilla':['evo5','renKurosawa'],
 'shibuyaDogenzaka':['ae86','storyDaigoKirishima'],
 };
 const visited=new Set();
 for(const stage of matches){
   const venue=stage.backgroundId.match(/^meet:([^:]+):night$/)?.[1];
   if(!venue)continue;
   const [rivalCar,rivalId]=expected[venue];
   if(stage.characters.length===3){
     visited.add(venue);
     assert.deepEqual(stage.characters.map(x=>x.role),['player','companion','challenger']);
     assert.deepEqual(stage.characters.map(x=>x.id).slice(0,2),['arkonDen','sayakaFujieda']);
     assert.equal(stage.characters[2].id,rivalId);
     assert.equal(stage.cars.length,2);
     assert.equal(stage.cars[1].carId,rivalCar);
     assert.equal(stage.cars[0].carId,venue==='shibuyaDogenzaka'?'$SELECTED_CAR':
       ({shinagawaTennozu:'minesR34',daikokuPA:'reAmemiyaRx7',shinjukuGodzilla:'topSecretSupra'})[venue]);
   }
   assert.equal(stage.fadeInMs,780);
 }
 assert.deepEqual([...visited].sort(),Object.keys(expected).sort());
});
test('R670 two Meet cars stay inside standard frame and cannot overlap on centre',()=>{
 const f=CH5_DUEL_GEOMETRY.frame,a=getChapter05DuelCar(0),b=getChapter05DuelCar(1);
 assert.ok(a.targetWidth<500&&b.targetWidth<500); // Earlier single showdown car was 663.
 assert.ok(a.x-a.targetWidth/2>f.x);
 assert.ok(b.x+b.targetWidth/2<f.x+f.w);
 assert.ok(a.x+a.targetWidth/2<b.x-b.targetWidth/2);
 assert.equal(a.flipX,false);assert.equal(b.flipX,true);
 assert.ok(getChapter05DuelActor('player').x<getChapter05DuelActor('companion').x);
 assert.ok(getChapter05DuelActor('companion').x<a.x);
 assert.ok(getChapter05DuelActor('challenger').x>b.x);
});
test('R670 every pre-race encounter allows manual pause after challenging cutscene',()=>{
 for(const index of [0,1,2,3]){
   const pos=steps.findIndex(x=>x.type==='ARKON_CH5_RACE'&&x.index===index);
   assert.ok(pos>0);
   assert.equal(steps[pos-1].type,'HOLD_SCENE');
   assert.ok(steps[pos-1].revealMs>=700);
 }
 for(const name of ['REIKA // THE SHINAGAWA CHALLENGE',
   'TETSUO // THE ENGINE BUILDER','REN // THE SHINJUKU TEST',
   'THE INEVITABLE INTERRUPTION']){
   assert.ok(steps.some(s=>s.type==='MANGA'&&s.title===name),name);
 }
 const ptr=source('../src/ui/StoryContinuePrompt.js');
 assert.match(ptr,/if\(revealDuration\)hit\.disableInteractive\(\)/);
 assert.match(ptr,/displayPrompt\(\)/);
});
test('R670 Daigo blush, fades away and his OWN AE86 reverses before the pair is alone',()=>{
 const i=steps.findIndex(s=>s.type==='STORY_CAR_EXIT');
 assert.ok(i>2);assert.equal(steps[i].slot,1);
 assert.equal(steps[i-1].type,'FADE_STORY_ACTOR');
 assert.equal(steps[i-1].actorId,'storyDaigoKirishima');
 assert.equal(steps[i+1].type,'STAGE');
 assert.equal(steps[i+1].cars.length,1);
 assert.deepEqual(steps[i+1].characters.map(s=>s.id),['arkonDen','sayakaFujieda']);
 assert.equal(steps[i+2].type,'HOLD_SCENE');
 const renderer=source('../src/ui/StoryStage.js');
 assert.match(renderer,/exitCar\(slot=1,duration=3000/);
 assert.match(renderer,/travel\.x\/part\.radius/);
 assert.match(renderer,/duelCar\?\.targetWidth/);
});
test('R670 older story checkpoints migrate exactly once, including a planned rematch',()=>{
 const state={...createDefaultGameState(),gameMode:'arkonStory',
  firstName:'Arkon',lastName:'Den',arkonStoryChapter04Done:true,
  arkonStoryChapter05Done:false,arkonStoryCh5PacingVersion:0};
 for(const [index,result] of [[26,26],[56,56],[57,58],[77,78],[78,80],
    [98,100],[109,111],[110,113],[132,135]]){
   const loaded=normaliseState({...state,storyDirectorProgress:{
     id:'arkonChapter05',index,ownerSlot:0,version:1}});
   assert.equal(loaded.storyDirectorProgress.index,result);
   assert.equal(loaded.arkonStoryCh5PacingVersion,1);
   const reload=normaliseState(loaded);
   assert.equal(reload.storyDirectorProgress.index,result);
 }
});
