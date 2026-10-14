// Canonical 2026 stock models: Galant VR-4 replaces the historical EVO III
// save slot; the GC8 WRX STI replaces the historical 22B save slot.
//
// Migrate before GameState registers owned-car aliases. This preserves every
// distinct owned copy, tune, history entry, coupon and workshop assignment.
const LEGACY_TO_CANONICAL = Object.freeze({
  evo3: 'galant',
  wrx22b: 'gc8',
});
const OWNED_COPY_PATTERN = /^(evo3|wrx22b)(__copy[2-9][0-9]*)?$/;
const MODEL_ONLY_FIELDS = new Set([
  'baseCarId', 'crewBaseCarId', 'ownedBaseCarId',
  'opponentCarId', 'selectedOpponentCarId',
]);

export function canonicalCarModelId(value) {
  if (typeof value !== 'string') return value;
  const match = value.match(OWNED_COPY_PATTERN);
  if (!match) return value;
  return LEGACY_TO_CANONICAL[match[1]] + (match[2] || '');
}

export function migrateCanonicalCarModels(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;

  // Most saves will already be canonical. Avoid cloning large profiles on each
  // subsequent snapshot/normalisation.
  const sourceText = JSON.stringify(input);
  if (!/wrx22b|evo3|ej22g|EJ22G/.test(sourceText)) return input;

  const instances = [
    ...(Array.isArray(input.ownedCarIds) ? input.ownedCarIds : []),
    ...Object.keys(input.carStates || {}),
    ...Object.keys(input.carGarageLocations || {}),
    ...(Array.isArray(input.carHistory) ? input.carHistory.map(x => x?.carId) : []),
  ].filter(x => typeof x === 'string');

  const occupied = new Set(instances.filter(id => !OWNED_COPY_PATTERN.test(id)));
  const substitutions = new Map();
  const legacyInstances = [...new Set(instances.filter(id => OWNED_COPY_PATTERN.test(id)))];

  // Reserve one distinct canonical ID per historical physical car. A rare
  // mixed-version save containing both old and new examples keeps both cars.
  for (const previous of legacyInstances) {
    const desired = canonicalCarModelId(previous);
    const model = desired.split('__copy')[0];
    let candidate = desired;
    let copy = 2;
    while (occupied.has(candidate)) {
      candidate = model + '__copy' + copy;
      copy += 1;
    }
    substitutions.set(previous, candidate);
    occupied.add(candidate);
  }

  const mapInstanceId = id => {
    if (typeof id !== 'string') return id;
    return substitutions.get(id) || canonicalCarModelId(id);
  };

  const walk = (value, field = '') => {
    if (typeof value === 'string') {
      if (value === 'ej22g' && field === 'engine') return 'ej207_gc8';
      if (value === 'EJ22G' && field === 'engineModel') return 'EJ207';
      if (MODEL_ONLY_FIELDS.has(field)) {
        const id = canonicalCarModelId(value);
        return typeof id === 'string' ? id.split('__copy')[0] : id;
      }
      return mapInstanceId(value);
    }
    if (Array.isArray(value)) return value.map(item => walk(item, field));
    if (!value || typeof value !== 'object') return value;

    if (field === 'carCoupons') {
      const merged = {};
      for (const [oldKey, amount] of Object.entries(value)) {
        const nextKey = canonicalCarModelId(oldKey).split('__copy')[0];
        merged[nextKey] = Math.max(0, Number(merged[nextKey] || 0)) +
          Math.max(0, Number(amount || 0));
      }
      return merged;
    }

    // Canonical records win over old keys if an imported save contains
    // conflicting non-car metadata. Physical owned instances do not collide
    // because substitutions above allocate separate copy identifiers.
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      const renamed = mapInstanceId(key);
      if (Object.prototype.hasOwnProperty.call(result, renamed) &&
          renamed !== key) continue;
      result[renamed] = walk(item, key);
    }
    return result;
  };

  return walk(input);
}
