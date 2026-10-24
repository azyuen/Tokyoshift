import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {ARKON_CHAPTER_07,getArkonCh7FirstTunerManga} from '../src/data/arkonChapter07.js';
import {ch7Progress,CH7_RACES,startArkonCh7Work,recordArkonCh7Job,
  recordArkonCh7TunerVisit,claimArkonCh7FirstVisitScene,
  canArkonCh7BuyStoryParts} from '../src/data/arkonChapter07Progress.js';
import {isTunerShopUnlocked,getTunerShopUnlockLabel} from '../src/data/tunerShops.js';
import {canInstallTuningLevel,getTuningRequirementLabel} from '../src/data/workshopProgression.js';
import {characters} from '../src/data/characters.js';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const reg=(data={})=>({data,get(key){return this.data[key]},set(key,value){this.data[key]=value}});
const fixture=(data={})=>reg({gameMode:'arkonStory',devMode:true,
  arkonStoryChapter06Done:true,arkonStoryChapter07Done:false,
  garageTier:2,workshopLocationId:'shinonomeWarehouseStrip',
  selectedCarId:'240z',ownedCarIds:['240z'],carStates:{'240z':{}},
  cash:10000000,arkonStoryChapter07Work:{stage:1,shops:[],
    jobsDone:1,racesDone:0,converted:false},...data});

const scriptScene=title=>ARKON_CHAPTER_07.steps.find(s=>s.type==='MANGA'&&s.title===title);
test('R684: first build unlocks only the two named physical tuners, even on dev profile',()=>{
  const s=fixture();
  assert.equal(isTunerShopUnlocked(s,'SHIBUYA'),true);
  assert.equal(isTunerShopUnlocked(s,'YOKOHAMA'),true);
  for(const region of ['ODAIBA','SHINAGAWA','TATSUMI','DAIKOKU','SHINJUKU']){
    assert.equal(isTunerShopUnlocked(s,region),false,region);
    assert.match(getTunerShopUnlockLabel(s,region),/LEVEL 2/);
    assert.equal(recordArkonCh7TunerVisit(s,region),false);
  }
  s.set('arkonStoryChapter07Work',{...s.get('arkonStoryChapter07Work'),stage:2});
  for(const region of ['ODAIBA','SHINAGAWA','TATSUMI','DAIKOKU','SHINJUKU'])
    assert.equal(isTunerShopUnlocked(s,region),true,region);
  const career=fixture({gameMode:'career',devMode:false});
  assert.equal(isTunerShopUnlocked(career,'SHINJUKU'),false);
});

test('R684: Shibuya and Yokohama must BOTH be visited; first cutscenes claim once',()=>{
  const s=fixture();
  assert.equal(recordArkonCh7TunerVisit(s,'SHIBUYA'),true);
  assert.equal(ch7Progress(s).firstIntroductions.length,1);
  assert.equal(claimArkonCh7FirstVisitScene(s,'SHIBUYA'),true);
  assert.equal(claimArkonCh7FirstVisitScene(s,'SHIBUYA'),false);
  assert.equal(recordArkonCh7TunerVisit(s,'SHIBUYA'),false);
  assert.equal(recordArkonCh7TunerVisit(s,'YOKOHAMA'),true);
  assert.deepEqual(ch7Progress(s).firstIntroductions,['SHIBUYA','YOKOHAMA']);
  assert.equal(claimArkonCh7FirstVisitScene(s,'YOKOHAMA'),true);
  assert.equal(claimArkonCh7FirstVisitScene(s,'YOKOHAMA'),false);
  assert.equal(s.get('arkonStoryChapter07Work').firstVisitScenes.length,2);
  assert.ok(getArkonCh7FirstTunerManga('SHIBUYA')?.pages.length>=4);
  assert.ok(getArkonCh7FirstTunerManga('YOKOHAMA')?.pages.length>=4);
  assert.equal(getArkonCh7FirstTunerManga('SHINAGAWA'),null);
});

test('R684: tuner manga triggers on actual TunerShopScene entry, not after work gate',()=>{
  const file=read('../src/scenes/TunerShopScene.js');
  assert.match(file,/recordArkonCh7TunerVisit\(this.registry,this.regionId\)/);
  assert.match(file,/claimArkonCh7FirstVisitScene\(this.registry,this.regionId\)/);
  assert.match(file,/playMangaCutscene\(this,definition,/);
  const first=ARKON_CHAPTER_07.steps.findIndex(s=>s.type==='ARKON_CH7_WORK'&&s.stage===1);
  const race=ARKON_CHAPTER_07.steps.findIndex(s=>s.type==='ARKON_CH7_RACE'&&s.index===0);
  assert.ok(first>0&&race>first);
  assert.ok(!ARKON_CHAPTER_07.steps.slice(first+1,race).some(s=>s.title==='ITSUKI // THE AMUSE WORKSHOP'));
  assert.equal(getArkonCh7FirstTunerManga('SHIBUYA').pages.every(p=>p.leftPose==='storyMechanic'),true);
  assert.equal(getArkonCh7FirstTunerManga('YOKOHAMA').pages.every(p=>p.leftPose==='storyMechanic'),true);
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_07));
});

