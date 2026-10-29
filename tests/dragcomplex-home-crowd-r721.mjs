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
const driver = { id: 'streetShootout', openCircuit: true };
const trophy = { id: 'trophy', trophyId: 'minor-trophy', openCircuit: true };
const elite = { id: 'elite', seasonChoice: 'alternative' };

test('first pro invite / locked site is empty even with high-prestige offers', () => {
  const initial = createDefaultProCircuitState();
  assert.equal(getDragComplexHomeCrowdTier({ circuit: initial, event: trophy }), 'empty');
  assert.equal(getDragComplexHomeCrowdTier({ circuit: initial, event: elite }), 'empty');
  assert.equal(getDragComplexHomeCrowdTier({ circuit: initial, event: trophy, accessGranted: false }), 'empty');
});

test('the main-page crowd grows with events, professional seasons and ranking', () => {
  const pro = createDefaultProCircuitState();
  pro.eventTick = 1;
  pro.openCircuitTick = 1;
  pro.playerDriver.entered = 1;
  assert.equal(getDragComplexHomeCrowdTier({ circuit: pro, event: driver }), 'empty');
  assert.equal(getDragComplexHomeCrowdTier({ circuit: pro, event: trophy }), 'half');
  pro.eventTick = 4;
  pro.playerDriver.entered = 4;
  assert.equal(getDragComplexHomeCrowdTier({ circuit: pro, event: driver }), 'half');
  assert.equal(getDragComplexHomeCrowdTier({ circuit: pro, event: trophy }), 'full');

  pro.seasonStatus = 'ACTIVE';
  pro.calendar.round = 3;
  assert.equal(getDragComplexHomeCrowdTier({ circuit: pro, event: elite }), 'full');
  pro.playerDriver.rating = 3000;
  assert.equal(getDragComplexHomeCrowdTier({ circuit: pro, event: driver }), 'full');

  const crew = createDefaultProCircuitState();
  crew.eventTick = 1;
  crew.playerTeam.entered = 1;
  crew.playerTeam.rating = 3000;
  assert.equal(getDragComplexHomeCrowdTier({
    circuit: crew, event: { id: 'crew', team: true },
  }), 'full');

  const champion = createDefaultProCircuitState();
  champion.tokyoChampionWins = 1;
  assert.equal(getDragComplexHomeCrowdTier({ circuit: champion, event: driver }), 'full');
});

test('all six new day/night home backgrounds exist and do not reference old files', () => {
  assert.deepEqual(DRAG_COMPLEX_HOME_CROWDS, ['empty', 'half', 'full']);
  for (const crowdTier of DRAG_COMPLEX_HOME_CROWDS) {
    let pairedDimensions = null;
    for (const phase of ['day', 'night']) {
      const circuit = createDefaultProCircuitState();
      if (crowdTier !== 'empty') circuit.eventTick = 4;
      const event = crowdTier === 'full' ? trophy : driver;
      const image = resolveDragComplexHomeBackground({ phase, circuit, event });
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
      if (pairedDimensions) assert.deepEqual(dimensions, pairedDimensions, 'Mismatched phase sizes: ' + crowdTier);
      pairedDimensions = dimensions;
    }
  }
  const day = resolveDragComplexHomeBackground({ phase: 'DAY' });
  const night = resolveDragComplexHomeBackground({ phase: 'NIGHT' });
  assert.equal(day.path, 'assets/CentralTokyo/dragcomplex/dragstrip_empty_day.png');
  assert.equal(night.path, 'assets/CentralTokyo/dragcomplex/dragstrip_empty_night.png');
  assert.notEqual(day.key, night.key);
  assert.ok(!fs.existsSync(path.join(root, 'assets/CentralTokyo/tokyo_dragstrip_day.png')));
  assert.ok(!fs.existsSync(path.join(root, 'assets/CentralTokyo/tokyo_dragstrip_night.png')));
});

test('Central Tokyo renders event-selected crowds, preloads phase pairs and purges old tiers', () => {
  const scene = fs.readFileSync(path.join(root, 'src/scenes/CentralTokyoScene.js'), 'utf8');
  assert.match(scene, /resolveDragComplexHomeBackground\(/);
  assert.match(scene, /this\.getProDragEvents\(\)/);
  assert.match(scene, /this\.selectedEventIndex/);
  assert.match(scene, /getLocationBackgroundConfigs\(location\)/);
  assert.match(scene, /syncWorldPhaseBackground\(\)/);
  assert.match(scene, /centralTokyoDrag\(Empty\|Half\|Full\)/);
  assert.match(scene, /this\.textures\.remove\(key\)/);
});
