import test from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import fs from 'node:fs';
import {stage,ids} from '../tools/vehicle-balance.mjs';
import {getBuiltCar,calculatePerformanceIndex} from '../src/vehicles/VehiclePerformance.js';
import {estimateElapsed,clearPerformanceEstimateCache} from '../src/vehicles/PerformanceEstimate.js';
import {getAutoMarketSellPrice} from '../src/data/centralTokyo.js';
import {parkPerformanceParts} from '../src/data/factorySetup.js';

test('PI cache distinguishes all transmission difficulty parameters',()=>{
 const b=getBuiltCar('r34',stage(2));
 for(const [key,value] of Object.entries({difficultyShiftClutchRejectThreshold:.8,difficultyShiftClutchTarget:1,difficultyShiftThrottleGrace:0,difficultyShiftPenaltyMultiplier:1.4})){
  clearPerformanceEstimateCache();estimateElapsed(b.car,b.engine);
  const c={...b.car,[key]:value},warm=estimateElapsed(c,b.engine);clearPerformanceEstimateCache();const fresh=estimateElapsed(c,b.engine);assert.equal(warm,fresh,key);
 }
});
test('parking parts never removes their resale contribution or counts duplicates twice',()=>{
 for(const id of ids)for(const n of [1,2,3]){const s=stage(n),p=parkPerformanceParts(s);assert.equal(getAutoMarketSellPrice(id,p),getAutoMarketSellPrice(id,s));p.tuning={...s.tuning};assert.equal(getAutoMarketSellPrice(id,p),getAutoMarketSellPrice(id,s));}
});
test('saved core simulations are complete and standard stages never regress',()=>{
 const stages=['stock','budget','street','intermediate','advanced','max'];
 for(const name of ['baseline','revised']){
  const rows=JSON.parse(fs.readFileSync(new URL('../docs/engineering/'+name+'.json',import.meta.url)));assert.equal(rows.length,301);
  for(const id of ids){const r=rows.filter(x=>x.id===id);assert.equal(r.length,7);assert.equal(new Set(r.map(x=>x.build)).size,7);
   if(name==='revised')for(let i=1;i<stages.length;i++){const a=r.find(x=>x.build===stages[i-1]),b=r.find(x=>x.build===stages[i]);assert.ok(b.powerKW>=a.powerKW-.5,id+' power');assert.ok(b.standing.splits[400]<=a.standing.splits[400]+.05,id+' ET');}
  }
 }
});
test('PI cold/warm timing is recorded without imposing a machine-specific gate',()=>{
 clearPerformanceEstimateCache();const builds=ids.map(id=>getBuiltCar(id,stage(0)));const t=performance.now();for(const b of builds)calculatePerformanceIndex(b.car,b.engine);const cold=performance.now()-t;const u=performance.now();for(const b of builds)calculatePerformanceIndex(b.car,b.engine);console.log(JSON.stringify({models:43,coldMs:cold,warmMs:performance.now()-u}));
});


test('Warehouse stored kits coexist with factory parking and retain resale value', async()=>{
 const {storeSelectedKitParts,restoreStoredKitParts,listStorableKitParts}=await import('../src/data/partUninstall.js');
 const {restorePerformanceParts}=await import('../src/data/factorySetup.js');
 const {isPerformanceStockState}=await import('../src/data/crewSystem.js');
 for(const id of ids){
  const original=stage(3),keys=listStorableKitParts(original).map(p=>p.key);
  const stored=storeSelectedKitParts(original,keys);assert.ok(stored,id);
  assert.equal(isPerformanceStockState(stored),true,id);
  assert.equal(getBuiltCar(id,stored).car.powerKW,getBuiltCar(id,stage(0)).car.powerKW,id);
  assert.equal(getAutoMarketSellPrice(id,stored),getAutoMarketSellPrice(id,original),id);
  const parked=parkPerformanceParts(stored),restored=restorePerformanceParts(restoreStoredKitParts(parked));
  assert.equal(getBuiltCar(id,restored).car.powerKW,getBuiltCar(id,original).car.powerKW,id);
  assert.equal(isPerformanceStockState(restored),false,id);
 }
});

test('reconciled source keeps one module identity and upstream recruitment safeguards',()=>{
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
 for(const path of walk('src').filter(p=>p.endsWith('.js'))){
  const source=fs.readFileSync(path,'utf8');assert.doesNotMatch(source,/["']\.\.?\/[^"'\n]+\.js\?v=/,path);
  assert.doesNotMatch(source,/^<<<<<<< /m,path);
 }
 const meet=fs.readFileSync('src/scenes/MeetScene.js','utf8');
 assert.match(meet,/retryDeferredUntilExit/);assert.match(meet,/createCrewRecruitVsLabel/);
 assert.match(meet,/recruitRules\.playerDifficulty !== 'HARD'/);
 const race=fs.readFileSync('src/scenes/RaceScene.js','utf8');
 assert.match(race,/this\.raceMode === 'CREW_RECRUIT' && this\.playerDifficulty === 'STANDARD'/);
});


test('recruitment identity follows all 42 canonical character/car/region assignments',async()=>{
 const {REGIONAL_CREW_ROSTERS}=await import('../src/data/crewRoster.js');
 const {isValidCrewRecruitChallenge}=await import('../src/data/crewSystem.js');
 for(const [regionId,roster] of Object.entries(REGIONAL_CREW_ROSTERS))for(const member of roster.members){
  const challenge={active:true,regionId,characterId:member.characterId,baseCarId:member.baseCarId};
  assert.equal(isValidCrewRecruitChallenge(challenge),true,member.characterId);
  assert.equal(isValidCrewRecruitChallenge({...challenge,baseCarId:'magna'}),false);
  assert.equal(isValidCrewRecruitChallenge({...challenge,regionId:'OSHIAGE'}),false);
  assert.equal(isValidCrewRecruitChallenge({...challenge,active:false}),false);
 }
 assert.equal(isValidCrewRecruitChallenge({active:true,regionId:'SHINJUKU',characterId:'soraKanzaki',baseCarId:'r34'}),false);
});
