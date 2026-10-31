import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_10 as chapter} from '../src/data/arkonChapter10.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {migrateArkonR749Checkpoint} from '../src/story/ArkonR749CheckpointMigration.js';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const steps=chapter.steps;
const indexOf=type=>steps.findIndex(s=>s.type===type);

test('Chapter 10 switches narrative interiors to full-screen images, never the live Garage UI',()=>{
  assert.doesNotThrow(()=>validateStoryScript(chapter));
  const stages=steps.filter(s=>s.type==='STAGE');
  const interiors=stages.filter(s=>/^(workshop:|central:)/.test(s.backgroundId));
  assert.ok(interiors.length>=6);
  for(const s of interiors){
    assert.equal(s.stageMode,'chapter10-full',s.backgroundId);
    assert.ok(s.depth>=620);
  }
  assert.ok(stages.some(s=>s.backgroundId==='meet:yokohamaMinatoMirai:night'&&s.stageMode==='native'));
  assert.match(source('src/ui/StoryStage.js'),/chapter10-full/);
  assert.match(source('src/ui/StoryStage.js'),/if\(fullScreen\)/);
  assert.match(source('src/ui/StoryStage.js'),/chapter10Cast/);
  assert.match(source('src/ui/StoryStage.js'),/chapter10Car/);
});

test('The sold Liberty Walk Z is removed before the next car appears',()=>{
  const sale=indexOf('ARKON_CH10_SELL_Z');
  assert.ok(sale>indexOf('ARKON_CH10_RACE'));
  assert.equal(steps[sale+1].type,'CLEAR_STAGE');
  assert.equal(steps[sale+2].type,'LOCATION');
  assert.equal(steps[sale+2].scene,'GarageScene');
  assert.equal(steps[sale+2].force,true);
  assert.equal(steps[sale+3].type,'CLEAR_STAGE');
  const stagesAfter=steps.slice(sale+1).filter(s=>s.type==='STAGE');
  assert.ok(stagesAfter.every(s=>!s.cars?.some(c=>c.carId==='arkonLibertyWalk240z')));
  assert.ok(stagesAfter.some(s=>s.cars?.some(c=>c.carId==='r32')));
  assert.match(source('src/data/arkonChapter10Work.js'),/delete states\.arkonLibertyWalk240z/);
  assert.match(source('src/data/arkonChapter10Work.js'),/write\(s,'selectedCarId',choice\)/);
});

test('Porsche night-drive has matching preloaded portraits and the correct home wardrobe',()=>{
  const race=source('src/scenes/RaceScene.js');
  assert.match(race,/\['homeNormal','homeHappy','homeSerious','homeBlushing','homeConfident','homeContemplative'\]/);
  assert.match(race,/\['storyIdle','storyTalking','storySerious','storyCoolShy','storyConfidentSmirk'\]/);
  assert.match(race,/this\.arkonCh10Dialogue=createGinzaBanterHud\(this,\{storyCruise:true,homeClothes:true\}\)/);
  assert.match(race,/this\.arkonCh10Dialogue\?\.show\(speaker,words,pose\)/);
  assert.match(race,/updateArkonCh10Cruise\(dt,deltaMs\/1000\)/);
  assert.match(race,/CONTINUE TO YOKOHAMA/);
  assert.match(race,/if\(this\.arkonCh10Seconds>=29\)/);
  assert.match(source('src/ui/GinzaBanterHud.js'),/const sayakaPose=\(chapter03\|\|homeClothes\)\?'homeNormal'/);
});

test('R749 retains already started Chapter 10 save checkpoints and prior outcome',()=>{
  const sale=indexOf('ARKON_CH10_SELL_Z');
  const registry={id:'arkonChapter10',vars:{storyR678:true,storyR679:true,storyR748:true}};
  const oldBefore={...registry,index:sale};
  const unaffected=migrateArkonR749Checkpoint({script:chapter},oldBefore);
  assert.equal(unaffected.index,sale);
  const oldAfter={...registry,index:sale+1};
  const shifted=migrateArkonR749Checkpoint({script:chapter},oldAfter);
  assert.equal(shifted.index,sale+3);
  assert.equal(steps[shifted.index].type,'CLEAR_STAGE');
  assert.equal(shifted.vars.storyR749,true);
  assert.equal(migrateArkonR749Checkpoint({script:chapter},
    {...oldAfter,vars:{storyR749:true}}),null);
  assert.match(source('src/story/StoryDirector.js'),/migrated748\?post748/);
  assert.match(source('src/story/StoryDirector.js'),/storyR749:true/);
});
