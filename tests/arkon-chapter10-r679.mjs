import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_05} from '../src/data/arkonChapter05.js';
import {ARKON_CHAPTER_06} from '../src/data/arkonChapter06.js';
import {ARKON_CHAPTER_10} from '../src/data/arkonChapter10.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {
  sellArkonCh10LibertyWalk,startArkonCh10PorscheCruise,
  finishArkonCh10PorscheCruise,
} from '../src/data/arkonChapter10Work.js';
import {migrateArkonR679Checkpoint} from '../src/story/ArkonR679CheckpointMigration.js';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const registry=init=>({data:{...init},get(k){return this.data[k]},
  set(k,v){this.data[k]=v},getAll(){return this.data;}});
const fixture=()=>registry({
  gameMode:'arkonStory',firstName:'Arkon',lastName:'Den',
  arkonStoryChapter09Done:true,arkonStoryChapter09Refused:true,
  arkonStoryChapter10Done:false,arkonStoryChapter10RaceDone:true,
  arkonStoryChapter10ProjectsDone:3,cash:500000,
  ownedCarIds:['arkonLibertyWalk240z'],
  carStates:{arkonLibertyWalk240z:{
    acquiredVia:'story-upgrade',storyLibertyWalk:true,tuneLevel:3,
    paintColor:0xffcccc,tuning:{engine:3}}},
  carGarageLocations:{arkonLibertyWalk240z:'shinonomeWarehouseStrip'},
  carHistory:[{id:'z:original',carId:'arkonLibertyWalk240z',
    acquiredAt:100,acquiredVia:'story-upgrade',status:'OWNED'}],
  garageTier:2,selectedCarId:'arkonLibertyWalk240z',
  preferredCarId:'arkonLibertyWalk240z',
  arkonStoryChapter10Settlement:{resolved:false,paid:300000,
    remainingLiability:4800000,workshop:'retained-pending-final-payment'},
  arkonStoryRwbProject:{carId:'rwbStellaPorsche',gifted:true,
    owner:'sayakaFujieda',roadworthy:true},
  arkonStoryGinzaPartnership:{owners:['arkonDen','sayakaFujieda'],status:'open'},
  arkonStoryCareerSeed:{fundedBy:['arkonDen','sayakaFujieda']},
});
test('Reciprocity grows out of R678 without replacing Chapters 7–9',()=>{
  const sayaka=ARKON_CHAPTER_05.steps.find(s=>s.title==='THE DAY SHE NEEDED A FRIEND');
  const dreams=ARKON_CHAPTER_06.steps.find(s=>s.title==='THE PART SHE STILL MISSES');
  const ginza=ARKON_CHAPTER_10.steps.find(s=>s.title==='A RARE MOMENT OF DOUBT');
  assert.ok(sayaka&&dreams&&ginza);
  assert.match(sayaka.pages.map(p=>p.text).join(' '),/You came here to talk/);
  assert.match(dreams.pages.map(p=>p.text).join(' '),/managing a team/);
  assert.match(ginza.pages.map(p=>p.text).join(' '),/This was your idea/);
  [ARKON_CHAPTER_05,ARKON_CHAPTER_06,ARKON_CHAPTER_10].forEach(ch=>
    assert.doesNotThrow(()=>validateStoryScript(ch)));
});
test('Chapter 10 hero sale occurs after real final Z race and before Ginza',()=>{
  const steps=ARKON_CHAPTER_10.steps;
  const at=t=>steps.findIndex(s=>s.type===t);
  assert.ok(at('ARKON_CH10_RACE')<at('ARKON_CH10_SELL_Z'));
  assert.ok(at('ARKON_CH10_SELL_Z')<at('ARKON_CH10_GINZA'));
  assert.equal(steps.find(s=>s.title==='ONE LAST LOOK')?.type,'MANGA');
  assert.equal(steps.filter(s=>s.type==='ARKON_CH10_DRIVE').length,1);
  assert.equal(steps.filter(s=>s.type==='ARKON_CH10_DRIVE_RETURN').length,1);
  assert.equal(steps.find(s=>s.label==='YOKOHAMA // BACK WHERE WE BEGAN'),undefined);
  const finalStage=steps.find(s=>s.type==='STAGE' &&
    s.meetCarLayout==='yokohamaFinale');
  assert.deepEqual(finalStage?.cars,[{carId:'rwbStellaPorsche'}]);
  assert.match(source('../src/ui/ArkonChapter10Finale.js'),
    /arkon_sayaka_holdinghands\.png/);
  assert.doesNotMatch(source('../src/ui/ArkonChapter10Finale.js'),
    /cars:\[\{carId:'rwbStellaPorsche'\},\{carId:'arkonLibertyWalk240z'\}\]/);
});
test('Voluntary Z sale is a real once-only financial and ownership consequence',()=>{
  const s=fixture();
  assert.equal(sellArkonCh10LibertyWalk(s),true);
  assert.equal(s.get('cash'),600000);
  assert.equal(s.get('arkonStoryChapter10ZSale').settledLiability,4800000);
  assert.equal(s.get('arkonStoryChapter10Settlement').resolved,true);
  assert.equal(s.get('ownedCarIds').includes('arkonLibertyWalk240z'),false);
  assert.equal(s.get('ownedCarIds').includes('rwbStellaPorsche'),false);
  assert.deepEqual(s.get('ownedCarIds'),['ef']);
  assert.equal(s.get('carStates').arkonLibertyWalk240z,undefined);
  assert.equal(s.get('carHistory').find(h=>h.carId==='arkonLibertyWalk240z').status,'SOLD');
  assert.equal(s.get('carHistory').find(h=>h.carId==='arkonLibertyWalk240z').lastState.tuneLevel,3);
  assert.equal(s.get('arkonStoryRwbProject').owner,'sayakaFujieda');
  const snapshot=structuredClone(s.data);
  assert.equal(sellArkonCh10LibertyWalk(s),true);
  assert.deepEqual(s.data,snapshot);
  const loaded=normaliseState({...createDefaultGameState({starterCarId:'240z'}),...s.data});
  assert.equal(loaded.ownedCarIds.includes('arkonLibertyWalk240z'),false);
  assert.equal(loaded.arkonStoryChapter10ZSale.status,'sold');
});
test('Chapter 10 final moving road uses Sayaka driving her RWB as a temporary loan',()=>{
  const s=fixture();
  assert.equal(startArkonCh10PorscheCruise(s),false); // must settle first
  assert.equal(sellArkonCh10LibertyWalk(s),true);
  const original=s.get('selectedCarId');
  s.set('selectedRaceType','MY_PREVIOUS_RACE');
  assert.equal(startArkonCh10PorscheCruise(s),true);
  assert.equal(startArkonCh10PorscheCruise(s),false);
  assert.equal(s.get('selectedCarId'),'rwbStellaPorsche');
  assert.equal(s.get('selectedRaceCategory'),'ARKON_CH10_RWB_CRUISE');
  assert.equal(s.get('selectedRaceStake'),0);
  assert.equal(s.get('ownedCarIds').includes('rwbStellaPorsche'),false);
  const reload=normaliseState({...createDefaultGameState(),...s.data});
  assert.equal(reload.selectedCarId,'rwbStellaPorsche');
  assert.equal(reload.preferredCarId,'rwbStellaPorsche');
  assert.equal(reload.arkonStoryChapter10Cruise.active,true);
  assert.equal(finishArkonCh10PorscheCruise(s),false);
  const ctx=s.get('arkonStoryChapter10Cruise');
  s.set('arkonStoryChapter10Cruise',{...ctx,completed:true});
  assert.equal(finishArkonCh10PorscheCruise(s),true);
  assert.equal(s.get('selectedCarId'),original);
  assert.equal(s.get('selectedRaceType'),'MY_PREVIOUS_RACE');
  assert.equal(s.get('arkonStoryChapter10CruiseFinished'),true);
  assert.equal(s.get('arkonStoryChapter10Cruise'),null);
  assert.match(source('../src/scenes/RaceScene.js'),/updateArkonCh10Cruise/);
  assert.match(source('../src/scenes/RaceScene.js'),/ARUKEN \/\/ PASSENGER/);
});
test('Contract sale and Porsche cinematic never mutate an ordinary Career profile',()=>{
  const s=fixture();
  s.set('gameMode','career');
  assert.equal(sellArkonCh10LibertyWalk(s),false);
  assert.equal(startArkonCh10PorscheCruise(s),false);
  assert.equal(s.get('ownedCarIds').includes('arkonLibertyWalk240z'),true);
  const normal=normaliseState({...createDefaultGameState(),...s.data});
  assert.equal(normal.arkonStoryChapter10ZSale,null);
  assert.equal(normal.arkonStoryChapter10Cruise,null);
});
test('R678 mid-chapter checkpoint numbers migrate without replaying past races',()=>{
  const compiled={script:ARKON_CHAPTER_10};
  const data=registry({ownedCarIds:['arkonLibertyWalk240z'],
    arkonStoryChapter10RaceDone:true});
  const prior={id:'arkonChapter10',index:56,vars:{storyR678:true}};
  const relocated=migrateArkonR679Checkpoint(compiled,prior,data);
  assert.equal(relocated.index,32); // Revisit genuine farewell/sale, not the final scene
  assert.equal(relocated.vars.storyR679,true);
  data.set('ownedCarIds',['ef']);
  data.set('arkonStoryChapter10ZSale',{status:'sold'});
  const later=migrateArkonR679Checkpoint(compiled,prior,data);
  assert.equal(ARKON_CHAPTER_10.steps[later.index].type,'ARKON_CH10_YOKOHAMA');
  assert.equal(migrateArkonR679Checkpoint(compiled,
    {...prior,vars:{storyR679:true}},data),null);
});
