import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars, carOrder } from '../src/data/cars.js';
import { engines } from '../src/data/engines.js';
import { getCarAssetPaths } from '../src/vehicles/CarAppearance.js';
import { getVehiclePerformance } from '../src/vehicles/VehiclePerformance.js';
import { STANDARD_CAR_REFERENCE, REFERENCE_CAR_CANVAS, REFERENCE_CAR_GAME_IDS } from '../src/data/carReferenceGeometry.js';
import { AUTO_MARKET_LISTINGS, MARKET_BASE_PRICES, getAutoMarketBuild } from '../src/data/centralTokyo.js';
import { NEW_MEET_MODELS_BY_REGION } from '../src/data/encounterProfiles.js';
import { getCarMagazineMeta } from '../src/data/carMagazine.js';

function torqueAt(curve, rpm) {
  for (let i=1; i<curve.length; i++) if (rpm <= curve[i][0]) {
    const [a,x]=curve[i-1], [b,y]=curve[i];
    return x+(y-x)*(rpm-a)/(b-a);
  }
  return curve.at(-1)[1];
}

test('GF8 Version VI is a separate, accurate 206 kW AWD EJ207 five-speed car', () => {
  const car=cars.gf8, engine=engines[car?.engine];
  assert.ok(car);
  assert.ok(engine);
  assert.equal(car.name,'Subaru Impreza WRX STI GF8');
  assert.equal(car.powerKW,206);
  assert.equal(car.torqueNm,353);
  assert.equal(car.vehicleMassKg,1310);
  assert.equal(car.drivetrain,'AWD');
  assert.equal(car.gearRatios.length,5);
  assert.equal(car.engine,'ej207_gf8');
  assert.notEqual(car.engine,cars.gdb.engine);
  assert.notEqual(car.engine,cars.gc8.engine);
  assert.equal(carOrder.filter(id=>id==='gf8').length,1);
  assert.equal(getCarMagazineMeta('gf8').drivetrain,'AWD');
  assert.equal(engine.referenceBoostBar,car.maximumBoost);
  assert.equal(Math.max(...engine.torqueCurve.map(p=>p[1])),353);
  assert.equal(torqueAt(engine.torqueCurve,4000),353);
  let maxPower=0;
  for (let rpm=1000; rpm<=engine.redlineRPM; rpm+=5)
    maxPower=Math.max(maxPower,rpm*torqueAt(engine.torqueCurve,rpm)/9549);
  assert.ok(Math.abs(maxPower-206)<1,String(maxPower));
  const stock=getVehiclePerformance('gf8',{},{});
  const tuned=getVehiclePerformance('gf8',{tuning:{engine:2,intake:2,ecu:2}},{});
  assert.ok(Number.isFinite(stock.index.standing)&&stock.index.standing>0);
  assert.ok(tuned.index.rolling>stock.index.rolling);
});

test('GF8 loads the uploaded matching 1300x440 WRXGF8 stock sprites with aligned 194px wheels', () => {
  const car=cars.gf8, stem=REFERENCE_CAR_GAME_IDS.gf8;
  assert.equal(stem,'wrxgf8');
  assert.equal(car.visual.referenceStandard,true);
  assert.equal(car.visual.referenceWheelSize,'L');
  assert.deepEqual(REFERENCE_CAR_CANVAS[stem],[1300,440]);
  assert.deepEqual(STANDARD_CAR_REFERENCE.cars[stem],{rearX:-991,frontX:-247,size:'L'});
  const paths=getCarAssetPaths(car);
  assert.equal(paths.body,'assets/Cars/stock/wrxgf8_stock_body.png');
  assert.equal(paths.paint,'assets/Cars/stock/wrxgf8_stock_paint.png');
  for(const path of [paths.body,paths.paint]) {
    const png=readFileSync(new URL('../'+path,import.meta.url));
    assert.equal(png.subarray(1,4).toString('ascii'),'PNG');
    assert.equal(png.readUInt32BE(16),1300);
    assert.equal(png.readUInt32BE(20),440);
  }
});

test('GF8 market/encounters are live without altering other Subaru models',()=>{
  assert.equal(MARKET_BASE_PRICES.gf8,3500000);
  assert.deepEqual(AUTO_MARKET_LISTINGS.filter(x=>x.carId==='gf8').map(x=>x.price),[4200000]);
  assert.equal(getAutoMarketBuild('gf8').stock,false);
  for(const region of ['SHINAGAWA','TATSUMI','YOKOHAMA'])
    assert.ok(NEW_MEET_MODELS_BY_REGION[region].includes('gf8'),region);
  for(const id of ['gc8','b4rsk','gdb']) assert.ok(carOrder.includes(id));
  assert.equal(cars.gc8.name,'Subaru Impreza WRX STI GC8');
  assert.equal(cars.b4rsk.name,'Subaru Legacy B4 RSK');
});
