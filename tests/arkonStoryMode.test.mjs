import test from 'node:test';
import assert from 'node:assert/strict';
import {ARKON_CHAPTER_01} from '../src/data/arkonChapter01.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {createArkonStoryState,normaliseState,createDefaultGameState,
  applyStateToRegistry,saveSessionState,setProfileGameMode,getProfileGameMode,
  beginNewProfile,readSessionState,getProfileState,exportProfileBackup,
  importProfileBackup,getActiveProfileIndex} from '../src/state/GameState.js';

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
  globalThis.localStorage={
    getItem:key=>memory.has(key)?memory.get(key):null,
    setItem:(key,value)=>memory.set(key,String(value)),
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
  assert.equal(setProfileGameMode(0,'arkonStory'),true);
  const intro=readSessionState();
  assert.equal(intro.cash,5000);
  applyStateToRegistry(registry,intro);
  registry.set('cash',6900);
  assert.ok(saveSessionState(registry));
  assert.equal(readSessionState().cash,6900);
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
