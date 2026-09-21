export const WORKSHOP_TIERS = [
  {
    tier: 0,
    id: 'shinonomeWorkshop',
    label: 'HOME WORKSHOP',
    shortLabel: 'HOME',
    capacity: 4,
    unlockCost: 0,
    textureKey: 'garageWorkshopBg',
    description: 'Your original bay-side workshop.',
  },
  {
    tier: 1,
    id: 'shinonomeCanalYard',
    label: 'CANAL YARD GARAGE',
    shortLabel: 'CANAL YARD',
    capacity: 6,
    unlockCost: 180000,
    textureKey: 'garageWorkshopTunerBg',
    description: 'Lease a larger waterside tuning bay with room for six cars.',
  },
  {
    tier: 2,
    id: 'shinonomeWarehouseStrip',
    label: 'WAREHOUSE HQ',
    shortLabel: 'WAREHOUSE HQ',
    capacity: 8,
    unlockCost: 450000,
    textureKey: 'garageWorkshopTunerBg',
    description: 'Take over a full warehouse and build an eight-car tuning headquarters.',
  },
];

export const MAX_GARAGE_CAPACITY = WORKSHOP_TIERS[WORKSHOP_TIERS.length - 1].capacity;

export function clampWorkshopTier(value = 0) {
  return Math.max(0, Math.min(WORKSHOP_TIERS.length - 1, Math.round(Number(value) || 0)));
}

export function getWorkshopTier(value = 0) {
  return WORKSHOP_TIERS[clampWorkshopTier(value)];
}

export function getWorkshopByLocationId(locationId) {
  return WORKSHOP_TIERS.find(item => item.id === locationId) || WORKSHOP_TIERS[0];
}

export function getGarageCapacity(tier = 0) {
  return getWorkshopTier(tier).capacity;
}

export function inferWorkshopTier(ownedCount = 0, savedTier = 0) {
  let tier = clampWorkshopTier(savedTier);
  const count = Math.max(0, Number(ownedCount) || 0);

  while (
    tier < WORKSHOP_TIERS.length - 1 &&
    count > WORKSHOP_TIERS[tier].capacity
  ) {
    tier += 1;
  }

  return tier;
}

export function isWorkshopUnlocked(locationId, tier = 0) {
  return getWorkshopByLocationId(locationId).tier <= clampWorkshopTier(tier);
}
