import { cars } from './cars.js?v=20261026-r687';
import { stockClassFor } from './stockClasses.js?v=20261026-r687';
import { getDefaultFactoryPaintColor } from './factoryPaintPalettes.js?v=20261020-r623';
import {
  CREW_REGIONS,
  getRegionalCrewRoster,
  getRecruitableRegionalMembers,
  isRecruitableRegionalCharacter,
  getCrewBaseCarId,
  getCrewLoanCarId,
} from './crewRoster.js?v=20261009-r457';
import { getRegionalChampionshipCount } from './careerProgression.js?v=20260929-r272';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import { getEncounterAi } from './encounterProfiles.js?v=20261005-r334';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261026-r687';
import { buildTunerTeamChallengeRounds } from './tunerChallenges.js?v=20261011-r479';
import {
  getCrewBattleRegionRules, getCrewBattleHeatRule,
  getCrewEventCarSetup, getCrewBattleScout, eventStockState, isCrewEventFactoryStock,
} from './crewBattleRules.js?v=20261020-r619';

export const CREW_UNLOCK_CHAMPIONSHIPS = 7;
export const CREW_INVITE_INTEREST_CHANCE = 0.25;
export const CREW_INVITE_PITY_WINS = 4;

// Legacy aliases remain exported so a stale PWA module cannot crash while the
// new scene bundle rolls out. The random arrival mechanic itself is disabled.
export const CREW_RECRUIT_CHALLENGE_CHANCE = CREW_INVITE_INTEREST_CHANCE;
export const CREW_RECRUIT_OFFER_CHANCE = 1;
export const CREW_RECRUIT_PITY_ROLLS = CREW_INVITE_PITY_WINS;
export const CREW_BATTLE_LINEUP_SIZE = 3;
export const CREW_BATTLE_WINS_REQUIRED = 2;
export const CREW_BATTLE_COUPONS = 2;
// Loan cars live in their own Crew Space garage and never consume ordinary
// Warehouse HQ storage. The name is kept for compatibility with older imports.
export const CREW_WAREHOUSE_ID = 'crewSpace';

function value(source, key, fallback = null) {
  if (source && typeof source.get === 'function') {
    const result = source.get(key);
    return result == null ? fallback : result;
  }
  const result = source?.[key];
  return result == null ? fallback : result;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sumNumericTree(value) {
  if (!value || typeof value !== 'object') return 0;
  return Object.values(value).reduce((total, item) => {
    if (typeof item === 'number' && Number.isFinite(item)) {
      return total + Math.max(0, item);
    }
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return total + sumNumericTree(item);
    }
    return total;
  }, 0);
}

export function isCrewUnlocked(source) {
  if (Boolean(value(source, 'devMode', false))) return true;
  return getRegionalChampionshipCount(source) >= CREW_UNLOCK_CHAMPIONSHIPS;
}

export function getCrewMembers(source) {
  const raw = value(source, 'crewMembers', {}) || {};
  return Object.fromEntries(
    CREW_REGIONS
      .filter(regionId =>
        raw[regionId]?.characterId &&
        isRecruitableRegionalCharacter(
          regionId,
          raw[regionId].characterId
        )
      )
      .map(regionId => [regionId, { ...raw[regionId], regionId }])
  );
}

// Recruited drivers must never return to an opposing roster.
export function getRecruitedCrewCharacterIds(source) {
  return new Set(Object.values(getCrewMembers(source))
    .map(member => member.characterId).filter(Boolean));
}

// Crew cars are borrowed but fully customisable while their driver belongs
// to the active crew. In particular, a Ginza demo (also marked crewLoan)
 // must never be considered an active recruit's car.
export function isActiveCrewLoanCar(source, carId) {
  const id = String(carId || '');
  const car = cars[id];
  if (!id || !car?.crewLoan || car.ginzaDemo || !car.crewOwnerCharacterId ||
      !(value(source, 'ownedCarIds', []) || []).includes(id)) return false;
  return Object.values(getCrewMembers(source)).some(member =>
    member?.loanCarId === id &&
    member?.characterId === car.crewOwnerCharacterId
  );
}

