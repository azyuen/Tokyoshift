import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getOshiageEliteLineup, getOshiageEliteOpponent,
  getOshiageElitePrize, makeOshiageEliteStageThreeBuild,
  OSHIAGE_ELITE_VENUES,
} from '../src/data/oshiageElite.js';
import {
  beginOshiageShowdown, prepareNextOshiageShowdownHeat,
  getOshiageShowdownAccess, getOshiageShowdownLineup,
} from '../src/data/oshiageShowdown.js';
import { CREW_REGIONS } from '../src/data/crewRoster.js';
import { characters } from '../src/data/characters.js';
import { cars } from '../src/data/cars.js';
import { TRAVEL_REGIONS } from '../src/data/travelRegions.js';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const now = 1800000000000;
const champions = Object.fromEntries(CREW_REGIONS.map(region =>
  [region, { championEarned: true }]));
const makeRegistry = (overrides = {}) => {
  const data = new Map(Object.entries({
    playerCharacterId: 'emiKanzaki', wins: 105, losses: 60,
    tunerTeamChallenges: champions, crewMembers: {},
    ownedCarIds: ['ae86'], selectedCarId: 'ae86',
    cash: 200000, oshiageEliteSeries: null, oshiageEliteCooldowns: {},
    ...overrides,
  }));
  return { get: key => data.get(key), set: (key, v) => data.set(key, v) };
};

test('Oshiage moves north-west of the old marker and its label sits below the dot', () => {
  assert.equal(TRAVEL_REGIONS.OSHIAGE.mapX, 0.452);
  assert.equal(TRAVEL_REGIONS.OSHIAGE.mapY, 0.126);
  assert.ok(TRAVEL_REGIONS.OSHIAGE.mapX > TRAVEL_REGIONS.CENTRAL_TOKYO.mapX);
  const map = source('src/ui/TravelMap.js');
  assert.match(map, /item\.regionId === 'SHIBUYA' \|\| item\.regionId === 'OSHIAGE'/);
  assert.doesNotMatch(map, /const forceRight = item\.regionId === 'OSHIAGE'/);
});

test('each Skytree meet has an independent paid entry and a large three-heat prize', () => {
  assert.equal(OSHIAGE_ELITE_VENUES.underpass.entryFee, 50000);
  assert.equal(OSHIAGE_ELITE_VENUES.plaza.entryFee, 75000);
  assert.equal(OSHIAGE_ELITE_VENUES.underpass.prizeCash, 150000);
  assert.equal(OSHIAGE_ELITE_VENUES.plaza.prizeCash, 250000);
  assert.equal(OSHIAGE_ELITE_VENUES.underpass.rounds, 3);
  assert.equal(OSHIAGE_ELITE_VENUES.plaza.rounds, 3);
});

test('every Skytree prize includes car coupons even when Plaza grants bonus wheels', () => {
  const reg = makeRegistry();
  const underpass = getOshiageElitePrize(reg, 'underpass', 0);
  assert.equal(underpass.cash, 150000);
  assert.equal(underpass.coupons, 2);
  assert.ok(underpass.couponCarId);
  const plaza = getOshiageElitePrize(reg, 'plaza', 0);
  assert.equal(plaza.cash, 250000);
  assert.ok(plaza.coupons >= 2);
  assert.ok(plaza.couponCarId);
  if (plaza.wheelId) {
    const fallback = getOshiageElitePrize(makeRegistry({
      ownedWheelIds: [plaza.wheelId],
    }), 'plaza', 0);
    assert.ok(fallback.coupons >= 2);
    assert.ok(fallback.couponCarId);
  }
});

test('Skytree cars use full Level 3 mechanical tuning without forcing an NA turbo', () => {
  const mechanical = {
    tuning: ['engine', 'intake', 'ecu'],
    drivetrainTuning: ['clutch', 'gearbox', 'differential', 'suspension'],
    chassisTuning: ['tyres', 'weightReduction'],
    exhaustNosTuning: ['headers', 'exhaust', 'muffler'],
  };
  for (const carId of ['ae86', 'r32']) {
    const build = makeOshiageEliteStageThreeBuild(cars[carId], {});
    for (const [category, parts] of Object.entries(mechanical)) {
      for (const part of parts) assert.equal(build[category][part], 3, carId + ': ' + category + '.' + part);
    }
    if (Number(cars[carId].maximumBoost || 0) > 0.01) {
      assert.equal(build.tuning.turbo, 3);
      assert.equal(build.tuning.intercooler, 3);
    } else {
      assert.ok(!build.tuning.turbo, 'NA engine should remain naturally aspirated');
    }
  }
});

