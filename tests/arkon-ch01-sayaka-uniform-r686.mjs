import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {ARKON_CHAPTER_01 as original} from '../src/data/arkonChapter01.js';
import {ARKON_CHAPTER_01_REVISED as revised} from '../src/data/arkonChapter01Revised.js';
import {ARKON_CHAPTER_01_EXTENDED_STEPS as extended} from '../src/data/arkonChapter01Extended.js';
import {getCharacterVisualAsset} from '../src/data/characters.js';
import {validateStoryScript} from '../src/story/StoryScript.js';

const fullPath=path=>new URL('../'+path,import.meta.url);
const suit='assets/Characters/Main/oshiage_sayaka_fujieda_';

test('R686: all Sayaka stage sprites in both Chapter 1 editions are Oshiage uniform',()=>{
  for(const [name,steps]of [['revised',revised.steps],['original',original.steps],['extended',extended]]){
    const poses=steps.filter(x=>x.type==='STAGE').flatMap(x=>x.characters||[])
      .filter(x=>x.id==='sayakaFujieda').map(x=>x.pose);
    assert.ok(poses.length>0,name);
    for(const pose of poses){
      assert.match(pose,/^oshiage/,name+' '+pose);
      const asset=getCharacterVisualAsset('sayakaFujieda',pose);
      assert.ok(asset?.path?.startsWith(suit),name+' '+pose);
      assert.ok(existsSync(fullPath(asset.path)),asset.path);
    }
  }
});

test('R686: Sayaka speaking and listening manga portraits NEVER fall back to home outfit',()=>{
  for(const [name,steps]of [['revised',revised.steps],['original',original.steps],['extended',extended]]){
    let seen=0;
    for(const scene of steps.filter(x=>x.type==='MANGA'&&x.characters?.right==='sayakaFujieda')){
      for(const page of scene.pages){
        assert.ok(page.rightPose, name+': '+scene.title+' lacks listener pose');
        assert.match(page.rightPose,/^oshiage/, name+': '+scene.title);
        const art=getCharacterVisualAsset('sayakaFujieda',page.rightPose);
        assert.ok(art?.path?.startsWith(suit),name+': '+page.rightPose);
        assert.ok(existsSync(fullPath(art.path)),art.path);
        seen++;
      }
    }
    assert.ok(seen>=5,name+' should exercise real manga pages');
  }
});

test('R686: revised Chapter 1 expression variety includes non-thumbs-up options',()=>{
  const poses=new Set(revised.steps.filter(x=>x.type==='MANGA'&&
    x.characters?.right==='sayakaFujieda').flatMap(x=>x.pages.map(y=>y.rightPose)));
  for(const pose of ['oshiageNeutral','oshiageHappy','oshiageSerious',
    'oshiageTalking','oshiageReviewing','oshiageConcerned','oshiageRelaxed'])
    assert.ok(poses.has(pose),pose+' absent');
  assert.doesNotMatch(readFileSync(fullPath('src/data/arkonChapter01Revised.js'),'utf8'),
    /'home(?:Normal|Happy|Serious|Sad|Blushing)'/);
  assert.doesNotMatch(readFileSync(fullPath('src/data/arkonChapter01Extended.js'),'utf8'),
    /'home(?:Normal|Happy|Serious|Sad|Blushing)'/);
  assert.doesNotMatch(readFileSync(fullPath('src/data/arkonChapter01.js'),'utf8'),
    /'home(?:Normal|Happy|Serious|Sad|Blushing)'/);
});

test('R686: the existing Chapter 1 repair tableau and Chapter 2 school reveal remain unchanged',()=>{
  const rescue=revised.steps.find(x=>x.type==='STAGE'&&x.characters?.some(a=>a.role==='chapter01RepairSayaka'));
  assert.equal(rescue.characters.at(-1).pose,'oshiageNeutral');
  assert.ok(rescue.characters.some(x=>x.id==='arkonDen'&&x.pose==='storyMechanic'));
  assert.equal(original.steps.at(-1).type,'END');
  assert.doesNotThrow(()=>validateStoryScript(revised));
  assert.doesNotThrow(()=>validateStoryScript(original));
  const observer=readFileSync(fullPath('src/ui/ArkonStoryMeetObserver.js'),'utf8');
  assert.match(observer,/oshiage_sayaka_fujieda_neutral\.png/);
  const chapter2=readFileSync(fullPath('src/data/arkonChapter02.js'),'utf8');
  assert.match(chapter2,/A VERY FAMILIAR INSTRUCTOR/);
  assert.match(chapter2,/oshiageHappy/);
});
