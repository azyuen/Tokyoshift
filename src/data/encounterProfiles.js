const DIFFICULTY_DEFAULTS = {
  EASY: {
    ratingSlots: [2, 2, 2],
    stakeRange: [1000, 2000],
    pinkAcceptanceBase: 0.05,
    likelyCars: ['ae86', 'ek9', 'fc3s'],
  },
  MED: {
    ratingSlots: [2, 3, 3],
    stakeRange: [2500, 4500],
    pinkAcceptanceBase: 0.07,
    likelyCars: ['ae86', 'ek9', 'fc3s', 'evo3'],
  },
  HARD: {
    ratingSlots: [3, 4, 4],
    stakeRange: [6000, 9000],
    pinkAcceptanceBase: 0.10,
    likelyCars: ['fc3s', 'evo3', 'wrx22b', 'r32'],
  },
  ELITE: {
    ratingSlots: [4, 5, 5],
    stakeRange: [12000, 18000],
    pinkAcceptanceBase: 0.13,
    likelyCars: ['evo3', 'wrx22b', 'r32'],
  },
};

export const LOCATION_ENCOUNTERS = {
  // Odaiba // deliberately cheap, forgiving starter races.
  odaiba7eleven: {
    difficulty: 'EASY',
    ratingSlots: [2, 2, 2],
    stakeRange: [1000, 2000],
    likelyCars: ['ae86', 'ek9', 'fc3s'],
  },
  odaibaGundamPlaza: {
    difficulty: 'EASY',
    ratingSlots: [2, 2, 3],
    stakeRange: [1500, 2500],
    likelyCars: ['ae86', 'ek9', 'fc3s'],
  },
  odaibaMiraikan: {
    difficulty: 'MED',
    ratingSlots: [2, 3, 3],
    stakeRange: [2500, 4000],
    likelyCars: ['ek9', 'fc3s', 'evo3'],
  },

  // Shinagawa // early-game alternative route.
  shinagawaTennozu: {
    difficulty: 'EASY',
    ratingSlots: [2, 2, 3],
    stakeRange: [1500, 2500],
    likelyCars: ['ae86', 'ek9', 'fc3s'],
  },
  shinagawaKonan: {
    difficulty: 'MED',
    ratingSlots: [2, 3, 3],
    stakeRange: [2500, 4000],
    likelyCars: ['ek9', 'fc3s', 'evo3'],
  },
  shinagawaOiWharf: {
    difficulty: 'MED',
    ratingSlots: [3, 3, 3],
    stakeRange: [3000, 4500],
    likelyCars: ['ek9', 'fc3s', 'evo3'],
  },

  // Tatsumi // quicker expressway crowd.
  tatsumiBridgefrontPlaza: {
    difficulty: 'MED',
    ratingSlots: [3, 3, 3],
    stakeRange: [3500, 5000],
    likelyCars: ['ek9', 'fc3s', 'evo3'],
  },
  tatsumiSkylineVista: {
    difficulty: 'MED',
    ratingSlots: [3, 3, 4],
    stakeRange: [4000, 6000],
    likelyCars: ['fc3s', 'evo3', 'wrx22b'],
  },
  tatsumiHarborLoop: {
    difficulty: 'HARD',
    ratingSlots: [3, 4, 4],
    stakeRange: [6000, 8500],
    likelyCars: ['fc3s', 'evo3', 'wrx22b', 'r32'],
  },

  // Shibuya // flashier mid-game street builds.
  shibuyaScramble: {
    difficulty: 'MED',
    ratingSlots: [3, 3, 4],
    stakeRange: [4500, 6500],
    likelyCars: ['ek9', 'fc3s', 'evo3', 'r32'],
  },
  shibuyaDogenzaka: {
    difficulty: 'HARD',
    ratingSlots: [3, 4, 4],
    stakeRange: [6500, 9000],
    likelyCars: ['fc3s', 'evo3', 'wrx22b', 'r32'],
  },
  shibuyaCenterGai: {
    difficulty: 'HARD',
    ratingSlots: [4, 4, 4],
    stakeRange: [7500, 10000],
    likelyCars: ['fc3s', 'evo3', 'wrx22b', 'r32'],
  },

  // Shinjuku // serious late-night city crews.
  shinjukuSouthExit: {
    difficulty: 'HARD',
    ratingSlots: [4, 4, 4],
    stakeRange: [8500, 11000],
    likelyCars: ['fc3s', 'evo3', 'wrx22b', 'r32'],
  },
  shinjukuKabukicho: {
    difficulty: 'HARD',
    ratingSlots: [4, 4, 5],
    stakeRange: [9000, 12000],
    likelyCars: ['evo3', 'wrx22b', 'r32', 'fc3s'],
  },
  shinjukuNishi: {
    difficulty: 'ELITE',
    ratingSlots: [4, 5, 5],
    stakeRange: [12000, 16000],
    likelyCars: ['evo3', 'wrx22b', 'r32'],
  },

  // Yokohama // longer drive, powerful late-game builds.
  yokohamaRedBrick: {
    difficulty: 'HARD',
    ratingSlots: [4, 4, 4],
    stakeRange: [9000, 12000],
    likelyCars: ['fc3s', 'evo3', 'wrx22b', 'r32'],
  },
  yokohamaMinatoMirai: {
    difficulty: 'HARD',
    ratingSlots: [4, 4, 5],
    stakeRange: [10500, 14000],
    likelyCars: ['evo3', 'wrx22b', 'r32', 'fc3s'],
  },
  yokohamaBayBridge: {
    difficulty: 'ELITE',
    ratingSlots: [4, 5, 5],
    stakeRange: [13000, 17500],
    likelyCars: ['evo3', 'wrx22b', 'r32'],
  },

  // Daikoku // prestige / end-game encounters.
  daikokuPA: {
    difficulty: 'HARD',
    ratingSlots: [4, 4, 5],
    stakeRange: [11000, 15000],
    likelyCars: ['evo3', 'wrx22b', 'r32', 'fc3s'],
  },
  daikokuHarbor: {
    difficulty: 'ELITE',
    ratingSlots: [4, 5, 5],
    stakeRange: [15000, 20000],
    likelyCars: ['evo3', 'wrx22b', 'r32'],
  },
  daikokuOpenLot: {
    difficulty: 'ELITE',
    ratingSlots: [5, 5, 5],
    stakeRange: [18000, 24000],
    likelyCars: ['evo3', 'wrx22b', 'r32'],
  },
};

