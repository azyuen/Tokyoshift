import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createDefaultProCircuitState } from '../src/data/proCircuit.js';
import {
  DRAG_COMPLEX_HOME_CROWDS, getDragComplexHomeCrowdTier,
  resolveDragComplexHomeBackground,
} from '../src/data/dragComplexHomeVenue.js';

const root = path.resolve(new URL('..', import.meta.url).pathname);
import { getProCircuitDriverSeeds } from '../src/data/proCircuit.js';

const driver = { id: 'streetShootout', openCircuit: true };
const crew = { id: 'crewOpen', team: true };
const trophy = { id: 'trophy', trophyId: 'shutoSpeed', openCircuit: true };
const elite = { id: 'elite', seasonChoice: 'alternative' };
const offers = [null, driver, crew, trophy, elite];

function careerAtRank(rank) {
  const state = createDefaultProCircuitState();
  const ai = getProCircuitDriverSeeds(state).filter(row => row.id !== 'player:driver');
  if (rank === 1) state.playerDriver.rating = 3000;
  else if (rank === ai.length + 1) state.playerDriver.rating = 100;
  else state.playerDriver.rating = ai[rank - 1].rating + 1;
  assert.equal(getProCircuitDriverSeeds(state)
    .find(row => row.id === 'player:driver').seed, rank);
  return state;
}

test('the first visit stays quiet because the initial personal rank is low', () => {
  const initial = createDefaultProCircuitState();
  const position = getProCircuitDriverSeeds(initial)
    .find(row => row.id === 'player:driver').seed;
  assert.ok(position > 12);
  assert.equal(getDragComplexHomeCrowdTier({ circuit: initial }), 'empty');
  // Event choices, access bypasses and registration must never change it.
  for (const event of offers) {
    assert.equal(getDragComplexHomeCrowdTier({
      circuit: initial, event, accessGranted: true,
    }), 'empty');
  }
});

test('home crowd depends solely on individual Pro Driver rank: top 5 full, next 7 half', () => {
  for (const [rank, expected] of [
    [1,'full'],[5,'full'],[6,'half'],[12,'half'],[13,'empty'],[24,'empty'],
  ]) {
    const pro = careerAtRank(rank);
    pro.eventTick = 150;
    pro.openCircuitTick = 80;
    pro.calendar.round = 8;
    pro.seasonStatus = 'COMPLETE';
    pro.tokyoChampionWins = 4;
    pro.activeChampionship = { stage: 'FINAL' };
    pro.playerTeam.rating = 3000;
    for (const offer of offers) {
      const actual = getDragComplexHomeCrowdTier({
        circuit: pro, event: offer, accessGranted: false,
      });
      assert.equal(actual, expected, `rank #${rank}, offer ${offer?.id}`);
    }
    const noEvents = getDragComplexHomeCrowdTier({
      circuit: { ...pro, eventTick: 0, openCircuitTick: 0,
        seasonStatus: 'OPEN', tokyoChampionWins: 0,
        activeChampionship: null, playerTeam: {
          ...pro.playerTeam, rating: 100,
        } },
    });
    assert.equal(noEvents, expected, 'event history and crew rank do not matter');
  }
});

test('selecting any event keeps the identical venue texture key for each phase', () => {
  for (const rank of [1, 6, 12, 20]) {
    const pro = careerAtRank(rank);
    const expected = resolveDragComplexHomeBackground({
      phase: 'night', circuit: pro, event: driver,
    });
    for (const event of offers) {
      const image = resolveDragComplexHomeBackground({
        phase: 'night', circuit: pro, event,
      });
      assert.deepEqual(image, expected);
    }
    const day = resolveDragComplexHomeBackground({
      phase: 'day', circuit: pro, event: trophy,
    });
    assert.equal(day.crowdTier, expected.crowdTier);
    assert.notEqual(day.key, expected.key, 'only day/night phase can change artwork');
  }
});

