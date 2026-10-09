// Destructive workshop part removal. A removed kit is scrapped rather than
// transferred to inventory; reinstalling it uses the normal upgrade path.
import {
  ENGINE_TUNING_PARTS,
  getEngineTuning,
} from './tuning.js?v=20260926-r211';
import {
  DRIVETRAIN_TUNING_PARTS,
  CHASSIS_TUNING_PARTS,
  EXHAUST_NOS_TUNING_PARTS,
  getDrivetrainTuning,
  getChassisTuning,
  getExhaustNosTuning,
} from './secondaryTuning.js?v=20261008-r428';

const PART_CATEGORIES = {
  engine: {
    parts: ENGINE_TUNING_PARTS,
    get: getEngineTuning,
    field: 'tuning',
  },
  drivetrain: {
    parts: DRIVETRAIN_TUNING_PARTS,
    get: getDrivetrainTuning,
    field: 'drivetrainTuning',
  },
  chassis: {
    parts: CHASSIS_TUNING_PARTS,
    get: getChassisTuning,
    field: 'chassisTuning',
  },
  exhaustNos: {
    parts: EXHAUST_NOS_TUNING_PARTS,
    get: getExhaustNosTuning,
    field: 'exhaustNosTuning',
  },
};

// Charge labour, not a buyback penalty. All costs are in game yen.
export function getPartRemovalQuote(carState = {}, category, partId) {
  const group = PART_CATEGORIES[category];
  const part = group?.parts?.[partId];
  if (!group || !part) return null;

  const tuning = group.get(carState);
  const level = Number(tuning[partId] || 0);
  if (level <= 0) return null;

  let value = Number(part.levels[level]?.cost || 0);
  const removesShot = category === 'exhaustNos' &&
    partId === 'nosKit' && Number(tuning.nitrousShot || 0) > 0;
  if (removesShot) {
    value += Number(
      EXHAUST_NOS_TUNING_PARTS.nitrousShot.levels[tuning.nitrousShot]?.cost || 0
    );
  }

  return {
    category,
    partId,
    partName: part.name,
    level,
    cost: Math.max(1000, Math.ceil(value * 0.15 / 500) * 500),
    removesShot,
  };
}

export function removeTuningPartFromState(carState = {}, category, partId) {
  const quote = getPartRemovalQuote(carState, category, partId);
  if (!quote) return null;

  const group = PART_CATEGORIES[category];
  const updated = { ...carState };
  const tuning = { ...group.get(carState), [partId]: 0 };

  if (category === 'engine') {
    // Older saves may still carry the alias; both must match after removal.
    updated.tuning = { ...tuning };
    updated.engineTuning = { ...tuning };
  } else {
    updated[group.field] = tuning;
  }

  if (category === 'exhaustNos') {
    if (partId === 'nosKit') tuning.nitrousShot = 0;
    if (partId === 'nosKit' || partId === 'nitrousShot') {
      updated.nosPower = 0;
      updated.nosInstalled = tuning.nosKit > 0;
      updated.nosCapacitySeconds = 0;
      updated.nosShots = 0;
    }
    if (partId === 'exhaust') {
      // Otherwise the R114 migration alias can restore a scrapped exhaust.
      if (updated.tuning) updated.tuning = { ...updated.tuning, exhaust: 0 };
      if (updated.engineTuning) {
        updated.engineTuning = { ...updated.engineTuning, exhaust: 0 };
      }
    }
  }

  // Preserve unrelated installed parts, cosmetics, acquisition, presets and
  // tuning permissions. Only the selected component returns to level zero.
  return updated;
}
