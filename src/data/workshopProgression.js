export const WORKSHOP_TIERS = [
  {
    tier: 0,
    id: 'shinonomeWorkshop',
    label: 'HOME WORKSHOP',
    shortLabel: 'HOME',
    capacity: 4,
    unlockCost: 0,
    textureKey: 'garageWorkshopBg',
    phaseBackgrounds: {
      day: { key: 'garageWorkshopHomeDayBg', path: 'assets/Garage/shinonome_workshop_day.png' },
      night: { key: 'garageWorkshopHomeNightBg', path: 'assets/Garage/shinonome_workshop_night.png' },
    },
    serviceMultiplier: 1.00,
    description: 'Your original bay-side workshop with four storage slots and basic street tuning.',
  },
  {
    tier: 1,
    id: 'shinonomeCanalYard',
    label: 'CANAL YARD GARAGE',
    shortLabel: 'CANAL YARD',
    capacity: 12,
    unlockCost: 250000,
    textureKey: 'garageWorkshopCanalYard',
    phaseBackgrounds: {
      day: { key: 'garageWorkshopCanalYardDayBg', path: 'assets/Garage/shinonome_canalyard_day.png' },
      night: { key: 'garageWorkshopCanalYardNightBg', path: 'assets/Garage/shinonome_canalyard_night.png' },
    },
    serviceMultiplier: 1.15,
    description: 'An old-school local mechanic workshop with twelve more slots and serious performance work.',
  },
  {
    tier: 2,
    id: 'shinonomeWarehouseStrip',
    label: 'WAREHOUSE HQ',
    shortLabel: 'WAREHOUSE HQ',
    capacity: 24,
    unlockCost: 750000,
    textureKey: 'garageWorkshopWarehouseHQ',
    phaseBackgrounds: {
      day: { key: 'garageWorkshopWarehouseDayBg', path: 'assets/Garage/shinonome_warehouse_day.png' },
      night: { key: 'garageWorkshopWarehouseNightBg', path: 'assets/Garage/shinonome_warehouse_night.png' },
    },
    serviceMultiplier: 1.25,
    description: 'A professional tuning headquarters with twenty-four more slots and unrestricted race parts.',
  },
];

// The three-car Pro paddock is a temporary locked competition allocation.
// It is not a fourth purchasable Shinonome property and does not expand
// ordinary garage ownership/storage capacity.
export const PRO_GARAGE_ID = 'tokyoProGarage';
export const PRO_GARAGE_WORKSHOP = Object.freeze({
  tier: 2,
  id: PRO_GARAGE_ID,
  label: 'TOKYO PRO GARAGE',
  shortLabel: 'PRO GARAGE',
  capacity: 3,
  unlockCost: 0,
  textureKey: 'tokyoProGarageNight',
  phaseBackgrounds: {
    day: {key:'tokyoProGarageDay',path:'assets/CentralTokyo/dragcomplex/progarage_day.png'},
    night: {key:'tokyoProGarageNight',path:'assets/CentralTokyo/dragcomplex/progarage_night.png'},
  },
  serviceMultiplier: 1.25, // Warehouse HQ pricing and full tier-two tooling.
  description: 'Three secured professional entries at Tokyo Drag Complex.',
});

export const MAX_GARAGE_CAPACITY = WORKSHOP_TIERS
  .reduce((total, workshop) => total + Number(workshop.capacity || 0), 0);

export const TUNING_WIN_REQUIREMENTS = [0, 0, 12, 40];

const ACCESS = {
  engine: {
    engine: [0, 1, 1, 2],
    intake: [0, 0, 1, 2],
    ecu: [0, 0, 1, 2],
    turbo: [0, 1, 1, 2],
    intercooler: [0, 0, 1, 2],
    exhaust: [0, 0, 1, 2],
  },
  drivetrain: {
    clutch: [0, 0, 1, 2],
    gearbox: [0, 0, 1, 2],
    differential: [0, 0, 1, 2],
    suspension: [0, 0, 1, 2],
  },
  chassis: {
    tyres: [0, 0, 1, 2],
    weightReduction: [0, 0, 1, 2],
  },
  exhaustNos: {
    headers: [0, 0, 1, 2],
    exhaust: [0, 0, 1, 2],
    muffler: [0, 0, 1, 2],
    nosKit: [0, 1, 2, 2],
    nitrousShot: [0, 1, 2, 2],
  },
};

