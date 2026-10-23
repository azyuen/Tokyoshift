import { playableCharacterOrder, rivalCharacterOrder } from '../data/characters.js?v=20261010-r459';
import { createDefaultProCircuitState, normaliseProCircuitState } from '../data/proCircuit.js?v=20261017-r575';
import {
  WORKSHOP_TIERS,
  getWorkshopByLocationId,
  inferWorkshopTier,
  normaliseCarGarageLocations, getArkonStoryWorkshopTier,
} from '../data/workshopProgression.js?v=20261023-r662';
import { normalisePlayerDifficulty } from '../data/playerDifficulty.js?v=20260929-r271';
import { getEasyCouponMilestoneForWins } from '../data/careerProgression.js?v=20260929-r272';
import { registerOwnedCarInstances } from '../data/carOwnership.js?v=20261011-r479';
import { migrateRetiredEvoIX, migrateRetiredEJ1 } from '../data/carRetirement.js?v=20261014-r503';
import { migrateCanonicalCarModels } from '../data/canonicalCarMigration.js?v=20261015-r520';
import { getDefaultFactoryPaintColor } from '../data/factoryPaintPalettes.js?v=20261020-r623';

export const SAVE_KEY = 'tokyoShiftSaveState';
export const SESSION_KEY = 'tokyoShiftProfile';
export const PROFILE_STORE_KEY = 'tokyoShiftProfilesV1';
export const PROFILE_STORE_BACKUP_KEY = 'tokyoShiftProfilesV1Backup';
export const ACTIVE_PROFILE_KEY = 'tokyoShiftActiveProfile';
export const MAX_PROFILES = 3;
export const ARKON_STORY_MODE = 'arkonStory';
// Completely separate storage namespace: normal career slots keep their legacy shape.
const ARKON_STORY_SAVE_PREFIX = 'tokyoShiftArkonStorySaveV1:';
const ARKON_STORY_MODE_PREFIX = 'tokyoShiftArkonStorySelectedV1:';
const storySaveKey = slot => ARKON_STORY_SAVE_PREFIX + slot;
const storyModeKey = slot => ARKON_STORY_MODE_PREFIX + slot;

const isArkonProfile = state => (String(state?.firstName || '') + String(state?.lastName || ''))
  .toLowerCase().replace(/[^a-z0-9]/g, '') === 'arkonden';
const isArkonStory = state => state?.gameMode === ARKON_STORY_MODE && isArkonProfile(state);

const REMOVED_CAR_IDS = new Set(['gr86']);

const ARKON_DEV_CHAMPIONSHIP_REGIONS = Object.freeze([
  'ODAIBA',
  'SHINAGAWA',
  'TATSUMI',
  'SHIBUYA',
  'YOKOHAMA',
  'DAIKOKU',
  'SHINJUKU',
]);

export const STARTER_CAR_IDS = ['ae86', 'ef'];

// Existing profiles may legitimately have started with the old EK9 option.
// Keep it save-compatible without exposing it as a starter for new games.
const SAVE_COMPATIBLE_STARTER_CAR_IDS = ['ae86', 'ef', 'ek9', '240z'];

export function normaliseStarterCarId(value = 'ae86') {
  const id = String(value || '');
  return SAVE_COMPATIBLE_STARTER_CAR_IDS.includes(id) ? id : 'ae86';
}

export function createStarterCarState(carId = 'ae86') {
  return {
    stock: true,
    paintColor: getDefaultFactoryPaintColor(carId),
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
    gameMode: 'career',
    arkonStoryChapter: 0,
    arkonStoryChoices: {},
    arkonStoryFirstChoice: null,
    arkonStoryFirstReply: null,
    arkonStoryChapter01Done: false,
    arkonStoryChapter01AfterHoursDone: false,
    arkonStoryChapter01FullDone: false,
    arkonStoryChapter01RevisedDone: false,
    arkonStoryChapter02Done: false,
    arkonStoryChapter02FishPaid: false,
    arkonStoryChapter02RivalResult: null,
    arkonStoryCruiseComplete: false,
    arkonStoryChapter03Done: false,
    arkonStoryChapter04Done: false,
    arkonStoryChapter05Done: false,
    arkonStoryChapter06Done: false,
    arkonStoryChapter07Done: false,
    arkonStoryChapter07Work: null,
    arkonStoryChapter07Race: null,
    arkonStoryChapter07RaceResult: null,
    arkonStoryChapter07Solo: null,
    arkonStoryChapter07SoloFinished: false,
    arkonStoryChapter06Accounts: null,
    arkonStoryChapter06Cruise: null,
    arkonStoryChapter06CruiseFinished: false,
    arkonStoryChapter05JobsDone: 0,
    arkonStoryChapter05Loan: null,
    arkonStoryChapter05RaceResult: null,
    arkonStoryChapter05Results: {}, 
    arkonStoryCanalYardUnlocked: false,
    arkonStoryWarehouseUnlocked: false,
    arkonStoryRwbProject: null,
    arkonStoryChapter04Work: null,
    arkonStoryCustomerJobsDone: 0,
    arkonStoryMx5CustomerTuning: null,
    arkonStoryChapter03Seed: 0,
    arkonStoryMx5RaceResult: null,
    arkonStoryMx5Loan: null,
    arkonStoryPhase: 'opening',
    arkonStoryTimeOfDay: 'night',
    arkonStorySayakaNoticed: false,
    arkonStoryRivalResult: null,
    arkonStoryAtSchool: false,
    arkonStorySchoolRevealed: false,
    arkonStoryLessonCompleted: false,
    arkonStoryLessonCredits: 0,
    arkonStoryCreditsAwarded: false,
    arkonStoryGinzaUnlocked: false,
    starterCarId,
    openingChapter: null, // New profiles begin carless at the station; null is the legacy/restart path.
    selectedCarId: starterCarId,
    preferredCarId: starterCarId,
    ownedCarIds: [starterCarId],
    carStates: {
      [starterCarId]: createStarterCarState(starterCarId),
    },
    carHistory: [],
    carMagazineSightings: {},
    wins: 0,
    losses: 0,
    playTimeMs: 0,
    pinkSlipLastRequestRace: -999,
    pinkSlipLastWinRace: 0,
    pinkSlipOpportunityRace: -1,
    pinkSlipOpportunityGranted: false,
    pinkSlipOpportunityUsed: false,
    incomingPinkSlipLastOfferRace: -999,
    cash: 5000,
    ethanYuenCompensationR638: false,
    ethanYuenCompensationDialoguePending: false,
    playerDifficulty: 'STANDARD',
    devMode: false,
    cutscenesSeen: [],
    storyDirectorProgress: null,
    regionWins: {},
    tunerShopProgress: {},
    tunerTeamChallenges: {},
    tunerChallengeRevealPending: null,
    crewMembers: {},
    crewRecruitmentState: {},
    crewInviteInterest: null,
    crewInviteInterests: {},
    crewRecruitChallenge: null,
    crewRecruitChallenges: {},
    crewPendingRecruit: null,
    crewPendingJoinDecision: null,
    crewBattleProgress: {},
    crewBattleLineups: {},
    crewBattleIntroVisits: {},
    crewBattleState: null,
    crewSpaceActive: false,
    crewPreviousCarId: null,
    tokyoChampionshipInvited: false,
    ginzaVaultInvited: false,
    ginzaVaultOwnerWelcomed: false,
    ginzaTestDrive: null,
    selectedRacePlayerCharacterId: null,
    tunerDecalsUnlocked: [],
    tunerDecalPlacements: {},
    district: 'ODAIBA',
    meetLocation: 'odaiba7eleven',
    garageTier: 0,
    dynoFacilityTier: 0,
    workshopLocationId: 'shinonomeWorkshop',
    carGarageLocations: {
      [starterCarId]: 'shinonomeWorkshop',
    },
    ownedWheelIds: [],
    autoMarketRoom: 'used',
    autoMarketHaggles: {},
    meetRosters: {},
    meetRaceResults: {},
    meetRefreshAt: 0,
    defeatedRivalKeys: [],
    specialChallenger: null,
    challengerMisses: 0,
    challengerCooldown: 0,
    competitionOffers: {},
    competitionState: null,
    // Independent, versioned professional-circuit standings and future tournament state.
    proCircuit: createDefaultProCircuitState(),
    competitionCooldownUntil: 0,
    competitionWins: 0,
    carCoupons: {},
    easyCouponLastMilestone: 0,
    surpriseRewardState: {
      winsSinceReward: 0,
      total: 0,
      lastAtWin: 0,
    },
    oshiageLocation: 'oshiageDrivingSchool',
    oshiageEliteVenue: 'underpass',
    oshiageEliteCooldowns: {},
    oshiageEliteSeries: null,
    oshiageEliteLastResult: null,
    oshiageInstructorMet: false,
    oshiageBasicLessonComplete: false,
    oshiageLessonTab: 0,
    oshiageTrainingLesson: null,
    oshiageCoachingProgress: {},
    oshiageFreeLessonUsed: {},
    oshiageSchoolBooking: null,
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
    openingDrivingLessonComplete: false,
    raceReturnScene: 'MeetScene',
    selectedRaceMeetOffer: null,
    meetStranded: false,
    gameOver: false,
  };
}

