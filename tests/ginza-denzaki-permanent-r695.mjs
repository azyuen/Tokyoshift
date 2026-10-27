import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js?v=20261027-r694';
import { GINZA_LISTINGS } from '../src/data/centralTokyo.js';
import { getGinzaRoomStock } from '../src/data/ginzaGallery.js';

const source = readFileSync(new URL('../src/scenes/CentralTokyoScene.js',import.meta.url),'utf8');
const methods = source.slice(
  source.indexOf('  getGinzaListings() {'),
  source.indexOf('  drawGinzaPrestigeSelector() {')
);
assert.ok(methods.startsWith('  getGinzaListings() {'), 'Ginza listing methods must exist');
assert.ok(methods.includes('  getGinzaDenzakiListing() {'), 'permanent listing helper must exist');
assert.ok(methods.includes('  getGinzaActiveListing() {'), 'active listing helper must exist');
const build = new Function('cars','GINZA_LISTINGS','getGinzaRoomStock',
  'return ({' + methods + '});');
const makeScene = (gameMode = 'career') => ({
  ...build(cars,GINZA_LISTINGS,getGinzaRoomStock),
  registry: { get: key=>key==='gameMode'?gameMode:undefined },
  ginzaRoom:2, ginzaPrestigeOneOff:true,
  devCentralRefreshOffsets:null,
});

test('The player can browse a permanent ¥125m Aruken 240Z in Prestige Salon without Pro sponsor flag',()=>{
  const scene=makeScene();
  const active=scene.getGinzaActiveListing();
  assert.equal(active?.carId,'arkonGinza240z');
  assert.equal(active?.price,125000000);
  assert.equal(cars.arkonGinza240z.visual.bodyPath,
    'assets/Cars/hero/liberty_walk_aruken240z_hero_body.png');
  assert.equal(cars.arkonGinza240z.nosShots,3);
  assert.equal(cars.arkonGinza240z.collector,true);
});

test('Manual rotating choice still works and excludes the one-off from 30m random pool',()=>{
  const scene=makeScene();
  scene.ginzaPrestigeOneOff=false;
  const rotating=scene.getGinzaActiveListing();
  assert.ok(rotating?.carId);
  assert.notEqual(rotating.carId,'arkonGinza240z');
  assert.equal(scene.getGinzaListings().some(x=>x?.carId==='arkonGinza240z'),false);
  scene.ginzaPrestigeOneOff=true;
  assert.equal(scene.getGinzaActiveListing()?.carId,'arkonGinza240z');
  scene.ginzaRoom=1;
  assert.notEqual(scene.getGinzaActiveListing()?.carId,'arkonGinza240z');
});

test('Story Mode still hides career-only one-off',()=>{
  const scene=makeScene('arkonStory');
  assert.equal(scene.getGinzaDenzakiListing(),null);
  assert.notEqual(scene.getGinzaActiveListing()?.carId,'arkonGinza240z');
});

test('Room 2 has a visible, clickable one-off selector, full purchase flow and no epilogue gate',()=>{
  assert.match(source,/drawGinzaPrestigeSelector\(\)/);
  assert.match(source,/DENZAKI 240Z #16  \/\/  ¥125M/);
  assert.match(source,/PRESTIGE SALON \/\/ 240Z #16/);
  assert.match(source,/this.ginzaPrestigeOneOff=item.oneOff/);
  assert.match(source,/this.showGinzaPurchase\(listing\)/);
  assert.match(source,/this.buyGinzaCar\(listing, workshopId\)/);
  assert.doesNotMatch(source,/!hasSeenCutscene\(this.registry,'proSponsorEpilogue'\)/);
  assert.match(source,/this.registry.get\('gameMode'\) === 'arkonStory'\)\) return/);
});
