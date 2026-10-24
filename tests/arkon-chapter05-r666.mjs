import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_05} from '../src/data/arkonChapter05.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {ARKON_CH5_COMMISSIONS,startArkonCh5TestRace,finishArkonCh5TestRace}
  from '../src/data/arkonChapter05Races.js';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';

const src=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const registry=(data={})=>({data,get(k){return this.data[k]},set(k,v){this.data[k]=v}});

test('R666 Chapter 05 script validates and registers as a separate Arkon-only chapter',()=>{
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_05));
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter05,ARKON_CHAPTER_05);
  assert.equal(ARKON_CHAPTER_05.steps.at(-1).type,'END');
  assert.ok(ARKON_CHAPTER_05.steps.some(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryChapter05Done'));
  assert.deepEqual(ARKON_CHAPTER_05.steps.filter(s=>s.type==='ARKON_CH5_RACE')
    .map(s=>s.index),[0,1,2,3,3]);
  assert.ok(ARKON_CHAPTER_05.steps.filter(s=>s.type==='ARKON_CH5_RETURN').length===5);
  assert.ok(ARKON_CHAPTER_05.steps.filter(s=>s.type==='HOLD_SCENE').length>=10);
  assert.ok(ARKON_CHAPTER_05.steps.some(s=>s.type==='MANGA'&&
    s.pages?.some(p=>p.text.includes('fastest couple in Tokyo'))));
});

test('R666 Daigo Kirishima is the existing non-wealthy recurring admirer with his AE86',()=>{
  assert.equal(ARKON_CH5_COMMISSIONS[3].opponentId,'storyDaigoKirishima');
  assert.equal(ARKON_CH5_COMMISSIONS[3].opponentCarId,'ae86');
  assert.equal(ARKON_CH5_COMMISSIONS[3].fee,0);
  const text=src('../src/data/arkonChapter05.js');
  assert.match(text,/Same AE86 as always/);
  assert.doesNotMatch(text,/Daigo.*wealthy|wealthy.*Daigo/);
});

test('R666 three client loans remain temporary, pay labour exactly once, no stake or records',()=>{
  const initial={gameMode:'arkonStory',arkonStoryChapter04Done:true,
    arkonStoryChapter05Done:false,arkonStoryChapter05JobsDone:0,
    cash:12000,selectedCarId:'240z',preferredCarId:'240z',
    ownedCarIds:['240z','rwbStellaPorsche'],
    carStates:{'240z':{},rwbStellaPorsche:{roadworthy:false,immutable:true}},
    carGarageLocations:{'240z':'shinonomeCanalYard',
      rwbStellaPorsche:'shinonomeCanalYard'}};
  const s=registry({...initial});
  let fees=0;
  for(let i=0;i<3;i++){
    const job=ARKON_CH5_COMMISSIONS[i];
    assert.equal(startArkonCh5TestRace(s,i),true);
    assert.equal(s.get('selectedCarId'),job.carId);
    assert.equal(s.get('selectedOpponentCarId'),job.opponentCarId);
    assert.equal(s.get('selectedRaceStake'),0);
    assert.equal(s.get('selectedRaceDeal'),'BET');
    assert.equal(startArkonCh5TestRace(s,i),false);
    assert.ok(s.get('ownedCarIds').includes(job.carId));
    s.set('arkonStoryChapter05RaceResult',i===1?'lost':'won');
    assert.equal(finishArkonCh5TestRace(s),true);
    assert.equal(finishArkonCh5TestRace(s),false);
    assert.equal(s.get('arkonStoryChapter05JobsDone'),i+1);
    assert.equal(s.get('selectedCarId'),'240z');
    assert.ok(!s.get('ownedCarIds').includes(job.carId));
    assert.equal(s.get('carStates')[job.carId],undefined);
    assert.ok(s.get('ownedCarIds').includes('rwbStellaPorsche'));
    assert.equal(s.get('carStates').rwbStellaPorsche.roadworthy,false);
    fees+=job.fee;
    assert.equal(s.get('cash'),12000+fees);
  }
  assert.equal(fees,1830000);
  assert.equal(startArkonCh5TestRace(s,3),true);
  assert.equal(s.get('selectedCarId'),'240z');
  assert.equal(s.get('selectedOpponentCarId'),'ae86');
  s.set('arkonStoryChapter05RaceResult','forfeit');
  assert.equal(finishArkonCh5TestRace(s),true);
  assert.equal(s.get('cash'),12000+fees);
  assert.equal(startArkonCh5TestRace(s,3),true); // Fair rematch if defeated/forfeit.
  s.set('arkonStoryChapter05RaceResult','won');
  assert.equal(finishArkonCh5TestRace(s),true);
  assert.equal(s.get('arkonStoryChapter05Results')[3],'won');
});

test('R666 Chapter 05 race is restricted to Arkon Story and a completed Chapter 04',()=>{
  const s=registry({gameMode:'career',arkonStoryChapter04Done:true,
    cash:10000,ownedCarIds:['240z'],selectedCarId:'240z'});
  assert.equal(startArkonCh5TestRace(s,0),false);
  s.set('gameMode','arkonStory');
  s.set('arkonStoryChapter04Done',false);
  assert.equal(startArkonCh5TestRace(s,0),false);
  assert.equal(finishArkonCh5TestRace(s),false);
});

test('R666 Chapter 05 save fields survive normalisation only in Arkon mode',()=>{
  const base={...createDefaultGameState(),gameMode:'arkonStory',
    firstName:'Arkon',lastName:'Den',
    arkonStoryChapter04Done:true,arkonStoryChapter05Done:true,
    arkonStoryChapter05JobsDone:3,
    arkonStoryChapter05RaceResult:'won',
    arkonStoryChapter05Results:{0:'won',1:'lost',2:'won',3:'won'}};
  const story=normaliseState(base);
  assert.equal(story.arkonStoryChapter05Done,true);
  assert.equal(story.arkonStoryChapter05JobsDone,3);
  assert.equal(story.arkonStoryChapter05Results[1],'lost');
  const other=normaliseState({...base,gameMode:'career'});
  assert.equal(other.arkonStoryChapter05Done,false);
  assert.equal(other.arkonStoryChapter05JobsDone,0);
});

test('R666 real racing shows Sayaka in-car, observes results, and preserves normal Career',()=>{
  const director=src('../src/story/StoryDirector.js');
  const race=src('../src/scenes/RaceScene.js');
  const objective=src('../src/ui/ArkonStoryObjective.js');
  const archive=src('../src/ui/ArkonStoryArchivePanel.js');
  assert.match(director,/ARKON_CH5_RACE/);
  assert.match(director,/ARKON_CH5_RETURN/);
  assert.match(race,/setupArkonCh5Passenger\(/);
  assert.match(race,/updateArkonCh5Passenger\(/);
  assert.match(race,/arkonStoryChapter05RaceResult/);
  assert.match(objective,/BEGIN CHAPTER 05/);
  assert.match(archive,/ARKON_CHAPTER_05/);
  assert.match(src('../src/ui/ArkonPlayableReplay.js'),/chapter===5\?'arkonChapter05'/);
});
