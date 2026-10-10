// Permanent EVO IX retirement. Convert old owned examples and any saved
// coupons to EVO VI without discarding upgrades or duplicate car instances.
// Runs before GameState registers car aliases or filters unknown models.
const OLD_MODEL = /^evo9(?:__copy([2-9]\d*))?$/;
const NEW_MODEL = /^evo6(?:__copy([2-9]\d*))?$/;

export function migrateRetiredEvoIX(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;

  const owned = Array.isArray(input.ownedCarIds) ? input.ownedCarIds : [];
  const states = Object.keys(input.carStates || {});
  const garages = Object.keys(input.carGarageLocations || {});
  const history = Array.isArray(input.carHistory)
    ? input.carHistory.map(entry => entry?.carId).filter(Boolean) : [];
  const allIds = [...owned, ...states, ...garages, ...history];
  const retiredIds = [...new Set(allIds.filter(id => OLD_MODEL.test(String(id))))];
  const existingIds = new Set(allIds.filter(id => NEW_MODEL.test(String(id))).map(String));
  const substitutions = new Map();
  let nextCopy = 2;

  for (const retired of retiredIds) {
    let destination = 'evo6';
    if (existingIds.has(destination)) {
      do {
        destination = 'evo6__copy' + nextCopy;
        nextCopy += 1;
      } while (existingIds.has(destination));
    }
    substitutions.set(String(retired), destination);
    existingIds.add(destination);
  }

  const mapId = id => {
    if (typeof id !== 'string') return id;
    return substitutions.get(id) || (OLD_MODEL.test(id) ? 'evo6' : id);
  };

  // Recurse through nested race snapshots/competition offers as well as the
  // garage. No in-place edits: backups and other profile slots stay intact.
  const convert = (value, parentKey = '') => {
    if (typeof value === 'string') return mapId(value);
    if (Array.isArray(value)) return value.map(item => convert(item, parentKey));
    if (!value || typeof value !== 'object') return value;
    if (parentKey === 'carCoupons') {
      const out = {};
      for (const [id, amount] of Object.entries(value)) {
        const key = OLD_MODEL.test(id) ? 'evo6' : id;
        out[key] = Math.max(0, Number(out[key] || 0)) + Math.max(0, Number(amount || 0));
      }
      return out;
    }

    const out = {};
    for (const [key, item] of Object.entries(value)) {
      const nextKey = mapId(key);
      if (Object.hasOwn(out, nextKey) && nextKey !== key) {
        // A genuine EVO VI record always takes priority over an unexpected
        // collision; owned instances are assigned distinct keys above.
        continue;
      }
      out[nextKey] = convert(item, key);
    }
    return out;
  };
  return convert(input);
}
