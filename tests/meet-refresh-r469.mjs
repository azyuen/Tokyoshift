import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MEET_REFRESH_INTERVAL_MS,
  isMeetRoundActive,
  chooseMeetPreloadedOffers,
  mayAdoptPreloadedOffers,
} from '../src/data/meetRefreshCycle.js';

// Exercise the real MeetScene overlay methods without starting Phaser,
// so this tests the previously broken reload path rather than a copy.
const meetSource = readFileSync('src/scenes/MeetScene.js', 'utf8');
const methodBody = name => {
  const match = meetSource.match(new RegExp(
    '  ' + name + '\\(locationId(?:, offers = \\[\\])?\\) \\{([\\s\\S]*?)\\n  \\}'
  ));
  assert.ok(match, name + ' exists on MeetScene');
  return match[1];
};
const getMeetRaceResults = new Function(
  'isMeetRoundActive',
  'return function(locationId) {' + methodBody('getMeetRaceResults') + '\n};'
)(isMeetRoundActive);
const applyMeetRaceResults = new Function(
  'Phaser',
  'return function(locationId, offers = []) {' + methodBody('applyMeetRaceResults') + '\n};'
)({ Math: { Clamp: (n, lo, hi) => Math.max(lo, Math.min(hi, n)) } });

function harness(refreshAt) {
  const defeated = ['rival-a', 'rival-b', 'rival-c'].map((id, i) => ({
    slotIndex: i,
    offer: { characterId: id, locked: true, resultState: 'PLAYER_WIN' },
  }));
  const values = {
    meetRefreshAt: refreshAt,
    meetRaceResults: { odaiba: defeated },
  };
  return {
    registry: { get: key => values[key] },
    getMeetRaceResults,
    applyMeetRaceResults,
  };
}
const makeFresh = () => ['rival-a', 'rival-b', 'rival-c']
  .map(id => ({ characterId: id, locked: false, resultState: null }));

test('overnight expiry discards defeated overlays even for the SAME rival identities', () => {
  const oldTimer = Date.now() - 10 * 60 * 60 * 1000;
  const scene = harness(oldTimer);
  const before = makeFresh();
  const preload = chooseMeetPreloadedOffers({
    useStoredRound: isMeetRoundActive(oldTimer),
    storedOffers: scene.applyMeetRaceResults('odaiba', before),
    generateOffers: makeFresh,
  });
  assert.equal(preload.length, 3);
  assert.ok(preload.every(o => !o.locked && !o.resultState));
  assert.equal(scene.getMeetRaceResults('odaiba').length, 0);
  assert.deepEqual(before, makeFresh(), 'preloading did not mutate stored offers');
});

test('defeated cards remain visible during an ACTIVE refresh window', () => {
  const deadline = Date.now() + MEET_REFRESH_INTERVAL_MS;
  const scene = harness(deadline);
  const stored = scene.applyMeetRaceResults('odaiba', makeFresh());
  assert.equal(stored.length, 3);
  assert.ok(stored.every(o => o.locked && o.resultState === 'PLAYER_WIN'));
  const preloaded = chooseMeetPreloadedOffers({
    useStoredRound: isMeetRoundActive(deadline),
    storedOffers: stored,
    generateOffers: () => { throw Error('fresh generator used for an active roster'); },
  });
  assert.ok(preloaded.every(o => o.locked));
});

test('deadline passing during preload blocks copying yesterday\'s result cards into create()', () => {
  assert.equal(mayAdoptPreloadedOffers(true, false), false);
  assert.equal(mayAdoptPreloadedOffers(false, true), false);
  assert.equal(mayAdoptPreloadedOffers(false, false), true);
  assert.equal(mayAdoptPreloadedOffers(true, true), true);
});

test('saved real-time window handles unset and invalid values', () => {
  const now = 2_000_000;
  assert.equal(isMeetRoundActive(now + 1, now), true);
  assert.equal(isMeetRoundActive(now, now), false);
  assert.equal(isMeetRoundActive(now - 1, now), false);
  assert.equal(isMeetRoundActive(0, now), false);
  assert.equal(isMeetRoundActive('bad-value', now), false);
  assert.equal(MEET_REFRESH_INTERVAL_MS, 180000);
});

test('MeetScene only reuses preloaded rival cards from the matching active cycle', () => {
  assert.match(meetSource, /getMeetRaceResults\(locationId\) \{[\s\S]*?if \(!isMeetRoundActive\(this\.registry\.get\('meetRefreshAt'\)\)\) return \[\];/);
  assert.match(meetSource, /generateOffers: \(\) => this\.generateOffersForLocation\(initialLocationId\)/);
  assert.match(meetSource, /mayAdoptPreloadedOffers\(this\.preloadedFromStoredRound, hasStoredRound\)/);
  assert.match(meetSource, /this\.registry\.set\('meetRaceResults', \{\}\)/);
});