// Recover a completed recruitment if a prior save retained its loan car but
// lost the crew roster entry. Never invent membership from ordinary cars.
export function repairCrewRosterFromOwnedLoanCars(registry) {
  if (!registry?.get || !registry?.set) return [];
  const owned = registry.get('ownedCarIds') || [];
  const existing = { ...(registry.get('crewMembers') || {}) };
  const restored = [];
  for (const regionId of CREW_REGIONS) {
    if (getCrewMemberForRegion(registry, regionId)) continue;
    const receipt = (registry.get('crewRecruitJoinReceipts') || {})[regionId];
    const candidate = getRecruitableRegionalMembers(regionId).find(member => {
      if (receipt?.characterId === member.characterId) return true;
      const id = getCrewLoanCarId(member.characterId);
      return owned.includes(id) && cars[id]?.crewOwnerCharacterId === member.characterId;
    });
    if (!candidate) continue;
    const loanCarId = getCrewLoanCarId(candidate.characterId);
    if (!owned.includes(loanCarId)) {
      registry.set('ownedCarIds', [...owned, loanCarId]);
      const states = { ...(registry.get('carStates') || {}) };
      states[loanCarId] = states[loanCarId] || createStockCrewCarState(candidate.characterId, candidate.baseCarId);
      registry.set('carStates', states);
      registry.set('carGarageLocations', { ...(registry.get('carGarageLocations') || {}), [loanCarId]: CREW_WAREHOUSE_ID });
    }
    existing[regionId] = { regionId, characterId: candidate.characterId,
      baseCarId: candidate.baseCarId, loanCarId, recruitedAt: Date.now() };
    restored.push(regionId);
  }
  if (restored.length) registry.set('crewMembers', existing);
  return restored;
}

export function getCrewMemberForRegion(source, regionId) {
  const key = String(regionId || '').toUpperCase();
  return getCrewMembers(source)[key] || null;
}

export function getCrewCount(source) {
  return Object.keys(getCrewMembers(source)).length;
}

export function isCrewComplete(source) {
  return CREW_REGIONS.every(regionId => Boolean(getCrewMemberForRegion(source, regionId)));
}

export function getCrewBattleProgress(source) {
  const raw = value(source, 'crewBattleProgress', {}) || {};
  return Object.fromEntries(
    CREW_REGIONS.map(regionId => [
      regionId,
      {
        completed: Boolean(raw[regionId]?.completed),
        completedAt: Math.max(0, Number(raw[regionId]?.completedAt || 0)),
        bestScore: Math.max(0, Number(raw[regionId]?.bestScore || 0)),
      },
    ])
  );
}

export function getCrewBattleWinCount(source) {
  const progress = getCrewBattleProgress(source);
  return CREW_REGIONS.filter(regionId => progress[regionId]?.completed).length;
}

export function areAllCrewBattlesComplete(source) {
  return getCrewBattleWinCount(source) >= CREW_REGIONS.length;
}

export function isTokyoChampionshipInvited(source) {
  return Boolean(value(source, 'tokyoChampionshipInvited', false)) ||
    areAllCrewBattlesComplete(source);
}

export function createStockCrewCarState(characterId, baseCarId = getCrewBaseCarId(characterId)) {
  return {
    stock: true,
    paintColor: getDefaultFactoryPaintColor(baseCarId),
    nosInstalled: false,
    tuneLevel: 0,
    tuning: { engine: 0, intake: 0, ecu: 0, turbo: 0, intercooler: 0, exhaust: 0 },
    drivetrainTuning: { clutch: 0, gearbox: 0, differential: 0, suspension: 0, launchSetup: 0 },
    chassisTuning: { tyres: 0, weightReduction: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 0, muffler: 0, nosKit: 0, nitrousShot: 0 },
    visualMods: {},
    acquiredVia: 'crewLoan',
    crewLoan: true,
    crewOwnerCharacterId: String(characterId || ''),
    crewBaseCarId: String(baseCarId || ''),
  };
}

export function createStockOpponentState(baseCarId) {
  return {
    stock: true,
    paintColor: getDefaultFactoryPaintColor(baseCarId),
    nosInstalled: false,
    tuneLevel: 0,
    buildRating: 1,
    buildArchetype: 'stock',
    acquiredVia: 'crewRecruitChallenge',
    tuning: { engine: 0, intake: 0, ecu: 0, turbo: 0, intercooler: 0, exhaust: 0 },
    drivetrainTuning: { clutch: 0, gearbox: 0, differential: 0, suspension: 0, launchSetup: 0 },
    chassisTuning: { tyres: 0, weightReduction: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 0, muffler: 0, nosKit: 0, nitrousShot: 0 },
    visualMods: {},
  };
}

export function isPerformanceStockState(state = {}) {
  // Shared factory-stock rule includes specialist tuning, NOS, legacy levels,
  // stage-three calibration, engine, chassis and drivetrain upgrades.
  return isCrewEventFactoryStock(state);
}

