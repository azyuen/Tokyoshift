import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_09} from '../src/data/arkonChapter09.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {startArkonCh9Race,finishArkonCh9Race,recordArkonCh9Refusal,ARKON_CH9_RACES}
  from '../src/data/arkonChapter09Races.js';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const reg=init=>({data:{...init},get(k){return this.data[k]},set(k,v){this.data[k]=v}});
const fixture=()=>reg({gameMode:'arkonStory',firstName:'Arkon',lastName:'Den',playerCharacterId:'arkonDen',
  arkonStoryChapter07Done:true,arkonStoryChapter08Done:true,
  arkonStoryChapter08ContractSigned:true,arkonStoryChapter09Done:false,
  arkonStoryChapter09RacesDone:0,cash:900000,
  ownedCarIds:['arkonLibertyWalk240z'],selectedCarId:'arkonLibertyWalk240z',
  preferredCarId:'arkonLibertyWalk240z',
  arkonStoryChapter08ContractTerms:{project:'Private engineering programme',security:'Warehouse HQ assets',status:'signed'},
  arkonStoryRwbProject:{owner:'sayakaFujieda',roadworthy:true,gifted:true},
});
test('Chapter 09 is an ordered playable script, not Career Chapter 09',()=>{
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_09));
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter09,ARKON_CHAPTER_09);
  assert.deepEqual(ARKON_CHAPTER_09.steps.filter(s=>s.type==='ARKON_CH9_RACE').map(s=>s.index),[0,1]);
  assert.equal(ARKON_CHAPTER_09.steps.filter(s=>s.type==='ARKON_CH9_RETURN').length,2);
  assert.equal(ARKON_CHAPTER_09.steps.filter(s=>s.type==='ARKON_CH9_REFUSE').length,1);
  assert.equal(ARKON_CHAPTER_09.steps.at(-1).type,'END');
  assert.equal(ARKON_CH9_RACES.length,2);
  const dialogue=ARKON_CHAPTER_09.steps.flatMap(s=>s.pages||[]).map(p=>p.text).join(' ');
  assert.match(dialogue,/Porsche/);
  assert.match(dialogue,/Sayaka/);
  assert.doesNotMatch(dialogue,/Yakuza|organised.crime|mafia/i);
});
test('Demonstration races are physical competitions with no automatic fees or payments',()=>{
  const s=fixture(),cash=s.get('cash');
  assert.equal(startArkonCh9Race(s,0),true);
  assert.equal(startArkonCh9Race(s,0),false);
  assert.equal(s.get('cash'),cash);
  assert.equal(s.get('selectedRaceCategory'),'SINGLE');
  assert.equal(s.get('selectedRaceDistanceM'),402.336);
  assert.equal(s.get('selectedOpponentCharacterId'),'renKurosawa');
  s.set('arkonStoryChapter09RaceResult','won');
  assert.equal(finishArkonCh9Race(s),true);
  assert.equal(finishArkonCh9Race(s),false);
  assert.equal(s.get('arkonStoryChapter09RacesDone'),1);
  assert.equal(startArkonCh9Race(s,1),true);
  s.set('arkonStoryChapter09RaceResult','lost');
  assert.equal(finishArkonCh9Race(s),true);
  assert.equal(s.get('arkonStoryChapter09RacesDone'),2);
  assert.equal(s.get('cash'),cash);
  assert.equal(s.get('selectedCarId'),'arkonLibertyWalk240z');
});
test('Arkon must have finished Chapter 08 and signed its contract',()=>{
  const s=fixture();
  s.set('arkonStoryChapter08ContractSigned',false);
  assert.equal(startArkonCh9Race(s,0),false);
  s.set('arkonStoryChapter08ContractSigned',true);
  s.set('gameMode','career');
  assert.equal(startArkonCh9Race(s,0),false);
  s.set('gameMode','arkonStory');
  s.set('arkonStoryChapter08Done',false);
  assert.equal(startArkonCh9Race(s,0),false);
});
test('Refusal is deliberate, once only, and does not confiscate the workshop',()=>{
  const s=fixture();
  assert.equal(recordArkonCh9Refusal(s),false);
  s.set('arkonStoryChapter09RacesDone',2);
  assert.equal(recordArkonCh9Refusal(s),true);
  assert.equal(recordArkonCh9Refusal(s),true);
  assert.equal(s.get('cash'),900000);
  assert.match(s.get('arkonStoryChapter08ContractTerms').status,/disputed/);
  assert.equal(s.get('arkonStoryRwbProject').owner,'sayakaFujieda');
  assert.equal(s.get('arkonStoryChapter09Refused'),true);
  assert.match(s.get('arkonStoryChapter09ExitStatus'),/dispute-unresolved/);
});
test('Chapter 09 race, choices and unresolved fallout survive normalization in Arkon only',()=>{
  const s=fixture();
  assert.equal(startArkonCh9Race(s,0),true);
  s.set('arkonStoryChapter09RaceResult','forfeit');
  s.set('arkonStoryChapter09ResolvedToLeave',true);
  const state=normaliseState({...createDefaultGameState(),...s.data});
  assert.equal(state.arkonStoryChapter09Race.active,true);
  assert.equal(state.arkonStoryChapter09RaceResult,'forfeit');
  assert.equal(state.arkonStoryChapter09ResolvedToLeave,true);
  const career=normaliseState({...createDefaultGameState(),...s.data,gameMode:'career'});
  assert.equal(career.arkonStoryChapter09Race,null);
  assert.equal(career.arkonStoryChapter09RaceResult,null);
  assert.equal(career.arkonStoryChapter09Done,false);
  assert.equal(career.arkonStoryChapter09Refused,false);
});
test('Director, RaceScene, Warehouse objective and sandboxed replay are integrated',()=>{
  assert.match(source('../src/story/StoryDirector.js'),/ARKON_CH9_REFUSE/);
  assert.match(source('../src/story/StoryDirector.js'),/arkonStoryChapter09Race/);
  assert.match(source('../src/ui/ArkonStoryObjective.js'),/BEGIN CHAPTER 09/);
  assert.match(source('../src/scenes/RaceScene.js'),/arkonStoryChapter09RaceResult/);
  assert.match(source('../src/ui/ArkonPlayableReplay.js'),/chapter===9\?'arkonChapter09'/);
  assert.match(source('../src/ui/ArkonStoryArchivePanel.js'),/09  NO WAY OUT/);
  assert.match(source('../src/state/GameState.js'),/arkonStoryChapter09Refused: Boolean\(registry.get/);
});
