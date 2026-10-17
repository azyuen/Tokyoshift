import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {
  isChapter08DevReplay,
  startInteractiveChapter08Replay,
  finishInteractiveChapter08Replay,
} from '../src/ui/Chapter08DevReplay.js';
import {saveSessionState, saveManualState} from '../src/state/GameState.js';

class FakeRegistry {
  constructor(values={}) {this.values=structuredClone(values);}
  get(key){return this.values[key];}
  set(key,value){this.values[key]=value;return this;}
  remove(key){delete this.values[key];return this;}
  getAll(){return {...this.values};}
}
const carState = {
  devMode:true,selectedCarId:'ae86',preferredCarId:'ae86',
  ownedCarIds:['ae86'],garageTier:0,workshopLocationId:'shinonomeWorkshop',
  carGarageLocations:{ae86:'shinonomeWorkshop'},cash:123456,
  cutscenesSeen:['chapter08Ginza','chapter08RaceFinished'],wins:72,losses:6,
  crewSpaceActive:false,centralTokyoLocation:'tokyoAutoMarket',
  carStates:{ae86:{tuning:{engine:2}}},firstName:'Arkon',lastName:'Den',
  selectedRaceCategory:'SINGLE',selectedRaceDeal:'BET',
};
function fakeScene(values=carState,key='MeetScene'){
  const starts=[];
  const registry=new FakeRegistry(values);
  return {registry,sys:{settings:{key}},scene:{start:(...args)=>starts.push(args)},starts};
}
const src=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('dev replay starts at real Warehouse even with completed Chapter 08 flags',()=>{
  const scene=fakeScene();
  const before=structuredClone(scene.registry.getAll());
  assert.equal(startInteractiveChapter08Replay(scene),true);
  assert.equal(isChapter08DevReplay(scene.registry),true);
  assert.equal(scene.registry.get('workshopLocationId'),'shinonomeWarehouseStrip');
  assert.equal(scene.registry.get('garageTier'),2);
  assert.equal(scene.registry.get('carGarageLocations').ae86,'shinonomeWarehouseStrip');
  assert.deepEqual(scene.starts[0],['GarageScene',{workshopLocationId:'shinonomeWarehouseStrip',crewMode:false}]);
  assert.equal(saveSessionState(scene.registry),null);
  assert.equal(saveManualState(scene.registry),null);
  scene.registry.set('selectedRaceCategory','CHAPTER08');
  scene.registry.set('selectedRaceDeal','CHAPTER08_STORY');
  scene.registry.set('cash',7777777);
  scene.registry.set('cutscenesSeen',['fake-replay-flag']);
  scene.registry.set('temporaryKey','should disappear');
  assert.equal(finishInteractiveChapter08Replay(scene),true);
  assert.equal(isChapter08DevReplay(scene.registry),false);
  assert.deepEqual(scene.registry.getAll(),before);
  assert.deepEqual(scene.starts[1],['MeetScene']);
});

test('returns to original Central Tokyo room after restoring state',()=>{
  const scene=fakeScene({...carState,centralTokyoLocation:'tokyoDragComplex'},'CentralTokyoScene');
  assert.ok(startInteractiveChapter08Replay(scene));
  assert.ok(finishInteractiveChapter08Replay(scene));
  assert.deepEqual(scene.starts.at(-1),['CentralTokyoScene',{locationId:'tokyoDragComplex'}]);
});

test('no dev flag or driveable personal car means no rehearsal and no mutation',()=>{
  for(const changes of [{devMode:false},{ownedCarIds:[],selectedCarId:null}]) {
    const scene=fakeScene({...carState,...changes});
    const before=structuredClone(scene.registry.getAll());
    assert.equal(startInteractiveChapter08Replay(scene),false);
    assert.deepEqual(scene.registry.getAll(),before);
    assert.equal(scene.starts.length,0);
  }
});

test('Chapter 8 interaction routing uses normal scenes and skips once flags in rehearsal',()=>{
  const story=src('src/ui/Chapter08Story.js');
  const garage=src('src/scenes/GarageScene.js');
  const race=src('src/scenes/RaceScene.js');
  const central=src('src/scenes/CentralTokyoScene.js');
  const map=src('src/ui/TravelMap.js');
  const tester=src('src/ui/CutsceneTester.js');
  assert.match(tester,/FULL INTERACTIVE REPLAY/);
  assert.match(tester,/DIALOGUE PREVIEW/);
  assert.match(story,/preview: preview \|\| interactiveReplay/);
  assert.match(story,/onExit: isChapter08DevReplay/);
  assert.match(story,/finishInteractiveChapter08Replay\(scene\)/);
  assert.match(garage,/if \(isChapter08DevReplay\(this.registry\)\)/);
  assert.match(race,/if \(!isChapter08DevReplay\(this.registry\)\)/);
  assert.match(race,/CHAPTER08'[\s\S]*?EXIT REPLAY/);
  assert.match(central,/isChapter08DevReplay\(this.registry\)/);
  assert.match(map,/typeof onExit === 'function'/);
});

test('replay deliberately bypasses saves without changing normal save handling',()=>{
  const text=src('src/state/GameState.js');
  assert.match(text,/export function saveSessionState\(registry\)[\s\S]*?__chapter08DevReplay/);
  assert.match(text,/export function saveManualState\(registry\)[\s\S]*?__chapter08DevReplay/);
  const replay=src('src/ui/Chapter08DevReplay.js');
  assert.match(replay,/structuredClone\(values\)/);
  assert.match(replay,/sessions\.delete\(registry\)/);
  assert.match(replay,/registry\.remove\?\.\(SESSION_KEY\)/);
});
