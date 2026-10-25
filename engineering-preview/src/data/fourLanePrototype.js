// Four-wide drag test helpers. No prizes, wins, or standings are written.
export const FOUR_LANE_TEST_DISTANCE_M = 402.336;
export const FOUR_LANE_TEST_PX_PER_M = 70;
// R436: shift staging 45 more world pixels right. Bumpers remain aligned
// and the start/finish markings stay attached to the shared physical track.
export const FOUR_LANE_TEST_ANCHOR_X = 785;

// Keep the lowest rendered car above the real HUD image during the final
// four-wide camera framing, including user-customised dashboard positions.
export function fourLaneDashSafeYOffset(carBottomY, hudTopY, clearance = 24) {
  if (!Number.isFinite(carBottomY) || !Number.isFinite(hudTopY)) return 0;
  return Math.min(0, hudTopY - clearance - carBottomY);
}
// The physical starting tree and the fixed HUD indicators share one
// countdown state. No separate timers, physics or race progression.
export function fourLaneTreeLights(phase, falseStart = false) {
  const staged = ['STAGE', 'AMBER 1', 'AMBER 2', 'AMBER 3', 'GREEN'].includes(phase);
  const amberLevel = phase === 'AMBER 1' ? 1 :
    phase === 'AMBER 2' ? 2 : phase === 'AMBER 3' ? 3 : 0;
  return {
    preStage: phase !== 'PREVIEW' && phase !== 'ZOOM',
    stage: staged,
    ambers: [1, 2, 3].map(n => amberLevel >= n),
    green: phase === 'GREEN' && !falseStart,
    red: Boolean(falseStart),
  };
}

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
