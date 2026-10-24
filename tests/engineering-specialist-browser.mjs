import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const context=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(process.env.PHASER_LOCAL)await page.route('**/phaser@3.90.0/dist/phaser.min.js',r=>r.fulfill({path:process.env.PHASER_LOCAL,contentType:'application/javascript'}));
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('CharacterSelectScene'),{},{timeout:240000});
 await page.evaluate(async()=>{
  const gs=await import('./src/state/GameState.js');
  const {getTunerShopForRegion}=await import('./src/data/tunerShops.js');
  const shop=getTunerShopForRegion('SHINAGAWA'),s=gs.createDefaultGameState();
  Object.assign(s,{firstName:'Specialist',lastName:'Fixture',cash:30000000,wins:90,ownedCarIds:['gc8'],selectedCarId:'gc8',preferredCarId:'gc8',openingChapter:null});
  s.cutscenesSeen=Object.keys((await import('./src/data/cutscenes.js')).CUTSCENES);
  s.tunerShopProgress={[shop.id]:{visited:true}};
  s.carStates.gc8={stock:false,tuning:{engine:2,ecu:2},specialistTuning:[shop.tuningOptions[0].id],paintColor:0x123456};
  gs.importProfileBackup(0,{format:'TOKYO_SHIFT_PROFILE_BACKUP',formatVersion:1,state:s});gs.setActiveProfileIndex(0);
 });
 async function reopen(){
  await page.reload();
  await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('ProfileSelectScene'),{},{timeout:240000});
  await page.evaluate(()=>{const s=window.TOKYO_SHIFT.scene.getScene('ProfileSelectScene');s.selectProfile(0);s.confirmSelectedProfile();});
  await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('GarageScene'),{},{timeout:240000});
  await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('GarageScene').scene.start('TunerShopScene',{regionId:'SHINAGAWA'}));
  await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('TunerShopScene')&&window.TOKYO_SHIFT.scene.getScene('TunerShopScene').cashText,{},{timeout:240000});
 }
 async function service(){return page.evaluate(async()=>{
  const s=window.TOKYO_SHIFT.scene.getScene('TunerShopScene');s.confirmStockTuneService('gc8');
  const button=s.children.list.find(o=>o.type==='Rectangle'&&o.depth===152&&o.x===925&&o.y===526);
  if(!button)throw Error('Specialist confirmation missing');button.emit('pointerdown');
  const state=s.registry.get('carStates').gc8;
  const {getBuiltCar}=await import('./src/vehicles/VehiclePerformance.js');
  return {cash:s.registry.get('cash'),state,power:getBuiltCar('gc8',state).car.powerKW};
 });}
 await reopen();const prepared=await service();
 assert.equal(prepared.cash,29995000);assert.ok(prepared.state.stockTuneService);assert.equal(prepared.state.specialistTuning.length,0);
 await reopen();
 const afterReload=await page.evaluate(()=>window.TOKYO_SHIFT.registry.get('carStates').gc8);
 assert.deepEqual(afterReload.stockTuneService,prepared.state.stockTuneService);
 const restored=await service();assert.equal(restored.cash,29990000);
 assert.deepEqual(restored.state.tuning,prepared.state.stockTuneService.tune.tuning);
 assert.deepEqual(restored.state.specialistTuning,prepared.state.stockTuneService.tune.specialistTuning);
 assert.equal(restored.state.stockTuneService,undefined);assert.ok(restored.power>prepared.power);
 const heroBefore=await page.evaluate(()=>{
  const s=window.TOKYO_SHIFT.scene.getScene('TunerShopScene'),r=s.registry;
  // Separate factory-donor fixture: never erase the preceding player's stored tune.
  r.set('carStates',{gc8:{stock:true,paintColor:0x123456}});
  const before={cash:r.get('cash'),cost:s.shop.buildCost,heroId:s.shop.heroCarId};
  s.confirmHeroConversion();return before;
 });
 await page.waitForFunction(id=>window.TOKYO_SHIFT.registry.get('selectedCarId')===id,heroBefore.heroId,{timeout:30000});
 const hero=await page.evaluate(async()=>{
  const r=window.TOKYO_SHIFT.registry,gs=await import('./src/state/GameState.js');
  return {cash:r.get('cash'),owned:r.get('ownedCarIds'),state:r.get('carStates')[r.get('selectedCarId')],saved:gs.getProfileState(0).selectedCarId};
 });
 assert.equal(hero.cash,heroBefore.cash-heroBefore.cost);assert.deepEqual(hero.owned,[heroBefore.heroId]);
 assert.equal(hero.state.convertedFrom,'gc8');assert.equal(hero.saved,heroBefore.heroId);assert.equal(hero.state.tuningLocked,true);
 await page.waitForTimeout(1800);
 assert.deepEqual(errors,[]);
 fs.writeFileSync('docs/engineering/hero-browser-results.json',JSON.stringify({scope:'Local Chromium, synthetic factory GC8 fixture, actual confirmation animation and production conversion transaction; other six mappings covered by automated transaction tests',heroBefore,hero,errors},null,2)+'\n');
 fs.writeFileSync('docs/engineering/specialist-browser-results.json',JSON.stringify({browser:await browser.version(),scope:'Local Chromium, synthetic profile, actual specialist confirmation handler and full page reload; not deployed or native-device testing',prepared,restored,storedTuneSurvivedPageReload:true,errors},null,2)+'\n');
 console.log('Specialist paid service and full reload passed');
} finally {await browser.close();}
