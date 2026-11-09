import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js?v=20261027-r694';
import { getBaseCarId } from '../src/data/carOwnership.js';
import { TUNER_SHOPS, getTunerShopForRegion } from '../src/data/tunerShops.js';
import { LBWK_CATALOG, getLbwkConversionQuote } from '../src/data/lbwkFullWorks.js';
import { getCrewLoanCarId } from '../src/data/crewRoster.js';
import { isActiveCrewLoanCar, getCrewBattleUnits, removeCrewMember } from '../src/data/crewSystem.js';
import { isCompatibleCrewHeroBuild, syncCrewHeroCarModels } from '../src/data/crewHeroBuilds.js';
import { makeHeroBuildManga } from '../src/data/tunerPurchaseManga.js';

const source = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const sceneSource = source('src/scenes/TunerShopScene.js');
const from = sceneSource.indexOf('  performHeroConversion() {');
const until = sceneSource.indexOf('\n  showToast(message) {', from);
assert.ok(from > 0 && until > from);
const body = sceneSource.slice(from + '  performHeroConversion() {'.length, until)
  .replace(/\n  }\s*$/, '');
const events = [];
const convert = new Function(
  'getBaseCarId','isActiveCrewLoanCar','cars','getLbwkConversionQuote',
  'LBWK_CATALOG','isTunerShopUnlocked','recordCarDeparture',
  'recordCarAcquisition','syncCrewHeroCarModels','saveSessionState',
  'return function performHeroConversion(){' + body + '}'
)(
  getBaseCarId, isActiveCrewLoanCar, cars, getLbwkConversionQuote,
  LBWK_CATALOG, () => true,
  (reg,id) => events.push('depart:'+id),
  (reg,id) => events.push('acquire:'+id),
  syncCrewHeroCarModels,
  () => events.push('save')
);

function scenario({ characterId, baseCarId, region, shop, heroId = shop.heroCarId,
  state = {}, cash = 100000000, heroAlreadyOwned = false } = {}) {
  const loanId = getCrewLoanCarId(characterId);
  const data = {
    ownedCarIds: heroAlreadyOwned ? [loanId,heroId] : [loanId],
    selectedCarId: loanId,
    carStates: { [loanId]: {
      stock: false,
      crewLoan: true, crewOwnerCharacterId: characterId, crewBaseCarId: baseCarId,
      tuning: { engine: 2, turbo: 3 },
      exhaustNosTuning: { nosKit: 2, nitrousShot: 1 },
      ...state,
    }},
    carGarageLocations: { [loanId]: 'crewSpace' },
    crewMembers: { [region]: { characterId, baseCarId, loanCarId: loanId } },
    tunerShopProgress: {},
    cash,
    workshopLocationId: 'shinonomeWarehouseStrip',
  };
  const registry = { get: key => data[key], set: (key,v) => { data[key] = v; } };
  const scene = {
    registry,
    shop: { ...shop, heroCarId: heroId, donorCarId: baseCarId },
    regionId: shop.regionId || region,
    getCurrentCarId: () => data.selectedCarId,
  };
  return { loanId, data, registry, scene, run: () => convert.call(scene) };
}

test.afterEach(() => { syncCrewHeroCarModels({}); events.length = 0; });

test('crew heroes are permitted only for their actual donor model', () => {
  assert.equal(isCompatibleCrewHeroBuild('gc8', 'zeroSportsGc8'), true);
  assert.equal(isCompatibleCrewHeroBuild('gc8', 'lbwkR32'), false);
  assert.equal(isCompatibleCrewHeroBuild('240z','libertyWalk240z'), true);
  assert.equal(isCompatibleCrewHeroBuild('r34','lbwkR34'), true);
  assert.equal(isCompatibleCrewHeroBuild('240z','arkonGinza240z'), false);
});

test('modified crew GC8 converts to ZERO/SPORTS without breaking roster, owner, garage or cash', () => {
  const shop = getTunerShopForRegion('SHINAGAWA');
  const sc = scenario({ characterId:'akiSenda', baseCarId:'gc8',
    region:'DAIKOKU', shop, heroAlreadyOwned: true });
  const oldCrewRoster = JSON.stringify(sc.data.crewMembers);
  const oldOwned = [...sc.data.ownedCarIds];
  assert(isActiveCrewLoanCar(sc.registry, sc.loanId));
  assert.equal(sc.run(),true);
  assert.deepEqual(sc.data.ownedCarIds,oldOwned);
  assert.equal(sc.data.selectedCarId,sc.loanId);
  assert.equal(JSON.stringify(sc.data.crewMembers),oldCrewRoster);
  assert.equal(sc.data.carGarageLocations[sc.loanId],'crewSpace');
  assert.equal(sc.data.carStates[sc.loanId].crewHeroCarId,'zeroSportsGc8');
  assert.equal(sc.data.carStates[sc.loanId].crewOwnerCharacterId,'akiSenda');
  assert.equal(sc.data.cash,100000000-shop.buildCost);
  assert.equal(cars[sc.loanId].crewLoan,true);
  assert.equal(cars[sc.loanId].collector,true);
  assert.equal(cars[sc.loanId].visual.bodyPath,cars.zeroSportsGc8.visual.bodyPath);
  assert.equal(cars[sc.loanId].powerKW,cars.zeroSportsGc8.powerKW);
  assert(isActiveCrewLoanCar(sc.registry,sc.loanId));
  assert(getCrewBattleUnits(sc.registry).some(u=>u.carId===sc.loanId));
  assert.deepEqual(events,['save']);
  assert.equal(sc.run(),false,'a sealed crew hero cannot be converted twice');
});

