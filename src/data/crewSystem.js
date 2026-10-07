import { cars } from './cars.js?v=20261006-r388';
import {
  CREW_REGIONS,
  getRegionalCrewRoster,
  getRecruitableRegionalMembers,
  isRecruitableRegionalCharacter,
  getCrewBaseCarId,
  getCrewLoanCarId,
} from './crewRoster.js?v=20261007-r410';
import { getRegionalChampionshipCount } from './careerProgression.js?v=20260929-r272';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import { getEncounterAi } from './encounterProfiles.js?v=20261005-r334';
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261006-r388';
import { buildTunerTeamChallengeRounds } from './tunerChallenges.js?v=20261007-r404';

export const CREW_UNLOCK_CHAMPIONSHIPS = 7;
export const CREW_INVITE_INTEREST_CHANCE = 0.25;
export const CREW_INVITE_PITY_WINS = 4;

// Legacy aliases remain exported so a stale PWA module cannot crash while the
// new scene bundle rolls out. The random arrival mechanic itself is disabled.
export const CREW_RECRUIT_CHALLENGE_CHANCE = CREW_INVITE_INTEREST_CHANCE;
export const CREW_RECRUIT_OFFER_CHANCE = 1;
export const CREW_RECRUIT_PITY_ROLLS = CREW_INVITE_PITY_WINS;
export const CREW_BATTLE_LINEUP_SIZE = 6;
export const CREW_BATTLE_WINS_REQUIRED = 4;
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
    paintColor: 0xffffff,
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
    paintColor: 0xffffff,
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
  if (Boolean(state.nosInstalled)) return false;
  return (
    sumNumericTree(state.tuning) === 0 &&
    sumNumericTree(state.drivetrainTuning) === 0 &&
    sumNumericTree(state.chassisTuning) === 0 &&
    sumNumericTree(state.exhaustNosTuning) === 0
  );
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

export const CREW_RECRUIT_POWER_CLASS_KW = 50;

function normaliseCrewRecruitDifficulty(source) {
  const key = String(value(source, 'playerDifficulty', 'STANDARD') || 'STANDARD')
    .trim()
    .toUpperCase();
  return ['EASY', 'STANDARD', 'HARD'].includes(key) ? key : 'STANDARD';
}

