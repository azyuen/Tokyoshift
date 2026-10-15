import {
  characters,
  REGION_TEAM_CHARACTER_IDS,
  MAIN_RIVAL_BY_REGION,
  genericRivalCharacterOrder,
} from './characters.js?v=20261015-signatures';
import { getCrewBaseCarId, getRegionalCrewRoster } from './crewRoster.js?v=20261015-signatures';
import { getEncounterAi } from './encounterProfiles.js?v=20260923-r162';

export const TUNER_TEAM_CHALLENGE_WINS = 10;
export const TUNER_TEAM_CHALLENGE_TOTAL_WINS = 12;
// Regional championships are what unlock later workshops, so requiring Canal
// Yard here creates a circular progression lock on fresh profiles.
export const TUNER_TEAM_CHALLENGE_MIN_GARAGE_TIER = 0;
export const TUNER_TEAM_CHALLENGE_STAGES = 7;
// Seven-race regional championships fund meaningful early tuning without
// making the ¥250k Canal Yard unlock automatic. Coupons and tuner access
// remain separate one-time progression rewards.
const REGIONAL_CHAMPIONSHIP_PRIZES = Object.freeze({
  ODAIBA:   { completion: 40000, perfect: 15000 },
  SHINAGAWA: { completion: 60000, perfect: 20000 },
  TATSUMI:  { completion: 55000, perfect: 20000 },
  SHIBUYA:  { completion: 75000, perfect: 25000 },
  YOKOHAMA: { completion: 100000, perfect: 30000 },
  DAIKOKU:  { completion: 135000, perfect: 40000 },
  SHINJUKU: { completion: 180000, perfect: 50000 },
});
// Compatibility exports: callers should use getRegionalChampionshipCashReward
// so they never accidentally award the former flat ¥250k/¥150k amounts.
export const TUNER_TEAM_COMPLETION_REWARD = 40000;
export const TUNER_TEAM_PERFECT_REWARD = 15000;
export function getRegionalChampionshipCashReward(regionId, perfect = false) {
  const key = String(regionId || '').trim().toUpperCase();
  const amount = REGIONAL_CHAMPIONSHIP_PRIZES[key] || REGIONAL_CHAMPIONSHIP_PRIZES.ODAIBA;
  return perfect ? amount.perfect : amount.completion;
}
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

// Each recruitable rival uses the one fixed regional signature car in crewRoster.
// Main rivals are permanent opponents, with an independently assigned flagship car.
const REGION_LEADER_CARS = Object.freeze({
  ODAIBA: 'ae86',
  SHINAGAWA: 'fc3s',
  TATSUMI: 'dc2',
  SHIBUYA: '180sx',
  YOKOHAMA: 'gdb',
  DAIKOKU: 'evo6',
  SHINJUKU: 'jza80',
});

export function getRegionalRivalSignatureCarId(regionId, characterId, fallback = null) {
  const key = normaliseRegion(regionId);
  const id = String(characterId || '');
  return id === MAIN_RIVAL_BY_REGION[key]
    ? REGION_LEADER_CARS[key] || fallback
    : getCrewBaseCarId(id) || fallback;
}