export function createFreshRunStateFromRegistry(registry) {
  const starterCarId = normaliseStarterCarId(registry?.get?.('starterCarId'));
  const state = registry?.get?.('gameMode') === ARKON_STORY_MODE
    ? createArkonStoryState(getActiveProfileIndex())
    : createDefaultGameState({ starterCarId });

  state.firstName = String(registry?.get?.('firstName') || '');
  state.lastName = String(registry?.get?.('lastName') || '');
  state.playerCharacterId = registry?.get?.('playerCharacterId') || state.playerCharacterId;
  state.playerDifficulty = normalisePlayerDifficulty(
    registry?.get?.('playerDifficulty') || state.playerDifficulty
  );
  state.devMode = state.gameMode !== ARKON_STORY_MODE && Boolean(registry?.get?.('devMode'));
  const timerStartedAt = Number(registry?.get?.('__playTimerStartedAt') || Date.now());
  state.playTimeMs =
    Math.max(0, Number(registry?.get?.('playTimeMs') || 0)) +
    Math.max(0, Date.now() - timerStartedAt);

  // Restart Night is a fresh progression run, not a forced replay of onboarding.
  const previousSeen = Array.isArray(registry?.get?.('cutscenesSeen'))
    ? registry.get('cutscenesSeen')
    : [];
  // Preserve completed modern introductions when resetting a progressed run.
  // Legacy Daichi scene IDs are no longer executable story content.
  const onboardingIds = ['openingSayakaKeys', 'openingSayakaFarewell', 'openingDaichiAfterSayaka'];
  state.cutscenesSeen = previousSeen.filter(id => onboardingIds.includes(String(id)));
  state.introTutorialChoiceDone = Boolean(
    registry?.get?.('introTutorialChoiceDone') || state.cutscenesSeen.length
  );

  if (state.devMode) state.cash = 1000000000;
  // Restart Night never resets a profile-level one-time compensation award.
  state.ethanYuenCompensationR638 = Boolean(registry?.get?.('ethanYuenCompensationR638'));
  state.ethanYuenCompensationDialoguePending = Boolean(registry?.get?.('ethanYuenCompensationDialoguePending'));

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

  let manual = slot.manual && typeof slot.manual === 'object' ? slot.manual : null;
  let session = slot.session && typeof slot.session === 'object' ? slot.session : null;

  // Recovery compatibility: some older/interrupted builds can leave a raw
  // profile state directly in a slot. Do not discard it as "empty".
  if (!manual && !session) {
    const looksLikeRawState =
      Array.isArray(slot.ownedCarIds) ||
      slot.carStates ||
      slot.playerCharacterId ||
      slot.firstName ||
      slot.lastName;
    if (looksLikeRawState) {
      manual = slot;
      session = slot;
    }
  }

  if (!manual && !session) return null;

  return {
    manual,
    session,
    createdAt: slot.createdAt || manual?.savedAt || session?.savedAt || new Date().toISOString(),
    updatedAt: slot.updatedAt || manual?.savedAt || session?.savedAt || new Date().toISOString(),
  };
}

function profileStoreHasData(store) {
  return Boolean(
    store?.slots &&
    Array.isArray(store.slots) &&
    store.slots.some(slot => Boolean(normaliseSlot(slot)))
  );
}

function normaliseProfileStore(store) {
  return {
    version: 1,
    slots: Array.from({ length: MAX_PROFILES }, (_, index) =>
      normaliseSlot(store?.slots?.[index])
    ),
  };
}

function getRawActiveProfileIndex() {
  const raw = Number(readJson(ACTIVE_PROFILE_KEY));
  return Number.isInteger(raw) && raw >= 0 && raw < MAX_PROFILES ? raw : 0;
}

