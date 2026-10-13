import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  OSHIAGE_ELITE_COOLDOWN_MS, OSHIAGE_ELITE_VENUES,
  getOshiageEliteProgress, getOshiageEliteRemainingMs,
  getOshiageEliteOpponent, eligibleOshiageEliteDrivers, getOshiageElitePrize,
} from '../src/data/oshiageElite.js';
import { getCentralTokyoEligibility } from '../src/data/centralTokyo.js';
import { CREW_REGIONS } from '../src/data/crewRoster.js';
import { WHEEL_CATALOG } from '../src/data/wheels.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';
import { TRAVEL_REGIONS } from '../src/data/travelRegions.js';
import { characters } from '../src/data/characters.js';
import { cars } from '../src/data/cars.js';

const championStore = Object.fromEntries(CREW_REGIONS.map(id => [id, { championEarned: true }]));
const completedCrewBattles = Object.fromEntries(CREW_REGIONS.map(id => [id, { completed: true }]));

test('Skytree access requires all seven regional championships, including Shinjuku', () => {
  const six = { ...championStore };
  delete six.SHINJUKU;
  assert.deepEqual(getOshiageEliteProgress({ tunerTeamChallenges: six }), {
    count: 6, required: 7, complete: false,
  });
  assert.equal(getOshiageEliteProgress({ tunerTeamChallenges: championStore }).complete, true);
  assert.equal(getOshiageEliteProgress({ tunerTeamChallenges: {}, devMode: true }).complete, true);
});

test('professional drag complex is instead locked until all seven crew battles are complete', () => {
  const base = { tunerTeamChallenges: championStore, wins: 150, garageTier: 2 };
  assert.equal(getCentralTokyoEligibility({ ...base, crewBattleProgress: {} }).drag, false);
  const sixCrew = { ...completedCrewBattles };
  delete sixCrew.SHINJUKU;
  assert.equal(getCentralTokyoEligibility({ ...base, crewBattleProgress: sixCrew }).drag, false);
  assert.equal(getCentralTokyoEligibility({ ...base, crewBattleProgress: completedCrewBattles }).drag, true);
});

test('map places both special districts on land with Oshiage to the right', () => {
  const central = TRAVEL_REGIONS.CENTRAL_TOKYO;
  const oshiage = TRAVEL_REGIONS.OSHIAGE;
  assert.ok(oshiage.mapX > central.mapX);
  assert.equal(oshiage.mapY, central.mapY);
  assert.ok(oshiage.mapY > 0.1);
  const map = readFileSync(new URL('../src/ui/TravelMap.js', import.meta.url), 'utf8');
  assert.match(map, /regionId === 'OSHIAGE'\) \? 0xffd600/);
  assert.match(map, /const forceRight = item.regionId === 'OSHIAGE'/);
});

test('two venues each have an independent real-time fifteen-minute cooldown', () => {
  assert.equal(OSHIAGE_ELITE_COOLDOWN_MS, 900000);
  assert.equal(OSHIAGE_ELITE_VENUES.underpass.rounds, 3);
  assert.equal(OSHIAGE_ELITE_VENUES.plaza.rounds, 3);
  const now = 1800000000000;
  const state = { oshiageEliteCooldowns: { underpass: now + 900000, plaza: now - 500 } };
  assert.equal(getOshiageEliteRemainingMs(state, 'underpass', now), 900000);
  assert.equal(getOshiageEliteRemainingMs(state, 'plaza', now), 0);
});