const REGION_RACE_PATTERNS = {
  // Home Workshop championships teach launches and clean shifts first.
  // Only Shinagawa's second round introduces a short rolling start.
  ODAIBA: [
    ['Standing Start', 402.336],
    ['Standing Start', 402.336],
    ['Standing Start', 402.336],
    ['Standing Start', 804.672],
    ['Standing Start', 804.672],
    ['Standing Start', 804.672],
    ['Standing Start', 804.672],
  ],
  SHINAGAWA: [
    ['Standing Start', 402.336],
    ['Roll Race', 402.336],
    ['Standing Start', 402.336],
    ['Standing Start', 402.336],
    ['Standing Start', 804.672],
    ['Standing Start', 804.672],
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

const REGION_DRIVER_RATINGS = Object.freeze({
  ODAIBA: [2, 2, 2, 3, 3, 3, 3],
  SHINAGAWA: [2, 2, 3, 3, 3, 3, 3],
  TATSUMI: [3, 3, 3, 3, 4, 4, 4],
  SHIBUYA: [3, 3, 3, 4, 4, 4, 4],
  YOKOHAMA: [4, 4, 4, 4, 4, 5, 5],
  DAIKOKU: [4, 4, 4, 4, 4, 5, 5],
  SHINJUKU: [4, 4, 4, 5, 5, 5, 5],
});

const REGION_BUILD_ERAS = Object.freeze({
  ODAIBA: { workshopEra: 'HOME', tuningPointCap: 12, maxTuningLevel: 1, allowNos: false },
  SHINAGAWA: { workshopEra: 'HOME', tuningPointCap: 12, maxTuningLevel: 1, allowNos: false },
  TATSUMI: { workshopEra: 'CANAL', tuningPointCap: 30, maxTuningLevel: 2, allowNos: true },
  SHIBUYA: { workshopEra: 'CANAL', tuningPointCap: 30, maxTuningLevel: 2, allowNos: true },
  YOKOHAMA: { workshopEra: 'CANAL', tuningPointCap: 30, maxTuningLevel: 2, allowNos: true },
  DAIKOKU: { workshopEra: 'WAREHOUSE', tuningPointCap: 48, maxTuningLevel: 3, allowNos: true },
  SHINJUKU: { workshopEra: 'WAREHOUSE', tuningPointCap: 48, maxTuningLevel: 3, allowNos: true },
});

function regionalTuningPointCap(regionId, stageIndex, playerDifficulty = 'STANDARD') {
  const era = REGION_BUILD_ERAS[normaliseRegion(regionId)] || REGION_BUILD_ERAS.ODAIBA;
  const stage = Math.max(0, Math.min(6, Number(stageIndex || 0)));
  const difficulty = String(playerDifficulty || 'STANDARD').toUpperCase();

  // Early championships are a first-campaign graduation, not endgame.
  // Spread development through all seven rounds instead of giving the very
  // first opponent virtually the same maxed-out Home build as the boss.
  if (['ODAIBA', 'SHINAGAWA'].includes(normaliseRegion(regionId))) {
    const steps = normaliseRegion(regionId) === 'ODAIBA'
      ? [3, 4, 5, 6, 7, 8, 9]
      : [5, 6, 7, 8, 9, 10, 11];
    const modifier = difficulty === 'EASY' ? -1 : difficulty === 'HARD' ? 1 : 0;
    return Math.max(0, Math.min(12, steps[stage] + modifier));
  }

  // Tatsumi is the first Canal Yard championship (rank 3). Its first three
  // cars are relatively weak and need meaningful hardware to remain engaging;
  // the later cars have higher base performance, so their point budgets can
  // be lower. In particular, the expert rounds must leave a
  // realistic manual-driving margin for a Canal Yard Level 2 player build.
  // A point-budget dip is intentional: balance actual car performance, not
  // just an artificial rising count. Later Canal regions stay untouched.
  if (normaliseRegion(regionId) === 'TATSUMI') {
    const steps = [20, 21, 22, 19, 20, 21, 25];
    const modifier = difficulty === 'EASY' ? -2 : difficulty === 'HARD' ? 2 : 0;
    return Math.max(0, Math.min(era.tuningPointCap, steps[stage] + modifier));
  }

  // Warehouse rivals stay at 48 base points; late-stage specialist tunes
  // supply their extra difficulty instead of exceeding the physical Lv3 cap.
  if (era.workshopEra === 'WAREHOUSE') return era.tuningPointCap;

  // Keep rounds 1–6 at or below the penultimate rival, so a tuning
  // reduction for round 6 never makes earlier opponents more powerful.
  const regularPoints = Math.max(0, era.tuningPointCap - 1);
  if (stage !== 6 || difficulty === 'EASY') return regularPoints;

  // Standard's boss reaches its era's nominal cap (Home 12 / Canal 30).
  // Hard retains one point of above-era hardware as the final-round challenge.
  return difficulty === 'HARD'
    ? era.tuningPointCap + 1
    : era.tuningPointCap;
}

function regionalSpecialistUpgradeCount(regionId, stageIndex, playerDifficulty = 'STANDARD') {
  const era = REGION_BUILD_ERAS[normaliseRegion(regionId)] || REGION_BUILD_ERAS.ODAIBA;
  if (era.workshopEra !== 'WAREHOUSE') return 0;
  const stage = Math.max(0, Math.min(6, Number(stageIndex || 0)));
  const difficulty = String(playerDifficulty || 'STANDARD').toUpperCase();
  if (stage === 5) return difficulty === 'HARD' ? 6 : difficulty === 'STANDARD' ? 4 : 0;
  if (stage === 6) return difficulty === 'HARD' ? 10 : difficulty === 'STANDARD' ? 6 : 2;
  return 0;
}

function normaliseRegion(regionId) {
  return String(regionId || '').trim().toUpperCase();
}

export function getRegionalChallengeRaceSpec(regionId, stageIndex) {
  const region = normaliseRegion(regionId);
  const pattern = REGION_RACE_PATTERNS[region] || REGION_RACE_PATTERNS.ODAIBA;
  const stage = Math.max(0, Math.min(TUNER_TEAM_CHALLENGE_STAGES - 1, Math.floor(Number(stageIndex) || 0)));
  const [raceType, distanceM] = pattern[stage] || pattern[0];
  return { raceType, distanceM };
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
  const perfectComplete = Boolean(perfectEarned);

  return {
    regionId: key,
    // Perfect is terminal. Normal champion clears remain eligible for a later
    // seven-win sweep, but once the ★ has been earned no stale invite/session
    // flags may reopen the challenge or make its prizes claimable twice.
    invited: perfectComplete ? false : Boolean(raw.invited),
    offeredOnce: Boolean(raw.offeredOnce || raw.invited || Number(raw.stage || 0) > 0),
    reofferVisitsRemaining: perfectComplete
      ? 0
      : Math.max(0, Number(raw.reofferVisitsRemaining || 0)),
    completed: legacyCompleted || championEarned,
    championEarned,
    perfectEarned,
    championRewardClaimed: raw.championRewardClaimed == null
      ? (!hasNewRewardState && legacyCompleted && legacyPerfect)
      : Boolean(raw.championRewardClaimed),
    perfectRewardClaimed: raw.perfectRewardClaimed == null
      ? legacyPerfect
      : Boolean(raw.perfectRewardClaimed),
    perfectAttempt: perfectComplete ? false : Boolean(raw.perfectAttempt),
    stage: perfectComplete
      ? TUNER_TEAM_CHALLENGE_STAGES
      : Math.max(0, Math.min(TUNER_TEAM_CHALLENGE_STAGES, Number(raw.stage || 0))),
    misses: Math.max(0, Number(raw.misses || 0)),
    perfectEligible: raw.perfectEligible !== false,
    activeSession: perfectComplete ? false : Boolean(raw.activeSession),
    paused: perfectComplete ? false : Boolean(raw.paused),
    pausedAt: perfectComplete ? 0 : Math.max(0, Number(raw.pausedAt || 0)),
    retryNotBefore: perfectComplete ? 0 : Math.max(0, Number(raw.retryNotBefore || 0)),
    rounds: Array.isArray(raw.rounds)
      ? raw.rounds.map((round, index) => {
          // Preserve progress, player hardware and driver identities in old
          // saves, while migrating each rival's model to their signature car.
          if (!round) return round;
          const carId = getRegionalRivalSignatureCarId(key, round.characterId, round.carId);
          if (!['ODAIBA', 'SHINAGAWA'].includes(key)) {
            return carId === round.carId ? round : { ...round, carId };
          }
          const rating = REGION_DRIVER_RATINGS[key][index];
          return {
            ...round,
            carId,
            encounterRating: rating,
            encounterAi: challengeAi(index, rating, key),
            difficulty: index === 6 ? 'PRO' : rating >= 4 ? 'EXPERT' : rating >= 3 ? 'SKILLED' : 'ROOKIE',
            tuningPointCap: regionalTuningPointCap(
              key, index, sourceValue(source, 'playerDifficulty', 'STANDARD')
            ),
            ...getRegionalChallengeRaceSpec(key, index),
          };
        })
      : [],
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

export function getTunerTeamChallengeRoster(regionId, playerCharacterId = '', source = null) {
  const key = normaliseRegion(regionId);
  const explicit = Array.isArray(REGION_TEAM_CHARACTER_IDS[key])
    ? REGION_TEAM_CHARACTER_IDS[key]
    : [];

  // Keep every authored regional driver. If a region has fewer than seven
  // authored characters, fill only the missing slot(s) with reserve rivals.
  const result = [];
  // Avoid a circular dependency on crewSystem: it already imports this file.
  const recruitedIds = new Set(Object.values(sourceValue(source, 'crewMembers', {}) || {})
    .map(member => member?.characterId).filter(Boolean));
  const add = id => {
    if (
      id &&
      id !== playerCharacterId &&
      !recruitedIds.has(id) &&
      characters[id] &&
      characters[id].rivalEligible !== false &&
      !result.includes(id)
    ) {
      result.push(id);
    }
  };

  explicit.forEach(add);

  if (result.length < TUNER_TEAM_CHALLENGE_STAGES) {
    const offset = (REGION_OFFSETS[key] || 0) % Math.max(1, genericRivalCharacterOrder.length);
    const rotatedGeneric = genericRivalCharacterOrder.length
      ? genericRivalCharacterOrder.slice(offset).concat(genericRivalCharacterOrder.slice(0, offset))
      : [];
    rotatedGeneric.forEach(id => {
      if (result.length < TUNER_TEAM_CHALLENGE_STAGES) add(id);
    });
  }

  const mainRivalId = MAIN_RIVAL_BY_REGION[key] || null;
  const nonRivalDrivers = result.filter(id => id !== mainRivalId);
  const finalRoster = [
    ...nonRivalDrivers.slice(0, TUNER_TEAM_CHALLENGE_STAGES - 1),
    ...(mainRivalId && !recruitedIds.has(mainRivalId) ? [mainRivalId] : []),
  ];

  return finalRoster.slice(0, TUNER_TEAM_CHALLENGE_STAGES);
}

const BEGINNER_REGIONAL_DRIVER_PENALTIES = Object.freeze({
  // Keep the beginner championships decided by real shifting and launching,
  // not by near-perfect computer execution. Later regions are untouched.
  ODAIBA: Object.freeze({ reaction: 0.065, launch: 0.045, shift: 0.085, aggression: 0.050 }),
  SHINAGAWA: Object.freeze({ reaction: 0.040, launch: 0.030, shift: 0.060, aggression: 0.035 }),
});

function challengeAi(stageIndex, rating, regionId = '') {
  const stage = Math.max(0, Math.min(6, Number(stageIndex || 0)));
  const base = { ...getEncounterAi(rating) };
  const progress = stage / 6;
  const penalty = BEGINNER_REGIONAL_DRIVER_PENALTIES[normaliseRegion(regionId)] || {};
  return {
    ...base,
    reactionSkill: Math.max(0.30, Math.min(0.98, Number(base.reactionSkill || 0) + progress * 0.035 - (penalty.reaction || 0))),
    launchSkill: Math.max(0.30, Math.min(0.98, Number(base.launchSkill || 0) + progress * 0.035 - (penalty.launch || 0))),
    shiftSkill: Math.max(0.30, Math.min(0.99, Number(base.shiftSkill || 0) + progress * 0.025 - (penalty.shift || 0))),
    aggression: Math.max(0.30, Math.min(0.97, Number(base.aggression || 0) + progress * 0.035 - (penalty.aggression || 0))),
  };
}

export function buildTunerTeamChallengeRounds(
  regionId,
  playerCharacterId = '',
  playerDifficulty = 'STANDARD',
  source = null
) {
  const key = normaliseRegion(regionId);
  const roster = getTunerTeamChallengeRoster(key, playerCharacterId, source);
  const fallbackCars = [
    ...(getRegionalCrewRoster(key)?.members || []).map(member => member.baseCarId),
    REGION_LEADER_CARS[key] || 'r32',
  ];
  const pattern = REGION_RACE_PATTERNS[key] || REGION_RACE_PATTERNS.ODAIBA;
  const ratings = REGION_DRIVER_RATINGS[key] || REGION_DRIVER_RATINGS.ODAIBA;
  const era = REGION_BUILD_ERAS[key] || REGION_BUILD_ERAS.ODAIBA;
  const paintColors = [0xffffff, 0x2d7cff, 0xffd54a, 0xe94d5f, 0x46d39a, 0x9d73ff, 0x111111];

  return Array.from({ length: TUNER_TEAM_CHALLENGE_STAGES }, (_, index) => {
    const [raceType, distanceM] = pattern[index] || ['Standing Start', 402.336];
    const rating = ratings[index] || ratings[ratings.length - 1] || 3;
    const rivalId = roster[index] || roster[roster.length - 1] || 'kaitoFujimori';

    return {
      stageIndex: index,
      regionId: key,
      regionRank: getRegionalChampionshipRank(key),
      characterId: rivalId,
      carId: getRegionalRivalSignatureCarId(key, rivalId, fallbackCars[index] || 'r32'),
      paintColor: paintColors[index % paintColors.length],
      encounterRating: rating,
      encounterAi: challengeAi(index, rating, key),
      difficulty: index === 6 ? 'PRO' : rating >= 5 ? 'ELITE' : rating >= 4 ? 'EXPERT' : rating >= 3 ? 'SKILLED' : 'ROOKIE',
      workshopEra: era.workshopEra,
      tuningPointCap: regionalTuningPointCap(key, index, playerDifficulty),
      maxTuningLevel: era.maxTuningLevel,
      allowNos: era.allowNos,
      specialistUpgradeCount: regionalSpecialistUpgradeCount(key, index, playerDifficulty),
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
