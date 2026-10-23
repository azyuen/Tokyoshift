import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { ARKON_CHAPTER_03 } from '../src/data/arkonChapter03.js';
import { ARKON_CHAPTER_04 } from '../src/data/arkonChapter04.js';
import { validateStoryScript } from '../src/story/StoryScript.js';
import {getFactoryPaintPalette} from '../src/data/factoryPaintPalettes.js';
import {recordArkonRwbPurchase,getArkonRwbLoan,isArkonRwbRestoration,ARKON_RWB_LOAN_AMOUNT}
  from '../src/data/arkonChapter04Ledger.js';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';

const src=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const registry=(values={})=>({values,get(k){return this.values[k]},set(k,v){this.values[k]=v}});
test('R665 Chapter 03 and 04 branching remains valid after stage/phone refactor',()=>{
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_03));
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_04));
  const ownerArrival=ARKON_CHAPTER_03.steps.find(x=>x.type==='STAGE' &&
    ARKON_CHAPTER_03.steps.some(y=>y.type==='HOLD_SCENE'&&y.label==='THE OWNER ARRIVES'));
  assert.ok(ownerArrival);
  const s3=ARKON_CHAPTER_03.steps;
  const ownerIndex=s3.findIndex(x=>x.label==='THE OWNER ARRIVES');
  assert.equal(s3[ownerIndex-1].type,'STAGE');
  const ownerStage=s3[ownerIndex-1];
  assert.equal(ownerStage.castBehindCar,false);
  assert.ok(ownerStage.characters.find(a=>a.id==='sayakaFujieda')?.fadeInMs>=1000);
  const visitorStage=s3.find(x=>x.type==='STAGE'&&
    x.characters?.some(a=>a.id==='reikaTachibana'));
  assert.ok(visitorStage);
  assert.ok(visitorStage.characters.find(a=>a.id==='reikaTachibana')?.fadeInMs>=1000);
  assert.ok(s3.some(x=>x.type==='FADE_STORY_ACTOR'&&x.actorId==='reikaTachibana'));
  assert.ok(s3.some(x=>x.type==='MANGA'&&x.title==='SOMEONE REMEMBERS'&&
    x.characters?.right==='reikaTachibana'));
});

