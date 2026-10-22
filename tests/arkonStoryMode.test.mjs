import test from 'node:test';
import assert from 'node:assert/strict';
import {ARKON_CHAPTER_01} from '../src/data/arkonChapter01.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {getArkonStoryObjective} from '../src/ui/ArkonStoryObjective.js';
import {getArkonRecountScenes} from '../src/ui/ArkonStoryArchivePanel.js';
import {createArkonStoryState,normaliseState,createDefaultGameState,
  applyStateToRegistry,saveSessionState,setProfileGameMode,getProfileGameMode,
  beginNewProfile,readSessionState,getProfileState,exportProfileBackup,
  importProfileBackup,getActiveProfileIndex,resetArkonStoryState} from '../src/state/GameState.js';

test('Story Director registers the new chapter',()=>{
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter01, ARKON_CHAPTER_01);
});
test('Arkon Chapter 01 validates against Story Director commands',()=>{
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_01));
  assert.ok(ARKON_CHAPTER_01.steps.some(step=>step.type==='CHOICE'));
  assert.ok(ARKON_CHAPTER_01.steps.some(step=>step.type==='WAIT_FLAG' && step.key==='wins'));
});
test('Arkon historical save does not receive endgame dev advantages',()=>{
  const state=createArkonStoryState(1);
  assert.equal(state.gameMode,'arkonStory');
  assert.equal(state.playerCharacterId,'arkonDen');
  assert.equal(state.devMode,false);
  assert.equal(state.cash,5000);
  assert.equal(state.wins,0);
  assert.equal(state.garageTier,0);
  assert.ok(!state.ownedCarIds.includes('magna'));
  assert.equal(state.storyDirectorProgress.ownerSlot,1);
  assert.equal(normaliseState(state).devMode,false);
});

test('Arkon story savings do not overwrite the developer slot',()=>{
  const memory=new Map();
  const writes=[];
  globalThis.localStorage={
    getItem:key=>memory.has(key)?memory.get(key):null,
    setItem:(key,value)=>{writes.push(key);memory.set(key,String(value));},
    removeItem:key=>memory.delete(key),
  };
  const storage=new Map();
  const registry={get:key=>storage.get(key),set:(key,value)=>storage.set(key,value)};
  beginNewProfile(0);
  const career=createDefaultGameState();
  Object.assign(career,{firstName:'Arkon',lastName:'Den',
    playerCharacterId:'arkonDen',devMode:true,cash:1000000000,wins:98});
  applyStateToRegistry(registry,career);
  assert.ok(saveSessionState(registry));
  assert.equal(getProfileGameMode(0),'career');
  const rawCareerSlot = memory.get('tokyoShiftProfilesV1');
  const rawCareerMirror = memory.get('tokyoShiftProfile');
  assert.equal(setProfileGameMode(0,'arkonStory'),true);
  // Selecting story must not touch either normal save namespace.
  assert.equal(memory.get('tokyoShiftProfilesV1'),rawCareerSlot);
  assert.equal(memory.get('tokyoShiftProfile'),rawCareerMirror);
  assert.ok(memory.has('tokyoShiftArkonStorySaveV1:0'));
  const intro=readSessionState();
  assert.equal(intro.cash,5000);
  applyStateToRegistry(registry,intro);
  registry.set('cash',6900);
  const beforeWrites = writes.length;
  assert.ok(saveSessionState(registry));
  assert.deepEqual(writes.slice(beforeWrites).filter(key =>
    ['tokyoShiftProfilesV1','tokyoShiftProfilesV1Backup',
      'tokyoShiftSaveState','tokyoShiftProfile'].includes(key)), []);
  assert.equal(readSessionState().cash,6900);
  assert.equal(memory.get('tokyoShiftProfilesV1'),rawCareerSlot);
  assert.equal(memory.get('tokyoShiftProfile'),rawCareerMirror);
  assert.equal(setProfileGameMode(0,'career'),true);
  assert.equal(readSessionState().cash,1000000000);
  assert.equal(getProfileState(0).wins,98);
  assert.equal(setProfileGameMode(0,'arkonStory'),true);
  assert.equal(readSessionState().cash,6900);
  const backup=exportProfileBackup(0);
  assert.equal(backup.formatVersion,2);
  assert.equal(backup.storyState.cash,6900);
  beginNewProfile(1);
  importProfileBackup(1,backup);
  assert.equal(setProfileGameMode(1,'arkonStory'),true);
  assert.equal(readSessionState().storyDirectorProgress.ownerSlot,getActiveProfileIndex());
});

test('normal drivers cannot enter Arkon story or overwrite its save',()=>{
  const existingStory=globalThis.localStorage.getItem('tokyoShiftArkonStorySaveV1:1');
  // Slot 2: a normal, separate driver with their own career.
  beginNewProfile(2);
  const memory=new Map();
  const registry={get:k=>memory.get(k),set:(k,v)=>memory.set(k,v)};
  const career=createDefaultGameState();
  Object.assign(career,{firstName:'Test',lastName:'Driver',cash:16700,wins:6});
  applyStateToRegistry(registry,career);
  assert.ok(saveSessionState(registry));
  assert.equal(setProfileGameMode(2,'arkonStory'),false);
  assert.equal(getProfileGameMode(2),'career');
  assert.equal(readSessionState().cash,16700);
  assert.equal(globalThis.localStorage.getItem('tokyoShiftArkonStorySaveV1:1'),existingStory);
});

