import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { cars, carOrder } from '../src/data/cars.js';
import { getCarAssetPaths } from '../src/vehicles/CarAppearance.js';
import {
  STANDARD_CAR_REFERENCE, STANDARD_CAR_REFERENCE_ROOT,
  REFERENCE_CAR_GAME_IDS, REFERENCE_CAR_CANVAS, getReferenceAssetRoot,
} from '../src/data/carReferenceGeometry.js';
const url = path => new URL('../' + path, import.meta.url);
test('all 28 deployed regular cars resolve to unified lowercase stock folder', () => {
  assert.equal(STANDARD_CAR_REFERENCE_ROOT,'assets/Cars/stock');
  assert.equal(carOrder.length,28);
  assert.equal(Object.keys(REFERENCE_CAR_GAME_IDS).length,28);
  assert.deepEqual(new Set(carOrder),new Set(Object.keys(REFERENCE_CAR_GAME_IDS)));
  for(const id of carOrder) {
    const stem=REFERENCE_CAR_GAME_IDS[id], car=cars[id];
    const paths=getCarAssetPaths(car);
    assert.equal(getReferenceAssetRoot(stem),STANDARD_CAR_REFERENCE_ROOT);
    assert.equal(paths.body,'assets/Cars/stock/'+stem+'_stock_body.png',id);
    assert.equal(paths.paint,'assets/Cars/stock/'+stem+'_stock_paint.png',id);
    assert.equal(paths.overlay,null,id);
    assert.equal(car.visual.referenceStandard,true,id);
    assert.ok(STANDARD_CAR_REFERENCE.cars[stem],id);
    assert.ok(REFERENCE_CAR_CANVAS[stem],id);
  }
  // evo3 remains the legacy save ID; modularAssetStem selects Galant art.
  assert.equal(cars.evo3.visual.modularAssetStem,'galant');
});
test('56 PNG assets exist in stock, no old Ref folders and all sizes match', () => {
  assert.ok(existsSync(url('assets/Cars/stock')));
  assert.equal(existsSync(url('assets/Cars/Ref')),false);
  assert.equal(existsSync(url('assets/Cars/Ref2')),false);
  const contents=readdirSync(url('assets/Cars/stock'));
  const pngs=contents.filter(x=>x.endsWith('.png'));
  const expected=new Set(Object.values(REFERENCE_CAR_GAME_IDS).flatMap(stem=>[
    stem+'_stock_body.png',stem+'_stock_paint.png',
  ]));
  assert.equal(pngs.length,56);
  assert.equal(expected.size,56);
  assert.deepEqual(new Set(pngs),expected);
  for(const stem of new Set(Object.values(REFERENCE_CAR_GAME_IDS))){
    const images=['body','paint'].map(layer=>readFileSync(url('assets/Cars/stock/'+stem+'_stock_'+layer+'.png')));
    const dims=images.map(b=>{
      assert.equal(b.subarray(1,4).toString('ascii'),'PNG');
      return [b.readUInt32BE(16),b.readUInt32BE(20)];
    });
    assert.deepEqual(dims[0],dims[1],stem);
    assert.deepEqual(dims[0],REFERENCE_CAR_CANVAS[stem],stem);
  }
});
test('all 11 hero/collector images remain in the original assets/Cars root',()=>{
  const heroes=readdirSync(url('assets/Cars')).filter(x=>x.endsWith('_hero_body.png'));
  assert.equal(heroes.length,11);
  assert.ok(heroes.includes('mines_r34_hero_body.png'));
  assert.ok(heroes.includes('renown_mazda_787b_hero_body.png'));
});
test('game paths and calibration views do not point to the deleted directories',()=>{
  for(const p of ['src/data/carReferenceGeometry.js','src/data/cars.js',
    'src/vehicles/CarAppearance.js','src/scenes/CarReferenceCalibrationScene.js',
    'body-alignment.html']) {
    const s=readFileSync(url(p),'utf8');
    assert.doesNotMatch(s,/assets\/Cars\/Ref(?:2)?\//,p);
  }
});
