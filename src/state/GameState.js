export const SAVE_KEY = 'tokyoShiftSaveState';
export const SESSION_KEY = 'tokyoShiftProfile';

export function createDefaultGameState() {
  return {
    version: 1,
    firstName: '',
    lastName: '',
    playerCharacterId: 'renMizuno',
    selectedCarId: 'ae86',
    ownedCarIds: ['ae86'],
    carStates: {
      ae86: {
        stock: true,
        nosInstalled: false,
        tuneLevel: 0,
        acquiredVia: 'starter',
      },
    },
    wins: 0,
    losses: 0,
    cash: 25000,
    district: 'WANGAN',
    gameOver: false,
  };
}

function readJson(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function readManualSave() {
  return readJson(SAVE_KEY);
}

export function readSessionState() {
  return readJson(SESSION_KEY);
}

export function normaliseState(input = {}) {
  const base = createDefaultGameState();
  const owned = Array.isArray(input.ownedCarIds) && input.ownedCarIds.length
    ? [...new Set(input.ownedCarIds)]
    : [...base.ownedCarIds];

  const selectedCarId = owned.includes(input.selectedCarId)
    ? input.selectedCarId
    : owned[0] || null;

  return {
    ...base,
    ...input,
    selectedCarId,
    ownedCarIds: owned,
    carStates: {
      ...base.carStates,
      ...(input.carStates || {}),
    },
    wins: Number.isFinite(input.wins) ? input.wins : base.wins,
    losses: Number.isFinite(input.losses) ? input.losses : base.losses,
    cash: Number.isFinite(input.cash) ? input.cash : base.cash,
    gameOver: Boolean(input.gameOver || owned.length === 0),
  };
}

export function applyStateToRegistry(registry, input) {
  const state = normaliseState(input);
  Object.entries(state).forEach(([key, value]) => registry.set(key, value));
  return state;
}

export function snapshotRegistry(registry) {
  return normaliseState({
    version: 1,
    firstName: registry.get('firstName') || '',
    lastName: registry.get('lastName') || '',
    playerCharacterId: registry.get('playerCharacterId') || 'renMizuno',
    selectedCarId: registry.get('selectedCarId') || null,
    ownedCarIds: registry.get('ownedCarIds') || [],
    carStates: registry.get('carStates') || {},
    wins: registry.get('wins') ?? 0,
    losses: registry.get('losses') ?? 0,
    cash: registry.get('cash') ?? 25000,
    district: registry.get('district') || 'WANGAN',
    gameOver: registry.get('gameOver') || false,
  });
}

export function saveSessionState(registry) {
  const state = snapshotRegistry(registry);
  writeJson(SESSION_KEY, state);
  return state;
}

export function saveManualState(registry) {
  const state = {
    ...snapshotRegistry(registry),
    savedAt: new Date().toISOString(),
  };
  writeJson(SAVE_KEY, state);
  writeJson(SESSION_KEY, state);
  return state;
}

export function restoreManualSave(registry) {
  const saved = readManualSave();
  if (!saved) return null;
  const state = applyStateToRegistry(registry, saved);
  writeJson(SESSION_KEY, state);
  return state;
}

export function clearAllSaves() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // Storage can be unavailable in some private-browser contexts.
  }
}
