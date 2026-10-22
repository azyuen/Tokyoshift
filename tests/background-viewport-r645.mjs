import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getStoryBackground } from '../src/data/storyBackgroundCatalog.js';
import {
  resolveBackgroundViewport,imagePointToScreen,projectEntityOnBackground,
} from '../src/story/BackgroundViewport.js';

const manifest=JSON.parse(fs.readFileSync('docs/background-audit/inventory.json','utf8'));
const MASTER=[1672,941];

test('all actively used meet, Skytree and garage/workshop scenic source canvases are 1672x941',()=>{
  const normalized=new Set(['outdoor_meet','outdoor_oshiage','outdoor_central',
    'workshop_core','workshop_tuner','workshop_crew','workshop_dyno']);
  const images=manifest.images.filter(x=>normalized.has(x.group));
  assert.equal(images.length,76);
  for(const item of images){
    assert.deepEqual([item.width,item.height],MASTER,item.path);
    assert.ok(fs.existsSync(item.path),item.path);
  }
});

test('legitimate story interior camera variations remain separate (not warped into workshops)',()=>{
  for(const item of manifest.images.filter(x=>x.group==='interior_office')){
    assert.deepEqual([item.width,item.height],[1536,1024],item.path);
  }
  for(const item of manifest.images.filter(x=>x.group==='interior_market')){
    assert.deepEqual([item.width,item.height],[1836,857],item.path);
  }
  for(const item of manifest.images.filter(x=>['interior_ginza','interior_registration','interior_oshiage'].includes(x.group))){
    assert.deepEqual([item.width,item.height],MASTER,item.path);
  }
  assert.equal(getStoryBackground('central:tokyoAutoMarket:used:night').fit,'contain');
});

test('day and night within each real outdoor/vehicle workshop venue share raw dimensions',()=>{
  const groups=new Set(['outdoor_meet','outdoor_oshiage','outdoor_central',
    'workshop_core','workshop_tuner','workshop_crew','workshop_dyno']);
  const files=new Map(manifest.images.map(x=>[x.path,x]));
  let validated=0;
  for(const entry of manifest.images.filter(x=>groups.has(x.group)&&x.path.includes('_day.'))){
    const night=entry.path.replace('_day.','_night.').replace('/Day/','/Night/');
    const other=files.get(night);
    assert.ok(other,night+' missing paired art');
    assert.equal(entry.width,other.width,entry.path);
    assert.equal(entry.height,other.height,entry.path);
    validated++;
  }
  assert.ok(validated>=35,validated);
});

test('uniform background transform preserves source image ratio and anchor for each presentation',()=>{
  const full=resolveBackgroundViewport({
    sourceWidth:1672,sourceHeight:941,frame:{x:0,y:0,w:1560,h:840},fit:'cover'});
  const native=resolveBackgroundViewport({
    sourceWidth:1672,sourceHeight:941,frame:{x:24,y:92,w:1138,h:528},fit:'cover'});
  assert.ok(full.scale>native.scale);
  assert.ok(Math.abs(full.width/full.height-1672/941)<1e-10);
  assert.ok(Math.abs(native.width/native.height-1672/941)<1e-10);
  for(const t of [full,native]){
    for(const [u,v] of [[0,0],[.17,.52],[.64,.76],[1,1]]){
      const point=imagePointToScreen(t,u,v);
      assert.ok(Math.abs((point.x-t.left)/t.width-u)<1e-10);
      assert.ok(Math.abs((point.y-t.top)/t.height-v)<1e-10);
    }
  }
});

