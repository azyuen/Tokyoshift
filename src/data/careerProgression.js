const sourceValue = (source, key, fallback = null) => {
  if (source && typeof source.get === 'function') {
    const result = source.get(key);
    return result == null ? fallback : result;
  }
  const result = source?.[key];
  return result == null ? fallback : result;
};

export const EASY_CASH_WIN_MULTIPLIER = 1.30;
export const EASY_MIN_CASH_WIN = 2000;
export const EASY_NEW_CAR_PRICE_MULTIPLIER = 0.85;
export const EASY_USED_CAR_PRICE_MULTIPLIER = 0.90;
export const EASY_COUPON_WIN_INTERVAL = 20;

const REGION_GATES = Object.freeze({
  SHINONOME: Object.freeze({ always: true }),
  ODAIBA: Object.freeze({ always: true }),
  SHINAGAWA: Object.freeze({ minWins: 10, earlyGarageCheck: true }),
  TATSUMI: Object.freeze({ minWins: 10, earlyGarageCheck: true }),
  SHIBUYA: Object.freeze({ minWins: 30, minGarageTier: 1, minCompetitionWins: 1 }),
  YOKOHAMA: Object.freeze({ minWins: 30, minGarageTier: 1, minCompetitionWins: 1 }),
  // The last regional district belongs after the Daikoku title and HQ.
  SHINJUKU: Object.freeze({ minWins: 100, minGarageTier: 2, requiredRegionalChampion: 'DAIKOKU' }),
  DAIKOKU: Object.freeze({ minWins: 75, minChampionships: 2 }),
  CENTRAL_TOKYO: Object.freeze({ minWins: 3 }),
});

export function isEasyDifficulty(source) {
  return String(sourceValue(source, 'playerDifficulty', 'STANDARD')).toUpperCase() === 'EASY';
}

export function getRegionalChampionshipCount(source) {
  const challenges = sourceValue(source, 'tunerTeamChallenges', {}) || {};
  return Object.values(challenges)
    .filter(item => Boolean(item?.championEarned || item?.completed))
    .length;
}

export function getCompetitionWinCount(source) {
  return Math.max(0, Math.floor(Number(sourceValue(source, 'competitionWins', 0) || 0)));
}

export function getRegionWinCount(source, regionId) {
  const regionWins = sourceValue(source, 'regionWins', {}) || {};
  return Math.max(0, Math.floor(Number(regionWins[String(regionId || '').toUpperCase()] || 0)));
}

function sumTuningLevels(value) {
  if (!value || typeof value !== 'object') return 0;
  let total = 0;

  Object.values(value).forEach(entry => {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      total += Math.max(0, entry);
    } else if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      total += sumTuningLevels(entry);
    }
  });

  return total;
}

export function getBestCarDevelopmentPoints(source) {
  const states = sourceValue(source, 'carStates', {}) || {};
  const owned = new Set((sourceValue(source, 'ownedCarIds', []) || []).map(String));
  let best = 0;

  Object.entries(states).forEach(([carId, state]) => {
    if (!owned.has(String(carId)) || !state || typeof state !== 'object') return;

    let score = 0;
    score += sumTuningLevels(state.tuning);
    score += sumTuningLevels(state.drivetrainTuning);
    score += sumTuningLevels(state.chassisTuning);
    score += sumTuningLevels(state.exhaustNosTuning);
    if (state.nosInstalled) score += 1;

    best = Math.max(best, score);
  });

  return best;
}

