import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validateStoryScript, nextStoryPosition } from '../src/story/StoryScript.js';
import { STORY_DIRECTOR_SCRIPTS } from '../src/data/storyDirectorScripts.js';
import {
  DEV_VAULT_STORY_ID, DEV_VAULT_HERO_CAR, DEV_VAULT_EPISODE_KEY,
  DEV_VAULT_RACE_ACTIVE_KEY, shouldLaunchDevVaultStory,
  armDevVaultStoryLoan, claimDevVaultStoryLoan, prepareDevVaultHeroRace,
  finishDevVaultHeroRace,
} from '../src/data/devVaultStory.js';
import { cars } from '../src/data/cars.js';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const mkRegistry=(changes={})=>{
  const values={
    firstName:'Arkon',lastName:'Den',devMode:true,
    selectedCarId:'ginzaDemo_calsonicR390',
    ginzaTestDrive:{carId:'ginzaDemo_calsonicR390',previousCarId:'ae86',
      previousPreferredId:'ae86'},meetLocation:'shibuyaDogenzaka',
    selectedRaceCategory:'SINGLE',selectedRaceStake:5000,raceReturnScene:'MeetScene',
    ...changes,
  };
  return {get:key=>values[key],set:(key,value)=>{values[key]=value;},values};
};

test('only named Arkon with an active vault loan can arm and claim Shibuya Dogenzaka story',()=>{
  const dev=mkRegistry();
  assert.equal(shouldLaunchDevVaultStory(dev),false);
  assert.equal(armDevVaultStoryLoan(dev),true);
  assert.equal(dev.get('ginzaTestDrive')[DEV_VAULT_EPISODE_KEY],'armed');
  assert.equal(shouldLaunchDevVaultStory(dev),true);
  dev.set('meetLocation','shibuyaScramble');
  assert.equal(shouldLaunchDevVaultStory(dev),false,'normal Shibuya visits remain normal');
  dev.set('meetLocation','shibuyaDogenzaka');
  assert.equal(claimDevVaultStoryLoan(dev),true);
  assert.equal(shouldLaunchDevVaultStory(dev),false,'one-shot trigger cannot repeat');
  assert.equal(dev.get('ginzaTestDrive')[DEV_VAULT_EPISODE_KEY],'started');
  // Name+valid vault loan, not a possibly stale legacy devMode toggle,
  // identifies the one developer profile permitted to run the chapter.
  assert.equal(armDevVaultStoryLoan(mkRegistry({devMode:false})),true);
  for(const changed of [{firstName:'Ren',lastName:'Mizuno'},
      {ginzaTestDrive:null},{selectedCarId:'ae86'}]){
    const user=mkRegistry(changed);
    assert.equal(armDevVaultStoryLoan(user),false);
    assert.equal(shouldLaunchDevVaultStory(user),false);
  }
});

test('hero-car challenge saves/restores race setup without mutating cash, wins or car ownership',()=>{
  const registry=mkRegistry({cash:199999,wins:20,losses:5,ownedCarIds:['ae86','ginzaDemo_calsonicR390']});
  const before={...registry.values};
  assert.ok(cars[DEV_VAULT_HERO_CAR],'real Mine\'s R34 must be present');
  assert.equal(prepareDevVaultHeroRace(registry,id=>Boolean(cars[id])),true);
  assert.equal(registry.get(DEV_VAULT_RACE_ACTIVE_KEY),true);
  assert.equal(registry.get('selectedOpponentCarId'),DEV_VAULT_HERO_CAR);
  assert.equal(registry.get('selectedRaceStake'),0);
  assert.equal(registry.get('raceReturnScene'),'DevVaultStoryScene');
  assert.equal(registry.get('selectedRaceDeal'),'BET');
  assert.equal(registry.get('selectedCarId'),before.selectedCarId);
  registry.set('__devVaultStoryRaceOutcome','won');
  assert.equal(finishDevVaultHeroRace(registry),true);
  for(const key of ['selectedRaceCategory','selectedRaceStake','raceReturnScene'])
    assert.equal(registry.get(key),before[key],key);
  for(const key of ['cash','wins','losses','ownedCarIds','ginzaTestDrive'])
    assert.deepEqual(registry.get(key),before[key],key);
  assert.equal(registry.get('__devVaultStoryRaceOutcome'),'won');
  assert.equal(registry.get(DEV_VAULT_RACE_ACTIVE_KEY),false);
  assert.equal(finishDevVaultHeroRace(registry),false);
});

