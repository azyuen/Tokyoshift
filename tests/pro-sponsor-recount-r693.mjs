import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STORY_CHAPTERS,isStoryChapterComplete } from '../src/data/storyChapters.js';
import { CUTSCENES } from '../src/data/cutscenes.js';
import { getDevCutsceneEntries,ACTIVE_DEV_MICRO_SCENES } from '../src/ui/CutsceneTester.js';
import { beginProSponsorPlayableReplay,finishProSponsorPlayableReplay,
  isProSponsorPlayableReplay } from '../src/ui/ProSponsorReplay.js';
import { saveSessionState,saveManualState } from '../src/state/GameState.js';

const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
class Registry {
 constructor(values){this.values=structuredClone(values);}
 get(k){return this.values[k];}
 set(k,v){this.values[k]=v;}
 remove(k){delete this.values[k];}
 getAll(){return {...this.values};}
}
const profile={
 gameMode:'career',devMode:true,firstName:'Arkon',lastName:'Den',
 cash:900000000,playerCharacterId:'arkonDen',
 selectedCarId:'ae86',preferredCarId:'ae86',
 ownedCarIds:['ae86'],carStates:{ae86:{tuning:{engine:1}}},
 carGarageLocations:{ae86:'shinonomeWarehouseStrip'},
 cutscenesSeen:['chapter09Welcome','proSponsorIntroduction','proSponsorRaceComplete',
   'proSponsorEpilogue'],centralTokyoLocation:'tokyoDragComplex',
 proCircuit:{season:4,seasonStatus:'ACTIVE',calendar:{round:5,history:[]}},
 wins:162,losses:23,
};
const fakeScene=(updates={},key='GarageScene')=>{
 const registry=new Registry({...profile,...updates});
 const starts=[];
 return {registry,starts,sys:{settings:{key}},
   scene:{start:(...args)=>starts.push(args)}};
};
const delay=()=>new Promise(resolve=>setTimeout(resolve,30));

test('the Archive keeps nine canonical chapters, with Aruken completion after signing',()=>{
 assert.equal(STORY_CHAPTERS.length,9);
 assert.match(STORY_CHAPTERS[8].title,/Ginza/i);
 assert.equal(isStoryChapterComplete({cutscenesSeen:['chapter09Welcome']},'chapter09'),false);
 assert.equal(isStoryChapterComplete({cutscenesSeen:['proSponsorEpilogue']},'chapter09'),true);
 const panel=src('src/ui/StoryArchivePanel.js');
 assert.match(panel,/WATCH STORY/);
 assert.match(panel,/RELIVE CHAPTER/);
 assert.match(panel,/beginProSponsorPlayableReplay/);
 assert.match(panel,/proSponsorIntroduction/);
 assert.match(panel,/proSponsorEpilogue/);
});

test('Dev Scenes is only live micro-cinematics plus one complete Chapter 09 route',()=>{
 const entries=getDevCutsceneEntries();
 assert.equal(entries[0].id,'__proSponsorChapter09');
 assert.equal(entries.length,ACTIVE_DEV_MICRO_SCENES.length+1);
 assert.ok(ACTIVE_DEV_MICRO_SCENES.every(id=>Boolean(CUTSCENES[id])));
 assert.equal(entries.filter(e=>e.category==='DEVELOPER / REPLAY').length,1);
 const hidden=['openingStationEncounter','centralTokyoUnlocked','firstRegionalChampion',
   'canalYardBiggerDreams','warehouseHqUnlocked','sevenRegionsConquered',
   'fullCrewTogether','chapter08Ginza','chapter09OldGuard','chapter09Welcome',
   'proSponsorIntroduction','proSponsorEpilogue','dragComplexInvitation',
   'ginzaHeroCarReveal','ginzaInvitation','competitionChampion'];
 for(const id of hidden)assert.equal(entries.some(x=>x.id===id),false,id);
 assert.match(src('src/ui/CutsceneTester.js'),/D\\) SCENES/);
});

test('a previously registered developer can relive the entire race without modifying the live save',async()=>{
 const scene=fakeScene();
 const before=structuredClone(scene.registry.getAll());
 assert.equal(beginProSponsorPlayableReplay(scene,{returnToArchive:true}),true);
 assert.equal(isProSponsorPlayableReplay(scene.registry),true);
 assert.equal(scene.registry.get('__proSponsorReplayPhase'),'welcome');
 assert.equal(scene.registry.get('proCircuit').season,1);
 assert.equal(scene.registry.get('proCircuit').seasonStatus,'ACTIVE');
 assert.equal(scene.registry.get('proCircuit').calendar.round,0);
 assert.equal(scene.registry.get('playerCharacterId'),'renMizuno');
 assert.equal(scene.registry.get('selectedCarId'),'ae86');
 assert.equal(scene.registry.get('cutscenesSeen').includes('proSponsorEpilogue'),false);
 assert.equal(saveSessionState(scene.registry),null);
 assert.equal(saveManualState(scene.registry),null);
 await delay();
 assert.deepEqual(scene.starts[0],['CentralTokyoScene',{locationId:'tokyoDragComplex'}]);
 scene.registry.set('cutscenesSeen',['unrelated-temp-story']);
 scene.registry.set('cash',1);
 scene.registry.set('selectedRaceCategory','PRO_SPONSOR');
 scene.registry.set('testOnlyField','temporary');
 assert.equal(finishProSponsorPlayableReplay(scene),true);
 assert.equal(isProSponsorPlayableReplay(scene.registry),false);
 assert.deepEqual(scene.registry.getAll(),before);
 await delay();
 assert.deepEqual(scene.starts.at(-1),['GarageScene',{crewMode:false,openStoryArchive:true}]);
});

test('the replay is unavailable without a car or in Aruken Story Mode',()=>{
 const noCar=fakeScene({ownedCarIds:[],selectedCarId:null});
 const before=noCar.registry.getAll();
 assert.equal(beginProSponsorPlayableReplay(noCar),false);
 assert.deepEqual(noCar.registry.getAll(),before);
 const story=fakeScene({gameMode:'arkonStory'});
 assert.equal(beginProSponsorPlayableReplay(story),false);
});

test('scene transitions are real and replay exits cleanly after epilogue or race cancellation',()=>{
 const sponsor=src('src/ui/ProSponsorStory.js');
 const central=src('src/scenes/CentralTokyoScene.js');
 const race=src('src/scenes/RaceScene.js');
 const welcome=src('src/ui/Chapter09Story.js');
 assert.match(sponsor,/finishProSponsorPlayableReplay\\(scene\\)/);
 assert.match(sponsor,/__proSponsorReplayPhase/);
 assert.match(central,/startProSponsorReplayWelcome/);
 assert.match(central,/addProSponsorReplayExit/);
 assert.match(race,/addProSponsorReplayExit/);
 assert.match(welcome,/onPreviewComplete/);
 assert.match(src('src/state/GameState.js'),/__proSponsorReplayOwnerSlot/);
});
