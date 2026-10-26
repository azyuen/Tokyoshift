import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cars,carOrder} from '../src/data/cars.js?v=20261026-r687';
import {
  STOCK_CLASS_DATA,STOCK_CLASSES,STOCK_CLASS_ORDER,
  stockClassFor,isWithinStockClassLimit
} from '../src/data/stockClasses.js?v=20261026-r688';

test('all regular models retain their seeded D/C/B/A factory classes',()=>{
  assert.deepEqual(STOCK_CLASS_ORDER,['D','C','B','A','S']);
  assert.equal(STOCK_CLASSES.S,'S / Hero');
  for (const id of carOrder) {
    const grade=STOCK_CLASS_DATA[id]?.stockClass;
    assert.ok(['D','C','B','A'].includes(grade),id+' seeded factory class');
    assert.equal(stockClassFor(cars[id]),grade,id+' remains factory grade');
  }
  assert.equal(stockClassFor(cars.magna),'D');
});

test('all playable/loaned models resolve a permanent grade, including collectors',()=>{
  const missing=Object.entries(cars).filter(([id,car])=>!stockClassFor(car)).map(([id])=>id);
  assert.deepEqual(missing,[],'no car should have an unidentified grade');
  for (const [id,car] of Object.entries(cars)) {
    const grade=stockClassFor(car);
    assert.ok(STOCK_CLASS_ORDER.includes(grade),id+' valid class');
    if(car.collector)assert.equal(grade,'S',id+' hero/collector class');
  }
});

test('story Liberty Walk 240Z is still Class C, sealed hero is Class S',()=>{
  assert.equal(stockClassFor(cars['240z']),'C');
  assert.equal(stockClassFor(cars.arkonLibertyWalk240z),'C');
  assert.equal(stockClassFor(cars.libertyWalk240z),'S');
  assert.equal(stockClassFor(cars.renownMazda787B),'S');
  assert.equal(stockClassFor(cars.cleanMazda787B),'S');
  assert.equal(stockClassFor(cars.espritNsx),'S');
  assert.equal(stockClassFor(cars.ginzaDemo_cleanMazda787B),'S');
});

test('upgrades cannot reclassify factory class',()=>{
  const dc2=cars.dc2;
  const galant=cars.galant;
  const tunedDC2={...dc2,powerKW:900,torqueNm:1450,vehicleMassKg:500};
  const tunedGalant={...galant,powerKW:940,torqueNm:1700,vehicleMassKg:650};
  assert.equal(stockClassFor(dc2),'B');
  assert.equal(stockClassFor(tunedDC2),'B');
  assert.equal(stockClassFor(galant),'B');
  assert.equal(stockClassFor(tunedGalant),'B');
});

test('maximum Class C includes D and C, excludes B/A/S',()=>{
  assert.equal(isWithinStockClassLimit(cars.starion,'C'),true);
  assert.equal(isWithinStockClassLimit(cars.mx5,'C'),true);
  assert.equal(isWithinStockClassLimit(cars.ek9,'C'),true);
  assert.equal(isWithinStockClassLimit(cars.dc2,'C'),false);
  assert.equal(isWithinStockClassLimit(cars.gc8,'C'),false);
  assert.equal(isWithinStockClassLimit(cars.espritNsx,'C'),false);
  assert.equal(isWithinStockClassLimit(cars.gc8,'A'),true);
  assert.equal(isWithinStockClassLimit(cars.espritNsx,'A'),false);
  assert.equal(isWithinStockClassLimit(cars.espritNsx,'S'),true);
  assert.equal(isWithinStockClassLimit(cars.dc2,'S'),true);
  assert.equal(isWithinStockClassLimit(cars.dc2,'X'),false);
  assert.equal(isWithinStockClassLimit(null,'S'),false);
});

test('garage uses fifth row directly below weight in all refresh paths',()=>{
  const garage=readFileSync('src/scenes/GarageScene.js','utf8');
  const i=garage.indexOf("['WEIGHT', 'weight']");
  const j=garage.indexOf("['CLASS', 'class']");
  assert.ok(i>=0 && j>i && j-i<90,'CLASS row immediately after WEIGHT');
  assert.equal((garage.match(/this\.specValueTexts\.class\.setText/g)||[]).length,3,
    'selection, empty state, and post-tuning refresh all render class');
  assert.ok(garage.includes('stockClassFor(car)'), 'uses permanent factory grade');
});