test('Elite opponent can come from any region but never an existing crew member or the player', () => {
  const pool = eligibleOshiageEliteDrivers({
    playerCharacterId: 'emiKanzaki',
    crewMembers: { ODAIBA: { characterId: 'renMizuno' }, SHINAGAWA: { characterId: 'reikaTachibana' } },
  });
  assert.ok(pool.length > 5);
  for (const id of ['emiKanzaki', 'renMizuno', 'reikaTachibana', 'sayakaFujieda'])
    assert.equal(pool.includes(id), false);
  const source = { playerCharacterId: 'emiKanzaki', wins: 175, crewMembers:
    { ODAIBA: { characterId: 'renMizuno' }, SHINAGAWA: { characterId: 'reikaTachibana' } } };
  const results = [0,1,2].map(round =>
    getOshiageEliteOpponent(source, 'underpass', 1800000000000, round));
  assert.equal(results.length, 3);
  assert.equal(new Set(results.map(x => x.characterId)).size, 3);
  for (const rival of results) {
    assert.ok(rival.characterId && characters[rival.characterId]);
    assert.ok(cars[rival.carId]);
    assert.equal(rival.encounterRating, 5);
    assert.equal(rival.buildState.buildRating, 5);
    assert.ok(!['renMizuno', 'reikaTachibana', 'emiKanzaki'].includes(rival.characterId));
  }
});

test('full Elite prize is several coupons or a new rare wheel', () => {
  const cash = getOshiageElitePrize({ ownedWheelIds: [] }, 'underpass', 0);
  assert.equal(cash.cash, 500000);
  assert.equal(cash.coupons, 2);
  assert.ok(cars[cash.couponCarId]);
  const wheelPrize = getOshiageElitePrize({ ownedWheelIds: [] }, 'plaza', 0);
  assert.equal(wheelPrize.cash, 750000);
  assert.ok(WHEEL_CATALOG.find(item => item.id === wheelPrize.wheelId));
  const allRare = WHEEL_CATALOG.filter(x => ['HERO','TUNER'].includes(x.tier)).map(x => x.id);
  const fallback = getOshiageElitePrize({ ownedWheelIds: allRare }, 'plaza', 0);
  assert.equal(fallback.coupons, 3);
  assert.ok(cars[fallback.couponCarId]);
});

test('old profiles gain valid Oshiage defaults and in-progress streaks survive save normalization', () => {
  const initial = createDefaultGameState();
  assert.equal(initial.oshiageEliteSeries, null);
  assert.deepEqual(initial.oshiageEliteCooldowns, {});
  const normalized = normaliseState({
    ...initial, oshiageEliteSeries: {
      active: true, venueId: 'underpass', roundIndex: 1,
      playerCarId: 'ae86', startedAt: 10000,
    },
    oshiageEliteCooldowns: { underpass: 900000, plaza: 0 },
    oshiageInstructorMet: true, oshiageBasicLessonComplete: true,
  });
  assert.equal(normalized.oshiageEliteSeries.roundIndex, 1);
  assert.equal(normalized.oshiageEliteCooldowns.underpass, 900000);
  assert.equal(normalized.oshiageInstructorMet, true);
  assert.equal(normalized.oshiageBasicLessonComplete, true);
});

test('scene integrates three race streak, cutscene anonymity, preset and RGB pricing, and slow side entry', () => {
  const scene = readFileSync(new URL('../src/scenes/OshiageScene.js', import.meta.url), 'utf8');
  const race = readFileSync(new URL('../src/scenes/RaceScene.js', import.meta.url), 'utf8');
  assert.match(scene, /LADY INSTRUCTOR/);
  assert.match(scene, /random driving instructor/);
  assert.doesNotMatch(scene.slice(scene.indexOf('  drawSchool() {'), scene.indexOf('  drawMeet() {')), /Sayaka Fujieda/);
  assert.match(scene, /this\.registry\.set\('raceReturnScene', 'OshiageScene'\)/);
  assert.match(scene, /mode === 'custom' \? 16000 : 8000/);
  assert.match(scene, /duration: 3450, ease: 'Sine.easeInOut'/);
  assert.match(scene, /this\.registry\.set\('oshiageEliteSeries'/);
  assert.match(scene, /roundIndex \+ 1/);
  assert.match(race, /const completed = Boolean\(playerWon && roundNumber >= 3/);
  assert.match(race, /if \(settlement\.oshiageEliteContinues\)/);
  assert.match(race, /const prize = completed \?/);
});