test('R665 Chapter 03 uses selectable stock paints, never random neon or owner car ownership',()=>{
  assert.ok(getFactoryPaintPalette('mx5').length>4);
  const ui=src('../src/ui/ArkonCustomerTuning.js');
  assert.match(ui,/getFactoryPaintPalette\(job\.carId\)/);
  assert.match(ui,/stage\?\.setPaintColor\(paint\(\)\.color\)/);
  assert.doesNotMatch(ui,/selectMixedCarPaint/);
  const stage=src('../src/ui/StoryStage.js');
  assert.match(stage,/setPaintColor\(color\)/);
  assert.match(stage,/getData\?\.\('carPaintLayer'\)/);
  assert.match(stage,/fadeActor\(actorId/);
});

test('R665 Chapter 04 rolls actual wheels in, not a body-only entrance or fade jump',()=>{
  const stages=ARKON_CHAPTER_04.steps.filter(s=>s.type==='STAGE' &&
    s.cars?.some(c=>c.carId==='rwbStellaPorsche'));
  assert.ok(stages.filter(x=>x.motion==='roll-in-left').length>=2);
  assert.ok(stages.every(x=>x.stageMode==='native'));
  const stage=src('../src/ui/StoryStage.js');
  assert.match(stage,/progress\.travelled\/part\.radius/);
  assert.match(stage,/duration:4800/);
  const garage=src('../src/scenes/GarageScene.js');
  assert.match(garage,/rearWheel\.storyRollRadius=/);
  assert.match(garage,/frontWheel\.storyRollRadius=/);
  const director=src('../src/story/StoryDirector.js');
  assert.match(director,/const rolling=this\.session\.id==='arkonChapter04'/);
  assert.ok(director.includes('onArrivalComplete:()=>'));
});

test('R665 chapter 04 anonymous owner always speaks by phone, appraiser has an existing real sprite',()=>{
  const x=ARKON_CHAPTER_04.steps;
  assert.ok(x.filter(s=>s.type==='PHONE'&&s.callerName==='NO CALLER ID').length>=3);
  assert.ok(x.some(s=>s.type==='PHONE'&&s.callerId==='kenjiOkabe'));
  assert.ok(x.some(s=>s.type==='STAGE'&&s.characters?.some(c=>c.id==='kenjiOkabe')));
  const phone=x.filter(s=>s.type==='PHONE'&&s.callerName==='NO CALLER ID');
  assert.ok(phone.every(s=>s.callerId===''));
  for(const m of x.filter(s=>s.type==='MANGA')){
    assert.ok(!m.pages?.some(p=>/^(OWNER:|OWNER )/.test(p.text)));
  }
  const face=src('../src/ui/RaceCoachHud.js');
  const opening=src('../src/ui/OpeningPhonePrototype.js');
  const standard=src('../src/ui/PhoneConversation.js');
  assert.match(face,/ANONYMOUS_CALLER_PATH='assets\/Ui\/phone_unknown\.png'/);
  assert.match(opening,/ANONYMOUS_CALLER_PATH/);
  assert.match(standard,/ANONYMOUS_CALLER_PATH/);
});

test('R665 ¥3m debt and immutable garage slot are idempotent and isolated from career',()=>{
  const story=registry({gameMode:'arkonStory',arkonStoryChapter03Done:true,
    cash:18000,ownedCarIds:['240z'],
    carGarageLocations:{'240z':'shinonomeWorkshop'},carStates:{'240z':{}}});
  assert.equal(recordArkonRwbPurchase(story),true);
  assert.equal(story.get('cash'),12000);
  assert.equal(getArkonRwbLoan(story),3000000);
  assert.equal(getArkonRwbLoan(story),ARKON_RWB_LOAN_AMOUNT);
  assert.equal(story.get('arkonStoryRwbProject').roadworthy,false);
  assert.equal(isArkonRwbRestoration(story,'rwbStellaPorsche'),true);
  assert.equal(story.get('carStates').rwbStellaPorsche.immutable,true);
  assert.equal(story.get('carGarageLocations')['240z'],'shinonomeWorkshop');
  assert.equal(story.get('carGarageLocations').rwbStellaPorsche,'shinonomeCanalYard');
  assert.deepEqual(story.get('ownedCarIds'),['240z','rwbStellaPorsche']);
  assert.equal(recordArkonRwbPurchase(story),true);
  assert.equal(story.get('cash'),12000);
  assert.equal(story.get('ownedCarIds').length,2);
  const garage=src('../src/scenes/GarageScene.js');
  assert.match(garage,/isArkonRwbRestoration\(this\.registry,this\.selectedCarId\)/);
  assert.match(garage,/refreshArkonRwbLoanHud\(\)/);
  assert.match(garage,/RESTORATION ONLY/);
});

test('R665 existing R659 story saves migrate project into slot without Career contamination',()=>{
  const old={...createDefaultGameState(),firstName:'Arkon',lastName:'Den',
    gameMode:'arkonStory',arkonStoryChapter03Done:true,
    arkonStoryChapter04Done:true,garageTier:1,
    ownedCarIds:['240z'],carGarageLocations:{'240z':'shinonomeWorkshop'},
    arkonStoryRwbProject:{acquired:true,carId:'rwbStellaPorsche',
      roadworthy:false,purchasePrice:1800000,deposit:6000,
      outstandingFinance:1794000}};
  const migrated=normaliseState(old);
  assert.ok(migrated.ownedCarIds.includes('rwbStellaPorsche'));
  assert.equal(migrated.carGarageLocations.rwbStellaPorsche,'shinonomeCanalYard');
  assert.equal(migrated.carStates.rwbStellaPorsche.tuningLocked,true);
  assert.equal(migrated.arkonStoryRwbProject.outstandingFinance,3000000);
  const other=normaliseState({...old,gameMode:'career'});
  assert.equal(other.arkonStoryRwbProject,null);
  assert.ok(!other.ownedCarIds.includes('rwbStellaPorsche'));
});

test('R665 recount can exit over cutscenes and restores prior car/replay flags',()=>{
  const settings=src('../src/ui/SettingsPanel.js');
  const race=src('../src/scenes/RaceScene.js');
  const overlay=src('../src/ui/ArkonReplayExit.js');
  const director=src('../src/story/StoryDirector.js');
  const replay=src('../src/ui/ArkonPlayableReplay.js');
  assert.doesNotMatch(settings,/rectangle\(172,35,282,42/);
  assert.doesNotMatch(race,/rectangle\(172,35,282,42/);
  assert.match(overlay,/setDepth\(depth\)/);
  assert.match(overlay,/90000/);
  assert.match(director,/syncArkonReplayExit\(this.activeScene\(\)\)/);
  assert.match(replay,/sessions\.delete\(registry\)/);
  assert.match(replay,/restore\(registry,session\.original\)/);
  assert.match(replay,/originalCars\.filter\(id=>id!=='rwbStellaPorsche'\)/);
});
