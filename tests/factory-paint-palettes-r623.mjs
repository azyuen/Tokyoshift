import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FACTORY_PAINT_PALETTES, getFactoryPaintPalette, getFactoryPaintColor,
  getDefaultFactoryPaintColor, getFactoryPaintName,
} from '../src/data/factoryPaintPalettes.js';

const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('all 42 production cars and developer Magna have palettes', () => {
  assert.equal(Object.keys(FACTORY_PAINT_PALETTES).length, 43);
  assert.equal(Object.values(FACTORY_PAINT_PALETTES).reduce((n,p) => n + p.length, 0), 273);
  for (const [id, palette] of Object.entries(FACTORY_PAINT_PALETTES)) {
    assert.ok(palette.length >= 4, id);
    assert.ok(palette.every(p => p.name && Number.isInteger(p.color) && p.color >= 0 && p.color <= 0xffffff), id);
    assert.equal(new Set(palette.map(p => p.color)).size, palette.length, 'distinct paint values: '+id);
  }
});

test('1998 TF Magna Sports has its four original names and Frontier Green by default', () => {
  const palette = getFactoryPaintPalette('magna');
  assert.deepEqual(palette.map(p => p.name),
    ['Paris White', 'Calypso Red', 'Nautilus Blue', 'Frontier Green']);
  assert.equal(getDefaultFactoryPaintColor('magna'), palette[3].color);
  assert.equal(getFactoryPaintName('magna', palette[3].color), 'Frontier Green');
  assert.notEqual(getDefaultFactoryPaintColor('magna'), 0xffffff);
});

test('Evo VI GSR does not borrow Evo V red or yellow', () => {
  assert.equal(getFactoryPaintPalette('evo6').length, 5);
  assert.equal(getFactoryPaintPalette('evo5').length, 6);
  assert.ok(!getFactoryPaintPalette('evo6').some(p => /red|yellow/i.test(p.name)));
});

test('owner copy IDs use their exact base-model palettes; collectors have none', () => {
  assert.deepEqual(getFactoryPaintPalette('s15__copy2'), getFactoryPaintPalette('s15'));
  assert.equal(getFactoryPaintPalette('renownMazda787B').length, 0);
  assert.equal(getFactoryPaintColor('renownMazda787B'), null);
  assert.equal(getFactoryPaintColor('magna', 3), getDefaultFactoryPaintColor('magna'));
  assert.equal(getFactoryPaintColor('s15', 999), getFactoryPaintPalette('s15')[999 % 6].color);
});

test('paint studio shows chosen manufacturer name and rejects other preset values', () => {
  const source=file('src/scenes/OshiageScene.js');
  assert.match(source,/getFactoryPaintPalette\(getBaseCarId\(id\)\)/);
  assert.match(source,/selectedFinish\.name\.toUpperCase\(\)/);
  assert.match(source,/selectedFinish\.code/);
  assert.match(source,/this\.pendingPaint = preset\.color/);
  assert.match(source,/!getFactoryPaintPalette\(getBaseCarId\(carId\)\)\.some\(p => p\.color === paintColor\)/);
  assert.match(source,/mode === 'custom' \? 16000 : mode === 'street' \? 12000 : 8000/);
});

test('new/used market listings and generated meet opponents receive car-specific colours', () => {
  const market=file('src/scenes/CentralTokyoScene.js');
  const meets=file('src/scenes/MeetScene.js');
  assert.match(market,/getFactoryPaintColor\(item\.carId,/);
  assert.match(meets,/getFactoryPaintColor\(physical\.carId,/);
  assert.match(meets,/getFactoryPaintColor\(carId,/);
});

test('starter and developer Magna defaults do not overwrite other saved car paints', () => {
  const state=file('src/state/GameState.js');
  assert.match(state,/getDefaultFactoryPaintColor\('magna'\)/);
  assert.match(state,/existingMagna\.paintColor/);
  assert.match(state,/\.\.\.\(input\.carStates \|\| \{\}\)/);
  assert.match(state,/paintColor: getDefaultFactoryPaintColor\(carId\)/);
  const serviceWorker=file('sw.js');
  const index=file('index.html');
  assert.match(serviceWorker,/R62[34]/);
  assert.match(index,/R62[34]/);
});
