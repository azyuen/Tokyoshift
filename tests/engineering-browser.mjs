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
 await page.screenshot({path:`artifacts/engineering/garage-${viewport.width}.png`,fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 results.push({viewport,profileLoaded:true,park,errors,failed});await context.close();
}}finally{await browser.close();fs.writeFileSync('docs/engineering/browser-results.json',JSON.stringify({browser:'Chromium',phaserLocalOverride:Boolean(process.env.PHASER_LOCAL),results},null,2));}
