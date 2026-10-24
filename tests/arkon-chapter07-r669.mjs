import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_07} from '../src/data/arkonChapter07.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';
import {ENGINE_PART_ORDER} from '../src/data/tuning.js';
import {DRIVETRAIN_PART_ORDER,CHASSIS_PART_ORDER,EXHAUST_NOS_PART_ORDER}
  from '../src/data/secondaryTuning.js';
import {
 CH7_HERO_ID,CH7_JOB_FEES,ch7Progress,getArkonCh7Job,
 startArkonCh7Work,finishArkonCh7Work,recordArkonCh7Job,
 recordArkonCh7TunerVisit,startArkonCh7Race,finishArkonCh7Race,
 convertArkonCh7Car,startArkonCh7SoloDrive,finishArkonCh7SoloDrive
} from '../src/data/arkonChapter07Progress.js';
const text=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const reg=(values={})=>({values,get(k){return this.values[k]},set(k,v){this.values[k]=v}});
const ordered=[ENGINE_PART_ORDER,DRIVETRAIN_PART_ORDER,CHASSIS_PART_ORDER,EXHAUST_NOS_PART_ORDER];
const all=Object.fromEntries(ordered.flat().map(id=>[id,1]));
function fixture(){
 return reg({gameMode:'arkonStory',firstName:'Arkon',lastName:'Den',playerCharacterId:'arkonDen',
  arkonStoryChapter06Done:true,
  arkonStoryChapter07Done:false,arkonStoryWarehouseUnlocked:true,garageTier:2,
  workshopLocationId:'shinonomeWarehouseStrip',cash:2000000,
  selectedCarId:'240z',preferredCarId:'240z',ownedCarIds:['240z'],
  carGarageLocations:{'240z':'shinonomeWarehouseStrip'},
  carStates:{'240z':{tuning:{...all},drivetrainTuning:{...all},
   chassisTuning:{...all},exhaustNosTuning:{...all}}},
  arkonStoryRwbProject:{acquired:true,gifted:true,owner:'sayakaFujieda',
   carId:'rwbStellaPorsche',roadworthy:true,outstandingFinance:0}});
}
const tune=(s,level)=>{
 const c={...(s.get('carStates')||{})},v={...c['240z']};
 for(const k of ['tuning','engineTuning','drivetrainTuning','chassisTuning','exhaustNosTuning']){
  v[k]={...v[k]};
  for(const id of ordered.flat())v[k][id]=level;
 }
 c['240z']=v;s.set('carStates',c);
};
test('R669 validates Chapter 07 and keeps Chapter 08 out of scope',()=>{
 assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_07));
 assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter07,ARKON_CHAPTER_07);
 assert.deepEqual(ARKON_CHAPTER_07.steps.filter(x=>x.type==='ARKON_CH7_JOB').map(x=>x.index),[0,1,2]);
 assert.deepEqual(ARKON_CHAPTER_07.steps.filter(x=>x.type==='ARKON_CH7_WORK').map(x=>x.stage),[1,2]);
 assert.deepEqual(ARKON_CHAPTER_07.steps.filter(x=>x.type==='ARKON_CH7_RACE').map(x=>x.index),[0,1]);
 assert.equal(ARKON_CHAPTER_07.steps.filter(x=>x.type==='ARKON_CH7_CONVERT').length,1);
 assert.equal(ARKON_CHAPTER_07.steps.filter(x=>x.type==='ARKON_CH7_SOLO').length,1);
 assert.equal(ARKON_CHAPTER_07.steps.at(-1).type,'END');
 assert.equal(ARKON_CHAPTER_07.steps.some(x=>x.type==='SET_FLAG'&&x.key==='arkonStoryChapter08Done'),false);
});
test('R669 real commissions pay once; chapter cannot be entered by Career',()=>{
 const s=fixture();
 for(let i=0;i<3;i++){
  assert.equal(getArkonCh7Job(s,i).pay,CH7_JOB_FEES[i]);
  assert.equal(recordArkonCh7Job(s,i),true);
  assert.equal(recordArkonCh7Job(s,i),false);
 }
 assert.equal(s.get('cash'),2000000+CH7_JOB_FEES.reduce((a,b)=>a+b));
 s.set('gameMode','career');
 assert.equal(startArkonCh7Work(s,1),false);
 assert.equal(convertArkonCh7Car(s),false);
 assert.equal(recordArkonCh7TunerVisit(s,'DAIKOKU'),false);
});
test('R669 two independent build milestones require real parts and genuine shop visits',()=>{
 const s=fixture();
 assert.equal(startArkonCh7Work(s,1),false);
 assert.equal(recordArkonCh7Job(s,0),true);
 assert.equal(startArkonCh7Work(s,1),true);
 assert.equal(finishArkonCh7Work(s,1),false);
 tune(s,2);
 assert.equal(recordArkonCh7TunerVisit(s,'SHIBUYA'),true);
 assert.equal(recordArkonCh7TunerVisit(s,'SHIBUYA'),false);
 assert.equal(ch7Progress(s).ready,false);
 assert.equal(recordArkonCh7TunerVisit(s,'DAIKOKU'),true);
 assert.equal(ch7Progress(s).ready,true);
 assert.equal(finishArkonCh7Work(s,1),true);
 assert.equal(startArkonCh7Race(s,0),true);
 assert.equal(startArkonCh7Race(s,0),false);
 assert.equal(s.get('selectedRaceStake'),0);
 s.set('arkonStoryChapter07RaceResult','lost');
 assert.equal(finishArkonCh7Race(s),true);
 assert.equal(finishArkonCh7Race(s),false);
 assert.equal(s.get('selectedCarId'),'240z');
 assert.equal(ch7Progress(s).racesDone,1);
 assert.equal(recordArkonCh7Job(s,1),true);
 assert.equal(startArkonCh7Work(s,2),true);
 assert.equal(finishArkonCh7Work(s,2),false);
 tune(s,3);
 assert.equal(recordArkonCh7TunerVisit(s,'YOKOHAMA'),true);
 assert.equal(recordArkonCh7TunerVisit(s,'SHINJUKU'),true);
 assert.equal(ch7Progress(s).ready,true);
 assert.equal(finishArkonCh7Work(s,2),true);
 assert.equal(startArkonCh7Race(s,1),true);
 s.set('arkonStoryChapter07RaceResult','won');
 assert.equal(finishArkonCh7Race(s),true);
 assert.equal(ch7Progress(s).racesDone,2);
 assert.equal(convertArkonCh7Car(s),true);
 assert.equal(convertArkonCh7Car(s),true);
 assert.ok(s.get('ownedCarIds').includes(CH7_HERO_ID));
 assert.ok(!s.get('ownedCarIds').includes('240z'));
 assert.equal(s.get('carStates')[CH7_HERO_ID].tuning.engine,3);
 assert.equal(s.get('carGarageLocations')[CH7_HERO_ID],'shinonomeWarehouseStrip');
 assert.equal(s.get('selectedCarId'),CH7_HERO_ID);
 assert.equal(s.get('arkonStoryRwbProject').owner,'sayakaFujieda');
 assert.equal(startArkonCh7SoloDrive(s),true);
 assert.equal(s.get('selectedRaceCategory'),'ARKON_CH7_SOLO');
 assert.equal(startArkonCh7SoloDrive(s),false);
 assert.equal(finishArkonCh7SoloDrive(s),false);
 s.set('arkonStoryChapter07Solo',{...s.get('arkonStoryChapter07Solo'),completed:true});
 assert.equal(finishArkonCh7SoloDrive(s),true);
 assert.equal(s.get('arkonStoryChapter07SoloFinished'),true);
});
test('R669 Chapter 07 save survives story normalization, not Career',()=>{
 const s=fixture();
 s.set('arkonStoryChapter07Done',true);
 s.set('arkonStoryChapter07Work',{stage:3,shops:['YOKOHAMA','DAIKOKU'],
  jobsDone:3,racesDone:2,converted:true});
 const story=normaliseState({...createDefaultGameState(),...s.values});
 assert.equal(story.arkonStoryChapter07Done,true);
 assert.equal(story.arkonStoryChapter07Work.converted,true);
 assert.equal(story.arkonStoryChapter07Work.shops.length,2);
 const career=normaliseState({...createDefaultGameState(),...s.values,gameMode:'career',
   firstName:'Alex',lastName:'Driver'});
 assert.equal(career.arkonStoryChapter07Done,false);
 assert.equal(career.arkonStoryChapter07Work,null);
});
test('R669 real Story flows, companion absent in last drive, replay and Hero art linked',()=>{
 assert.match(text('../src/story/StoryDirector.js'),/ARKON_CH7_SOLO_RETURN/);
 assert.match(text('../src/ui/ArkonStoryObjective.js'),/BEGIN CHAPTER 07/);
 assert.match(text('../src/scenes/TunerShopScene.js'),/recordArkonCh7TunerVisit/);
 assert.match(text('../src/scenes/RaceScene.js'),/updateArkonCh7Solo\(/);
 assert.match(text('../src/scenes/RaceScene.js'),/SAYAKA FUJIEDA/);
 assert.match(text('../src/ui/ArkonPlayableReplay.js'),/chapter===7\?'arkonChapter07'/);
 assert.match(text('../src/ui/ArkonStoryArchivePanel.js'),/ARKON_CHAPTER_07/);
 assert.match(text('../src/data/cars.js'),/liberty_walk_240z_hero_body\.png/);
});
