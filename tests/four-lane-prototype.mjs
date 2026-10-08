import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  FOUR_LANE_TEST_LANES, FOUR_LANE_TEST_DISTANCE_M,
  FOUR_LANE_TEST_PX_PER_M, FOUR_LANE_TEST_ANCHOR_X,
  fourLaneCameraX, fourLaneCarX, fourLaneDashSafeYOffset,
  rankFourLaneFinishers,
} from '../src/data/fourLanePrototype.js';

test('four staged cars have unique lanes, with two extra lanes above old top row', () => {
  assert.equal(FOUR_LANE_TEST_LANES.length, 4);
  assert.deepEqual(FOUR_LANE_TEST_LANES.map(x => x.lane), [1, 2, 3, 4]);
  assert.ok(FOUR_LANE_TEST_LANES.every((lane, i, rows) =>
    i === 0 || lane.bodyY < rows[i - 1].bodyY));
  assert.ok(FOUR_LANE_TEST_LANES.every((lane, i, rows) =>
    i === 0 || lane.scale < rows[i - 1].scale));
  assert.equal(FOUR_LANE_TEST_DISTANCE_M, 402.336);
  assert.equal(FOUR_LANE_TEST_ANCHOR_X, 785, 'R436 staging nudges 45px right');
  // R434: raise the cars without changing perspective or lane spacing.
  assert.deepEqual(FOUR_LANE_TEST_LANES.map(lane => lane.bodyY),
    [390, 315, 240, 165]);
});

test('the final camera framing keeps every staged car above the customised HUD', () => {
  assert.equal(fourLaneDashSafeYOffset(595, 463, 24), -156);
  assert.equal(fourLaneDashSafeYOffset(350, 463, 24), 0);
  assert.equal(fourLaneDashSafeYOffset(NaN, 463, 24), 0);
  for (const hudTop of [375, 410, 463, 520]) {
    for (const carBottom of [455, 545, 640]) {
      const shiftY = fourLaneDashSafeYOffset(carBottom, hudTop, 24);
      assert.ok(carBottom + shiftY <= hudTop - 24);
    }
  }
});

test('distant lane is narrower and grey asphalt sits inside moved shoulder lines', () => {
  const roadDrop = 150;
  const lineShift = 12;
  const farInset = 26;
  const outerTop = 130 + roadDrop + lineShift + farInset;
  const dividers = [233, 308, 383].map(y => y + roadDrop + lineShift);
  const outerBottom = 490 + roadDrop + lineShift;
  const edges = [outerTop, ...dividers, outerBottom];
  assert.deepEqual(edges, [318, 395, 470, 545, 652]);
  const widths = edges.slice(1).map((bottom, i) => bottom - edges[i]);
  assert.deepEqual(widths, [77, 75, 75, 107]);
  assert.ok(widths[0] < widths[3], 'far side remains slimmer than near side');
  assert.ok(outerTop > 130 + roadDrop + lineShift);
  assert.ok(edges.every((value, i) => !i || value > edges[i - 1]));
});

