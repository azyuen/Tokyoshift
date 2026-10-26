import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';
import {STORY_DIRECTOR_SCRIPTS as scripts} from '../src/data/storyDirectorScripts.js';
import {getCharacterVisualAsset} from '../src/data/characters.js';
import {getArukenGuests,getArukenCarBay,getArukenActorPlacement} from '../src/story/ArukenStageLayout.js';
import {getNativeStoryStageTemplate} from '../src/story/StoryNativeStageTemplates.js';
import {getStoryBackground} from '../src/data/storyBackgroundCatalog.js';
const before=JSON.parse(readFileSync(new URL('./fixtures/aruken-before-audit.json',import.meta.url)));
const omit=new Set(['leftPose','rightPose','holdAfter','awaitArrival','population','meetDuel','backgroundId','pose']);
const clean=x=>Array.isArray(x)?x.map(clean):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().filter(k=>!omit.has(k)).map(k=>[k,clean(x[k])])):x;
for(const [id,expected]of Object.entries(before))test(id+': dialogue, action parameters and save positions unchanged',()=>{
 const script=scripts[id];assert.equal(script.steps.length,expected.steps);
 assert.equal(createHash('sha256').update(JSON.stringify(clean(script))).digest('hex'),expected.hash);
});
test('all authored stage and manga assets exist',()=>{
 for(const [id,script]of Object.entries(scripts).filter(([k])=>k.startsWith('arkonChapter'))){
  for(const s of script.steps){
   const cast=s.type==='STAGE'?(s.characters||[]):s.type==='MANGA'?(s.pages||[]).flatMap(p=>['left','right'].filter(side=>s.characters?.[side]).map(side=>({id:s.characters[side],pose:p[side+'Pose']||'idle'}))):[];
   for(const actor of cast){const asset=getCharacterVisualAsset(actor.id,actor.pose);assert.ok(asset,id+' '+actor.id+' '+actor.pose);assert.ok(existsSync(new URL('../'+asset.path,import.meta.url)),asset.path);}
  }
 }
 for(const guest of getArukenGuests('gala'))assert.ok(existsSync(new URL('../'+guest.asset.path,import.meta.url)));
});
test('native geometry is reused only for Aruken across scene owners; Rina does not overlap Sayaka',()=>{
 const profile=getStoryBackground('meet:shibuyaScramble:night');
 const template=getNativeStoryStageTemplate(profile,{sys:{settings:{key:'GarageScene'}},registry:{get:()=> 'arkonStory'}});
 assert.ok(template);assert.equal(getNativeStoryStageTemplate(profile,{sys:{settings:{key:'GarageScene'}},registry:{get:()=> 'career'}}),null);
 const rina=getArukenActorPlacement(template,{role:'chapter02ShibuyaRina'},1,3),sayaka=getArukenActorPlacement(template,{},2,3);
 assert.equal(rina.height,template.character.height);assert.ok(sayaka.x-rina.x>170);
 const a=getArukenCarBay(template,0,2),b=getArukenCarBay(template,1,2);assert.ok(b.x-a.x>(a.targetWidth+b.targetWidth)/2);
});
test('party populations and contemplative pauses do not spill into private finale',()=>{
 assert.equal(getArukenGuests('gala').length,8);assert.equal(getArukenGuests('invitational').length,6);assert.equal(getArukenGuests(null).length,0);
 assert.ok(scripts.arkonChapter01Revised.steps.find(s=>s.title==='AN OLD DATSUN').holdAfter);
 assert.equal(scripts.arkonChapter09.steps.find(s=>s.title==='THE ROAD HOME').pages[0].leftPose,'devSerious');
});
