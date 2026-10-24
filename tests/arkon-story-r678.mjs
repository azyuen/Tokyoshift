// R678 — Story Mode J-drama foundations, exact existing cast and specialist links.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {ARKON_CHAPTER_01_REVISED as C1} from '../src/data/arkonChapter01Revised.js';
import {ARKON_CHAPTER_02 as C2} from '../src/data/arkonChapter02.js';
import {ARKON_CHAPTER_03 as C3} from '../src/data/arkonChapter03.js';
import {ARKON_CHAPTER_04 as C4} from '../src/data/arkonChapter04.js';
import {ARKON_CHAPTER_05 as C5} from '../src/data/arkonChapter05.js';
import {ARKON_CHAPTER_07 as C7} from '../src/data/arkonChapter07.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {TUNER_SHOPS} from '../src/data/tunerShops.js';
import {getCharacterVisualAsset} from '../src/data/characters.js';
const pages=script=>script.steps.filter(s=>s.type==='MANGA').flatMap(s=>s.pages||[]);
const text=script=>pages(script).map(p=>p.text).join(' ');
const stageWith=(script,id)=>script.steps.find(s=>s.type==='STAGE'&&s.characters?.some(a=>a.id===id));
test('R678 all modified story scripts validate and respect stable chapter identities',()=>{
 for(const script of [C1,C2,C3,C4,C5,C7])assert.doesNotThrow(()=>validateStoryScript(script));
 assert.equal(C1.id,'arkonChapter01Revised');
 assert.equal(C2.id,'arkonChapter02');
 assert.equal(C7.id,'arkonChapter07');
});
test('Aoi and boyfriend Haru use Career character IDs and the real 240Z',()=>{
 const repair=stageWith(C1,'aoiShindou');
 assert.ok(repair);
 assert.ok(repair.characters.some(a=>a.id==='haruSakurai'));
 assert.equal(repair.cars[0].carId,'240z');
 for(const [id,file] of [
   ['aoiShindou','assets/Characters/Odaiba/aoi_shindou_idle.png'],
   ['haruSakurai','assets/Characters/Shibuya/haru_sakurai_idle.png'],
 ]){
   assert.equal(getCharacterVisualAsset(id,'idle').path,file);
   assert.ok(existsSync(file));
 }
 const repairAt=C1.steps.indexOf(repair);
 const contactAt=C1.steps.findIndex(s=>s.type==='CHOICE'&&s.key==='arkonSayakaFirstContact');
 assert.ok(repairAt>=0&&contactAt>repairAt);
 assert.match(text(C1),/dinner/i);
 assert.match(text(C1),/connection/i);
});
test('Sayaka sees engineering kindness before learning Aruken has professional experience',()=>{
 assert.ok(C2.steps.some(s=>s.type==='STAGE'&&s.backgroundId==='meet:shibuyaDogenzaka:night'&&
   s.characters?.some(c=>c.id==='rinaTachibana')&&s.cars?.some(c=>c.carId==='s15')));
 const choice=C2.steps.findIndex(s=>s.type==='CHOICE'&&s.key==='arkonShibuyaDisclosure');
 const reveal=C2.steps.findIndex(s=>s.type==='SET_FLAG'&&s.key==='arkonStorySchoolRevealed');
 assert.ok(choice>0&&reveal>choice);
 assert.equal(C1.steps.some(s=>s.key==='arkonStorySchoolRevealed'),false);
 const skip=C2.steps.find(s=>s.type==='IF'&&s.key==='arkonStorySchoolRevealed');
 assert.ok(skip,'existing completed lessons must not be repeated');
 assert.match(text(C2),/looking at her/i);
 assert.match(text(C2),/proper paddock work|professional racing/i);
});
test('Actual regional mechanics and exact shops recur in the story and 240Z payoff',()=>{
 const expected={
   ODAIBA:['takumiSerizawa','ESPRIT'],
   SHINAGAWA:['natsumiKagawa','ZERO/SPORTS'],
   TATSUMI:['tetsuNakahara','ENGINE INTERNALS'],
   SHIBUYA:['itsukiKuroda','EXHAUST & FLOW'],
   YOKOHAMA:['reinaKuroda','ECU & RESPONSE'],
   DAIKOKU:['naoFujita','COOLING & FLOW'],
   SHINJUKU:['daigoArakawa','TURBO & BOOST'],
 };
 const early=[C3,C4,C5];
 for(const [region,[actor,shop]] of Object.entries(expected)){
   const def=TUNER_SHOPS[region];
   assert.equal(def.mechanicId,actor);
   assert.ok(def.specialty===shop||def.label===shop);
   assert.ok(early.some(s=>stageWith(s,actor)),'Missing earned early scene for '+actor);
   assert.ok(stageWith(C7,actor),'Missing Chapter 07 return for '+actor);
   const visual=getCharacterVisualAsset(actor,'idle');
   assert.ok(visual?.path&&existsSync(visual.path));
 }
 const vignettes=C7.steps.filter(s=>s.type==='STAGE'&&String(s.backgroundId).startsWith('tuner:'));
 assert.ok(vignettes.length>=7);
 assert.equal(C7.steps.filter(s=>s.type==='ARKON_CH7_WORK').length,2);
 assert.equal(C7.steps.filter(s=>s.type==='ARKON_CH7_CONVERT').length,1);
});
test('Chapter 7 retains the emotional distance and Chapter 10 Career origins remain distinct',()=>{
 assert.match(text(C7),/dinner/i);
 assert.match(text(C7),/Sayaka/i);
 assert.match(text(C7),/what on earth have you done/i);
 const ch10=readFileSync(new URL('../src/data/arkonChapter10.js',import.meta.url),'utf8');
 assert.match(ch10,/GINZA GALLERY/);
 assert.match(ch10,/arkonLibertyWalk240z/);
 const ch7source=readFileSync(new URL('../src/data/arkonChapter07Progress.js',import.meta.url),'utf8');
 assert.match(ch7source,/getInstalledSpecialistTuning/);
 assert.match(ch7source,/treatmentGoal=a.stage<=1\?0:7/);
});