test('R684: first Yokohama meet uses Masato Ishikawa actual resident and actual R32',()=>{
  assert.equal(CH7_RACES[0].district,'YOKOHAMA');
  assert.equal(CH7_RACES[0].opponentCarId,'r32');
  assert.equal(CH7_RACES[0].opponentId,'masatoIshikawa');
  assert.equal(characters.masatoIshikawa.regionId,'YOKOHAMA');
  assert.ok(characters.masatoIshikawa.preferredCars.includes('r32'));
  const greeting=scriptScene('MASATO // THE HARBOUR R32');
  assert.equal(greeting.characters.right,'masatoIshikawa');
  const date=scriptScene('A VIEW WORTH RETURNING FOR');
  assert.ok(date.pages.some(x=>x.speaker==='right'&&x.rightPose==='homeHappy'));
  assert.ok(date.pages.some(x=>x.text.includes('data logger')));
  const after=scriptScene('MORE THAN A TIME SLIP');
  assert.ok(after.pages.some(x=>x.text.includes('Yokohama always feels nice')));
  assert.ok(after.pages.filter(p=>p.speaker==='right').length>=3);
  assert.ok(scriptScene('THE SECOND ROUND').pages.filter(p=>p.speaker==='right').length>=3);
});

test('R684: real passenger dialogue is wired to the first race, with home clothing',()=>{
  const code=read('../src/scenes/RaceScene.js');
  assert.match(code,/this.isArkonCh7Drive = this.raceMode==='SINGLE'/);
  assert.match(code,/this.registry.get\('arkonStoryChapter07Race'\)\?\.index===0/);
  assert.match(code,/this.setupArkonCh7Passenger\(\)/);
  assert.match(code,/this.updateArkonCh7Passenger\(\)/);
  assert.match(code,/createGinzaBanterHud\(this,\{chapter03:true\}\)/);
  assert.match(code,/homeNormal','homeHappy','homeSerious'/);
  assert.match(code,/reputation to keep now/);
  assert.match(code,/Yokohama always seems nice/);
});

test('R684: only own 240Z in Chapter 7 at Warehouse HQ bypasses 40-win rule for PAID level 3',()=>{
  const s=fixture({wins:0,arkonStoryChapter07Work:{stage:2,shops:['SHIBUYA','YOKOHAMA'],jobsDone:2,racesDone:1}});
  assert.equal(canInstallTuningLevel('engine','engine',3,'shinonomeWarehouseStrip',0,false),false);
  assert.equal(canArkonCh7BuyStoryParts(s,'240z','shinonomeWarehouseStrip',3),true);
  assert.equal(canInstallTuningLevel('engine','engine',3,'shinonomeWarehouseStrip',0,
    canArkonCh7BuyStoryParts(s,'240z','shinonomeWarehouseStrip',3)),true);
  assert.equal(getTuningRequirementLabel('engine','engine',3,'shinonomeWarehouseStrip',0,true),'AVAILABLE');
  assert.equal(canArkonCh7BuyStoryParts(s,'240z','shinonomeCanalYard',3),false);
  assert.equal(canArkonCh7BuyStoryParts(s,'r32','shinonomeWarehouseStrip',3),false);
  assert.equal(canArkonCh7BuyStoryParts(s,'240z','shinonomeWarehouseStrip',2),false);
  s.set('gameMode','career');
  assert.equal(canArkonCh7BuyStoryParts(s,'240z','shinonomeWarehouseStrip',3),false);
  s.set('gameMode','arkonStory');
  s.set('arkonStoryChapter07Done',true);
  assert.equal(canArkonCh7BuyStoryParts(s,'240z','shinonomeWarehouseStrip',3),false);
  const garage=read('../src/scenes/GarageScene.js');
  assert.match(garage,/canArkonCh7BuyStoryParts\(this.registry,this.selectedCarId,/);
});

test('R684: existing numeric chapter saves are migrated only once, not restarted',()=>{
  const src=read('../src/story/StoryDirector.js');
  assert.match(src,/!checkpoint.vars\?\.storyR684/);
  assert.match(src,/oldIndex>=firstRace-1/);
  assert.match(src,/oldIndex\+1/);
  assert.match(src,/storyR684:true/);
  assert.match(src,/savedIndex===0 && id==='arkonChapter07'/);
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_07));
});
