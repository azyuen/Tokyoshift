import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  STORY_COMMANDS,validateStoryScript,
} from '../src/story/StoryScript.js';
import { STORY_DIRECTOR_SCRIPTS } from '../src/data/storyDirectorScripts.js';
import {resolveStoryComposition} from '../src/ui/StoryComposition.js';
import {
  DEV_VAULT_EPISODE_KEY,
  armDevVaultStoryLoan,shouldLaunchDevVaultStory,
  shouldLaunchDevVaultStoryForDestination,claimDevVaultStoryLoan,
} from '../src/data/devVaultStory.js';

const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const registry=(changes={})=>{
  const d={
    firstName:'Arkon',lastName:'Den',devMode:true,meetLocation:'shibuyaDogenzaka',
    selectedCarId:'ae86',preferredCarId:'ae86',
    ginzaTestDrive:{carId:'ginzaDemo_calsonicR390',previousCarId:'ae86',
      previousPreferredId:'ae86'},
    ...changes,
  };
  return {get:key=>d[key],set:(key,value)=>{d[key]=value},d};
};

test('arrival is protected even if Meet/race temporarily selected another car',()=>{
  const r=registry();
  assert.equal(armDevVaultStoryLoan(r),true);
  assert.equal(shouldLaunchDevVaultStory(r),true);
  assert.equal(shouldLaunchDevVaultStoryForDestination(r,'shibuyaDogenzaka'),true);
  assert.equal(claimDevVaultStoryLoan(r),true);
  assert.equal(r.get('selectedCarId'),'ginzaDemo_calsonicR390');
  assert.equal(r.get('preferredCarId'),'ginzaDemo_calsonicR390');
  assert.equal(r.get('ginzaTestDrive')[DEV_VAULT_EPISODE_KEY],'started');
  // Interrupted transition remains actionable: do not drop the encounter.
  assert.equal(shouldLaunchDevVaultStory(r),true);
  assert.equal(claimDevVaultStoryLoan(r),true);
  assert.equal(shouldLaunchDevVaultStoryForDestination(r,'shibuyaScramble'),false);
  r.set('ginzaTestDrive',null);
  assert.equal(shouldLaunchDevVaultStory(r),false);
});

test('the real travel, Meet preload and race fallback all stop normal action',()=>{
  const central=src('src/scenes/CentralTokyoScene.js');
  const map=central.slice(central.indexOf('  travelToLocation('),
    central.indexOf('  upgradeWorkshopFromMap('));
  assert.ok(map.indexOf('shouldLaunchDevVaultStoryForDestination')>=0);
  assert.ok(map.indexOf("queueSafeSceneStart(this,'DevVaultStoryScene')") <
    map.lastIndexOf("this.scene.start('MeetScene')"));
  const meet=src('src/scenes/MeetScene.js');
  const preload=meet.slice(meet.indexOf('  preload() {'),meet.indexOf('  create() {'));
  assert.ok(preload.indexOf('shouldLaunchDevVaultStory(this.registry)')>=0);
  const create=meet.slice(meet.indexOf('  create() {'),meet.indexOf('    document.body.dataset.scene'));
  assert.match(create,/queueSafeSceneStart\(this,'DevVaultStoryScene'\)/);
  const race=src('src/scenes/RaceScene.js');
  assert.match(race,/shouldLaunchDevVaultStory\(this\.registry\)\) return;/);
  const raceStart=race.slice(race.indexOf('  create() {'),race.indexOf('    ensureDerivedModularCarTextures'));
  assert.match(raceStart,/queueSafeSceneStart\(this,'DevVaultStoryScene'\)/);
  assert.match(raceStart,/!this\.registry\.get\(DEV_VAULT_RACE_ACTIVE_KEY\)/);
});

test('cinematic car is moved back along road perspective, not shrunk',()=>{
  const plan=resolveStoryComposition();
  const olderCarGround=840*.855;
  assert.ok(olderCarGround-plan.car.groundY>=80);
  assert.ok(olderCarGround-plan.car.groundY<=92);
  assert.ok(plan.car.targetWidth>=1040);
  assert.equal(plan.car.layer,'background');
  assert.ok(plan.car.depth<plan.cast[0].depth);
  const source=src('src/scenes/DevVaultStoryScene.js');
  assert.match(source,/resolveStoryComposition\(/);
  assert.match(source,/renderStoryCar\(this,car,frame\)/);
});

test('story arrival and initial choice both wait for active user Continue',()=>{
  const story=STORY_DIRECTOR_SCRIPTS.devVaultNightOut;
  validateStoryScript(story);
  assert.ok(STORY_COMMANDS.has('HOLD_SCENE'));
  const actions=story.steps.map(x=>x.type);
  assert.deepEqual(actions.slice(0,4),['HOLD_SCENE','MANGA','HOLD_SCENE','CHOICE']);
  assert.match(src('src/story/StoryDirector.js'),/showStoryContinuePrompt\(scene/);
  assert.match(src('src/ui/StoryContinuePrompt.js'),/on\('pointerdown'/);
  const ui=src('src/ui/StoryContinuePrompt.js');
  assert.match(ui,/\.setInteractive\(\{useHandCursor:true\}\)/);
  assert.doesNotMatch(ui,/delayedCall\(|setTimeout\(/);
  assert.match(src('src/data/storyDirectorScripts.js'),/MAKE YOUR CHOICE/);
});

test('R643 cache keys load newest story runner, staging and loan guards',()=>{
  const boot=src('src/main.js');
  for(const value of ['RaceScene','CentralTokyoScene',
    'DevVaultStoryScene']) assert.ok(boot.includes(value+'.js?v=20261022-r643'),value);
  assert.match(boot,/MeetScene\.js\?v=20261022-r644/);
  assert.match(boot,/StoryDirector\.js\?v=20261022-r644/);
  assert.match(src('src/story/StoryDirector.js'),/StoryScript\.js\?v=20261022-r643/);
  assert.match(src('src/story/StoryDirector.js'),/storyDirectorScripts\.js\?v=20261022-r644/);
  assert.match(src('src/scenes/DevVaultStoryScene.js'),/StoryComposition\.js\?v=20261022-r643/);
  assert.match(src('version.json'),/R645/);
  assert.match(src('sw.js'),/R645/);
});
