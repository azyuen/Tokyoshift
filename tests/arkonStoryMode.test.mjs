import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_01} from '../src/data/arkonChapter01.js';
import { ARKON_CHAPTER_01_REVISED } from '../src/data/arkonChapter01Revised.js';
import { getStoryWorldPhase } from '../src/story/ArkonStoryTime.js';

import { isOshiageVoucherAvailable } from '../src/data/oshiageSchool.js';
import { isTravelRegionUnlocked, isTravelLocationUnlocked } from '../src/data/travelRegions.js';
import { getCentralTokyoAccess } from '../src/data/centralTokyo.js';
import { getCharacterVisualAsset } from '../src/data/characters.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {
  ARKON_STORY_MECHANIC_ASSETS, isArkonStoryWorkshop,
  resolveWorkshopMechanicTexture,
} from '../src/data/arkonStoryWorkshopMechanic.js';
import {getArkonStoryObjective} from '../src/ui/ArkonStoryObjective.js';
import {getArkonRecountScenes} from '../src/ui/ArkonStoryArchivePanel.js';
import { getNativeStoryStageTemplate, getNativeCastPlacement } from '../src/story/StoryNativeStageTemplates.js';
import { WORKSHOP_PRESENTATION } from '../src/data/workshopPresentation.js';
import { SHOWDOWN_STAGE, SHOWDOWN_HERO_CAR, SHOWDOWN_HERO_CHARACTER } from '../src/ui/ShowdownLayout.js';
import { getStoryBackground } from '../src/data/storyBackgroundCatalog.js';
import {createArkonStoryState,normaliseState,createDefaultGameState,
  applyStateToRegistry,saveSessionState,setProfileGameMode,getProfileGameMode,
  beginNewProfile,readSessionState,getProfileState,exportProfileBackup,
  importProfileBackup,getActiveProfileIndex,resetArkonStoryState} from '../src/state/GameState.js';

test('Story Director registers the new chapter',()=>{
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter01, ARKON_CHAPTER_01);
});
test('Arkon Chapter 01 validates against Story Director commands',()=>{
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_01));
  assert.ok(ARKON_CHAPTER_01.steps.some(step=>step.type==='CHOICE'));
  assert.ok(ARKON_CHAPTER_01.steps.some(step=>step.type==='WAIT_FLAG' && step.key==='wins'));
});
test('Arkon historical save does not receive endgame dev advantages',()=>{
  const state=createArkonStoryState(1);
  assert.equal(state.gameMode,'arkonStory');
  assert.equal(state.playerCharacterId,'arkonDen');
  assert.equal(state.devMode,false);
  assert.equal(state.cash,5000);
  assert.equal(state.wins,0);
  assert.equal(state.garageTier,0);
  assert.ok(!state.ownedCarIds.includes('magna'));
  assert.equal(state.storyDirectorProgress.ownerSlot,1);
  assert.equal(normaliseState(state).devMode,false);
});