export function getStockCrewChallengeCarIds(source) {
  const states = value(source, 'carStates', {}) || {};
  return (value(source, 'ownedCarIds', []) || [])
    .filter(carId =>
      cars[carId] &&
      !cars[carId].crewLoan &&
      isPerformanceStockState(states[carId] || {})
    );
}

export const CREW_RECRUIT_POWER_CLASS_KW = 50; // legacy exported constant
export const CREW_RECRUIT_POWER_TOLERANCE_KW = 40;

function normaliseCrewRecruitDifficulty(source) {
  const key = String(value(source, 'playerDifficulty', 'STANDARD') || 'STANDARD')
    .trim()
    .toUpperCase();
  return ['EASY', 'STANDARD', 'HARD'].includes(key) ? key : 'STANDARD';
}

function getCrewRecruitPowerClass(powerKW) {
  const power = Math.max(0, Number(powerKW) || 0);
  const minKW = Math.max(0, power - CREW_RECRUIT_POWER_TOLERANCE_KW);
  const maxExclusiveKW = power + CREW_RECRUIT_POWER_TOLERANCE_KW + 0.001;
  return {
    minKW,
    maxExclusiveKW,
    label: 'WITHIN ±' + CREW_RECRUIT_POWER_TOLERANCE_KW + ' KW OF ' + power + ' KW',
  };
}

export function getCrewRecruitmentChallengeRules(
  source,
  challenge = value(source, 'crewRecruitChallenge', null)
) {
  const difficulty = normaliseCrewRecruitDifficulty(source);
  const baseCarId = String(challenge?.baseCarId || '');
  const states = value(source, 'carStates', {}) || {};
  const ownedCarIds = (value(source, 'ownedCarIds', []) || [])
    .filter(carId => cars[carId] && !cars[carId].crewLoan);

  // Recruitment matches permanent factory performance class, not raw power.
  // Keep the factory-stock build rule: upgrades cannot change eligibility.
  const opponentClass = stockClassFor(cars[baseCarId]);
  const eligibleCarIds = opponentClass
    ? getStockCrewChallengeCarIds(source).filter(carId =>
        stockClassFor(cars[carId]) === opponentClass)
    : [];
  const powerClass = { label: opponentClass ? 'FACTORY CLASS ' + opponentClass : 'CLASS UNAVAILABLE' };

  return {
    playerDifficulty: difficulty,
    // Recruitment driver skill: Easy Rookie, Standard Expert, Hard Expert.
    // Factory-stock car and exact permanent stock class eligibility.
    aiTier: difficulty === 'HARD' ? 'EXPERT'
      : difficulty === 'STANDARD' ? 'EXPERT' : 'ROOKIE',
    aiRating: difficulty === 'HARD' ? 4
      : difficulty === 'STANDARD' ? 4 : 2,
    carRule: 'STOCK',
    powerClass,
    powerClassLabel: powerClass.label,
    stockClass: opponentClass,
    eligibleCarIds,
  };
}

export function getRecruitableCrewCandidates(source, regionId) {
  const key = String(regionId || '').toUpperCase();
  if (!isCrewUnlocked(source) || getCrewMemberForRegion(source, key)) return [];

  return getRecruitableRegionalMembers(key)
    .filter(member => cars[member.baseCarId])
    .map(member => ({ ...member, regionId: key }));
}

export function getCrewRecruitmentState(source, regionId) {
  const key = String(regionId || '').toUpperCase();
  const store = value(source, 'crewRecruitmentState', {}) || {};
  const raw = store[key] || {};
  const legacyMisses = Math.max(0, Number(raw.misses || 0));

  return {
    regionId: key,
    eligibleWinsSinceInvite: Math.max(
      0,
      Number(raw.eligibleWinsSinceInvite ?? legacyMisses)
    ),
    lastCharacterId: String(raw.lastCharacterId || ''),
    // Recently defeated invitations cannot recycle the same person until
    // the region has exhausted its alternative recruitable challengers.
    failedCharacterIds: Array.isArray(raw.failedCharacterIds)
      ? [...new Set(raw.failedCharacterIds.map(String).filter(Boolean))] : [],
    lastWinToken: String(raw.lastWinToken || raw.lastRollToken || ''),
  };
}

// All seven regions share one progress counter, including migrated saves.
export function getGlobalCrewRecruitmentState(source) {
  const all = value(source, 'crewRecruitmentState', {}) || {};
  const previous = Object.entries(all)
    .filter(([key]) => CREW_REGIONS.includes(key))
    .reduce((sum, [,s]) => sum + Math.max(0,
      Number(s?.eligibleWinsSinceInvite ?? s?.misses ?? 0)), 0);
  return {
    eligibleWinsSinceInvite: Math.min(CREW_INVITE_PITY_WINS - 1,
      Math.max(0, Math.floor(Number(all.GLOBAL?.eligibleWinsSinceInvite ?? previous) || 0))),
  };
}

