// Four-wide drag test helpers. No prizes, wins, or standings are written.
export const FOUR_LANE_TEST_DISTANCE_M = 402.336;
export const FOUR_LANE_TEST_PX_PER_M = 70;
// Shift staging toward the right to leave room for the control tower and crew.
// Cars' noses remain aligned by fourLaneCarX; only presentation moves.
export const FOUR_LANE_TEST_ANCHOR_X = 715;
// R434: raise each car by about one wheel width (30 track-world pixels).
// Preserve the lane gaps, perspective scales and front-bumper alignment.
export const FOUR_LANE_TEST_LANES = Object.freeze([
  Object.freeze({ lane: 1, bodyY: 390, scale: 1.00, label: 'YOU' }),
  Object.freeze({ lane: 2, bodyY: 315, scale: 0.90, label: 'RIVAL 1' }),
  Object.freeze({ lane: 3, bodyY: 240, scale: 0.81, label: 'RIVAL 2' }),
  Object.freeze({ lane: 4, bodyY: 165, scale: 0.73, label: 'RIVAL 3' }),
]);

// Cars have different art bounding boxes and scales. Align their FRONT edges,
// not their artwork centres, when staging on the same line.
export function fourLaneCarX(positionM, cameraPx, ownNosePx, playerNosePx) {
  return positionM * FOUR_LANE_TEST_PX_PER_M -
    cameraPx + playerNosePx - ownNosePx;
}

export function fourLaneCameraX(playerPositionM) {
  return playerPositionM * FOUR_LANE_TEST_PX_PER_M - FOUR_LANE_TEST_ANCHOR_X;
}

export function rankFourLaneFinishers(runners = []) {
  return [...runners].map((runner, index) => {
    const raw = Number(runner?.finishSeconds);
    const finished = runner?.finishSeconds != null &&
      Number.isFinite(raw) && raw >= 0;
    return {
      id: String(runner?.id || 'lane-' + (index + 1)),
      lane: Number(runner?.lane || index + 1),
      label: String(runner?.label || 'DRIVER'),
      carLabel: String(runner?.carLabel || 'CAR'),
      finishSeconds: finished ? raw : null,
      disqualified: Boolean(runner?.disqualified),
      status: runner?.disqualified ? 'DQ' : finished ? 'FINISHED' : 'DNF',
    };
  }).sort((a, b) => {
    const rankClass = r => r.status === 'FINISHED' ? 0 : r.status === 'DNF' ? 1 : 2;
    return rankClass(a) - rankClass(b) ||
      (a.finishSeconds ?? Infinity) - (b.finishSeconds ?? Infinity) ||
      a.lane - b.lane;
  }).map((row, index) => ({ ...row, placing: index + 1 }));
}
