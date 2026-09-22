import { playableCharacterOrder, rivalCharacterOrder } from '../data/characters.js?v=20260922-r111';
import {
  WORKSHOP_TIERS,
  getWorkshopByLocationId,
  inferWorkshopTier,
  normaliseCarGarageLocations,
} from '../data/workshopProgression.js?v=20260922-r86';

export const SAVE_KEY = 'tokyoShiftSaveState';
export const SESSION_KEY = 'tokyoShiftProfile';
export const PROFILE_STORE_KEY = 'tokyoShiftProfilesV1';
export const ACTIVE_PROFILE_KEY = 'tokyoShiftActiveProfile';
export const MAX_PROFILES = 3;

export function createDefaultGameState() {
  return {
    version: 5,
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
    specialChallenger: null,
    challengerMisses: 0,
    challengerCooldown: 0,
    competitionOffers: {},
    competitionState: null,
    competitionCooldownUntil: 0,
    centralTokyoLocation: 'tokyoAutoMarket',
    tokyoInvitesSeen: {
      autoMarket: false,
      ginza: false,
      drag: false,
    },
    raceReturnScene: 'MeetScene',
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

function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

function emptyProfileStore() {
  return {
    version: 1,
    slots: Array(MAX_PROFILES).fill(null),
  };
}

function normaliseSlot(slot) {
  if (!slot || typeof slot !== 'object') return null;
  const manual = slot.manual && typeof slot.manual === 'object' ? slot.manual : null;
  const session = slot.session && typeof slot.session === 'object' ? slot.session : null;
  if (!manual && !session) return null;

  return {
    manual,
    session,
    createdAt: slot.createdAt || manual?.savedAt || session?.savedAt || new Date().toISOString(),
    updatedAt: slot.updatedAt || manual?.savedAt || session?.savedAt || new Date().toISOString(),
  };
}

function ensureProfileStore() {
  const existing = readJson(PROFILE_STORE_KEY);
  if (existing?.slots && Array.isArray(existing.slots)) {
    const slots = Array.from({ length: MAX_PROFILES }, (_, index) =>
      normaliseSlot(existing.slots[index])
    );
    const store = { version: 1, slots };
    writeJson(PROFILE_STORE_KEY, store);
    return store;
  }

  // One-time migration from the original single-profile save format.
  const legacyManual = readJson(SAVE_KEY);
  const legacySession = readJson(SESSION_KEY);
  const store = emptyProfileStore();

  if (legacyManual || legacySession) {
    store.slots[0] = {
      manual: legacyManual || null,
      session: legacySession || legacyManual || null,
      createdAt: legacyManual?.savedAt || legacySession?.savedAt || new Date().toISOString(),
      updatedAt: legacyManual?.savedAt || legacySession?.savedAt || new Date().toISOString(),
    };
    writeJson(ACTIVE_PROFILE_KEY, 0);
  }

  writeJson(PROFILE_STORE_KEY, store);
  return store;
}

function writeProfileStore(store) {
  const safe = {
    version: 1,
    slots: Array.from({ length: MAX_PROFILES }, (_, index) =>
      normaliseSlot(store?.slots?.[index])
    ),
  };
  writeJson(PROFILE_STORE_KEY, safe);
  return safe;
}

export function getActiveProfileIndex() {
  const raw = Number(readJson(ACTIVE_PROFILE_KEY));
  if (Number.isInteger(raw) && raw >= 0 && raw < MAX_PROFILES) return raw;
  writeJson(ACTIVE_PROFILE_KEY, 0);
  return 0;
}

function mirrorActiveProfile(slot) {
  const manual = slot?.manual || null;
  const session = slot?.session || manual || null;

  if (manual) writeJson(SAVE_KEY, manual);
  else removeKey(SAVE_KEY);

  if (session) writeJson(SESSION_KEY, session);
  else removeKey(SESSION_KEY);
}

export function setActiveProfileIndex(index) {
  const slotIndex = Math.max(0, Math.min(MAX_PROFILES - 1, Number(index) || 0));
  writeJson(ACTIVE_PROFILE_KEY, slotIndex);
  const store = ensureProfileStore();
  mirrorActiveProfile(store.slots[slotIndex]);
  return slotIndex;
}

export function getProfileSlots() {
  const store = ensureProfileStore();
  const activeIndex = getActiveProfileIndex();

  return store.slots.map((slot, index) => {
    const state = slot?.session || slot?.manual || null;
    return {
      index,
      occupied: Boolean(state),
      active: index === activeIndex,
      firstName: String(state?.firstName || ''),
      lastName: String(state?.lastName || ''),
      playerCharacterId: state?.playerCharacterId || null,
      cash: Number(state?.cash || 0),
      carCount: Array.isArray(state?.ownedCarIds) ? state.ownedCarIds.length : 0,
      wins: Number(state?.wins || 0),
      losses: Number(state?.losses || 0),
      updatedAt: slot?.updatedAt || null,
    };
  });
}

export function beginNewProfile(index) {
  const slotIndex = setActiveProfileIndex(index);
  const store = ensureProfileStore();
  store.slots[slotIndex] = null;
  writeProfileStore(store);
  mirrorActiveProfile(null);
  return slotIndex;
}

export function deleteProfileSlot(index) {
  const slotIndex = Math.max(0, Math.min(MAX_PROFILES - 1, Number(index) || 0));
  const store = ensureProfileStore();
  store.slots[slotIndex] = null;
  writeProfileStore(store);

  if (slotIndex === getActiveProfileIndex()) {
    mirrorActiveProfile(null);
  }

  return getProfileSlots();
}

export function getProfileState(index, preferSession = true) {
  const slotIndex = Math.max(0, Math.min(MAX_PROFILES - 1, Number(index) || 0));
  const slot = ensureProfileStore().slots[slotIndex];
  if (!slot) return null;
  return preferSession
    ? (slot.session || slot.manual || null)
    : (slot.manual || slot.session || null);
}

export function activateProfile(registry, index, preferSession = true) {
  const slotIndex = setActiveProfileIndex(index);
  const state = getProfileState(slotIndex, preferSession);
  if (!state) return null;
  return applyStateToRegistry(registry, state);
}

export function readManualSave() {
  const slot = ensureProfileStore().slots[getActiveProfileIndex()];
  return slot?.manual || null;
}

export function readSessionState() {
  const slot = ensureProfileStore().slots[getActiveProfileIndex()];
  return slot?.session || slot?.manual || null;
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

  const playerCharacterId = playableCharacterOrder.includes(input.playerCharacterId)
    ? input.playerCharacterId
    : base.playerCharacterId;

  const meetRosters = input.meetRosters && typeof input.meetRosters === 'object'
    ? Object.fromEntries(
        Object.entries(input.meetRosters).map(([locationId, offers]) => [
          locationId,
          Array.isArray(offers)
            ? offers.filter(offer => rivalCharacterOrder.includes(offer?.characterId))
            : [],
        ])
      )
    : {};

  const specialChallenger =
    input.specialChallenger &&
    typeof input.specialChallenger === 'object' &&
    rivalCharacterOrder.includes(input.specialChallenger.characterId)
      ? input.specialChallenger
      : null;

  return {
    ...base,
    ...input,
    version: 4,
    district: normalisedDistrict,
    meetLocation: normalisedLocation,
    garageTier,
    workshopLocationId,
    carGarageLocations,
    playerCharacterId,
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
    meetRosters,
    meetRefreshAt: Number.isFinite(input.meetRefreshAt) ? input.meetRefreshAt : 0,
    defeatedRivalKeys: Array.isArray(input.defeatedRivalKeys)
      ? [...new Set(input.defeatedRivalKeys)]
      : [],
    specialChallenger,
    challengerMisses: Math.max(0, Number(input.challengerMisses || 0)),
    challengerCooldown: Math.max(0, Number(input.challengerCooldown || 0)),
    competitionOffers: input.competitionOffers && typeof input.competitionOffers === 'object'
      ? input.competitionOffers
      : {},
    competitionState: input.competitionState && typeof input.competitionState === 'object'
      ? input.competitionState
      : null,
    competitionCooldownUntil: Math.max(0, Number(input.competitionCooldownUntil || 0)),
    centralTokyoLocation: String(input.centralTokyoLocation || base.centralTokyoLocation),
    tokyoInvitesSeen: {
      ...base.tokyoInvitesSeen,
      ...(input.tokyoInvitesSeen || {}),
    },
    raceReturnScene: String(input.raceReturnScene || 'MeetScene'),
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
    version: 5,
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
    specialChallenger: registry.get('specialChallenger') || null,
    challengerMisses: Number(registry.get('challengerMisses') || 0),
    challengerCooldown: Number(registry.get('challengerCooldown') || 0),
    competitionOffers: registry.get('competitionOffers') || {},
    competitionState: registry.get('competitionState') || null,
    competitionCooldownUntil: Number(registry.get('competitionCooldownUntil') || 0),
    centralTokyoLocation: registry.get('centralTokyoLocation') || 'tokyoAutoMarket',
    tokyoInvitesSeen: registry.get('tokyoInvitesSeen') || {},
    raceReturnScene: registry.get('raceReturnScene') || 'MeetScene',
    meetStranded: Boolean(registry.get('meetStranded')),
    gameOver: registry.get('gameOver') || false,
  });
}

function writeActiveSlot(update) {
  const activeIndex = getActiveProfileIndex();
  const store = ensureProfileStore();
  const existing = store.slots[activeIndex] || {
    manual: null,
    session: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.slots[activeIndex] = {
    ...existing,
    ...update,
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeProfileStore(store);
  mirrorActiveProfile(store.slots[activeIndex]);
  return store.slots[activeIndex];
}

export function saveSessionState(registry) {
  const state = snapshotRegistry(registry);
  writeActiveSlot({ session: state });
  return state;
}

export function saveManualState(registry) {
  const state = {
    ...snapshotRegistry(registry),
    savedAt: new Date().toISOString(),
  };
  writeActiveSlot({ manual: state, session: state });
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

  return saveSessionState(registry);
}

export function restoreManualSave(registry) {
  const saved = readManualSave();
  if (!saved) return null;
  const state = applyStateToRegistry(registry, saved);
  writeActiveSlot({ session: state });
  return state;
}

// Kept for existing game-over/new-run callers. In multi-profile mode this now
// clears only the active character slot, never the other two profiles.
export function clearAllSaves() {
  const activeIndex = getActiveProfileIndex();
  const store = ensureProfileStore();
  store.slots[activeIndex] = null;
  writeProfileStore(store);
  mirrorActiveProfile(null);
}