export function getCrewInviteInterest(source, regionId = '') {
  const region = String(regionId || '').toUpperCase();
  const all = value(source, 'crewInviteInterests', {}) || {};
  const legacy = value(source, 'crewInviteInterest', null);
  const interest = region
    ? all[region] || (String(legacy?.regionId || '').toUpperCase() === region ? legacy : null)
    : legacy || CREW_REGIONS.map(key => all[key]).find(Boolean);
  if (interest?.characterId) {
    return { ...interest };
  }

  // One-build migration path: the earlier crew prototype could leave a
  // crewPendingRecruit object in a save. Treat that as an invite interest
  // rather than silently discarding it.
  const legacyPending = value(source, 'crewPendingRecruit', null);
  if (legacyPending && typeof legacyPending === 'object' && legacyPending.characterId &&
      (!region || String(legacyPending.regionId || '').toUpperCase() === region)) {
    return {
      regionId: String(legacyPending.regionId || '').toUpperCase(),
      characterId: String(legacyPending.characterId),
      baseCarId: String(
        legacyPending.baseCarId ||
        getCrewBaseCarId(legacyPending.characterId) ||
        ''
      ),
      locationId: String(legacyPending.locationId || ''),
      createdAt: Math.max(0, Number(legacyPending.offeredAt || Date.now())),
      source: 'legacyPendingRecruit',
    };
  }

  return null;
}

export function clearCrewInviteInterest(registry, regionId = '') {
  if (!registry?.get || !registry?.set) return;
  const region = String(regionId || '').toUpperCase();
  if (!region) {
    registry.set('crewInviteInterests', {});
    registry.set('crewInviteInterest', null);
    registry.set('crewPendingRecruit', null);
    return;
  }
  const all = { ...(registry.get('crewInviteInterests') || {}) };
  delete all[region];
  registry.set('crewInviteInterests', all);
  if (String(registry.get('crewInviteInterest')?.regionId || '').toUpperCase() === region)
    registry.set('crewInviteInterest', null);
  if (String(registry.get('crewPendingRecruit')?.regionId || '').toUpperCase() === region)
    registry.set('crewPendingRecruit', null);
}

export function getCrewRecruitChallenge(source, regionId = '') {
  const region = String(regionId || '').toUpperCase();
  const all = value(source, 'crewRecruitChallenges', {}) || {};
  const legacy = value(source, 'crewRecruitChallenge', null);
  const challenge = region
    ? all[region] || (String(legacy?.regionId || '').toUpperCase() === region ? legacy : null)
    : legacy || CREW_REGIONS.map(key => all[key]).find(Boolean);
  return challenge?.characterId ? { ...challenge } : null;
}

export function setCrewRecruitChallenge(registry, challenge) {
  if (!registry?.get || !registry?.set || !challenge?.regionId) return null;
  const region = String(challenge.regionId).toUpperCase();
  const all = { ...(registry.get('crewRecruitChallenges') || {}) };
  const old = registry.get('crewRecruitChallenge');
  if (old?.regionId && !all[String(old.regionId).toUpperCase()])
    all[String(old.regionId).toUpperCase()] = old;
  all[region] = { ...challenge, regionId: region };
  registry.set('crewRecruitChallenges', all);
  registry.set('crewRecruitChallenge', all[region]);
  return all[region];
}

export function clearCrewRecruitChallenge(registry, regionId = '') {
  if (!registry?.get || !registry?.set) return;
  const region = String(regionId || '').toUpperCase();
  if (!region) {
    registry.set('crewRecruitChallenges', {});
    registry.set('crewRecruitChallenge', null);
    return;
  }
  const all = { ...(registry.get('crewRecruitChallenges') || {}) };
  delete all[region];
  registry.set('crewRecruitChallenges', all);
  if (String(registry.get('crewRecruitChallenge')?.regionId || '').toUpperCase() === region)
    registry.set('crewRecruitChallenge', null);
}

