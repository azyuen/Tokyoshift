// Local smoke test. Use a complete checkout served on :8765. Optional executable/CDN override for CI.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('artifacts/engineering',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{for(const viewport of [{width:1024,height:768},{width:390,height:844}]){
 const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
 if(process.env.PHASER_LOCAL)await page.route('**/phaser@3.90.0/dist/phaser.min.js',r=>r.fulfill({path:process.env.PHASER_LOCAL,contentType:'application/javascript'}));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('CharacterSelectScene'),{},{timeout:90000});
 const fixture=await page.evaluate(async()=>{
  const gs=await import('./src/state/GameState.js');const s=gs.createDefaultGameState();Object.assign(s,{firstName:'Engineering',lastName:'Fixture',cash:30000000,wins:90,selectedCarId:'r34',preferredCarId:'r34',ownedCarIds:['ae86','r34'],openingChapter:null});
  s.carStates.r34={tuning:{engine:3,intake:3,ecu:3,turbo:3,intercooler:3},drivetrainTuning:{clutch:3,gearbox:3,differential:3,suspension:3},chassisTuning:{tyres:3,weightReduction:3},exhaustNosTuning:{headers:3,exhaust:3,muffler:3},paintColor:0xffffff};
  gs.importProfileBackup(0,{format:'TOKYO_SHIFT_PROFILE_BACKUP',formatVersion:1,state:s});gs.setActiveProfileIndex(0);return gs.getProfileState(0).firstName;
 });assert.equal(fixture,'Engineering');
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('ProfileSelectScene'),{},{timeout:90000});
 await page.evaluate(()=>{const s=window.TOKYO_SHIFT.scene.getScene('ProfileSelectScene');s.selectProfile(0);s.confirmSelectedProfile();});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('GarageScene'),{},{timeout:240000});
 const park=await page.evaluate(async()=>{
  const g=window.TOKYO_SHIFT.scene.getScene('GarageScene');g.selectCar('r34');const get=()=>g.registry.get('carStates').r34;
  const {getBuiltCar}=await import('./src/vehicles/VehiclePerformance.js');const {isPerformanceStockState}=await import('./src/data/crewSystem.js');
  const before=getBuiltCar('r34',get()).car.powerKW;g.factorySetupButton.emit('pointerdown');const parked=getBuiltCar('r34',get()).car.powerKW,stock=isPerformanceStockState(get());g.factorySetupButton.emit('pointerdown');const restored=getBuiltCar('r34',get()).car.powerKW;return {before,parked,stock,restored,label:g.engineeringLabelText.text};
 });assert.ok(park.before>400);assert.equal(park.parked,206);assert.equal(park.stock,true);assert.equal(park.before,park.restored);
 await page.waitForTimeout(1500);
 await page.screenshot({path:`artifacts/engineering/garage-${viewport.width}.png`,fullPage:true});
 let dyno=null,race=null;
 if(viewport.width===1024){
  console.log('Garage verified; opening actual DynoScene');
  await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('GarageScene').scene.start('DynoScene',{rentalSession:true,carId:'r34'}));
  await page.waitForFunction(()=>window.TOKYO_SHIFT.scene.getScene('DynoScene')?.build,{},{timeout:240000});
  await page.evaluate(()=>{const d=window.TOKYO_SHIFT.scene.getScene('DynoScene');d.enterDynoTest('power');d.handlePrimaryRunAction();d.currentGear=d.recommendedGear;d.controls.update=()=>({throttle:1,clutch:0,nos:false});d.controls.consumeGearRequest=()=>null;});
  await page.waitForFunction(()=>{const d=window.TOKYO_SHIFT.scene.getScene('DynoScene');return d.pullState==='COMPLETE'||d.dynoUpdateError;},{},{timeout:90000});
  dyno=await page.evaluate(()=>{const d=window.TOKYO_SHIFT.scene.getScene('DynoScene');return {state:d.pullState,error:d.dynoUpdateError,displayKW:d.build.car.powerKW,runKW:d.registry.get('carStates').r34.dyno.lastRun?.maxPowerKW,points:d.points.length};});
  assert.equal(dyno.state,'COMPLETE');assert.ok(!dyno.error);assert.ok(dyno.points>20);assert.ok(Math.abs(dyno.runKW-dyno.displayKW)/dyno.displayKW<.03);
  await page.screenshot({path:'artifacts/engineering/dyno-1024.png'});
  console.log('Dyno verified; opening stock recruitment RaceScene');
  await page.evaluate(async()=>{const game=window.TOKYO_SHIFT,r=game.registry;const {parkPerformanceParts}=await import('./src/data/factorySetup.js');const {getEncounterAi}=await import('./src/data/encounterProfiles.js');const states=r.get('carStates');states.r34=parkPerformanceParts(states.r34);r.set('carStates',states);
   Object.entries({selectedCarId:'r34',selectedOpponentCarId:'r34',selectedOpponentCharacterId:'daigoArakawa',selectedRaceCategory:'CREW_RECRUIT',selectedRaceType:'Standing Start',selectedRaceDeal:'CREW_RECRUIT',selectedRaceDistanceM:402.336,selectedOpponentEncounterRating:4,selectedOpponentEncounterAi:getEncounterAi(4),crewRecruitChallenge:{active:true,baseCarId:'r34',characterId:'daigoArakawa',regionId:'SHINJUKU'},playerDifficulty:'STANDARD',raceDistrict:'SHINJUKU'}).forEach(([k,v])=>r.set(k,v));
   game.scene.getScene('DynoScene').scene.start('RaceScene');
  });
  await page.waitForFunction(()=>window.TOKYO_SHIFT.scene.isActive('RaceScene')&&window.TOKYO_SHIFT.scene.getScene('RaceScene').controls,{},{timeout:240000});
  await page.evaluate(async()=>{const s=window.TOKYO_SHIFT.scene.getScene('RaceScene');const {default:AI}=await import('./src/ai/DragRacingAI.js');const {getEncounterAi}=await import('./src/data/encounterProfiles.js');const driver=new AI(s.player,getEncounterAi(5),{rating:5,random:()=>.5});s.controls.update=()=>driver.update(Math.min(1/30,s.game.loop.delta/1000),s.raceClock,s.greenClock);s.controls.consumeGearRequest=()=>s.player.transmission.currentGear===0?1:null;s.startButton.emit('pointerdown');});
  await page.waitForFunction(()=>window.TOKYO_SHIFT.scene.getScene('RaceScene').resultsShown,{},{timeout:120000});
  race=await page.evaluate(()=>{const s=window.TOKYO_SHIFT.scene.getScene('RaceScene');return {resultsShown:s.resultsShown,opponentCharacterId:s.opponentCharacterId,playerKW:s.player.config.powerKW,opponentKW:s.opponent.config.powerKW,playerDistance:s.player.positionM,opponentDistance:s.opponent.positionM,finished:s.finished,falseStart:s.falseStart};});
  assert.equal(race.opponentCharacterId,'daigoArakawa');assert.equal(race.playerKW,206);assert.equal(race.opponentKW,206);assert.ok(race.finished);assert.ok(race.playerDistance>=400&&race.opponentDistance>=400);assert.ok(!race.falseStart);
  await page.waitForTimeout(1500);
  await page.screenshot({path:'artifacts/engineering/race-1024.png'});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 results.push({viewport,profileLoaded:true,park,dyno,race,input:'scene action handlers; automated pedal/gear input for dyno and race',errors,failed});await context.close();
}}finally{await browser.close();fs.writeFileSync('docs/engineering/browser-results.json',JSON.stringify({browser:'Chromium',phaserLocalOverride:Boolean(process.env.PHASER_LOCAL),results},null,2));}
