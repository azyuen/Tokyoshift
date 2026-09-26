import { playableCharacterOrder, rivalCharacterOrder } from '../data/characters.js?v=20260926-r213';
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

export const STARTER_CAR_IDS = ['ae86', 'ek9'];

export function normaliseStarterCarId(value = 'ae86') {
  return STARTER_CAR_IDS.includes(String(value || '')) ? String(value) : 'ae86';
}

export function createStarterCarState() {
  return {
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
    drivetrainTuning: {},
    exhaustNosTuning: {},
    acquiredVia: 'starter',
  };
}

export function createDefaultGameState(options = {}) {
  const starterCarId = normaliseStarterCarId(options?.starterCarId);

  return {
    version: 9,
    firstName: '',
    lastName: '',
    playerCharacterId: 'renMizuno',
    starterCarId,
    selectedCarId: starterCarId,
    ownedCarIds: [starterCarId],
    carStates: {
      [starterCarId]: createStarterCarState(),
    },
    carHistory: [],
    wins: 0,
    losses: 0,
    cash: 50000,
    devMode: false,
    cutscenesSeen: [],
    regionWins: {},
    tunerShopProgress: {},
    tunerTeamChallenges: {},
    tunerChallengeRevealPending: null,
    tunerDecalsUnlocked: [],
    tunerDecalPlacements: {},
    district: 'ODAIBA',
    meetLocation: 'odaiba7eleven',
    garageTier: 0,
    workshopLocationId: 'shinonomeWorkshop',
    carGarageLocations: {
      [starterCarId]: 'shinonomeWorkshop',
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
    carCoupons: {},
    centralTokyoLocation: 'tokyoAutoMarket',
    centralTokyoUnlocks: {
      autoMarket: false,
      ginza: false,
      drag: false,
    },
    tokyoInvitesSeen: {
      autoMarket: false,
      ginza: false,
      drag: false,
    },
    introTutorialChoiceDone: false,
    raceReturnScene: 'MeetScene',
    selectedRaceMeetOffer: null,
    meetStranded: false,
    gameOver: false,
  };
}

export function createFreshRunStateFromRegistry(registry) {
  const starterCarId = normaliseStarterCarId(registry?.get?.('starterCarId'));
  const state = createDefaultGameState({ starterCarId });

  state.firstName = String(registry?.get?.('firstName') || '');
  state.lastName = String(registry?.get?.('lastName') || '');
  state.playerCharacterId = registry?.get?.('playerCharacterId') || state.playerCharacterId;
  state.devMode = Boolean(registry?.get?.('devMode'));

  // Restart Night is a fresh progression run, not a forced replay of onboarding.
  const previousSeen = Array.isArray(registry?.get?.('cutscenesSeen'))
    ? registry.get('cutscenesSeen')
    : [];
  const onboardingIds = ['openingDaichiStory', 'openingRaceRules', 'openingWorkshopGuide'];
  state.cutscenesSeen = previousSeen.filter(id => onboardingIds.includes(String(id)));
  state.introTutorialChoiceDone = Boolean(
    registry?.get?.('introTutorialChoiceDone') || state.cutscenesSeen.length
  );

  if (state.devMode) state.cash = 1000000000;

  return state;
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
      selectedCarId: state?.selectedCarId || null,
      district: String(state?.district || 'ODAIBA'),
      garageTier: Math.max(0, Number(state?.garageTier || 0)),
      championCount: Object.values(state?.tunerTeamChallenges || {})
        .filter(item => Boolean(item?.championEarned || item?.completed)).length,
      perfectCount: Object.values(state?.tunerTeamChallenges || {})
        .filter(item => Boolean(
          item?.perfectEarned ||
          (
            item?.completed &&
            item?.perfectEligible !== false &&
            item?.perfectRewardClaimed == null
          )
        )).length,
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

function clonePlain(value, fallback = {}) {
  try {
    return JSON.parse(JSON.stringify(value ?? fallback));
  } catch (e) {
    return JSON.parse(JSON.stringify(fallback));
  }
}

function normaliseCarHistory(input = [], ownedCarIds = [], carStates = {}) {
  const history = Array.isArray(input)
    ? input
        .filter(entry => entry && typeof entry === 'object' && entry.carId)
        .map((entry, index) => ({
          id: String(entry.id || (entry.carId + ':' + Number(entry.acquiredAt || 0) + ':' + index)),
          carId: String(entry.carId),
          acquiredAt: Math.max(0, Number(entry.acquiredAt || 0)),
          acquiredVia: String(entry.acquiredVia || 'legacy'),
          status: String(entry.status || 'OWNED').toUpperCase(),
          departedAt: Math.max(0, Number(entry.departedAt || 0)),
          departureReason: entry.departureReason ? String(entry.departureReason) : null,
          salePrice: Math.max(0, Number(entry.salePrice || 0)),
          convertedTo: entry.convertedTo ? String(entry.convertedTo) : null,
          lastState: entry.lastState && typeof entry.lastState === 'object'
            ? clonePlain(entry.lastState)
            : null,
        }))
    : [];

  const owned = new Set((ownedCarIds || []).map(String));
  const now = Date.now();

  // Repair stale "OWNED" entries first. This should only matter for old saves
  // created before the history ledger existed or a build interrupted mid-write.
  history.forEach(entry => {
    if (entry.status === 'OWNED' && !owned.has(entry.carId)) {
      entry.status = 'ARCHIVED';
      entry.departedAt = entry.departedAt || now;
      entry.departureReason = entry.departureReason || 'legacy';
      entry.lastState = entry.lastState || clonePlain(carStates?.[entry.carId] || {});
    }
  });

  // Existing profiles pre-date Car History. Seed every car currently in the
  // garage exactly once so the ledger becomes useful without resetting saves.
  (ownedCarIds || []).forEach((carId, index) => {
    const id = String(carId);
    const alreadyTracked = history.some(entry =>
      entry.carId === id && entry.status === 'OWNED'
    );
    if (alreadyTracked) return;

    const state = carStates?.[id] || {};
    history.push({
      id: id + ':legacy:' + (now + index),
      carId: id,
      acquiredAt: now + index,
      acquiredVia: String(state.acquiredVia || 'legacy'),
      status: 'OWNED',
      departedAt: 0,
      departureReason: null,
      salePrice: 0,
      convertedTo: null,
      lastState: null,
    });
  });

  return history;
}

export function recordCarAcquisition(registry, carId, metadata = {}) {
  if (!registry || !carId) return null;

  const id = String(carId);
  const owned = registry.get('ownedCarIds') || [];
  const carStates = registry.get('carStates') || {};
  const history = normaliseCarHistory(
    registry.get('carHistory') || [],
    owned,
    carStates
  );

  const existing = [...history].reverse().find(entry =>
    entry.carId === id && entry.status === 'OWNED'
  );
  if (existing) return existing;

  const acquiredAt = Math.max(1, Number(metadata.acquiredAt || Date.now()));
  const entry = {
    id: id + ':' + acquiredAt + ':' + history.length,
    carId: id,
    acquiredAt,
    acquiredVia: String(
      metadata.acquiredVia ||
      carStates?.[id]?.acquiredVia ||
      'garage'
    ),
    status: 'OWNED',
    departedAt: 0,
    departureReason: null,
    salePrice: 0,
    convertedTo: null,
    lastState: null,
  };

  history.push(entry);
  registry.set('carHistory', history);
  return entry;
}

export function recordCarDeparture(registry, carId, reason = 'archived', metadata = {}) {
  if (!registry || !carId) return null;

  const id = String(carId);
  const owned = registry.get('ownedCarIds') || [];
  const carStates = registry.get('carStates') || {};
  const history = normaliseCarHistory(
    registry.get('carHistory') || [],
    owned,
    carStates
  );

  let entryIndex = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].carId === id && history[i].status === 'OWNED') {
      entryIndex = i;
      break;
    }
  }

  if (entryIndex < 0) {
    history.push({
      id: id + ':legacy:' + Date.now() + ':' + history.length,
      carId: id,
      acquiredAt: Date.now(),
      acquiredVia: String(carStates?.[id]?.acquiredVia || 'legacy'),
      status: 'OWNED',
      departedAt: 0,
      departureReason: null,
      salePrice: 0,
      convertedTo: null,
      lastState: null,
    });
    entryIndex = history.length - 1;
  }

  const status = String(reason || 'archived').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  history[entryIndex] = {
    ...history[entryIndex],
    status,
    departedAt: Math.max(1, Number(metadata.departedAt || Date.now())),
    departureReason: String(reason || 'archived'),
    salePrice: Math.max(0, Number(metadata.salePrice || 0)),
    convertedTo: metadata.convertedTo ? String(metadata.convertedTo) : null,
    lastState: clonePlain(carStates?.[id] || {}),
  };

  registry.set('carHistory', history);
  return history[entryIndex];
}

