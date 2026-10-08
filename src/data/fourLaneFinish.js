// Shared end-of-heat cues. Both free four-lane testing and the paid cup
// follow the SAME brief fly-past pattern as standard meet races.
export const FOUR_LANE_FINISH_TIMING = Object.freeze({
  cameraLockAfter: 0.24,
  minimumFlyPast: 0.9,
  maximumFlyPast: 2.1,
  noFinishTimeout: 38,
});

export function getFourLaneFinishCue({
  now = 0,
  greenClock = null,
  firstFinishClock = null,
  allFinished = false,
} = {}) {
  if (greenClock == null) return {
    lockCamera: false, showResults: false, timedOut: false,
  };
  if (firstFinishClock == null) {
    const timedOut = now - greenClock >= FOUR_LANE_FINISH_TIMING.noFinishTimeout;
    return { lockCamera: false, showResults: timedOut, timedOut };
  }
  const elapsed = Math.max(0, now - firstFinishClock);
  return {
    lockCamera: elapsed >= FOUR_LANE_FINISH_TIMING.cameraLockAfter,
    showResults: (allFinished && elapsed >= FOUR_LANE_FINISH_TIMING.minimumFlyPast) ||
      elapsed >= FOUR_LANE_FINISH_TIMING.maximumFlyPast,
    timedOut: false,
  };
}
