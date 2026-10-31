import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { characters } from '../src/data/characters.js';
import { CUTSCENES } from '../src/data/cutscenes.js';
import { STORY_DIRECTOR_SCRIPTS } from '../src/data/storyDirectorScripts.js';
import { validateStoryScript } from '../src/story/StoryScript.js';
import { migrateArkonR748Checkpoint } from '../src/story/ArkonR748CheckpointMigration.js';
import { ARKON_CHAPTER_10 } from '../src/data/arkonChapter10.js';

const a=characters.sayakaFujieda.visual.poseAssets;
const pages=step=>step.pages||[];
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const steps=ARKON_CHAPTER_10.steps;
const at=fn=>steps.findIndex(fn);
const flag=name=>at(s=>s.type==='ARKON_CH10_'+name);

test('Four renamed white-blouse expressions are real home sprites, not Oshiage aliases',()=>{
 for(const [key,name] of Object.entries({homeAlert:'alert',homeConfident:'confident',
   homeContemplative:'contemplative',homeExplaining:'explaining'})){
   assert.ok(a[key],key);
   assert.equal(a[key].path,'assets/Characters/Main/home_sayaka_fujieda_'+name+'.png');
   assert.ok(existsSync(a[key].path),key);
 }
 for(const [key,filename] of Object.entries({oshiageTalking:'talking',
   oshiageExplaining:'talking',oshiageConcerned:'concerned'})){
   assert.equal(a[key].path,'assets/Characters/Main/oshiage_sayaka_fujieda_'+filename+'.png');
   assert.ok(existsSync(a[key].path));
 }
 assert.equal(a.homeExplaining.path.includes('oshiage_'),false);
});
test('Every explicit Sayaka pose in all 10 Aruken scripts resolves to a real asset',()=>{
 for(const script of Object.values(STORY_DIRECTOR_SCRIPTS)){
   if(!/^arkonChapter/.test(script.id))continue;
   assert.doesNotThrow(()=>validateStoryScript(script),script.id);
   for(const step of script.steps){
     if(step.type==='STAGE')for(const actor of step.characters||[]){
       if(actor.id!=='sayakaFujieda')continue;
       assert.ok(a[actor.pose],script.id+' stage pose '+actor.pose);
       assert.ok(existsSync(a[actor.pose].path),script.id+' image '+actor.pose);
     }
     if(step.type!=='MANGA')continue;
     for(const p of pages(step)){
       for(const side of ['left','right']){
         if(step.characters?.[side]!=='sayakaFujieda')continue;
         const pose=p[side+'Pose'];
         if(!pose)continue;
         assert.ok(a[pose],script.id+' '+step.title+' '+side+' '+pose);
         assert.ok(existsSync(a[pose].path),script.id+' missing '+a[pose].path);
       }
     }
   }
 }
});
test('Early Aruken off-duty wardrobe is casual while chapter 1 and school use actual uniform',()=>{
 const chapter=id=>STORY_DIRECTOR_SCRIPTS[id];
 const sayakaPoses=id=>chapter(id).steps.filter(s=>s.type==='MANGA')
   .flatMap(s=>s.characters?.right==='sayakaFujieda'?s.pages.map(p=>p.rightPose):[]);
 const c1=sayakaPoses('arkonChapter01Revised');
 assert.ok(c1.length>15);
 assert.ok(c1.every(p=>p?.startsWith('oshiage')), 'Chapter 1 navy-uniform presentation');
 for(const id of ['arkonChapter04','arkonChapter05','arkonChapter06']){
   const p=sayakaPoses(id);
   assert.ok(p.some(x=>x==='homeContemplative'),id+' contemplative');
   assert.ok(p.every(x=>!x?.startsWith('oshiage')),id+' in off-duty clothes');
 }
 const c2=chapter('arkonChapter02');
 const off=c2.steps.find(s=>s.title==='COFFEE AND A WORKBENCH');
 assert.ok(off.pages.every(p=>p.rightPose?.startsWith('home')));
 const school=c2.steps.find(s=>s.title==='A VERY FAMILIAR INSTRUCTOR');
 assert.ok(school.pages.every(p=>p.rightPose?.startsWith('oshiage')));
});
test('Career cutscenes, chapter 8, 9, Oshiage instructor and Ginza use valid wardrobe-specific expressions',()=>{
 for(const scene of Object.values(CUTSCENES)){
   for(const p of pages(scene)){
     for(const side of ['left','right']){
       const character=p[side+'Character']||scene.characters?.[side];
       if(character!=='sayakaFujieda')continue;
       const pose=p[side+'Pose']||p.pose;
       if(!pose||pose==='idle')continue;
       assert.ok(a[pose],scene.id+' '+pose);
       assert.ok(existsSync(a[pose].path),scene.id+' '+pose+' image');
     }
   }
   if(scene.callerId==='sayakaFujieda'&&scene.callerPose){
     assert.ok(a[scene.callerPose],scene.id+' callerPose '+scene.callerPose);
   }
 }
 assert.equal(CUTSCENES.openingSayakaKeys.pages[4].pose,'homeExplaining');
 assert.equal(CUTSCENES.openingSayakaPhoneCall.callerPose,'homeNormal');
 assert.equal(CUTSCENES.oshiageInstructorFirstEncounter.pages[2].pose,'oshiageExplaining');
 assert.equal(CUTSCENES.tokyoChampionshipVictory.pages[2].leftPose,'trackHappy');
});
test('Chapter 10 only travels into the future once, after a real partnership and support seed',()=>{
 assert.ok(flag('GINZA')>flag('SELL_Z'));
 assert.ok(flag('INVEST')>flag('GINZA'));
 const jump=at(s=>s.type==='ARKON_CH10_TIME_JUMP');
 assert.ok(jump>flag('INVEST'));
 assert.equal(steps[jump].title,'A FEW YEARS LATER');
 assert.equal(steps[jump].durationMs,5500);
 assert.ok(jump<flag('DRIVE'));
 const promise=steps.find(s=>s.title==='A RARE MOMENT OF DOUBT');
 assert.match(pages(promise).map(p=>p.text).join(' '),/This was your idea.*Half each/);
 assert.equal(steps.filter(s=>s.type==='ARKON_CH10_DRIVE').length,1);
 assert.equal(steps.filter(s=>s.type==='ARKON_CH10_FINALE').length,1);
 assert.ok(flag('DRIVE')<flag('YOKOHAMA'));
 assert.ok(flag('YOKOHAMA')<flag('FINALE'));
 const later=steps.find(s=>s.title==='AN EVENING TOGETHER');
 assert.match(pages(later).map(p=>p.text).join(' '),/booked us dinner in Yokohama/);
 assert.match(pages(later).map(p=>p.text).join(' '),/I would like to stay with the team/);
 const last=steps.find(s=>s.title==='THE SAME VIEW');
 assert.equal(last.pages.at(-1).text,'Very.');
 assert.deepEqual(steps.find(s=>s.type==='STAGE'&&s.meetCarLayout==='yokohamaFinale').cars,
   [{carId:'rwbStellaPorsche'}]);
 assert.match(source('src/ui/ArkonChapter10Finale.js'),/arkon_sayaka_holdinghands.png/);
});
test('R748 migration remaps old endgame checkpoints without replaying sale or race',()=>{
 const compiled={script:ARKON_CHAPTER_10};
 const s=v=>({get:k=>v[k]});
 const old={id:'arkonChapter10',index:120,vars:{storyR679:true}};
 const started=migrateArkonR748Checkpoint(compiled,old,s({arkonStoryGinzaPartnership:{status:'open'}}));
 assert.equal(steps[started.index].type,'ARKON_CH10_INVEST');
 const funded=migrateArkonR748Checkpoint(compiled,old,s({arkonStoryCareerSeed:{supportedWorkshop:'daichiSakamoto'}}));
 assert.equal(steps[funded.index].type,'ARKON_CH10_TIME_JUMP');
 const cruising=migrateArkonR748Checkpoint(compiled,old,s({arkonStoryChapter10Cruise:{active:true,completed:false}}));
 assert.equal(steps[cruising.index-1].type,'ARKON_CH10_DRIVE');
 const finished=migrateArkonR748Checkpoint(compiled,old,s({arkonStoryChapter10CruiseFinished:true}));
 assert.equal(steps[finished.index].type,'ARKON_CH10_YOKOHAMA');
 assert.equal(migrateArkonR748Checkpoint(compiled,{...old,vars:{storyR748:true}},s({})),null);
});