// A lost stock challenge is final: clear every reminder/retry flag and reset
// the global fourth-win pity count. The next offer must be a fresh invitation.
export function resetCrewRecruitmentAfterLoss(registry, challenge) {
  if (!registry?.get || !registry?.set || !challenge?.characterId) return;
  const region = String(challenge.regionId || '').toUpperCase();
  const store = { ...(registry.get('crewRecruitmentState') || {}) };
  const old = { ...(store[region] || {}) };
  const candidates = getRecruitableCrewCandidates(registry, region)
    .map(member => member.characterId);
  const failed = [...new Set([
    ...(Array.isArray(old.failedCharacterIds) ? old.failedCharacterIds : []),
    String(challenge.characterId),
  ])];
  store[region] = {
    ...old, eligibleWinsSinceInvite: 0, misses: 0,
    failedCharacterIds: candidates.length && candidates.every(id => failed.includes(id))
      ? [] : failed,
  };
  store.GLOBAL = { eligibleWinsSinceInvite: 0 };
  registry.set('crewRecruitmentState', store);
  // A hard reset applies to the whole recruitment queue, not merely to the
  // region where the loss occurred. Regional crew membership is unaffected.
  clearCrewInviteInterest(registry);
  clearCrewRecruitChallenge(registry);
}

export function createCrewInviteFromMeetWin(
  registry,
  {
    regionId = '',
    characterId = '',
    locationId = '',
    winToken = '',
  } = {},
  random = Math.random
) {
  const key = String(regionId || '').toUpperCase();
  const rivalId = String(characterId || '');

  if (!registry?.get || !registry?.set) return null;
  if (!key || !rivalId) return null;
  if (!isCrewUnlocked(registry) || isCrewComplete(registry)) return null;
  if (getCrewMemberForRegion(registry, key)) return null;
  // A pending invitation or accepted duel in ANOTHER region is not a blocker.
  if (getCrewInviteInterest(registry, key) ||
      getCrewRecruitChallenge(registry, key)?.active) return null;

  const candidates = getRecruitableCrewCandidates(registry, key);
  const candidate = candidates.find(member => member.characterId === rivalId);
  if (!candidate) return null;

  const state = getCrewRecruitmentState(registry, key);
  // If the player lost to this character, beating their ordinary Meet car
  // again does not issue the same stock challenge. Another driver must offer.
  // If all candidates have been exhausted, reset the pool rather than
  // permanently locking a region out of crew recruitment.
  const exhausted = candidates.length &&
    candidates.every(member => state.failedCharacterIds.includes(member.characterId));
  const previouslyDefeated = !exhausted && state.failedCharacterIds.includes(rivalId);
  const token = String(
    winToken ||
    (locationId + ':' + rivalId + ':' +
      (Number(registry.get('wins') || 0) + Number(registry.get('losses') || 0)))
  );
  if (state.lastWinToken && state.lastWinToken === token) return null;

  const nextEligibleWins =
    getGlobalCrewRecruitmentState(registry).eligibleWinsSinceInvite + 1;
  // Wins against a previously failed opponent still advance global pity,
  // but that same opponent can never issue the next invitation.
  const trigger = !previouslyDefeated && (
    nextEligibleWins >= CREW_INVITE_PITY_WINS ||
    Number(random()) < CREW_INVITE_INTEREST_CHANCE
  );

  const store = { ...(registry.get('crewRecruitmentState') || {}) };
  store[key] = {
    eligibleWinsSinceInvite: trigger ? 0 : Math.min(CREW_INVITE_PITY_WINS - 1, nextEligibleWins),
    misses: trigger ? 0 : Math.min(CREW_INVITE_PITY_WINS - 1, nextEligibleWins),
    lastCharacterId: rivalId,
    failedCharacterIds: exhausted ? [] : state.failedCharacterIds,
    lastWinToken: token,
    lastRollToken: token,
  };
  store.GLOBAL = { eligibleWinsSinceInvite: trigger ? 0 : Math.min(CREW_INVITE_PITY_WINS - 1, nextEligibleWins) };
  registry.set('crewRecruitmentState', store);

  if (!trigger) return null;

  const interest = {
    active: true,
    regionId: key,
    locationId: String(locationId || ''),
    characterId: rivalId,
    baseCarId: String(candidate.baseCarId),
    createdAt: Date.now(),
    source: 'meetWin',
  };
  const invites = { ...(registry.get('crewInviteInterests') || {}) };
  const old = registry.get('crewInviteInterest');
  if (old?.regionId && !invites[String(old.regionId).toUpperCase()])
    invites[String(old.regionId).toUpperCase()] = old;
  invites[key] = interest;
  registry.set('crewInviteInterests', invites);
  registry.set('crewInviteInterest', interest);
  return interest;
}

