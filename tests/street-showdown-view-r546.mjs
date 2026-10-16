import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getRivalCharacterOrderForRegion } from '../src/data/characters.js';
import {
  isStreetShowdownOfferRosterValid,
} from '../src/data/streetShowdownRoster.js';
import {
  SHOWDOWN_STAGE, SHOWDOWN_SIDE, SHOWDOWN_STRIP,
  SHOWDOWN_CARD_CENTERS, SHOWDOWN_CARD_Y, SHOWDOWN_CARD_HEIGHT,
  SHOWDOWN_RACE_Y_OFFSET, SHOWDOWN_BACK_Y_OFFSET,
  SHOWDOWN_RACE_BUTTON_HEIGHT, SHOWDOWN_BACK_BUTTON_HEIGHT,
} from '../src/ui/ShowdownLayout.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const newOffer = (ids = ['aoiShindou', 'kaoriNishimura', 'emiKanzaki']) => ({
  locationId: 'odaiba7eleven',
  rounds: ids.map((id, i) => ({
    characterId: id,
    carId: ['240z', 'crx', 'ek9'][i],
    encounterRating: 3 + (i > 0 ? 1 : 0),
  })),
});
const valid = (offer, source = {}, driver = 'renMizuno') =>
  isStreetShowdownOfferRosterValid(offer, {
    source, activeDriverCharacterId: driver, playerCharacterId: driver,
  });

test('Street Showdowns have three distinct local opponents; single-race overlap is allowed', () => {
  const offer = newOffer();
  assert.equal(valid(offer), true);
  assert.equal(new Set(offer.rounds.map(x => x.characterId)).size, 3);
  for (const round of offer.rounds) {
    assert(getRivalCharacterOrderForRegion('ODAIBA').includes(round.characterId));
  }
  // Aoi is also eligible for ordinary Meet races. That is not a reason to
  // exclude her from this separate Showdown event on the same evening.
  assert.equal(valid(offer, { meetRosters: { odaiba7eleven: [
    { characterId: 'aoiShindou' },
  ] } }), true);
  assert.equal(valid(newOffer(['aoiShindou','aoiShindou','emiKanzaki'])), false);
  assert.equal(valid(newOffer(['aoiShindou','reikaTachibana','emiKanzaki'])), false);
  assert.equal(valid(newOffer(['aoiShindou','kaoriNishimura','emiKanzaki']), {}, 'emiKanzaki'), false);
});

test('saved Showdowns become invalid when a rival is recruited or regional leader is cleared', () => {
  const offer = newOffer();
  assert.equal(valid(offer, { crewMembers: {
    ODAIBA: { characterId: 'aoiShindou', baseCarId: '240z' },
  } }), false, 'recruited drivers cannot appear as opponents');
  assert.equal(valid(offer, { crewBattleProgress: { ODAIBA: { completed: true } } }), false,
    'cleared regional main rival cannot return to the Showdown roster');
  const withoutLeader = newOffer(['aoiShindou','kaoriNishimura','takumiSerizawa']);
  assert.equal(valid(withoutLeader, {
    crewBattleProgress: { ODAIBA: { completed: true } },
  }), true, 'cleared main rivals do not disqualify other local drivers');
  assert.equal(valid({ ...offer, rounds: offer.rounds.slice(0, 2) }), false);
  assert.equal(valid({ ...offer, rounds: [...offer.rounds.slice(0, 2), {
    characterId: 'emiKanzaki', carId: 'missing-car',
  }] }), false);
});

