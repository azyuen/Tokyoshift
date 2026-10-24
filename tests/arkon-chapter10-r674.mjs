import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {ARKON_CHAPTER_10} from '../src/data/arkonChapter10.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {
  ARKON_CH10_PROJECTS,settleArkonCh10Dispute,recordArkonCh10Project,
  startArkonCh10Race,finishArkonCh10Race,openArkonCh10Ginza,
  recordArkonCh10Investment,prepareArkonCh10Yokohama,
} from '../src/data/arkonChapter10Work.js';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';
import {getArkonStoryObjective} from '../src/ui/ArkonStoryObjective.js';
import {getArkonPlayableChapters} from '../src/ui/ArkonPlayableReplay.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const reg=init=>({data:{...init},get(k){return this.data[k]},
  set(k,v){this.data[k]=v},getAll(){return this.data;}});
const fixture=()=>reg({
  gameMode:'arkonStory',firstName:'Arkon',lastName:'Den',playerCharacterId:'arkonDen',
  arkonStoryChapter09Done:true,arkonStoryChapter09Refused:true,
  arkonStoryChapter09ExitStatus:'declined-signoff; advisers-consulted; dispute-unresolved',
  arkonStoryChapter08ContractTerms:{status:'performance/sign-off disputed; no property transfer'},
  arkonStoryChapter10Done:false,arkonStoryChapter10ProjectsDone:0,
  arkonStoryChapter10FeesEarned:0,
  cash:800000,ownedCarIds:['arkonLibertyWalk240z'],
  selectedCarId:'arkonLibertyWalk240z',preferredCarId:'arkonLibertyWalk240z',
  arkonStoryRwbProject:{carId:'rwbStellaPorsche',gifted:true,
    owner:'sayakaFujieda',roadworthy:true},
  workshopLocationId:'shinonomeWarehouseStrip',
});
test('Chapter 10 script and register terminate with a completed story',()=>{
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_10));
  // A cache-busted registration import can be an independent module instance.
  // Compare the actual declarative chapter data instead of its object address.
  assert.deepEqual(JSON.parse(JSON.stringify(STORY_DIRECTOR_SCRIPTS.arkonChapter10)),
    JSON.parse(JSON.stringify(ARKON_CHAPTER_10)));
  assert.deepEqual(ARKON_CHAPTER_10.steps.filter(s=>s.type==='ARKON_CH10_RESTORE')
    .map(s=>s.index),[0,1,2]);
  assert.equal(ARKON_CHAPTER_10.steps.filter(s=>s.type==='ARKON_CH10_RACE').length,1);
  assert.equal(ARKON_CHAPTER_10.steps.filter(s=>s.type==='ARKON_CH10_FINALE').length,1);
  assert.equal(ARKON_CHAPTER_10.steps.at(-1).type,'END');
  const text=ARKON_CHAPTER_10.steps.flatMap(s=>s.pages||[]).map(x=>x.text).join(' ');
  assert.match(text,/Daichi/);
  assert.match(text,/family friends/i);
  assert.match(text,/Ginza/);
  assert.doesNotMatch(text,/Yakuza|mafia|former racing father|father.*race/i);
});
test('The disputed contract is settled once, with paid costs and Warehouse HQ retained',()=>{
  const s=fixture();
  assert.equal(settleArkonCh10Dispute(s),true);
  const after=s.get('cash');
  assert.equal(after,500000);
  assert.equal(settleArkonCh10Dispute(s),true);
  assert.equal(s.get('cash'),after);
  assert.equal(s.get('arkonStoryChapter10Settlement').workshop,'retained');
  s.set('gameMode','career');
  assert.equal(settleArkonCh10Dispute(s),false);
});
test('Three verified customer commissions earn fees once, no customer car ownership',()=>{
  const s=fixture(),owned=[...s.get('ownedCarIds')];
  assert.equal(ARKON_CH10_PROJECTS.length,3);
  assert.equal(recordArkonCh10Project(s,2),false);
  for(let i=0;i<3;i++){
    assert.equal(recordArkonCh10Project(s,i),true);
    assert.equal(recordArkonCh10Project(s,i),false);
  }
  assert.equal(s.get('arkonStoryChapter10ProjectsDone'),3);
  assert.equal(s.get('arkonStoryChapter10FeesEarned'),530000);
  assert.deepEqual(s.get('ownedCarIds'),owned);
});
test('One friendly race uses normal physics and keeps outcome, money, and prior settings',()=>{
  const s=fixture();
  assert.equal(startArkonCh10Race(s),false);
  assert.equal(recordArkonCh10Project(s,0),true);
  assert.equal(recordArkonCh10Project(s,1),true);
  const cash=s.get('cash');
  s.set('selectedRaceType','PREVIOUS_TYPE');
  assert.equal(startArkonCh10Race(s),true);
  assert.equal(startArkonCh10Race(s),false);
  assert.equal(s.get('selectedRaceDeal'),'STORY');
  assert.equal(s.get('selectedRaceStake'),0);
  assert.equal(s.get('selectedOpponentCarId'),'gc8');
  s.set('arkonStoryChapter10RaceResult','lost');
  assert.equal(finishArkonCh10Race(s),true);
  assert.equal(s.get('selectedRaceType'),'PREVIOUS_TYPE');
  assert.equal(s.get('cash'),cash);
  assert.equal(s.get('arkonStoryChapter10RaceOutcome'),'lost');
  assert.equal(startArkonCh10Race(s),false);
});
test('Ginza partnership, quiet investment, and Yokohama story closure are ordered',()=>{
  const s=fixture();
  recordArkonCh10Project(s,0);
  recordArkonCh10Project(s,1);
  startArkonCh10Race(s);
  s.set('arkonStoryChapter10RaceResult','won');
  assert.equal(finishArkonCh10Race(s),true);
  recordArkonCh10Project(s,2);
  assert.equal(openArkonCh10Ginza(s),true);
  const business=s.get('arkonStoryGinzaPartnership');
  assert.deepEqual(business.shares,{arkonDen:50,sayakaFujieda:50});
  assert.equal(business.curator,'sayakaFujieda');
  assert.equal(s.get('arkonStoryGinzaUnlocked'),true);
  assert.equal(recordArkonCh10Investment(s),true);
  assert.equal(s.get('arkonStoryCareerSeed').relationship,'sayaka-family-friend');
  assert.equal(s.get('arkonStoryCareerSeed').noRaceManipulation,true);
  assert.equal(prepareArkonCh10Yokohama(s),true);
  assert.equal(s.get('meetLocation'),'yokohamaMinatoMirai');
  assert.equal(s.get('arkonStoryTimeOfDay'),'night');
  assert.equal(s.get('arkonStoryRwbProject').owner,'sayakaFujieda');
  assert.equal(s.get('ownedCarIds').includes('rwbStellaPorsche'),false);
});
test('Profile saves retain Chapter 10 while Career has none of these story flags',()=>{
  const s=fixture();
  recordArkonCh10Project(s,0);
  const normal=normaliseState({...createDefaultGameState(),...s.data});
  assert.equal(normal.arkonStoryChapter10ProjectsDone,1);
  assert.equal(normal.arkonStoryChapter09Done,true);
  const career=normaliseState({...createDefaultGameState(),...s.data,gameMode:'career'});
  assert.equal(career.arkonStoryChapter10ProjectsDone,0);
  assert.equal(career.arkonStoryGinzaPartnership,null);
  assert.equal(career.arkonStoryCareerSeed,null);
  assert.equal(career.arkonStoryChapter10Done,false);
});
test('Objective/replay, renderer and final art are all wired',()=>{
  const s=fixture();
  assert.equal(getArkonStoryObjective(s).canStartChapter10,true);
  assert.ok(getArkonPlayableChapters(s).includes(10));
  assert.match(source('../src/story/StoryDirector.js'),/ARKON_CH10_FINALE/);
  assert.match(source('../src/story/StoryDirector.js'),/ARKON_CH10_RESTORE/);
  assert.match(source('../src/ui/ArkonStoryArchivePanel.js'),/10  THE ROAD AHEAD/);
  assert.match(source('../src/ui/ArkonPlayableReplay.js'),/chapter===10/);
  assert.match(source('../src/scenes/RaceScene.js'),/arkonStoryChapter10RaceResult/);
  assert.match(source('../src/ui/StoryStage.js'),/yokohamaFinale/);
  assert.match(source('../src/ui/ArkonChapter10Finale.js'),
    /assets\/Characters\/Main\/arkon_sayaka_holdinghands\.png/);
  assert.ok(existsSync(new URL('../assets/Characters/Main/arkon_sayaka_holdinghands.png',
    import.meta.url)));
  assert.doesNotMatch(source('../src/data/ginzaBanter.js'),/arkonStoryChapter10/);
});
