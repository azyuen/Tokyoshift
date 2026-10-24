// Real service-worker activation and offline module fallback, separate from scene smoke.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const oldBuild=process.env.ENGINEERING_OLD_BUILD||'R532';
const oldRuntime='tokyoshift-runtime-'+oldBuild.toLowerCase();
const expectedBuild=JSON.parse(fs.readFileSync('version.json','utf8')).build;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
 await page.goto('http://127.0.0.1:8765/engineering-cache-test.html');
 await page.evaluate(async()=>{await navigator.serviceWorker.register('/engineering-old-sw.js',{scope:'/',updateViaCache:'none'});await navigator.serviceWorker.ready;});
 await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/engineering-old-sw.js'));
 const before=await page.evaluate(async(oldRuntime)=>{
  const gs=await import('/src/state/GameState.js');const s=gs.createDefaultGameState();Object.assign(s,{firstName:'Cache',lastName:'Fixture',ownedCarIds:['r34'],selectedCarId:'r34',cash:1234567});
  gs.importProfileBackup(0,{format:'TOKYO_SHIFT_PROFILE_BACKUP',formatVersion:1,state:s});gs.setActiveProfileIndex(0);
  const old=await caches.open(oldRuntime);await old.put('/engineering-sentinel.js',new Response('old'));
  await caches.open('unrelated-cache-fixture');
  return JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
 },oldRuntime);
 await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js?engineering-cache-check',{scope:'/',updateViaCache:'none'});});
 await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.includes('/sw.js?engineering-cache-check'));
 await page.waitForFunction(async(oldRuntime)=>!(await caches.keys()).includes(oldRuntime),oldRuntime);
 await page.reload();
 const online=await page.evaluate(async(oldRuntime)=>{
  const response=await fetch('/src/data/vehicleEngineering.js');const source=await response.text();
  const names=await caches.keys();const gs=await import('/src/state/GameState.js');
  const staleSentinel=names.includes(oldRuntime) ? await (await caches.open(oldRuntime)).match('/engineering-sentinel.js') : null;
  return {source,names,staleSentinel:Boolean(staleSentinel),profile:gs.getProfileState(0).firstName,storage:JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))};
 },oldRuntime);
 assert.ok(online.names.includes('tokyoshift-runtime-'+expectedBuild.toLowerCase()));
 assert.equal(online.storage,before);assert.equal(online.profile,'Cache');assert.equal(online.staleSentinel,false);assert.ok(online.names.includes('unrelated-cache-fixture'));assert.match(online.source,/ENGINE_ENGINEERING/);
 // Wait for asynchronous cache.put before disconnecting.
 await page.waitForFunction(async()=>{for(const k of await caches.keys())if(k.startsWith('tokyoshift-runtime-')&&await (await caches.open(k)).match('/src/data/vehicleEngineering.js'))return true;return false;});
 await context.setOffline(true);
 const offline=await page.evaluate(async()=>{const r=await fetch('/src/data/vehicleEngineering.js');return {ok:r.ok,source:await r.text()};});
 assert.equal(offline.ok,true);assert.equal(offline.source,online.source);
 fs.writeFileSync('docs/engineering/cache-browser-results.json',JSON.stringify({browser:await browser.version(),oldWorker:oldBuild,newWorker:expectedBuild,cacheNames:online.names,oldCachedContentRemoved:true,oldCacheNote:'An in-flight old-worker request can recreate the old cache after activation; navigation binds the page to the replacement worker.',profilePreserved:true,unrelatedCachePreserved:true,offlineModuleMatches:true,scope:'local Chromium service-worker lifecycle and one cached module; not a full offline game or deployed update'},null,2)+'\n');
 console.log('Service-worker replacement, profile preservation and offline module fallback passed');
}finally{await browser.close();}