test('car and character scale equally with background across cropped gameplay and full cinema',()=>{
  const profile=getStoryBackground('meet:shibuyaDogenzaka:day');
  const src={sourceWidth:1672,sourceHeight:941,kind:'car',x:.65,ground:.71};
  const full=projectEntityOnBackground(profile,{...src,frame:{x:0,y:0,w:1560,h:840}});
  const small=projectEntityOnBackground(profile,{...src,frame:{x:24,y:92,w:1138,h:528}});
  assert.equal(full.scaleFactor,small.scaleFactor);
  assert.ok(Math.abs(full.displayWidth/small.displayWidth-full.viewport.scale/small.viewport.scale)<1e-9);
  assert.equal(full.sourceX,small.sourceX);
  assert.equal(full.sourceGround,small.sourceGround);
  assert.ok(Math.abs(full.viewport.top+full.viewport.height*.71-full.groundY)<1e-9);
  assert.ok(Math.abs(small.viewport.top+small.viewport.height*.71-small.groundY)<1e-9);
  for(const kind of ['car','character']){
    const a=projectEntityOnBackground(profile,{kind,x:.25,ground:.76,frame:{x:0,y:0,w:1560,h:840}});
    const b=projectEntityOnBackground(profile,{kind,x:.25,ground:.76,frame:{x:24,y:92,w:1138,h:528}});
    const key=kind==='car'?'displayWidth':'displayHeight';
    assert.ok(Math.abs(a[key]/b[key]-a.viewport.scale/b.viewport.scale)<1e-9);
  }
});

test('legacy custom crop policies preserve their actual background fitting, not stretch',()=>{
  const f={x:24,y:92,w:1138,h:528};
  const source={sourceWidth:1672,sourceHeight:941,frame:f};
  const contain=resolveBackgroundViewport({...source,fit:'contain'});
  const top=resolveBackgroundViewport({...source,fit:'top-fit'});
  const cover=resolveBackgroundViewport({...source,fit:'cover'});
  const bottom=resolveBackgroundViewport({...source,fit:'bottom-cover'});
  const zoom=resolveBackgroundViewport({...source,fit:'zoom-cover'});
  assert.ok(contain.width<=f.w+1e-6&&contain.height<=f.h+1e-6);
  assert.ok(Math.abs(top.top-f.y)<1e-10);
  assert.ok(Math.abs(top.width-f.w)<1e-10);
  assert.ok(Math.abs(bottom.top+bottom.height-(f.y+f.h))<1e-10);
  assert.ok(zoom.width>cover.width);
});

test('floor back line and horizon map with same art transform in all stages',()=>{
  const profile=getStoryBackground('workshop:shinonomeWarehouseStrip:night');
  const a=projectEntityOnBackground(profile,{kind:'character',ground:0,frame:{x:0,y:0,w:1560,h:840}});
  const b=projectEntityOnBackground(profile,{kind:'character',ground:0,frame:{x:24,y:92,w:1138,h:528}});
  for(const x of [a,b]){
    assert.equal(x.groundRatio,x.backLineY ? profile.projection.backLimit : -1);
    assert.ok(Math.abs((x.backLineY-x.viewport.top)/x.viewport.height-profile.projection.backLimit)<1e-10);
    assert.ok(Math.abs((x.horizonY-x.viewport.top)/x.viewport.height-profile.projection.horizon)<1e-10);
  }
});

test('the story scene uses source-art transforms rather than window-Y placement',()=>{
  const scene=fs.readFileSync('src/ui/StoryStage.js','utf8');
  assert.match(scene,/projectEntityOnBackground\(profile/);
  assert.match(scene,/resolveBackgroundViewport\(/);
  assert.doesNotMatch(scene,/projectGroundEntity\(profile/);
  assert.match(scene,/viewport\.centreX,viewport\.centreY/);
  assert.match(scene,/stageMode==='native'/);
  assert.match(scene,/const x=Number\(estimate\?\.x/);
});

test('R645 reviewer presents real image pairs and editable guide line geometry',()=>{
  const html=fs.readFileSync('tools/background-calibrator.html','utf8');
  for(const phrase of ['Background A','Background B','Farthest floor','Reference ground','Copy calibration JSON',
    "inventory.json",'fitImage','horizontal(v,cfg.h']) assert.ok(html.includes(phrase),phrase);
});