export function clampWorkshopTier(value = 0) {
  return Math.max(0, Math.min(WORKSHOP_TIERS.length - 1, Math.round(Number(value) || 0)));
}

export function getWorkshopTier(value = 0) {
  return WORKSHOP_TIERS[clampWorkshopTier(value)];
}

export function getWorkshopByLocationId(locationId) {
  return locationId === PRO_GARAGE_ID ? PRO_GARAGE_WORKSHOP :
    WORKSHOP_TIERS.find(item => item.id === locationId) || WORKSHOP_TIERS[0];
}

export function getWorkshopPhaseBackground(locationOrWorkshop, phase = 'night') {
  const workshop = typeof locationOrWorkshop === 'string'
    ? getWorkshopByLocationId(locationOrWorkshop)
    : (locationOrWorkshop || WORKSHOP_TIERS[0]);
  const safePhase = String(phase).toLowerCase() === 'day' ? 'day' : 'night';
  return workshop.phaseBackgrounds?.[safePhase] || {
    key: workshop.textureKey,
    path: null,
  };
}

export function getWorkshopStorageCapacity(locationId = 'shinonomeWorkshop') {
  return Number(getWorkshopByLocationId(locationId).capacity || 0);
}

export function getUnlockedWorkshops(tier = 0) {
  const unlockedTier = clampWorkshopTier(tier);
  return WORKSHOP_TIERS.filter(item => item.tier <= unlockedTier);
}

// Storage is cumulative across all unlocked Shinonome properties.
// Home + Canal Yard = 16. All three workshops = 40.
export function getGarageCapacity(tier = 0) {
  return getUnlockedWorkshops(tier)
    .reduce((total, item) => total + Number(item.capacity || 0), 0);
}

export function inferWorkshopTier(ownedCount = 0, savedTier = 0) {
  let tier = clampWorkshopTier(savedTier);
  const count = Math.max(0, Number(ownedCount) || 0);

  while (
    tier < WORKSHOP_TIERS.length - 1 &&
    count > getGarageCapacity(tier)
  ) {
    tier += 1;
  }

  return tier;
}

export function isWorkshopUnlocked(locationId, tier = 0) {
  return getWorkshopByLocationId(locationId).tier <= clampWorkshopTier(tier);
}

export function getWorkshopTransferCost(fromLocationId, toLocationId) {
  const from = getWorkshopByLocationId(fromLocationId);
  const to = getWorkshopByLocationId(toLocationId);
  if (!from || !to || from.id === to.id) return 0;

  const tierDistance = Math.abs(Number(from.tier || 0) - Number(to.tier || 0));
  const furthestTier = Math.max(Number(from.tier || 0), Number(to.tier || 0));

  // Local vehicle transport between Shinonome properties: meaningful enough
  // to discourage constant shuffling, but far cheaper than buying/upgrading.
  return Math.max(0, Math.round((2500 + tierDistance * 1500 + furthestTier * 500) / 500) * 500);
}

export function getWorkshopServiceMultiplier(locationOrTier = 0) {
  const workshop = typeof locationOrTier === 'string'
    ? getWorkshopByLocationId(locationOrTier)
    : getWorkshopTier(locationOrTier);
  return Number(workshop.serviceMultiplier || 1);
}

export function applyWorkshopServiceCost(baseCost = 0, locationOrTier = 0) {
  const base = Math.max(0, Number(baseCost) || 0);
  if (base <= 0) return 0;

  const multiplier = getWorkshopServiceMultiplier(locationOrTier);
  return Math.max(0, Math.round((base * multiplier) / 500) * 500);
}