test('Arkon story savings do not overwrite the developer slot',()=>{
  const memory=new Map();
  const writes=[];
  globalThis.localStorage={
    getItem:key=>memory.has(key)?memory.get(key):null,
    setItem:(key,value)=>{writes.push(key);memory.set(key,String(value));},
    removeItem:key=>memory.delete(key),
  };
  const storage=new Map();
  const registry={get:key=>storage.get(key),set:(key,value)=>storage.set(key,value)};
  beginNewProfile(0);
  const career=createDefaultGameState();
  Object.assign(career,{firstName:'Arkon',lastName:'Den',
    playerCharacterId:'arkonDen',devMode:true,cash:1000000000,wins:98});
  applyStateToRegistry(registry,career);
  assert.ok(saveSessionState(registry));
  assert.equal(getProfileGameMode(0),'career');
  const rawCareerSlot = memory.get('tokyoShiftProfilesV1');
  const rawCareerMirror = memory.get('tokyoShiftProfile');
  assert.equal(setProfileGameMode(0,'arkonStory'),true);
  // Selecting story must not touch either normal save namespace.
  assert.equal(memory.get('tokyoShiftProfilesV1'),rawCareerSlot);
  assert.equal(memory.get('tokyoShiftProfile'),rawCareerMirror);
  assert.ok(memory.has('tokyoShiftArkonStorySaveV1:0'));
  const intro=readSessionState();
  assert.equal(intro.cash,5000);
  applyStateToRegistry(registry,intro);
  registry.set('cash',6900);
  const beforeWrites = writes.length;
  assert.ok(saveSessionState(registry));
  assert.deepEqual(writes.slice(beforeWrites).filter(key =>
    ['tokyoShiftProfilesV1','tokyoShiftProfilesV1Backup',
      'tokyoShiftSaveState','tokyoShiftProfile'].includes(key)), []);
  assert.equal(readSessionState().cash,6900);
  assert.equal(memory.get('tokyoShiftProfilesV1'),rawCareerSlot);
  assert.equal(memory.get('tokyoShiftProfile'),rawCareerMirror);
  assert.equal(setProfileGameMode(0,'career'),true);
  assert.equal(readSessionState().cash,1000000000);
  assert.equal(getProfileState(0).wins,98);
  assert.equal(setProfileGameMode(0,'arkonStory'),true);
  assert.equal(readSessionState().cash,6900);
  const backup=exportProfileBackup(0);
  assert.equal(backup.formatVersion,2);
  assert.equal(backup.storyState.cash,6900);
  beginNewProfile(1);
  importProfileBackup(1,backup);
  assert.equal(setProfileGameMode(1,'arkonStory'),true);
  assert.equal(readSessionState().storyDirectorProgress.ownerSlot,getActiveProfileIndex());
});

test('normal drivers cannot enter Arkon story or overwrite its save',()=>{
  const existingStory=globalThis.localStorage.getItem('tokyoShiftArkonStorySaveV1:1');
  // Slot 2: a normal, separate driver with their own career.
  beginNewProfile(2);
  const memory=new Map();
  const registry={get:k=>memory.get(k),set:(k,v)=>memory.set(k,v)};
  const career=createDefaultGameState();
  Object.assign(career,{firstName:'Test',lastName:'Driver',cash:16700,wins:6});
  applyStateToRegistry(registry,career);
  assert.ok(saveSessionState(registry));
  assert.equal(setProfileGameMode(2,'arkonStory'),false);
  assert.equal(getProfileGameMode(2),'career');
  assert.equal(readSessionState().cash,16700);
  assert.equal(globalThis.localStorage.getItem('tokyoShiftArkonStorySaveV1:1'),existingStory);
});

test('all Sayaka encounters use live Meet and canonical sized vehicle artwork',()=>{
  const steps=ARKON_CHAPTER_01.steps;
  const meetScenes=steps.filter(step=>step.privateMeet);
  assert.ok(meetScenes.length>=5);
  for(const step of meetScenes){
    assert.equal(step.backgroundId,'$CURRENT_MEET');
    assert.equal(step.stageMode,'native');
    assert.ok(step.cars.every(car=>car.width>=490 && car.width<=590 && car.carId==='$SELECTED_CAR'));
  }
  assert.equal(steps[30].scene,'MeetScene');
  assert.equal(steps[29].type,'WAIT_FLAG');
  assert.equal(steps[29].atLeast,4);
  assert.ok(steps.some(step=>step.type==='SET_FLAG' &&
    step.key==='arkonStoryChapter01AfterHoursDone' && step.value===true));
});

test('R647 completed story safely resumes at the new beat on the right profile',()=>{
  const legacy=createArkonStoryState(1);
  legacy.arkonStoryChapter01Done=true;
  legacy.storyDirectorProgress=null;
  legacy.wins=5;
  const migrated=normaliseState(legacy);
  assert.equal(migrated.wins,5);
  assert.equal(migrated.storyDirectorProgress.id,'arkonChapter01');
  assert.equal(migrated.storyDirectorProgress.index,29);
  const finish=normaliseState({...migrated,arkonStoryChapter01AfterHoursDone:true,
    storyDirectorProgress:null});
  assert.equal(finish.storyDirectorProgress.index,37);
  assert.equal(ARKON_CHAPTER_01.steps[37].type,'MANGA');
  const completed=normaliseState({...finish,arkonStoryChapter01FullDone:true,storyDirectorProgress:null});
  assert.equal(completed.storyDirectorProgress,null);
});