test('Meet refreshes stale saved opponent offers without changing underlying single-race rosters', () => {
  const source = read('src/scenes/MeetScene.js');
  assert.match(source, /!this\.isCompetitionOfferRosterValid\(current\)/);
  assert.match(source, /this\.isCompetitionOfferRosterValid\(offer\)/);
  assert.match(source, /isStreetShowdownOfferRosterValid\(offer,/);
  assert.match(source, /getRecruitedCrewCharacterIds\(this\.registry\)/);
  assert.match(source, /usedCharacters\.push\(characterId\)/);
  assert.match(source, /new Set\(rounds\.map\(round => round\.characterId\)\)\.size !== 3/);
  assert.match(source, /this\.ensureMeetRosterAssets\(/);
  assert.match(source, /'LOADING SHOWDOWN'/);
  assert.match(source, /recordCarMagazineSightings\(/);
  assert.match(source, /this\.startCompetition\(latest\)/);
  assert.match(source, /const latest = this\.getCompetitionOffer\(\)/);
});

test('deferred Meet manga cannot obscure a loading or active Showdown screen', () => {
  const source = read('src/scenes/MeetScene.js');
  assert.match(source, /this\.competitionLoading = true;/);
  assert.match(source, /this\.competitionLoading = false;/);
  assert.match(source, /this\.competitionLoading \|\| this\.competitionPopup\?\.active/);
  assert.match(source, /this\.competitionLoading \|\| this\.competitionPopup\?\.active \|\|/);
  const storyGuards = source.match(/this\.competitionLoading \|\| this\.competitionPopup\?\.active/g) || [];
  assert.ok(storyGuards.length >= 2,
    'regional introduction and tuner challenge must both defer to Showdown');
  const view = read('src/ui/StreetShowdownView.js');
  assert.match(view, /onClick: \(\) => \{/);
  assert.match(view, /close\(\);\s*onEnter\(offer\);/);
});

test('both Skytree and regional Showdowns use the same stage, cards, and action spacing', () => {
  assert.deepEqual(SHOWDOWN_STAGE, { x: 24, y: 92, w: 1138, h: 528 });
  assert.deepEqual(SHOWDOWN_SIDE, { x: 1180, y: 92, w: 356, h: 724 });
  assert.deepEqual(SHOWDOWN_STRIP, { x: 24, y: 636, w: 1138, h: 180 });
  assert.deepEqual(SHOWDOWN_CARD_CENTERS, [215, 593, 971]);
  assert.equal(SHOWDOWN_CARD_Y, 744);
  assert.equal(SHOWDOWN_CARD_HEIGHT, 132);
  assert.equal((SHOWDOWN_BACK_Y_OFFSET - SHOWDOWN_BACK_BUTTON_HEIGHT / 2) -
    (SHOWDOWN_RACE_Y_OFFSET + SHOWDOWN_RACE_BUTTON_HEIGHT / 2), 15);
  const oshiage = read('src/scenes/OshiageScene.js');
  assert.match(oshiage, /const STAGE = SHOWDOWN_STAGE;/);
  assert.match(oshiage, /const SIDE = SHOWDOWN_SIDE;/);
  assert.match(oshiage, /const STRIP = SHOWDOWN_STRIP;/);
  const view = read('src/ui/StreetShowdownView.js');
  assert.match(view, /SHOWDOWN_STAGE as STAGE/);
  assert.match(view, /SHOWDOWN_CARD_CENTERS/);
  assert.match(view, /SHOWDOWN_RACE_Y_OFFSET/);
  assert.match(view, /BACK TO MEET/);
  assert.match(view, /WIN ALL 3 HEATS/);
  assert.doesNotMatch(view, /SKYTREE\\nUNDERPASS|SKYTREE\\nPLAZA/);
});

test('the former small popup is retired, but first visit cutscene and cash/coupon payouts are preserved', () => {
  const source = read('src/scenes/MeetScene.js');
  const start = source.indexOf('  showCompetitionPopup(storyConfirmed = false) {');
  const end = source.indexOf('  configureCompetitionRound(state, index) {', start);
  assert(start > 0 && end > start);
  const method = source.slice(start, end);
  assert.match(method, /playMangaCutscene\(this, 'competitionIntroduction'/);
  assert.match(method, /showStreetShowdownView\(this, \{/);
  assert.doesNotMatch(method, /const panel =/);
  assert.doesNotMatch(method, /STREET SHOWDOWN \/\/ THREE RACES/);
  assert.match(source, /this\.registry\.set\('cash', cash - offer\.entryFee\)/);
  assert.match(source, /this\.registry\.set\('competitionState', state\)/);
  assert.match(source, /this\.scene\.start\('RaceScene'\)/);
  assert.match(source, /state\.rounds\[index\]/);
  const view = read('src/ui/StreetShowdownView.js');
  assert.match(view, /getCarCouponCount\(scene\.registry, offer\.prizeCarId\)/);
  assert.match(view, /getCarCouponRequirement\(offer\.prizeCarId\)/);
  assert.match(view, /scene\.createCarDisplay\(rivalCar,/);
  assert.match(view, /createCharacterProfile\(scene, \{/);
  assert.match(view, /onEnter\(offer\)/);
  assert.match(view, /controller\.select\(i\)/);
});