export function getRequiredWorkshopTier(category, partId, level = 0) {
  const levels = ACCESS?.[category]?.[partId];
  if (!levels) return 0;
  const safeLevel = Math.max(0, Math.min(levels.length - 1, Math.round(Number(level) || 0)));
  return clampWorkshopTier(levels[safeLevel] || 0);
}

export function getTuningWinRequirement(level = 0) {
  const safeLevel = Math.max(
    0,
    Math.min(TUNING_WIN_REQUIREMENTS.length - 1, Math.round(Number(level) || 0))
  );
  return Number(TUNING_WIN_REQUIREMENTS[safeLevel] || 0);
}

export function canInstallTuningLevel(
  category,
  partId,
  level,
  workshopLocationId,
  wins = Infinity,
  bypassProgression = false
) {
  const activeTier = getWorkshopByLocationId(workshopLocationId).tier;
  const workshopReady = activeTier >= getRequiredWorkshopTier(category, partId, level);
  if (!workshopReady) return false;
  if (bypassProgression) return true;
  return Number(wins) >= getTuningWinRequirement(level);
}

export function getWorkshopRequirementLabel(category, partId, level = 0) {
  const requiredTier = getRequiredWorkshopTier(category, partId, level);
  return WORKSHOP_TIERS[requiredTier]?.shortLabel || WORKSHOP_TIERS[0].shortLabel;
}

export function getTuningRequirementLabel(
  category,
  partId,
  level,
  workshopLocationId,
  wins = Infinity,
  bypassProgression = false
) {
  const activeTier = getWorkshopByLocationId(workshopLocationId).tier;
  const requiredTier = getRequiredWorkshopTier(category, partId, level);
  if (activeTier < requiredTier) {
    return getWorkshopRequirementLabel(category, partId, level);
  }

  if (!bypassProgression) {
    const requiredWins = getTuningWinRequirement(level);
    if (Number(wins) < requiredWins) return requiredWins + ' WINS';
  }

  return 'AVAILABLE';
}

export function normaliseCarGarageLocations(
  ownedCarIds = [],
  inputLocations = {},
  garageTier = 0
) {
  const owned = [...new Set(Array.isArray(ownedCarIds) ? ownedCarIds : [])];
  const unlocked = getUnlockedWorkshops(garageTier);
  const unlockedIds = new Set(unlocked.map(item => item.id));
  const counts = Object.fromEntries(unlocked.map(item => [item.id, 0]));
  const result = {};

  // Crew loan cars have their own Crew Space garage. They never consume
  // Home / Canal Yard / Warehouse storage slots and never appear twice in the
  // ordinary workshop strip.
  owned
    .filter(carId => String(carId || '').startsWith('crew__'))
    .forEach(carId => {
      result[carId] = 'crewSpace';
    });

  // Registered personal cars occupy the three separate professional bays.
  // Preserve these assignments before allocating the regular property slots,
  // including when older callers normalise storage without knowing the season.
  let proCount = 0;
  owned.forEach(carId => {
    if (result[carId] || inputLocations?.[carId] !== PRO_GARAGE_ID ||
        proCount >= PRO_GARAGE_WORKSHOP.capacity) return;
    result[carId] = PRO_GARAGE_ID;
    proCount++;
  });

  // Preserve valid existing assignments for ordinary cars only.
  owned.forEach(carId => {
    if (result[carId]) return;

    const requested = inputLocations?.[carId];
    if (!requested || !unlockedIds.has(requested)) return;

    const capacity = getWorkshopStorageCapacity(requested);
    if ((counts[requested] || 0) >= capacity) return;

    result[carId] = requested;
    counts[requested] = (counts[requested] || 0) + 1;
  });

  // Old saves had no physical garage assignment. Fill Home first, then each
  // newly unlocked property, matching the cumulative capacity model.
  owned.forEach(carId => {
    if (result[carId]) return;

    const destination = unlocked.find(workshop =>
      (counts[workshop.id] || 0) < getWorkshopStorageCapacity(workshop.id)
    ) || unlocked[unlocked.length - 1] || WORKSHOP_TIERS[0];

    result[carId] = destination.id;
    counts[destination.id] = (counts[destination.id] || 0) + 1;
  });

  return result;
}

