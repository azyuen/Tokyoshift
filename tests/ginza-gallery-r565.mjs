import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { GINZA_LISTINGS } from '../src/data/centralTokyo.js';
import { GINZA_ROTATION_MS, GINZA_VAULT_CARS, GINZA_VAULT_IDS,
  getGinzaRoomStock, getGinzaVaultCar, ginzaVaultEligible } from '../src/data/ginzaGallery.js';
import { ginzaConversation } from '../src/data/ginzaScenes.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';
const src = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('two public rooms contain exactly one different car, higher value in Room 2', () => {
  for (let tick = 0; tick < 60; tick++) {
    const [entry, prestige] = getGinzaRoomStock(GINZA_LISTINGS, tick * GINZA_ROTATION_MS);
    assert.ok(entry && prestige);
    assert.ok(entry.price < prestige.price, 'room 2 must cost strictly more');
    assert.notEqual(entry.carId, prestige.carId);
    assert.equal(GINZA_VAULT_IDS.has(entry.carId), false);
    assert.equal(GINZA_VAULT_IDS.has(prestige.carId), false);
  }
  const first = getGinzaRoomStock(GINZA_LISTINGS, 0);
  const sameWindow = getGinzaRoomStock(GINZA_LISTINGS, GINZA_ROTATION_MS - 1);
  assert.deepEqual(first, sameWindow);
  const nextWindow = getGinzaRoomStock(GINZA_LISTINGS, GINZA_ROTATION_MS);
  assert.notDeepEqual(first, nextWindow);
});

test('vault variants are fixed to all three racing legends and their clean bodies', () => {
  assert.equal(GINZA_VAULT_CARS.length, 3);
  assert.equal(GINZA_VAULT_IDS.size, 6);
  assert.equal(getGinzaVaultCar(0, false), 'calsonicR390');
  assert.equal(getGinzaVaultCar(0, true), 'cleanR390');
  assert.equal(getGinzaVaultCar(1, false), 'essoToyotaGtOne');
  assert.equal(getGinzaVaultCar(1, true), 'cleanToyotaGtOne');
  assert.equal(getGinzaVaultCar(2, false), 'renownMazda787B');
  assert.equal(getGinzaVaultCar(2, true), 'cleanMazda787B');
});

test('owner is always eligible; ordinary drivers need a genuine Tokyo Championship win', () => {
  assert.equal(ginzaVaultEligible({}, false), false);
  assert.equal(ginzaVaultEligible({}, true), true);
  assert.equal(ginzaVaultEligible({ ginzaVaultInvited: true }), true);
  assert.equal(ginzaVaultEligible({proCircuit:{
    activeChampionship:{completed:true,championId:'randomDriver'}}}), false);
  assert.equal(ginzaVaultEligible({proCircuit:{
    activeChampionship:{completed:true,championId:'player:driver'}}}), true);
  assert.equal(ginzaVaultEligible({proCircuit:{championshipHistory:[
    {completed:true,championId:'player:driver'}]}}), true);
});

test('Ginza art paths for all rooms and all outfit poses exist', () => {
  const backgrounds = ['tokyo_ginza_day.png','tokyo_ginza_night.png',
    'tokyo_ginza02_day.png','tokyo_ginza02_night.png','tokyo_ginza03.png'];
  backgrounds.forEach(name =>
    assert.ok(existsSync('assets/CentralTokyo/' + name), name));
  for (const name of ['emi_saionji','kaede_tachibana']) {
    for (const pose of ['idle','happy','sad'])
      assert.ok(existsSync('assets/Characters/Ginza/' + name + '_' + pose + '.png'));
  }
  for (const pose of ['normal','happy','sad','serious'])
    assert.ok(existsSync('assets/Characters/Ginza/sayaka_fujieda_' + pose + '.png'));
});

