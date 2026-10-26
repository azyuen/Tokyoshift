import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CHAPTER09_SEQUENCE,CHAPTER09_SCENES} from '../src/data/chapter09.js';
import {CUTSCENES,CUTSCENE_ORDER} from '../src/data/cutscenes.js';
import {characters,getCharacterVisualAsset} from '../src/data/characters.js';
import {STORY_CHAPTERS,isStoryChapterComplete} from '../src/data/storyChapters.js';
import {chapter09ShouldBegin} from '../src/ui/Chapter09Story.js';
const source=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const registry=(seen=[],extra={})=>({
  get:key=>({cutscenesSeen:seen,devMode:true,...extra})[key],
});
test('four connected scenes follow Chapter 08 and include the genuine Ryuji/Sayaka greeting',()=>{
 assert.equal(CHAPTER09_SEQUENCE.length,4);
 assert.ok(CHAPTER09_SEQUENCE.every(id=>CUTSCENES[id]&&CUTSCENE_ORDER.includes(id)));
 assert.match(CHAPTER09_SCENES.chapter09OldGuard.pages.map(p=>p.text).join(' '),/Ryuji! You're still alive!/);
 assert.match(CHAPTER09_SCENES.chapter09OldGuard.pages.map(p=>p.text).join(' '),/Masato Kuroda/);
 assert.ok(CHAPTER09_SCENES.chapter09Rules.pages.some(p=>p.leftCharacter==='hiroshiSato'));
 assert.ok(CHAPTER09_SCENES.chapter09Visitor.pages.some(p=>p.leftCharacter==='mikaHayaseChampion'));
 assert.equal(characters.mikaHayaseChampion.name,'Mika Hayase');
 assert.notEqual(characters.mikaHayaseChampion.visual.path,characters.mikaHayase.visual.path);
 assert.equal(CHAPTER09_SCENES.chapter09Welcome.finalActionLabel,'CHAPTER 09 COMPLETE');
 assert.ok(CHAPTER09_SCENES.chapter09SeasonRegistration.pages.some(p=>p.text==="Alright, you two. We've had our fun. Now let's get serious."));
});
test('Chapter 09 unlocks on first eligible strip arrival, never before the Chapter 08 Ginza reveal',()=>{
 assert.equal(chapter09ShouldBegin(registry([])),false);
 assert.equal(chapter09ShouldBegin(registry(['chapter08Ginza'])),true);
 assert.equal(chapter09ShouldBegin(registry(['chapter08Ginza','chapter09Welcome'])),false);
 assert.equal(chapter09ShouldBegin(registry(['chapter08Ginza'],{devMode:false})),false);
 assert.equal(isStoryChapterComplete(registry(['chapter09Welcome']),'chapter09'),false);
 assert.equal(isStoryChapterComplete(registry(['chapter09Welcome','proSponsorEpilogue']),'chapter09'),true);
 assert.equal(STORY_CHAPTERS.at(-1).id,'chapter09');
});
test('Drag Scene triggers the same connected story after first arrival, and exposes consistent compact actions',()=>{
 const central=source('src/scenes/CentralTokyoScene.js');
 const panel=source('src/ui/ProSeasonPanel.js');
 const tester=source('src/ui/CutsceneTester.js');
 const archive=source('src/ui/StoryArchivePanel.js');
 assert.match(central,/chapter09ShouldBegin\(this\.registry\)/);
 assert.match(central,/startChapter09\(this\)/);
 assert.match(central,/showProSeasonAction\(this,SIDE\)/);
 assert.match(central,/SIDE\.y \+ 574/);
 assert.match(central,/const mapY = SIDE\.y \+ 674/);
 assert.match(panel,/const x=side\.x\+side\.w\/2,y=side\.y\+624/);
 assert.match(panel,/const height=openCircuit\?169:c\.activeChampionship\?236:213/);
 assert.match(panel,/function seasonConfirm\(/);
 assert.match(panel,/title:'FORFEIT CURRENT SEASON\?'/);
 assert.match(panel,/confirmLabel:'CONFIRM FORFEIT'/);
 assert.match(panel,/const crewTitle=/);
 assert.match(panel,/fontFamily:'"Silkscreen", monospace',fontSize:'11px'/);
 assert.match(tester,/CHAPTER 09 — WELCOME TO THE BIG LEAGUES/);
 assert.match(tester,/startChapter09\(scene,\{preview:true\}\)/);
 assert.match(archive,/startChapter09\(scene,\{preview:true\}\)/);
});
test('registration and withdrawal keep distinct safe confirmation paths',()=>{
 const panel=source('src/ui/ProSeasonPanel.js');
 const block=panel.slice(panel.indexOf('function seasonConfirm'));
 assert.match(block,/START PROFESSIONAL SEASON\?/);
 assert.match(block,/START SEASON/);
 assert.match(block,/startProfessionalSeason\(circuit\(s\)\)/);
 assert.match(block,/chapter09SeasonRegistration/);
 assert.match(block,/forfeitProfessionalSeason\(circuit\(s\)\)/);
 assert.match(block,/if\(state\?\.active&&state\.proEvent\)changes\.competitionState=null/);
 assert.match(block,/if\(!commit\(s,changes\)\)return/);
});

test('Mika Hayase uses all three verified Central portrait assets, never the Nao Fujita stand-in',()=>{
  const expected={
    idle:'assets/Characters/Central/mika_hayase_idle.png',
    win:'assets/Characters/Central/mika_hayase_win.png',
    loss:'assets/Characters/Central/mika_hayase_loss.png',
  };
  for(const [pose,path] of Object.entries(expected)){
    assert.equal(getCharacterVisualAsset('mikaHayaseChampion',pose)?.path,path);
    assert.equal(getCharacterVisualAsset('mikaHayaseChampion',pose)?.fallback,false);
    assert.ok(fs.existsSync(new URL('../'+path,import.meta.url)),path+' must exist');
  }
  assert.notEqual(characters.mikaHayaseChampion.visual.path,characters.mikaHayase.visual.path);
  const cameo=CHAPTER09_SCENES.chapter09Visitor.pages.filter(page=>page.leftCharacter==='mikaHayaseChampion');
  assert.ok(cameo.some(page=>page.leftPose==='win'),'Mika uses her real victory sprite in her confident sendoff');
  assert.ok(cameo.some(page=>page.leftPose==='idle'),'Mika uses her real idle sprite in dialogue');
});
