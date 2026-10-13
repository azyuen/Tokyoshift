import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars, carOrder } from '../src/data/cars.js';
// Ownership module imports its own versioned module URL; inspect that same instance.
import { cars as registeredCars } from '../src/data/cars.js?v=20261011-r479';
import { engines } from '../src/data/engines.js';
import { getCarAssetPaths } from '../src/vehicles/CarAppearance.js';
import { STANDARD_CAR_REFERENCE as ref, getReferenceAssetRoot, REFERENCE_CAR_GAME_IDS } from '../src/data/carReferenceGeometry.js';
import { getWheelPairFit, getWheelContactOffsetY } from '../src/vehicles/WheelFit.js';
import { getBaseCarId, registerOwnedCarInstances } from '../src/data/carOwnership.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';
import { getCarMagazineMeta } from '../src/data/carMagazine.js';
import { getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';

test('legacy Evolution III becomes Galant VR-4, including all copied and crew cars', () => {
  const galant=cars.evo3;
  assert.equal(galant.id,'evo3','save-compatible internal ID is retained');
  assert.match(galant.name,/Galant VR-4 Evo/);
  assert.match(galant.shortName,/GALANT VR-4/);
  assert.doesNotMatch(galant.name,/Lancer|Evolution III/);
  assert.equal(carOrder.filter(id=>id==='evo3').length,1);
  assert.equal(galant.powerKW,176);
  assert.equal(galant.drivenAxleWeightFraction,1);
  assert.equal(galant.visual.referenceStandard,true);
  assert.equal(REFERENCE_CAR_GAME_IDS.evo3,'galant');
  assert.equal(galant.visual.referenceWheelSize,'S');
  assert.equal(galant.visual.referenceWheelDiameter,182);
  assert.equal(galant.visual.bodyScale,0.32);
  const crewLoans=Object.values(cars).filter(car=>car.crewLoan&&car.crewBaseCarId==='evo3');
  assert.ok(crewLoans.length>0);
  crewLoans.forEach(car=>{
    assert.match(car.name,/Galant/);
    assert.equal(car.engine,galant.engine);
    assert.equal(car.visual.bodyPath,galant.visual.bodyPath);
  });
  registerOwnedCarInstances(['evo3','evo3__copy2']);
  assert.equal(getBaseCarId('evo3__copy2'),'evo3');
  assert.match(registeredCars['evo3__copy2'].name,/Galant/);
  assert.equal(registeredCars['evo3__copy2'].powerKW,176);
});

test('Ref2 body and paint are matched PNGs and ground-normalised for two small tyres',()=>{
  assert.equal(getReferenceAssetRoot('galant'),'assets/Cars/Ref2');
  const {body,paint}=getCarAssetPaths(cars.evo3);
  assert.equal(body,'assets/Cars/Ref2/galant_stock_body.png');
  assert.equal(paint,'assets/Cars/Ref2/galant_stock_paint.png');
  const dimensions=path=>{
    const bytes=readFileSync(new URL('../'+path,import.meta.url));
    assert.equal(bytes.subarray(1,4).toString('ascii'),'PNG');
    return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
  };
  assert.deepEqual(dimensions(body),[1300,440]);
  assert.deepEqual(dimensions(paint),[1300,440]);
  assert.equal(ref.wheelDiameters[ref.cars.galant.size],182);
  const wheel={width:384,height:384};
  const fit=getWheelPairFit(cars.evo3.visual,.32,false,wheel);
  for(const axle of ['rear','front']){
    assert.ok(Math.abs(fit[axle].offsetY+getWheelContactOffsetY(wheel,fit[axle].wheelScale))<1e-6);
  }
  assert.equal(fit.rear.offsetX,ref.cars.galant.rearX*.32);
  assert.equal(fit.front.offsetX,ref.cars.galant.frontX*.32);
});

test('Galant runs its own 176 kW period-style 4G63T map, not the Evo III calibration',()=>{
  const config=cars.evo3;
  assert.equal(config.engine,'4g63t_galant_vr4');
  assert.notEqual(config.engine,'4g63t');
  assert.notEqual(config.engine,cars.evo5.engine);
  assert.notEqual(config.engine,cars.evo6.engine);
  const engine=engines[config.engine];
  assert.match(engine.name,/Galant VR-4/);
  assert.equal(engine.referenceBoostBar,config.maximumBoost);
  assert.equal(engine.redlineRPM,config.engineRedlineRPM);
  assert.equal(engine.limiterRPM,config.engineLimiterRPM);
  const curve=engine.torqueCurve;
  assert.equal(Math.max(...curve.map(p=>p[1])),304);
  let maxKW=0;
  for(let rpm=1000;rpm<=engine.redlineRPM;rpm+=10){
    const i=curve.findIndex(p=>p[0]>=rpm);
    const [r1,t1]=curve[i];
    const torque=i===0?t1:(()=>{
      const [r0,t0]=curve[i-1];
      return t0+(t1-t0)*(rpm-r0)/(r1-r0);
    })();
    maxKW=Math.max(maxKW,torque*rpm/9549);
  }
  assert.ok(Math.abs(maxKW-176)<1.5, 'curve peaks near 176kW, got '+maxKW);
  const stock=getVehiclePerformance('evo3',{},{});
  assert.ok(stock.index.standing>0 && stock.index.rolling>0);
});

test('existing Evo III ownership remains the same object/upgrade record after loading',()=>{
  const old=createDefaultGameState();
  old.ownedCarIds=['ae86','evo3','evo3__copy2'];
  old.selectedCarId='evo3__copy2';
  old.carStates={
    ae86:old.carStates.ae86,
    evo3:{ paintColor:0x2852e7, tuning:{ engine:2,turbo:2 }, customWheelId:'wheelMesh', acquiredVia:'dealer'},
    'evo3__copy2':{ paintColor:0xef5622, tuning:{ engine:3,intake:2 }, visualMods:{ wheel:'wheelMesh' }, acquiredVia:'pink-slip' },
  };
  old.carGarageLocations={ae86:'shinonomeWorkshop',evo3:'shinonomeWorkshop','evo3__copy2':'shinonomeWorkshop'};
  old.carCoupons={evo3:4};
  old.carHistory=[{id:'old-galant',carId:'evo3',acquiredVia:'dealer',status:'OWNED',acquiredAt:1}];
  const migrated=normaliseState(old);
  assert.equal(migrated.selectedCarId,'evo3__copy2');
  assert.ok(migrated.ownedCarIds.includes('evo3'));
  assert.ok(migrated.ownedCarIds.includes('evo3__copy2'));
  assert.equal(migrated.carStates.evo3.paintColor,0x2852e7);
  assert.equal(migrated.carStates['evo3__copy2'].tuning.engine,3);
  assert.equal(migrated.carStates['evo3__copy2'].acquiredVia,'pink-slip');
  assert.equal(migrated.carCoupons.evo3,4);
  assert.ok(migrated.carHistory.some(entry=>entry.carId==='evo3'));
  assert.match(getCarMagazineMeta('evo3').name,/Galant/);
});