export function getEncounterProfile(locationId, fallbackDifficulty = 'MED') {
  const location = LOCATION_ENCOUNTERS[locationId] || {};
  const difficulty = location.difficulty || fallbackDifficulty || 'MED';
  const base = DIFFICULTY_DEFAULTS[difficulty] || DIFFICULTY_DEFAULTS.MED;

  return {
    ...base,
    ...location,
    difficulty,
    ratingSlots: [...(location.ratingSlots || base.ratingSlots)],
    stakeRange: [...(location.stakeRange || base.stakeRange)],
    likelyCars: [...(location.likelyCars || base.likelyCars)],
  };
}

export function getEncounterSkillLabel(rating = 3) {
  const rounded = Math.max(1, Math.min(5, Math.round(Number(rating) || 3)));
  if (rounded <= 2) return 'ROOKIE';
  if (rounded === 3) return 'SKILLED';
  if (rounded === 4) return 'EXPERT';
  return 'ELITE';
}

export function getEncounterAi(rating = 3) {
  const rounded = Math.max(1, Math.min(5, Math.round(Number(rating) || 3)));

  const table = {
    1: { reactionSkill: 0.55, launchSkill: 0.68, shiftSkill: 0.70, aggression: 0.64 },
    2: { reactionSkill: 0.63, launchSkill: 0.74, shiftSkill: 0.77, aggression: 0.70 },
    3: { reactionSkill: 0.75, launchSkill: 0.82, shiftSkill: 0.84, aggression: 0.80 },
    4: { reactionSkill: 0.86, launchSkill: 0.89, shiftSkill: 0.91, aggression: 0.86 },
    5: { reactionSkill: 0.93, launchSkill: 0.94, shiftSkill: 0.96, aggression: 0.92 },
  };

  return { ...table[rounded] };
}

export function boostAiForPinkSlip(ai = {}) {
  return {
    reactionSkill: Math.min(0.99, Number(ai.reactionSkill || 0.75) + 0.06),
    launchSkill: Math.min(0.99, Number(ai.launchSkill || 0.75) + 0.06),
    shiftSkill: Math.min(0.99, Number(ai.shiftSkill || 0.75) + 0.07),
    aggression: Math.min(0.99, Number(ai.aggression || 0.75) + 0.04),
  };
}