function ensureProfileStore() {
  const existing = readJson(PROFILE_STORE_KEY);
  if (existing?.slots && Array.isArray(existing.slots)) {
    const store = normaliseProfileStore(existing);

    if (profileStoreHasData(store)) {
      // Keep an independent rolling rescue copy before any later mutation.
      writeJson(PROFILE_STORE_BACKUP_KEY, store);
      writeJson(PROFILE_STORE_KEY, store);
      return store;
    }

    // An empty-looking store can be the result of an interrupted write or an
    // older slot schema. Prefer a known-good multi-profile rescue copy.
    const backup = readJson(PROFILE_STORE_BACKUP_KEY);
    if (profileStoreHasData(backup)) {
      const recovered = normaliseProfileStore(backup);
      writeJson(PROFILE_STORE_KEY, recovered);
      return recovered;
    }

    // The active profile is also mirrored under the original single-profile
    // keys. If those still exist, recover them instead of showing zero slots.
    const legacyManual = readJson(SAVE_KEY);
    const legacySession = readJson(SESSION_KEY);
    if (legacyManual || legacySession) {
      const recovered = emptyProfileStore();
      const index = getRawActiveProfileIndex();
      recovered.slots[index] = {
        manual: legacyManual || null,
        session: legacySession || legacyManual || null,
        createdAt: legacyManual?.savedAt || legacySession?.savedAt || new Date().toISOString(),
        updatedAt: legacyManual?.savedAt || legacySession?.savedAt || new Date().toISOString(),
      };
      writeJson(PROFILE_STORE_KEY, recovered);
      writeJson(PROFILE_STORE_BACKUP_KEY, recovered);
      return recovered;
    }

    return store;
  }

  // If the primary store is absent/corrupt, first try the independent rescue
  // copy before falling all the way back to the legacy active-profile mirror.
  const backup = readJson(PROFILE_STORE_BACKUP_KEY);
  if (profileStoreHasData(backup)) {
    const recovered = normaliseProfileStore(backup);
    writeJson(PROFILE_STORE_KEY, recovered);
    return recovered;
  }

  // One-time migration from the original single-profile save format.
  const legacyManual = readJson(SAVE_KEY);
  const legacySession = readJson(SESSION_KEY);
  const store = emptyProfileStore();

  if (legacyManual || legacySession) {
    const index = getRawActiveProfileIndex();
    store.slots[index] = {
      manual: legacyManual || null,
      session: legacySession || legacyManual || null,
      createdAt: legacyManual?.savedAt || legacySession?.savedAt || new Date().toISOString(),
      updatedAt: legacyManual?.savedAt || legacySession?.savedAt || new Date().toISOString(),
    };
    writeJson(ACTIVE_PROFILE_KEY, index);
    writeJson(PROFILE_STORE_BACKUP_KEY, store);
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

  // Preserve the last readable multi-profile store before replacing it.
  const current = readJson(PROFILE_STORE_KEY);
  if (profileStoreHasData(current)) {
    writeJson(PROFILE_STORE_BACKUP_KEY, normaliseProfileStore(current));
  }

  writeJson(PROFILE_STORE_KEY, safe);

  // A successful non-empty write becomes the new known-good rescue copy.
  if (profileStoreHasData(safe)) {
    writeJson(PROFILE_STORE_BACKUP_KEY, safe);
  }
  return safe;
}

export function getActiveProfileIndex() {
  const raw = Number(readJson(ACTIVE_PROFILE_KEY));
  if (Number.isInteger(raw) && raw >= 0 && raw < MAX_PROFILES) return raw;
  writeJson(ACTIVE_PROFILE_KEY, 0);
  return 0;
}

function mirrorActiveProfile(slot) {
  // Old mirrors always contain Career. Story never writes to legacy save keys.
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

function readArkonStorySave(index) {
  const value = readJson(storySaveKey(index));
  return isArkonStory(value) ? value : null;
}

function persistArkonStorySave(index, state) {
  if (!isArkonStory(state)) return false;
  const key = storySaveKey(index);
  writeJson(key, state);
  // localStorage silently fails on some mobile devices (quota/private mode).
  return JSON.stringify(readJson(key)) === JSON.stringify(state);
}

export function getProfileGameMode(index = getActiveProfileIndex()) {
  const slotIndex = Math.max(0, Math.min(MAX_PROFILES - 1, Number(index) || 0));
  // Read-only check: saving Arkon's story must NEVER rewrite shared profile data.
  const slot = readJson(PROFILE_STORE_KEY)?.slots?.[slotIndex];
  if (!isArkonProfile(slot?.session || slot?.manual)) return 'career';
  return readJson(storyModeKey(slotIndex)) === ARKON_STORY_MODE
    ? ARKON_STORY_MODE : 'career';
}

export function resetArkonStoryState() {
  const index = getActiveProfileIndex();
  if (getProfileGameMode(index) !== ARKON_STORY_MODE) return false;
  // Reset only Arkon's private Story key: NEVER touch any Career slot.
  return persistArkonStorySave(index, createArkonStoryState(index));
}

export function createArkonStoryState(profileSlot = getActiveProfileIndex()) {
  const state = createDefaultGameState({ starterCarId: '240z' });
  state.firstName = 'Arkon';
  state.lastName = 'Den';
  state.playerCharacterId = 'arkonDen';
  state.gameMode = ARKON_STORY_MODE;
  state.devMode = false;
  state.cash = 5000;
  state.openingChapter = 'done';
  state.arkonStoryChapter = 1;
  state.storyDirectorProgress = {
    id: 'arkonChapter01Revised', index: 0, ownerSlot: profileSlot, version: 1,
  };
  return normaliseState(state);
}

export function setProfileGameMode(index, requestedMode) {
  const slotIndex = Math.max(0, Math.min(MAX_PROFILES - 1, Number(index) || 0));
  const slot = ensureProfileStore().slots[slotIndex];
  const career = slot?.session || slot?.manual;
  if (!isArkonProfile(career)) return false;
  const isStory = requestedMode === ARKON_STORY_MODE;
  if (isStory && !readArkonStorySave(slotIndex) &&
      !persistArkonStorySave(slotIndex, createArkonStoryState(slotIndex))) {
    return false;
  }
  writeJson(storyModeKey(slotIndex), isStory ? ARKON_STORY_MODE : 'career');
  return getProfileGameMode(slotIndex) === (isStory ? ARKON_STORY_MODE : 'career');
}

export function getProfileSlots() {
  const store = ensureProfileStore();
  const activeIndex = getActiveProfileIndex();

  return store.slots.map((slot, index) => {
    const state = slot?.session || slot?.manual || null;
    const profileNameKey = (
      String(state?.firstName || '').trim().toLowerCase() +
      String(state?.lastName || '').trim().toLowerCase()
    ).replace(/[^a-z0-9]/g, '');
    const profileCharacterId = profileNameKey === 'arkonden'
      ? 'arkonDen'
      : (state?.playerCharacterId || null);

    return {
      index,
      occupied: Boolean(state),
      active: index === activeIndex,
      firstName: String(state?.firstName || ''),
      lastName: String(state?.lastName || ''),
      playerCharacterId: profileCharacterId,
      cash: Number(state?.cash || 0),
      playerDifficulty: normalisePlayerDifficulty(state?.playerDifficulty),
      carCount: Array.isArray(state?.ownedCarIds) ? state.ownedCarIds.length : 0,
      wins: Number(state?.wins || 0),
      losses: Number(state?.losses || 0),
      playTimeMs: Math.max(0, Number(state?.playTimeMs || 0)),
      selectedCarId: state?.selectedCarId || null,
      district: String(state?.district || 'ODAIBA'),
      garageTier: Math.max(0, Number(state?.garageTier || 0)),
      championCount: profileNameKey === 'arkonden'
        ? ARKON_DEV_CHAMPIONSHIP_REGIONS.length
        : Object.values(state?.tunerTeamChallenges || {})
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
      selectedMode: isArkonProfile(state) &&
        readJson(storyModeKey(index)) === ARKON_STORY_MODE ? ARKON_STORY_MODE : 'career',
      storyStarted: isArkonProfile(state) && Boolean(readArkonStorySave(index)),
      storyChapter: Math.max(1, Number(readArkonStorySave(index)?.arkonStoryChapter || 1)),
    };
  });
}

export function beginNewProfile(index) {
  const slotIndex = setActiveProfileIndex(index);
  const store = ensureProfileStore();
  store.slots[slotIndex] = null;
  removeKey(storySaveKey(slotIndex));
  removeKey(storyModeKey(slotIndex));
  writeProfileStore(store);
  mirrorActiveProfile(null);
  return slotIndex;
}

export function deleteProfileSlot(index) {
  const slotIndex = Math.max(0, Math.min(MAX_PROFILES - 1, Number(index) || 0));
  const store = ensureProfileStore();
  store.slots[slotIndex] = null;
  removeKey(storySaveKey(slotIndex));
  removeKey(storyModeKey(slotIndex));
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

export function exportProfileBackup(index, build = 'R247') {
  const slotIndex = Math.max(0, Math.min(MAX_PROFILES - 1, Number(index) || 0));
  const slot = ensureProfileStore().slots[slotIndex];
  const state = getProfileState(slotIndex, true);
  if (!state) return null;
  const story = isArkonProfile(state) ? readArkonStorySave(slotIndex) : null;

  return {
    format: 'TOKYO_SHIFT_PROFILE_BACKUP',
    formatVersion: story ? 2 : 1,
    ...(story ? {
      storyState: clonePlain(normaliseState(story)),
      selectedMode: getProfileGameMode(slotIndex),
    } : {}),
    gameBuild: String(build || 'UNKNOWN'),
    exportedAt: new Date().toISOString(),
    slot: slotIndex + 1,
    state: clonePlain(normaliseState(state)),
  };
}

export function importProfileBackup(index, payload) {
  const slotIndex = Math.max(0, Math.min(MAX_PROFILES - 1, Number(index) || 0));
  if (!payload || typeof payload !== 'object') {
    throw new Error('INVALID BACKUP FILE');
  }
  if (String(payload.format || '') !== 'TOKYO_SHIFT_PROFILE_BACKUP') {
    throw new Error('NOT A TOKYO SHIFT PROFILE BACKUP');
  }
  if (![1, 2].includes(Number(payload.formatVersion || 0))) {
    throw new Error('UNSUPPORTED BACKUP VERSION');
  }
  if (!payload.state || typeof payload.state !== 'object') {
    throw new Error('BACKUP HAS NO PROFILE DATA');
  }

  const state = {
    ...normaliseState(payload.state),
    savedAt: new Date().toISOString(),
  };
  const store = ensureProfileStore();
  const existing = store.slots[slotIndex];
  const incomingStory = Number(payload.formatVersion) === 2 && payload.storyState &&
    isArkonStory(payload.storyState) && isArkonProfile(state)
      ? { ...normaliseState(payload.storyState),
          storyDirectorProgress: payload.storyState.storyDirectorProgress
            ? { ...payload.storyState.storyDirectorProgress, ownerSlot: slotIndex }
            : null }
      : null;
  // Importing an older Career-only backup must not silently destroy a Story run.
  const keepStory = isArkonProfile(state) && !incomingStory
    ? readArkonStorySave(slotIndex) : null;
  const safeStory = incomingStory || keepStory;
  store.slots[slotIndex] = {
    manual: clonePlain(state),
    session: clonePlain(state),
    createdAt: existing?.createdAt || payload.exportedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeProfileStore(store);
  if (safeStory && !persistArkonStorySave(slotIndex, safeStory))
    throw new Error('STORY BACKUP COULD NOT BE SAVED');
  if (!safeStory) removeKey(storySaveKey(slotIndex));
  const targetMode = isArkonProfile(state) && safeStory &&
    payload.selectedMode === ARKON_STORY_MODE ? ARKON_STORY_MODE : 'career';
  writeJson(storyModeKey(slotIndex), targetMode);

  // Import is destructive, so do not claim success unless the profile really
  // survived a round-trip through localStorage. This catches quota/private
  // storage failures before Settings reloads the app and hides the error.
  const writtenSlot = ensureProfileStore().slots[slotIndex];
  const writtenState = writtenSlot?.session || writtenSlot?.manual || null;
  if (!writtenState || JSON.stringify(writtenState) !== JSON.stringify(state) ||
      (safeStory && JSON.stringify(readArkonStorySave(slotIndex)) !== JSON.stringify(safeStory))) {
    throw new Error('BACKUP COULD NOT BE SAVED');
  }

  if (slotIndex === getActiveProfileIndex()) {
    mirrorActiveProfile(writtenSlot);

    const mirroredSession = readJson(SESSION_KEY);
    const expected = state;
    if (!mirroredSession || JSON.stringify(mirroredSession) !== JSON.stringify(expected)) {
      throw new Error('ACTIVE PROFILE COULD NOT BE RESTORED');
    }
  }

  return clonePlain(state);
}

export function activateProfile(registry, index, preferSession = true) {
  const slotIndex = setActiveProfileIndex(index);
  const state = readSessionState() || getProfileState(slotIndex, preferSession);
  if (!state) return null;
  return applyStateToRegistry(registry, state);
}

export function readManualSave() {
  const index = getActiveProfileIndex();
  if (getProfileGameMode(index) === ARKON_STORY_MODE) return readArkonStorySave(index);
  return ensureProfileStore().slots[index]?.manual || null;
}

export function readSessionState() {
  const index = getActiveProfileIndex();
  if (getProfileGameMode(index) === ARKON_STORY_MODE) return readArkonStorySave(index);
  const slot = ensureProfileStore().slots[index];
  const state = slot?.session || slot?.manual || null;
  if (state) return state;

  // Final non-destructive fallback: never strand a mirrored active profile
  // behind an empty/corrupt multi-profile store.
  return readJson(SESSION_KEY) || readJson(SAVE_KEY) || null;
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

// Sayaka moved from Shinagawa's roster to a non-driving story role in R457.
// Preserve existing recruit progress and loan cars: Reika fills the same RX-8
// street slot, so old profiles should not lose a crew member on upgrade.
function migrateShinagawaSayakaRecruit(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
      String(entry.regionId || '').toUpperCase() !== 'SHINAGAWA' ||
      entry.characterId !== 'sayakaFujieda') return entry;
  return { ...entry, characterId: 'reikaTachibana' };
}

export function normaliseState(input = {}) {
  // Retired EVO IX owned cars/coupons are migrated before any IDs are filtered,
  // registered or copied into persistent workshop/competition state.
  input = migrateRetiredEvoIX(input);
  // Resolve any leftover EJ1 rival/crew/competition IDs before registry hydration.
  input = migrateRetiredEJ1(input);
  // Old EVO III / 22B model IDs are historical aliases of the canon Galant
  // VR-4 and Impreza GC8. Migrate all saved instances before car registration.
  input = migrateCanonicalCarModels(input);
  const hadSayakaShinagawaCrew = input.crewMembers?.SHINAGAWA?.characterId === 'sayakaFujieda';
  const oldLoanCarId = 'crew__sayakaFujieda';
  const replacementLoanCarId = 'crew__reikaTachibana';
  const remapLoanCarId = id =>
    hadSayakaShinagawaCrew && id === oldLoanCarId ? replacementLoanCarId : id;
  const migratedGarageLocations = { ...(input.carGarageLocations || {}) };
  if (hadSayakaShinagawaCrew && Object.prototype.hasOwnProperty.call(migratedGarageLocations, oldLoanCarId)) {
    migratedGarageLocations[replacementLoanCarId] = migratedGarageLocations[oldLoanCarId];
    delete migratedGarageLocations[oldLoanCarId];
  }

  // Legacy Story profiles started with an EF. Replace ONLY an untouched
  // stock starter with a factory 240Z. Do not silently delete a tuned Civic,
  // player-acquired EF, or any existing parts/history when loading old saves.
  const namedArkon = (String(input.firstName||'')+String(input.lastName||''))
    .toLowerCase().replace(/[^a-z0-9]/g,'')==='arkonden';
  const former = input.carStates?.ef;
  const untouched = former?.acquiredVia==='starter' && former?.stock!==false &&
    ['tuning','engineTuning','drivetrainTuning','chassisTuning','exhaustNosTuning']
      .every(key => Object.values(former[key]||{}).every(v => !Number(v))) &&
    Number(former.tuneLevel||0)===0 && !former.nosInstalled;
  if(input.gameMode===ARKON_STORY_MODE && namedArkon &&
     (input.starterCarId==='ef' || !input.starterCarId) &&
     input.ownedCarIds?.includes('ef') && untouched){
    const replacement={...input.carStates};
    delete replacement.ef;
    replacement['240z']=createStarterCarState('240z');
    const locations={...migratedGarageLocations};
    locations['240z']=locations.ef||'shinonomeWorkshop';
    delete locations.ef;
    input={...input,starterCarId:'240z',
      ownedCarIds:input.ownedCarIds.map(id=>id==='ef'?'240z':id),
      selectedCarId:input.selectedCarId==='ef'?'240z':input.selectedCarId,
      preferredCarId:input.preferredCarId==='ef'?'240z':input.preferredCarId,
      carStates:replacement,carGarageLocations:locations};
    Object.assign(migratedGarageLocations,locations);
    delete migratedGarageLocations.ef;
  }
  const requestedStarterCarId =
    input.starterCarId ||
    Object.entries(input.carStates || {}).find(
      ([carId, carState]) =>
        SAVE_COMPATIBLE_STARTER_CAR_IDS.includes(carId) && carState?.acquiredVia === 'starter'
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
  const openingPending = ['station', 'home', 'magazine', 'delivery'].includes(String(input.openingChapter || ''));
  const joinedDevName = (
    String(input.firstName || '').trim().toLowerCase() +
    String(input.lastName || '').trim().toLowerCase()
  ).replace(/[^a-z0-9]/g, '');
  const rawCash = Number.isFinite(input.cash) ? input.cash : base.cash;
  const storyMode = input.gameMode === ARKON_STORY_MODE && joinedDevName === 'arkonden';
  const devName = joinedDevName === 'arkonden' && !storyMode;
  const legacyDevCash = rawCash >= 900000000 && !storyMode;
  const devMode = !storyMode && Boolean(input.devMode || devName || legacyDevCash);
  const normalisedCash = devName && !input.devMode
    ? Math.max(rawCash, 1000000000)
    : rawCash;

  // R665 migration: older Chapter 04 saves held only an abstract RWB
  // liability; make it occupy the actual Canal Yard garage slot on load.
  const storyRwbAcquired=storyMode && input.arkonStoryRwbProject?.acquired &&
    !input.arkonStoryRwbProject?.gifted &&
    input.arkonStoryRwbProject.carId==='rwbStellaPorsche';
  const storyRwbGifted=storyMode && input.arkonStoryRwbProject?.gifted &&
    input.arkonStoryRwbProject.carId==='rwbStellaPorsche';
  const owned = (
    Array.isArray(input.ownedCarIds)
      ? [...new Set(input.ownedCarIds.map(remapLoanCarId))]
      : [...base.ownedCarIds]
  ).filter(carId => !REMOVED_CAR_IDS.has(String(carId)) &&
      !(storyRwbGifted&&carId==='rwbStellaPorsche'));

  if(storyRwbAcquired && !owned.includes('rwbStellaPorsche'))owned.push('rwbStellaPorsche');
  if(storyRwbAcquired && !migratedGarageLocations.rwbStellaPorsche)
    migratedGarageLocations.rwbStellaPorsche='shinonomeCanalYard';
  if(storyRwbGifted)delete migratedGarageLocations.rwbStellaPorsche;

  // Developer special never enters carOrder, markets, coupons or rival pools.
  // Grant once, preserving existing Magna upgrades and avoiding re-grants after sale.
  const grantDevMagna = devMode && !openingPending && !owned.includes('magna')
    && !input.carStates?.magna && !(input.carHistory || []).some(entry => entry.carId === 'magna');
  if (grantDevMagna) owned.push('magna');
  if (!owned.length && !openingPending) owned.push(base.starterCarId);

  // Duplicate production cars are persisted as stable instance IDs such as
  // ek9__copy2. Re-register their aliases before any scene filters owned cars
  // through the shared cars catalog.
  registerOwnedCarInstances(owned);

  const starterCarId = base.starterCarId;

  const selectedCarId = owned.includes(remapLoanCarId(input.selectedCarId))
    ? remapLoanCarId(input.selectedCarId)
    : owned[0] || null;
  const preferredCarId = [input.preferredCarId, selectedCarId, ...owned]
    .map(remapLoanCarId)
    .find(id => owned.includes(id) && !String(id || '').startsWith('crew__')) || null;

  let garageTier = inferWorkshopTier(owned.filter(id => !String(id).startsWith('ginzaDemo_')).length, input.garageTier);
  // Story property access is chapter-authored, never purchased or inferred
  // from fleet size, cash or regional wins. Career behaviour is unchanged.
  if (storyMode) garageTier = getArkonStoryWorkshopTier(input);
  const requestedWorkshop = getWorkshopByLocationId(input.workshopLocationId);
  let workshopLocationId = requestedWorkshop.tier <= garageTier
    ? requestedWorkshop.id
    : WORKSHOP_TIERS[garageTier].id;
  if (storyMode && input.storyDirectorProgress?.id==='arkonChapter03' &&
      Number(input.storyDirectorProgress.index||0)<=3 && garageTier>=1) {
    workshopLocationId='shinonomeCanalYard';
  }
  let carGarageLocations = normaliseCarGarageLocations(
    owned,
    migratedGarageLocations,
    garageTier
  );

  if (devName) {
    // Arkon is the development profile for testing the post-regional game.
    // Put him exactly at the crew phase: every regional championship is won,
    // Warehouse HQ is unlocked, but no crew recruitment/battle is fabricated.
    garageTier = Math.max(2, garageTier);
    workshopLocationId = requestedWorkshop.tier <= garageTier
      ? requestedWorkshop.id
      : WORKSHOP_TIERS[garageTier].id;
    carGarageLocations = normaliseCarGarageLocations(
      owned,
      migratedGarageLocations,
      garageTier
    );
  }

  // A profile literally named Arkon Den is the developer avatar. Keep Arkon
  // out of the normal playable pool while still migrating existing dev saves.
  const playerCharacterId = (devName || storyMode)
    ? 'arkonDen'
    : playableCharacterOrder.includes(input.playerCharacterId)
      ? input.playerCharacterId
      : base.playerCharacterId;

  const mergedCarStates = {
    ...(openingPending ? {} : base.carStates),
    ...(input.carStates || {}),
  };
  if(storyRwbAcquired){
    mergedCarStates.rwbStellaPorsche={
      ...mergedCarStates.rwbStellaPorsche,
      immutable:true,tuningLocked:true,collector:true,
      storedProject:true,roadworthy:Boolean(input.arkonStoryRwbProject?.roadworthy &&
        Number(input.arkonStoryChapter06Accounts?.restorationDone)>=3),
    };
  }
  if(storyRwbGifted)delete mergedCarStates.rwbStellaPorsche;
  if (grantDevMagna) {
    const existingMagna = input.carStates?.magna || {};
    mergedCarStates.magna = {
      ...createStarterCarState('magna'), ...existingMagna,
      // Upgrade only legacy default-white developer Magnas to Frontier Green.
      // Other saved factory/custom colours remain unchanged.
      paintColor: existingMagna.paintColor == null ||
        (existingMagna.paintColor === 0xffffff &&
         (!existingMagna.acquiredVia || existingMagna.acquiredVia === 'developerSpecial'))
        ? getDefaultFactoryPaintColor('magna') : existingMagna.paintColor,
      acquiredVia: 'developerSpecial',
    };
  }
  // R501: old bodykit image pairs are incompatible with the new car assets.
  // Treat all previous kits as stock without touching paint, tune or rim IDs.
  Object.entries(mergedCarStates).forEach(([carId, carState]) => {
    if (carState?.visualMods?.bodyKit && carState.visualMods.bodyKit !== 'stock') {
      mergedCarStates[carId] = {
        ...carState,
        visualMods: { ...carState.visualMods, bodyKit: 'stock' },
      };
    }
  });
  if (hadSayakaShinagawaCrew && mergedCarStates[oldLoanCarId]) {
    mergedCarStates[replacementLoanCarId] = {
      ...mergedCarStates[oldLoanCarId],
      crewOwnerCharacterId: 'reikaTachibana',
    };
    delete mergedCarStates[oldLoanCarId];
  }
  // Vault test cars are temporary visitors, not acquired property. Never
  // turn a gallery loan into an owned vehicle in permanent car history.
  const carHistory = normaliseCarHistory(
    (input.carHistory || []).filter(entry => !String(entry?.carId || '').startsWith('ginzaDemo_')),
    owned.filter(id => !String(id).startsWith('ginzaDemo_')),
    mergedCarStates
  );

  // We can prove an old profile owned its starter even if that car was sold or
  // lost before the ledger existed. The exact old sale build cannot be
  // reconstructed, so mark it clearly as a pre-history archive rather than
  // inventing a sale price or tuned specification.
  if (
    !openingPending &&
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

  const normalisedRegionWins = input.regionWins && typeof input.regionWins === 'object'
    ? Object.fromEntries(
        Object.entries(input.regionWins).map(([regionId, value]) => [
          String(regionId).toUpperCase(),
          Math.max(0, Number(value || 0)),
        ])
      )
    : {};

  const normalisedTunerTeamChallenges =
    input.tunerTeamChallenges && typeof input.tunerTeamChallenges === 'object'
      ? clonePlain(input.tunerTeamChallenges)
      : {};

  if (devName) {
    ARKON_DEV_CHAMPIONSHIP_REGIONS.forEach(regionId => {
      normalisedRegionWins[regionId] = Math.max(
        10,
        Number(normalisedRegionWins[regionId] || 0)
      );

      const existing = normalisedTunerTeamChallenges[regionId] || {};
      normalisedTunerTeamChallenges[regionId] = {
        ...existing,
        invited: false,
        offeredOnce: true,
        reofferVisitsRemaining: 0,
        completed: true,
        championEarned: true,
        championRewardClaimed: true,
        // Keep Perfect Sweep available for dev testing; only the championship
        // badge itself is pre-awarded.
        perfectEarned: Boolean(existing.perfectEarned),
        perfectRewardClaimed: Boolean(existing.perfectRewardClaimed),
        perfectAttempt: false,
        stage: Math.max(7, Number(existing.stage || 0)),
        activeSession: false,
        paused: false,
        pausedAt: 0,
        retryNotBefore: 0,
        completedAt: Math.max(1, Number(existing.completedAt || 1)),
      };
    });
  }

  return {
    ...base,
    ...input,
    version: 9,
    gameMode: storyMode ? ARKON_STORY_MODE : 'career',
    arkonStoryChapter: storyMode ? Math.max(1, Math.min(10, Number(input.arkonStoryChapter || 1))) : 0,
    arkonStoryChoices: storyMode && input.arkonStoryChoices && typeof input.arkonStoryChoices === 'object'
      && !Array.isArray(input.arkonStoryChoices) ? clonePlain(input.arkonStoryChoices) : {},
    arkonStoryFirstChoice: storyMode && ['careful','bold'].includes(input.arkonStoryFirstChoice)
      ? input.arkonStoryFirstChoice : null,
    arkonStoryFirstReply: storyMode && ['honest','tease'].includes(input.arkonStoryFirstReply)
      ? input.arkonStoryFirstReply : null,
    arkonStoryChapter01Done: storyMode && Boolean(input.arkonStoryChapter01Done),
    arkonStoryChapter01AfterHoursDone: storyMode && Boolean(input.arkonStoryChapter01AfterHoursDone),
    arkonStoryChapter01FullDone: storyMode && Boolean(input.arkonStoryChapter01FullDone),
    arkonStoryChapter01RevisedDone: storyMode && Boolean(input.arkonStoryChapter01RevisedDone),
    arkonStoryChapter02Done: storyMode && Boolean(input.arkonStoryChapter02Done),
    arkonStoryChapter02FishPaid: storyMode && Boolean(input.arkonStoryChapter02FishPaid),
    arkonStoryChapter02RivalResult: storyMode &&
      ['won','lost'].includes(input.arkonStoryChapter02RivalResult)
        ? input.arkonStoryChapter02RivalResult : null,
    arkonStoryCruiseComplete: storyMode && Boolean(input.arkonStoryCruiseComplete),
    arkonStoryChapter03Done: storyMode && Boolean(input.arkonStoryChapter03Done),
    arkonStoryChapter04Done: storyMode && Boolean(input.arkonStoryChapter04Done),
    arkonStoryChapter05Done: storyMode && Boolean(input.arkonStoryChapter05Done),
    arkonStoryChapter06Done: storyMode && Boolean(input.arkonStoryChapter06Done),
    arkonStoryChapter07Done: storyMode && Boolean(input.arkonStoryChapter07Done),
    arkonStoryChapter07Work: storyMode && input.arkonStoryChapter07Work &&
      typeof input.arkonStoryChapter07Work==='object' ? {
        stage:Math.max(0,Math.min(3,Math.floor(Number(input.arkonStoryChapter07Work.stage)||0))),
        jobsDone:Math.max(0,Math.min(3,Math.floor(Number(input.arkonStoryChapter07Work.jobsDone)||0))),
        racesDone:Math.max(0,Math.min(2,Math.floor(Number(input.arkonStoryChapter07Work.racesDone)||0))),
        shops:[...new Set((Array.isArray(input.arkonStoryChapter07Work.shops)
          ?input.arkonStoryChapter07Work.shops:[]).filter(x=>
            ['ODAIBA','SHIBUYA','SHINJUKU','YOKOHAMA','DAIKOKU','SHINAGAWA','TATSUMI'].includes(x)))],
        converted:Boolean(input.arkonStoryChapter07Work.converted),
      }:null,
    arkonStoryChapter07Race: storyMode && input.arkonStoryChapter07Race?.active
      ?clonePlain(input.arkonStoryChapter07Race):null,
    arkonStoryChapter07RaceResult: storyMode &&
      ['won','lost','forfeit'].includes(input.arkonStoryChapter07RaceResult)
      ?input.arkonStoryChapter07RaceResult:null,
    arkonStoryChapter07Solo: storyMode && input.arkonStoryChapter07Solo?.active
      ?clonePlain(input.arkonStoryChapter07Solo):null,
    arkonStoryChapter07SoloFinished: storyMode &&
      Boolean(input.arkonStoryChapter07SoloFinished),
    arkonStoryChapter06Accounts: storyMode && input.arkonStoryChapter06Accounts &&
      typeof input.arkonStoryChapter06Accounts==='object'
      ? clonePlain(input.arkonStoryChapter06Accounts):null,
    arkonStoryChapter06Cruise: storyMode && input.arkonStoryChapter06Cruise?.active
      ? clonePlain(input.arkonStoryChapter06Cruise):null,
    arkonStoryChapter06CruiseFinished: storyMode &&
      Boolean(input.arkonStoryChapter06CruiseFinished),
    arkonStoryChapter05JobsDone: storyMode
      ? Math.max(0,Math.min(3,Math.floor(Number(input.arkonStoryChapter05JobsDone)||0))):0,
    arkonStoryChapter05Loan: storyMode && input.arkonStoryChapter05Loan?.active
      ? clonePlain(input.arkonStoryChapter05Loan):null,
    arkonStoryChapter05RaceResult: storyMode &&
      ['won','lost','forfeit'].includes(input.arkonStoryChapter05RaceResult)
      ? input.arkonStoryChapter05RaceResult:null,
    arkonStoryChapter05Results: storyMode &&
      input.arkonStoryChapter05Results && typeof input.arkonStoryChapter05Results==='object'
      ? clonePlain(input.arkonStoryChapter05Results):{},
    arkonStoryChapter04Work: storyMode && input.arkonStoryChapter04Work?.started
      ? {started:true,
          cashWins:Math.max(0,Math.min(3,Math.trunc(Number(input.arkonStoryChapter04Work.cashWins)||0))),
          showdownWins:Math.max(0,Math.min(1,Math.trunc(Number(input.arkonStoryChapter04Work.showdownWins)||0))) }
      : null,
    arkonStoryRwbProject: storyMode && input.arkonStoryRwbProject?.acquired &&
      input.arkonStoryRwbProject.carId === 'rwbStellaPorsche'
      ? {
          ...clonePlain(input.arkonStoryRwbProject),
          roadworthy:Boolean(input.arkonStoryRwbProject.roadworthy) &&
            (Boolean(input.arkonStoryRwbProject.gifted) ||
             Number(input.arkonStoryChapter06Accounts?.restorationDone)>=3),
          // R665 repairs old abstract balances; R668 maintains the
          // deliberately *paid-off* Chapter 06 liability at exactly zero.
          outstandingFinance: input.arkonStoryChapter06Accounts?.financeCleared ||
            input.arkonStoryRwbProject.gifted
            ? 0 : Number(input.arkonStoryRwbProject.outstandingFinance)<2000000
              ? 3000000 : Number(input.arkonStoryRwbProject.outstandingFinance)||3000000,
        } : null,
    arkonStoryCustomerJobsDone: storyMode
      ? Math.max(0,Math.min(6,Math.floor(Number(input.arkonStoryCustomerJobsDone)||0))) : 0,
    arkonStoryChapter03Seed: storyMode ? (Number(input.arkonStoryChapter03Seed)>>>0) : 0,
    arkonStoryMx5CustomerTuning: storyMode && input.arkonStoryMx5CustomerTuning
      && typeof input.arkonStoryMx5CustomerTuning==='object'
      ? clonePlain(input.arkonStoryMx5CustomerTuning) : null,
    arkonStoryMx5RaceResult: storyMode &&
      ['won','lost','declined','forfeit'].includes(input.arkonStoryMx5RaceResult)
      ? input.arkonStoryMx5RaceResult : null,
    arkonStoryCanalYardUnlocked: storyMode && garageTier>=1,
    arkonStoryWarehouseUnlocked: storyMode && garageTier>=2,
    arkonStoryMx5Loan: storyMode && input.arkonStoryMx5Loan?.active
      ? clonePlain(input.arkonStoryMx5Loan) : null,
    arkonStoryPhase: storyMode ? String(input.arkonStoryPhase || 'opening') : 'opening',
    // Migrate R652 chapters already past the nighttime introduction without
    // restarting their scripted checkpoints or resetting any races.
    arkonStoryTimeOfDay: storyMode && (
      input.arkonStoryTimeOfDay==='day' ||
      (input.arkonStoryTimeOfDay!=='night' &&
       ['practice','goSchool','lesson','complete'].includes(input.arkonStoryPhase))
    ) ? 'day' : 'night',
    arkonStorySayakaNoticed: storyMode && Boolean(input.arkonStorySayakaNoticed),
    arkonStoryRivalResult: storyMode && ['won','lost'].includes(input.arkonStoryRivalResult)
      ? input.arkonStoryRivalResult : null,
    arkonStoryAtSchool: storyMode && Boolean(input.arkonStoryAtSchool),
    arkonStorySchoolRevealed: storyMode && Boolean(input.arkonStorySchoolRevealed),
    arkonStoryLessonCompleted: storyMode && Boolean(input.arkonStoryLessonCompleted),
    arkonStoryLessonCredits: storyMode ? Math.max(0,Math.min(25,Math.floor(Number(input.arkonStoryLessonCredits)||0))) : 0,
    arkonStoryCreditsAwarded: storyMode && Boolean(input.arkonStoryCreditsAwarded),
    arkonStoryGinzaUnlocked: storyMode && Boolean(input.arkonStoryGinzaUnlocked),
    district: normalisedDistrict,
    meetLocation: normalisedLocation,
    garageTier,
    dynoFacilityTier: Math.max(0, Math.min(3, Math.floor(Number(input.dynoFacilityTier || 0)))),
    workshopLocationId,
    carGarageLocations,
    ownedWheelIds: Array.isArray(input.ownedWheelIds)
      ? [...new Set(input.ownedWheelIds.map(String).filter(Boolean))]
      : [],
    autoMarketRoom: ['new', 'used'].includes(String(input.autoMarketRoom))
      ? String(input.autoMarketRoom)
      : 'used',
    autoMarketHaggles:
      input.autoMarketHaggles && typeof input.autoMarketHaggles === 'object'
        ? input.autoMarketHaggles
        : {},
    playerCharacterId,
    starterCarId,
    openingChapter: ['station', 'home', 'magazine', 'delivery', 'tutorial', 'awaitDaichi', 'daichi', 'done'].includes(String(input.openingChapter))
      ? String(input.openingChapter) : null,
    selectedCarId,
    preferredCarId,
    ownedCarIds: owned,
    carStates: mergedCarStates,
    carHistory,
    carMagazineSightings:
      input.carMagazineSightings && typeof input.carMagazineSightings === 'object'
        ? input.carMagazineSightings
        : {},
    wins: devName
      ? Math.max(75, Number.isFinite(input.wins) ? input.wins : base.wins)
      : (Number.isFinite(input.wins) ? input.wins : base.wins),
    losses: Number.isFinite(input.losses) ? input.losses : base.losses,
    playTimeMs: Math.max(0, Number(input.playTimeMs || 0)),
    pinkSlipLastRequestRace: Number.isFinite(Number(input.pinkSlipLastRequestRace))
      ? Math.floor(Number(input.pinkSlipLastRequestRace))
      : -999,
    // Old saves predate the shared lottery. Retain partial race buildup so
    // returning players aren't treated like they just won another car.
    pinkSlipLastWinRace: input.pinkSlipLastWinRace != null &&
      Number.isFinite(Number(input.pinkSlipLastWinRace))
      ? Math.max(0, Math.floor(Number(input.pinkSlipLastWinRace)))
      : Math.max(0, Number(input.wins || 0) + Number(input.losses || 0) - 12),
    pinkSlipOpportunityRace: Number.isFinite(Number(input.pinkSlipOpportunityRace))
      ? Math.floor(Number(input.pinkSlipOpportunityRace))
      : -1,
    pinkSlipOpportunityGranted: Boolean(input.pinkSlipOpportunityGranted),
    pinkSlipOpportunityUsed: Boolean(input.pinkSlipOpportunityUsed),
    incomingPinkSlipLastOfferRace: Number.isFinite(Number(input.incomingPinkSlipLastOfferRace))
      ? Math.floor(Number(input.incomingPinkSlipLastOfferRace))
      : -999,
    cash: normalisedCash,
    ethanYuenCompensationR638: Boolean(input.ethanYuenCompensationR638),
    ethanYuenCompensationDialoguePending: Boolean(input.ethanYuenCompensationDialoguePending),
    competitionWins: devName
      ? Math.max(1, Math.floor(Number(input.competitionWins || 0)))
      : Math.max(0, Math.floor(Number(input.competitionWins || 0))),
    easyCouponLastMilestone: Number.isFinite(input.easyCouponLastMilestone)
      ? Math.max(0, Math.floor(Number(input.easyCouponLastMilestone || 0)))
      : getEasyCouponMilestoneForWins(Number.isFinite(input.wins) ? input.wins : base.wins),
    surpriseRewardState: {
      winsSinceReward: Math.max(0, Math.floor(Number(input.surpriseRewardState?.winsSinceReward || 0))),
      total: Math.max(0, Math.floor(Number(input.surpriseRewardState?.total || 0))),
      lastAtWin: Math.max(0, Math.floor(Number(input.surpriseRewardState?.lastAtWin || 0))),
    },
    playerDifficulty: normalisePlayerDifficulty(input.playerDifficulty),
    devMode,
    cutscenesSeen: Array.isArray(input.cutscenesSeen)
      ? [...new Set(input.cutscenesSeen.map(String).filter(Boolean))]
      : [],
    storyDirectorProgress:
      input.storyDirectorProgress?.version === 1 &&
      typeof input.storyDirectorProgress.id === 'string' &&
      Number.isSafeInteger(input.storyDirectorProgress.index) &&
      input.storyDirectorProgress.index >= 0 &&
      Number.isSafeInteger(input.storyDirectorProgress.ownerSlot)
        ? { id: input.storyDirectorProgress.id,
            index: input.storyDirectorProgress.index,
            ownerSlot: input.storyDirectorProgress.ownerSlot, version: 1,
            ...(input.storyDirectorProgress.vars &&
               typeof input.storyDirectorProgress.vars==='object' &&
               !Array.isArray(input.storyDirectorProgress.vars)
              ? { vars:Object.fromEntries(Object.entries(input.storyDirectorProgress.vars)
                  .filter(([key,val])=>/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key) &&
                    (typeof val==='string' && val.length<=80 ||
                     typeof val==='boolean' ||
                     typeof val==='number' && Number.isFinite(val)))
                  .slice(0,24)) }
              : {}) }
        : storyMode && input.arkonStoryChapter01AfterHoursDone &&
          !input.arkonStoryChapter01FullDone
          ? { id:'arkonChapter01', index:37,
              ownerSlot:getActiveProfileIndex(), version:1 }
          : storyMode && input.arkonStoryChapter01Done &&
            !input.arkonStoryChapter01AfterHoursDone
          ? { id:'arkonChapter01', index:29,
              ownerSlot:getActiveProfileIndex(), version:1 }
          : null,
    regionWins: normalisedRegionWins,
    tunerShopProgress:
      input.tunerShopProgress && typeof input.tunerShopProgress === 'object'
        ? input.tunerShopProgress
        : {},
    tunerTeamChallenges: normalisedTunerTeamChallenges,
    tunerChallengeRevealPending: devName
      ? null
      : (input.tunerChallengeRevealPending
          ? String(input.tunerChallengeRevealPending).toUpperCase()
          : null),
    crewMembers:
      input.crewMembers && typeof input.crewMembers === 'object'
        ? {
            ...input.crewMembers,
            ...(input.crewMembers.SHINAGAWA?.characterId === 'sayakaFujieda'
              ? { SHINAGAWA: {
                  ...input.crewMembers.SHINAGAWA,
                  characterId: 'reikaTachibana',
                  loanCarId: replacementLoanCarId,
                } }
              : {}),
          }
        : {},
    crewRecruitmentState:
      input.crewRecruitmentState && typeof input.crewRecruitmentState === 'object'
        ? {
            ...input.crewRecruitmentState,
            ...(input.crewRecruitmentState.SHINAGAWA?.lastCharacterId === 'sayakaFujieda'
              ? {
                  SHINAGAWA: {
                    ...input.crewRecruitmentState.SHINAGAWA,
                    lastCharacterId: 'reikaTachibana',
                  },
                }
              : {}),
          }
        : {},
    crewInviteInterest: migrateShinagawaSayakaRecruit(input.crewInviteInterest || null),
    crewInviteInterests: Object.fromEntries(
      Object.entries(input.crewInviteInterests || {})
        .filter(([region, invite]) => ARKON_DEV_CHAMPIONSHIP_REGIONS.includes(region) && invite?.characterId)
        .map(([region, invite]) => [region, migrateShinagawaSayakaRecruit(invite)])
    ),
    crewRecruitChallenge: migrateShinagawaSayakaRecruit(input.crewRecruitChallenge || null),
    crewRecruitChallenges: Object.fromEntries(
      Object.entries(input.crewRecruitChallenges || {})
        .filter(([region, invite]) => ARKON_DEV_CHAMPIONSHIP_REGIONS.includes(region) && invite?.characterId)
        .map(([region, invite]) => [region, migrateShinagawaSayakaRecruit(invite)])
    ),
    crewPendingRecruit: migrateShinagawaSayakaRecruit(input.crewPendingRecruit || null),
    crewPendingJoinDecision: migrateShinagawaSayakaRecruit(input.crewPendingJoinDecision || null),
    crewBattleProgress:
      input.crewBattleProgress && typeof input.crewBattleProgress === 'object'
        ? input.crewBattleProgress
        : {},
    crewBattleLineups:
      input.crewBattleLineups && typeof input.crewBattleLineups === 'object'
        ? input.crewBattleLineups
        : {},
    crewBattleIntroVisits: Object.fromEntries(
      ['ODAIBA', 'SHINAGAWA', 'TATSUMI', 'SHIBUYA', 'YOKOHAMA', 'DAIKOKU', 'SHINJUKU']
        .filter(region => input.crewBattleIntroVisits?.[region] != null)
        .map(region => [
          region,
          Math.max(0, Math.min(1000000,
            Math.floor(Number(input.crewBattleIntroVisits[region]) || 0))),
        ])
    ),
    crewBattleState:
      input.crewBattleState && typeof input.crewBattleState === 'object'
        ? input.crewBattleState
        : null,
    crewSpaceActive: Boolean(input.crewSpaceActive),
    crewPreviousCarId: input.crewPreviousCarId ? remapLoanCarId(String(input.crewPreviousCarId)) : null,
    tokyoChampionshipInvited: Boolean(input.tokyoChampionshipInvited),
    ginzaVaultInvited: Boolean(input.ginzaVaultInvited),
    ginzaVaultOwnerWelcomed: Boolean(input.ginzaVaultOwnerWelcomed),
    ginzaTestDrive: input.ginzaTestDrive?.carId && String(input.ginzaTestDrive.carId).startsWith('ginzaDemo_')
      ? { carId: String(input.ginzaTestDrive.carId), previousCarId: String(input.ginzaTestDrive.previousCarId || ''),
          previousPreferredId: String(input.ginzaTestDrive.previousPreferredId || ''),
          ...( ['armed','started'].includes(input.ginzaTestDrive.devVaultNightOutR641)
            ? { devVaultNightOutR641: input.ginzaTestDrive.devVaultNightOutR641 } : {} ) }
      : null,
    selectedRacePlayerCharacterId:
      input.selectedRacePlayerCharacterId === 'sayakaFujieda' &&
      input.crewMembers?.SHINAGAWA?.characterId === 'sayakaFujieda'
        ? 'reikaTachibana'
        : (input.selectedRacePlayerCharacterId ? String(input.selectedRacePlayerCharacterId) : null),
    tunerDecalsUnlocked: Array.isArray(input.tunerDecalsUnlocked)
      ? [...new Set(input.tunerDecalsUnlocked.map(String).filter(Boolean))]
      : [],
    tunerDecalPlacements:
      input.tunerDecalPlacements && typeof input.tunerDecalPlacements === 'object'
        ? input.tunerDecalPlacements
        : {},
    meetRosters,
    meetRaceResults:
      input.meetRaceResults && typeof input.meetRaceResults === 'object'
        ? Object.fromEntries(
            Object.entries(input.meetRaceResults).map(([locationId, results]) => [
              locationId,
              Array.isArray(results)
                ? results
                    .filter(result =>
                      result &&
                      typeof result === 'object' &&
                      rivalCharacterOrder.includes(result?.offer?.characterId)
                    )
                    .map(result => ({
                      slotIndex: Math.max(0, Math.floor(Number(result.slotIndex || 0))),
                      offer: { ...(result.offer || {}) },
                    }))
                : [],
            ])
          )
        : {},
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
    proCircuit: (() => {
      const circuit=normaliseProCircuitState(input.proCircuit);
      // R574 official first-round head-to-head events lived in competitionState,
      // not proCircuit. Those players must resume their current professional
      // bracket, not be migrated back into open-circuit event selection.
      if(input.proCircuit?.seasonStatus==null&&input.competitionState?.active&&
        input.competitionState?.proEvent&&!input.competitionState?.openCircuit)
        circuit.seasonStatus='ACTIVE';
      return circuit;
    })(),
    competitionCooldownUntil: Math.max(0, Number(input.competitionCooldownUntil || 0)),
    carCoupons:
      input.carCoupons && typeof input.carCoupons === 'object'
        ? Object.fromEntries(
            Object.entries(input.carCoupons)
              .map(([carId, count]) => [String(carId), Math.max(0, Math.floor(Number(count || 0)))])
              .filter(([, count]) => count > 0)
          )
        : {},
    oshiageLocation: ['oshiageDrivingSchool', 'oshiageCustomWorks', 'oshiageSkytreeMeet'].includes(input.oshiageLocation)
      ? input.oshiageLocation : base.oshiageLocation,
    oshiageEliteVenue: ['underpass', 'plaza'].includes(input.oshiageEliteVenue) ? input.oshiageEliteVenue : 'underpass',
    oshiageEliteCooldowns: Object.fromEntries(['underpass', 'plaza'].map(id => [id,
      Math.max(0, Number(input.oshiageEliteCooldowns?.[id]) || 0)])),
    oshiageEliteSeries: input.oshiageEliteSeries?.active &&
      ['underpass', 'plaza'].includes(input.oshiageEliteSeries?.venueId) &&
      [0, 1, 2].includes(Number(input.oshiageEliteSeries?.roundIndex))
      ? { ...input.oshiageEliteSeries,
          roundIndex: Number(input.oshiageEliteSeries.roundIndex) } : null,
    oshiageEliteLastResult: input.oshiageEliteLastResult && typeof input.oshiageEliteLastResult === 'object'
      ? input.oshiageEliteLastResult : null,
    oshiageInstructorMet: Boolean(input.oshiageInstructorMet),
    oshiageBasicLessonComplete: Boolean(input.oshiageBasicLessonComplete),
    oshiageLessonTab: Math.max(0, Math.min(3, Number(input.oshiageLessonTab) || 0)),
    oshiageTrainingLesson: ['launch', 'standing', 'rolling'].includes(input.oshiageTrainingLesson)
      ? input.oshiageTrainingLesson : null,
    oshiageCoachingProgress: input.oshiageCoachingProgress && typeof input.oshiageCoachingProgress === 'object' &&
      !Array.isArray(input.oshiageCoachingProgress) ? input.oshiageCoachingProgress : {},
    oshiageFreeLessonUsed: Object.fromEntries(['launch', 'standing', 'rolling'].map(id => [
      id, Boolean(input.oshiageFreeLessonUsed?.[id]),
    ])),
    oshiageSchoolBooking: input.oshiageSchoolBooking &&
      ['launch', 'standing', 'rolling'].includes(input.oshiageSchoolBooking.lessonId) &&
      typeof input.oshiageSchoolBooking.carId === 'string' &&
      Number(input.oshiageSchoolBooking.attemptsUsed) >= 0 &&
      Number(input.oshiageSchoolBooking.attemptsUsed) <= 4
      ? { carId: input.oshiageSchoolBooking.carId, lessonId: input.oshiageSchoolBooking.lessonId,
          fee: Math.max(0, Number(input.oshiageSchoolBooking.fee) || 0),
          attemptsUsed: Math.floor(Number(input.oshiageSchoolBooking.attemptsUsed)) } : null,
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
    openingDrivingLessonComplete: Boolean(input.openingDrivingLessonComplete),
    raceReturnScene: String(input.raceReturnScene || 'MeetScene'),
    selectedRaceMeetOffer: input.selectedRaceMeetOffer && typeof input.selectedRaceMeetOffer === 'object'
      ? input.selectedRaceMeetOffer
      : null,
    meetStranded: Boolean(input.meetStranded && owned.length > 0),
    gameOver: Boolean(input.gameOver || (owned.length === 0 && !openingPending)),
  };
}

export function applyStateToRegistry(registry, input) {
  const state = normaliseState(input);
  Object.entries(state).forEach(([key, value]) => registry.set(key, value));
  registry.set('__profileSlotIndex', getActiveProfileIndex());
  registry.set('__playTimerStartedAt', Date.now());
  return state;
}

function registryOwnsActiveProfile(registry) {
  if (!registry?.get || !registry?.set) return false;
  const activeIndex = getActiveProfileIndex();
  const rawOwner = registry.get('__profileSlotIndex');

  // Old sessions have no owner marker until the first R319 state application.
  // It is safe to adopt the currently active slot exactly once.
  if (rawOwner == null) {
    registry.set('__profileSlotIndex', activeIndex);
    return true;
  }

  const owner = Number(rawOwner);
  if (owner === activeIndex) return true;

  console.warn(
    '[Tokyo SHIFT] blocked stale profile autosave',
    { registrySlot: owner, activeSlot: activeIndex }
  );
  return false;
}

export function snapshotRegistry(registry) {
  const now = Date.now();
  const timerStartedAt = Number(registry.get('__playTimerStartedAt') || now);
  const playTimeMs =
    Math.max(0, Number(registry.get('playTimeMs') || 0)) +
    Math.max(0, now - timerStartedAt);
  registry.set('playTimeMs', playTimeMs);
  registry.set('__playTimerStartedAt', now);

  return normaliseState({
    version: 9,
    firstName: registry.get('firstName') || '',
    lastName: registry.get('lastName') || '',
    playerCharacterId: registry.get('playerCharacterId') || 'renMizuno',
    gameMode: registry.get('gameMode') || 'career',
    arkonStoryChapter: registry.get('arkonStoryChapter') || 0,
    arkonStoryChoices: registry.get('arkonStoryChoices') || {},
    arkonStoryFirstChoice: registry.get('arkonStoryFirstChoice') || null,
    arkonStoryFirstReply: registry.get('arkonStoryFirstReply') || null,
    arkonStoryChapter01Done: Boolean(registry.get('arkonStoryChapter01Done')),
    arkonStoryChapter01AfterHoursDone: Boolean(registry.get('arkonStoryChapter01AfterHoursDone')),
    arkonStoryChapter01FullDone: Boolean(registry.get('arkonStoryChapter01FullDone')),
    arkonStoryChapter01RevisedDone: Boolean(registry.get('arkonStoryChapter01RevisedDone')),
    arkonStoryChapter02Done: Boolean(registry.get('arkonStoryChapter02Done')),
    arkonStoryChapter02FishPaid: Boolean(registry.get('arkonStoryChapter02FishPaid')),
    arkonStoryChapter02RivalResult: registry.get('arkonStoryChapter02RivalResult'),
    arkonStoryCruiseComplete: Boolean(registry.get('arkonStoryCruiseComplete')),
    arkonStoryChapter03Done: Boolean(registry.get('arkonStoryChapter03Done')),
    arkonStoryChapter04Done: Boolean(registry.get('arkonStoryChapter04Done')),
    arkonStoryChapter05Done: Boolean(registry.get('arkonStoryChapter05Done')),
    arkonStoryChapter06Done: Boolean(registry.get('arkonStoryChapter06Done')),
    arkonStoryChapter06Accounts: registry.get('arkonStoryChapter06Accounts')||null,
    arkonStoryChapter06Cruise: registry.get('arkonStoryChapter06Cruise')||null,
    arkonStoryChapter06CruiseFinished:
      Boolean(registry.get('arkonStoryChapter06CruiseFinished')),
    arkonStoryChapter05JobsDone: Number(registry.get('arkonStoryChapter05JobsDone')||0),
    arkonStoryChapter05Loan: registry.get('arkonStoryChapter05Loan')||null,
    arkonStoryChapter05RaceResult: registry.get('arkonStoryChapter05RaceResult')||null,
    arkonStoryChapter05Results: registry.get('arkonStoryChapter05Results')||{},
    arkonStoryRwbProject: registry.get('arkonStoryRwbProject') || null,
    arkonStoryChapter04Work: registry.get('arkonStoryChapter04Work') || null,
    arkonStoryCustomerJobsDone: Number(registry.get('arkonStoryCustomerJobsDone')||0),
    arkonStoryChapter03Seed: Number(registry.get('arkonStoryChapter03Seed')||0),
    arkonStoryMx5CustomerTuning: registry.get('arkonStoryMx5CustomerTuning')||null,
    arkonStoryMx5RaceResult: registry.get('arkonStoryMx5RaceResult')||null,
    arkonStoryMx5Loan: registry.get('arkonStoryMx5Loan')||null,
    arkonStoryPhase: registry.get('arkonStoryPhase'),
    arkonStoryTimeOfDay: registry.get('arkonStoryTimeOfDay'),
    arkonStorySayakaNoticed: Boolean(registry.get('arkonStorySayakaNoticed')),
    arkonStoryRivalResult: registry.get('arkonStoryRivalResult'),
    arkonStoryAtSchool: Boolean(registry.get('arkonStoryAtSchool')),
    arkonStorySchoolRevealed: Boolean(registry.get('arkonStorySchoolRevealed')),
    arkonStoryLessonCompleted: Boolean(registry.get('arkonStoryLessonCompleted')),
    arkonStoryLessonCredits: Number(registry.get('arkonStoryLessonCredits')||0),
    arkonStoryCreditsAwarded: Boolean(registry.get('arkonStoryCreditsAwarded')),
    arkonStoryGinzaUnlocked: Boolean(registry.get('arkonStoryGinzaUnlocked')),
    starterCarId: normaliseStarterCarId(registry.get('starterCarId')),
    openingChapter: registry.get('openingChapter') || null,
    selectedCarId: registry.get('selectedCarId') || null,
    preferredCarId: registry.get('preferredCarId') || null,
    ownedCarIds: registry.get('ownedCarIds') || [],
    carStates: registry.get('carStates') || {},
    carHistory: registry.get('carHistory') || [],
    carMagazineSightings: registry.get('carMagazineSightings') || {},
    wins: registry.get('wins') ?? 0,
    losses: registry.get('losses') ?? 0,
    playTimeMs,
    pinkSlipLastRequestRace: Number(registry.get('pinkSlipLastRequestRace') ?? -999),
    pinkSlipLastWinRace: Number(registry.get('pinkSlipLastWinRace') ?? 0),
    pinkSlipOpportunityRace: Number(registry.get('pinkSlipOpportunityRace') ?? -1),
    pinkSlipOpportunityGranted: Boolean(registry.get('pinkSlipOpportunityGranted')),
    pinkSlipOpportunityUsed: Boolean(registry.get('pinkSlipOpportunityUsed')),
    incomingPinkSlipLastOfferRace: Number(registry.get('incomingPinkSlipLastOfferRace') ?? -999),
    cash: registry.get('cash') ?? 5000,
    ethanYuenCompensationR638: Boolean(registry.get('ethanYuenCompensationR638')),
    ethanYuenCompensationDialoguePending: Boolean(registry.get('ethanYuenCompensationDialoguePending')),
    playerDifficulty: normalisePlayerDifficulty(registry.get('playerDifficulty')),
    devMode: Boolean(registry.get('devMode')),
    cutscenesSeen: registry.get('cutscenesSeen') || [],
    storyDirectorProgress: registry.get('storyDirectorProgress') || null,
    regionWins: registry.get('regionWins') || {},
    tunerShopProgress: registry.get('tunerShopProgress') || {},
    tunerTeamChallenges: registry.get('tunerTeamChallenges') || {},
    tunerChallengeRevealPending: registry.get('tunerChallengeRevealPending') || null,
    crewMembers: registry.get('crewMembers') || {},
    crewRecruitmentState: registry.get('crewRecruitmentState') || {},
    crewInviteInterest: registry.get('crewInviteInterest') || null,
    crewInviteInterests: registry.get('crewInviteInterests') || {},
    crewRecruitChallenge: registry.get('crewRecruitChallenge') || null,
    crewRecruitChallenges: registry.get('crewRecruitChallenges') || {},
    crewPendingRecruit: registry.get('crewPendingRecruit') || null,
    crewPendingJoinDecision: registry.get('crewPendingJoinDecision') || null,
    crewBattleProgress: registry.get('crewBattleProgress') || {},
    crewBattleLineups: registry.get('crewBattleLineups') || {},
    crewBattleIntroVisits: registry.get('crewBattleIntroVisits') || {},
    crewBattleState: registry.get('crewBattleState') || null,
    crewSpaceActive: Boolean(registry.get('crewSpaceActive')),
    crewPreviousCarId: registry.get('crewPreviousCarId') || null,
    tokyoChampionshipInvited: Boolean(registry.get('tokyoChampionshipInvited')),
    ginzaVaultInvited: Boolean(registry.get('ginzaVaultInvited')),
    ginzaVaultOwnerWelcomed: Boolean(registry.get('ginzaVaultOwnerWelcomed')),
    ginzaTestDrive: registry.get('ginzaTestDrive') || null,
    selectedRacePlayerCharacterId: registry.get('selectedRacePlayerCharacterId') || null,
    tunerDecalsUnlocked: registry.get('tunerDecalsUnlocked') || [],
    tunerDecalPlacements: registry.get('tunerDecalPlacements') || {},
    district: registry.get('district') || 'ODAIBA',
    meetLocation: registry.get('meetLocation') || 'odaiba7eleven',
    garageTier: Number(registry.get('garageTier') || 0),
    dynoFacilityTier: Math.max(0, Math.min(3, Math.floor(Number(registry.get('dynoFacilityTier') || 0)))),
    workshopLocationId: registry.get('workshopLocationId') || 'shinonomeWorkshop',
    carGarageLocations: registry.get('carGarageLocations') || {},
    ownedWheelIds: registry.get('ownedWheelIds') || [],
    autoMarketRoom: registry.get('autoMarketRoom') || 'used',
    autoMarketHaggles: registry.get('autoMarketHaggles') || {},
    meetRosters: registry.get('meetRosters') || {},
    meetRaceResults: registry.get('meetRaceResults') || {},
    meetRefreshAt: Number(registry.get('meetRefreshAt') || 0),
    defeatedRivalKeys: registry.get('defeatedRivalKeys') || [],
    specialChallenger: registry.get('specialChallenger') || null,
    challengerMisses: Number(registry.get('challengerMisses') || 0),
    challengerCooldown: Number(registry.get('challengerCooldown') || 0),
    competitionOffers: registry.get('competitionOffers') || {},
    competitionState: registry.get('competitionState') || null,
    proCircuit: registry.get('proCircuit') || createDefaultProCircuitState(),
    competitionCooldownUntil: Number(registry.get('competitionCooldownUntil') || 0),
    competitionWins: Number(registry.get('competitionWins') || 0),
    carCoupons: registry.get('carCoupons') || {},
    easyCouponLastMilestone: Number(registry.get('easyCouponLastMilestone') || 0),
    surpriseRewardState: registry.get('surpriseRewardState') || {
      winsSinceReward: 0,
      total: 0,
      lastAtWin: 0,
    },
    oshiageLocation: registry.get('oshiageLocation') || 'oshiageDrivingSchool',
    oshiageEliteVenue: registry.get('oshiageEliteVenue') || 'underpass',
    oshiageEliteCooldowns: registry.get('oshiageEliteCooldowns') || {},
    oshiageEliteSeries: registry.get('oshiageEliteSeries') || null,
    oshiageEliteLastResult: registry.get('oshiageEliteLastResult') || null,
    oshiageInstructorMet: Boolean(registry.get('oshiageInstructorMet')),
    oshiageBasicLessonComplete: Boolean(registry.get('oshiageBasicLessonComplete')),
    oshiageLessonTab: Number(registry.get('oshiageLessonTab') || 0),
    oshiageTrainingLesson: registry.get('oshiageTrainingLesson') || null,
    oshiageCoachingProgress: registry.get('oshiageCoachingProgress') || {},
    oshiageFreeLessonUsed: registry.get('oshiageFreeLessonUsed') || {},
    oshiageSchoolBooking: registry.get('oshiageSchoolBooking') || null,
    centralTokyoLocation: registry.get('centralTokyoLocation') || 'tokyoAutoMarket',
    centralTokyoUnlocks: registry.get('centralTokyoUnlocks') || {},
    tokyoInvitesSeen: registry.get('tokyoInvitesSeen') || {},
    introTutorialChoiceDone: Boolean(registry.get('introTutorialChoiceDone')),
    openingDrivingLessonComplete: Boolean(registry.get('openingDrivingLessonComplete')),
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
  // R569: dev rehearsal is intentionally an in-memory sandbox. Do not persist
  // its temporary workshop, race flags or cutscene progress to the real slot.
  if ((registry?.get?.('__chapter08DevReplay') === true &&
       Number(registry.get('__chapter08ReplayProfileSlot')) === getActiveProfileIndex()) ||
      (registry?.get?.('__storyArchiveSceneReplay') === true &&
       Number(registry.get('__storyArchiveOwnerSlot')) === getActiveProfileIndex()) ||
      registry?.get?.('__devVaultStoryRaceActive') === true ||
      registry?.get?.('__arkonStoryPlayableReplay') === true) return null;
  if (!registryOwnsActiveProfile(registry)) return null;
  const state = snapshotRegistry(registry);
  if (state.gameMode === ARKON_STORY_MODE) {
    if (getProfileGameMode() !== ARKON_STORY_MODE) return null;
    if (!persistArkonStorySave(getActiveProfileIndex(), state)) return null;
  } else {
    if (getProfileGameMode() === ARKON_STORY_MODE) return null;
    writeActiveSlot({ session: state });
  }
  return state;
}

export function saveManualState(registry) {
  if ((registry?.get?.('__chapter08DevReplay') === true &&
       Number(registry.get('__chapter08ReplayProfileSlot')) === getActiveProfileIndex()) ||
      (registry?.get?.('__storyArchiveSceneReplay') === true &&
       Number(registry.get('__storyArchiveOwnerSlot')) === getActiveProfileIndex()) ||
      registry?.get?.('__devVaultStoryRaceActive') === true ||
      registry?.get?.('__arkonStoryPlayableReplay') === true) return null;
  if (!registryOwnsActiveProfile(registry)) return null;
  const state = {
    ...snapshotRegistry(registry),
    savedAt: new Date().toISOString(),
  };
  if (state.gameMode === ARKON_STORY_MODE) {
    if (getProfileGameMode() !== ARKON_STORY_MODE) return null;
    if (!persistArkonStorySave(getActiveProfileIndex(), state)) return null;
  } else {
    if (getProfileGameMode() === ARKON_STORY_MODE) return null;
    writeActiveSlot({ manual: state, session: state });
  }
  return state;
}

export function saveIdentityState(registry) {
  if (!registryOwnsActiveProfile(registry)) return null;
  const devName = (
    String(registry.get('firstName') || '').trim().toLowerCase() +
    String(registry.get('lastName') || '').trim().toLowerCase()
  ).replace(/[^a-z0-9]/g, '') === 'arkonden';

  if (devName) {
    registry.set('playerCharacterId', 'arkonDen');
  }

  if (devName && registry.get('gameMode') !== ARKON_STORY_MODE && !registry.get('devMode')) {
    registry.set('devMode', true);
    registry.set('cash', Math.max(1000000000, Number(registry.get('cash') || 0)));
  }

  return saveSessionState(registry);
}

export function restoreManualSave(registry) {
  const saved = readManualSave();
  if (!saved) return null;
  const state = applyStateToRegistry(registry, saved);
  if (state.gameMode === ARKON_STORY_MODE) {
    if (!persistArkonStorySave(getActiveProfileIndex(), state)) return null;
  }
  else writeActiveSlot({ session: state });
  return state;
}

// Kept for existing game-over/new-run callers. In multi-profile mode this now
// clears only the active character slot, never the other two profiles.
export function clearAllSaves() {
  const activeIndex = getActiveProfileIndex();
  if (getProfileGameMode(activeIndex) === ARKON_STORY_MODE) {
    removeKey(storySaveKey(activeIndex));
    removeKey(storyModeKey(activeIndex));
    return;
  }
  const store = ensureProfileStore();
  store.slots[activeIndex] = null;
  removeKey(storySaveKey(activeIndex));
  removeKey(storyModeKey(activeIndex));
  writeProfileStore(store);
  mirrorActiveProfile(null);
}

// Commit professional cash and progress in one active-profile snapshot and
// verify durable storage before transitioning to a paid race or next fixture.
export function saveProTransaction(registry, changes) {
  if (!registryOwnsActiveProfile(registry)) throw new Error('PROFILE CHANGED — RETURN TO PROFILE SELECT');
  const previous = Object.fromEntries(Object.keys(changes).map(key => [key, registry.get(key)]));
  try {
    Object.entries(changes).forEach(([key, value]) => registry.set(key, value));
    const snapshot = saveSessionState(registry);
    const stored = readSessionState();
    if (!snapshot || !stored || Object.keys(changes).some(key =>
      JSON.stringify(stored[key]) !== JSON.stringify(snapshot[key]))) {
      throw new Error('SAVE FAILED — FREE DEVICE STORAGE AND RETRY');
    }
    return snapshot;
  } catch (error) {
    Object.entries(previous).forEach(([key, value]) => registry.set(key, value));
    throw error;
  }
}
