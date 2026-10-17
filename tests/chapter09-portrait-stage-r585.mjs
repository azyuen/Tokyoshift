import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CHAPTER09_SEQUENCE,CHAPTER09_SCENES,chapter09TeamPortraitManga}
  from '../src/data/chapter09.js';
import {CHAPTER09_GROUPS,chapter09ShotAssets,CHAPTER09_STAGE_DEPTH}
  from '../src/ui/Chapter09EstablishingShot.js';
import {startChapter09} from '../src/ui/Chapter09Story.js';

const source=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const team=new Set(['sayakaFujieda','daichiSakamoto']);
const officials=new Set(['ryujiTakahashi','masatoKuroda','hiroshiSato','mikaHayaseChampion']);

test('Chapter 09 keeps its original 4 manga scenes, every dialogue line and authored pose',()=>{
  assert.equal(CHAPTER09_SEQUENCE.length,4);
  for(const id of CHAPTER09_SEQUENCE){
    const original=CHAPTER09_SCENES[id];
    const staged=chapter09TeamPortraitManga(id);
    assert.ok(staged,id);
    assert.equal(staged.id,id,'existing story save/seen ID');
    assert.equal(staged.once,original.once);
    assert.equal(staged.finalActionLabel,original.finalActionLabel);
    assert.equal(staged.pages.length,original.pages.length);
    assert.deepEqual(staged.pages.map(p=>p.text),original.pages.map(p=>p.text));
    assert.deepEqual(staged.pages.map(p=>p.speakerLabel),original.pages.map(p=>p.speakerLabel));
    for(let i=0;i<original.pages.length;i++){
      const from=original.pages[i],to=staged.pages[i];
      assert.equal(to.centerCharacter,'$PLAYER',id+' page '+i+' must keep player cameo');
      assert.ok(team.has(to.leftCharacter),id+' page '+i+' left is teammate');
      assert.ok(officials.has(to.rightCharacter),id+' page '+i+' right is venue team or Mika');
      const actor=from.leftCharacter;
      if(from.speaker==='right'){
        assert.equal(to.speaker,'center',id+' player speaks from third slot');
        assert.equal(to.centerPose,from.pose||'idle');
      }else if(team.has(actor)){
        assert.equal(to.speaker,'left',id+' teammates speak on LEFT');
        assert.equal(to.leftCharacter,actor);
        assert.equal(to.leftPose,from.leftPose||from.pose||'idle');
      }else{
        assert.equal(to.speaker,'right',id+' official and Mika speak on RIGHT');
        assert.equal(to.rightCharacter,actor);
        assert.equal(to.rightPose,from.leftPose||from.pose||'idle');
      }
    }
  }
  assert.equal(chapter09TeamPortraitManga('chapter09SeasonRegistration'),null,
    'other signing vignette must not be reformatted');
});

test('Mika speaks from the right in real idle and win poses while player stays left',()=>{
  const visitor=chapter09TeamPortraitManga('chapter09Visitor');
  const pages=visitor.pages.filter(p=>p.rightCharacter==='mikaHayaseChampion'&&p.speaker==='right');
  assert.ok(pages.length>=3);
  assert.ok(pages.some(p=>p.rightPose==='win'));
  assert.ok(pages.some(p=>p.rightPose==='idle'));
  assert.ok(visitor.pages.some(p=>p.speaker==='center'));
  const script=source('src/ui/Chapter09Story.js');
  assert.match(script,/chapter09TeamPortraitManga\(id\)/);
  assert.match(script,/playMangaCutscene\(scene,definition,\{/);
  assert.match(script,/chapter09RoomBackdrop:true/);
  assert.match(script,/stage\?\.showMika\?\./);
  assert.equal(typeof startChapter09,'function');
});

test('registration room cast is 150% R583 size and organically clustered',()=>{
  const left=CHAPTER09_GROUPS.left,right=CHAPTER09_GROUPS.right;
  const original=[280,279,290,286,271,270];
  const people=[...left,...right];
  people.forEach((p,i)=>{
    assert.equal(p.height,original[i]*1.5,'height must be 50% greater');
    assert.ok(p.x>=.18&&p.x<=.86,'keep group safely within frame');
  });
  assert.ok(left[2].x-left[0].x<.22,'player crew is closer together');
  assert.ok(right[2].x-right[0].x<.23,'venue staff are closer together');
  assert.ok(new Set(people.map(p=>p.feet)).size>=4,
    'organic staggered ground anchors');
  assert.ok(new Set(people.slice(1).map((p,i)=>
    Math.round((p.x-people[i].x)*100))).size>3,'not uniformly spaced');
  assert.equal(CHAPTER09_STAGE_DEPTH,810);
  const s={worldPhase:'night',registry:{get:k=>k==='playerCharacterId'?'renMizuno':null}};
  const resolved=chapter09ShotAssets(s);
  assert.equal(resolved.background.path,'assets/CentralTokyo/dragcomplex/regoroom_night.png');
  for(const p of [...resolved.left,...resolved.right,resolved.mika]){
    assert.ok(fs.existsSync(new URL('../'+p.asset.path,import.meta.url)),p.id);
  }
  const stage=source('src/ui/Chapter09EstablishingShot.js');
  assert.match(stage,/\(w\*\(isMika \? \.177 : right \? \.174 : \.18\)\)/);
  assert.match(stage,/const x=w\*entry\.x,footY=h\*entry\.feet/);
});

test('three manga slots and dimmed player cameo change only for Chapter 09',()=>{
  const manga=source('src/ui/MangaCutscene.js');
  assert.match(manga,/function frameFor\(scene, side, chapter09RoomBackdrop = false\)/);
  assert.match(manga,/if \(chapter09RoomBackdrop\) \{/);
  assert.match(manga,/x: width \* \.112/);
  assert.match(manga,/side === 'center' \? \(roomPortraits \? 12 : 18\) : 15/);
  assert.match(manga,/profile\.setAlpha\(dimmed \? \.55 : 1\)/);
  assert.match(manga,/chapter09PlayerSpeaking/);
  assert.match(manga,/chapter09RoomBackdrop \? 0\.20 : 0\.54/);
  assert.match(manga,/ignoreChapter09Stage: Boolean\(options\.chapter09RoomBackdrop\)/);
  const archive=source('src/ui/StoryArchivePanel.js');
  const tester=source('src/ui/CutsceneTester.js');
  assert.match(archive,/startChapter09\(scene,\{preview:true\}\)/);
  assert.match(tester,/startChapter09\(scene,\{preview:true\}\)/);
});