export function normaliseState(input = {}) {
  const requestedStarterCarId =
    input.starterCarId ||
    Object.entries(input.carStates || {}).find(
      ([carId, carState]) =>
        STARTER_CAR_IDS.includes(carId) && carState?.acquiredVia === 'starter'
    )?.[0] ||
    'ae86';
  const base = createDefaultGameState({ starterCarId: requestedStarterCarId });
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

  const starterCarId = base.starterCarId;

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
  const joinedDevName = (
    String(input.firstName || '').trim().toLowerCase() +
    String(input.lastName || '').trim().toLowerCase()
  ).replace(/[^a-z0-9]/g, '');
  const rawCash = Number.isFinite(input.cash) ? input.cash : base.cash;
  const devName = joinedDevName.includes('arkonden');
  const legacyDevCash = rawCash >= 900000000;
  const devMode = Boolean(input.devMode || devName || legacyDevCash);
  const normalisedCash = devName && !input.devMode
    ? Math.max(rawCash, 1000000000)
    : rawCash;

  const playerCharacterId = playableCharacterOrder.includes(input.playerCharacterId)
    ? input.playerCharacterId
    : base.playerCharacterId;

  const mergedCarStates = {
    ...base.carStates,
    ...(input.carStates || {}),
  };
  const carHistory = normaliseCarHistory(
    input.carHistory || [],
    owned,
    mergedCarStates
  );

  // We can prove an old profile owned its starter even if that car was sold or
  // lost before the ledger existed. The exact old sale build cannot be
  // reconstructed, so mark it clearly as a pre-history archive rather than
  // inventing a sale price or tuned specification.
  if (
    !owned.includes(starterCarId) &&
    !carHistory.some(entry => entry.carId === starterCarId)
  ) {
    carHistory.unshift({
      id: starterCarId + ':pre-history',
      carId: starterCarId,
      acquiredAt: 0,
      acquiredVia: 'starter',
      status: 'LEGACY_ARCHIVED',
      departedAt: 0,
      departureReason: 'pre-history',
      salePrice: 0,
      convertedTo: null,
      lastState: clonePlain(mergedCarStates?.[starterCarId] || {}),
    });
  }

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
    version: 9,
    district: normalisedDistrict,
    meetLocation: normalisedLocation,
    garageTier,
    workshopLocationId,
    carGarageLocations,
    playerCharacterId,
    starterCarId,
    selectedCarId,
    ownedCarIds: owned,
    carStates: mergedCarStates,
    carHistory,
    wins: Number.isFinite(input.wins) ? input.wins : base.wins,
    losses: Number.isFinite(input.losses) ? input.losses : base.losses,
    cash: normalisedCash,
    devMode,
    cutscenesSeen: Array.isArray(input.cutscenesSeen)
      ? [...new Set(input.cutscenesSeen.map(String).filter(Boolean))]
      : [],
    regionWins: input.regionWins && typeof input.regionWins === 'object'
      ? Object.fromEntries(
          Object.entries(input.regionWins).map(([regionId, value]) => [
            String(regionId).toUpperCase(),
            Math.max(0, Number(value || 0)),
          ])
        )
      : {},
    tunerShopProgress:
      input.tunerShopProgress && typeof input.tunerShopProgress === 'object'
        ? input.tunerShopProgress
        : {},
    tunerTeamChallenges:
      input.tunerTeamChallenges && typeof input.tunerTeamChallenges === 'object'
        ? input.tunerTeamChallenges
        : {},
    tunerChallengeRevealPending:
      input.tunerChallengeRevealPending
        ? String(input.tunerChallengeRevealPending).toUpperCase()
        : null,
    tunerDecalsUnlocked: Array.isArray(input.tunerDecalsUnlocked)
      ? [...new Set(input.tunerDecalsUnlocked.map(String).filter(Boolean))]
      : [],
    tunerDecalPlacements:
      input.tunerDecalPlacements && typeof input.tunerDecalPlacements === 'object'
        ? input.tunerDecalPlacements
        : {},
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
    carCoupons:
      input.carCoupons && typeof input.carCoupons === 'object'
        ? Object.fromEntries(
            Object.entries(input.carCoupons)
              .map(([carId, count]) => [String(carId), Math.max(0, Math.floor(Number(count || 0)))])
              .filter(([, count]) => count > 0)
          )
        : {},
    centralTokyoLocation: String(input.centralTokyoLocation || base.centralTokyoLocation),
    centralTokyoUnlocks: {
      ...base.centralTokyoUnlocks,
      // R203 and earlier used "invite seen" as de-facto access. Preserve that
      // access during migration so existing profiles are never re-locked.
      ...(input.tokyoInvitesSeen || {}),
      ...(input.centralTokyoUnlocks || {}),
    },
    tokyoInvitesSeen: {
      ...base.tokyoInvitesSeen,
      ...(input.tokyoInvitesSeen || {}),
    },
    introTutorialChoiceDone: Boolean(input.introTutorialChoiceDone),
    raceReturnScene: String(input.raceReturnScene || 'MeetScene'),
    selectedRaceMeetOffer: input.selectedRaceMeetOffer && typeof input.selectedRaceMeetOffer === 'object'
      ? input.selectedRaceMeetOffer
      : null,
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
    version: 9,
    firstName: registry.get('firstName') || '',
    lastName: registry.get('lastName') || '',
    playerCharacterId: registry.get('playerCharacterId') || 'renMizuno',
    starterCarId: normaliseStarterCarId(registry.get('starterCarId')),
    selectedCarId: registry.get('selectedCarId') || null,
    ownedCarIds: registry.get('ownedCarIds') || [],
    carStates: registry.get('carStates') || {},
    carHistory: registry.get('carHistory') || [],
    wins: registry.get('wins') ?? 0,
    losses: registry.get('losses') ?? 0,
    cash: registry.get('cash') ?? 50000,
    devMode: Boolean(registry.get('devMode')),
    cutscenesSeen: registry.get('cutscenesSeen') || [],
    regionWins: registry.get('regionWins') || {},
    tunerShopProgress: registry.get('tunerShopProgress') || {},
    tunerTeamChallenges: registry.get('tunerTeamChallenges') || {},
    tunerChallengeRevealPending: registry.get('tunerChallengeRevealPending') || null,
    tunerDecalsUnlocked: registry.get('tunerDecalsUnlocked') || [],
    tunerDecalPlacements: registry.get('tunerDecalPlacements') || {},
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
    carCoupons: registry.get('carCoupons') || {},
    centralTokyoLocation: registry.get('centralTokyoLocation') || 'tokyoAutoMarket',
    centralTokyoUnlocks: registry.get('centralTokyoUnlocks') || {},
    tokyoInvitesSeen: registry.get('tokyoInvitesSeen') || {},
    introTutorialChoiceDone: Boolean(registry.get('introTutorialChoiceDone')),
    raceReturnScene: registry.get('raceReturnScene') || 'MeetScene',
    selectedRaceMeetOffer: registry.get('selectedRaceMeetOffer') || null,
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
  const devName = (
    String(registry.get('firstName') || '').trim().toLowerCase() +
    String(registry.get('lastName') || '').trim().toLowerCase()
  ).replace(/[^a-z0-9]/g, '') === 'arkonden';

  if (devName && !registry.get('devMode')) {
    registry.set('devMode', true);
    registry.set('cash', Math.max(1000000000, Number(registry.get('cash') || 0)));
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
