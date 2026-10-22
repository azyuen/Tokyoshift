import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {
  CINEMATIC_FAMILIES,CINEMATIC_FRAMES,CINEMATIC_PROJECTION_DEFAULTS,
  STORY_BACKGROUNDS,ALL_STORY_BACKGROUND_IDS,
  getStoryBackground,listStoryBackgrounds,
} from '../src/data/storyBackgroundCatalog.js';
import {
  getSceneProjection,projectGroundFactor,projectGroundEntity,
} from '../src/story/StoryPerspective.js';
import {ALL_MEET_LOCATION_IDS,getMeetBackgroundForPhase} from '../src/data/meetAssets.js';
import {WORKSHOP_TIERS} from '../src/data/workshopProgression.js';
import {CENTRAL_TOKYO_LOCATIONS} from '../src/data/centralTokyo.js';
import {TUNER_SHOPS} from '../src/data/tunerShops.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
const code=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('background consolidation defines exactly three environment families, no relocated images',()=>{
  assert.deepEqual(CINEMATIC_FAMILIES,['location','interior','road']);
  assert.equal(new Set(ALL_STORY_BACKGROUND_IDS).size,ALL_STORY_BACKGROUND_IDS.length);
  assert.ok(ALL_STORY_BACKGROUND_IDS.length>=115,
    'should cover meets, workshops, Central, tuner shops, Oshiage, road and pro');
  assert.equal(Object.keys(STORY_BACKGROUNDS).length,ALL_STORY_BACKGROUND_IDS.length);
  for(const id of ALL_STORY_BACKGROUND_IDS){
    const bg=getStoryBackground(id);
    assert.equal(bg.id,id);
    assert.ok(CINEMATIC_FAMILIES.includes(bg.family),id);
    assert.ok(Number.isFinite(bg.frame.w)&&bg.frame.w>0,id);
    assert.ok(Number.isFinite(bg.frame.h)&&bg.frame.h>0,id);
    assert.equal(bg.calibration,'provisional','do not mislabel estimated horizon as measured');
    if(bg.layered){
      assert.equal(bg.family,'road',id);
      assert.equal(bg.asset,null,id);
      assert.ok(bg.layers?.length>=2,id);
      for(const layer of bg.layers){
        if(layer.path)assert.ok(existsSync(layer.path),id+' missing layer '+layer.path);
      }
    }else{
      assert.ok(bg.asset?.key && bg.asset.path,id+' needs an asset');
      assert.ok(existsSync(bg.asset.path),id+' missing image '+bg.asset.path);
    }
  }
  assert.equal(getStoryBackground('does-not-exist'),null);
  assert.equal(listStoryBackgrounds({family:'road'}).every(x=>x.layered),true);
});

test('catalog references original active location registries, not a duplicated second list',()=>{
  for(const id of ALL_MEET_LOCATION_IDS)for(const phase of ['day','night']){
    const bg=getStoryBackground('meet:'+id+':'+phase);
    assert.equal(bg.asset.path,getMeetBackgroundForPhase(id,phase).path);
    assert.equal(bg.frameId,'location');
  }
  for(const w of WORKSHOP_TIERS)for(const phase of ['day','night']){
    const bg=getStoryBackground('workshop:'+w.id+':'+phase);
    assert.equal(bg.asset.path,w.phaseBackgrounds[phase].path);
  }
  for(const shop of Object.values(TUNER_SHOPS).filter(x=>x.enabled)){
    for(const phase of ['day','night']){
      const bg=getStoryBackground('tuner:'+shop.id+':'+phase);
      assert.equal(bg.asset.path,shop.phaseBackgrounds[phase].path);
      assert.equal(bg.fit,'bottom-cover');
    }
  }
  assert.equal(getStoryBackground('central:tokyoAutoMarket:used:day').fit,'contain');
  assert.equal(getStoryBackground('central:ginzaMotorGallery:night').family,'interior');
  assert.equal(getStoryBackground('ginza:private-vault').asset.path,
    'assets/CentralTokyo/tokyo_ginza03.png');
  assert.ok(getStoryBackground('oshiage:skytree02:night'));
  assert.ok(getStoryBackground('pro:dragstrip:full:night').layered);
  assert.equal(getStoryBackground('road:SHIBUYA:night').layers[1].renderer,
    'TokyoExpresswayBackground');
  assert.equal(Object.keys(CENTRAL_TOKYO_LOCATIONS).length,3);
});

