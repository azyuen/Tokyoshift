import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  CH6_FEES,CH6_WAREHOUSE_COST,CH6_RESTORATION,
  getArkonCh6Job,reconcileArkonCh6Accounts,
  recordArkonCh6Job,leaseArkonCh6Warehouse,
  settleArkonCh6PorscheLoan,recordArkonCh6Restoration,
  ch6Progress
} from '../src/data/arkonChapter06Work.js';
import {getArkonCustomerPower,CANAL_YARD_MAX} from '../src/data/arkonChapter03Jobs.js';
import {getArkonStoryWorkshopTier} from '../src/data/workshopProgression.js';
import {normaliseState,createDefaultGameState} from '../src/state/GameState.js';
import {ARKON_CHAPTER_06} from '../src/data/arkonChapter06.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const state=(extra={})=>({data:{gameMode:'arkonStory',arkonStoryChapter05Done:true,
  arkonStoryRwbProject:{acquired:true,carId:'rwbStellaPorsche',
    outstandingFinance:3000000,roadworthy:false},cash:150000,garageTier:1,
  ownedCarIds:['240z','rwbStellaPorsche'],
  carGarageLocations:{'240z':'shinonomeCanalYard',rwbStellaPorsche:'shinonomeCanalYard'},
  carStates:{rwbStellaPorsche:{roadworthy:false}},...extra},
  get(k){return this.data[k]},set(k,v){this.data[k]=v}});