test('all six rank-based day/night home backgrounds exist', () => {
  assert.deepEqual(DRAG_COMPLEX_HOME_CROWDS, ['empty', 'half', 'full']);
  const tierRanks = { empty: 20, half: 10, full: 3 };
  for (const crowdTier of DRAG_COMPLEX_HOME_CROWDS) {
    let pairedDimensions = null;
    for (const phase of ['day', 'night']) {
      const circuit = careerAtRank(tierRanks[crowdTier]);
      const image = resolveDragComplexHomeBackground({
        phase, circuit, event: trophy,
      });
      const filename = `assets/CentralTokyo/dragcomplex/dragstrip_${crowdTier}_${phase}.png`;
      assert.equal(image.crowdTier, crowdTier);
      assert.equal(image.path, filename);
      assert.ok(fs.existsSync(path.join(root, filename)), filename);
      const fd = fs.openSync(path.join(root, filename), 'r');
      const header = Buffer.alloc(24);
      try {
        assert.equal(fs.readSync(fd, header, 0, 24, 0), 24);
      } finally { fs.closeSync(fd); }
      assert.equal(header.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      const dimensions = [header.readUInt32BE(16), header.readUInt32BE(20)];
      assert.ok(dimensions[0] > 0 && dimensions[1] > 0, filename);
      if (pairedDimensions) assert.deepEqual(dimensions, pairedDimensions,
        'Mismatched phase sizes: ' + crowdTier);
      pairedDimensions = dimensions;
    }
  }
  const day = resolveDragComplexHomeBackground({ phase: 'DAY' });
  const night = resolveDragComplexHomeBackground({ phase: 'NIGHT' });
  assert.equal(day.path, 'assets/CentralTokyo/dragcomplex/dragstrip_empty_day.png');
  assert.equal(night.path, 'assets/CentralTokyo/dragcomplex/dragstrip_empty_night.png');
  assert.notEqual(day.key, night.key);
  assert.ok(!fs.existsSync(path.join(root, 'assets/CentralTokyo/tokyo_dragstrip_day.png')));
});

test('Central Tokyo looks up no event while resolving rank-based home imagery', () => {
  const source = fs.readFileSync(path.join(root, 'src/scenes/CentralTokyoScene.js'), 'utf8');
  const start = source.indexOf('  getLocationBackgroundConfig(');
  const end = source.indexOf('  getLocationBackgroundConfigs(', start);
  assert.ok(start > 0 && end > start);
  const code = source.slice(start, end);
  assert.match(code, /resolveDragComplexHomeBackground\(/);
  assert.doesNotMatch(code, /this\.getProDragEvents\(\)/);
  assert.doesNotMatch(code, /this\.selectedEventIndex/);
  assert.doesNotMatch(code, /event: selected|accessGranted:/);
  const make = new Function('resolveDragComplexHomeBackground','getWorldPhase',
    'return new (class TestScene {' + code + '})();');
  for (const rank of [1, 6, 20]) {
    const pro = careerAtRank(rank);
    const scene = make(resolveDragComplexHomeBackground, () => 'night');
    scene.registry = { get: key => key === 'proCircuit' ? pro : null };
    scene.worldPhase = 'night';
    const location = { kind: 'proDrag', id: 'tokyoDragComplex' };
    const reference = scene.getLocationBackgroundConfig(location, 'night');
    for (let index = 0; index < 3; index++) {
      scene.selectedEventIndex = index;
      assert.deepEqual(scene.getLocationBackgroundConfig(location, 'night'),
        reference, `rank #${rank} event card #${index}`);
    }
  }
  assert.match(source,/getLocationBackgroundConfigs\(location\)/);
  assert.match(source,/syncWorldPhaseBackground\(\)/);
  assert.match(source,/centralTokyoDrag\(Empty\|Half\|Full\)/);
  assert.match(source,/this\.textures\.remove\(key\)/);
  assert.match(source,/this\.renderLocation\(this\.activeLocationId\)/);
});
