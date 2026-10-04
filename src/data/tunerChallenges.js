import {
  characters,
  REGION_TEAM_CHARACTER_IDS,
  genericRivalCharacterOrder,
} from './characters.js?v=20261004-r333';
import { getEncounterAi } from './encounterProfiles.js?v=20260923-r162';

export const TUNER_TEAM_CHALLENGE_WINS = 10;
export const TUNER_TEAM_CHALLENGE_TOTAL_WINS = 12;
export const TUNER_TEAM_CHALLENGE_MIN_GARAGE_TIER = 1;
export const TUNER_TEAM_CHALLENGE_STAGES = 7;
export const TUNER_TEAM_COMPLETION_REWARD = 250000;
export const TUNER_TEAM_PERFECT_REWARD = 250000;
export const TUNER_TEAM_INVITE_CHANCE = 0.30;
export const TUNER_TEAM_PITY_ARRIVALS = 4;
export const TUNER_TEAM_REOFFER_MIN_VISITS = 5;
export const TUNER_TEAM_REOFFER_MAX_VISITS = 10;

export const REGION_CHAMPIONSHIP_ORDER = Object.freeze([
  'ODAIBA',
  'SHINAGAWA',
  'TATSUMI',
  'SHIBUYA',
  'YOKOHAMA',
  'DAIKOKU',
  'SHINJUKU',
]);

export function getRegionalChampionshipRank(regionId) {
  const key = String(regionId || '').trim().toUpperCase();
  const index = REGION_CHAMPIONSHIP_ORDER.indexOf(key);
  return index >= 0 ? index + 1 : null;
}

const sourceValue = (source, key, fallback = null) => {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
};

const REGION_OFFSETS = {
  ODAIBA: 0,
  SHINAGAWA: 1,
  TATSUMI: 2,
  SHIBUYA: 3,
  SHINJUKU: 4,
  YOKOHAMA: 5,
  DAIKOKU: 0,
};

const REGION_CARS = {
  // Temporary Option 2 pools using the current roster. These are intentionally
  // progression-ordered and may duplicate cars until the full 42-car roster lands.
  ODAIBA: ['ej1', 'ae86', 'ef', 'a60', 'fc3s', 'ek9', 'ek9'],
  SHINAGAWA: ['ae86', 'ef', 'a60', 'ek9', 'fc3s', 'rx8', 'rx8'],
  TATSUMI: ['a60', 'ek9', 'fc3s', 'rx8', 's2000', 'evo3', 'evo3'],
  SHIBUYA: ['fc3s', 'ek9', 'rx8', 's2000', 'evo3', 'r32', 'r32'],

  // Rank 5: final Canal Yard / Level 2 graduation region.
  YOKOHAMA: ['rx8', 's2000', 'evo3', 'rx7fd', 'evo5', 'r32', 'r32'],

  // Rank 6: Warehouse-era region.
  DAIKOKU: ['s2000', 'evo3', 'r32', 'rx7fd', 'nsx', '3000gt', '3000gt'],

  // Rank 7: hardest regional championship.
  SHINJUKU: ['wrx22b', 'evo5', 'evo6', 'jza80', 'r34', '3000gt', '3000gt'],
};

const REGION_RACE_PATTERNS = {
  ODAIBA: [
    ['Standing Start', 402.336],
    ['Roll Race', 402.336],
    ['Standing Start', 402.336],
    ['Roll Race', 804.672],
    ['Standing Start', 804.672],
    ['Roll Race', 804.672],
    ['Standing Start', 804.672],
  ],
  SHINAGAWA: [
    ['Standing Start', 402.336],
    ['Roll Race', 402.336],
    ['Standing Start', 402.336],
    ['Roll Race', 402.336],
    ['Standing Start', 804.672],
    ['Roll Race', 804.672],
    ['Standing Start', 402.336],
  ],
  TATSUMI: [
    ['Roll Race', 402.336],
    ['Standing Start', 402.336],
    ['Roll Race', 804.672],
    ['Standing Start', 402.336],
    ['Roll Race', 804.672],
    ['Standing Start', 804.672],
    ['Roll Race', 804.672],
  ],
  SHIBUYA: [
    ['Roll Race', 402.336],
    ['Standing Start', 402.336],
    ['Roll Race', 402.336],
    ['Standing Start', 804.672],
    ['Roll Race', 804.672],
    ['Standing Start', 402.336],
    ['Roll Race', 804.672],
  ],
  SHINJUKU: [
    ['Roll Race', 804.672],
    ['Roll Race', 402.336],
    ['Standing Start', 402.336],
    ['Roll Race', 804.672],
    ['Standing Start', 804.672],
    ['Roll Race', 804.672],
    ['Roll Race', 804.672],
  ],
  YOKOHAMA: [
    ['Standing Start', 402.336],
    ['Roll Race', 804.672],
    ['Standing Start', 804.672],
    ['Roll Race', 402.336],
    ['Standing Start', 402.336],
    ['Roll Race', 804.672],
    ['Standing Start', 804.672],
  ],
  DAIKOKU: [
    ['Standing Start', 402.336],
    ['Roll Race', 402.336],
    ['Standing Start', 804.672],
    ['Roll Race', 804.672],
    ['Standing Start', 402.336],
    ['Roll Race', 804.672],
    ['Standing Start', 804.672],
  ],
};