test('R675 signed specialist invoices cover loan, repairs AND prepaid three months of HQ rent',()=>{
  assert.deepEqual([...CH6_FEES],[2400000,2700000,3000000]);
  assert.equal(CH6_WAREHOUSE_COST,1650000);
  const total=CH6_FEES.reduce((sum,fee)=>sum+fee,0);
  const cost=CH6_RESTORATION.reduce((sum,step)=>sum+step.cost,0);
  assert.ok(total>3000000+CH6_WAREHOUSE_COST+cost);
  assert.equal(total-3000000-CH6_WAREHOUSE_COST-cost,2550000);
  const s=state();
  for(let i=0;i<3;i++){
    assert.equal(recordArkonCh6Job(s,i),true);
    assert.equal(recordArkonCh6Job(s,i),false);
  }
  assert.equal(s.get('cash'),8250000);
  assert.equal(ch6Progress(s).escrow,total);
  assert.equal(leaseArkonCh6Warehouse(s),true);
  assert.equal(ch6Progress(s).warehouseRentMonths,3);
  assert.equal(s.get('cash'),6600000);
  assert.equal(settleArkonCh6PorscheLoan(s),true);
  assert.equal(s.get('cash'),3600000);
  assert.equal(s.get('arkonStoryRwbProject').outstandingFinance,0);
  for(let i=0;i<3;i++)assert.equal(recordArkonCh6Restoration(s,i),true);
  assert.equal(s.get('cash'),2700000);
  assert.equal(ch6Progress(s).escrow,2550000);
});
test('R675 customer boost restriction is reachable using the same tuning power model',()=>{
  const j=getArkonCh6Job({arkonStoryChapter03Seed:7},1);
  assert.equal(j.carId,'sa22c');
  assert.equal(j.allowPaint,false);
  assert.deepEqual(j.limits,{turbo:0});
  const allowed={...CANAL_YARD_MAX,turbo:0};
  assert.ok(getArkonCustomerPower(j.carId,allowed)>=j.targetKW);
  assert.ok(j.targetKW>=j.stockKW);
  assert.match(j.restrictionLabel,/NO TURBO UPGRADES/);
});
test('R675 existing mid-Chapter 06 profiles migrate old escrow once without recreating income',()=>{
  const s=state({cash:2000000,arkonStoryChapter06Accounts:{
    jobsDone:3,escrow:1050000,warehousePaid:true,financeCleared:true,
    restorationDone:0,distributed:false
  },arkonStoryRwbProject:{acquired:true,carId:'rwbStellaPorsche',
    outstandingFinance:0,roadworthy:false}});
  let a=reconcileArkonCh6Accounts(s);
  assert.equal(a.escrow,3450000);
  assert.equal(s.get('cash'),5450000);
  assert.equal(reconcileArkonCh6Accounts(s).escrow,3450000);
  assert.equal(s.get('cash'),5450000);
  assert.equal(a.economyVersion,2);
});
test('R675 all completed Chapter 06 Story saves unlock Warehouse, even if legacy flag is false',()=>{
  assert.equal(getArkonStoryWorkshopTier({
    gameMode:'arkonStory',arkonStoryChapter06Done:true,
    arkonStoryWarehouseUnlocked:false,garageTier:1}),2);
  assert.equal(getArkonStoryWorkshopTier({
    gameMode:'arkonStory',storyDirectorProgress:{id:'arkonChapter07'},
    arkonStoryWarehouseUnlocked:false}),2);
  const start={...createDefaultGameState(),gameMode:'arkonStory',
    firstName:'Arkon',lastName:'Den',
    arkonStoryChapter05Done:true,arkonStoryChapter06Done:true,
    arkonStoryWarehouseUnlocked:false,garageTier:1,
    workshopLocationId:'shinonomeCanalYard',ownedCarIds:['240z']};
  let out=normaliseState(start);
  assert.equal(out.garageTier,2);
  assert.equal(out.arkonStoryWarehouseUnlocked,true);
  assert.equal(out.workshopLocationId,'shinonomeWarehouseStrip');
  let career=normaliseState({...start,gameMode:'career',firstName:'Alex'});
  assert.equal(career.arkonStoryWarehouseUnlocked,false);
});
test('R675 completed pre-R675 accounts gain corrected profit once on save load',()=>{
  const start={...createDefaultGameState(),gameMode:'arkonStory',
    firstName:'Arkon',lastName:'Den',cash:150000,
    arkonStoryChapter06Done:true,arkonStoryChapter06Accounts:{
      jobsDone:3,warehousePaid:true,financeCleared:true,distributed:true,
      restorationDone:3,escrow:0
    }};
  const next=normaliseState(start);
  assert.equal(next.cash,2550000);
  assert.equal(next.arkonStoryChapter06Accounts.economyVersion,2);
  assert.equal(normaliseState(next).cash,2550000);
});
test('R675 fixed paint, RWB repair button and single Replay exit foreground controls',()=>{
  const work=source('../src/ui/ArkonCustomerTuning.js');
  assert.match(work,/job.allowPaint===false/);
  assert.match(work,/row.max===0/);
  const rest=source('../src/ui/ArkonRwbRestoration.js');
  assert.match(rest,/role:'rwbMechanic',flipX:true/);
  assert.match(rest,/role:'rwbSayaka'/);
  assert.match(rest,/buttonText\.setOrigin\(\.5,\.5\)\.setDepth\(depth\+24\)/);
  const garage=source('../src/scenes/GarageScene.js');
  assert.match(garage,/MAJOR REPAIRS REQUIRED/);
  assert.doesNotMatch(garage,/RESTORATION \/\/ NO DRIVE/);
  const exit=source('../src/ui/ArkonReplayExit.js');
  assert.match(exit,/90000/);
  assert.match(exit,/endArkonPlayableReplay\(scene/);
  const settings=source('../src/ui/SettingsPanel.js');
  assert.doesNotMatch(settings,/rectangle\(172,35,282,42/);
});
test('R675 softer Porsche confession and final silence before fade to the view',()=>{
  const scene=ARKON_CHAPTER_06.steps;
  const last=scene.find(s=>s.type==='MANGA'&&s.title==='THE KEYS').pages;
  assert.ok(last.length>=12);
  assert.ok(last.some(p=>p.text.includes('Well... guess')));
  assert.ok(last.some(p=>p.text==='...'));
  assert.ok(last.some(p=>p.text.includes('enjoy the view')));
  assert.ok(last.some(p=>p.text==='I would like that.'&&p.rightPose==='homeHappy'));
  const gift=scene.findIndex(s=>s.type==='ARKON_CH6_GIFT');
  assert.equal(scene[gift+1].type,'FADE_STORY_ACTOR');
  assert.equal(scene[gift+2].type,'ARKON_CH6_ENDING');
});
