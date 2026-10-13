import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AUTO_MARKET_LISTINGS } from '../src/data/centralTokyo.js';

const garage = readFileSync(new URL('../src/scenes/GarageScene.js', import.meta.url), 'utf8');
const market = readFileSync(new URL('../src/scenes/CentralTokyoScene.js', import.meta.url), 'utf8');

test('R488 garage thumbnail lowering applies only to the nine opt-in reference cars', () => {
  const snippet = garage.match(/const thumbBodyY = y \+ THUMB_CFG\.bodyYOffset \+[\s\S]*?;\n\s*const display = this\.createCarDisplay/);
  assert.ok(snippet, 'garage thumbnail gets a Ref-only offset');
  assert.match(snippet[0], /cars\[id\]\?\.visual\?\.referenceStandard \? 30 : 0/);
});

test('R32 and RX8 already exist in the new dealership pool, with their correct game IDs', () => {
  assert.equal(AUTO_MARKET_LISTINGS.filter(l => l.carId === 'rx8').length, 1);
  assert.equal(AUTO_MARKET_LISTINGS.filter(l => l.carId === 'r32').length, 1);
  assert.equal(AUTO_MARKET_LISTINGS.length, 29);
});

test('stock pages provide access to EVERY new-car model, three at a time', () => {
  const match = market.match(/  getNewCarListings\(\) \{([\s\S]*?)\n  \}\n\n  \/\/ Browse every stock model/);
  assert.ok(match, 'market page function is present');
  const getPage = new Function('return function(){' + match[1] + '\n}')();
  const fixture = AUTO_MARKET_LISTINGS.map(entry => ({ ...entry }));
  const pages = Math.ceil(fixture.length / 3);
  const seen = [];
  for (let page = 0; page < pages; page++) {
    const listed = getPage.call({
      newCarStockPage: page,
      getAllNewCarListings: () => fixture,
    });
    assert.ok(listed.length > 0 && listed.length <= 3);
    seen.push(...listed.map(item => item.carId));
  }
  assert.deepEqual(seen, fixture.map(l => l.carId));
  assert.ok(seen.includes('r32') && seen.includes('rx8'));
  assert.match(market, /pageButton\(CARDS\.x \+ 945, 'PREV', -1\)/);
  assert.match(market, /pageButton\(CARDS\.x \+ 1060, 'NEXT', 1\)/);
  assert.match(market, /this\.load\.once\('complete', finish\)/);
});