test('all Sayaka encounters use live Meet and canonical sized vehicle artwork',()=>{
  const steps=ARKON_CHAPTER_01.steps;
  const meetScenes=steps.filter(step=>step.privateMeet);
  assert.ok(meetScenes.length>=5);
  for(const step of meetScenes){
    assert.equal(step.backgroundId,'$CURRENT_MEET');
    assert.equal(step.stageMode,'native');
    assert.ok(step.cars.every(car=>car.width>=490 && car.width<=590 && car.carId==='$SELECTED_CAR'));
  }
  assert.equal(steps[30].scene,'MeetScene');
  assert.equal(steps[29].type,'WAIT_FLAG');
  assert.equal(steps[29].atLeast,4);
  assert.ok(steps.some(step=>step.type==='SET_FLAG' &&
    step.key==='arkonStoryChapter01AfterHoursDone' && step.value===true));
});

test('R647 completed story safely resumes at the new beat on the right profile',()=>{
  const legacy=createArkonStoryState(1);
  legacy.arkonStoryChapter01Done=true;
  legacy.storyDirectorProgress=null;
  legacy.wins=5;
  const migrated=normaliseState(legacy);
  assert.equal(migrated.wins,5);
  assert.equal(migrated.storyDirectorProgress.id,'arkonChapter01');
  assert.equal(migrated.storyDirectorProgress.index,29);
  const finish=normaliseState({...migrated,arkonStoryChapter01AfterHoursDone:true,
    storyDirectorProgress:null});
  assert.equal(finish.storyDirectorProgress.index,110);
  const completed=normaliseState({...finish,arkonStoryChapter01FullDone:true,storyDirectorProgress:null});
  assert.equal(completed.storyDirectorProgress,null);
});

test('story objective is spoiler free and absent from normal careers',()=>{
  const make=values=>({get:key=>values[key]});
  assert.equal(getArkonStoryObjective(make({gameMode:'career'})),null);
  const stage=getArkonStoryObjective(make({gameMode:'arkonStory',wins:1}));
  assert.match(stage.progress,/1 \/ 2/);
  const done=getArkonStoryObjective(make({gameMode:'arkonStory',wins:16,
    arkonStoryChapter01FullDone:true}));
  assert.match(done.heading,/COMPLETE/);
});

test('extended chapter adds meaningful dialogue, real racing and choice gates',()=>{
  const steps=ARKON_CHAPTER_01.steps;
  const wins=steps.filter(step=>step.type==='WAIT_FLAG'&&step.key==='wins')
    .map(step=>step.atLeast);
  assert.deepEqual(wins,[2,4,6,8,10,12,14,16]);
  assert.ok(steps.filter(step=>step.type==='CHOICE').length>=5);
  assert.ok(steps.filter(step=>step.type==='MANGA')
    .flatMap(step=>step.pages||[]).length>=90);
  assert.ok(steps.filter(step=>step.type==='WAIT_SCENE').length>=7);
  assert.ok(steps.some(step=>step.type==='SET_FLAG' &&
    step.key==='arkonStoryChapter01FullDone' && step.value===true));
  assert.doesNotThrow(()=>validateStoryScript(steps.length ? ARKON_CHAPTER_01 : null));
});

test('Arkon Story restart resets story only and leaves all Career keys unchanged',()=>{
  const before=getActiveProfileIndex();
  // Start a new test Arkon Story in slot 0, not the ordinary driver slot 2.
  beginNewProfile(0);
  const data=new Map();
  const registry={get:key=>data.get(key),set:(key,val)=>data.set(key,val)};
  applyStateToRegistry(registry,{...createDefaultGameState(),firstName:'Arkon',
    lastName:'Den',playerCharacterId:'arkonDen'});
  assert.ok(saveSessionState(registry));
  assert.ok(setProfileGameMode(0,'arkonStory'));
  applyStateToRegistry(registry,readSessionState());
  registry.set('wins',14);registry.set('cash',99999);
  assert.ok(saveSessionState(registry));
  const careerBefore=globalThis.localStorage.getItem('tokyoShiftProfilesV1');
  const careerMirror=globalThis.localStorage.getItem('tokyoShiftProfile');
  assert.equal(resetArkonStoryState(),true);
  assert.equal(readSessionState().wins,0);
  assert.equal(readSessionState().cash,5000);
  assert.equal(readSessionState().storyDirectorProgress.index,0);
  assert.equal(globalThis.localStorage.getItem('tokyoShiftProfilesV1'),careerBefore);
  assert.equal(globalThis.localStorage.getItem('tokyoShiftProfile'),careerMirror);
  assert.equal(before,2);
});

test('recount previews only witnessed scenes and preserves selected path',()=>{
  const base={gameMode:'arkonStory',arkonStoryFirstChoice:'careful',
    arkonStoryFirstReply:'tease',arkonStoryChoices:{notesApproach:'listen'},
    storyDirectorProgress:{id:'arkonChapter01',index:110,ownerSlot:0,version:1}};
  const reg=values=>({get:key=>values[key]});
  const titles=getArkonRecountScenes(reg(base)).map(step=>step.title);
  assert.ok(titles.includes('A BOLD SUGGESTION'));
  assert.ok(!titles.includes('A STRAIGHT ANSWER'));
  assert.ok(!titles.includes('THE TIMING DESK'));
  assert.ok(getArkonRecountScenes(reg({...base,storyDirectorProgress:{...base.storyDirectorProgress,index:125}}))
    .length>=titles.length);
  assert.deepEqual(getArkonRecountScenes(reg({gameMode:'career'})),[]);
});