test('story objective is spoiler free and absent from normal careers',()=>{
  const make=values=>({get:key=>values[key]});
  assert.equal(getArkonStoryObjective(make({gameMode:'career'})),null);
  const stage=getArkonStoryObjective(make({gameMode:'arkonStory',wins:1}));
  assert.match(stage.progress,/1 \/ 2/);
  const done=getArkonStoryObjective(make({gameMode:'arkonStory',wins:16,
    arkonStoryChapter01FullDone:true}));
  assert.match(done.heading,/COMPLETE/);
});

test('extended chapter adds meaningful dialogue, real racing and choice gates',()=>{
  const steps=ARKON_CHAPTER_01.steps;
  const wins=steps.filter(step=>step.type==='WAIT_FLAG'&&step.key==='wins')
    .map(step=>step.atLeast);
  assert.deepEqual(wins,[2,4,6,8,10,12,14,16]);
  assert.ok(steps.filter(step=>step.type==='CHOICE').length>=5);
  assert.ok(steps.filter(step=>step.type==='MANGA')
    .flatMap(step=>step.pages||[]).length>=90);
  assert.ok(steps.filter(step=>step.type==='WAIT_SCENE').length>=7);
  assert.ok(steps.some(step=>step.type==='SET_FLAG' &&
    step.key==='arkonStoryChapter01FullDone' && step.value===true));
  assert.doesNotThrow(()=>validateStoryScript(steps.length ? ARKON_CHAPTER_01 : null));
});

test('Arkon Story restart resets story only and leaves all Career keys unchanged',()=>{
  const before=getActiveProfileIndex();
  // Start a new test Arkon Story in slot 0, not the ordinary driver slot 2.
  beginNewProfile(0);
  const data=new Map();
  const registry={get:key=>data.get(key),set:(key,val)=>data.set(key,val)};
  applyStateToRegistry(registry,{...createDefaultGameState(),firstName:'Arkon',
    lastName:'Den',playerCharacterId:'arkonDen'});
  assert.ok(saveSessionState(registry));
  assert.ok(setProfileGameMode(0,'arkonStory'));
  applyStateToRegistry(registry,readSessionState());
  registry.set('wins',14);registry.set('cash',99999);
  assert.ok(saveSessionState(registry));
  const careerBefore=globalThis.localStorage.getItem('tokyoShiftProfilesV1');
  const careerMirror=globalThis.localStorage.getItem('tokyoShiftProfile');
  assert.equal(resetArkonStoryState(),true);
  assert.equal(readSessionState().wins,0);
  assert.equal(readSessionState().cash,5000);
  assert.equal(readSessionState().storyDirectorProgress.index,0);
  assert.equal(globalThis.localStorage.getItem('tokyoShiftProfilesV1'),careerBefore);
  assert.equal(globalThis.localStorage.getItem('tokyoShiftProfile'),careerMirror);
  assert.equal(before,2);
});

test('recount previews only witnessed scenes and preserves selected path',()=>{
  const base={gameMode:'arkonStory',arkonStoryFirstChoice:'careful',
    arkonStoryFirstReply:'tease',arkonStoryChoices:{notesApproach:'listen'},
    storyDirectorProgress:{id:'arkonChapter01',index:37,ownerSlot:0,version:1}};
  const reg=values=>({get:key=>values[key]});
  const titles=getArkonRecountScenes(reg(base)).map(step=>step.title);
  assert.ok(titles.includes('A BOLD SUGGESTION'));
  assert.ok(!titles.includes('A STRAIGHT ANSWER'));
  assert.ok(!titles.includes('THE TIMING DESK'));
  assert.ok(getArkonRecountScenes(reg({...base,storyDirectorProgress:{...base.storyDirectorProgress,index:52}}))
    .length>=titles.length);
  assert.deepEqual(getArkonRecountScenes(reg({gameMode:'career'})),[]);
});

