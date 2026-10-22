// R657 — playable Arkon replay, full-sized native staging, rolling cruise and badge.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_02} from '../src/data/arkonChapter02.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {getMeetProgressionActions} from '../src/data/meetProgressionActions.js';
import {
  getArkonPlayableChapters,beginArkonPlayableReplay,endArkonPlayableReplay,
  isArkonPlayableReplay,
} from '../src/ui/ArkonPlayableReplay.js';
import {saveSessionState,createArkonStoryState,normaliseState} from '../src/state/GameState.js';
import {getArkonCustomerJob,recordArkonCustomerJob} from '../src/data/arkonChapter03Jobs.js';

const code=path=>readFileSync(path,'utf8');
const source=(data)=>({get:k=>data[k]});
test('Chapter 02 has a real race-scene cruise and the home workshop uses native geometry',()=>{
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_02));
  assert.equal(STORY_DIRECTOR_SCRIPTS.arkonChapter02.id,'arkonChapter02');
  const steps=ARKON_CHAPTER_02.steps;
  const dock=steps.find(s=>s.type==='STAGE'&&s.backgroundId==='meet:daikokuOpenLot:day');
  assert.equal(dock.stageMode,'native');
  assert.equal(dock.cars[0].carId,'forester');
  assert.equal(dock.cars[0].width,undefined);
  const meet=steps.find(s=>s.type==='STAGE'&&s.backgroundId==='$CURRENT_MEET' &&
    s.characters?.some(a=>a.role==='carMechanic'));
  assert.equal(meet.stageMode,'native');
  const drive=steps.findIndex(s=>s.type==='STORY_CRUISE');
  const home=steps.findIndex(s=>s.type==='STAGE'&&s.backgroundId==='workshop:shinonomeWorkshop:night');
  assert.ok(drive>0&&home>drive);
  assert.equal(steps[drive+1].type,'WAIT_FLAG');
  assert.equal(steps[drive+1].key,'arkonStoryCruiseComplete');
  assert.equal(steps[drive+1].scene,'GarageScene');
  assert.equal(steps[home].stageMode,'native');
  assert.equal(steps[home].cars[0].carId,'$SELECTED_CAR');
  assert.match(code('src/ui/StoryStage.js'),/template.kind==='meet'/);
  assert.match(code('src/ui/StoryStage.js'),/scene.createCarDisplay\(c.model,template.car.x/);
});

test('Story cruise is an opponent-free rolling drive using normal vehicle physics',()=>{
  const script=code('src/story/StoryDirector.js');
  const race=code('src/scenes/RaceScene.js');
  assert.match(script,/selectedRaceCategory:'STORY_CRUISE'/);
  assert.match(script,/selectedRaceType:'Roll Race'/);
  assert.match(race,/this\.isStoryCruise/);
  assert.match(race,/this\.opponentVisual = this\.isTutorial \|\| this\.isStoryCruise/);
  assert.match(race,/this\.updateArkonStoryCruise\(playerT\)/);
  assert.match(race,/endArkonStoryCruise\(/);
  assert.match(race,/!this\.isTutorial && !this\.isStoryCruise\) this\.handleTiming/);
  assert.match(race,/this\.player\.update\(dt, controlState\)/);
});

test('An interrupted drive cannot complete Chapter 02 by accident',()=>{
  const story=createArkonStoryState(0);
  assert.equal(story.arkonStoryCruiseComplete,false);
  assert.equal(normaliseState({...story,arkonStoryCruiseComplete:true}).arkonStoryCruiseComplete,true);
  const director=code('src/story/StoryDirector.js');
  assert.match(director,/wait.condition.key==='arkonStoryCruiseComplete'/);
  assert.match(director,/step.type==='STORY_CRUISE'/);
});

test('Regional crown appears after Chapter 02 only at Odaiba',()=>{
  const base={gameMode:'arkonStory',arkonStoryChapter02Done:false,
    wins:0,regionWins:{},tunerTeamChallenges:{},garageTier:0,crewMembers:{}};
  assert.equal(getMeetProgressionActions(source(base),'ODAIBA').some(a=>a.id==='REGIONAL'),false);
  const unlocked={...base,arkonStoryChapter02Done:true};
  const actions=getMeetProgressionActions(source(unlocked),'ODAIBA');
  assert.equal(actions[0]?.id,'REGIONAL');
  assert.match(actions[0].label,/START REGIONAL CHALLENGE/);
  assert.equal(getMeetProgressionActions(source(unlocked),'SHINAGAWA').some(a=>a.id==='REGIONAL'),false);
  assert.equal(getMeetProgressionActions(source({...unlocked,gameMode:'career'}),'ODAIBA').some(a=>a.id==='REGIONAL'),false);
});

test('Exiting playable Arkon replay returns to the Arkon Office recount, not Career Archive',()=>{
  const garage=code('src/scenes/GarageScene.js');
  const replay=code('src/ui/ArkonPlayableReplay.js');
  assert.match(garage,/showArkonStoryArchivePanel\(this\)/);
  assert.match(replay,/openStoryArchive:true/);
});