test('Plaza locks its wheel-plus-coupon reward and charges entry only once', () => {
  const reg = makeRegistry();
  const offered = getOshiageShowdownLineup(reg, 'plaza', now);
  const result = beginOshiageShowdown(reg, 'plaza', now, offered);
  assert.equal(result.ok, true);
  assert.equal(result.charged, 75000);
  assert.equal(reg.get('cash'), 125000);
  const prize = reg.get('oshiageEliteSeries').prize;
  assert.equal(prize.cash, 250000);
  assert.ok(prize.coupons >= 2);
  assert.ok(prize.couponCarId);
  assert.deepEqual(reg.get('oshiageEliteSeries').lineup.map(x => x.characterId),
    offered.map(x => x.characterId));
});

test('three drivers are distinct, come from anywhere in Tokyo, and cannot be current crew', () => {
  const reg = makeRegistry({ crewMembers: {
    ODAIBA: { characterId: 'renMizuno' }, SHINAGAWA: { characterId: 'reikaTachibana' },
  } });
  const roster = getOshiageEliteLineup(reg, 'underpass', now);
  assert.equal(roster.length, 3);
  assert.equal(new Set(roster.map(x => x.characterId)).size, 3);
  for (const opponent of roster) {
    assert.ok(characters[opponent.characterId]);
    assert.ok(cars[opponent.carId]);
    assert.equal(opponent.encounterRating, 5);
    assert.equal(opponent.buildState.buildRating, 5);
    assert.equal(opponent.buildState.tuning.engine, 3);
    assert.equal(opponent.buildState.chassisTuning.tyres, 3);
    assert.equal(opponent.difficulty, 'ELITE');
    assert.ok(!['renMizuno','reikaTachibana','emiKanzaki'].includes(opponent.characterId));
  }
});

test('showdown charges once, freezes all 3 opponents, and advances to next heat directly', () => {
  const reg = makeRegistry();
  const displayed = getOshiageShowdownLineup(reg, 'underpass', now - 120000);
  assert.equal(displayed.length, 3);
  assert.equal(getOshiageShowdownAccess(reg, 'underpass', now).allowed, true);
  const started = beginOshiageShowdown(reg, 'underpass', now, displayed);
  assert.equal(started.ok, true);
  assert.equal(started.charged, 50000);
  assert.equal(reg.get('cash'), 150000);
  assert.equal(reg.get('selectedRaceCategory'), 'OSHIAGE_ELITE');
  assert.equal(reg.get('selectedOpponentCharacterId'), displayed[0].characterId);
  assert.equal(reg.get('selectedRaceStake'), 0);
  assert.equal(reg.get('oshiageEliteCooldowns').underpass, now + 900000);
  const series = reg.get('oshiageEliteSeries');
  assert.deepEqual(series.lineup.map(x=>x.characterId), displayed.map(x=>x.characterId));
  assert.equal(series.prize.cash, 150000);
  assert.equal(series.prize.coupons, 2);
  const lockedPrize = JSON.stringify(series.prize);
  assert.equal(getOshiageShowdownAccess(reg, 'plaza', now).allowed, false);
  assert.equal(beginOshiageShowdown(reg, 'underpass', now+10).ok, false);
  assert.equal(reg.get('cash'), 150000);

  // Settlement of heat one increments career wins, but heat two's opponent
  // must still match the opponent chosen before heat one.
  reg.set('wins', reg.get('wins') + 1);
  reg.set('oshiageEliteSeries', { ...series, roundIndex: 1 });
  assert.equal(prepareNextOshiageShowdownHeat(reg), true);
  assert.equal(reg.get('selectedOpponentCharacterId'), displayed[1].characterId);
  assert.equal(reg.get('cash'), 150000);
  reg.set('wins', reg.get('wins') + 1);
  reg.set('oshiageEliteSeries', { ...series, roundIndex: 2 });
  assert.equal(prepareNextOshiageShowdownHeat(reg), true);
  assert.equal(reg.get('selectedOpponentCharacterId'), displayed[2].characterId);
  assert.equal(reg.get('cash'), 150000);
  assert.equal(JSON.stringify(reg.get('oshiageEliteSeries').prize), lockedPrize);
  assert.deepEqual(
    getOshiageShowdownLineup(reg, 'underpass', now+300000).map(x=>x.characterId),
    displayed.map(x=>x.characterId)
  );
  assert.equal(reg.get('selectedRaceDistanceM'), 402.336);
  assert.equal(reg.get('raceReturnScene'), 'OshiageScene');
});

test('different venue has a different 3-person showdown, without changing previewed heat order', () => {
  const reg = makeRegistry();
  const before = getOshiageEliteLineup(reg, 'plaza', now);
  assert.equal(before.length, 3);
  assert.equal(new Set(before.map(x=>x.characterId)).size, 3);
  assert.ok(before.every(driver => driver.distanceM === 804.672));
  assert.ok(getOshiageEliteOpponent(reg,'plaza',now,0));
});

