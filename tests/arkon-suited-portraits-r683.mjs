import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {characters,getCharacterVisualAsset} from '../src/data/characters.js';
import {resolveArkonSuitedMangaPose} from '../src/data/arkonSuitedMangaPose.js';
import {ARKON_CHAPTER_07} from '../src/data/arkonChapter07.js';
import {ARKON_CHAPTER_08} from '../src/data/arkonChapter08.js';
import {ARKON_CHAPTER_09} from '../src/data/arkonChapter09.js';
import {ARKON_CHAPTER_10} from '../src/data/arkonChapter10.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const scene=(chapter,title)=>chapter.steps.find(x=>x.type==='MANGA'&&x.title===title);
const all=[ARKON_CHAPTER_07,ARKON_CHAPTER_08,ARKON_CHAPTER_09,ARKON_CHAPTER_10];

test('R683 all 8 Dev suited portrait expressions have registered, existing PNG paths',()=>{
  const entries={
    devIdle:'arkon_den_idle.png',
    devTalking:'arkon_den_talking.png',
    devLaughing:'arkon_den_laughing.png',
    devSerious:'arkon_den_serious.png',
    devAngry:'arkon_den_angry.png',
    devBlushing:'arkon_den_blushing.png',
    devNervous:'arkon_den_nervous.png',
    devSad:'arkon_den_sad.png'
  };
  for(const [pose,filename] of Object.entries(entries)){
    const asset=getCharacterVisualAsset('arkonDen',pose);
    assert.ok(asset,pose);
    assert.equal(asset.path,'assets/Characters/Dev/'+filename);
    assert.equal(asset.fallback,false,pose);
    assert.ok(existsSync(new URL('../'+asset.path,import.meta.url)),pose);
  }
  assert.equal(characters.arkonDen.visual.poseAssets.ginzaSuit.path,
    'assets/Characters/Main/arkon_den_suit.png');
});

test('R683 generic ginzaSuit manga poses use suited faces on both speaker and listener sides',()=>{
  assert.equal(resolveArkonSuitedMangaPose('arkonDen','ginzaSuit',true),'devTalking');
  assert.equal(resolveArkonSuitedMangaPose('arkonDen','ginzaSuit',false),'devIdle');
  assert.equal(resolveArkonSuitedMangaPose('arkonDen','devAngry',true),'devAngry');
  assert.equal(resolveArkonSuitedMangaPose('arkonDen','devSad',false),'devSad');
  assert.equal(resolveArkonSuitedMangaPose('arkonDen','storyMechanic',true),'storyMechanic');
  assert.equal(resolveArkonSuitedMangaPose('sayakaFujieda','ginzaSuit',true),'ginzaSuit');
  const renderer=read('../src/ui/MangaCutscene.js');
  assert.match(renderer,/desiredPose\(page,side,'idle',id\)/);
  assert.match(renderer,/desiredPose\(page, side, current\?\.pose \|\| 'idle', characterId\)/);
  assert.match(renderer,/resolveArkonSuitedMangaPose\(characterId,pose,page\?\.speaker===side\)/);
});

test('R683 suited Ch7 opening uses blush where appropriate and stage keeps its full-body suit',()=>{
  const opening=scene(ARKON_CHAPTER_07,'A NEW LOOK');
  assert.ok(opening);
  assert.equal(opening.pages.find(p=>p.text?.includes('compliment'))?.leftPose,'devBlushing');
  assert.ok(opening.pages.every(p=>['ginzaSuit','devBlushing'].includes(p.leftPose)));
  assert.ok(ARKON_CHAPTER_07.steps.some(s=>s.type==='STAGE'&&
    s.characters?.some(c=>c.id==='arkonDen'&&c.pose==='ginzaSuit')));
  assert.ok(scene(ARKON_CHAPTER_07,'THE BUSINESS IS BOOMING')
    .pages.every(p=>p.leftPose==='storyMechanic'));
});

