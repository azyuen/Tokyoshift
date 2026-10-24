import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARKON_CHAPTER_06} from '../src/data/arkonChapter06.js';
import {STORY_DIRECTOR_SCRIPTS} from '../src/data/storyDirectorScripts.js';
import {validateStoryScript} from '../src/story/StoryScript.js';
import {
 CH6_FEES,CH6_RESTORATION,getArkonCh6Job,recordArkonCh6Job,
 ch6Progress,leaseArkonCh6Warehouse,settleArkonCh6PorscheLoan,
 recordArkonCh6Restoration,beginArkonCh6NightDrive,
 finishArkonCh6NightDrive,giftArkonCh6Porsche
} from '../src/data/arkonChapter06Work.js';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';
const text=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const registry=(values={})=>({values,get(k){return this.values[k]},set(k,v){this.values[k]=v}});
function fixture(){
 return registry({gameMode:'arkonStory',arkonStoryChapter05Done:true,arkonStoryChapter06Done:false,
  firstName:'Arkon',lastName:'Den',cash:1800000,garageTier:1,
  workshopLocationId:'shinonomeCanalYard',arkonStoryWarehouseUnlocked:false,
  ownedCarIds:['240z','rwbStellaPorsche'],selectedCarId:'240z',preferredCarId:'240z',
  carStates:{'240z':{},rwbStellaPorsche:{immutable:true,tuningLocked:true,roadworthy:false}},
  carGarageLocations:{'240z':'shinonomeCanalYard',rwbStellaPorsche:'shinonomeCanalYard'},
  arkonStoryRwbProject:{acquired:true,carId:'rwbStellaPorsche',
   owner:'arkonDen',gifted:false,roadworthy:false,outstandingFinance:3000000,
   status:'structural-and-engine-restoration-required'},
 });
}
const earn=reg=>{for(let i=0;i<3;i++)assert.equal(recordArkonCh6Job(reg,i),true);};
test('R668 Chapter 06 story validates, registers, and earns real restoration work before the gift',()=>{
 assert.doesNotThrow(()=>validateStoryScript(ARKON_CHAPTER_06));
 assert.deepEqual(STORY_DIRECTOR_SCRIPTS.arkonChapter06,ARKON_CHAPTER_06);
 assert.equal(ARKON_CHAPTER_06.steps.at(-1).type,'END');
 assert.deepEqual(ARKON_CHAPTER_06.steps.filter(x=>x.type==='ARKON_CH6_JOB').map(x=>x.index),[0,1,2]);
 assert.deepEqual(ARKON_CHAPTER_06.steps.filter(x=>x.type==='ARKON_CH6_RESTORE').map(x=>x.index),[0,1,2]);
 for(const command of ['ARKON_CH6_WAREHOUSE','ARKON_CH6_REPAY','ARKON_CH6_DRIVE',
   'ARKON_CH6_DRIVE_RETURN','ARKON_CH6_GIFT','ARKON_CH6_ENDING']){
   assert.equal(ARKON_CHAPTER_06.steps.filter(x=>x.type===command).length,1);
 }
 assert.ok(ARKON_CHAPTER_06.steps.find(x=>x.type==='STAGE'&&
   x.backgroundId==='meet:yokohamaMinatoMirai:night'));
 assert.ok(ARKON_CHAPTER_06.steps.some(x=>x.type==='SET_FLAG'&&
   x.key==='arkonStoryChapter06Done'&&x.value===true));
});
test('R675 visible paid invoices fund rent, debt and repairs with profit; no duplicate payout',()=>{
 const s=fixture();let total=0;
 for(let i=0;i<3;i++){
   const job=getArkonCh6Job(s,i);
   assert.equal(job.pay,CH6_FEES[i]);
   assert.equal(recordArkonCh6Job(s,i),true);
   assert.equal(recordArkonCh6Job(s,i),false);
   total+=CH6_FEES[i];
   assert.equal(ch6Progress(s).escrow,total);
   assert.equal(s.get('cash'),1800000+total);
 }
 assert.equal(total,8100000);
 assert.equal(leaseArkonCh6Warehouse(s),true);
 assert.equal(leaseArkonCh6Warehouse(s),true);
 assert.equal(s.get('garageTier'),2);
 assert.equal(s.get('workshopLocationId'),'shinonomeWarehouseStrip');
 assert.equal(s.get('carGarageLocations').rwbStellaPorsche,'shinonomeWarehouseStrip');
 assert.equal(s.get('carGarageLocations')['240z'],'shinonomeCanalYard');
 assert.equal(ch6Progress(s).escrow,6450000);
 assert.equal(settleArkonCh6PorscheLoan(s),true);
 assert.equal(settleArkonCh6PorscheLoan(s),true);
 assert.equal(s.get('arkonStoryRwbProject').outstandingFinance,0);
 assert.equal(ch6Progress(s).escrow,3450000);
 for(let i=0;i<3;i++){
   assert.equal(recordArkonCh6Restoration(s,i),true);
   assert.equal(recordArkonCh6Restoration(s,i),false);
   assert.equal(s.get('arkonStoryRwbProject').roadworthy,i===2);
   assert.equal(s.get('carStates').rwbStellaPorsche.roadworthy,i===2);
 }
 assert.equal(CH6_RESTORATION.reduce((a,x)=>a+x.cost,0),900000);
 assert.equal(ch6Progress(s).escrow,2550000);
 assert.equal(s.get('cash'),4350000);
 assert.equal(beginArkonCh6NightDrive(s),true);
 assert.equal(beginArkonCh6NightDrive(s),false);
 assert.equal(s.get('selectedRaceCategory'),'ARKON_RWB_CRUISE');
 assert.equal(s.get('selectedCarId'),'rwbStellaPorsche');
 assert.equal(s.get('raceDistrict'),'YOKOHAMA');
 assert.equal(finishArkonCh6NightDrive(s),false);
 s.set('arkonStoryChapter06Cruise',{...s.get('arkonStoryChapter06Cruise'),completed:true});
 assert.equal(finishArkonCh6NightDrive(s),true);
 assert.equal(s.get('selectedCarId'),'240z');
 assert.equal(s.get('arkonStoryChapter06CruiseFinished'),true);
 assert.equal(giftArkonCh6Porsche(s),true);
 assert.equal(giftArkonCh6Porsche(s),true);
 assert.equal(s.get('cash'),4350000);
 assert.equal(ch6Progress(s).escrow,0);
 assert.equal(s.get('arkonStoryRwbProject').owner,'sayakaFujieda');
 assert.equal(s.get('arkonStoryRwbProject').gifted,true);
 assert.equal(s.get('arkonStoryRwbProject').roadworthy,true);
 assert.equal(s.get('arkonStoryRwbProject').outstandingFinance,0);
 assert.ok(!s.get('ownedCarIds').includes('rwbStellaPorsche'));
 assert.equal(s.get('carStates').rwbStellaPorsche,undefined);
 assert.equal(s.get('carGarageLocations').rwbStellaPorsche,undefined);
});
test('R668 financing cannot become magically clear, repair cannot start early',()=>{
 const s=fixture();
 assert.equal(leaseArkonCh6Warehouse(s),false);
 assert.equal(settleArkonCh6PorscheLoan(s),false);
 assert.equal(recordArkonCh6Restoration(s,0),false);
 assert.equal(beginArkonCh6NightDrive(s),false);
 assert.equal(giftArkonCh6Porsche(s),false);
 earn(s);
 assert.equal(recordArkonCh6Restoration(s,0),false);
 assert.equal(leaseArkonCh6Warehouse(s),true);
 assert.equal(beginArkonCh6NightDrive(s),false);
 assert.equal(recordArkonCh6Restoration(s,0),false);
});
test('R668 normalisation retains cleared loan and certified condition, not phantom garage stock after gift',()=>{
 const s=fixture();earn(s);leaseArkonCh6Warehouse(s);settleArkonCh6PorscheLoan(s);
 for(let i=0;i<3;i++)recordArkonCh6Restoration(s,i);
 let loaded=normaliseState({...createDefaultGameState(),...s.values});
 assert.equal(loaded.arkonStoryRwbProject.outstandingFinance,0);
 assert.equal(loaded.arkonStoryRwbProject.roadworthy,true);
 assert.equal(loaded.carStates.rwbStellaPorsche.roadworthy,true);
 assert.equal(loaded.carGarageLocations.rwbStellaPorsche,'shinonomeWarehouseStrip');
 assert.equal(loaded.garageTier,2);
 beginArkonCh6NightDrive(s);
 s.set('arkonStoryChapter06Cruise',{...s.get('arkonStoryChapter06Cruise'),completed:true});
 finishArkonCh6NightDrive(s);giftArkonCh6Porsche(s);
 s.set('arkonStoryChapter06Done',true);
 loaded=normaliseState({...createDefaultGameState(),...s.values});
 assert.equal(loaded.arkonStoryRwbProject.outstandingFinance,0);
 assert.equal(loaded.arkonStoryRwbProject.roadworthy,true);
 assert.equal(loaded.arkonStoryRwbProject.owner,'sayakaFujieda');
 assert.equal(loaded.arkonStoryChapter06Done,true);
 assert.equal(loaded.garageTier,2);
 assert.ok(!loaded.ownedCarIds.includes('rwbStellaPorsche'));
 assert.equal(loaded.carStates.rwbStellaPorsche,undefined);
 assert.equal(loaded.carGarageLocations.rwbStellaPorsche,undefined);
 const career=normaliseState({...createDefaultGameState(),...s.values,gameMode:'career',
   firstName:'Alex',lastName:'Racer'});
 assert.equal(career.arkonStoryChapter06Done,false);
 assert.equal(career.arkonStoryChapter06Accounts,null);
 assert.equal(career.arkonStoryRwbProject,null);
});
test('R668 uses a no-input Porsche panorama drive, full replay, and independent final tableau',()=>{
 const race=text('../src/scenes/RaceScene.js'),director=text('../src/story/StoryDirector.js');
 assert.match(race,/this\.isArkonCh6Cruise/);
 assert.match(race,/this\.controls\.enabled=false/);
 assert.match(race,/queueSafeSceneStart\(this,'MeetScene'\)/);
 assert.match(race,/this\.setArkonMx5OpponentVisible\(false\)/);
 assert.match(director,/ARKON_CH6_DRIVE_RETURN/);
 assert.match(director,/ARKON_CH6_GIFT/);
 assert.match(text('../src/ui/ArkonChapter06Finale.js'),/yokohamaMinatoMirai:night/);
 assert.match(text('../src/ui/ArkonPlayableReplay.js'),/chapter===6\?'arkonChapter06'/);
 assert.match(text('../src/ui/ArkonStoryObjective.js'),/BEGIN CHAPTER 06/);
 assert.match(text('../src/ui/ArkonStoryArchivePanel.js'),/ARKON_CHAPTER_06/);
});
