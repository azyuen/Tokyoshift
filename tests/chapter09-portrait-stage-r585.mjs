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

test('four Chapter 09 dialogue scenes use two standard portraits, team LEFT and officials RIGHT',()=>{
  assert.equal(CHAPTER09_SEQUENCE.length,4);
  for(const id of CHAPTER09_SEQUENCE){
    const original=CHAPTER09_SCENES[id];
    const staged=chapter09TeamPortraitManga(id);
    assert.ok(staged,id);
    assert.equal(staged.id,id,'career save and chapter history flags preserved');
    assert.equal(staged.once,original.once);
    assert.equal(staged.finalActionLabel,original.finalActionLabel);
    assert.equal(staged.pages.length,original.pages.length);
    assert.deepEqual(staged.pages.map(p=>p.text),original.pages.map(p=>p.text));
    assert.deepEqual(staged.pages.map(p=>p.speakerLabel),original.pages.map(p=>p.speakerLabel));
    assert.equal(Object.hasOwn(staged.characters,'center'),false);
    for(let i=0;i<original.pages.length;i++){
      const from=original.pages[i],to=staged.pages[i];
      assert.equal(Object.hasOwn(to,'centerCharacter'),false);
      assert.equal(Object.hasOwn(to,'centerPose'),false);
      assert.ok(team.has(to.leftCharacter)||to.leftCharacter==='$PLAYER',id+' left is crew');
      assert.ok(officials.has(to.rightCharacter),id+' right is venue team or Mika');
      const actor=from.leftCharacter;
      if(from.speaker==='right'){
        assert.equal(to.speaker,'left',id+' player speaks from crew LEFT');
        assert.equal(to.leftCharacter,'$PLAYER');
        assert.equal(to.leftPose,from.pose||'idle');
      }else if(team.has(actor)){
        assert.equal(to.speaker,'left',id+' team on LEFT');
        assert.equal(to.leftCharacter,actor);
        assert.equal(to.leftPose,from.leftPose||from.pose||'idle');
      }else{
        assert.equal(to.speaker,'right',id+' officials and Mika on RIGHT');
        assert.equal(to.rightCharacter,actor);
        assert.equal(to.rightPose,from.leftPose||from.pose||'idle');
      }
    }
  }
  assert.equal(chapter09TeamPortraitManga('chapter09SeasonRegistration'),null,
    'standalone Pro Season signing scene unchanged');
});

test('three of Daichi’s lines now come from player without changing text or losing his banter',()=>{
  const owner=CHAPTER09_SCENES.chapter09OldGuard.pages;
  const rules=CHAPTER09_SCENES.chapter09Rules.pages;
  const end=CHAPTER09_SCENES.chapter09Welcome.pages;
  for(const [pages,line] of [
    [owner,'Wait. You two know each other?'],
    [rules,'So we can race here without signing away the next eight weekends?'],
    [end,'You really know how to motivate people.'],
  ]){
    const match=pages.find(p=>p.text===line);
    assert.ok(match,line);
    assert.equal(match.speaker,'right','canonical player line mapped LEFT by adapter');
  }
  assert.ok(rules.some(p=>p.leftCharacter==='daichiSakamoto'&&p.text==='Race fast. Win money. Easy.'));
  assert.ok(CHAPTER09_SCENES.chapter09Visitor.pages.some(p=>
    p.leftCharacter==='daichiSakamoto'&&p.text==='SHE KNOWS WHO WE ARE!'));
  const playerCount=CHAPTER09_SEQUENCE.flatMap(id=>CHAPTER09_SCENES[id].pages)
    .filter(p=>p.speaker==='right').length;
  assert.ok(playerCount>=7,'player now contributes throughout Chapter 09');
});

test('Mika appears on right in idle/win poses while player alternates on left',()=>{
  const visitor=chapter09TeamPortraitManga('chapter09Visitor');
  const pages=visitor.pages.filter(p=>p.rightCharacter==='mikaHayaseChampion'&&p.speaker==='right');
  assert.ok(pages.length>=3);
  assert.ok(pages.some(p=>p.rightPose==='win'));
  assert.ok(pages.some(p=>p.rightPose==='idle'));
  assert.ok(visitor.pages.some(p=>p.speaker==='left'&&p.leftCharacter==='$PLAYER'));
  const story=source('src/ui/Chapter09Story.js');
  assert.match(story,/chapter09TeamPortraitManga\(id\)/);
  assert.match(story,/playMangaCutscene\(scene,definition,\{/);
  assert.match(story,/chapter09RoomBackdrop:true/);
  assert.match(story,/stage\?\.showMika\?\./);
  assert.equal(typeof startChapter09,'function');
});

test('unchanged 150% rego-room geometry retains natural placement under manga',()=>{
  const left=CHAPTER09_GROUPS.left,right=CHAPTER09_GROUPS.right;
  const original=[280,279,290,286,271,270];
  const people=[...left,...right];
  people.forEach((p,i)=>{
    assert.equal(p.height,original[i]*1.5);
    assert.ok(p.x>=.18&&p.x<=.86);
  });
  assert.ok(left[2].x-left[0].x<.22);
  assert.ok(right[2].x-right[0].x<.23);
  assert.ok(new Set(people.map(p=>p.feet)).size>=4);
  assert.equal(CHAPTER09_STAGE_DEPTH,810);
  const s={worldPhase:'night',registry:{get:k=>k==='playerCharacterId'?'renMizuno':null}};
  const resolved=chapter09ShotAssets(s);
  assert.equal(resolved.background.path,'assets/CentralTokyo/dragcomplex/regoroom_night.png');
  for(const p of [...resolved.left,...resolved.right,resolved.mika])
    assert.ok(fs.existsSync(new URL('../'+p.asset.path,import.meta.url)),p.id);
});

test('standard manga two-person geometry and original whole-screen translucent shade',()=>{
  const manga=source('src/ui/MangaCutscene.js');
  const stage=source('src/ui/Chapter09EstablishingShot.js');
  assert.match(manga,/function frameFor\(scene, side\) \{/);
  assert.match(manga,/x: width \* 0\.28/);
  assert.match(manga,/x: width \* 0\.72/);
  assert.doesNotMatch(manga,/chapter09PlayerSpeaking|roomPortraits/);
  assert.match(manga,/paperBackground \? 1 : whiteWash \? 0\.83 : 0\.54/);
  assert.match(manga,/ignoreChapter09Stage: Boolean\(options\.chapter09RoomBackdrop\)/);
  assert.match(stage,/const initialAlpha=isMika\?0:1/);
  assert.match(stage,/setAlpha\(initialAlpha\)/);
  assert.doesNotMatch(stage,/tween\(\[person\.sprite,person\.shadow\],\.86,680\)/);
  assert.match(stage,/if\(visitor\)tween\(\[visitor\.sprite,visitor\.shadow\],1,950\)/);
  assert.match(source('src/ui/CutsceneTester.js'),/startChapter09\(scene,\{preview:true\}\)/);
  assert.match(source('src/ui/StoryArchivePanel.js'),/startChapter09\(scene,\{preview:true\}\)/);
});