test('modified personal stock === false is not a conversion ban at any of the entrypoints', () => {
  const show = sceneSource.slice(sceneSource.indexOf('  showHeroMode() {'),
    sceneSource.indexOf('  selectLbwkBuild('));
  const roll = sceneSource.slice(sceneSource.indexOf('  rollInDonor() {'),
    sceneSource.indexOf('  showLbwkBuildReview('));
  const confirmation = sceneSource.slice(sceneSource.indexOf('  showBuildConfirmation() {'),
    sceneSource.indexOf('  confirmHeroConversion() {'));
  assert.doesNotMatch(show,/stock\s*!==\s*false/);
  assert.doesNotMatch(roll,/stock\s*===\s*false/);
  assert.doesNotMatch(confirmation,/stock\s*===\s*false/);
  assert.doesNotMatch(body,/stock\s*===\s*false/);
  assert.match(show,/DO THE HERO BUILD/);
  assert.match(sceneSource,/donorEligible/);
});

test('crew LBWK conversion credits installed Level 2/3 hardware and includes three NOS shots', () => {
  const shop = { ...getTunerShopForRegion('CENTRAL_TOKYO'),
    heroCarId:'libertyWalk240z',donorCarId:'240z' };
  const sc = scenario({characterId:'aoiShindou',baseCarId:'240z',region:'ODAIBA',shop});
  const before = getLbwkConversionQuote(LBWK_CATALOG[0],sc.data.carStates[sc.loanId]);
  const full = getLbwkConversionQuote(LBWK_CATALOG[0],{});
  assert.ok(before.installedCredit > 0);
  assert.ok(before.total < full.total);
  const manga = makeHeroBuildManga(shop,cars[sc.loanId],cars.libertyWalk240z,before);
  assert.match(manga.pages[1].text,/recruited driver keeps this loan car/);
  assert.match(manga.pages[1].text,/three NOS shots/);
  assert.equal(manga.pages.at(-1).secondaryActionLabel,'NO');
  assert.equal(sc.run(),true);
  assert.equal(sc.data.cash,100000000-before.total);
  assert.equal(sc.data.carStates[sc.loanId].lbwkPartsCredit,before.installedCredit);
  assert.equal(sc.data.carStates[sc.loanId].nosInstalled,true);
  assert.equal(sc.data.carStates[sc.loanId].lbwkFullWorks,true);
  assert.equal(cars[sc.loanId].nosShots,3);
  assert.equal(cars[sc.loanId].nosPower,75);
  assert.equal(cars[sc.loanId].tuningLocked,true);
  assert.equal(sc.data.carGarageLocations[sc.loanId],'crewSpace');
});

test('hero build survives load and does not leak into another profile or a removed driver', () => {
  const shop = getTunerShopForRegion('DAIKOKU');
  const sc = scenario({ characterId:'yuiKanzaki',baseCarId:'rx7fd',region:'YOKOHAMA',shop });
  assert.equal(sc.run(),true);
  assert.equal(cars[sc.loanId].collector,true);
  const save = JSON.parse(JSON.stringify(sc.data));
  syncCrewHeroCarModels({});
  assert.equal(cars[sc.loanId].collector,false);
  syncCrewHeroCarModels(save);
  assert.equal(cars[sc.loanId].crewLoan,true);
  assert.equal(cars[sc.loanId].collector,true);
  const removed = removeCrewMember(sc.registry,'YOKOHAMA');
  assert(removed);
  assert(!sc.data.ownedCarIds.includes(sc.loanId));
  assert.equal(sc.data.carStates[sc.loanId],undefined);
  assert.equal(cars[sc.loanId].collector,false);
});

test('crew hero conversions cannot use an unowned, unassigned or non-matching borrowed car',()=>{
  const shop = getTunerShopForRegion('SHINAGAWA');
  const sc = scenario({characterId:'akiSenda',baseCarId:'gc8',region:'DAIKOKU',shop});
  sc.data.crewMembers = {};
  assert.equal(sc.run(),false);
  sc.data.crewMembers = { DAIKOKU: { characterId:'akiSenda',
    baseCarId:'gc8',loanCarId:sc.loanId } };
  sc.data.ownedCarIds = [];
  assert.equal(sc.run(),false);
  assert.equal(sc.data.cash,100000000);
});

test('crew map exposes only the unlocked LBWK tuner, not free movement around Central Tokyo',()=>{
  const map = source('src/ui/TravelMap.js');
  assert.match(map,/crewRegionBlocked = crewTravelMode && selectedRegionId === 'CENTRAL_TOKYO' &&\s*!isTunerShopUnlocked/);
  assert.match(map,/crewRegionBlocked = crewTravelMode && regionId === 'CENTRAL_TOKYO' &&\s*!isTunerShopUnlocked/);
  assert.match(map,/if \(crewRegionBlocked\) return/);
  assert.match(map,/if \(location.centralTokyoUnlock \|\| target\?\.regionId === 'CENTRAL_TOKYO'\) return true/);
});
