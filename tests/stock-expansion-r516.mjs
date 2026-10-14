import test from 'node:test';
import assert from 'node:assert/strict';
import { cars, carOrder } from '../src/data/cars.js';
import { engines } from '../src/data/engines.js';
import { getBuiltCar, getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';
import { getCarMagazineMeta } from '../src/data/carMagazine.js';
import { AUTO_MARKET_LISTINGS, MARKET_BASE_PRICES, CAR_COUPON_REQUIREMENTS } from '../src/data/centralTokyo.js';
import { normaliseState, createDefaultGameState } from '../src/state/GameState.js';
import { NEW_MEET_MODELS_BY_REGION } from '../src/data/encounterProfiles.js';

const models = [
  ['gdb',206,'AWD','L'],['s15',184,'RWD','S'],['starion',129,'RWD','S'],
  ['fto',147,'FWD','S'],['mx5',103,'RWD','L'],['sa22c',121,'RWD','S'],
  ['mx6',147,'FWD','S'],['prelude',162,'FWD','S'],['sw20',180,'RWD','S'],
  ['soarer',206,'RWD','S'],['forester',184,'AWD','L'],['svx',169,'AWD','S'],
  ['xt',100,'AWD','S'],['magna',140,'FWD','L'],
];
const torqueAt = (curve, rpm) => {
  for(let i=1;i<curve.length;i++) {
    if(rpm<=curve[i][0]) {
      const [a,x]=curve[i-1], [b,y]=curve[i];
      return x+(y-x)*(rpm-a)/(b-a);
    }
  }
  return curve.at(-1)[1];
};
test('14 distinct engines deliver rated outputs, correct tyres and usable stock/upgraded builds',()=>{
  assert.equal(new Set(models.map(([id])=>cars[id].engine)).size,14);
  for(const [id,kw,drive,size] of models) {
    const c=cars[id], e=engines[c.engine];
    assert.equal(c.powerKW,kw,id);
    assert.equal(c.drivetrain,drive,id);
    assert.equal(getCarMagazineMeta(id).drivetrain,drive,id);
    assert.equal(c.visual.referenceWheelSize,size,id);
    assert.equal(c.maximumBoost,e.referenceBoostBar,id);
    assert.equal(c.engineRedlineRPM,e.redlineRPM,id);
    assert.equal(c.engineLimiterRPM,e.limiterRPM,id);
    assert.equal(Math.max(...e.torqueCurve.map(p=>p[1])),c.torqueNm,id);
    let peak=0;
    for(let rpm=1000;rpm<=e.redlineRPM;rpm+=5) peak=Math.max(peak,torqueAt(e.torqueCurve,rpm)*rpm/9549);
    assert.ok(Math.abs(peak-kw)<2,`${id}: ${peak.toFixed(2)} vs ${kw} kW`);
    const stock=getBuiltCar(id,{});
    assert.equal(stock.car.maximumBoost,c.maximumBoost,id);
    assert.equal(stock.car.nosPower,0,id);
    const a=getVehiclePerformance(id,{},{});
    const b=getVehiclePerformance(id,{tuning:{engine:2,intake:2,ecu:2}},{});
    assert.ok(Number.isFinite(a.index.standing)&&a.index.standing>0,id);
    assert.ok(b.index.rolling>a.index.rolling,id);
  }
  assert.equal(cars.sw20.engineLayout,'mid');
  assert.equal(cars.sw20.drivenAxleWeightFraction,.6);
});
test('13 production cars are purchasable and in regional encounter pools; Magna is excluded',()=>{
  const favourites=new Set(Object.values(NEW_MEET_MODELS_BY_REGION).flat());
  for(const [id] of models.filter(([id])=>id!=='magna')) {
    assert.equal(carOrder.filter(x=>x===id).length,1,id);
    assert.equal(AUTO_MARKET_LISTINGS.filter(x=>x.carId===id).length,1,id);
    assert.ok(MARKET_BASE_PRICES[id]>0,id);
    assert.ok(favourites.has(id),id);
  }
  assert.ok(!carOrder.includes('magna'));
  assert.ok(!AUTO_MARKET_LISTINGS.some(x=>x.carId==='magna'));
  assert.equal(MARKET_BASE_PRICES.magna,undefined);
  assert.equal(CAR_COUPON_REQUIREMENTS.magna,undefined);
  assert.ok(!favourites.has('magna'));
});
test('developer grant is save-safe, occurs once and preserves selected car and upgrades',()=>{
  const base=createDefaultGameState();
  assert.ok(!normaliseState(base).ownedCarIds.includes('magna'));
  const dev=normaliseState({...base,firstName:'Arkon',lastName:'Den'});
  assert.ok(dev.ownedCarIds.includes('magna'));
  assert.equal(dev.selectedCarId,base.selectedCarId);
  assert.equal(dev.carStates.magna.acquiredVia,'developerSpecial');
  assert.ok(dev.carGarageLocations.magna);
  dev.carStates.magna.tuning.engine=2;
  const again=normaliseState(dev);
  assert.equal(again.ownedCarIds.filter(x=>x==='magna').length,1);
  assert.equal(again.carStates.magna.tuning.engine,2);
  const sold=normaliseState({...again,ownedCarIds:again.ownedCarIds.filter(x=>x!=='magna')});
  assert.ok(!sold.ownedCarIds.includes('magna'));
  assert.ok(!base.ownedCarIds.includes('magna'),'input was not mutated');
});
