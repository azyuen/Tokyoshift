import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { cars, carOrder } from '../src/data/cars.js';
import { engines } from '../src/data/engines.js';
import { HERO_CAR_ASSETS, HERO_WHEEL_DIAMETERS } from '../src/data/heroCarAssets.js';
import { GINZA_LISTINGS, getGinzaCollectorState } from '../src/data/centralTokyo.js';
import { normaliseState, createDefaultGameState } from '../src/state/GameState.js';
import { preloadCarAppearanceAssets, createCarBodyLayers, getCarTextureKeys } from '../src/vehicles/CarAppearance.js';
import { getWheelPairFit, getWheelContactOffsetY } from '../src/vehicles/WheelFit.js';
import { run } from './ai-driving.mjs';
const ids=Object.keys(HERO_CAR_ASSETS);
test('reference heroes do not receive the legacy collector ground correction twice',()=>{
  const race=readFileSync(new URL('../src/scenes/RaceScene.js',import.meta.url),'utf8');
  const gallery=readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
  assert.match(race,/if \(cfg.singleBody && !referenceCar\)/);
  assert.match(gallery,/if \(car.visual.singleBody && !car.visual.referenceStandard/);
});
test('20 fixed-livery heroes load only their exact body asset; canvas and catalog agree',()=>{
  assert.equal(ids.length,20);
  for(const id of ids){
    const car=cars[id], v=car.visual;
    assert.ok(car.collector && car.tuningLocked,id);
    assert.ok(!carOrder.includes(id),id);
    assert.equal(GINZA_LISTINGS.filter(x=>x.carId===id).length,1,id);
    const queued=[];
    preloadCarAppearanceAssets({textures:{exists:()=>false},load:{image:(key,path)=>queued.push(path)}},{[id]:car});
    assert.deepEqual(queued,[v.bodyPath],id);
    const bytes=readFileSync(new URL('../'+v.bodyPath,import.meta.url));
    assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[v.referenceCanvasWidth,v.referenceCanvasHeight],id);
    if(v.wheelPath) assert.ok(existsSync(new URL('../'+v.wheelPath,import.meta.url)),id);
    assert.ok(engines[car.engine],id);
  }
});
test('per-axle sizes preserve contact and right-edge registration at every zoom and flip',()=>{
  const source={width:384,height:384};
  for(const id of ids) for(const scale of [.32,.55,.8]) for(const flip of [false,true]){
    const v=cars[id].visual,g=HERO_CAR_ASSETS[id],fit=getWheelPairFit(v,scale,flip,source);
    for(const axle of ['rear','front']){
      assert.equal(fit[axle].wheelScale,HERO_WHEEL_DIAMETERS[g[axle]]*scale/384,id);
      assert.ok(Math.abs(fit[axle].offsetY+getWheelContactOffsetY(source,fit[axle].wheelScale))<1e-8,id);
      assert.equal(fit[axle].offsetX,(flip?-v.referenceCanvasWidth-g[axle+'X']:g[axle+'X'])*scale,id);
    }
  }
  assert.deepEqual([cars.libertyWalkR35.visual.referenceRearWheelDiameter,cars.libertyWalkR35.visual.referenceFrontWheelDiameter],[210,194]);
  for(const id of ['veilsideFortuneRx7','rwbStellaPorsche','essoToyotaGtOne','cleanToyotaGtOne','calsonicR390','cleanR390']){
    assert.deepEqual([cars[id].visual.referenceRearWheelDiameter,cars[id].visual.referenceFrontWheelDiameter],[194,182]);
  }
});
test('single-body reference heroes never tint or reuse stale paint textures',()=>{
  for(const id of ids){
    const made=[];
    const scene={textures:{exists:()=>true},add:{image(x,y,key){
      const o={key,setOrigin(a,b){this.origin=[a,b];return this},setScale(){return this},setFlipX(){return this},setDepth(){return this},setTint(){throw Error('Hero tint attempted')},setData(){return this}};
      made.push(o);return o;
    }}};
    const layers=createCarBodyLayers(scene,cars[id],{x:800,y:500,scale:.32,paintColor:0xff0000});
    assert.equal(made.length,1,id);
    assert.equal(made[0].key,getCarTextureKeys(cars[id]).body);
    assert.deepEqual(made[0].origin,[1,1]);
    assert.equal(layers.paint,null);
  }
});
test('collector ownership and legacy GC8 migration do not consume the new 22B',()=>{
  const saved=normaliseState({...createDefaultGameState(),ownedCarIds:ids,selectedCarId:'mcrae22B',carStates:Object.fromEntries(ids.map(id=>[id,getGinzaCollectorState(id)]))});
  assert.deepEqual(saved.ownedCarIds,ids);
  assert.equal(saved.selectedCarId,'mcrae22B');
  assert.equal(cars.mcrae22B.engine,'ej22g_collector');
});
test('all 20 collectors finish standing and rolling half-mile races without invalid controls',()=>{
  for(const id of ids) for(const rolling of [false,true]){
    const result=run(id,4,{rolling,state:getGinzaCollectorState(id)});
    assert.ok(result.finish>0 && result.finish<45,id);
  }
});
