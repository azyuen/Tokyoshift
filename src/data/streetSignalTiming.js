// Shared street-start timings. Keep this separate from Phaser visuals so the
// countdown cannot drift away from the race physics green-light instant.
export const PEDESTRIAN_WARNING_SECONDS = 2;
export const STREET_COUNTDOWN_SECONDS = 3;
export const STREET_GREEN_SECONDS =
  PEDESTRIAN_WARNING_SECONDS + STREET_COUNTDOWN_SECONDS;

export function getStreetSignalFrame(started, elapsedSeconds, hasGreen) {
  if (hasGreen) return {
    vehicle: 'green', pedestrian: 'red', countdown: null,
  };

  if (!started) return {
    vehicle: 'red', pedestrian: 'green', countdown: null,
  };

  const elapsed = Math.max(0, Number(elapsedSeconds) || 0);
  if (elapsed < PEDESTRIAN_WARNING_SECONDS) {
    // Two deliberate off/on pulses within the 2-second warning window.
    const greenOff =
      (elapsed >= 0.55 && elapsed < 0.85) ||
      (elapsed >= 1.45 && elapsed < 1.75);
    return {
      vehicle: 'red',
      pedestrian: greenOff ? 'off' : 'green',
      countdown: null,
    };
  }

  if (elapsed < STREET_GREEN_SECONDS) {
    const remaining = STREET_COUNTDOWN_SECONDS -
      Math.floor(elapsed - PEDESTRIAN_WARNING_SECONDS);
    const flashCycle = (elapsed - PEDESTRIAN_WARNING_SECONDS) % 0.8;
    return {
      vehicle: 'red',
      pedestrian: flashCycle < 0.53 ? 'red' : 'off',
      countdown: remaining,
    };
  }

  // Physics sets hasGreen in the same frame it passes STREET_GREEN_SECONDS;
  // return the green visual even at the exact boundary for consistency.
  return {
    vehicle: 'green', pedestrian: 'red', countdown: null,
  };
}
