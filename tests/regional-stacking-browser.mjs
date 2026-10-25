// Live preview shell; optional local-source overlay validates before publication.
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'https://azyuen.github.io/Tokyoshift/engineering-preview/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox']});
try{
 const context=await browser.newContext({ignoreHTTPSErrors:true,serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.LOCAL_SOURCE)await page.route('**/engineering-preview/src/**',async route=>{
  const rel=new URL(route.request().url()).pathname.split('/engineering-preview/')[1];
  await route.fulfill({path:path.resolve(rel),contentType:'application/javascript'});
 });
 if(process.env.LOCAL_INDEX)await page.route('**/engineering-preview/?*',route=>route.fulfill({path:process.env.LOCAL_INDEX,contentType:'text/html'}));
 await page.goto(base+'?regional=3',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('CharacterSelectScene'),{},{timeout:90000});
 const initial=await page.evaluate(async()=>{
  const root=location.origin+'/Tokyoshift/engineering-preview/src/';
  const {getBuiltCar}=await import(root+'vehicles/VehiclePerformance.js');
  const {TUNER_SHOPS}=await import(root+'data/tunerShops.js');
  const gs=await import(root+'state/GameState.js');
  const state={tuning:{engine:3,intake:3,ecu:3,turbo:3,intercooler:3},drivetrainTuning:{clutch:3,gearbox:3,differential:3,suspension:3},chassisTuning:{tyres:3,weightReduction:3},exhaustNosTuning:{headers:3,exhaust:3,muffler:3,nosKit:3,nitrousShot:3},stage3Calibration:{ecuBias:1,boostBias:1,gearBias:1},specialistTuning:Object.values(TUNER_SHOPS).flatMap(s=>s.tuningOptions.map(o=>o.id))};
  const fixture=gs.createDefaultGameState();Object.assign(fixture,{firstName:'Regional',lastName:'Fixture',ownedCarIds:['r34'],selectedCarId:'r34',preferredCarId:'r34'});fixture.carStates.r34=state;
  gs.importProfileBackup(0,{format:'TOKYO_SHIFT_PROFILE_BACKUP',formatVersion:1,state:fixture});
  const b=getBuiltCar('r34',state);return {power:b.car.powerKW,torque:b.car.torqueNm,options:state.specialistTuning.length,refinement:b.car.specialistRefinement};
 });assert.equal(initial.power,476);assert.equal(initial.options,21);assert.ok(initial.refinement.sharedLimits);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('ProfileSelectScene'),{},{timeout:90000});
 const restored=await page.evaluate(async()=>{
  const root=location.origin+'/Tokyoshift/engineering-preview/src/';
  const gs=await import(root+'state/GameState.js');const {getBuiltCar}=await import(root+'vehicles/VehiclePerformance.js');
  const p=gs.getProfileState(0);return {name:p.firstName,power:getBuiltCar('r34',p.carStates.r34).car.powerKW,options:p.carStates.r34.specialistTuning.length};
 });assert.equal(restored.power,initial.power);assert.equal(restored.options,21);assert.equal(restored.name,'Regional');assert.deepEqual(errors,[]);
 const result={mode:process.env.LOCAL_SOURCE?'hosted shell with local source overlay':'hosted preview',initial,restored,errors};
 fs.writeFileSync('docs/engineering/regional-stacking-browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
