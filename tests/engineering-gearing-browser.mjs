// Targeted AP1 scene check; synthetic profile only, no public deployment.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],failed=[];
try{
 const context=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
 if(process.env.PHASER_LOCAL)await page.route('**/phaser@3.90.0/dist/phaser.min.js',r=>r.fulfill({path:process.env.PHASER_LOCAL,contentType:'application/javascript'}));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('CharacterSelectScene'),{},{timeout:90000});
 await page.evaluate(async()=>{
  const gs=await import('./src/state/GameState.js'),s=gs.createDefaultGameState();
  Object.assign(s,{firstName:'Gearing',lastName:'Fixture',cash:30000000,wins:90,selectedCarId:'s2000',preferredCarId:'s2000',ownedCarIds:['s2000'],openingChapter:null});
  s.cutscenesSeen=Object.keys((await import('./src/data/cutscenes.js')).CUTSCENES);
  gs.importProfileBackup(0,{format:'TOKYO_SHIFT_PROFILE_BACKUP',formatVersion:1,state:s});gs.setActiveProfileIndex(0);
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('ProfileSelectScene'),{},{timeout:90000});
 await page.evaluate(()=>{const s=window.TOKYO_SHIFT.scene.getScene('ProfileSelectScene');s.selectProfile(0);s.confirmSelectedProfile();});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('GarageScene'),{},{timeout:240000});
 await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('GarageScene').scene.start('DynoScene',{rentalSession:true,carId:'s2000'}));
 await page.waitForFunction(()=>window.TOKYO_SHIFT.scene.getScene('DynoScene')?.build,{},{timeout:240000});
 const gearing=await page.evaluate(()=>{const d=window.TOKYO_SHIFT.scene.getScene('DynoScene');return {carId:d.build.car.id,primary:d.build.car.primaryReductionRatio,final:d.build.car.finalDriveRatio,ratios:d.build.car.gearRatios.map((_,i)=>d.getOverallGearRatio(i+1))};});
 assert.equal(gearing.primary,1.16);assert.equal(gearing.final,4.1);
 [3.133,2.045,1.481,1.161,.970,.810].forEach((r,i)=>assert.ok(Math.abs(gearing.ratios[i]-r*1.16*4.1)<1e-10));
 console.log('AP1 dyno gearing verified; running actual pull');
 await page.evaluate(()=>{const d=window.TOKYO_SHIFT.scene.getScene('DynoScene');d.enterDynoTest('power');d.handlePrimaryRunAction();d.currentGear=d.recommendedGear;d.controls.update=()=>({throttle:1,clutch:0,nos:false});d.controls.consumeGearRequest=()=>null;});
 await page.waitForFunction(()=>{const d=window.TOKYO_SHIFT.scene.getScene('DynoScene');return d.pullState==='COMPLETE'||d.dynoUpdateError;},{},{timeout:90000});
 const dyno=await page.evaluate(()=>{const d=window.TOKYO_SHIFT.scene.getScene('DynoScene');return {state:d.pullState,error:d.dynoUpdateError,displayKW:d.build.car.powerKW,runKW:d.registry.get('carStates').s2000.dyno.lastRun?.maxPowerKW,points:d.points.length};});
 assert.equal(dyno.state,'COMPLETE');assert.ok(!dyno.error);assert.ok(Math.abs(dyno.runKW-184)<184*.03);
 console.log('AP1 dyno complete; verifying stock recruitment scene');
 await page.evaluate(async()=>{
  const game=window.TOKYO_SHIFT,r=game.registry,{getEncounterAi}=await import('./src/data/encounterProfiles.js');
  Object.entries({selectedCarId:'s2000',selectedOpponentCarId:'s2000',selectedOpponentCharacterId:'emiSaionji',selectedRaceCategory:'CREW_RECRUIT',selectedRaceType:'Standing Start',selectedRaceDeal:'CREW_RECRUIT',selectedRaceDistanceM:402.336,selectedOpponentEncounterRating:4,selectedOpponentEncounterAi:getEncounterAi(4),crewRecruitChallenge:{active:true,baseCarId:'s2000',characterId:'emiSaionji',regionId:'SHINJUKU'},playerDifficulty:'STANDARD',raceDistrict:'SHINJUKU'}).forEach(([k,v])=>r.set(k,v));
  game.scene.getScene('DynoScene').scene.start('RaceScene');
 });
 await page.waitForFunction(()=>window.TOKYO_SHIFT.scene.isActive('RaceScene')&&window.TOKYO_SHIFT.scene.getScene('RaceScene').controls,{},{timeout:240000});
 const race=await page.evaluate(()=>{const s=window.TOKYO_SHIFT.scene.getScene('RaceScene');s.rollingSpeedMps=60/3.6;return {playerKW:s.player.config.powerKW,opponentKW:s.opponent.config.powerKW,playerReduction:s.player.transmission.finalDrive,opponentReduction:s.opponent.transmission.finalDrive,rollingRPM:s.rollingGearRPM(s.player,2),wheelRadius:s.player.config.wheelRadius};});
 assert.equal(race.playerKW,184);assert.equal(race.opponentKW,184);assert.equal(race.playerReduction,4.1*1.16);assert.equal(race.opponentReduction,4.1*1.16);
 assert.ok(Math.abs(race.rollingRPM-(60/3.6)/(2*Math.PI*race.wheelRadius)*60*2.045*4.1*1.16)<1e-8);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 fs.mkdirSync('artifacts/engineering',{recursive:true});await page.screenshot({path:'artifacts/engineering/s2000-race-setup.png'});
 fs.writeFileSync('docs/engineering/gearing-browser-results.json',JSON.stringify({browser:await browser.version(),viewport:{width:1024,height:768},localPhaser:Boolean(process.env.PHASER_LOCAL),profileLoaded:true,gearing,dyno,race,errors,failed,scope:'Actual local dyno pull and recruitment race initialization/rolling helper; no completed browser race or physical touch test in this targeted run.'},null,2));
}finally{await browser.close();}
