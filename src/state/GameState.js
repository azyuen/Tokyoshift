import {
  WORKSHOP_TIERS,
  getWorkshopByLocationId,
  inferWorkshopTier,
  normaliseCarGarageLocations,
} from '../data/workshopProgression.js?v=20260922-r86';

export const SAVE_KEY = 'tokyoShiftSaveState';
export const SESSION_KEY = 'tokyoShiftProfile';

export function createDefaultGameState() {
  return {
    version: 3,
    firstName: '',
    lastName: '',
    playerCharacterId: 'renMizuno',
    selectedCarId: 'ae86',
    ownedCarIds: ['ae86'],
    carStates: {
      ae86: {
        stock: true,
        paintColor: 0xffffff,
        nosInstalled: false,
        tuneLevel: 0,
        tuning: {
          engine: 0,
          intake: 0,
          ecu: 0,
          turbo: 0,
          intercooler: 0,
          exhaust: 0,
        },
        acquiredVia: 'starter',
      },
    },
    wins: 0,
    losses: 0,
    cash: 50000,
    devMode: false,
    district: 'ODAIBA',
    meetLocation: 'odaiba7eleven',
    garageTier: 0,
    workshopLocationId: 'shinonomeWorkshop',
    carGarageLocations: {
      ae86: 'shinonomeWorkshop',
    },
    meetRosters: {},
    meetRefreshAt: 0,
    defeatedRivalKeys: [],
    meetStranded: false,
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
  const locationAliases = {
    wangan711: 'odaiba7eleven',
    wangan7eleven: 'odaiba7eleven',
    wanganDocks: 'odaibaGundamPlaza',
    wanganBayside: 'odaibaGundamPlaza',
    wanganBridge: 'odaibaMiraikan',
  };
  const districtAliases = {
    WANGAN: 'ODAIBA',
  };
  const normalisedLocation = locationAliases[input.meetLocation]
    || input.meetLocation
    || base.meetLocation;
  const normalisedDistrict = districtAliases[input.district]
    || input.district
    || (String(normalisedLocation).startsWith('odaiba') ? 'ODAIBA' : base.district);
  const owned = Array.isArray(input.ownedCarIds)
    ? [...new Set(input.ownedCarIds)]
    : [...base.ownedCarIds];

  const selectedCarId = owned.includes(input.selectedCarId)
    ? input.selectedCarId
    : owned[0] || null;

  const garageTier = inferWorkshopTier(owned.length, input.garageTier);
  const requestedWorkshop = getWorkshopByLocationId(input.workshopLocationId);
  const workshopLocationId = requestedWorkshop.tier <= garageTier
    ? requestedWorkshop.id
    : WORKSHOP_TIERS[garageTier].id;
  const carGarageLocations = normaliseCarGarageLocations(
    owned,
    input.carGarageLocations || {},
    garageTier
  );
  const devName =
    String(input.firstName || '').trim().toLowerCase() === 'arkon' &&
    String(input.lastName || '').trim().toLowerCase() === 'den';
  const devMode = Boolean(input.devMode || devName);
  const rawCash = Number.isFinite(input.cash) ? input.cash : base.cash;
  const normalisedCash = devName && !input.devMode
    ? Math.max(rawCash, 1000000000)
    : rawCash;

  return {
    ...base,
    ...input,
    district: normalisedDistrict,
    meetLocation: normalisedLocation,
    garageTier,
    workshopLocationId,
    carGarageLocations,
    selectedCarId,
    ownedCarIds: owned,
    carStates: {
      ...base.carStates,
      ...(input.carStates || {}),
    },
    wins: Number.isFinite(input.wins) ? input.wins : base.wins,
    losses: Number.isFinite(input.losses) ? input.losses : base.losses,
    cash: normalisedCash,
    devMode,
    meetRosters: input.meetRosters && typeof input.meetRosters === 'object'
      ? input.meetRosters
      : {},
    meetRefreshAt: Number.isFinite(input.meetRefreshAt) ? input.meetRefreshAt : 0,
    defeatedRivalKeys: Array.isArray(input.defeatedRivalKeys)
      ? [...new Set(input.defeatedRivalKeys)]
      : [],
    meetStranded: Boolean(input.meetStranded && owned.length > 0),
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
    version: 3,
    firstName: registry.get('firstName') || '',
    lastName: registry.get('lastName') || '',
    playerCharacterId: registry.get('playerCharacterId') || 'renMizuno',
    selectedCarId: registry.get('selectedCarId') || null,
    ownedCarIds: registry.get('ownedCarIds') || [],
    carStates: registry.get('carStates') || {},
    wins: registry.get('wins') ?? 0,
    losses: registry.get('losses') ?? 0,
    cash: registry.get('cash') ?? 50000,
    devMode: Boolean(registry.get('devMode')),
    district: registry.get('district') || 'ODAIBA',
    meetLocation: registry.get('meetLocation') || 'odaiba7eleven',
    garageTier: Number(registry.get('garageTier') || 0),
    workshopLocationId: registry.get('workshopLocationId') || 'shinonomeWorkshop',
    carGarageLocations: registry.get('carGarageLocations') || {},
    meetRosters: registry.get('meetRosters') || {},
    meetRefreshAt: Number(registry.get('meetRefreshAt') || 0),
    defeatedRivalKeys: registry.get('defeatedRivalKeys') || [],
    meetStranded: Boolean(registry.get('meetStranded')),
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


export function saveIdentityState(registry) {
  const devName =
    String(registry.get('firstName') || '').trim().toLowerCase() === 'arkon' &&
    String(registry.get('lastName') || '').trim().toLowerCase() === 'den';

  if (devName && !registry.get('devMode')) {
    registry.set('devMode', true);
    registry.set('cash', 1000000000);
  }

  const state = saveSessionState(registry);
  const manual = readManualSave();

  if (manual) {
    writeJson(SAVE_KEY, {
      ...manual,
      firstName: state.firstName,
      lastName: state.lastName,
    });
  }

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
