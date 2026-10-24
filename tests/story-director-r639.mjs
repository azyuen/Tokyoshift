import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  STORY_COMMANDS, validateStoryScript, checkStoryCondition,
  nextStoryPosition, createStoryCheckpoint, isStoryCheckpoint,
} from '../src/story/StoryScript.js';
import { STORY_DIRECTOR_SCRIPTS } from '../src/data/storyDirectorScripts.js';

const read = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');

test('Director command vocabulary covers gameplay, normal/race dialogue, staging and branching', () => {
  for (const command of ['LOCATION','STAGE','MANGA','PHONE','COMPACT','OPEN_MAP',
    'START_RACE','WAIT_SCENE','WAIT_RACE_END','WAIT_EVENT','WAIT_FLAG','IF','GOTO','END'])
    assert.ok(STORY_COMMANDS.has(command),command);
  for (const script of Object.values(STORY_DIRECTOR_SCRIPTS))
    assert.equal(validateStoryScript(script).script.id,script.id);
});

test('branching supports save conditions without authored arbitrary code', () => {
  const script={id:'branch-smoke',steps:[
    {type:'IF',key:'champions',atLeast:7,then:'elite',else:'street'},
    {type:'LABEL',name:'elite'},
    {type:'MANGA',pages:[{speaker:'left',text:'pro'}]},
    {type:'GOTO',to:'done'},
    {type:'LABEL',name:'street'},
    {type:'MANGA',pages:[{speaker:'left',text:'street'}]},
    {type:'LABEL',name:'done'},
    {type:'END'},
  ]};
  const model=validateStoryScript(script);
  assert.equal(nextStoryPosition(model,0,key=>({champions:7})[key]),2);
  assert.equal(nextStoryPosition(model,0,key=>({champions:2})[key]),5);
  assert.equal(nextStoryPosition(model,3,()=>null),7);
  assert.equal(checkStoryCondition({key:'win',equals:true},key=>({win:true})[key]),true);
  assert.equal(checkStoryCondition({key:'win',notEquals:true},key=>({win:true})[key]),false);
  assert.throws(()=>validateStoryScript({id:'bad',steps:[{type:'GOTO',to:'missing'}]}),
    /missing label/);
  assert.throws(()=>validateStoryScript({id:'bad',steps:[{type:'JAVASCRIPT'}]}),
    /Unknown story action/);
});

test('checkpoints are profile owned, safe and versioned',()=>{
  const checkpoint=createStoryCheckpoint('chapter10',3,1);
  assert.deepEqual(checkpoint,{id:'chapter10',index:3,ownerSlot:1,version:1});
  assert.ok(isStoryCheckpoint(checkpoint));
  assert.equal(isStoryCheckpoint({...checkpoint,index:-1}),false);
  assert.equal(isStoryCheckpoint({...checkpoint,version:22}),false);
});

test('developer preview drives all three existing presentation systems',()=>{
  const script=STORY_DIRECTOR_SCRIPTS.directorDialoguePreview;
  assert.deepEqual(script.steps.filter(s=>['MANGA','PHONE','COMPACT'].includes(s.type))
    .map(s=>s.type),['MANGA','PHONE','COMPACT']);
  const route=STORY_DIRECTOR_SCRIPTS.directorRoutePreview;
  assert.deepEqual(route.steps.map(s=>s.type),
    ['LOCATION','MANGA','OPEN_MAP','WAIT_SCENE','COMPACT',
      'WAIT_RACE_END','MANGA','WAIT_SCENE','PHONE','END']);
});

test('integration retains manga/phone, existing Ginza banter and player saves',()=>{
  const director=read('src/story/StoryDirector.js');
  const game=read('src/main.js');
  const tester=read('src/ui/CutsceneTester.js');
  const compact=read('src/ui/CompactStoryDialogue.js');
  const state=read('src/state/GameState.js');
  const race=read('src/scenes/RaceScene.js');
  assert.match(director,/playMangaCutscene\(scene,definition/);
  assert.match(director,/playCompactStoryDialogue\(scene/);
  assert.match(director,/storyDirectorProgress/);
  assert.match(director,/scene\.meetButton/);
  assert.match(director,/Phaser\.Core\.Events\.POST_STEP/);
  assert.match(compact,/createRaceDialogueHud\(scene/);
  assert.match(game,/installStoryDirector/);
  assert.match(tester,/__directorDialogue/);
  assert.match(tester,/__directorRoute/);
  assert.match(state,/storyDirectorProgress: null/);
  assert.match(state,/storyDirectorProgress: registry\.get/);
  assert.match(race,/if \(sceneCutsceneActive\(this\)\) return;/);
  assert.match(race,/this\.hasGinzaBanter = this\.isGinzaDemoRace && isNamedArkonDen\(this\.registry\)/);
  assert.match(read('index.html'),/import\('\.\/src\/main\.js\?v=202610\d{2}-r\d+'\)/);
  assert.match(read('sw.js'),/const BUILD = 'R\d+'/);
});
