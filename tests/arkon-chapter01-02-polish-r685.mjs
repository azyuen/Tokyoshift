import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {ARKON_CHAPTER_01_REVISED as C1} from '../src/data/arkonChapter01Revised.js';
import {ARKON_CHAPTER_02 as C2} from '../src/data/arkonChapter02.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {getNativeCastPlacement} from '../src/story/StoryNativeStageTemplates.js';
import {getCharacterVisualAsset} from '../src/data/characters.js';
import {getArkonStoryObjective} from '../src/ui/ArkonStoryObjective.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scene=(chapter,title)=>chapter.steps.find(s=>s.type==='MANGA'&&s.title===title);
const template={kind:'meet',frame:{x:24,y:92,w:1138,h:528},
  character:{x:279,feetY:616,height:315},car:{x:593},castGap:175,observerX:1042};

test('R685 Ch1 repair tableau keeps Aruken standing with couple and Sayaka upstage at 80%',()=>{
 const stage=C1.steps.find(s=>s.type==='STAGE'&&
   s.characters?.some(a=>a.role==='chapter01RepairSayaka'));
 assert.ok(stage);
 assert.ok(stage.characters.some(a=>a.id==='arkonDen'&&a.pose==='storyMechanic'));
 assert.ok(!stage.characters.some(a=>a.pose==='storyMechanicCrouch'));
 assert.equal(stage.characters.at(-1).id,'sayakaFujieda');
 assert.equal(stage.characters.at(-1).pose,'homeNormal');
 const sayaka=getNativeCastPlacement(template,3,4,'chapter01RepairSayaka');
 const aruken=getNativeCastPlacement(template,2,4,'chapter01RepairAruken');
 assert.equal(sayaka.height/template.character.height,0.8);
 assert.ok(sayaka.feetY<aruken.feetY);
 assert.ok(sayaka.x>aruken.x);
 assert.match(read('src/ui/StoryStage.js'),/chapter01RepairSayaka'\?portraitDepth-3/);
 assert.ok(scene(C1,'A DIFFERENT SORT OF RACER').pages.some(p=>p.leftPose==='storyMechanicCrouch'));
});

test('R685 Ch1 uses varied casual Sayaka sprites, not instructor thumbs-up at meets',()=>{
 const sayakaScenes=C1.steps.filter(s=>s.type==='MANGA'&&
   s.characters?.right==='sayakaFujieda');
 const poses=new Set(sayakaScenes.flatMap(s=>s.pages.map(p=>p.rightPose)));
 for(const pose of ['homeNormal','homeHappy','homeSerious','homeSad','homeBlushing'])
   assert.ok(poses.has(pose),pose);
 assert.equal([...poses].some(p=>String(p).startsWith('oshiage')),false);
 for(const pose of poses) {
   const art=getCharacterVisualAsset('sayakaFujieda',pose);
   assert.ok(art&&!art.fallback,pose);
   assert.ok(existsSync(new URL('../'+art.path,import.meta.url)),pose);
 }
});

test('R685 Forester first meeting is standing; crouch appears after dialogue with user pause',()=>{
 const stages=C2.steps.map((s,i)=>({...s,index:i})).filter(s=>
   s.type==='STAGE'&&s.backgroundId==='meet:daikokuOpenLot:day');
 assert.equal(stages.length,2);
 const [intro,inspection]=stages;
 assert.ok(intro.characters.some(a=>a.id==='arkonDen'&&a.pose==='storyMechanic'));
 assert.ok(inspection.characters.some(a=>a.id==='arkonDen'&&a.pose==='storyMechanicCrouch'));
 assert.equal(C2.steps[inspection.index-1].title,'SOMETHING OTHER THAN RACING');
 assert.equal(C2.steps[inspection.index+1].type,'HOLD_SCENE');
 assert.equal(C2.steps[inspection.index+1].label,'INSPECT THE FORESTER');
 assert.equal(C2.steps[inspection.index+2].title,'ANOTHER LIFE');
 assert.equal(C2.steps.filter(s=>s.type==='ARKON_DOCK_PAYMENT').length,1);
});

test('R685 named Shibuya driver Rina is larger on native meet stage',()=>{
 const stage=C2.steps.find(s=>s.type==='STAGE'&&s.characters?.some(a=>
   a.role==='chapter02ShibuyaRina'));
 assert.ok(stage);
 assert.equal(stage.cars[0].carId,'s15');
 const rina=getNativeCastPlacement(template,1,3,'chapter02ShibuyaRina');
 assert.ok(rina.height>=1.1*template.character.height);
});

test('R685 Oshiage basic and advanced lessons ALWAYS use instructor portraits',()=>{
 const race=read('src/scenes/RaceScene.js');
 assert.match(race,/const tutorialQueued=this.registry.get\('selectedRaceCategory'\)==='TUTORIAL'/);
 assert.match(race,/const oshiageInstructorLesson=tutorialQueued/);
 assert.match(race,/raceDistrict'\)\|\|''\)\.toUpperCase\(\)==='OSHIAGE'/);
 assert.match(race,/if \(this.isCoaching \|\| oshiageInstructorLesson\)/);
 assert.match(race,/const atSchool=this.registry.get\('raceReturnScene'\)==='OshiageScene'/);
 assert.match(race,/characterSayakaOshiage/);
 assert.match(race,/setupCoachedLesson\(\)/);
 const chapterSchool=['A VERY FAMILIAR INSTRUCTOR','A DIFFERENT KIND OF TALENT'];
 for(const name of chapterSchool)assert.ok(
   scene(C2,name).pages.some(p=>p.rightPose?.startsWith('oshiage')),name);
 const oshiage=read('src/scenes/OshiageScene.js');
 assert.match(oshiage,/oshiageExplaining/);
 assert.match(oshiage,/oshiageHappy/);
});

test('R685 Ch2 drive dialogue is paced by BOTH elapsed time and distance, not acceleration',()=>{
 const race=read('src/scenes/RaceScene.js');
 const start=race.indexOf('updateArkonStoryCruise(telemetry)');
 const end=race.indexOf('endArkonStoryCruise()',start);
 const part=race.slice(start,end);
 assert.match(part,/const elapsed=Math.max\(0,this.raceClock-this.greenClock\)/);
 assert.match(part,/if\(elapsed<seconds\|\|travelled<metres\)break/);
 assert.match(part,/elapsed>=31 && travelled>=550/);
 assert.doesNotMatch(part,/the Civic/i);
 assert.match(part,/240Z drives beautifully/);
 assert.match(race,/createGinzaBanterHud\(this,\{storyCruise:true,homeClothes:true\}\)/);
 assert.match(read('src/ui/GinzaBanterHud.js'),/homeClothes=false/);
});

test('R685 chapter-only wider bottom-right prompt and story reason to race',()=>{
 const prompt=read('src/ui/StoryContinuePrompt.js');
 assert.match(prompt,/Math.min\(455,stage.w-36\)/);
 assert.match(prompt,/replace\(\/\^ARUKEN DENZAKI/);
 const reg={get:k=>({gameMode:'arkonStory',arkonStoryPhase:'chapter02AfterWorkshop',
   storyDirectorProgress:{id:'arkonChapter02',index:10,vars:{ch2BeforeFriendlyRace:9}},
   wins:10})[k]};
 const obj=getArkonStoryObjective(reg);
 assert.equal(obj.heading,'PAY THE BILLS');
 assert.match(obj.message,/bills still need paying/i);
 assert.doesNotMatch(obj.message,/Daigo/i);
});

test('R685 old Chapter 2 numeric checkpoints account for two new steps only once',()=>{
 const code=read('src/story/StoryDirector.js');
 assert.match(code,/checkpoint.id==='arkonChapter02' && !checkpoint.vars\?\.storyR685/);
 assert.match(code,/oldIndex>=next-2\?oldIndex\+2:oldIndex/);
 assert.match(code,/storyR685:true/);
 assert.match(code,/savedIndex===0 && id==='arkonChapter02'/);
 assert.doesNotThrow(()=>validateStoryScript(C1));
 assert.doesNotThrow(()=>validateStoryScript(C2));
});