function getCrewRecruitPowerClass(powerKW) {
  const power = Math.max(0, Number(powerKW) || 0);
  const minKW = Math.floor(power / CREW_RECRUIT_POWER_CLASS_KW) * CREW_RECRUIT_POWER_CLASS_KW;
  const maxExclusiveKW = minKW + CREW_RECRUIT_POWER_CLASS_KW;
  return {
    minKW,
    maxExclusiveKW,
    label: minKW + '–' + (maxExclusiveKW - 1) + ' kW',
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

  if (difficulty === 'EASY') {
    return {
      playerDifficulty: difficulty,
      aiTier: null,
      aiRating: null,
      carRule: 'STOCK',
      powerClass: null,
      powerClassLabel: null,
      eligibleCarIds: getStockCrewChallengeCarIds(source),
    };
  }

  const opponentPerformance = baseCarId
    ? getVehiclePerformance(baseCarId, createStockOpponentState(baseCarId))
    : null;
  const powerClass = getCrewRecruitPowerClass(
    opponentPerformance?.car?.powerKW ?? cars[baseCarId]?.powerKW ?? 0
  );

  const eligibleCarIds = ownedCarIds.filter(carId => {
    const performance = getVehiclePerformance(carId, states[carId] || {});
    const power = Number(performance?.car?.powerKW || 0);
    return power >= powerClass.minKW && power < powerClass.maxExclusiveKW;
  });

  return {
    playerDifficulty: difficulty,
    aiTier: difficulty === 'HARD' ? 'ELITE' : 'EXPERT',
    aiRating: difficulty === 'HARD' ? 5 : 4,
    carRule: 'POWER_CLASS',
    powerClass,
    powerClassLabel: powerClass.label,
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
    lastWinToken: String(raw.lastWinToken || raw.lastRollToken || ''),
  };
}

export function getCrewInviteInterest(source) {
  const interest = value(source, 'crewInviteInterest', null);
  if (interest && typeof interest === 'object' && interest.characterId) {
    return { ...interest };
  }

  // One-build migration path: the earlier crew prototype could leave a
  // crewPendingRecruit object in a save. Treat that as an invite interest
  // rather than silently discarding it.
  const legacy = value(source, 'crewPendingRecruit', null);
  if (legacy && typeof legacy === 'object' && legacy.characterId) {
    return {
      regionId: String(legacy.regionId || '').toUpperCase(),
      characterId: String(legacy.characterId),
      baseCarId: String(
        legacy.baseCarId ||
        getCrewBaseCarId(legacy.characterId) ||
        ''
      ),
      locationId: String(legacy.locationId || ''),
      createdAt: Math.max(0, Number(legacy.offeredAt || Date.now())),
      source: 'legacyPendingRecruit',
    };
  }

  return null;
}

export function clearCrewInviteInterest(registry) {
  if (!registry?.set) return;
  registry.set('crewInviteInterest', null);
  registry.set('crewPendingRecruit', null);
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
  if (
    getCrewInviteInterest(registry) ||
    registry.get('crewRecruitChallenge')
  ) return null;

  const candidate = getRecruitableCrewCandidates(registry, key)
    .find(member => member.characterId === rivalId);
  if (!candidate) return null;

  const state = getCrewRecruitmentState(registry, key);
  const token = String(
    winToken ||
    (locationId + ':' + rivalId + ':' +
      (Number(registry.get('wins') || 0) + Number(registry.get('losses') || 0)))
  );
  if (state.lastWinToken && state.lastWinToken === token) return null;

  const nextEligibleWins = state.eligibleWinsSinceInvite + 1;
  const trigger =
    nextEligibleWins >= CREW_INVITE_PITY_WINS ||
    Number(random()) < CREW_INVITE_INTEREST_CHANCE;

  const store = { ...(registry.get('crewRecruitmentState') || {}) };
  store[key] = {
    eligibleWinsSinceInvite: trigger ? 0 : nextEligibleWins,
    misses: trigger ? 0 : nextEligibleWins,
    lastCharacterId: rivalId,
    lastWinToken: token,
    lastRollToken: token,
  };
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
  registry.set('crewInviteInterest', interest);
  registry.set('crewPendingRecruit', null);
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
    clearCrewInviteInterest(registry);
    return null;
  }

  const candidate = getRecruitableCrewCandidates(registry, regionId)
    .find(member => member.characterId === characterId);
  if (!candidate) {
    clearCrewInviteInterest(registry);
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

  registry.set('crewRecruitChallenge', challenge);
  clearCrewInviteInterest(registry);
  return challenge;
}

// Deprecated random-arrival entry point. Keep the export temporarily so stale
// cached MeetScene modules fail closed instead of reintroducing popup recruits.
export function rollCrewRecruitChallenge() {
  return null;
}

export function clearCrewRecruitChallenge(registry) {
  if (!registry?.set) return;
  registry.set('crewRecruitChallenge', null);
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
  registry.set('crewRecruitChallenge', null);
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
  registry.set('crewPendingRecruit', null);
  registry.set('crewInviteInterest', null);
  registry.set('crewRecruitChallenge', null);
  return members[regionId];
}

export function declinePendingCrewRecruit(registry) {
  if (!registry?.set) return;
  registry.set('crewPendingRecruit', null);
  registry.set('crewInviteInterest', null);
  registry.set('crewRecruitChallenge', null);
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

function regionalBuildRating(rank, index) {
  const base = rank <= 2 ? 3 : rank <= 5 ? 4 : 5;
  return Math.min(5, base + (index >= 4 ? 1 : 0));
}

function regionalDriverRating(rank, index) {
  if (rank >= 6) return 5;
  if (rank >= 3) return index >= 3 ? 5 : 4;
  return index >= 4 ? 5 : 4;
}

function proLeaderAi(base = {}) {
  return {
    ...base,
    reactionSkill: Math.max(0.97, Number(base.reactionSkill || 0)),
    launchSkill: Math.max(0.98, Number(base.launchSkill || 0)),
    shiftSkill: Math.max(0.99, Number(base.shiftSkill || 0)),
    aggression: Math.max(0.96, Number(base.aggression || 0)),
  };
}

export function buildRegionalCrewBattleRounds(regionId, source = null) {
  const key = String(regionId || '').toUpperCase();
  const recruitedCharacterId = source
    ? getCrewMemberForRegion(source, key)?.characterId
    : null;

  // Reuse the original seven-driver regional championship cast. Once one of
  // those drivers defects to the player's crew, exactly six remain.
  const originalSeven = buildTunerTeamChallengeRounds(key, '')
    .filter(round => round?.characterId && round?.carId);
  const remaining = originalSeven
    .filter(round => round.characterId !== recruitedCharacterId);

  // Keep the permanent regional leader as the sixth/final matchup even when
  // the championship roster's authored order placed them earlier.
  const leaderCharacterId = getRegionalCrewRoster(key)?.mainRivalId || null;
  const opponents = [
    ...remaining.filter(round => round.characterId !== leaderCharacterId),
    ...remaining.filter(round => round.characterId === leaderCharacterId),
  ].slice(0, CREW_BATTLE_LINEUP_SIZE);

  const rank = Math.max(1, CREW_REGIONS.indexOf(key) + 1);

  return opponents.map((baseRound, index) => {
    const raceType = index % 3 === 1 ? 'Roll Race' : 'Standing Start';
    const buildRating = regionalBuildRating(rank, index);
    const encounterRating = regionalDriverRating(rank, index);
    const leader = baseRound.characterId === leaderCharacterId;
    const baseAi = getEncounterAi(encounterRating);
    const encounterAi = leader ? proLeaderAi(baseAi) : { ...baseAi };
    const opponentBuildState = createRivalBuildState(
      cars[baseRound.carId],
      buildRating,
      {
        seed: 'crew-battle:' + key + ':' + baseRound.characterId,
        raceType,
      }
    );

    return {
      index,
      regionId: key,
      characterId: baseRound.characterId,
      carId: baseRound.carId,
      raceType,
      distanceM: index >= 3 ? 804.672 : 402.336,
      buildRating,
      opponentBuildState,
      encounterRating,
      encounterAi,
      difficulty: leader ? 'PRO' : encounterRating >= 5 ? 'ELITE' : 'EXPERT',
      leader,
    };
  });
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