const STAGE_RATINGS = [4, 4, 4, 5, 5, 5, 5];

function normaliseRegion(regionId) {
  return String(regionId || '').trim().toUpperCase();
}

export function getTunerTeamChallengeState(source, regionId) {
  const key = normaliseRegion(regionId);
  const all = sourceValue(source, 'tunerTeamChallenges', {}) || {};
  const raw = all[key] && typeof all[key] === 'object' ? all[key] : {};

  const legacyCompleted = Boolean(raw.completed);
  const hasNewRewardState =
    raw.championEarned != null ||
    raw.perfectEarned != null ||
    raw.championRewardClaimed != null ||
    raw.perfectRewardClaimed != null;
  const championEarned = Boolean(raw.championEarned || legacyCompleted);
  const legacyPerfect =
    !hasNewRewardState &&
    legacyCompleted &&
    raw.perfectEligible !== false;
  const perfectEarned = Boolean(raw.perfectEarned || legacyPerfect);

  return {
    regionId: key,
    invited: Boolean(raw.invited),
    offeredOnce: Boolean(raw.offeredOnce || raw.invited || Number(raw.stage || 0) > 0),
    reofferVisitsRemaining: Math.max(0, Number(raw.reofferVisitsRemaining || 0)),
    completed: legacyCompleted || championEarned,
    championEarned,
    perfectEarned,
    championRewardClaimed: raw.championRewardClaimed == null
      ? (!hasNewRewardState && legacyCompleted && legacyPerfect)
      : Boolean(raw.championRewardClaimed),
    perfectRewardClaimed: raw.perfectRewardClaimed == null
      ? legacyPerfect
      : Boolean(raw.perfectRewardClaimed),
    perfectAttempt: Boolean(raw.perfectAttempt),
    stage: Math.max(0, Math.min(TUNER_TEAM_CHALLENGE_STAGES, Number(raw.stage || 0))),
    misses: Math.max(0, Number(raw.misses || 0)),
    perfectEligible: raw.perfectEligible !== false,
    activeSession: Boolean(raw.activeSession),
    paused: Boolean(raw.paused),
    pausedAt: Math.max(0, Number(raw.pausedAt || 0)),
    retryNotBefore: Math.max(0, Number(raw.retryNotBefore || 0)),
    rounds: Array.isArray(raw.rounds) ? raw.rounds : [],
    offeredAt: String(raw.offeredAt || ''),
    playerCarId: String(raw.playerCarId || ''),
    completedAt: Math.max(0, Number(raw.completedAt || 0)),
    perfectAt: Math.max(0, Number(raw.perfectAt || 0)),
  };
}

export function isTunerTeamChallengeEligible(source, regionId) {
  const state = getTunerTeamChallengeState(source, regionId);

  if (state.championEarned) return !state.perfectEarned;

  const regionWins = sourceValue(source, 'regionWins', {}) || {};
  const wins = Math.max(0, Number(regionWins[state.regionId] || 0));
  const totalWins = Math.max(0, Number(sourceValue(source, 'wins', 0) || 0));
  const garageTier = Math.max(0, Number(sourceValue(source, 'garageTier', 0) || 0));

  return wins >= TUNER_TEAM_CHALLENGE_WINS
    && totalWins >= TUNER_TEAM_CHALLENGE_TOTAL_WINS
    && garageTier >= TUNER_TEAM_CHALLENGE_MIN_GARAGE_TIER;
}