export function acceptCrewInviteChallenge(
  registry,
  interest = getCrewInviteInterest(registry)
) {
  if (!registry?.get || !registry?.set || !interest?.characterId) return null;

  const regionId = String(interest.regionId || '').toUpperCase();
  const characterId = String(interest.characterId || '');
  if (getCrewMemberForRegion(registry, regionId)) {
    clearCrewInviteInterest(registry, regionId);
    return null;
  }

  const candidate = getRecruitableCrewCandidates(registry, regionId)
    .find(member => member.characterId === characterId);
  if (!candidate) {
    clearCrewInviteInterest(registry, regionId);
    return null;
  }

  const challenge = {
    active: true,
    regionId,
    locationId: String(interest.locationId || ''),
    characterId,
    baseCarId: String(candidate.baseCarId),
    createdAt: Date.now(),
    acceptedAt: Date.now(),
    attempts: 0,
    source: 'meetInvite',
  };

  setCrewRecruitChallenge(registry, challenge);
  clearCrewInviteInterest(registry, regionId);
  return challenge;
}

// Deprecated random-arrival entry point. Keep the export temporarily so stale
// cached MeetScene modules fail closed instead of reintroducing popup recruits.
export function rollCrewRecruitChallenge() {
  return null;
}

export function setPendingCrewRecruit(registry, challenge) {
  if (!registry?.set || !challenge?.characterId || !challenge?.regionId) return null;
  const pending = {
    regionId: String(challenge.regionId).toUpperCase(),
    characterId: String(challenge.characterId),
    baseCarId: String(challenge.baseCarId || getCrewBaseCarId(challenge.characterId) || ''),
    offeredAt: Date.now(),
  };
  registry.set('crewPendingRecruit', pending);
  clearCrewRecruitChallenge(registry, pending.regionId);
  return pending;
}

export function completeCrewRecruitChallenge(
  registry,
  challenge = registry?.get?.('crewRecruitChallenge')
) {
  if (!registry?.get || !registry?.set || !challenge?.characterId) return null;

  const pending = {
    regionId: String(challenge.regionId || '').toUpperCase(),
    characterId: String(challenge.characterId),
    baseCarId: String(
      challenge.baseCarId ||
      getCrewBaseCarId(challenge.characterId) ||
      ''
    ),
    offeredAt: Date.now(),
  };

  return acceptCrewMember(registry, pending);
}

export function acceptCrewMember(registry, pending = registry?.get?.('crewPendingRecruit')) {
  if (!registry?.get || !registry?.set || !pending) return null;

  const regionId = String(pending.regionId || '').toUpperCase();
  const characterId = String(pending.characterId || '');
  const allowed = isRecruitableRegionalCharacter(regionId, characterId);
  if (!allowed || getCrewMemberForRegion(registry, regionId)) return null;

  const baseCarId = String(pending.baseCarId || getCrewBaseCarId(characterId) || '');
  if (!cars[baseCarId]) return null;

  const loanCarId = getCrewLoanCarId(characterId);
  if (!cars[loanCarId]) return null;

  const members = { ...(registry.get('crewMembers') || {}) };
  members[regionId] = {
    regionId,
    characterId,
    baseCarId,
    loanCarId,
    recruitedAt: Date.now(),
  };

  const owned = [...new Set([...(registry.get('ownedCarIds') || []), loanCarId])];
  const states = { ...(registry.get('carStates') || {}) };
  const locations = { ...(registry.get('carGarageLocations') || {}) };

  states[loanCarId] = createStockCrewCarState(characterId, baseCarId);
  locations[loanCarId] = CREW_WAREHOUSE_ID;

  registry.set('crewMembers', members);
  registry.set('ownedCarIds', owned);
  registry.set('carStates', states);
  registry.set('carGarageLocations', locations);
  clearCrewInviteInterest(registry, regionId);
  clearCrewRecruitChallenge(registry, regionId);
  registry.set('crewPendingRecruit', null);
  return members[regionId];
}

export function declinePendingCrewRecruit(registry) {
  if (!registry?.set) return;
  registry.set('crewPendingRecruit', null);
  clearCrewInviteInterest(registry);
  clearCrewRecruitChallenge(registry);
}

export function removeAllCrewMembers(registry) {
  if (!registry?.get || !registry?.set) return [];

  const removed = [];
  CREW_REGIONS.forEach(regionId => {
    const member = removeCrewMember(registry, regionId);
    if (member) removed.push(member);
  });

  registry.set('selectedRacePlayerCharacterId', null);
  registry.set('crewPendingRecruit', null);
  clearCrewInviteInterest(registry);
  clearCrewRecruitChallenge(registry);
  registry.set('crewBattleState', null);
  return removed;
}

