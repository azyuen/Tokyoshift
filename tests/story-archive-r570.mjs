import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import { STORY_CHAPTERS,availableStoryChapters,isStoryChapterComplete } from '../src/data/storyChapters.js';
import { beginStoryArchiveSceneReplay,endStoryArchiveSceneReplay,isStoryArchiveSceneReplay } from '../src/ui/StoryReplaySession.js';
import { startInteractiveChapter08Replay,finishInteractiveChapter08Replay,isChapter08DevReplay } from '../src/ui/Chapter08DevReplay.js';
import { saveSessionState, saveManualState } from '../src/state/GameState.js';
class FakeRegistry {
  constructor(values={}){this.values=structuredClone(values);}
  get(k){return this.values[k];}
  set(k,v){this.values[k]=v;return this;}
  remove(k){delete this.values[k];return this;}
  getAll(){return {...this.values};}
}
const seen=['openingDaichiAfterSayaka','centralTokyoUnlocked','firstRegionalChampion',
  'canalYardBiggerDreams','warehouseHqUnlocked','sevenRegionsConquered',
  'fullCrewTogether','chapter08Ginza','chapter08RaceFinished'];
const profile={
  devMode:false,cutscenesSeen:seen,openingChapter:null,playerCharacterId:'renMizuno',
  firstName:'Young',lastName:'Driver',selectedCarId:'ae86',preferredCarId:'ae86',
  ownedCarIds:['ae86'],garageTier:2,crewSpaceActive:false,
  workshopLocationId:'shinonomeWarehouseStrip',
  carGarageLocations:{ae86:'shinonomeWarehouseStrip'},
  carStates:{ae86:{tuning:{engine:1}}},cash:12345,wins:88,losses:9,
  centralTokyoLocation:'tokyoAutoMarket',selectedRaceCategory:'SINGLE',
};
const afterTap=()=>new Promise(resolve=>setTimeout(resolve,10));
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function fakeScene(extra={},key='GarageScene'){
  const registry=new FakeRegistry({...profile,...extra});
  const starts=[];
  return {registry,starts,scene:{start:(...args)=>starts.push(args)},
    sys:{settings:{key}}};
}
test('exactly eight public chapters, no micro cutscenes, and chapter-spoiler locks',()=>{
  assert.equal(STORY_CHAPTERS.length,8);
  assert.deepEqual(STORY_CHAPTERS.map(x=>x.id),Array.from({length:8},(_,i)=>'chapter0'+(i+1)));
  assert.equal(availableStoryChapters(new FakeRegistry({
    cutscenesSeen:['openingDaichiAfterSayaka','centralTokyoUnlocked'],
    openingChapter:null,
  })).filter(x=>x.completed).length,2);
  for(const chapter of STORY_CHAPTERS)assert.ok(isStoryChapterComplete(new FakeRegistry(profile),chapter.id),chapter.id);
  assert.equal(isStoryChapterComplete(new FakeRegistry(profile),'specialChallengerIntroduction'),false);
  assert.match(source('src/ui/StoryArchivePanel.js'),/\?chapter.title.toUpperCase\(\):'\?\?\?'/);
});
test('Chapter 01–07 replay uses real workshop/crew staging and restores player exact registry',async()=>{
  for(const id of STORY_CHAPTERS.slice(0,7).map(c=>c.id)){
    const scene=fakeScene();
    const before=structuredClone(scene.registry.getAll());
    assert.equal(beginStoryArchiveSceneReplay(scene,id,{skipMagazine:true}),true,id);
    assert.equal(isStoryArchiveSceneReplay(scene.registry),true,id);
    assert.equal(saveSessionState(scene.registry),null);
    assert.equal(saveManualState(scene.registry),null);
    assert.equal(scene.starts.length,0,'scene cannot restart inside pointerdown');
    await afterTap();
    if(id==='chapter07')assert.equal(scene.starts[0][1].crewMode,true);
    if(id==='chapter04')assert.equal(scene.starts[0][1].workshopLocationId,'shinonomeCanalYard');
    if(['chapter05','chapter06','chapter07'].includes(id))
      assert.equal(scene.starts[0][1].workshopLocationId,'shinonomeWarehouseStrip');
    scene.registry.set('cash',99999);
    scene.registry.set('cutscenesSeen',['temp-flag']);
    scene.registry.set('temporaryRaceState',{started:true});
    assert.equal(endStoryArchiveSceneReplay(scene),true,id);
    assert.equal(isStoryArchiveSceneReplay(scene.registry),false);
    assert.deepEqual(scene.registry.getAll(),before,id);
    await afterTap();
    assert.deepEqual(scene.starts.at(-1),['GarageScene',{crewMode:false,openStoryArchive:true}]);
  }
});
test('uncompleted chapters cannot be replayed by a player but can be tested by Arkon Den',async()=>{
  const newPlayer=fakeScene({cutscenesSeen:[],wins:0,garageTier:0,openingChapter:'station'});
  const original=structuredClone(newPlayer.registry.getAll());
  assert.equal(beginStoryArchiveSceneReplay(newPlayer,'chapter07'),false);
  assert.deepEqual(newPlayer.registry.getAll(),original);
  const dev=fakeScene({devMode:true,cutscenesSeen:[],wins:0});
  assert.equal(beginStoryArchiveSceneReplay(dev,'chapter07'),true);
  await afterTap();
  assert.equal(endStoryArchiveSceneReplay(dev),true);
  await afterTap();
});
test('completed chapter 08 replay is available to non-dev player, no career writes',async()=>{
  const scene=fakeScene();
  const before=structuredClone(scene.registry.getAll());
  assert.equal(startInteractiveChapter08Replay(scene,{
    allowPlayer:true,returnToOffice:true,skipRace:true,
  }),true);
  assert.equal(isChapter08DevReplay(scene.registry),true);
  assert.equal(scene.registry.get('__chapter08ReplaySkipRace'),true);
  assert.equal(saveSessionState(scene.registry),null);
  assert.equal(saveManualState(scene.registry),null);
  await afterTap();
  assert.equal(finishInteractiveChapter08Replay(scene),true);
  assert.deepEqual(scene.registry.getAll(),before);
  await afterTap();
  assert.deepEqual(scene.starts.at(-1),['GarageScene',{crewMode:false,openStoryArchive:true}]);
});
test('Chapter 8 cannot reveal spoiler on a non-dev profile before completion',()=>{
  const scene=fakeScene({cutscenesSeen:[],garageTier:0,openingChapter:'station',wins:0});
  assert.equal(startInteractiveChapter08Replay(scene,{allowPlayer:true}),false);
  assert.equal(scene.starts.length,0);
});
test('chapter replays reuse phone, magazine, rivals and crew interactions',()=>{
  const play=source('src/ui/StoryArchivePlayback.js');
  assert.match(play,/playCanalYardStory\(/);
  assert.match(play,/showMagazinePanel\(/);
  assert.match(play,/playSevenRegionsStory/);
  assert.match(play,/playFullCrewStory/);
  assert.match(play,/getFirstRegionalChampionRegion/);
  const garage=source('src/scenes/GarageScene.js');
  assert.match(garage,/storyArchiveChapter/);
  assert.match(garage,/showStoryArchivePanel\(this\)/);
  const tester=source('src/ui/CutsceneTester.js');
  assert.match(tester,/beginStoryArchiveSceneReplay\(scene,STORY_REPLAY_IDS\[id\]\)/);
  assert.match(tester,/smallerScenes = CUTSCENE_ORDER/);
  const office=source('src/ui/OfficePanel.js');
  assert.match(office,/STORY ARCHIVE/);
  const chapter08=source('src/ui/Chapter08Story.js');
  assert.match(chapter08,/__chapter08ReplaySkipRace/);
});
