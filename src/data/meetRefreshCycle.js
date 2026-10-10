// Meet round lifetime and preload selection are deliberately separate from
// Phaser so expired save-state rivals cannot be revived while assets load.
export const MEET_REFRESH_INTERVAL_MS = 180000;

export function isMeetRoundActive(refreshAt, now = Date.now()) {
  const deadline = Number(refreshAt);
  return Number.isFinite(deadline) && deadline > now;
}

export function chooseMeetPreloadedOffers({
  useStoredRound,
  storedOffers = [],
  generateOffers,
}) {
  // Crucially, the fresh path never applies the previous round's result
  // snapshots to newly generated drivers, even if they occupy the same slots.
  const offers = useStoredRound ? storedOffers : generateOffers();
  return (Array.isArray(offers) ? offers : []).map(offer => ({ ...offer }));
}

export function mayAdoptPreloadedOffers(preloadedFromStored, currentStoredRoundValid) {
  // A refresh deadline can pass while Phaser downloads the character/car art.
  // Never copy a cached expired round into a new cycle during create().
  return Boolean(preloadedFromStored) === Boolean(currentStoredRoundValid);
}