export function getCareerRegionStatus(source, regionId) {
  const id = String(regionId || '').toUpperCase();
  const gate = REGION_GATES[id];

  if (!gate) {
    return { unlocked: false, label: 'LOCKED' };
  }
  if (gate.always) {
    return { unlocked: true, label: 'OPEN' };
  }

  const wins = Math.max(0, Number(sourceValue(source, 'wins', 0) || 0));
  const garageTier = Math.max(0, Number(sourceValue(source, 'garageTier', 0) || 0));
  const championships = getRegionalChampionshipCount(source);
  const competitionWins = getCompetitionWinCount(source);

  if (wins < Number(gate.minWins || 0)) {
    return {
      unlocked: false,
      label: Math.max(0, Number(gate.minWins || 0)) + ' WINS REQUIRED',
    };
  }

  if (gate.earlyGarageCheck) {
    const ownedCount = (sourceValue(source, 'ownedCarIds', []) || []).length;
    const developed = getBestCarDevelopmentPoints(source) >= 4;
    if (ownedCount < 2 && !developed) {
      return {
        unlocked: false,
        label: 'OWN 2 CARS OR DEVELOP YOUR CAR',
      };
    }
  }

  if (garageTier < Number(gate.minGarageTier || 0)) {
    return {
      unlocked: false,
      label: Number(gate.minGarageTier || 0) >= 2
        ? 'WAREHOUSE HQ REQUIRED'
        : 'CANAL YARD REQUIRED',
    };
  }

  if (competitionWins < Number(gate.minCompetitionWins || 0)) {
    return {
      unlocked: false,
      label: 'WIN A STREET THREE COMPETITION',
    };
  }

  if (championships < Number(gate.minChampionships || 0)) {
    const needed = Math.max(1, Number(gate.minChampionships || 0));
    return {
      unlocked: false,
      label: needed === 1
        ? 'WIN A REGIONAL CHAMPIONSHIP'
        : needed + ' REGIONAL CHAMPIONSHIPS REQUIRED',
    };
  }

  if (gate.requiredRegionalChampion) {
    const required = String(gate.requiredRegionalChampion).toUpperCase();
    const regionalState = (sourceValue(source, 'tunerTeamChallenges', {}) || {})[required];
    if (!(regionalState?.championEarned || regionalState?.completed)) {
      return {
        unlocked: false,
        label: 'WIN ' + required + ' REGIONAL CHAMPIONSHIP',
      };
    }
  }

  return { unlocked: true, label: 'OPEN' };
}

export function isCareerRegionUnlocked(source, regionId) {
  return getCareerRegionStatus(source, regionId).unlocked;
}

export function getCareerRegionUnlockLabel(source, regionId) {
  return getCareerRegionStatus(source, regionId).label;
}

export function getCareerLocationStatus(source, regionId, locationIndex = 0) {
  const regionStatus = getCareerRegionStatus(source, regionId);
  if (!regionStatus.unlocked) return regionStatus;

  const index = Math.max(0, Number(locationIndex || 0));
  if (index <= 0) return { unlocked: true, label: 'OPEN' };

  const requiredRegionWins = index === 1 ? 2 : 5;
  const regionWins = getRegionWinCount(source, regionId);

  if (regionWins < requiredRegionWins) {
    return {
      unlocked: false,
      label: requiredRegionWins + ' ' + String(regionId || '').replaceAll('_', ' ') + ' WINS REQUIRED',
    };
  }

  return { unlocked: true, label: 'OPEN' };
}

export function applyEasyCashWinBonus(source, amount = 0) {
  const base = Math.max(0, Number(amount || 0));
  if (!isEasyDifficulty(source)) return Math.round(base);
  if (base <= 0) return 0;

  return Math.max(
    EASY_MIN_CASH_WIN,
    Math.round(base * EASY_CASH_WIN_MULTIPLIER)
  );
}

export function getMarketPriceMultiplier(source, marketType = 'new') {
  if (!isEasyDifficulty(source)) return 1;

  return String(marketType || '').toLowerCase() === 'used'
    ? EASY_USED_CAR_PRICE_MULTIPLIER
    : EASY_NEW_CAR_PRICE_MULTIPLIER;
}

export function applyMarketPriceDifficulty(source, basePrice = 0, marketType = 'new') {
  const base = Math.max(0, Number(basePrice || 0));
  const multiplier = getMarketPriceMultiplier(source, marketType);
  if (multiplier === 1) return Math.round(base);

  return Math.max(
    100000,
    Math.round((base * multiplier) / 10000) * 10000
  );
}

export function getEasyCouponMilestoneForWins(wins = 0) {
  const safeWins = Math.max(0, Math.floor(Number(wins || 0)));
  return Math.floor(safeWins / EASY_COUPON_WIN_INTERVAL) * EASY_COUPON_WIN_INTERVAL;
}