test('story has all three substantive Shibuya choices, a dinner subchoice, race outcome and safe return',()=>{
  const script=STORY_DIRECTOR_SCRIPTS[DEV_VAULT_STORY_ID];
  assert.ok(script);
  const compiled=validateStoryScript(script);
  const actions=script.steps.map(s=>s.type);
  assert.ok(actions.includes('WAIT_MS'));
  assert.ok(actions.includes('VENUE'));
  assert.ok(actions.includes('PHONE'));
  assert.ok(actions.includes('MANGA'));
  assert.ok(actions.includes('DEV_HERO_RACE'));
  assert.ok(actions.includes('RETURN_LOAN'));
  assert.equal(actions.filter(x=>x==='CHOICE').length,3);
  const first=script.steps.find(x=>x.type==='CHOICE');
  assert.deepEqual(first.choices.map(x=>x.id),['dinner','race','photo']);
  const result=script.steps.find(x=>x.type==='IF' && x.key==='__devVaultStoryRaceOutcome');
  assert.ok(result);
  const i=script.steps.indexOf(result);
  assert.ok(nextStoryPosition(compiled,i,key=>key==='__devVaultStoryRaceOutcome'?'won':null)
    < nextStoryPosition(compiled,i,()=>null));
  assert.equal(script.steps.at(-2).type,'RETURN_LOAN');
  assert.equal(script.steps.at(-1).type,'END');
});

test('real travel map and race scene are gated, with no regular meet UI in bespoke scene',()=>{
  const meet=source('src/scenes/MeetScene.js');
  const central=source('src/scenes/CentralTokyoScene.js');
  const race=source('src/scenes/RaceScene.js');
  const director=source('src/story/StoryDirector.js');
  const stage=source('src/scenes/DevVaultStoryScene.js');
  const core=source('src/state/GameState.js');
  assert.match(central,/armDevVaultStoryLoan\(this\.registry\)/);
  assert.match(meet,/shouldLaunchDevVaultStory\(this\.registry\)/);
  assert.match(meet,/queueSafeSceneStart\(this,'DevVaultStoryScene'\)/);
  assert.match(stage,/DevVaultStoryScene/);
  assert.match(stage,/renderStoryCar\\(this,car,frame\\)/);
  assert.match(source('src/ui/StoryCarRenderer.js'),/createCarBodyLayers\\(scene,car/);
  assert.doesNotMatch(stage,/generateOffersForLocation|buildMeetProgressionButtons|pinkSlip/);
  assert.match(director,/showStoryChoices\(scene/);
  assert.match(director,/prepareDevVaultHeroRace\(scene\.registry/);
  assert.match(director,/scene\.endGinzaTestDrive\(false\)/);
  assert.match(race,/devStoryExhibition:true/);
  assert.match(race,/this\.registry\.set\(DEV_VAULT_RACE_OUTCOME_KEY,playerWon\?'won':'lost'\)/);
  assert.match(core,/devVaultNightOutR641/);
  assert.match(core,/__devVaultStoryRaceActive/);
  assert.ok(existsSync('assets/Meet/Day/shibuya_dogenzaka_day.png'));
  assert.ok(existsSync('assets/Meet/Night/shibuya_center_gai_night.png'));
  assert.ok(existsSync('assets/Meet/Night/shibuya_scramble_night.png'));
  assert.ok(existsSync('assets/CentralTokyo/tokyo_ginza03.png'));
});

test('R641 boot and build import registration remains isolated',()=>{
  const main=source('src/main.js');
  assert.match(main,/DevVaultStoryScene/);
  assert.match(main,/StoryDirector\.js\?v=20261022-r642/);
  assert.match(main,/RaceScene\.js\?v=20261022-r642/);
  assert.match(main,/CentralTokyoScene\.js\?v=20261022-r642/);
  assert.match(source('version.json'),/R642/);
  assert.match(source('index.html'),/R642/);
});