test('Story objective is to the left of Settings with a taller, clear popup',()=>{
  const settings=readFileSync(new URL('../src/ui/SettingsPanel.js',import.meta.url),'utf8');
  const objective=readFileSync(new URL('../src/ui/ArkonStoryObjective.js',import.meta.url),'utf8');
  assert.match(settings,/addArkonStoryObjectiveButton\(scene, x - 56, y\)/);
  assert.match(objective,/rectangle\(780,420,820,535,/);
  const messageY=Number(objective.match(/text\(780,(\d+),info.message/)[1]);
  const replayY=Number(objective.match(/text\(780,(\d+),'REPLAY \/ RESTART/)[1]);
  const closeY=Number(objective.match(/rectangle\(780,(\d+),215,50/)[1]);
  assert.ok(closeY-replayY>=60);
  assert.ok(closeY-messageY>=200);
  assert.ok(closeY+25<420+535/2);
});

test('R651 Workshop stages use the LIVE Garage hero car and player positions',()=>{
  const profile=getStoryBackground('workshop:shinonomeWorkshop:night');
  const template=getNativeStoryStageTemplate(profile,{sys:{settings:{key:'GarageScene'}}});
  assert.equal(template.kind,'workshop');
  assert.deepEqual(template.car,{
    x:WORKSHOP_PRESENTATION.heroCar.x,
    tyreContactY:WORKSHOP_PRESENTATION.heroCar.tyreContactY,
    targetWidth:WORKSHOP_PRESENTATION.heroCar.targetWidth,
  });
  assert.deepEqual(template.character,{
    x:WORKSHOP_PRESENTATION.player.x,
    feetY:WORKSHOP_PRESENTATION.player.feetY,
    height:WORKSHOP_PRESENTATION.player.targetHeight,
  });
  const first=getNativeCastPlacement(template,0,2);
  const second=getNativeCastPlacement(template,1,2);
  assert.equal(first.height,second.height);
  assert.equal(first.feetY,second.feetY);
  assert.ok(second.x>first.x);
});

test('R651 Meet staging shares the ACTUAL live Street Showdown geometry',()=>{
  const profile=getStoryBackground('meet:odaiba7eleven:night');
  const scene={sys:{settings:{key:'MeetScene'}}};
  const template=getNativeStoryStageTemplate(profile,scene);
  assert.equal(template.kind,'meet');
  assert.deepEqual(template.frame,SHOWDOWN_STAGE);
  assert.deepEqual(template.car,SHOWDOWN_HERO_CAR);
  assert.deepEqual(template.character,SHOWDOWN_HERO_CHARACTER);
  const first=getNativeCastPlacement(template,0,2);
  const companion=getNativeCastPlacement(template,1,2);
  const observer=getNativeCastPlacement(template,1,2,'observer');
  assert.equal(first.height,companion.height);
  assert.equal(companion.height,observer.height);
  assert.equal(first.feetY,observer.feetY);
  assert.ok(observer.x>companion.x);
});

test('R651 does not apply native gameplay positions in the wrong scene',()=>{
  const garage=getStoryBackground('workshop:shinonomeWorkshop:night');
  const meet=getStoryBackground('meet:odaiba7eleven:night');
  assert.equal(getNativeStoryStageTemplate(garage,{sys:{settings:{key:'MeetScene'}}}),null);
  assert.equal(getNativeStoryStageTemplate(meet,{sys:{settings:{key:'GarageScene'}}}),null);
  assert.equal(getNativeStoryStageTemplate(
    getStoryBackground('train:station:night'),{sys:{settings:{key:'TrainStationScene'}}}),null);
});

test('R651 renderer uses gameplay car displays instead of story-specific sizing',()=>{
  const stage=readFileSync(new URL('../src/ui/StoryStage.js',import.meta.url),'utf8');
  const showdown=readFileSync(new URL('../src/ui/StreetShowdownView.js',import.meta.url),'utf8');
  assert.match(stage,/template\?\.car\.targetWidth\?\?c\.width/);
  assert.match(stage,/scene\.buildWorkshopHeroLayout\(c\.model\)/);
  assert.match(stage,/scene\.createCarDisplay\(c\.model,hero\.x,hero\.bodyY/);
  assert.match(stage,/scene\.createCarDisplay\(c\.model,template\.car\.x,template\.car\.y/);
  assert.match(stage,/getNativeCastPlacement\(template,i,actors\.length,a\.role\)/);
  assert.match(showdown,/SHOWDOWN_HERO_CAR\.targetWidth/);
  assert.match(showdown,/SHOWDOWN_HERO_CHARACTER\.height/);
});

test('R652 revised Story Director registers a complete playable Chapter 01',()=>{
  assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter01Revised,ARKON_CHAPTER_01_REVISED);
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_01_REVISED));
  const steps=ARKON_CHAPTER_01_REVISED.steps;
  assert.deepEqual(steps.filter(s=>s.type==='WAIT_FLAG' && s.key==='wins')
    .map(s=>s.atLeast),[3]);
  assert.equal(steps.filter(s=>s.type==='ARKON_CHALLENGE_RACE').length,1);
  assert.ok(steps.some(s=>s.type==='WAIT_FLAG'&&s.key==='arkonStorySayakaNoticed'));
  // The paid-for surprise is now in Chapter 02, after Shibuya's repair.
  assert.equal(steps.some(s=>s.type==='WAIT_FLAG'&&s.key==='arkonStoryLessonCompleted'),false);
  assert.ok(STORY_DIRECTOR_SCRIPTS.arkonChapter02.steps.some(s=>s.type==='WAIT_FLAG'&&s.key==='arkonStoryLessonCompleted'));
  assert.ok(steps.some(s=>s.type==='STAGE'&&s.characters?.some(c=>c.id==='aoiShindou')&&s.characters?.some(c=>c.id==='haruSakurai')));
  assert.ok(steps.some(s=>s.type==='IF'&&s.key==='arkonStoryRivalResult'&&
    s.equals==='won'&&s.else==='rivalLost'));
  assert.ok(steps.some(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryChapter01RevisedDone'));
  assert.ok(steps.filter(s=>s.type==='CHOICE').length>=3);
  assert.ok(steps.filter(s=>s.type==='MANGA').flatMap(s=>s.pages||[]).length>=75);
});

test('R652 new Arkon profile starts revised chapter and saves independent scene flags',()=>{
  const state=createArkonStoryState(2);
  assert.equal(state.storyDirectorProgress.id,'arkonChapter01Revised');
  assert.equal(state.arkonStoryPhase,'opening');
  const edited=normaliseState({...state,arkonStoryPhase:'practice',
    arkonStoryRivalResult:'lost',arkonStorySayakaNoticed:true,
    arkonStoryLessonCredits:4,arkonStorySchoolRevealed:true,
    arkonStoryLessonCompleted:true});
  assert.equal(edited.arkonStoryPhase,'practice');
  assert.equal(edited.arkonStoryRivalResult,'lost');
  assert.equal(edited.arkonStorySayakaNoticed,true);
  assert.equal(edited.arkonStoryLessonCredits,4);
  assert.equal(edited.arkonStorySchoolRevealed,true);
  assert.equal(edited.arkonStoryLessonCompleted,true);
  const career=normaliseState({...edited,gameMode:'career',firstName:'Other'});
  assert.equal(career.arkonStoryLessonCredits,0);
  assert.equal(career.arkonStorySayakaNoticed,false);
});

test('R652 story wears uploaded casual Arkon and instructor Sayaka sprites',()=>{
  for(const pose of ['Idle','Talking','Confident','Laughing','Sheepish','Serious','Surprised']){
    const img=getCharacterVisualAsset('arkonDen','story'+pose);
    assert.match(img?.path||'',new RegExp('assets/Characters/Main/arkon_den_'+pose.toLowerCase()+'\\.png$'));
  }
  const instr=getCharacterVisualAsset('sayakaFujieda','oshiageNeutral');
  assert.match(instr.path,/oshiage_sayaka_fujieda_neutral\.png$/);
  const steps=ARKON_CHAPTER_01_REVISED.steps;
  const authored=steps.filter(s=>s.type==='STAGE')
    .flatMap(s=>s.characters||[]).filter(c=>c.id==='sayakaFujieda');
  assert.ok(authored.length>=2);
  assert.ok(authored.every(c=>c.pose.startsWith('oshiage')));
});

test('R652 new Story Mode explores regions but Ginza stays locked',()=>{
  const story={gameMode:'arkonStory',firstName:'Arkon',lastName:'Den',
    cash:5000,wins:3,arkonStoryGinzaUnlocked:false};
  assert.equal(isTravelRegionUnlocked(story,'OSHIAGE'),true);
  assert.equal(isTravelRegionUnlocked(story,'DAIKOKU'),true);
  assert.equal(isTravelLocationUnlocked(story,'oshiageDrivingSchool'),true);
  assert.equal(isTravelLocationUnlocked(story,'ginzaMotorGallery'),false);
  assert.equal(getCentralTokyoAccess(story).ginza,false);
  assert.equal(isTravelLocationUnlocked({...story,arkonStoryGinzaUnlocked:true},'ginzaMotorGallery'),true);
});

test('R652 normal Career voucher behaviour unaffected by Story-only credits',()=>{
  const normal={gameMode:'career',oshiageFreeLessonUsed:{},oshiageCoachingProgress:{}};
  assert.equal(isOshiageVoucherAvailable(normal,'launch'),true);
  assert.equal(isOshiageVoucherAvailable({...normal,gameMode:'arkonStory'},'launch'),false);
  assert.equal(isOshiageVoucherAvailable({...normal,gameMode:'arkonStory',
    arkonStoryLessonCredits:5},'launch'),true);
  assert.equal(isOshiageVoucherAvailable({...normal,gameMode:'arkonStory',
    arkonStoryLessonCredits:0},'launch'),false);
});

test('R652 Meet Sayaka marker, real racing and school controls are wired',()=>{
  const meet=readFileSync(new URL('../src/scenes/MeetScene.js',import.meta.url),'utf8');
  const observer=readFileSync(new URL('../src/ui/ArkonStoryMeetObserver.js',import.meta.url),'utf8');
  const race=readFileSync(new URL('../src/scenes/RaceScene.js',import.meta.url),'utf8');
  const school=readFileSync(new URL('../src/scenes/OshiageScene.js',import.meta.url),'utf8');
  const director=readFileSync(new URL('../src/story/StoryDirector.js',import.meta.url),'utf8');
  assert.match(meet,/attachArkonMeetObserver\(this\)/);
  assert.match(observer,/YOU NOTICE HER/);
  assert.match(observer,/saveSessionState\(scene.registry\)/);
  assert.match(director,/type === 'ARKON_CHALLENGE_RACE'/);
  assert.match(director,/selectedRaceCategory:'SINGLE'/);
  assert.match(race,/arkonStoryChapter02RivalResult/);
  assert.match(race,/arkonStoryRivalResult/);
  assert.match(race,/this\.registry\.set\(resultKey,playerWon\?'won':'lost'\)/);
  assert.match(race,/settlement\?\.teamChallengeCompleted/);
  assert.match(school,/arkonStoryLessonCredits/);
  assert.match(school,/gameMode'\)==='arkonStory' \|\|/);
});

test('R653 camera places Story Sayaka above every Meet car layer',()=>{
  const observer=readFileSync(new URL('../src/ui/ArkonStoryMeetObserver.js',import.meta.url),'utf8');
  const portraitDepth=Number(observer.match(/setScale\(height\/Math\.max\(1,source\.height\)\)\.setDepth\((\d+)\)/)?.[1]);
  assert.ok(portraitDepth>=80,'Sayaka must be in front of all foreground car layers');
  assert.match(observer,/if\(scene\.stageMask\)person\.setMask\(scene\.stageMask\)/);
});

test('R653 manga never falls back to Sayaka home clothing while dimmed',()=>{
  const steps=ARKON_CHAPTER_01_REVISED.steps;
  const pages=steps.filter(s=>s.type==='MANGA').flatMap(s=>s.pages||[]);
  assert.ok(pages.length>=75);
  for(const page of pages){
    assert.ok(page.leftPose,'left must have explicit pose including inactive sides');
    assert.ok(page.rightPose,'right must have explicit pose including inactive sides');
    const scene=steps.find(st=>st.type==='MANGA'&&st.pages?.includes(page));
    if(scene?.characters?.right==='sayakaFujieda')assert.match(page.rightPose,/^oshiage/);
    assert.doesNotMatch(page.leftPose,/^dev/);
  }
  const dir=readFileSync(new URL('../src/story/StoryDirector.js',import.meta.url),'utf8');
  assert.match(dir,/preloadPagePosesOnly: \['arkonChapter01Revised','arkonChapter02','arkonChapter03'(?:,'arkonChapter04')?\]\.includes\(this\.session\.id\)/);
});

test('R678 repair occurs at the Meet, after race results are dismissed',()=>{
  const steps=ARKON_CHAPTER_01_REVISED.steps;
  const threshold=steps.find(s=>s.type==='WAIT_FLAG'&&s.key==='wins'&&s.atLeast===3);
  assert.ok(threshold);
  const next=steps[steps.indexOf(threshold)+1];
  assert.equal(next.type,'SET_FLAG');
  assert.equal(next.value,'meetNotice');
  const wait=steps[steps.indexOf(threshold)+2];
  assert.equal(wait.type,'WAIT_SCENE');
  assert.equal(wait.scene,'MeetScene');
  const repair=steps.find(s=>s.type==='STAGE'&&s.characters?.some(c=>c.id==='aoiShindou'));
  assert.equal(repair.backgroundId,'$CURRENT_MEET');
  assert.equal(repair.privateMeet,true);
  const dir=readFileSync(new URL('../src/story/StoryDirector.js',import.meta.url),'utf8');
  assert.match(dir,/wait\.condition\.scene/);
  assert.match(dir,/\(!step\.scene \|\| sceneName\(scene\)===step\.scene\)/);
});

test('R653 Story time controls scene phase without touching other profiles',()=>{
  const make=values=>({get:k=>values[k]});
  assert.equal(getStoryWorldPhase(make({gameMode:'arkonStory',arkonStoryTimeOfDay:'night'})),'night');
  assert.equal(getStoryWorldPhase(make({gameMode:'arkonStory',arkonStoryTimeOfDay:'day'})),'day');
  const state=createArkonStoryState(1);
  assert.equal(state.arkonStoryTimeOfDay,'night');
  assert.equal(normaliseState({...state,arkonStoryTimeOfDay:'day'}).arkonStoryTimeOfDay,'day');
  const earlier={...state,arkonStoryPhase:'meetNotice'};
  delete earlier.arkonStoryTimeOfDay;
  assert.equal(normaliseState(earlier).arkonStoryTimeOfDay,'night');
  assert.equal(normaliseState({...earlier,arkonStoryPhase:'practice'}).arkonStoryTimeOfDay,'day');
  const steps=ARKON_CHAPTER_01_REVISED.steps;
  assert.ok(steps.some(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryPhase'&&s.timeOfDay==='night'));
  assert.ok(STORY_DIRECTOR_SCRIPTS.arkonChapter02.steps.some(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryPhase'&&s.timeOfDay==='day'));
  const sceneFiles=['GarageScene','MeetScene','OshiageScene','RaceScene'];
  for(const file of sceneFiles){
    const code=readFileSync(new URL('../src/scenes/'+file+'.js',import.meta.url),'utf8');
    assert.match(code,/getStoryWorldPhase\(this\.registry\)/);
  }
  const map=readFileSync(new URL('../src/ui/TravelMap.js',import.meta.url),'utf8');
  assert.match(map,/getStoryWorldPhase\(scene\.registry\)/);
});

test('R653 Story CTA wraps long titles within the scene viewport',()=>{
  const code=readFileSync(new URL('../src/ui/StoryContinuePrompt.js',import.meta.url),'utf8');
  assert.match(code,/wordWrap:\{width:w-74,useAdvancedWrap:true\}/);
  assert.match(code,/const w=Math\.min\(365,stage\.w-36\),h=82/);
});

test('R653 rival uses the existing adult Daigo Moriyama artwork',()=>{
  const rival=getCharacterVisualAsset('storyDaigoKirishima','idle');
  assert.equal(rival.path,'assets/Characters/Tatsumi/daigo_moriyama_idle.png');
  const script=ARKON_CHAPTER_01_REVISED.steps;
  assert.equal(script.some(s=>s.type==='ARKON_CHALLENGE_RACE'),true);
});

test('R678 first chapter leaves the Oshiage reveal for the Shibuya follow-up',()=>{
  const steps=ARKON_CHAPTER_01_REVISED.steps;
  // The early revision intentionally moves the driving lesson into Chapter 02.
  assert.equal(steps.filter(s=>s.type==='SET_FLAG'&&s.key==='arkonStoryTimeOfDay').length,0);
  assert.ok(steps.filter(s=>s.type==='WAIT_SCENE'&&s.scene==='MeetScene').length>=1);
  assert.equal(steps.some(s=>s.type==='SET_FLAG'&&s.key==='arkonStorySchoolRevealed'),false);
  assert.ok(STORY_DIRECTOR_SCRIPTS.arkonChapter02.steps.some(s=>s.type==='SET_FLAG'&&s.key==='arkonStorySchoolRevealed'&&s.value===true));
  assert.equal(steps.filter(s=>s.type==='WAIT_FLAG'&&s.key==='wins').length,1);
});

test('R654 every uploaded Arkon mechanic pose maps exactly to Daichi tuning artwork',()=>{
  const arkon={gameMode:'arkonStory'};
  const assets=Object.fromEntries(ARKON_STORY_MECHANIC_ASSETS.map(a=>[a.key,a.path]));
  assert.equal(ARKON_STORY_MECHANIC_ASSETS.length,4);
  assert.equal(assets.arkonStoryMechanicNormal,'assets/Characters/Main/arkon_den_mechanic.png');
  // Uploaded file genuinely uses the spelling "insepct".
  assert.equal(assets.arkonStoryMechanicEngine,'assets/Characters/Main/arkon_den_engine_insepct.png');
  assert.equal(assets.arkonStoryMechanicChassis,'assets/Characters/Main/arkon_den_chassis_tools.png');
  assert.equal(assets.arkonStoryMechanicExhaust,'assets/Characters/Main/arkon_den_exhaust_crouch.png');
  assert.equal(resolveWorkshopMechanicTexture(arkon,'characterDaichiSakamoto'),'arkonStoryMechanicNormal');
  assert.equal(resolveWorkshopMechanicTexture(arkon,'daichiEngineInspect'),'arkonStoryMechanicEngine');
  assert.equal(resolveWorkshopMechanicTexture(arkon,'daichiChassisTools'),'arkonStoryMechanicChassis');
  assert.equal(resolveWorkshopMechanicTexture(arkon,'daichiExhaustCrouch'),'arkonStoryMechanicExhaust');
  assert.ok(isArkonStoryWorkshop({get:key=>key==='gameMode'?'arkonStory':null}));
});

test('R654 Career and Crew spaces keep normal Daichi without Story texture substitution',()=>{
  for(const mode of ['career','dev',null]){
    assert.equal(isArkonStoryWorkshop({gameMode:mode}),false);
    for(const original of ['characterDaichiSakamoto','daichiEngineInspect',
        'daichiChassisTools','daichiExhaustCrouch']){
      assert.equal(resolveWorkshopMechanicTexture({gameMode:mode},original),original);
    }
  }
  assert.equal(resolveWorkshopMechanicTexture({gameMode:'arkonStory'},
    'daichiEngineInspect',true),'daichiEngineInspect');
});

test('R654 hides casual Arkon AND his floor shadows while tuning and restores both on exit',()=>{
  const code=readFileSync(new URL('../src/scenes/GarageScene.js',import.meta.url),'utf8');
  assert.match(code,/resolveWorkshopMechanicTexture\(this\.registry,/);
  assert.match(code,/this\.setArkonWorkingAtCar\(true\)/);
  assert.match(code,/\[actor,\.\.\.\(actor\?\.stageShadows\|\|\[\]\)\]/);
  assert.match(code,/this\._arkonWorkingHidden\.forEach\(\(\{obj\}\)=>obj\.setVisible\(false\)\)/);
  assert.ok((code.match(/this\.setArkonWorkingAtCar\(false\)/g)||[]).length>=4,
    'must restore on engine, chassis, drivetrain/exhaust and error recovery');
  assert.match(code,/if \(isArkonStoryWorkshop\(this\.registry,this\.crewMode\)\) \{\s*ARKON_STORY_MECHANIC_ASSETS\.forEach/s);
  assert.match(code,/visual:\{ \.\.\.playerCharacter\.visual, spriteKey:storyIdle\.key \}/);
});
