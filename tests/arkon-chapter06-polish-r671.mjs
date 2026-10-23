import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_06} from '../src/data/arkonChapter06.js';
import {getArkonCh6Job} from '../src/data/arkonChapter06Work.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
const file=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const steps=ARKON_CHAPTER_06.steps;
const stageFor=part=>{
  const k=steps.findIndex(s=>s.type==='HOLD_SCENE'&&s.label.includes(part));
  assert.ok(k>0,'missing hold '+part);
  assert.equal(steps[k-1].type,'STAGE','stage must show before pause '+part);
  return steps[k-1];
};
const manga=title=>steps.find(s=>s.type==='MANGA'&&s.title===title);
test('R671 rotary owner brings an SA22C RX-7, never a Honda Prelude',()=>{
 const job=getArkonCh6Job({arkonStoryChapter03Seed:271},1);
 assert.equal(job.carId,'sa22c');
 assert.match(job.name,/RX-7|RX7|SA22C/i);
 assert.ok(job.targetKW>=job.stockKW);
 assert.ok(job.maxKW>=job.targetKW);
 assert.equal(job.pay,2700000);
 const other=getArkonCh6Job({arkonStoryChapter03Seed:271},0);
 assert.ok(other&&other.index===0&&other.carId);
});
test('R671 Chapter 06 preserves all scripted financial and story indices',()=>{
 assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_06));
 assert.deepEqual(steps.filter(s=>s.type==='ARKON_CH6_JOB').map(s=>s.index),[0,1,2]);
 assert.deepEqual(steps.filter(s=>s.type==='ARKON_CH6_RESTORE').map(s=>s.index),[0,1,2]);
 assert.equal(steps.filter(s=>s.type==='ARKON_CH6_GIFT').length,1);
 assert.equal(steps.filter(s=>s.type==='ARKON_CH6_ENDING').length,1);
 assert.equal(steps.at(-1).type,'END');
 assert.ok(!steps.some(s=>s.type==='STORY_CAR_EXIT')); // No Chapter 05 regressions.
});
test('R671 Sayaka changes clothes between commissions, then wears home clothes throughout the RWB repair',()=>{
 const first=stageFor('FIRST NEW CLIENT');
 const second=stageFor('SECOND NEW CLIENT');
 const third=stageFor('THIRD COMMISSION');
 assert.match(first.characters[1].pose,/oshiage/);
 assert.match(second.characters[1].pose,/home/);
 assert.match(third.characters[1].pose,/oshiage/);
 for(const part of ['RWB // STRUCTURAL REBUILD','RWB // ENGINE AND DRIVELINE',
   'RWB // FINAL INSPECTION','JUST BEFORE MIDNIGHT']){
   const stage=stageFor(part);
   assert.equal(stage.characters[1].id,'sayakaFujieda');
   assert.match(stage.characters[1].pose,/^home/);
   assert.ok(stage.fadeInMs>=900);
 }
 for(const title of ['FROM DAIKOKU','ROOM TO DO IT RIGHT','BACK TO THE BARE SHELL',
  'THE HARD PART OF GETTING IT RIGHT','EVERYTHING IN WRITING','THE CERTIFICATE',
  'THE KEYS']){
   const pages=manga(title)?.pages;
   assert.ok(pages?.length, title);
   assert.ok(pages.every(page=>page.rightPose.startsWith('home')),title);
 }
 assert.match(manga('FROM SHINAGAWA').pages[0].rightPose,/^oshiage/);
 assert.match(manga('A CALL FROM YOKOHAMA').pages[0].rightPose,/^oshiage/);
});
test('R671 workshop restoration uses native Warehouse hero layout not garage-panel perspective',()=>{
 const source=file('../src/ui/ArkonRwbRestoration.js');
 assert.match(source,/backgroundId:'\$CURRENT_WORKSHOP'/);
 assert.match(source,/stageMode:'native'/);
 assert.doesNotMatch(source,/stageMode:'garage-panel'/);
 assert.match(source,/pose:index===0\?'storyMechanicCrouch':'storyMechanicEngine'/);
 assert.match(source,/pose:index===1\?'homeHappy':'homeNormal'/);
 assert.match(source,/0x050911,\.0001/);
 const layout=file('../src/story/StoryNativeStageTemplates.js');
 assert.match(layout,/WORKSHOP_PRESENTATION/);
});
test('R671 actual Yokohama Ferris wheel is selected before entering MeetScene',()=>{
 const source=file('../src/scenes/RaceScene.js');
 const k=source.indexOf("this.registry.set('meetLocation','yokohamaMinatoMirai')");
 const launch=source.indexOf("queueSafeSceneStart(this,'MeetScene')",k);
 assert.ok(k>=0&&launch>k);
 assert.match(source,/this\.cameras\.main\.fadeOut\(1100,0,0,0\)/);
 const stage=stageFor('FERRIS WHEEL');
 assert.equal(stage.backgroundId,'meet:yokohamaMinatoMirai:night');
 assert.equal(stage.meetCarLayout,'yokohamaGift');
 assert.equal(stage.meetCastLayout,'yokohamaGift');
 assert.deepEqual(stage.characters.map(x=>x.role),['yokohamaArkon','yokohamaSayaka']);
 assert.ok(stage.characters[1].flipX);
 const renderer=file('../src/ui/StoryStage.js');
 assert.match(renderer,/x:815,y:409,targetWidth:518/);
 assert.match(renderer,/x:402,feetY:599,height:299/);
 assert.match(renderer,/x:608,feetY:599,height:291/);
});
test('R671 restored couple art, no footer, and five-second fade BEFORE concluding popup',()=>{
 const finale=file('../src/ui/ArkonChapter06Finale.js');
 assert.match(finale,/assets\/Characters\/Main\/arkon_sayaka_watching\.png/);
 assert.match(finale,/backgroundId:'\$CURRENT_MEET'/);
 assert.match(finale,/duration:5000/);
 const end=finale.indexOf('duration:5000');
 const popup=finale.indexOf('showEndingCard);',end);
 assert.ok(end>=0&&popup>end);
 assert.doesNotMatch(finale,/fillRect\(/);
 assert.doesNotMatch(finale,/\.setDepth\(depth\+3\)/);
 assert.match(finale,/CHAPTER 06 COMPLETE/);
});
test('R671 scene transitions and post-manga scenery pauses require player Continue',()=>{
 const director=file('../src/story/StoryDirector.js');
 assert.match(director,/this\.session\.id==='arkonChapter06'\) &&/);
 assert.match(director,/type!=='MANGA'/);
 assert.match(director,/CONTINUE WHEN READY/);
 assert.match(director,/revealMs:950/);
 assert.match(director,/onContinue:/);
 for(const step of steps.filter(s=>s.type==='STAGE')){
   assert.ok(step.fadeInMs>=1000);
 }
 for(const step of steps.filter(s=>s.type==='HOLD_SCENE'&&
  s.caption==='ARKON DEN // EVERYTHING WE BUILT')){
   assert.ok(step.revealMs>=700);
 }
});