test('R683 Ch8 gala anger, fear, and vulnerability are expressed in the suit, including post-signature aftermath',()=>{
  const dinner=scene(ARKON_CHAPTER_08,'A DIFFERENT SIDE OF TOKYO');
  assert.equal(dinner.pages.find(p=>p.text==='You look incredible.')?.leftPose,'devBlushing');
  const confrontation=scene(ARKON_CHAPTER_08,'EVERYTHING HAS CHANGED');
  assert.ok(confrontation.pages.some(p=>p.leftPose==='devAngry'));
  assert.ok(confrontation.pages.some(p=>p.leftPose==='devNervous'));
  assert.ok(confrontation.pages.every(p=>p.leftPose==='ginzaSuit'||
    p.leftPose.startsWith('dev')));
  const aftermath=scene(ARKON_CHAPTER_08,'THE PRICE OF AMBITION');
  assert.deepEqual(aftermath.pages.map(p=>p.leftPose),['devNervous','devSad']);
  assert.ok(ARKON_CHAPTER_08.steps.some(s=>s.type==='STAGE'&&
    s.characters?.some(c=>c.id==='arkonDen'&&c.pose==='ginzaSuit')));
  assert.equal(scene(ARKON_CHAPTER_08,'THE AFTERNOON COFFEE').pages[0].leftPose,'storyIdle');
});

test('R683 Ch9 final confrontation preserves suit when VIP speaks and serious expression when Aruken replies',()=>{
  const refusal=scene(ARKON_CHAPTER_09,'ONE LAST DOCUMENT');
  assert.ok(refusal.pages.every(p=>['ginzaSuit','devSerious'].includes(p.leftPose)));
  assert.equal(refusal.pages.find(p=>p.speaker==='right')?.leftPose,'ginzaSuit');
  const exit=scene(ARKON_CHAPTER_09,'AN EXIT');
  assert.ok(exit.pages.every(p=>['ginzaSuit','devSerious'].includes(p.leftPose)));
  assert.ok(exit.pages.every(p=>p.rightPose==='ginzaDress'));
  assert.equal(scene(ARKON_CHAPTER_09,'THE ROAD HOME').pages[0].leftPose,'storySerious');
});

test('R683 Ch10 warm gallery, serious reassurance and nervous invitation stay in suit',()=>{
  const gallery=scene(ARKON_CHAPTER_10,'GINZA GALLERY');
  assert.equal(gallery.pages[0].leftPose,'devLaughing');
  const reassurance=scene(ARKON_CHAPTER_10,'A RARE MOMENT OF DOUBT');
  assert.ok(reassurance.pages.some(p=>p.leftPose==='devSerious'));
  const invitation=scene(ARKON_CHAPTER_10,'ONE MORE EVENING');
  assert.ok(invitation.pages.some(p=>p.leftPose==='devBlushing'));
  assert.ok(invitation.pages.some(p=>p.leftPose==='devNervous'));
  for(const title of ['GINZA GALLERY','SOMETHING WE BUILT TOGETHER','A RARE MOMENT OF DOUBT','ONE MORE EVENING']){
    assert.ok(scene(ARKON_CHAPTER_10,title).pages.every(p=>p.leftPose==='ginzaSuit'||
      p.leftPose.startsWith('dev')),title);
  }
  assert.equal(scene(ARKON_CHAPTER_10,'A LITTLE OPPORTUNITY').pages[0].leftPose,'storyIdle');
});

test('R683 new art/pose selection does not change scripted events or chapter indices',()=>{
  for(const chapter of all){
    assert.doesNotThrow(()=>validateStoryScript(chapter));
    assert.deepEqual(STORY_DIRECTOR_SCRIPTS[chapter.id],chapter);
    assert.equal(chapter.steps.at(-1).type,'END');
  }
  assert.match(read('../src/data/storyDirectorScripts.js'),/ginzaSuit/);
});
