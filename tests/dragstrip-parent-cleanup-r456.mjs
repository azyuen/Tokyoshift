import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DRAGSTRIP_CROWD_TIERS, DRAGSTRIP_PHASES,
  DRAGSTRIP_COMPONENTS, resolveDragstripVenue,
} from '../src/data/dragstripVenue.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parent = path.join(root, 'assets/CentralTokyo');
const legacy = [
  'dragstrip_complex_night.png',
  'dragstrip_frontcrowd_night.png',
  'dragstrip_standleft_night.png',
  'dragstrip_standmid_night.png',
  'dragstrip_standright_night.png',
];

test('five superseded parent-folder racetrack images are absent', () => {
  for (const name of legacy) {
    assert.ok(!fs.existsSync(path.join(parent, name)), 'Still present: ' + name);
  }
});

test('both Central Tokyo home-screen background images remain intact', () => {
  const central = fs.readFileSync(path.join(root, 'src/data/centralTokyo.js'), 'utf8');
  for (const phase of ['day', 'night']) {
    const name = 'tokyo_dragstrip_' + phase + '.png';
    assert.ok(fs.existsSync(path.join(parent, name)), 'Missing home-screen art: ' + name);
    assert.ok(central.includes('assets/CentralTokyo/' + name));
  }
});

test('all 30 crowd and phase component images remain intact', () => {
  let found = 0;
  for (const crowdTier of DRAGSTRIP_CROWD_TIERS) {
    for (const phase of DRAGSTRIP_PHASES) {
      const venue = resolveDragstripVenue({crowdTier, phase});
      for (const component of DRAGSTRIP_COMPONENTS) {
        assert.ok(fs.existsSync(path.join(root, venue.sprites[component].path)));
        found++;
      }
    }
  }
  assert.equal(found, 30);
});

test('runtime code contains no references to removed parent-folder art', () => {
  const src = path.join(root, 'src');
  const toCheck = [src];
  let filesScanned = 0;
  while (toCheck.length) {
    const item = toCheck.pop();
    const stat = fs.statSync(item);
    if (stat.isDirectory()) {
      toCheck.push(...fs.readdirSync(item).map(file => path.join(item, file)));
      continue;
    }
    if (!/\.(?:js|mjs|json|css)$/i.test(item)) continue;
    const text = fs.readFileSync(item, 'utf8');
    for (const name of legacy) {
      assert.ok(!text.includes('assets/CentralTokyo/' + name),
        'Stale image reference in ' + path.relative(root, item) + ': ' + name);
    }
    filesScanned++;
  }
  assert.ok(filesScanned > 20);
});
