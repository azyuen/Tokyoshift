export const WORKSHOP_TIERS = [
  {
    tier: 0,
    id: 'shinonomeWorkshop',
    label: 'HOME WORKSHOP',
    shortLabel: 'HOME',
    capacity: 4,
    unlockCost: 0,
    textureKey: 'garageWorkshopBg',
    description: 'Your original bay-side workshop with four storage slots.',
  },
  {
    tier: 1,
    id: 'shinonomeCanalYard',
    label: 'CANAL YARD GARAGE',
    shortLabel: 'CANAL YARD',
    capacity: 12,
    unlockCost: 180000,
    textureKey: 'garageWorkshopTunerBg',
    description: 'Lease a larger waterside tuning bay and add twelve storage slots.',
  },
  {
    tier: 2,
    id: 'shinonomeWarehouseStrip',
    label: 'WAREHOUSE HQ',
    shortLabel: 'WAREHOUSE HQ',
    capacity: 24,
    unlockCost: 450000,
    textureKey: 'garageWorkshopTunerBg',
    description: 'Take over a full warehouse and add twenty-four storage slots.',
  },
];

export const MAX_GARAGE_CAPACITY = WORKSHOP_TIERS
  .reduce((total, workshop) => total + Number(workshop.capacity || 0), 0);

export function clampWorkshopTier(value = 0) {
  return Math.max(0, Math.min(WORKSHOP_TIERS.length - 1, Math.round(Number(value) || 0)));
}

export function getWorkshopTier(value = 0) {
  return WORKSHOP_TIERS[clampWorkshopTier(value)];
}

export function getWorkshopByLocationId(locationId) {
  return WORKSHOP_TIERS.find(item => item.id === locationId) || WORKSHOP_TIERS[0];
}

// Storage is cumulative. Owning Home + Canal Yard means 4 + 12 = 16 cars;
// owning all three Shinonome properties gives 4 + 12 + 24 = 40.
export function getGarageCapacity(tier = 0) {
  const unlockedTier = clampWorkshopTier(tier);
  return WORKSHOP_TIERS
    .filter(item => item.tier <= unlockedTier)
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
