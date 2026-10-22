import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  STORY_COMPOSITION_PRESETS, DEFAULT_STORY_COMPOSITION,
  resolveStoryComposition, carBodyCenterY,
} from '../src/ui/StoryComposition.js';
import {
  DEV_VAULT_EPISODE_KEY, shouldLaunchDevVaultStoryForDestination,
  claimDevVaultStoryLoan,
} from '../src/data/devVaultStory.js';
import { STORY_DIRECTOR_SCRIPTS } from '../src/data/storyDirectorScripts.js';
import { validateStoryScript, createStoryCheckpoint, normaliseStoryChoiceVars } from '../src/story/StoryScript.js';
const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const registry=(values={})=>{
  const v={
    firstName:'Arkon',lastName:'Den',devMode:false,
    selectedCarId:'ginzaDemo_calsonicR390',
    ginzaTestDrive:{carId:'ginzaDemo_calsonicR390',previousCarId:'ae86',
      [DEV_VAULT_EPISODE_KEY]:'armed'},
    ...values,
  };
  return {get:key=>v[key],set:(key,val)=>{v[key]=val},v};
};

test('default cinematic layout stages a much larger car behind the standing cast',()=>{
  const plan=resolveStoryComposition();
  assert.equal(DEFAULT_STORY_COMPOSITION,'car-behind-cast');
  assert.ok(plan.car.targetWidth>=1040,'hero car should occupy about two thirds of the 1560px canvas');
  assert.ok(plan.car.targetWidth>=2*plan.cast[0].height);
  assert.ok(plan.car.targetWidth>620,'must be substantially larger than R641');
  assert.ok(plan.car.x+plan.car.targetWidth/2<1560);
  assert.equal(plan.car.layer,'background');
  assert.ok(plan.car.depth<plan.cast[0].depth);
  assert.equal(plan.cast[0].feetY,plan.cast[1].feetY);
  assert.ok(plan.cast[1].x<plan.car.x);
});

test('cinematographer can explicitly put a car in front or use balanced conversation',()=>{
  const front=resolveStoryComposition({preset:'car-in-front',castCount:2});
  assert.equal(front.car.layer,'foreground');
  assert.ok(front.car.depth>front.cast[1].depth);
  const balanced=resolveStoryComposition({preset:'conversation-balanced',castCount:2});
  assert.ok(balanced.car.targetWidth<front.car.targetWidth);
  assert.ok(Object.keys(STORY_COMPOSITION_PRESETS).length>=3);
  const small=resolveStoryComposition({width:780,height:420,preset:'car-behind-cast'});
  assert.ok(Math.abs(small.car.targetWidth*2-resolveStoryComposition().car.targetWidth)<=2);
  assert.throws(()=>resolveStoryComposition({preset:'not-real'}),/Unknown story composition/);
});

test('bottom-right standard PNG and centred collector sprites meet the same floor',()=>{
  const groundY=715,sourceHeight=906,scale=.48;
  assert.equal(carBodyCenterY({groundY,sourceHeight,scale,referenceStandard:true}),groundY);
  assert.equal(carBodyCenterY({groundY,sourceHeight,scale}),groundY-906*.48*.5);
  assert.equal(carBodyCenterY({groundY,sourceHeight,scale,bodyRenderOffsetY:20}),
    groundY-906*.48*.5-20*.48);
});

test('Ginza map intercepts Shibuya Dogenzaka BEFORE normal Meet loading and racing',()=>{
  const r=registry();
  assert.equal(shouldLaunchDevVaultStoryForDestination(r,'shibuyaDogenzaka'),true);
  assert.equal(shouldLaunchDevVaultStoryForDestination(r,'shibuyaScramble'),false);
  const central=src('src/scenes/CentralTokyoScene.js');
  const travel=central.slice(central.indexOf('  travelToLocation('),
    central.indexOf('  upgradeWorkshopFromMap('));
  const claim=travel.indexOf('claimDevVaultStoryLoan(this.registry)');
  const normalMeet=travel.lastIndexOf("this.scene.start('MeetScene')");
  assert.ok(claim>=0 && claim<normalMeet,'claim and divert before any Meet start');
  assert.match(travel,/queueSafeSceneStart\(this,'DevVaultStoryScene'\)/);
  const meet=src('src/scenes/MeetScene.js');
  const preload=meet.slice(meet.indexOf('  preload() {'),meet.indexOf('  create() {'));
  assert.ok(preload.indexOf('shouldLaunchDevVaultStory(this.registry)') <
    preload.indexOf('generateOffersForLocation'),'skip unnecessary rival preload');
  assert.equal(claimDevVaultStoryLoan(r),false,
    'claim requires registry meetLocation to match the destination');
  r.set('meetLocation','shibuyaDogenzaka');
  assert.equal(claimDevVaultStoryLoan(r),true);
  assert.equal(shouldLaunchDevVaultStoryForDestination(r,'shibuyaDogenzaka'),false);
});

test('the same composition presets and real car renderer are reusable by authored STAGE',()=>{
  const stage=src('src/ui/StoryStage.js');
  const standalone=src('src/scenes/DevVaultStoryScene.js');
  const carRenderer=src('src/ui/StoryCarRenderer.js');
  assert.match(stage,/composition = DEFAULT_STORY_COMPOSITION/);
  assert.match(stage,/resolveStoryComposition\(/);
  assert.match(stage,/preloadStoryCar\(scene,c.model\)/);
  assert.match(stage,/renderStoryCar\(scene,c.model/);
  assert.match(stage,/feetAnchored/);
  assert.match(standalone,/preset:'car-behind-cast'/);
  assert.match(standalone,/renderStoryCar\(this,car,frame\)/);
  assert.match(carRenderer,/getWheelPairFit\(/);
  assert.match(carRenderer,/createCarBodyLayers\(/);
  assert.match(carRenderer,/getCarBodyScaleForWidth\(/);
  assert.ok(validateStoryScript(STORY_DIRECTOR_SCRIPTS.devVaultNightOut));
});

test('choices remain universal Story Director commands usable in Career or Story',()=>{
  const runner=src('src/story/StoryDirector.js');
  assert.match(runner,/type === 'CHOICE'/);
  assert.match(runner,/showStoryChoices\(scene/);
  assert.match(runner,/compiled\.labels\.get\(choice\.to\)/);
  assert.match(src('src/ui/StoryChoicePanel.js'),/choices\.slice\(0,4\)/);
});

test('Career-mode choices persist in validated, bounded story checkpoints',()=>{
  const vars=normaliseStoryChoiceVars({dinnerBill:'treat',shibuyaPlan:'dinner',unknown:()=>true,
    bad:{user:{prototype:'malicious'}}});
  assert.deepEqual(vars,{dinnerBill:'treat',shibuyaPlan:'dinner'});
  const checkpoint=createStoryCheckpoint('careerChapter01',16,0,vars);
  assert.deepEqual(checkpoint.vars,vars);
  const director=src('src/story/StoryDirector.js');
  const save=src('src/state/GameState.js');
  assert.match(director,/this\.session\.vars\)/);
  assert.match(director,/vars:checkpoint\.vars/);
  assert.match(save,/input\.storyDirectorProgress\.vars/);
});