test('Full replay chapter choices require their actual earlier story milestones',()=>{
  const data={gameMode:'arkonStory',arkonStoryChapter01RevisedDone:false,
    arkonStoryChapter02Done:false,storyDirectorProgress:null};
  assert.deepEqual(getArkonPlayableChapters(source(data)),[1]);
  assert.deepEqual(getArkonPlayableChapters(source({...data,arkonStoryChapter01RevisedDone:true})),[1,2]);
  assert.deepEqual(getArkonPlayableChapters(source({...data,arkonStoryChapter02Done:true})),[1,2,3]);
  assert.deepEqual(getArkonPlayableChapters(source({...data,gameMode:'career'})),[]);
});

test('Interactive chapter replay restores real save even after simulated payouts or races',async()=>{
  const stored=new Map();
  globalThis.localStorage={
    getItem:k=>stored.get(k)??null,
    setItem:(k,v)=>stored.set(k,String(v)),
    removeItem:k=>stored.delete(k),
  };
  const initial={...createArkonStoryState(0),
    arkonStoryChapter01RevisedDone:true,arkonStoryPhase:'chapter02Complete',
    wins:19,cash:123456,arkonStoryChapter02FishPaid:true};
  const values=new Map(Object.entries(initial));
  const registry={
    get:key=>values.get(key),
    set:(key,value)=>values.set(key,value),
    remove:key=>values.delete(key),
    getAll:()=>Object.fromEntries(values),
  };
  const transitions=[];
  const scene={
    registry,game:{storyDirector:{session:null,stop:()=>true}},
    scene:{start:(name)=>transitions.push(name)},
    sys:{isActive:()=>true},
  };
  assert.equal(beginArkonPlayableReplay(scene,2),true);
  assert.equal(isArkonPlayableReplay(registry),true);
  registry.set('cash',999999);
  registry.set('wins',128);
  assert.equal(saveSessionState(registry),null);
  await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(endArkonPlayableReplay(scene),true);
  assert.equal(registry.get('cash'),123456);
  assert.equal(registry.get('wins'),19);
  assert.equal(registry.get('arkonStoryChapter02FishPaid'),true);
  assert.equal(isArkonPlayableReplay(registry),false);
  assert.equal(saveSessionState(registry),null); // No Story mode selected in this isolated unit fixture.
  await new Promise(resolve=>setTimeout(resolve,5));
  assert.ok(transitions.includes('MeetScene'));
  assert.ok(transitions.includes('GarageScene'));
});


test('Office recount makes full interactive gameplay primary and keeps cinematic-only separate',()=>{
  const ui=code('src/ui/ArkonStoryArchivePanel.js');
  assert.match(ui,/action\(386,'REPLAY CHAPTER \/\/ FULL GAMEPLAY'/);
  assert.match(ui,/action\(452,count\?'WATCH CUTSCENES ONLY'/);
  assert.match(ui,/beginArkonPlayableReplay\(scene,number\)/);
  assert.match(ui,/playArkonStoryRecount\(scene\)/);
  // Text is sized for the 1.6x global readability multiplier, not 20px x 1.6.
  assert.match(ui,/fontSize:'12px',color:'#d5e4ec'/);
  assert.doesNotMatch(ui,/fontSize:'20px',color:'#d5e4ec'/);
});

test('Chapter 03 full replay resets completed customer jobs and lets actual mods earn temporary pay',async()=>{
  const initial={
    ...createArkonStoryState(0),
    gameMode:'arkonStory',
    arkonStoryChapter01RevisedDone:true,
    arkonStoryChapter02Done:true,
    arkonStoryChapter03Done:true,
    arkonStoryCustomerJobsDone:6,
    arkonStoryChapter03Seed:537,
    arkonStoryMx5CustomerTuning:{engine:2,intake:1},
    arkonStoryMx5RaceResult:'won',
    arkonStoryMx5Loan:{active:true},
    cash:182345,
  };
  const values=new Map(Object.entries(initial));
  const registry={
    get:key=>values.get(key),
    set:(key,value)=>values.set(key,value),
    remove:key=>values.delete(key),
    getAll:()=>Object.fromEntries(values),
  };
  const scene={
    registry,game:{storyDirector:{session:null,stop:()=>true}},
    scene:{start(){}},sys:{isActive:()=>true},
  };
  assert.equal(beginArkonPlayableReplay(scene,3),true);
  assert.equal(isArkonPlayableReplay(registry),true);
  assert.equal(registry.get('storyDirectorProgress')?.id,'arkonChapter03');
  assert.equal(registry.get('arkonStoryCustomerJobsDone'),0);
  assert.equal(registry.get('arkonStoryChapter03Done'),false);
  assert.equal(registry.get('arkonStoryMx5CustomerTuning'),null);
  assert.equal(registry.get('arkonStoryMx5RaceResult'),null);
  assert.equal(registry.get('arkonStoryMx5Loan'),null);
  assert.equal(registry.get('arkonStoryChapter03Seed'),537);
  const job=getArkonCustomerJob(registry,0);
  assert.ok(job?.carId && job.pay>=25000);
  assert.equal(recordArkonCustomerJob(registry,0),true);
  assert.equal(registry.get('arkonStoryCustomerJobsDone'),1);
  assert.equal(registry.get('cash'),initial.cash+job.pay);
  assert.equal(endArkonPlayableReplay(scene),true);
  assert.deepEqual(registry.getAll(),initial);
  await new Promise(resolve=>setTimeout(resolve,5));
});