test('cash shortfall dialogue and celebrations use all three gallery staff', () => {
  const s1 = ginzaConversation('room1Short',{carName:'R34',shortfall:1250000});
  assert.match(s1.pages[1].text, /1,250,000/);
  assert.match(s1.pages[1].text, /short/);
  assert.ok(s1.pages.some(p => p.leftCharacter === 'emiSaionji'));
  assert.ok(s1.pages.some(p => p.leftCharacter === 'kaedeTachibana'));
  const s2 = ginzaConversation('room2Short',{carName:'NSX',shortfall:500});
  assert.match(s2.pages[0].text, /ambitions/);
  assert.match(s2.pages[1].text, /waste their time/);
  assert.match(s2.pages[2].text, /something to work towards/);
  const bought = ginzaConversation('sale');
  assert.deepEqual(bought.pages.map(p=>p.leftCharacter),
    ['emiSaionji','kaedeTachibana','sayakaFujieda']);
  assert.deepEqual(bought.pages.map(p=>p.leftPose),
    ['ginzaHappy','ginzaHappy','ginzaHappy']);
  const owner = ginzaConversation('vaultOwner');
  assert.equal(owner.pages[0].leftPose,'ginzaHappy');
  assert.equal(owner.pages.at(-1).leftPose,'ginzaSerious');
  assert.match(owner.pages[0].text,/private vault/i);
  assert.doesNotMatch(owner.pages[0].text,/owner of the Ginza Motor Gallery/i);
});

test('gallery loan survives a save without becoming a permanent car-history acquisition', () => {
  const base = createDefaultGameState({starterCarId:'ae86'});
  const demo = 'ginzaDemo_essoToyotaGtOne';
  const actual = normaliseState({
    ...base, ownedCarIds:['ae86',demo], selectedCarId:demo, preferredCarId:demo,
    ginzaTestDrive:{carId:demo,previousCarId:'ae86',previousPreferredId:'ae86'},
    carStates:{...base.carStates,[demo]:{acquiredVia:'ginzaTemporaryTestDrive',ginzaDemo:true}},
  });
  assert.ok(actual.ownedCarIds.includes(demo));
  assert.equal(actual.selectedCarId,demo);
  assert.equal(actual.ginzaTestDrive.previousPreferredId,'ae86');
  assert.equal(actual.carHistory.some(item=>item.carId===demo),false);
});

test('gallery demos are excluded from championships but receive normal street race rewards', () => {
  const pro = src('src/data/proSeason.js');
  const side = src('src/scenes/CentralTokyoScene.js');
  const championship = src('src/ui/ProSeasonPanel.js');
  assert.match(pro, /if\(car\.ginzaDemo\)reasons\.push/);
  assert.match(side, /if \(cars\[this\.registry\.get\('selectedCarId'\)\]\?\.ginzaDemo\) return/);
  assert.match(side, /!owned\.includes\(carId\) \|\| cars\[carId\]\?\.ginzaDemo/);
  assert.match(championship, /cars\[carId\]\.ginzaDemo/);
  const race = src('src/scenes/RaceScene.js');
  assert.match(race, /this\.isGinzaDemoRace\) \{[\s\S]*?this\.raceDeal = 'BET'/);
  assert.match(race, /Ginza demo races follow ordinary street-race settlement/);
});

test('gallery UI is one hero car per room and protects test drives', () => {
  const gallery=src('src/scenes/CentralTokyoScene.js');
  const race=src('src/scenes/RaceScene.js');
  const meet=src('src/scenes/MeetScene.js');
  assert.match(gallery,/this\.ginzaRoom === 1/);
  assert.match(gallery,/this\.ginzaRoom === 2/);
  assert.match(gallery,/this\.ginzaRoom === 3/);
  assert.match(gallery,/this\.switchGinzaVaultCar\(index\)/);
  assert.match(gallery,/this\.toggleGinzaVaultStock\(\)/);
  assert.match(gallery,/this\.startGinzaTestDrive\(listing\)/);
  assert.match(gallery,/this\.endGinzaTestDrive\(false\)/);
  assert.match(gallery,/this\.ginzaScene\(owner \? 'vaultReturnArkon' : 'vaultReturn', \{\}, \(\) => \{/);
  assert.match(gallery,/this\.ginzaScene\('interest'/);
  assert.match(race,/this\.setupGinzaPassenger\(\)/);
  assert.match(race,/this\.updateGinzaPassenger\(playerT\)/);
  assert.match(race,/this\.isGinzaDemoRace/);
  assert.match(meet,/GALLERY LOAN \/\/ NO PINKS/);
});
