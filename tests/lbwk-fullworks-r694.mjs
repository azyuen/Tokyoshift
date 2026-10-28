import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { LBWK_CATALOG,LBWK_FULL_WORKS_STATE,LBWK_HERO_BOOST,getLbwkConversionQuote } from '../src/data/lbwkFullWorks.js';
import { LBWK_CONVERSIONS } from '../src/data/lbwkConversions.js';
import { cars } from '../src/data/cars.js';
import { engines } from '../src/data/engines.js?v=20261026-r687';
import { getBuiltCar } from '../src/vehicles/VehiclePerformance.js';
import { estimateElapsed } from '../src/vehicles/PerformanceEstimate.js';
import { TUNER_OPTION_BY_ID } from '../src/data/tunerShops.js';
import { GINZA_LISTINGS } from '../src/data/centralTokyo.js';

const source = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('eight Liberty Walk donor classes stay diverse; seven non-240Z builds remain independent',()=>{
  assert.equal(LBWK_CATALOG.length,8);
  assert.equal(LBWK_CONVERSIONS.length,7);
  assert.equal(new Set(LBWK_CATALOG.map(g=>g.donor)).size,8);
  assert.deepEqual(LBWK_CATALOG.map(g=>cars[g.donor].stockClass).sort(),
    ['A','A','A','B','B','C','D','D']);
  assert.ok(LBWK_HERO_BOOST>1);
});

test('quote charges missing path increments plus a fixed bespoke premium and never double bills',()=>{
  for(const item of LBWK_CATALOG){
    const stock=getLbwkConversionQuote(item,{});
    const full=getLbwkConversionQuote(item,LBWK_FULL_WORKS_STATE);
    assert.ok(stock.fullPartsCost>2000000,item.id);
    assert.ok(stock.specialistPremium>0,item.id);
    assert.equal(stock.installedCredit,0,item.id);
    assert.equal(stock.fullPrice,stock.total,item.id);
    assert.equal(full.remainingPartsCost,0,item.id);
    assert.equal(full.installedCredit,stock.fullPartsCost,item.id);
    assert.equal(full.total,stock.specialistPremium,item.id);
    const half=getLbwkConversionQuote(item,{
      tuning:{engine:2,intake:3,ecu:1,turbo:0,intercooler:2},
      chassisTuning:{tyres:3,weightReduction:1},
      exhaustNosTuning:{nosKit:2,nitrousShot:1},
    });
    assert.ok(full.total<half.total&&half.total<stock.total,item.id);
    assert.equal(stock.total-half.total,half.installedCredit,item.id);
  }
});

test('every LBWK sealed car represents full level-three tune and has three usable NOS shots',()=>{
  for(const build of LBWK_CATALOG){
    const donor=cars[build.donor];
    const hero=cars[build.id];
    assert.ok(hero&&donor&&engines[hero.engine],build.id);
    assert.equal(hero.collector,true,build.id);
    assert.equal(hero.tuningLocked,true,build.id);
    assert.equal(hero.lbwkFullWorks,true,build.id);
    assert.equal(hero.nosPower,75,build.id);
    assert.equal(hero.nosShots,3,build.id);
    assert.equal(hero.nosCapacitySeconds,3,build.id);
    const built=getBuiltCar(hero.id,{collector:true,tuningLocked:true,immutable:true});
    assert.equal(built.car.nosShots,3,build.id);
    assert.equal(built.car.nosCapacitySeconds,3,build.id);
    assert.ok(hero.powerKW>donor.powerKW,build.id);
  }
});

