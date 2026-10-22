import test from 'node:test';
import assert from 'node:assert/strict';
import {ARKON_CHAPTER_01} from '../src/data/arkonChapter01.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {createArkonStoryState,normaliseState,createDefaultGameState,
  applyStateToRegistry,saveSessionState,setProfileGameMode,getProfileGameMode,
  beginNewProfile,readSessionState,getProfileState,exportProfileBackup,
  importProfileBackup,getActiveProfileIndex} from '../src/state/GameState.js';

test('Story Director registers the new chapter',()=>{
  assert.equal(STORY_DIRECTOR_SCRIPTS.arkonChapter01, ARKON_CHAPTER_01);
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
