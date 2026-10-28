import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js?v=20261027-r694';
import { GINZA_LISTINGS } from '../src/data/centralTokyo.js';
import {
  GINZA_ROTATION_MS, getGinzaRoomStock, getGinzaVaultCar,
} from '../src/data/ginzaGallery.js';

const source = readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const methods = source.slice(
  source.indexOf('  getGinzaListings() {'),
  source.indexOf('  ginzaScene(kind,')
);
assert.ok(methods.startsWith('  getGinzaListings() {'), 'Ginza listing methods must exist');
assert.ok(methods.includes('  getGinzaActiveListing() {'), 'active listing helper must exist');
const build = new Function('cars','GINZA_LISTINGS','getGinzaRoomStock','getGinzaVaultCar','Date',
  'return new (class GinzaProbe {' + methods + '})();');
const makeScene = (gameMode = 'career', tick = 0) => Object.assign(
  build(cars, GINZA_LISTINGS, getGinzaRoomStock, getGinzaVaultCar,
    { now: () => tick * GINZA_ROTATION_MS }), {
    registry: { get: key => key === 'gameMode' ? gameMode : undefined },
    ginzaRoom: 2,
    ginzaVaultIndex: 0,
    ginzaStockBody: false,
    devCentralRefreshOffsets: null,
  }
);

test('Denzaki #16 RB26 240Z appears only in the rotating Prestige Salon',()=>{
  const prestige = [];
  const entry = [];
  for(let tick=0;tick<72;tick++){
    const scene=makeScene('career',tick);
    const [first,second]=scene.getGinzaListings();
    entry.push(first?.carId);
    prestige.push(scene.getGinzaActiveListing()?.carId);
    assert.equal(second?.carId,scene.getGinzaActiveListing()?.carId);
    assert.ok(first?.price<second?.price);
    assert.notEqual(first?.carId,'arkonGinza240z','never Room 1');
  }
  const count=prestige.filter(id=>id==='arkonGinza240z').length;
  assert.ok(count>0,'one-off must appear in regular rotation');
  assert.ok(count<prestige.length,'one-off must not be permanently selectable');
  assert.equal(entry.includes('arkonGinza240z'),false);
  const listing=GINZA_LISTINGS.find(item=>item.carId==='arkonGinza240z');
  assert.equal(listing?.price,125000000);
  assert.equal(cars.arkonGinza240z.visual.bodyPath,
    'assets/Cars/hero/liberty_walk_aruken240z_hero_body.png');
  assert.equal(cars.arkonGinza240z.nosShots,3);
  assert.equal(cars.arkonGinza240z.collector,true);
});

test('30-minute rotation and developer offset control the Denzaki availability',()=>{
  const scene=makeScene('career',0);
  const initial=scene.getGinzaActiveListing();
  const same=makeScene('career',0).getGinzaActiveListing();
  assert.deepEqual(initial,same);
  scene.devCentralRefreshOffsets={showroom:1};
  assert.notEqual(scene.getGinzaActiveListing()?.carId, initial?.carId);
});

test('Arkon Story Mode hides the career-exclusive Denzaki collector',()=>{
  for(let tick=0;tick<72;tick++){
    const scene=makeScene('arkonStory',tick);
    const [first,second]=scene.getGinzaListings();
    assert.notEqual(first?.carId,'arkonGinza240z');
    assert.notEqual(second?.carId,'arkonGinza240z');
  }
});

test('No permanent feature selector remains; buy only a displayed rotating listing',()=>{
  const gallery = source.slice(source.indexOf('  drawGinza() {'),
    source.indexOf('  drawGinzaSide(listing) {'));
  assert.doesNotMatch(source,/ginzaPrestigeOneOff|getGinzaDenzakiListing|drawGinzaPrestigeSelector/);
  assert.doesNotMatch(gallery,/PERMANENT FEATURE|DENZAKI 240Z #16/);
  assert.match(gallery,/HAND-CURATED \/\/ NEW CAR EVERY 30 MINUTES/);
  assert.match(gallery,/\['MOTOR GALLERY', 'PRESTIGE SALON', 'PRIVATE VAULT'\]/);
  const buy = source.slice(source.indexOf('  buyGinzaCar('),
    source.indexOf('  getSelectedBuild() {'));
  assert.match(buy,/this\.getGinzaActiveListing\(\)\?\.carId !== listing\.carId/);
  assert.match(buy,/this\.registry\.get\('gameMode'\) === 'arkonStory'/);
  assert.match(buy,/this\.registry\.set\('cash', cash - listing\.price\)/);
});