test('Aruken RB26 one-off is separate from story body and career 240Z, sold at Ginza',()=>{
  const story=cars.arkonLibertyWalk240z;
  const player=cars.libertyWalk240z;
  const oneOff=cars.arkonGinza240z;
  assert.ok(story.storyBodyConversion);
  assert.equal(player.engineModel.includes('L24'),true);
  assert.equal(oneOff.engineModel.includes('RB26DETT'),true);
  assert.notEqual(oneOff.engine,player.engine);
  assert.notEqual(oneOff.engine,story.engine);
  assert.equal(oneOff.arkonOneOff,true);
  // The black/gold #16 belongs both to Aruken's Story Mode appearance
  // and his Ginza RB26 one-off; the player's #52 art is independent.
  assert.equal(story.visual.bodyPath,
    'assets/Cars/hero/liberty_walk_aruken240z_hero_body.png');
  assert.equal(oneOff.visual.bodyPath,story.visual.bodyPath);
  assert.equal(player.visual.bodyPath,
    'assets/Cars/hero/liberty_walk_240z_hero_body.png');
  assert.notEqual(player.visual.bodyPath,oneOff.visual.bodyPath);
  assert.notEqual(player.visual.assetStem,oneOff.visual.assetStem);
  for(const path of [player.visual.bodyPath,oneOff.visual.bodyPath]){
    const asset=new URL('../'+path,import.meta.url);
    assert.ok(statSync(asset).size>100000,path);
  }
  assert.ok(oneOff.powerKW>=600);
  assert.ok(oneOff.powerKW>player.powerKW*1.45);
  assert.ok(getBuiltCar(oneOff.id,{collector:true}).car.nosCapacitySeconds>0);
  const listing=GINZA_LISTINGS.find(x=>x.carId===oneOff.id);
  assert.ok(listing);
  assert.ok(listing.price>=100000000);
  const scene=source('src/scenes/CentralTokyoScene.js');
  assert.match(scene,/item.carId !== 'arkonGinza240z' \|\|/);
  assert.match(scene,/getGinzaRoomStock\(listings/);
  assert.match(scene,/this.getGinzaActiveListing\(\)\?\.carId !== listing.carId/);
  assert.doesNotMatch(scene,/ginzaPrestigeOneOff|drawGinzaPrestigeSelector/);
  assert.doesNotMatch(scene,/!hasSeenCutscene\(this.registry,'proSponsorEpilogue'\)/);
});

test('Live conversion quote is applied at confirmation and at final payment; no flat fee still charged',()=>{
  const scene=source('src/scenes/TunerShopScene.js');
  assert.match(scene,/getLbwkConversionQuote\(LBWK_CATALOG.find\(item=>item.id===heroId\),donorState\)/);
  assert.match(scene,/quote\.total/);
  assert.match(scene,/INSTALLED CREDIT/);
  assert.match(scene,/lbwkPartsCredit/);
  assert.match(scene,/nosInstalled: Boolean\(this.shop.cosmeticOnly\)/);
  assert.match(source('src/vehicles/VehiclePerformance.js'),/config\.lbwkFullWorks \|\| config\.arkonOneOff/);
});

test('402m estimates: full works beats donor Lv3; regional-stack comparison is reported',()=>{
  // The game runs in Phaser, but these Node physics tests have no canvas.
  // Match the deterministic subset used by the shared vehicle physics.
  globalThis.Phaser ??= {};
  globalThis.Phaser.Math ??= {
    Clamp: (v,min,max) => Math.max(min,Math.min(max,v)),
    Linear: (a,b,t) => a+(b-a)*t,
  };
  for(const build of LBWK_CATALOG){
    const ordinary=getBuiltCar(build.donor,LBWK_FULL_WORKS_STATE);
    const region=getBuiltCar(build.donor,{
      ...LBWK_FULL_WORKS_STATE,
      specialistTuning:Object.keys(TUNER_OPTION_BY_ID),
    });
    const final=getBuiltCar(build.id,{immutable:true});
    const ordinaryS=estimateElapsed(ordinary.car,ordinary.engine,0,402.336);
    const regionS=estimateElapsed(region.car,region.engine,0,402.336);
    const finalS=estimateElapsed(final.car,final.engine,0,402.336);
    console.log('LBWK_R694_SIM',JSON.stringify({
      build:build.id,ordinaryS:+ordinaryS.toFixed(2),
      regionS:+regionS.toFixed(2),lbwkS:+finalS.toFixed(2),
      kw:final.car.powerKW,nm:final.car.torqueNm,
    }));
    assert.ok(finalS<ordinaryS,
      build.id+' conversion must beat its own fully upgraded regular donor');
  }
});

test('Liberty Walk selector updates every persistent sidebar highlight',()=>{
  const scene = source('src/scenes/TunerShopScene.js');
  assert.match(scene,/this.lbwkChoiceControls.push\(\{id:g.id,button:b,text\}\)/);
  assert.match(scene,/this.refreshLbwkChoiceHighlight\(\)/);
  const start=scene.indexOf('  refreshLbwkChoiceHighlight() {');
  const end=scene.indexOf('  setTabStyle() {',start);
  assert.ok(start>0 && end>start);
  const method = scene.slice(start,end);
  const refresh=new Function('return ({'+method+'}).refreshLbwkChoiceHighlight;')();
  const controls = LBWK_CATALOG.map(g=>{
    const button={
      setFillStyle(color){this.fill=color;return this;},
      setStrokeStyle(width,color){this.stroke=color;return this;},
    };
    const text={setColor(color){this.color=color;return this;}};
    return {id:g.id,button,text};
  });
  const context={shop:{heroCarId:LBWK_CATALOG[0].id},lbwkChoiceControls:controls};
  for(const build of LBWK_CATALOG){
    context.shop.heroCarId=build.id;
    refresh.call(context);
    for(const item of controls){
      const active=item.id===build.id;
      assert.equal(item.button.fill,active?0x3a2d18:0x12202b,build.id+' '+item.id);
      assert.equal(item.button.stroke,active?0xffd889:0x627786,build.id+' '+item.id);
      assert.equal(item.text.color,active?'#ffe2a3':'#dce7eb',build.id+' '+item.id);
    }
  }
  const choose=scene.slice(scene.indexOf('  selectLbwkBuild(g) {'),
    scene.indexOf('  showLbwkBuildSelector() {'));
  assert.match(choose,/this.refreshLbwkChoiceHighlight\(\)/);
  const hero=scene.slice(scene.indexOf('  showHeroMode() {'),
    scene.indexOf('  selectLbwkBuild(g) {'));
  assert.match(hero,/this.refreshLbwkChoiceHighlight\(\)/);
});