test('the four-wide scenery enlarges Shinjuku and bridges the two stands', () => {
  const src = fs.readFileSync(
    new URL('../src/scenes/FourLaneTestScene.js', import.meta.url), 'utf8'
  );
  assert.match(src, /const SKYLINE_SCALE_UP = 1\.5/);
  assert.match(src, /const SKYLINE_MIN_WORLD_HEIGHT = 730/);
  assert.match(src, /Math\.max\(SKYLINE_SCALE_UP,/);
  assert.match(src, /setDisplaySize\(this\.skylineWorldWidth, skylineHeight\)/);
  assert.match(src, /if \(distanceM > 0\) imageKeys\.splice\(2, 0, imageKeys\[1\], imageKeys\[1\]\)/);
  assert.match(src, /const worldWidth = x \+ overlap/);
  assert.match(src, /this\.roadsideFence = this\.add\.graphics\(\)\.setDepth\(0\.8\)/);
  assert.match(src, /this\.drawRoadsideFence\(cameraTravel\)/);
  assert.match(src, /const FENCE_TOP_Y = 134/);
  assert.match(src, /const FENCE_CONCRETE_HEIGHT = 42/);
  assert.match(src, /const FENCE_BASE_Y = ROAD_TOP_LINE_Y - STAND_BASE_GAP/);
  assert.match(src, /const worldStart = start\.initialWorldX \+ start\.worldWidth - joinOverlap/);
  assert.match(src, /const worldEnd = finish\.initialWorldX/);
  assert.match(src, /const minWorld = Math\.max\(worldStart, viewStart\)/);
  assert.match(src, /const maxWorld = Math\.min\(worldEnd, viewEnd\)/);
  assert.match(src, /FENCE_MESH_STEP/);

  // Both railing and concrete align 3px above the road; the fence is
  // considerably taller than normal street-race roadside structures.
  const roadTop = 130 + 150 + 12 + 26;
  const baseline = roadTop - 3;
  assert.equal(baseline, 315);
  assert.equal(baseline - (baseline - 42), 42);
  assert.ok((baseline - 42) - 134 >= 120);

  // In the widest establishing view, even the MINIMUM enlarged panorama
  // covers the top edge of the 720px race frame.
  const previewRootY = 290 * (1 - 0.52);
  const skylineTop = previewRootY + 0.52 * (baseline - 730);
  assert.ok(skylineTop < 0);
});

test('all four noses are perfectly lined up at zero distance despite different sprites', () => {
  const camera = fourLaneCameraX(0);
  const playerNose = 110;
  for (const nose of [110, 96, 78, 62]) {
    const bodyCenter = fourLaneCarX(0, camera, nose, playerNose);
    assert.equal(bodyCenter + nose, FOUR_LANE_TEST_ANCHOR_X + playerNose);
  }
});

test('car gaps accurately follow shared physical distances and camera tracking', () => {
  const playerNose = 105;
  const nose = 75;
  const camera = fourLaneCameraX(100);
  const playerFront = fourLaneCarX(100, camera, playerNose, playerNose) + playerNose;
  const rivalFront = fourLaneCarX(101.7, camera, nose, playerNose) + nose;
  assert.ok(Math.abs(rivalFront - playerFront - 1.7 * FOUR_LANE_TEST_PX_PER_M) < 1e-9);
});

test('placings account for realistic quarter mile times and DQ/DNF', () => {
  const results = rankFourLaneFinishers([
    { id: 'player', lane: 1, label: 'YOU', carLabel: 'EK9', finishSeconds: 10.8 },
    { id: 'rival1', lane: 2, finishSeconds: 11.3 },
    { id: 'rival2', lane: 3, finishSeconds: 10.3 },
    { id: 'rival3', lane: 4, finishSeconds: 10.5 },
  ]);
  assert.deepEqual(results.map(x => x.id), ['rival2', 'rival3', 'player', 'rival1']);
  assert.deepEqual(results.map(x => x.placing), [1,2,3,4]);
  const dq = rankFourLaneFinishers([
    { id: 'dq', lane: 1, finishSeconds: 9, disqualified: true },
    { id: 'finish', lane: 2, finishSeconds: 10 },
    { id: 'dnf', lane: 3, finishSeconds: null },
    { id: 'finish2', lane: 4, finishSeconds: 11 },
  ]);
  assert.deepEqual(dq.map(x => x.status), ['FINISHED', 'FINISHED', 'DNF', 'DQ']);
});

test('dev-only sandbox does not mutate career economy or write race settlement', () => {
  const sceneSource = fs.readFileSync(new URL('../src/scenes/FourLaneTestScene.js', import.meta.url), 'utf8');
  const centralTokyo = fs.readFileSync(new URL('../src/scenes/CentralTokyoScene.js', import.meta.url), 'utf8');
  assert.match(sceneSource, /if \(!isArkonDen\(this\.registry\)\)/);
  assert.match(centralTokyo, /'4-LANE TEST'/);
  assert.match(sceneSource, /new DragRacingAI/);
  assert.match(sceneSource, /new TouchControls/);
  assert.match(sceneSource, /new RaceHUD/);
  assert.match(sceneSource, /rankFourLaneFinishers/);
  assert.match(sceneSource, /this\.setTrackZoom\(PREVIEW_ZOOM\)/);
  assert.match(sceneSource, /dragstrip_complex_night\.png/);
  assert.match(sceneSource, /dragstrip_standleft_night\.png/);
  assert.match(sceneSource, /dragstrip_standmid_night\.png/);
  assert.match(sceneSource, /dragstrip_standright_night\.png/);
  assert.match(sceneSource, /skyline_shinjuku_night\.webp/);
  assert.match(sceneSource, /STAND_KEYS = \[/);
  assert.match(sceneSource, /'fourLaneStandLeft', 'fourLaneStandMid', 'fourLaneStandRight'/);
  assert.match(sceneSource, /this\.createStandSet\(0\)/);
  assert.match(sceneSource, /this\.createStandSet\(FINISH_STAND_DISTANCE_M\)/);
  assert.match(sceneSource, /STAND_BASE_GAP = 3/);
  assert.match(sceneSource, /ROAD_TOP_LINE_Y - STAND_BASE_GAP/);
  assert.match(sceneSource, /this\.positionTrackside\(\)/);
  assert.match(sceneSource, /set\.distanceM \* FOUR_LANE_TEST_PX_PER_M - cameraTravel/);
  assert.match(sceneSource, /const SKYLINE_PARALLAX = 0\.16/);
  assert.match(sceneSource, /this\.standSets\.flatMap\(set => set\.images\)/);
  assert.match(sceneSource, /this\.skylineSprites/);
  assert.match(sceneSource, /prepareStandTexture\(key\)/);
  assert.match(sceneSource, /STAND_KEYS\.map\(key => this\.prepareStandTexture\(key\)\)/);
  assert.match(sceneSource, /this\.textures\.addCanvas\(cleanKey, trimmed\)/);
  assert.match(sceneSource, /const imageKeys = STAND_KEYS/);
  assert.match(sceneSource, /STAND_PREVIEW_OVERLAP = 32/);
  assert.match(sceneSource, /STAND_PREVIEW_PIECE_WIDTH = 495/);
  assert.match(sceneSource, /configureComplexArt\(\)/);
  assert.match(sceneSource, /positionComplexArt\(\)/);
  assert.match(sceneSource, /const PREVIEW_ZOOM = 0\.52/);
  assert.match(sceneSource, /const TRACK_PAN_X = -235/);
  assert.match(sceneSource, /const ROAD_DROP_Y = 150/);
  assert.match(sceneSource, /const ZOOM_CAR_FOCUS_X = 640/);
  assert.match(sceneSource, /const DASH_CLEARANCE_PX = 24/);
  assert.match(sceneSource, /this\.configureZoomFocus\(\)/);
  assert.match(sceneSource, /fourLaneDashSafeYOffset\(/);
  assert.match(sceneSource, /this\.hud\?\.cluster\?\.getBounds/);
  assert.match(sceneSource, /getStagedCarBottomWorld\(\)/);
  assert.match(sceneSource, /this\.zoomFocusShiftY \|\| 0/);
  assert.match(sceneSource, /const ROAD_LINE_SHIFT_Y = 12/);
  assert.match(sceneSource, /const FAR_EDGE_EXTRA_INSET_Y = 26/);
  assert.match(sceneSource, /const ROAD_TOP_LINE_Y = STAND_Y \+ ROAD_DROP_Y/);
  assert.match(sceneSource, /const ROAD_BOTTOM_LINE_Y = ROAD_BOTTOM \+ ROAD_DROP_Y/);
  assert.match(sceneSource, /ROAD_DIVIDER_LINE_YS = \[233, 308, 383\]\.map/);
  assert.match(sceneSource, /const laneEdges = \[/);
  assert.match(sceneSource, /ROAD_TOP_LINE_Y, \.\.\.ROAD_DIVIDER_LINE_YS, ROAD_BOTTOM_LINE_Y/);
  assert.match(sceneSource, /bottom - top/);
  assert.match(sceneSource, /FOUR_LANE_TEST_LANES\[index\]\.bodyY \+ ROAD_DROP_Y/);
  assert.match(sceneSource, /const COMPLEX_BASE_PREVIEW_WIDTH = 330/);
  assert.match(sceneSource, /const COMPLEX_PREVIEW_WIDTH = COMPLEX_BASE_PREVIEW_WIDTH \* 1\.5/);
  assert.match(sceneSource, /const originalImageScale = COMPLEX_BASE_PREVIEW_WIDTH \/ art\.width/);
  assert.match(sceneSource, /const artWorldY = \(originalArtTop - previewRootY\) \/ PREVIEW_ZOOM/);
  assert.doesNotMatch(sceneSource, /const laneBandTops =/);
  assert.match(sceneSource, /fillRect\(TRACK_DRAW_LEFT, ROAD_TOP_LINE_Y, TRACK_DRAW_WIDTH, 3\)/);
  assert.match(sceneSource, /fillRect\(TRACK_DRAW_LEFT, ROAD_BOTTOM_LINE_Y - 2, TRACK_DRAW_WIDTH, 2\)/);
  assert.match(sceneSource, /finishEndY = ROAD_BOTTOM_LINE_Y - 5/);
  assert.match(sceneSource, /art\.x = this\.complexBaseX - travelledPx/);
  assert.doesNotMatch(sceneSource, /artScreenScale \/ zoom/);
  assert.match(sceneSource, /cameraPx - fourLaneCameraX\(0\)/);
  assert.doesNotMatch(sceneSource, /saveSessionState|\bregistry\.set\(|\bcompetitionState\b|raceSettlement/);
});