export function getTunerTeamChallengeRoster(regionId, playerCharacterId = '') {
  const key = normaliseRegion(regionId);
  const explicit = Array.isArray(REGION_TEAM_CHARACTER_IDS[key])
    ? REGION_TEAM_CHARACTER_IDS[key]
    : [];

  const base = explicit.length >= TUNER_TEAM_CHALLENGE_STAGES
    ? explicit
    : genericRivalCharacterOrder;

  const eligible = base.filter(id =>
    id !== playerCharacterId &&
    characters[id] &&
    characters[id].rivalEligible !== false
  );

  if (!eligible.length) return [];

  const offset = (REGION_OFFSETS[key] || 0) % eligible.length;
  const rotated = eligible.slice(offset).concat(eligible.slice(0, offset));

  const result = [];
  for (const id of rotated) {
    if (!result.includes(id)) result.push(id);
    if (result.length >= TUNER_TEAM_CHALLENGE_STAGES) break;
  }

  if (result.length < TUNER_TEAM_CHALLENGE_STAGES) {
    for (const id of genericRivalCharacterOrder) {
      if (
        id !== playerCharacterId &&
        characters[id] &&
        characters[id].rivalEligible !== false &&
        !result.includes(id)
      ) {
        result.push(id);
      }
      if (result.length >= TUNER_TEAM_CHALLENGE_STAGES) break;
    }
  }

  return result.slice(0, TUNER_TEAM_CHALLENGE_STAGES);
}

function challengeAi(stageIndex) {
  const stage = Math.max(0, Math.min(6, Number(stageIndex || 0)));
  const rating = STAGE_RATINGS[stage];
  const base = { ...getEncounterAi(rating) };
  const progress = stage / 6;

  return {
    ...base,
    reactionSkill: Math.max(Number(base.reactionSkill || 0), 0.86 + progress * 0.12),
    launchSkill: Math.max(Number(base.launchSkill || 0), 0.86 + progress * 0.12),
    shiftSkill: Math.max(Number(base.shiftSkill || 0), 0.88 + progress * 0.11),
    aggression: Math.max(Number(base.aggression || 0), 0.84 + progress * 0.12),
  };
}

export function buildTunerTeamChallengeRounds(regionId, playerCharacterId = '') {
  const key = normaliseRegion(regionId);
  const roster = getTunerTeamChallengeRoster(key, playerCharacterId);
  const cars = REGION_CARS[key] || REGION_CARS.ODAIBA;
  const pattern = REGION_RACE_PATTERNS[key] || REGION_RACE_PATTERNS.ODAIBA;
  const paintColors = [0xffffff, 0x2d7cff, 0xffd54a, 0xe94d5f, 0x46d39a, 0x9d73ff, 0x111111];

  return Array.from({ length: TUNER_TEAM_CHALLENGE_STAGES }, (_, index) => {
    const [raceType, distanceM] = pattern[index] || ['Standing Start', 402.336];
    const rating = STAGE_RATINGS[index];

    return {
      stageIndex: index,
      regionRank: getRegionalChampionshipRank(key),
      characterId: roster[index] || roster[roster.length - 1] || 'kaitoFujimori',
      carId: cars[index] || cars[cars.length - 1] || 'r32',
      paintColor: paintColors[index % paintColors.length],
      encounterRating: rating,
      encounterAi: challengeAi(index),
      difficulty: index === 6 ? 'PRO' : index >= 3 ? 'ELITE' : 'HARD',
      raceType,
      distanceM,
    };
  });
}

export function getTunerTeamChallengeLabel(source, regionId) {
  const state = getTunerTeamChallengeState(source, regionId);
  if (state.perfectEarned) return 'REGIONAL CHAMPION ★';
  if (state.championEarned && state.perfectAttempt) {
    return 'PERFECT SWEEP // ' + state.stage + ' / ' + TUNER_TEAM_CHALLENGE_STAGES;
  }
  if (state.championEarned) return 'REGIONAL CHAMPION';
  if (state.invited || state.stage > 0) {
    return 'TEAM CHALLENGE // ' + state.stage + ' / ' + TUNER_TEAM_CHALLENGE_STAGES;
  }

  const regionWins = sourceValue(source, 'regionWins', {}) || {};
  const wins = Math.max(0, Number(regionWins[state.regionId] || 0));
  if (wins < TUNER_TEAM_CHALLENGE_WINS) {
    return Math.min(wins, TUNER_TEAM_CHALLENGE_WINS) + ' / ' +
      TUNER_TEAM_CHALLENGE_WINS + ' REGION REP';
  }

  const totalWins = Math.max(0, Number(sourceValue(source, 'wins', 0) || 0));
  if (totalWins < TUNER_TEAM_CHALLENGE_TOTAL_WINS) {
    return Math.min(totalWins, TUNER_TEAM_CHALLENGE_TOTAL_WINS) + ' / ' +
      TUNER_TEAM_CHALLENGE_TOTAL_WINS + ' TOTAL WINS';
  }

  const garageTier = Math.max(0, Number(sourceValue(source, 'garageTier', 0) || 0));
  if (garageTier < TUNER_TEAM_CHALLENGE_MIN_GARAGE_TIER) {
    return 'CANAL YARD REQUIRED';
  }

  return 'CREW CHALLENGE READY';
}
