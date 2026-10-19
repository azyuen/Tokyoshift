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

// Flat service labour throughout Warehouse HQ and Crew Space (in-game yen).
export const PART_UNINSTALL_FEE = 20000;
export function getPartRemovalQuote(carState = {}, category, partId) {
  const group = PART_CATEGORIES[category];
  const part = group?.parts?.[partId];
  if (!group || !part) return null;

  const tuning = group.get(carState);
  const level = Number(tuning[partId] || 0);
  if (level <= 0) return null;

  const removesShot = category === 'exhaustNos' &&
    partId === 'nosKit' && Number(tuning.nitrousShot || 0) > 0;

  return {
    category,
    partId,
    partName: part.name,
    level,
    cost: PART_UNINSTALL_FEE,
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


// Warehouse HQ: one removable kit per vehicle. Stored levels belong to the
// vehicle's saved state, not to a transferable player inventory.
export const STORE_KIT_REMOVE_FEE = PART_UNINSTALL_FEE;
export const STORE_KIT_RESTORE_FEE = 50000;
export const STORE_KIT_GROUPS = Object.freeze(Object.keys(PART_CATEGORIES));

export function listStorableKitParts(state = {}) {
  return STORE_KIT_GROUPS.flatMap(category => {
    const group = PART_CATEGORIES[category];
    const levels = group.get(state);
    return Object.keys(group.parts).filter(partId => Number(levels[partId] || 0) > 0)
      .map(partId => ({
        key: category + ':' + partId,
        category, partId, name: group.parts[partId].name,
        level: Number(levels[partId] || 0),
      }));
  });
}

export function storeSelectedKitParts(state = {}, keys = []) {
  if (state.storedKit || !Array.isArray(keys) || !keys.length) return null;
  const available = listStorableKitParts(state);
  const selected = available.filter(item => keys.includes(item.key));
  if (!selected.length || selected.length !== new Set(keys).size) return null;
  // NOS shot must be removed before its kit. Removing the kit first also
  // clears the shot and would otherwise make a valid multi-part kit fail.
  selected.sort((a, b) => Number(b.partId === 'nitrousShot') -
    Number(a.partId === 'nitrousShot'));
  let updated = { ...state };
  const stored = {};
  for (const item of selected) {
    stored[item.key] = item.level;
    updated = removeTuningPartFromState(updated, item.category, item.partId);
    if (!updated) return null;
  }
  updated.storedKit = { version: 1, parts: stored };
  updated.stock = listStorableKitParts(updated).length === 0 && !Number(updated.tuneLevel || 0);
  return updated;
}

export function restoreStoredKitParts(state = {}) {
  const stored = state.storedKit?.parts;
  if (!stored || typeof stored !== 'object') return null;
  const updated = { ...state };
  for (const category of STORE_KIT_GROUPS) {
    const group = PART_CATEGORIES[category];
    const tuning = { ...group.get(updated) };
    for (const partId of Object.keys(group.parts)) {
      const storedLevel = Number(stored[category + ':' + partId] || 0);
      if (storedLevel > 0) tuning[partId] = Math.max(Number(tuning[partId] || 0), storedLevel);
    }
    if (category === 'engine') {
      updated.tuning = { ...tuning };
      updated.engineTuning = { ...tuning };
    } else {
      updated[group.field] = tuning;
    }
  }
  // The exhaust legacy alias must not resurrect a lower-tier part.
  const exhaust = Number(updated.exhaustNosTuning?.exhaust || 0);
  if (exhaust > 0) {
    updated.tuning = { ...updated.tuning, exhaust: Math.max(exhaust, Number(updated.tuning?.exhaust || 0)) };
    updated.engineTuning = { ...updated.engineTuning, exhaust: Math.max(exhaust, Number(updated.engineTuning?.exhaust || 0)) };
  }
  const nosKit = Number(updated.exhaustNosTuning?.nosKit || 0);
  updated.nosInstalled = nosKit > 0;
  if (nosKit) {
    const kit = EXHAUST_NOS_TUNING_PARTS.nosKit.levels[nosKit];
    const shot = EXHAUST_NOS_TUNING_PARTS.nitrousShot.levels[Number(updated.exhaustNosTuning?.nitrousShot || 0)];
    updated.nosCapacitySeconds = Number(kit?.capacitySeconds || 0);
    updated.nosShots = Number(shot?.shots || 0);
    updated.nosPower = Number(shot?.powerHp || 0);
  }
  delete updated.storedKit;
  updated.stock = listStorableKitParts(updated).length === 0 && !Number(updated.tuneLevel || 0);
  return updated;
}
