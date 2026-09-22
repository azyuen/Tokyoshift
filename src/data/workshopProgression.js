export const WORKSHOP_TIERS = [
  {
    tier: 0,
    id: 'shinonomeWorkshop',
    label: 'HOME WORKSHOP',
    shortLabel: 'HOME',
    capacity: 4,
    unlockCost: 0,
    textureKey: 'garageWorkshopBg',
    serviceMultiplier: 1.00,
    description: 'Your original bay-side workshop with four storage slots and basic street tuning.',
  },
  {
    tier: 1,
    id: 'shinonomeCanalYard',
    label: 'CANAL YARD GARAGE',
    shortLabel: 'CANAL YARD',
    capacity: 12,
    unlockCost: 180000,
    textureKey: 'garageWorkshopCanalYard',
    serviceMultiplier: 1.08,
    description: 'An old-school local mechanic workshop with twelve more slots and serious performance work.',
  },
  {
    tier: 2,
    id: 'shinonomeWarehouseStrip',
    label: 'WAREHOUSE HQ',
    shortLabel: 'WAREHOUSE HQ',
    capacity: 24,
    unlockCost: 450000,
    textureKey: 'garageWorkshopWarehouseHQ',
    serviceMultiplier: 1.15,
    description: 'A professional tuning headquarters with twenty-four more slots and unrestricted race parts.',
  },
];

export const MAX_GARAGE_CAPACITY = WORKSHOP_TIERS
  .reduce((total, workshop) => total + Number(workshop.capacity || 0), 0);

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
    launchSetup: [0, 0, 1, 2],
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
  return WORKSHOP_TIERS.find(item => item.id === locationId) || WORKSHOP_TIERS[0];
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

export function canInstallTuningLevel(category, partId, level, workshopLocationId) {
  const activeTier = getWorkshopByLocationId(workshopLocationId).tier;
  return activeTier >= getRequiredWorkshopTier(category, partId, level);
}

export function getWorkshopRequirementLabel(category, partId, level = 0) {
  const requiredTier = getRequiredWorkshopTier(category, partId, level);
  return WORKSHOP_TIERS[requiredTier]?.shortLabel || WORKSHOP_TIERS[0].shortLabel;
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

  // Preserve valid existing assignments first.
  owned.forEach(carId => {
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
