import { cars } from './cars.js?v=20261005-r343';
import {
  CREW_REGIONS,
  getRegionalCrewRoster,
  getRecruitableRegionalMembers,
  getCrewBaseCarId,
  getCrewLoanCarId,
} from './crewRoster.js?v=20261005-r343';
import { getRegionalChampionshipCount } from './careerProgression.js?v=20260929-r272';
import { createRivalBuildState } from './rivalBuilds.js?v=20260928-r234';
import { getEncounterAi } from './encounterProfiles.js?v=20261005-r334';

export const CREW_UNLOCK_CHAMPIONSHIPS = 7;
export const CREW_RECRUIT_CHALLENGE_CHANCE = 0.35;
export const CREW_RECRUIT_OFFER_CHANCE = 0.60;
export const CREW_RECRUIT_PITY_ROLLS = 3;
export const CREW_BATTLE_LINEUP_SIZE = 6;
export const CREW_BATTLE_WINS_REQUIRED = 4;
export const CREW_BATTLE_COUPONS = 2;
export const CREW_WAREHOUSE_ID = 'shinonomeWarehouseStrip';

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
      .filter(regionId => raw[regionId]?.characterId)
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

export function getRecruitableCrewCandidates(source, regionId) {
  const key = String(regionId || '').toUpperCase();
  if (!isCrewUnlocked(source) || getCrewMemberForRegion(source, key)) return [];

  const playerCharacterId = String(value(source, 'playerCharacterId', '') || '');
  return getRecruitableRegionalMembers(key)
    .filter(member => member.characterId !== playerCharacterId)
    .filter(member => cars[member.baseCarId])
    .map(member => ({ ...member, regionId: key }));
}

export function getCrewRecruitmentState(source, regionId) {
  const key = String(regionId || '').toUpperCase();
  const store = value(source, 'crewRecruitmentState', {}) || {};
  const raw = store[key] || {};
  return {
    regionId: key,
    misses: Math.max(0, Number(raw.misses || 0)),
    lastCharacterId: String(raw.lastCharacterId || ''),
    lastRollToken: String(raw.lastRollToken || ''),
  };
}

export function rollCrewRecruitChallenge(registry, regionId, locationId, random = Math.random) {
  const key = String(regionId || '').toUpperCase();
  if (!registry?.get || !registry?.set) return null;
  if (!isCrewUnlocked(registry) || isCrewComplete(registry)) return null;
  if (getCrewMemberForRegion(registry, key)) return null;
  if (registry.get('crewPendingRecruit') || registry.get('crewRecruitChallenge')) return null;

  const candidates = getRecruitableCrewCandidates(registry, key);
  if (!candidates.length) return null;

  const activityCount =
    Math.max(0, Number(registry.get('wins') || 0)) +
    Math.max(0, Number(registry.get('losses') || 0));
  const token = String(locationId || key) + ':' + activityCount;
  const state = getCrewRecruitmentState(registry, key);
  if (state.lastRollToken === token) return null;

  const nextMisses = state.misses + 1;
  const trigger =
    nextMisses >= CREW_RECRUIT_PITY_ROLLS ||
    random() < CREW_RECRUIT_CHALLENGE_CHANCE;

  const store = { ...(registry.get('crewRecruitmentState') || {}) };

  if (!trigger) {
    store[key] = {
      ...state,
      misses: nextMisses,
      lastRollToken: token,
    };
    registry.set('crewRecruitmentState', store);
    return null;
  }

  const alternate = candidates.filter(item => item.characterId !== state.lastCharacterId);
  const pool = alternate.length ? alternate : candidates;
  const selected = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  if (!selected) return null;

  const challenge = {
    active: true,
    regionId: key,
    locationId: String(locationId || ''),
    characterId: selected.characterId,
    baseCarId: selected.baseCarId,
    createdAt: Date.now(),
  };

  store[key] = {
    ...state,
    misses: 0,
    lastCharacterId: selected.characterId,
    lastRollToken: token,
  };
  registry.set('crewRecruitmentState', store);
  registry.set('crewRecruitChallenge', challenge);
  return challenge;
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

export function acceptCrewMember(registry, pending = registry?.get?.('crewPendingRecruit')) {
  if (!registry?.get || !registry?.set || !pending) return null;

  const regionId = String(pending.regionId || '').toUpperCase();
  const characterId = String(pending.characterId || '');
  const roster = getRegionalCrewRoster(regionId);
  const allowed = roster?.members?.some(
    member => member.recruitable && member.characterId === characterId
  );
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
  registry.set('crewRecruitChallenge', null);
  return members[regionId];
}

export function declinePendingCrewRecruit(registry) {
  if (!registry?.set) return;
  registry.set('crewPendingRecruit', null);
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
  const playerCharacterId = String(value(source, 'playerCharacterId', 'renMizuno'));
  const playerCarId = getPlayerCrewCarId(source);
  const units = [];

  if (playerCarId && cars[playerCarId]) {
    units.push({
      id: 'PLAYER',
      regionId: 'PLAYER',
      characterId: playerCharacterId,
      carId: playerCarId,
      player: true,
    });
  }

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
  const roster = getRegionalCrewRoster(key);
  if (!roster) return [];

  // The driver recruited from this region has left their old team. The return
  // crew battle is therefore leader + the four non-recruited teammates.
  const recruitedCharacterId = source
    ? getCrewMemberForRegion(source, key)?.characterId
    : null;
  const opponents = roster.members.filter(
    member => member.characterId !== recruitedCharacterId
  );
  const rank = Math.max(1, CREW_REGIONS.indexOf(key) + 1);

  return opponents.map((member, index) => {
    const raceType = index % 3 === 1 ? 'Roll Race' : 'Standing Start';
    const buildRating = regionalBuildRating(rank, index);
    const encounterRating = regionalDriverRating(rank, index);
    const leader = Boolean(member.leader);
    const baseAi = getEncounterAi(encounterRating);
    const encounterAi = leader ? proLeaderAi(baseAi) : { ...baseAi };
    const opponentBuildState = createRivalBuildState(
      cars[member.baseCarId],
      buildRating,
      {
        seed: 'crew-battle:' + key + ':' + member.characterId,
        raceType,
      }
    );

    return {
      index,
      regionId: key,
      characterId: member.characterId,
      carId: member.baseCarId,
      raceType,
      distanceM: index >= 3 ? 804.672 : 402.336,
      buildRating,
      opponentBuildState,
      encounterRating,
      encounterAi,
      difficulty: leader ? 'PRO' : encounterRating >= 5 ? 'ELITE' : 'EXPERT',
      leader,
    };
  }).slice(0, CREW_BATTLE_LINEUP_SIZE);
}

export function getRegionalCrewBattleReward(regionId) {
  const key = String(regionId || '').toUpperCase();
  const rank = Math.max(1, CREW_REGIONS.indexOf(key) + 1);
  const roster = getRegionalCrewRoster(key);
  const leader = roster?.members?.find(member => member.leader) ||
    roster?.members?.[roster.members.length - 1];

  return {
    cash: 500000 + rank * 100000,
    couponCarId: leader?.baseCarId || null,
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
