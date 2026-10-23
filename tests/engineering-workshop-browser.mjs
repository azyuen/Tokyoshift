import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1024,height:768},serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 if(process.env.PHASER_LOCAL)await page.route('**/phaser@3.90.0/dist/phaser.min.js',r=>r.fulfill({path:process.env.PHASER_LOCAL,contentType:'application/javascript'}));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('CharacterSelectScene'),{},{timeout:90000});
 console.log('Booted; importing workshop fixture');
 await page.evaluate(async()=>{
  const gs=await import('./src/state/GameState.js'),s=gs.createDefaultGameState();
  Object.assign(s,{firstName:'Workshop',lastName:'Fixture',cash:30000000,wins:90,selectedCarId:'r34',preferredCarId:'r34',ownedCarIds:['r34'],openingChapter:null});
  s.cutscenesSeen=Object.keys((await import('./src/data/cutscenes.js')).CUTSCENES);
  s.carStates.r34={tuning:{engine:0,intake:0,ecu:0,turbo:0,intercooler:0},chassisTuning:{weightReduction:2,tyres:2},exhaustNosTuning:{headers:2,exhaust:2,muffler:2}};
  gs.importProfileBackup(0,{format:'TOKYO_SHIFT_PROFILE_BACKUP',formatVersion:1,state:s});gs.setActiveProfileIndex(0);
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('ProfileSelectScene'),{},{timeout:90000});
 await page.evaluate(()=>{const s=window.TOKYO_SHIFT.scene.getScene('ProfileSelectScene');s.selectProfile(0);s.confirmSelectedProfile();});
 await page.waitForFunction(()=>window.TOKYO_SHIFT?.scene?.isActive('GarageScene'),{},{timeout:240000});
 console.log('Profile loaded; opening engine workshop');
 await page.evaluate(()=>window.TOKYO_SHIFT.scene.getScene('GarageScene').enterEngineMode());
 await page.waitForFunction(()=>{const s=window.TOKYO_SHIFT.scene.getScene('GarageScene');return s?.engineMode&&s.enginePreviewText;},{},{timeout:240000});
 console.log('Workshop opened; checking complete build and boost warning');
 const result=await page.evaluate(async()=>{
  const s=window.TOKYO_SHIFT.scene.getScene('GarageScene');s.pendingEngineTuning.turbo=3;s.refreshEngineMode();
  const {getBuiltCar}=await import('./src/vehicles/VehiclePerformance.js');
  const state=s.registry.get('carStates').r34;
  const expected=getBuiltCar('r34',{...state,tuning:s.pendingEngineTuning,engineTuning:s.pendingEngineTuning,stock:false});
  const actual=s.getEnginePreviewBuild().preview;
  return {previewText:s.enginePreviewText.text,power:actual.car.powerKW,weight:actual.car.vehicleMassKg,expectedPower:expected.car.powerKW,expectedWeight:expected.car.vehicleMassKg,cost:s.getPendingEngineCost()};
 });
 assert.match(result.previewText,/BOOST LIMITED/);assert.equal(result.power,result.expectedPower);assert.equal(result.weight,result.expectedWeight);assert.ok(result.cost>0);assert.deepEqual(errors,[]);
 await page.waitForTimeout(1800);fs.mkdirSync('artifacts/engineering',{recursive:true});await page.screenshot({path:'artifacts/engineering/workshop-preview.png'});
 fs.writeFileSync('docs/engineering/workshop-browser-results.json',JSON.stringify({browser:await browser.version(),viewport:{width:1024,height:768},localPhaser:Boolean(process.env.PHASER_LOCAL),result,errors,scope:'Local synthetic profile; actual workshop preview and unsupported turbo warning. No purchase, race or deployment in this run.'},null,2));
}finally{await browser.close();}
