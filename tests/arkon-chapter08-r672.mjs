import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_08} from '../src/data/arkonChapter08.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {startArkonCh8Race,finishArkonCh8Race,recordArkonCh8Contract,ARKON_CH8_RACES}
  from '../src/data/arkonChapter08Races.js';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';
const text=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const reg=v=>({data:{...v},get(k){return this.data[k]},set(k,x){this.data[k]=x}});
function fixture(){
  return reg({gameMode:'arkonStory',firstName:'Arkon',lastName:'Den',playerCharacterId:'arkonDen',
    arkonStoryChapter07Done:true,arkonStoryChapter08Done:false,
    cash:10000000,ownedCarIds:['arkonLibertyWalk240z'],
    selectedCarId:'arkonLibertyWalk240z',preferredCarId:'arkonLibertyWalk240z',
    arkonStoryChapter08RacesDone:0,arkonStoryRwbProject:{owner:'sayakaFujieda',
      gifted:true,roadworthy:true}});
}
test('Chapter 8 is registered as a real ordered three-race script',()=>{
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_08));
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter08,ARKON_CHAPTER_08);
  assert.deepEqual(ARKON_CHAPTER_08.steps.filter(s=>s.type==='ARKON_CH8_RACE').map(s=>s.index),[0,1,2]);
  assert.equal(ARKON_CHAPTER_08.steps.filter(s=>s.type==='ARKON_CH8_RETURN').length,3);
  assert.equal(ARKON_CHAPTER_08.steps.filter(s=>s.type==='ARKON_CH8_CONTRACT').length,1);
  assert.equal(ARKON_CHAPTER_08.steps.filter(s=>s.type==='FADE_STORY_ACTOR'&&s.actorId==='sayakaFujieda').length,1);
  assert.equal(ARKON_CHAPTER_08.steps.at(-1).type,'END');
  assert.equal(ARKON_CH8_RACES.length,3);
  assert.ok(ARKON_CHAPTER_08.steps.some(s=>s.vipParty===true));
  assert.ok(ARKON_CHAPTER_08.steps.some(s=>s.type==='MANGA'&&s.pages.some(p=>p.text.includes('like a d'))));
  assert.ok(ARKON_CHAPTER_08.steps.some(s=>s.type==='MANGA'&&s.pages.some(p=>p.text.includes('Where is the man who refused'))));
});
test('Chapter 8 races are career-isolated and escrow actual cash once',()=>{
  const s=fixture();
  const original=Number(s.get('cash'));
  assert.equal(startArkonCh8Race(s,0),true);
  assert.equal(startArkonCh8Race(s,0),false);
  const ctx=s.get('arkonStoryChapter08Race');
  assert.equal(ctx.stake,120000);
  assert.equal(s.get('cash'),original-120000);
  assert.equal(s.get('selectedRaceDeal'),'STORY');
  s.set('arkonStoryChapter08RaceResult','won');
  assert.equal(finishArkonCh8Race(s),true);
  assert.equal(finishArkonCh8Race(s),false);
  assert.equal(s.get('cash'),original+120000);
  assert.equal(s.get('arkonStoryChapter08RacesDone'),1);
  assert.equal(startArkonCh8Race(s,1),true);
  s.set('arkonStoryChapter08RaceResult','lost');
  assert.equal(finishArkonCh8Race(s),true);
  assert.equal(s.get('cash'),original+120000-300000);
  assert.equal(startArkonCh8Race(s,2),true);
  s.set('arkonStoryChapter08RaceResult','forfeit');
  assert.equal(finishArkonCh8Race(s),true);
  assert.equal(s.get('cash'),original+120000-300000);
  assert.equal(s.get('arkonStoryChapter08RacesDone'),3);
  s.set('gameMode','career');
  assert.equal(startArkonCh8Race(s,0),false);
  assert.equal(recordArkonCh8Contract(s),false);
});
test('Chapter 8 wagers cannot exceed 15% of available cash',()=>{
  const s=fixture();s.set('cash',10000);
  assert.equal(startArkonCh8Race(s,0),true);
  assert.equal(s.get('arkonStoryChapter08Race').stake,1500);
  s.set('arkonStoryChapter08RaceResult','forfeit');
  assert.equal(finishArkonCh8Race(s),true);
  assert.equal(s.get('cash'),10000);
});
test('Shibuya sign-off is committed once, not seized or charged automatically',()=>{
  const s=fixture();
  assert.equal(recordArkonCh8Contract(s),false);
  s.set('arkonStoryChapter08RacesDone',3);
  assert.equal(recordArkonCh8Contract(s),true);
  assert.equal(recordArkonCh8Contract(s),true);
  assert.equal(s.get('cash'),10000000);
  assert.match(s.get('arkonStoryChapter08ContractTerms').security,/Warehouse HQ/);
  assert.equal(s.get('arkonStoryRwbProject').owner,'sayakaFujieda');
});
test('Chapter 7/8 state survives save normalization and never leaks into Career',()=>{
  const s=fixture();
  assert.equal(startArkonCh8Race(s,0),true);
  s.set('arkonStoryChapter08RaceResult','won');
  const st=normaliseState({...createDefaultGameState(),...s.data});
  assert.equal(st.arkonStoryChapter07Done,true);
  assert.equal(st.arkonStoryChapter08Race.active,true);
  assert.equal(st.arkonStoryChapter08RaceResult,'won');
  assert.equal(st.arkonStoryChapter08RacesDone,0);
  const career=normaliseState({...createDefaultGameState(),...s.data,gameMode:'career'});
  assert.equal(career.arkonStoryChapter08Race,null);
  assert.equal(career.arkonStoryChapter08Done,false);
  assert.equal(career.arkonStoryChapter08RaceResult,null);
});
test('Director, Garage, RaceScene and archive have Chapter 8 integration',()=>{
  assert.match(text('../src/story/StoryDirector.js'),/ARKON_CH8_CONTRACT/);
  assert.match(text('../src/ui/ArkonStoryObjective.js'),/BEGIN CHAPTER 08/);
  assert.match(text('../src/scenes/GarageScene.js'),/addArkonStoryObjectiveButton/);
  assert.match(text('../src/scenes/RaceScene.js'),/updateArkonCh8Passenger/);
  assert.match(text('../src/ui/ArkonPlayableReplay.js'),/chapter===8\?'arkonChapter08'/);
  assert.match(text('../src/ui/ArkonStoryArchivePanel.js'),/ARKON_CHAPTER_08/);
  assert.match(text('../src/state/GameState.js'),/arkonStoryChapter08ContractTerms: registry.get/);
  assert.match(text('../src/ui/StoryStage.js'),/vipParty/);
  assert.ok(Number(JSON.parse(text('../version.json')).build.replace(/^R/,''))>=672);
});
