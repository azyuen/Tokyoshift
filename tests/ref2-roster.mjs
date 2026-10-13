import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars, carOrder } from '../src/data/cars.js';
import { engines } from '../src/data/engines.js';
import { getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';
import { getCarAssetPaths } from '../src/vehicles/CarAppearance.js';
import { getCarMagazineMeta } from '../src/data/carMagazine.js';
import { AUTO_MARKET_LISTINGS, MARKET_BASE_PRICES } from '../src/data/centralTokyo.js';
import { VISUAL_MOD_CATALOG } from '../src/data/visualMods.js';

const expected = [
  ['z32',206,'RWD','S'], ['z33',206,'RWD','L'], ['240z',112,'RWD','S'],
  ['crx',118,'FWD','S'], ['dc2',147,'FWD','S'], ['eclipse',157,'AWD','L'],
  ['familia',136,'AWD','L'], ['180sx',151,'RWD','L'], ['st205',188,'AWD','S'],
  ['jzx100',206,'RWD','S'], ['b4rsk',206,'AWD','L'],
];
test('all 11 cars have rated engines, correct drivetrain/tyres and reachable purchase entries', () => {
  for (const [id,kw,drive,size] of expected) {
    const car=cars[id]; const engine=engines[car.engine];
    assert.equal(car.powerKW,kw,id);
    assert.equal(getCarMagazineMeta(id).drivetrain,drive,id);
    assert.equal(car.visual.referenceWheelSize,size,id);
    assert.equal(carOrder.filter(x=>x===id).length,1,id);
    assert.equal(AUTO_MARKET_LISTINGS.filter(x=>x.carId===id).length,1,id);
    assert.ok(MARKET_BASE_PRICES[id]>0,id);
    assert.equal(car.maximumBoost,engine.referenceBoostBar,id);
    assert.equal(car.engineLimiterRPM,engine.limiterRPM,id);
    assert.equal(car.engineRedlineRPM,engine.redlineRPM,id);
    const torque=rpm=>{
      const i=engine.torqueCurve.findIndex(p=>p[0]>=rpm);
      if(i===0)return engine.torqueCurve[0][1];
      const [r0,t0]=engine.torqueCurve[i-1], [r1,t1]=engine.torqueCurve[i];
      return t0+(t1-t0)*(rpm-r0)/(r1-r0);
    };
    let peak=0;
    for(let rpm=1000;rpm<=engine.redlineRPM;rpm+=10)peak=Math.max(peak,torque(rpm)*rpm/9549);
    assert.ok(Math.abs(peak-kw)<2,`${id}: ${peak} vs ${kw} kW`);
    assert.equal(Math.max(...engine.torqueCurve.map(p=>p[1])),car.torqueNm,id);
    assert.equal(car.drivenAxleWeightFraction,drive==='AWD'?1:drive==='FWD'?.61:.5,id);
    assert.equal(VISUAL_MOD_CATALOG[id],undefined,id+' has no supplied body kits');
  }
});
test('Ref2 paths resolve with exact filename case and matching PNG canvases', () => {
  for(const id of [...expected.map(x=>x[0]),'a60','r34','s2000','nsx','evo5','jza80','3000gt']) {
    const car=cars[id], paths=getCarAssetPaths(car);
    const dimensions=['body','paint'].map(layer=>{
      assert.ok(paths[layer].startsWith('assets/Cars/Ref2/'),id);
      const data=readFileSync(new URL('../'+paths[layer],import.meta.url));
      return [data.readUInt32BE(16),data.readUInt32BE(20)];
    });
    assert.deepEqual(dimensions[0],dimensions[1],id);
    assert.deepEqual(dimensions[0],[car.visual.referenceCanvasWidth,car.visual.referenceCanvasHeight],id);
    assert.equal(car.visual.referenceStandard,true,id);
  }
});
test('new cars support stock and upgraded performance without missing engine configs', () => {
  for(const [id] of expected) {
    const stock=getVehiclePerformance(id,{},{});
    const tuned=getVehiclePerformance(id,{tuning:{engine:2,intake:2,ecu:2,turbo:2,intercooler:2}},{});
    assert.ok(Number.isFinite(stock.index.standing)&&stock.index.standing>0,id);
    assert.ok(Number.isFinite(tuned.index.rolling)&&tuned.index.rolling>stock.index.rolling,id);
  }
});