export function recruitRandomDevCrew(registry, random = Math.random) {
  if (!registry?.get || !registry?.set) return [];
  if (!Boolean(value(registry, 'devMode', false))) return [];

  removeAllCrewMembers(registry);

  const recruited = [];
  CREW_REGIONS.forEach(regionId => {
    const candidates = getRecruitableRegionalMembers(regionId)
      .filter(candidate =>
        cars[candidate.baseCarId] &&
        cars[getCrewLoanCarId(candidate.characterId)]
      );
    if (!candidates.length) return;

    const roll = Math.max(0, Math.min(0.999999, Number(random()) || 0));
    const candidate = candidates[Math.floor(roll * candidates.length)];
    const member = acceptCrewMember(registry, {
      regionId,
      characterId: candidate.characterId,
      baseCarId: candidate.baseCarId,
      offeredAt: Date.now(),
      source: 'devRandomCrew',
    });
    if (member) recruited.push(member);
  });

  registry.set('selectedRacePlayerCharacterId', null);
  return recruited;
}

export function removeCrewMember(registry, regionId) {
  if (!registry?.get || !registry?.set) return null;
  const key = String(regionId || '').toUpperCase();
  const members = { ...(registry.get('crewMembers') || {}) };
  const member = members[key];
  if (!member) return null;

  const loanCarId = String(member.loanCarId || getCrewLoanCarId(member.characterId));
  const owned = (registry.get('ownedCarIds') || []).filter(id => id !== loanCarId);
  const states = { ...(registry.get('carStates') || {}) };
  const locations = { ...(registry.get('carGarageLocations') || {}) };
  delete states[loanCarId];
  delete locations[loanCarId];
  delete members[key];
  const receipts = { ...(registry.get('crewRecruitJoinReceipts') || {}) };
  delete receipts[key];
  registry.set('crewRecruitJoinReceipts', receipts);

  registry.set('crewMembers', members);
  registry.set('ownedCarIds', owned);
  registry.set('carStates', states);
  registry.set('carGarageLocations', locations);
  registry.set('crewPendingRecruit', null);
  registry.set('crewInviteInterest', null);

  if (registry.get('selectedCarId') === loanCarId) {
    registry.set('selectedCarId', owned.find(id => !cars[id]?.crewLoan) || owned[0] || null);
  }

  return member;
}

export function getPlayerCrewCarId(source) {
  const owned = (value(source, 'ownedCarIds', []) || []).filter(id => cars[id]);
  const selected = String(value(source, 'selectedCarId', '') || '');
  if (selected && owned.includes(selected) && !cars[selected]?.crewLoan) return selected;

  const remembered = String(value(source, 'crewPreviousCarId', '') || '');
  if (remembered && owned.includes(remembered) && !cars[remembered]?.crewLoan) {
    return remembered;
  }

  return owned.find(id => !cars[id]?.crewLoan) || null;
}

export function getCrewBattleUnits(source) {
  // Crew battles are exclusive to the recruited team: only loan cars and their
  // recruited drivers are eligible. The player and ordinary garage cars sit out.
  const units = [];
  const members = getCrewMembers(source);

  CREW_REGIONS.forEach(regionId => {
    const member = members[regionId];
    if (!member?.loanCarId || !cars[member.loanCarId]) return;
    units.push({
      id: regionId,
      regionId,
      characterId: member.characterId,
      carId: member.loanCarId,
      player: false,
    });
  });

  return units;
}

// Regional leaders are team captains, not the third racing opponent.
export function getCrewBattleCaptainId(regionId) {
  return getRegionalCrewRoster(regionId)?.mainRivalId || null;
}