test('horizon equation is monotonic, reference scale is one, and movement stops at back line',()=>{
  for(const family of ['location','interior']){
    const p=getSceneProjection(family);
    const back=projectGroundFactor(family,-10);
    const far=projectGroundFactor(family,p.backLimit);
    const ref=projectGroundFactor(family,p.reference);
    const near=projectGroundFactor(family,p.near);
    assert.equal(back.ground,p.backLimit,'cannot walk behind the horizon/back line');
    assert.equal(far.ground,p.backLimit);
    assert.ok(far.scaleFactor<ref.scaleFactor);
    assert.ok(near.scaleFactor>ref.scaleFactor);
    assert.ok(Math.abs(ref.scaleFactor-1)<1e-10);
    assert.equal(back.clamped,true);
    assert.equal(projectGroundFactor(family,10).ground,p.near,
      'cannot walk beyond foreground edge');
    let last=-Infinity;
    for(let i=0;i<=30;i++){
      const y=p.backLimit+(p.near-p.backLimit)*i/30;
      const f=projectGroundFactor(family,y).scaleFactor;
      assert.ok(f>=last-1e-8);
      last=f;
    }
  }
});

test('cars and characters share the same depth multiplier but keep own reference dimensions',()=>{
  const background=getStoryBackground('meet:shibuyaDogenzaka:day');
  const frame={x:0,y:0,w:1560,h:840};
  const car=projectGroundEntity(background,{kind:'car',ground:.76,x:.65,frame});
  const person=projectGroundEntity(background,{kind:'character',ground:.76,x:.32,frame});
  assert.equal(car.scaleFactor,person.scaleFactor);
  assert.ok(car.displayWidth>person.displayHeight);
  assert.ok(Math.abs(car.displayWidth-1560*.69)<1e-8);
  assert.ok(Math.abs(person.displayHeight-840*.48)<1e-8);
  const nearPerson=projectGroundEntity(background,{kind:'character',ground:.86,frame});
  assert.ok(nearPerson.displayHeight>person.displayHeight);
  const farPerson=projectGroundEntity(background,{kind:'character',ground:.58,frame});
  assert.ok(farPerson.displayHeight<person.displayHeight);
  assert.ok(farPerson.depth<nearPerson.depth,'further character renders behind');
  assert.throws(()=>projectGroundEntity(background,{kind:'monster'}),/Unknown staged sprite/);
});

test('orthographic side-on race cars never zoom based on lane Y',()=>{
  const lane1=projectGroundEntity(getStoryBackground('road:SHIBUYA:night'),
    {kind:'car',ground:.50,frame:CINEMATIC_FRAMES.road});
  const lane2=projectGroundEntity(getStoryBackground('road:SHIBUYA:night'),
    {kind:'car',ground:.82,frame:CINEMATIC_FRAMES.road});
  assert.equal(lane1.displayWidth,lane2.displayWidth);
  assert.equal(lane1.scaleFactor,1);
  assert.equal(lane2.scaleFactor,1);
  assert.equal(lane1.horizonY,null);
});

test('perspective expression can converge x towards the vanishing point',()=>{
  const b=getStoryBackground('meet:shibuyaDogenzaka:day');
  const far=projectGroundEntity(b,{
    kind:'car',ground:.57,x:.9,followVanishing:true});
  const near=projectGroundEntity(b,{
    kind:'car',ground:.83,x:.9,followVanishing:true});
  const centre=(b.frame.x+b.frame.w*.5);
  assert.ok(Math.abs(far.x-centre)<Math.abs(near.x-centre));
  assert.ok(far.x>centre);
});

test('generic authored STAGE can opt in by backgroundId; legacy positions remain intact',()=>{
  const codeStage=code('src/ui/StoryStage.js');
  assert.match(codeStage,/backgroundId = null/);
  assert.match(codeStage,/getStoryBackground\(backgroundId\)/);
  assert.match(codeStage,/projectGroundEntity\(profile/);
  assert.match(codeStage,/layered\)/);
  assert.match(codeStage,/stageMode==='native'/);
  assert.match(codeStage,/const autoPerspective=Boolean\(profile\)/);
  assert.ok(validateStoryScript(STORY_DIRECTOR_SCRIPTS.devVaultNightOut));
});

test('dev author can compare real location and interior backgrounds without writing coordinates',()=>{
  const script=STORY_DIRECTOR_SCRIPTS.directorPerspectivePreview;
  assert.ok(validateStoryScript(script));
  const stageSteps=script.steps.filter(step=>step.type==='STAGE');
  assert.equal(stageSteps.length,3);
  for(const step of stageSteps){
    const bg=getStoryBackground(step.backgroundId);
    assert.ok(bg && !bg.layered);
    assert.equal(step.stageMode,'cinematic');
    assert.ok(step.characters.length>=2);
    assert.ok(step.cars.length>=1);
    assert.equal(step.cars[0].ground>=.5,true);
  }
  const tester=code('src/ui/CutsceneTester.js');
  assert.match(tester,/__directorPerspective/);
  assert.match(tester,/directorPerspectivePreview/);
  const imports=code('src/story/StoryDirector.js');
  assert.match(imports,/StoryStage\\.js\\?v=20261022-r644/);
});
