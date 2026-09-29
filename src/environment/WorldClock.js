export const WORLD_PHASE_DURATION_MS = 15 * 60 * 1000;

const WORLD_CYCLE_EPOCH_KEY = 'tokyoShiftWorldCycleEpochV1';
// R247 used this as a permanent dev override. Keep the key only so R286 can
// clean up devices that were accidentally pinned to DAY/NIGHT.
const WORLD_PHASE_OVERRIDE_KEY = 'tokyoShiftWorldPhaseOverrideV1';
const WORLD_PHASES = ['night', 'day'];

function clearLegacyWorldPhaseOverride() {
  try {
    localStorage.removeItem(WORLD_PHASE_OVERRIDE_KEY);
  } catch (e) {}
}

export function setWorldPhaseOverride(phase = null, now = Date.now()) {
  const value = String(phase || '').toLowerCase();
  clearLegacyWorldPhaseOverride();

  if (!WORLD_PHASES.includes(value)) return null;

  // Dev phase changes now reposition the running clock instead of pinning the
  // game forever. Whichever phase is selected gets a full 15-minute window.
  const epoch = value === 'night'
    ? now
    : now - WORLD_PHASE_DURATION_MS;
  try {
    localStorage.setItem(WORLD_CYCLE_EPOCH_KEY, String(epoch));
  } catch (e) {}
  return value;
}

export function toggleWorldPhaseOverride(now = Date.now()) {
  const current = getWorldPhase(now);
  return setWorldPhaseOverride(current === 'day' ? 'night' : 'day', now);
}

export function clearWorldPhaseOverride() {
  clearLegacyWorldPhaseOverride();
  return null;
}

function readWorldCycleEpoch(now = Date.now()) {
  let epoch = 0;
  try {
    epoch = Number(localStorage.getItem(WORLD_CYCLE_EPOCH_KEY) || 0);
  } catch (e) {}

  if (!Number.isFinite(epoch) || epoch <= 0 || epoch > now) {
    epoch = now;
    try {
      localStorage.setItem(WORLD_CYCLE_EPOCH_KEY, String(epoch));
    } catch (e) {}
  }
  return epoch;
}

export function getWorldPhase(now = Date.now()) {
  // Automatically release any R247-era persistent DAY/NIGHT pin.
  clearLegacyWorldPhaseOverride();

  const epoch = readWorldCycleEpoch(now);
  const elapsed = Math.max(0, now - epoch);
  return WORLD_PHASES[Math.floor(elapsed / WORLD_PHASE_DURATION_MS) % WORLD_PHASES.length];
}

export function getWorldPhaseEndsAt(now = Date.now()) {
  clearLegacyWorldPhaseOverride();

  const epoch = readWorldCycleEpoch(now);
  const elapsed = Math.max(0, now - epoch);
  const cycleIndex = Math.floor(elapsed / WORLD_PHASE_DURATION_MS);
  return epoch + (cycleIndex + 1) * WORLD_PHASE_DURATION_MS;
}
