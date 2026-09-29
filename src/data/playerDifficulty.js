export const PLAYER_DIFFICULTIES = Object.freeze(['EASY', 'STANDARD', 'HARD']);

export const PLAYER_DIFFICULTY_CONFIG = Object.freeze({
  EASY: Object.freeze({
    id: 'EASY',
    label: 'EASY',
    aiSkillMultiplier: 0.84,
    rollingAiMultiplier: 0.95,
    transmission: Object.freeze({
      clutchRejectThreshold: 0.46,
      clutchTarget: 0.82,
      throttleGrace: 0.34,
      penaltyMultiplier: 0.72,
    }),
    matchmaking: Object.freeze({
      comparableTargetOffsetStanding: 0,
      comparableTargetOffsetRolling: 0,
      bandWeightMultipliers: Object.freeze({
        comparable: 1,
        weaker: 1,
        stronger: 1,
        wildcard: 1,
      }),
    }),
  }),

  STANDARD: Object.freeze({
    id: 'STANDARD',
    label: 'STANDARD',
    aiSkillMultiplier: 1,
    rollingAiMultiplier: 1,
    transmission: Object.freeze({
      clutchRejectThreshold: 0.58,
      clutchTarget: 0.90,
      throttleGrace: 0.22,
      penaltyMultiplier: 1,
    }),
    matchmaking: Object.freeze({
      comparableTargetOffsetStanding: 0,
      comparableTargetOffsetRolling: 0,
      bandWeightMultipliers: Object.freeze({
        comparable: 1,
        weaker: 1,
        stronger: 1,
        wildcard: 1,
      }),
    }),
  }),

  HARD: Object.freeze({
    id: 'HARD',
    label: 'HARD',
    aiSkillMultiplier: 1.06,
    rollingAiMultiplier: 1.01,
    transmission: Object.freeze({
      clutchRejectThreshold: 0.58,
      clutchTarget: 0.90,
      throttleGrace: 0.22,
      penaltyMultiplier: 1,
    }),
    matchmaking: Object.freeze({
      comparableTargetOffsetStanding: 0.02,
      comparableTargetOffsetRolling: 0.015,
      bandWeightMultipliers: Object.freeze({
        comparable: 0.94,
        weaker: 0.70,
        stronger: 1.18,
        wildcard: 1.10,
      }),
    }),
  }),
});

export function normalisePlayerDifficulty(value = 'STANDARD') {
  const key = String(value || 'STANDARD').trim().toUpperCase();
  return PLAYER_DIFFICULTY_CONFIG[key] ? key : 'STANDARD';
}

export function getPlayerDifficultyConfig(value = 'STANDARD') {
  return PLAYER_DIFFICULTY_CONFIG[normalisePlayerDifficulty(value)];
}

export function applyDifficultyToRivalAi(
  ai = {},
  difficulty = 'STANDARD',
  { rollingStart = false } = {}
) {
  const cfg = getPlayerDifficultyConfig(difficulty);
  const multiplier = Number(cfg.aiSkillMultiplier || 1)
    * (rollingStart ? Number(cfg.rollingAiMultiplier || 1) : 1);
  const clamp = value => Math.max(0.30, Math.min(0.99, Number(value || 0) * multiplier));

  return {
    ...ai,
    reactionSkill: clamp(ai.reactionSkill ?? 0.78),
    launchSkill: clamp(ai.launchSkill ?? 0.72),
    shiftSkill: clamp(ai.shiftSkill ?? 0.76),
    aggression: clamp(ai.aggression ?? 0.72),
  };
}

export function applyDifficultyToPlayerCarConfig(carConfig = {}, difficulty = 'STANDARD') {
  const cfg = getPlayerDifficultyConfig(difficulty);
  const transmission = cfg.transmission || {};

  return {
    ...carConfig,
    difficultyShiftClutchRejectThreshold: Number(transmission.clutchRejectThreshold ?? 0.58),
    difficultyShiftClutchTarget: Number(transmission.clutchTarget ?? 0.90),
    difficultyShiftThrottleGrace: Number(transmission.throttleGrace ?? 0.22),
    difficultyShiftPenaltyMultiplier: Number(transmission.penaltyMultiplier ?? 1),
  };
}

export function applyDifficultyToMeetBands(
  bands = {},
  difficulty = 'STANDARD',
  { rollingStart = false } = {}
) {
  const cfg = getPlayerDifficultyConfig(difficulty);
  const mm = cfg.matchmaking || {};
  const multipliers = mm.bandWeightMultipliers || {};
  const targetOffset = rollingStart
    ? Number(mm.comparableTargetOffsetRolling || 0)
    : Number(mm.comparableTargetOffsetStanding || 0);

  return Object.fromEntries(
    Object.entries(bands).map(([key, band]) => {
      const next = {
        ...band,
        weight: Number(band.weight || 0) * Number(multipliers[key] ?? 1),
      };

      if (key === 'comparable' && targetOffset) {
        next.targetRatio = Math.max(
          Number(band.minRatio ?? -Infinity),
          Math.min(
            Number(band.maxRatio ?? Infinity),
            Number(band.targetRatio || 1) + targetOffset
          )
        );
      }
      return [key, next];
    })
  );
}