export function getCarsInWorkshop(
  ownedCarIds = [],
  carGarageLocations = {},
  workshopLocationId = 'shinonomeWorkshop'
) {
  return (ownedCarIds || []).filter(carId =>
    carGarageLocations?.[carId] === workshopLocationId
  );
}

export function getWorkshopUsage(
  ownedCarIds = [],
  carGarageLocations = {},
  workshopLocationId = 'shinonomeWorkshop'
) {
  return getCarsInWorkshop(ownedCarIds, carGarageLocations, workshopLocationId).length;
}


export const WORKSHOP_REGIONAL_WIN_REQUIREMENTS = Object.freeze([0, 2, 5]);

function progressionSourceValue(source, key, fallback = null) {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
}

export function getTotalRegionalWins(source) {
  const challenges = progressionSourceValue(source, 'tunerTeamChallenges', {}) || {};
  return Object.values(challenges).filter(item =>
    Boolean(item?.championEarned || item?.completed)
  ).length;
}

export function getWorkshopRegionalWinRequirement(tier = 0) {
  const safeTier = clampWorkshopTier(tier);
  return Number(WORKSHOP_REGIONAL_WIN_REQUIREMENTS[safeTier] || 0);
}

// Arkon Story has authored workshop milestones. Regional championships still
// govern Career workshop purchases, but NEVER grant Story property access.
export function getArkonStoryWorkshopTier(source) {
  if (progressionSourceValue(source,'gameMode') !== 'arkonStory') return null;
  const chapter = Number(progressionSourceValue(source,'arkonStoryChapter',0)) || 0;
  const checkpoint = progressionSourceValue(source,'storyDirectorProgress')?.id;
  const canal = Boolean(progressionSourceValue(source,'arkonStoryCanalYardUnlocked')) ||
    chapter >= 3 ||
    Boolean(progressionSourceValue(source,'arkonStoryChapter03Done')) ||
    Boolean(progressionSourceValue(source,'arkonStoryChapter04Done')) ||
    ['arkonChapter03','arkonChapter04'].includes(checkpoint);
  // A future authored chapter explicitly sets this flag. Never infer HQ
  // ownership from wins, money, old career tiers, or the chapter number.
  // A completed Chapter 06 irrevocably owns Warehouse HQ. Repair legacy
  // profiles where the earlier chapter flagged completion but missed the
  // workshop unlock; also allow Chapters 07–10 from their checkpoints.
  const warehouse = Boolean(progressionSourceValue(source,'arkonStoryWarehouseUnlocked')) ||
    Boolean(progressionSourceValue(source,'arkonStoryChapter06Done')) ||
    ['arkonChapter07','arkonChapter08','arkonChapter09','arkonChapter10']
      .includes(checkpoint) ||
    chapter>=7;
  return warehouse ? 2 : canal ? 1 : 0;
}

export function isWorkshopProgressionReady(source, tier = 0) {
  if (getArkonStoryWorkshopTier(source) !== null) return clampWorkshopTier(tier) === 0;
  return getTotalRegionalWins(source) >= getWorkshopRegionalWinRequirement(tier);
}

export function getWorkshopProgressionLabel(source, tier = 0) {
  if (getArkonStoryWorkshopTier(source) !== null) {
    return clampWorkshopTier(tier) === 0 ? 'HOME WORKSHOP'
      : 'UNLOCKED THROUGH STORY';
  }
  const required = getWorkshopRegionalWinRequirement(tier);
  const current = getTotalRegionalWins(source);
  if (required <= 0 || current >= required) return 'REGIONAL WIN REQUIREMENT MET';
  return current + '/' + required + ' REGIONAL WINS';
}
