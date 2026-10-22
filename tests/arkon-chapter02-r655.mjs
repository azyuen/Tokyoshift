// R655 — Arkon's Chapter 02 uses existing venues, stock cars and real saves.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {ARKON_CHAPTER_02} from '../src/data/arkonChapter02.js';
import {ARKON_CHAPTER_01_REVISED} from '../src/data/arkonChapter01Revised.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {getCharacterVisualAsset} from '../src/data/characters.js';
import {getStoryBackground} from '../src/data/storyBackgroundCatalog.js';
import {getArkonStoryObjective} from '../src/ui/ArkonStoryObjective.js';
import {getArkonRecountScenes} from '../src/ui/ArkonStoryArchivePanel.js';
import {createArkonStoryState,normaliseState} from '../src/state/GameState.js';

const lookup=obj=>({get:key=>obj[key]});
test('Chapter 02 is registered and valid for the existing Story Director',()=>{
  assert.equal(STORY_DIRECTOR_SCRIPTS.arkonChapter02,ARKON_CHAPTER_02);
  assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_02));
  assert.equal(ARKON_CHAPTER_02.steps.at(-1).type,'END');
  assert.ok(ARKON_CHAPTER_02.steps.some(x=>x.key==='arkonStoryChapter02Done'&&x.value));
  assert.ok(ARKON_CHAPTER_02.steps.some(x=>x.type==='ARKON_CHALLENGE_RACE'));
});

test('Story pacing is measured in new real wins, not old Chapter 01 totals',()=>{
  const waits=ARKON_CHAPTER_02.steps.filter(x=>x.type==='WAIT_WIN_DELTA');
  assert.deepEqual(waits.map(x=>x.count),[2,2,2]);
  assert.equal(new Set(waits.map(x=>x.key)).size,3);
  assert.ok(waits.every(x=>x.scene==='MeetScene'));
  assert.equal(ARKON_CHAPTER_02.steps.filter(x=>x.type==='ARKON_DOCK_PAYMENT').length,1);
});

test('The agreed dock artwork is real and no Daikoku rival is renamed',()=>{
  const dock=ARKON_CHAPTER_02.steps.find(x=>x.type==='STAGE'&&
    x.backgroundId==='meet:daikokuOpenLot:day');
  assert.ok(dock);
  assert.equal(dock.stageMode,'story');
  assert.equal(dock.cars[0].carId,'forester');
  assert.ok(dock.characters.some(x=>x.id==='storyDockForeman'));
  assert.ok(dock.characters.some(x=>x.id==='arkonDen'&&x.pose==='storyMechanicCrouch'));
  assert.equal(getStoryBackground(dock.backgroundId).asset.path,
    'assets/Meet/Day/daikoku_open_lot_day.png');
  assert.ok(existsSync('assets/Cars/stock/forester_stock_body.png'));
  assert.ok(existsSync('assets/Characters/Daikoku/kazuo_tanaka_idle.png'));
  assert.equal(getCharacterVisualAsset('storyDockForeman','idle').path,
    'assets/Characters/Daikoku/kazuo_tanaka_idle.png');
});

test('Sayaka has the new expressions; mechanic variants exist on disk',()=>{
  for(const [id,file] of [
    ['oshiageRelaxed','relaxed'],['oshiageReviewing','reviewing'],
    ['oshiageSerious','serious'],['oshiageTalking','talking'],
  ]) {
    const pose=getCharacterVisualAsset('sayakaFujieda',id);
    assert.equal(pose.path,'assets/Characters/Main/oshiage_sayaka_fujieda_'+file+'.png');
    assert.ok(existsSync(pose.path));
  }
  for(const id of ['storyMechanic','storyMechanicEngine','storyMechanicCrouch']){
    const pose=getCharacterVisualAsset('arkonDen',id);
    assert.ok(pose?.path);
    assert.ok(existsSync(pose.path));
  }
});
test('The car ride follows meet repair, before the home workshop',()=>{
  const steps=ARKON_CHAPTER_02.steps;
  const meet=steps.findIndex(s=>s.type==='STAGE'&&s.characters?.some(
    a=>a.id==='arkonDen'&&a.role==='carMechanic')&&s.backgroundId==='$CURRENT_MEET');
  const ride=steps.findIndex(s=>s.type==='STAGE'&&s.motion==='drive');
  const home=steps.findIndex(s=>s.type==='STAGE'&&s.backgroundId==='workshop:shinonomeWorkshop:night');
  assert.ok(meet>=0&&ride>meet&&home>ride);
  assert.equal(steps[ride].characters.length,0);
});

test('Chapter 02 progress, dock pay guard and rival result are private to Story saves',()=>{
  const story=createArkonStoryState(1);
  story.arkonStoryChapter01RevisedDone=true;
  story.arkonStoryChapter02FishPaid=true;
  story.arkonStoryChapter02RivalResult='lost';
  story.arkonStoryChapter02Done=true;
  const saved=normaliseState(story);
  assert.equal(saved.arkonStoryChapter02FishPaid,true);
  assert.equal(saved.arkonStoryChapter02RivalResult,'lost');
  assert.equal(saved.arkonStoryChapter02Done,true);
  const career=normaliseState({...story,gameMode:'career'});
  assert.equal(career.arkonStoryChapter02FishPaid,false);
  assert.equal(career.arkonStoryChapter02RivalResult,null);
  assert.equal(career.arkonStoryChapter02Done,false);
  const intro=createArkonStoryState(2);
  assert.equal(intro.arkonStoryChapter02FishPaid,false);
});

test('Chapter 02 objective and archive include new scenes without replacing Chapter 01',()=>{
  const input={
    gameMode:'arkonStory',arkonStoryChapter01RevisedDone:true,
    arkonStoryChapter02Done:false,arkonStoryPhase:'chapter02Earn',wins:8,
    storyDirectorProgress:{id:'arkonChapter02',index:24,ownerSlot:1,version:1,
      vars:{ch2BeforeDock:7}},
  };
  assert.match(getArkonStoryObjective(lookup(input)).heading,/KEEP YOUR FOOT/);
  assert.match(getArkonStoryObjective(lookup(input)).progress,/1 \/ 2/);
  const after={...input,arkonStoryChapter02Done:true,
    arkonStoryChoices:{arkonFirstNight:'necessity',arkonSayakaFirstContact:'approach',
      arkonMoneyDisclosure:'honest',arkonAfterLessonOffer:'coffee'},
    arkonStoryRivalResult:'won',arkonStoryChapter02RivalResult:'won'};
  const pages=getArkonRecountScenes(lookup(after));
  assert.ok(pages.some(p=>p.title==='AN OLD CIVIC'));
  assert.ok(pages.some(p=>p.title==='SOMETHING OTHER THAN RACING'));
  assert.ok(pages.some(p=>p.title==='THE LONG WAY HOME'));
  assert.equal(ARKON_CHAPTER_01_REVISED.id,'arkonChapter01Revised');
});

test('Core wiring is opt-in to Arkon story; Chapter 2 never overwrites career progression',()=>{
  const director=readFileSync('src/story/StoryDirector.js','utf8');
  assert.match(director,/registry\.get\('arkonStoryChapter01RevisedDone'\)/);
  assert.match(director,/registry\.get\('gameMode'\)==='arkonStory'/);
  assert.match(director,/!registry\.get\('arkonStoryChapter02FishPaid'\)/);
  assert.match(director,/kind:'winDelta'/);
  const race=readFileSync('src/scenes/RaceScene.js','utf8');
  assert.match(race,/arkonStoryChapter02RivalResult/);
});
