import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js';
import { TUNER_SHOPS } from '../src/data/tunerShops.js';
import { makeHeroBuildManga, makeSpecialistTuneManga } from '../src/data/tunerPurchaseManga.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const shopScene = source('src/scenes/TunerShopScene.js');
const renderer = source('src/ui/MangaCutscene.js');

function method(start, next, dependencies) {
  const a = shopScene.indexOf('  ' + start + ' {');
  const b = shopScene.indexOf('  ' + next + ' {', a + start.length);
  assert(a >= 0 && b > a, start + ' method boundaries exist');
  const body = shopScene.slice(a + ('  ' + start + ' {').length, b)
    .replace(/\n  }\s*$/, '');
  return new Function(...Object.keys(dependencies),
    'return function ' + start + '{' + body + '}')(...Object.values(dependencies));
}

const format = n => '¥ ' + Number(n).toLocaleString('en-US');
const finalPage = definition => definition.pages.at(-1);

test('every regional specialist offer gets a voiced three-page manga with exact benefit, price, and optional NO', () => {
  for (const shop of Object.values(TUNER_SHOPS).filter(s => s.tuningOptions?.length)) {
    assert(shop.mechanicId);
    for (const option of shop.tuningOptions) {
      const manga = makeSpecialistTuneManga(shop, cars.gc8, option);
      assert.equal(manga.once, false);
      assert.equal(manga.characters.left, shop.mechanicId);
      assert.equal(manga.characters.right, '$PLAYER');
      assert.equal(manga.pages.length, 3);
      assert(manga.pages[1].text.includes(option.benefit), option.id);
      assert(manga.pages[1].text.includes(option.description), option.id);
      assert.equal(finalPage(manga).secondaryActionLabel, 'NO');
      assert.equal(finalPage(manga).actionLabel, 'YES, ' + format(option.cost));
      assert.equal(finalPage(manga).requireActionButton, true);
    }
  }
});

test('all seven regional hero cars show the actual car change, actual figures and full price', () => {
  for (const shop of Object.values(TUNER_SHOPS).filter(s => s.tuningOptions?.length)) {
    const manga = makeHeroBuildManga(shop, cars[shop.donorCarId], cars[shop.heroCarId],
      { total: shop.buildCost });
    const body = manga.pages.map(p => p.text).join('\n');
    assert(body.includes(cars[shop.heroCarId].name));
    assert(body.includes(cars[shop.donorCarId].name));
    assert(body.includes('permanently replaced'));
    assert(body.includes(String(cars[shop.donorCarId].powerKW)));
    assert(body.includes(String(cars[shop.heroCarId].torqueNm)));
    assert.equal(finalPage(manga).actionLabel, 'YES, ' + format(shop.buildCost));
    assert.equal(finalPage(manga).secondaryActionLabel, 'NO');
  }
});

test('Liberty Walk final page displays parts credit and exact live quoted payable amount', () => {
  const shop = TUNER_SHOPS.CENTRAL_TOKYO;
  const quote = { total: 1123400, fullPartsCost: 2450000,
    installedCredit: 1700000, specialistPremium: 373400 };
  const manga = makeHeroBuildManga(shop, cars['240z'], cars.libertyWalk240z, quote);
  assert(manga.pages[1].text.includes('FACTORY TO HERO'));
  assert(manga.pages[1].text.includes('Full Level 3 tuning and three NOS shots'));
  assert(manga.pages[2].text.includes('installed parts credit −¥ 1,700,000'));
  assert(manga.pages[2].text.includes('Total to pay: ¥ 1,123,400'));
  assert.equal(finalPage(manga).actionLabel, 'YES, ¥ 1,123,400');
  assert.equal(manga.characters.left, 'arkonDen');
});

test('existing manga renderer requires an explicit YES button and preserves NO and SKIP', () => {
  assert.match(renderer, /activePage\?\.requireActionButton && source !== 'button'/);
  assert.match(renderer, /secondaryBox\?\.on\('pointerdown', \(\) => controller\.finish\('secondary'\)\)/);
  assert.match(renderer, /controller\.skip = \(\) => controller\.finish\('skip'\)/);
  assert.match(shopScene, /reason !== 'action'/);
  assert.match(shopScene, /preloadPagePosesOnly: true/);
});

test('specialist manga YES installs only after callback and NO/SKIP keep the wallet untouched', () => {
  const shop = TUNER_SHOPS.SHINAGAWA;
  const option = shop.tuningOptions[0];
  const state = { cash: option.cost + 100, carStates: { gc8: {
    tuning: { ecu: 3, turbo: 3 }, specialistTuning: [],
  } } };
  let pending = null;
  let installs = 0;
  const registry = { get: key => state[key] };
  const methodUnderTest = method('showTuneConfirmation(carId, option)', 'showDecalMode()', {
    cars,
    getInstalledSpecialistTuning: car => car.specialistTuning || [],
    areTunerOptionRequirementsMet: () => true,
    makeSpecialistTuneManga,
    playMangaCutscene: (_scene, definition, options) => {
      pending = { definition, options }; return { played: true };
    },
  });
  const scene = {
    shop, registry, getCurrentTunableCarId: () => 'gc8', clearPopup() {},
    showToast() {}, installSpecialistTune() { installs++; },
  };
  methodUnderTest.call(scene, 'gc8', option);
  assert(pending);
  assert.equal(installs, 0);
  pending.options.onComplete({ reason: 'secondary' });
  pending.options.onComplete({ reason: 'skip' });
  assert.equal(installs, 0);
  assert.equal(state.cash, option.cost + 100);
  pending.options.onComplete({ reason: 'action' });
  assert.equal(installs, 1);
});

test('hero manga NO/SKIP cannot initiate irreversible conversion', () => {
  const shop = TUNER_SHOPS.SHINAGAWA;
  const state = { cash: shop.buildCost + 10,
    ownedCarIds: ['gc8'], carStates: { gc8: { stock: true } } };
  let pending = null;
  let conversions = 0, returns = 0;
  const registry = { get: key => state[key] };
  const methodUnderTest = method('showBuildConfirmation()', 'confirmHeroConversion()', {
    cars,
    getBaseCarId: id => id,
    isActiveCrewLoanCar: () => false,
    makeHeroBuildManga,
    playMangaCutscene: (_scene, definition, options) => {
      pending = { definition, options }; return { played: true };
    },
  });
  const scene = {
    shop, registry, getCurrentCarId: () => 'gc8', clearPopup() {},
    showHeroMode() { returns++; }, showToast() {},
    confirmHeroConversion() { conversions++; },
  };
  methodUnderTest.call(scene);
  assert(pending);
  assert.equal(conversions, 0);
  pending.options.onComplete({ reason: 'secondary' });
  pending.options.onComplete({ reason: 'skip' });
  assert.equal(conversions, 0);
  assert.equal(returns, 2);
  assert.equal(state.cash, shop.buildCost + 10);
  pending.options.onComplete({ reason: 'action' });
  assert.equal(conversions, 1);
});
