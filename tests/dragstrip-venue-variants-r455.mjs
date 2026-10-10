import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DRAGSTRIP_CROWD_TIERS,
  DRAGSTRIP_PHASES,
  DRAGSTRIP_COMPONENTS,
  DRAGSTRIP_EVENT_CROWDS,
  getDragstripCrowdTier,
  resolveDragstripVenue,
} from '../src/data/dragstripVenue.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scene = fs.readFileSync(path.join(root, 'src/scenes/FourLaneTestScene.js'), 'utf8');
const central = fs.readFileSync(path.join(root, 'src/scenes/CentralTokyoScene.js'), 'utf8');

test('legacy event crowd defaults remain available alongside dynamic season attendance', () => {
  assert.equal(DRAGSTRIP_EVENT_CROWDS.streetShootout, 'low');
  assert.equal(DRAGSTRIP_EVENT_CROWDS.midnightCup, 'half');
  assert.equal(DRAGSTRIP_EVENT_CROWDS.fourWideOpen, 'full');
  assert.equal(getDragstripCrowdTier('streetShootout'), 'low');
  assert.equal(getDragstripCrowdTier('midnightCup'), 'half');
  assert.equal(getDragstripCrowdTier('fourWideOpen'), 'full');
  assert.match(central, /PRO_DRAG_EVENTS\[0\]/);
  assert.match(central, /PRO_DRAG_EVENTS\[pro\.calendar\.round % 2\]/);
  assert.match(scene, /getProfessionalAttendance/);
  assert.match(central, /id: FOUR_WIDE_CUP\.id/);
});

test('legacy and future variants have safe defaults and allow Phase 3 attendance override', () => {
  assert.equal(getDragstripCrowdTier('tokyoInvitational'), 'half');
  assert.equal(getDragstripCrowdTier('unrecognised-event'), 'low');
  assert.equal(getDragstripCrowdTier('streetShootout', 'full'), 'full');
  assert.equal(getDragstripCrowdTier('fourWideOpen', 'half'), 'half');
  assert.equal(getDragstripCrowdTier('midnightCup', 'invalid-tier'), 'half');
  assert.equal(resolveDragstripVenue({ phase: 'DAY' }).phase, 'day');
  assert.equal(resolveDragstripVenue({ phase: 'NIGHT' }).phase, 'night');
  assert.equal(resolveDragstripVenue({ phase: null }).phase, 'night');
  assert.equal(resolveDragstripVenue({ phase: 'garbage' }).phase, 'night');
});

test('all 30 exact user-supplied PNG paths are present with valid PNG dimensions', () => {
  assert.deepEqual([...DRAGSTRIP_COMPONENTS], [
    'complex','frontcrowd','standleft','standmid','standright',
  ]);
  let verified = 0;
  for(const crowdTier of DRAGSTRIP_CROWD_TIERS) {
    for(const phase of DRAGSTRIP_PHASES) {
      const venue = resolveDragstripVenue({ phase, crowdTier, eventId: 'streetShootout' });
      assert.equal(venue.crowdTier, crowdTier);
      assert.equal(venue.phase, phase);
      for(const component of DRAGSTRIP_COMPONENTS) {
        const { key, path: sourcePath } = venue.sprites[component];
        assert.equal(key, `dragstrip_${crowdTier}_${component}_${phase}`);
        assert.equal(sourcePath,
          `assets/CentralTokyo/dragstrip/${crowdTier}_${component}_${phase}.png`);
        const abs = path.join(root, sourcePath);
        assert.ok(fs.existsSync(abs), 'Missing ' + sourcePath);
        const fd = fs.openSync(abs, 'r');
        const header = Buffer.alloc(24);
        try {
          assert.equal(fs.readSync(fd, header, 0, 24, 0), 24);
        } finally { fs.closeSync(fd); }
        assert.equal(header.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
        assert.ok(header.readUInt32BE(16) > 0,'PNG has no width: ' + sourcePath);
        assert.ok(header.readUInt32BE(20) > 0,'PNG has no height: ' + sourcePath);
        verified++;
      }
      assert.equal(venue.skyline.path, `assets/Race/Skylines/skyline_shinjuku_${phase}.webp`);
      assert.ok(fs.existsSync(path.join(root,venue.skyline.path)));
    }
  }
  assert.equal(verified,30);
});

test('racing art follows shared world clock, and is locked until next heat begins',()=>{
  assert.match(scene,/import \{ getWorldPhase \} from '\.\.\/environment\/WorldClock\.js/);
  assert.match(scene,/this\.venueArt = resolveDragstripVenue\(\{/);
  assert.match(scene,/phase: getWorldPhase\(\)/);
  assert.match(scene,/this\.proTournament\?\.crowdTier/);
  assert.match(scene,/this\.proDuelState\?\.crowdTier/);
  assert.match(scene,/Object\.values\(this\.venueArt\.sprites\)\.forEach\(sprite/);
  assert.match(scene,/loadImage\(sprite\.key, sprite\.path\)/);
  assert.match(scene,/loadImage\(this\.venueArt\.skyline\.key, this\.venueArt\.skyline\.path\)/);
  assert.match(scene,/this\.venueArt\.sprites\.complex\.key/);
  assert.match(scene,/this\.venueArt\.sprites\.frontcrowd\.key/);
  assert.match(scene,/this\.venueArt\.sprites\.standleft\.key/);
  assert.match(scene,/this\.venueArt\.sprites\.standmid\.key/);
  assert.match(scene,/this\.venueArt\.sprites\.standright\.key/);
  assert.match(scene,/this\.venueArt\.skyline\.key/);
});

test('mobile texture cache retains only current variation and scene trim canvases',()=>{
  assert.match(scene,/const retained = new Set/);
  assert.match(scene,/key \+ 'SceneTrim'/);
  assert.match(scene,/this\.textures\.remove\(key\)/);
  assert.match(scene,/this\.textures\.list/);
  assert.doesNotMatch(scene,/dragstrip_complex_night\.png/);
  assert.doesNotMatch(scene,/dragstrip_frontcrowd_night\.png/);
  assert.match(scene,/this\.createStandSet\(FINISH_STAND_DISTANCE_M\)/);
  assert.match(scene,/this\.createFrontCrowdSet\(set\.distanceM, set\.images\.length\)/);
  assert.match(scene,/const FINISH_STAND_MIDDLES = 8/);
});