export function buildRegionalCrewBattleRounds(regionId, source = null) {
  const key = String(regionId || '').toUpperCase();
  const rules = getCrewBattleRegionRules(key);
  if (!rules) return [];
  const recruitedIds = getRecruitedCrewCharacterIds(source);
  const captainId = getCrewBattleCaptainId(key);
  const originalSeven = buildTunerTeamChallengeRounds(key, '')
    .filter(round => round?.characterId && round?.carId);

  // Five non-captain opponents remain after one recruit joins the player.
  // Stable identity/order keeps the scout panel true to the actual heats.
  const candidates = originalSeven.filter(round =>
    round.characterId !== captainId && !recruitedIds.has(round.characterId)
  );
  const used = new Set();
  const rounds = [];

  // The first three regions teach crew racing with quarter-mile standing
  // starts only. Subsequent districts introduce rolling and half-mile heats.
  const formats = {
    ODAIBA: [['Standing Start', 402.336], ['Standing Start', 402.336], ['Standing Start', 402.336]],
    SHINAGAWA: [['Standing Start', 402.336], ['Standing Start', 402.336], ['Standing Start', 402.336]],
    TATSUMI: [['Standing Start', 402.336], ['Standing Start', 402.336], ['Standing Start', 402.336]],
    SHIBUYA: [['Standing Start', 402.336], ['Roll Race', 402.336], ['Standing Start', 402.336]],
    YOKOHAMA: [['Standing Start', 402.336], ['Roll Race', 402.336], ['Standing Start', 804.672]],
    DAIKOKU: [['Roll Race', 402.336], ['Standing Start', 804.672], ['Standing Start', 402.336]],
    SHINJUKU: [['Standing Start', 402.336], ['Roll Race', 402.336], ['Standing Start', 804.672]],
  };

  for (let index = 0; index < CREW_BATTLE_LINEUP_SIZE; index++) {
    const rule = getCrewBattleHeatRule(key, index);
    const [raceType, distanceM] = formats[key]?.[index] || ['Standing Start', 402.336];
    const rating = Math.min(5, rules.build + (index === 2 && rules.build < 5 ? 1 : 0));
    const encounterRating = rules.ai[index];
    const baseAi = getEncounterAi(encounterRating);

    // Author AI hardware to meet the same rules as the player. Build rating
    // may decrease until the finished car is legal, but driver skill does not
    // change. Never secretly power-trim an over-limit rival during the race.
    const ranked = candidates.filter(r => !used.has(r.characterId)).map(candidate => {
      if (rule.stock) {
        const setup = getCrewEventCarSetup(candidate.carId,
          eventStockState({ buildRating: 1, buildArchetype: 'stock' }), rule);
        return { candidate, setup };
      }
      for (let targetRating = rating; targetRating >= 1; targetRating--) {
        const baseBuild = createRivalBuildState(cars[candidate.carId], targetRating, {
          seed: 'crew-battle:' + key + ':' + candidate.characterId,
          raceType,
          noNos: Boolean(rule.noNos),
        });
        const setup = getCrewEventCarSetup(candidate.carId, baseBuild, rule);
        if (setup.eligible) return { candidate, setup };
      }
      return { candidate, setup: { eligible: false } };
    });
    const matched = ranked.find(item => item.setup.eligible);
    if (!matched) break;
    const baseRound = matched.candidate;
    used.add(baseRound.characterId);
    const state = matched.setup.state;
    rounds.push({
      index,
      regionId: key,
      characterId: baseRound.characterId,
      carId: baseRound.carId,
      raceType,
      distanceM,
      buildRating: Number(state.buildRating || rating),
      opponentBuildState: state,
      opponentPowerKW: matched.setup.powerKW,
      scout: getCrewBattleScout(state),
      rule: { ...rule },
      ruleLabel: rule.label,
      encounterRating,
      encounterAi: { ...baseAi },
      difficulty: encounterRating >= 5 ? 'ELITE' :
        encounterRating >= 4 ? 'EXPERT' : 'SKILLED',
      leader: false,
    });
  }
  return rounds;
}

export function getRegionalCrewBattleReward(regionId) {
  const key = String(regionId || '').toUpperCase();
  const rank = Math.max(1, CREW_REGIONS.indexOf(key) + 1);
  const mainRivalId = getRegionalCrewRoster(key)?.mainRivalId || null;
  const mainRivalRound = buildTunerTeamChallengeRounds(key, '')
    .find(round => round.characterId === mainRivalId);

  return {
    cash: 500000 + rank * 100000,
    couponCarId: mainRivalRound?.carId || null,
    label: key + ' CREW BADGE',
  };
}

export function markCrewBattleCompleted(registry, regionId, playerScore = CREW_BATTLE_WINS_REQUIRED) {
  if (!registry?.get || !registry?.set) return null;
  const key = String(regionId || '').toUpperCase();
  const progress = { ...(registry.get('crewBattleProgress') || {}) };
  const previous = progress[key] || {};

  progress[key] = {
    completed: true,
    completedAt: previous.completedAt || Date.now(),
    bestScore: Math.max(Number(previous.bestScore || 0), Number(playerScore || 0)),
  };
  registry.set('crewBattleProgress', progress);

  if (CREW_REGIONS.every(id => Boolean(progress[id]?.completed))) {
    registry.set('tokyoChampionshipInvited', true);
  }

  return progress[key];
}
