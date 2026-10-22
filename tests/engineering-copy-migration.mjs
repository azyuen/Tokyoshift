import test from 'node:test';
import assert from 'node:assert/strict';
import {getBaseCarId,getOwnedCarCopyNumber,registerOwnedCarInstances} from '../src/data/carOwnership.js';
import {migrateCanonicalCarModels} from '../src/data/canonicalCarMigration.js';
import {migrateRetiredEvoIX,migrateRetiredEJ1} from '../src/data/carRetirement.js';
import {createDefaultGameState,normaliseState} from '../src/state/GameState.js';
import {getBuiltCar} from '../src/vehicles/VehiclePerformance.js';

test('multi-digit owned copies resolve to buildable cars, including 10–19 and 100',()=>{
 for(const n of [2,9,10,11,19,20,99,100,101]){
  const id=`r34__copy${n}`;registerOwnedCarInstances([id]);
  assert.equal(getBaseCarId(id),'r34');assert.equal(getOwnedCarCopyNumber(id),n);
  assert.ok(getBuiltCar(id,{}));
 }
 for(const suffix of ['0','1','01','-2','2.5'])assert.equal(getBaseCarId('r34__copy'+suffix),'r34__copy'+suffix);
});
test('profile normalization preserves selected copy10 and its purchased tuning',()=>{
 const s=createDefaultGameState();s.ownedCarIds=['ae86','s15__copy10','evo3__copy10'];s.selectedCarId='s15__copy10';
 s.carStates={'s15__copy10':{tuning:{engine:3,intake:2},savedPresets:[{name:'street'}]},'evo3__copy10':{tuning:{engine:2},paintColor:123}};
 const snapshot=JSON.stringify(s),n=normaliseState(s);
 assert.equal(JSON.stringify(s),snapshot);assert.equal(n.selectedCarId,'s15__copy10');
 assert.ok(n.ownedCarIds.includes('galant__copy10'));
 assert.equal(n.carStates['s15__copy10'].tuning.engine,3);
 assert.deepEqual(n.carStates['s15__copy10'].savedPresets,[{name:'street'}]);
 assert.equal(n.carStates['galant__copy10'].tuning.engine,2);
 assert.ok(getBuiltCar('s15__copy10',n.carStates['s15__copy10']));
 assert.ok(getBuiltCar('galant__copy10',n.carStates['galant__copy10']));
});
test('canonical migration preserves distinct mixed-version copies and merges coupons',()=>{
 const input={ownedCarIds:['galant__copy10','evo3__copy10','wrx22b__copy100'],selectedCarId:'evo3__copy10',carStates:{'galant__copy10':{tag:'new'},'evo3__copy10':{tag:'old'},'wrx22b__copy100':{tag:'subaru'}},carCoupons:{galant:2,evo3:3}};
 const n=migrateCanonicalCarModels(input);
 assert.equal(new Set(n.ownedCarIds).size,3);assert.notEqual(n.selectedCarId,'galant__copy10');
 assert.equal(n.carStates[n.selectedCarId].tag,'old');assert.equal(n.carStates['galant__copy10'].tag,'new');
 assert.equal(n.carStates['gc8__copy100'].tag,'subaru');assert.equal(n.carCoupons.galant,5);
 assert.deepEqual(migrateCanonicalCarModels(n),n);
});
test('retired Evo IX and EJ1 also recognize multi-digit copies',()=>{
 const n=migrateRetiredEvoIX({ownedCarIds:['evo6__copy10','evo9__copy10'],carStates:{'evo6__copy10':{tag:'six'},'evo9__copy10':{tag:'nine'}}});
 assert.equal(new Set(n.ownedCarIds).size,2);assert.ok(!n.ownedCarIds.includes('evo9__copy10'));
 assert.equal(n.carStates[n.ownedCarIds[1]].tag,'nine');
 assert.equal(migrateRetiredEJ1({selectedOpponentCarId:'ej1__copy10'}).selectedOpponentCarId,'crx__copy10');
});
