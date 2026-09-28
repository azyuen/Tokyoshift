export const WORLD_PHASE_DURATION_MS = 15 * 60 * 1000;

const WORLD_CYCLE_EPOCH_KEY = 'tokyoShiftWorldCycleEpochV1';
const WORLD_PHASE_OVERRIDE_KEY = 'tokyoShiftWorldPhaseOverrideV1';
const WORLD_PHASES = ['night', 'day'];

function readWorldPhaseOverride() {
  try {
    const value = String(localStorage.getItem(WORLD_PHASE_OVERRIDE_KEY) || '').toLowerCase();
    return WORLD_PHASES.includes(value) ? value : null;
  } catch (e) {
    return null;
  }
}

export function setWorldPhaseOverride(phase = null) {
  const value = String(phase || '').toLowerCase();
  try {
    if (WORLD_PHASES.includes(value)) localStorage.setItem(WORLD_PHASE_OVERRIDE_KEY, value);
    else localStorage.removeItem(WORLD_PHASE_OVERRIDE_KEY);
  } catch (e) {}
  return WORLD_PHASES.includes(value) ? value : null;
}

export function toggleWorldPhaseOverride(now = Date.now()) {
  const current = getWorldPhase(now);
  return setWorldPhaseOverride(current === 'day' ? 'night' : 'day');
}

export function clearWorldPhaseOverride() {
  return setWorldPhaseOverride(null);
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
  const override = readWorldPhaseOverride();
  if (override) return override;
  const epoch = readWorldCycleEpoch(now);
  const elapsed = Math.max(0, now - epoch);
  return WORLD_PHASES[Math.floor(elapsed / WORLD_PHASE_DURATION_MS) % WORLD_PHASES.length];
}

export function getWorldPhaseEndsAt(now = Date.now()) {
  const epoch = readWorldCycleEpoch(now);
  const elapsed = Math.max(0, now - epoch);
  const cycleIndex = Math.floor(elapsed / WORLD_PHASE_DURATION_MS);
  return epoch + (cycleIndex + 1) * WORLD_PHASE_DURATION_MS;
}