test('locked, cooling down and unaffordable meet entries cannot charge money', () => {
  const locked = makeRegistry({ tunerTeamChallenges: {} });
  assert.equal(beginOshiageShowdown(locked, 'underpass', now).ok, false);
  assert.equal(locked.get('cash'), 200000);
  const cooling = makeRegistry({
    oshiageEliteCooldowns: { underpass: now+60000 },
  });
  assert.equal(beginOshiageShowdown(cooling, 'underpass', now).ok, false);
  assert.equal(cooling.get('cash'), 200000);
  const poor = makeRegistry({ cash: 40000 });
  assert.equal(beginOshiageShowdown(poor, 'underpass', now).ok, false);
  assert.equal(poor.get('cash'), 40000);
  const crew = makeRegistry({ ownedCarIds: ['ae86'], selectedCarId: 'abc' });
  assert.equal(beginOshiageShowdown(crew, 'underpass', now).ok, false);
});

test('standard Meet cards and right-side Showdown sections appear in Oshiage', () => {
  const scene = source('src/scenes/OshiageScene.js');
  assert.match(scene, /RIVALS IN THE SHOWDOWN/);
  assert.match(scene, /selectShowdownDriver\(i\)/);
  assert.match(scene, /alpha: 1, duration: 205/);
  assert.match(scene, /drawOwnedCar\(car, opponent\.buildState,/);
  assert.match(scene, /const carWidth = 663/);
  assert.match(scene, /this\.add\.ellipse\(avatarX, feetY - 12/);
  assert.match(scene, /rival\.regionId \|\| 'TOKYO'/);
  assert.match(scene, /SHOWDOWN LOCATION/);
  assert.match(scene, /SKYTREE\\nUNDERPASS/);
  assert.match(scene, /SKYTREE\\nPLAZA/);
  assert.match(scene, /YOUR CAR/);
  assert.match(scene, /THREE ELITE RIVALS/);
  assert.match(scene, /createCharacterProfile\(this, \{/);
  assert.match(scene, /frameWidth: 104,/);
  assert.match(scene, /frameHeight: 104,/);
  assert.doesNotMatch(scene, /oshiageEliteRival_/);
  assert.match(scene, /this\.addText\(x - 42, y \+ 31,/);
  assert.match(scene, /SIDE\.x \+ 265, SIDE\.y \+ 119, 158, 49/);
  assert.match(scene, /'WIN ALL 3 HEATS'/);
  assert.match(scene, /this\.button\(SIDE\.x \+ SIDE\.w \/ 2, SIDE\.y \+ 584,/);
  assert.doesNotMatch(scene, /'ENTRY FEE/);
  assert.match(scene, /'HEAT ' \+ \(previewIndex \+ 1\) \+ ' OF 3'/);
  assert.match(scene, /'CAR: '/);
  assert.match(scene, /DISTANCE: /);
  assert.match(scene, /'PRIZE'/);
  assert.match(scene, /'ENTER  \/\/  ' \+ MONEY\(venue\.entryFee\)/);
  assert.match(scene, /SPECIAL WHEELS/);
  assert.match(scene, /GO TO MAP/);
});

test('RaceScene goes directly to heat 2 and 3, paying prize only after heat 3', () => {
  const race = source('src/scenes/RaceScene.js');
  const helper = source('src/data/oshiageShowdown.js');
  assert.match(race, /settlement\?\.oshiageEliteContinues/);
  assert.match(race, /this\.startNextOshiageEliteHeat\(\)/);
  assert.match(race, /prepareNextOshiageShowdownHeat\(this\.registry\)/);
  const nextHeat = race.slice(race.indexOf('  startNextOshiageEliteHeat() {'),
    race.indexOf('  getNextTunerChallengeRound() {'));
  assert.match(nextHeat, /this\.scene\.restart\(\)/);
  assert.doesNotMatch(nextHeat, /this\.scene\.start\('OshiageScene'\)[^]*this\.scene\.start\('RaceScene'\)/);
  assert.match(race, /const completed = Boolean\(playerWon && roundNumber >= 3/);
  assert.match(race, /const prize = completed \?/);
  assert.match(race, /if \(prize\?\.wheelId\)/);
  assert.match(race, /if \(prize\?\.couponCarId && prize\.coupons > 0\)/);
  assert.doesNotMatch(race, /else if \(prize\?\.couponCarId && prize\.coupons > 0\)/);
  assert.match(helper, /registry\.set\('cash', cashBefore - venue\.entryFee\)/);
  assert.doesNotMatch(helper, /registry\.set\('cash', .*entryFee.*\n.*?registry\.set\('cash'/);
});
