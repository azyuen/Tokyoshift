import { cars } from './cars.js?v=20261005-r345';

const COPY_MARKER = '__copy';

function parsedCopy(carId) {
  const id = String(carId || '');
  const match = id.match(/^(.*)__copy([2-9][0-9]*)$/);
  if (!match) return null;
  return {
    baseCarId: match[1],
    copyNumber: Math.max(2, Number(match[2] || 2)),
  };
}

export function getBaseCarId(carId) {
  const id = String(carId || '');
  if (!id) return '';

  const direct = cars[id];
  if (direct?.ownedBaseCarId) return String(direct.ownedBaseCarId);
  if (direct?.crewBaseCarId) return String(direct.crewBaseCarId);

  const parsed = parsedCopy(id);
  if (parsed && cars[parsed.baseCarId]) return parsed.baseCarId;
  return id;
}

export function getOwnedCarCopyNumber(carId) {
  const parsed = parsedCopy(carId);
  return parsed?.copyNumber || 1;
}

export function isUniqueCarModel(carId) {
  const baseId = getBaseCarId(carId);
  const car = cars[baseId];
  return Boolean(
    car?.collector ||
    car?.ginzaExclusive ||
    car?.tuningLocked ||
    car?.uniqueOwned
  );
}

export function registerOwnedCarInstance(instanceId, baseCarId = null) {
  const id = String(instanceId || '');
  if (!id) return null;
  if (cars[id]) return cars[id];

  const parsed = parsedCopy(id);
  const baseId = String(baseCarId || parsed?.baseCarId || '');
  const baseCar = cars[baseId];
  if (!baseCar || isUniqueCarModel(baseId)) return null;

  cars[id] = {
    ...baseCar,
    id,
    ownedBaseCarId: baseId,
    ownedCopyNumber: parsed?.copyNumber || 2,
    crewLoan: false,
    crewOwnerCharacterId: null,
    crewBaseCarId: null,
    visual: { ...(baseCar.visual || {}) },
  };
  return cars[id];
}

export function registerOwnedCarInstances(ownedCarIds = []) {
  (ownedCarIds || []).forEach(rawId => {
    const id = String(rawId || '');
    if (!id || cars[id]) return;
    const parsed = parsedCopy(id);
    if (parsed) registerOwnedCarInstance(id, parsed.baseCarId);
  });
  return cars;
}

export function ownsCarModel(ownedCarIds = [], carId) {
  const baseId = getBaseCarId(carId);
  return (ownedCarIds || []).some(id => getBaseCarId(id) === baseId);
}

export function countOwnedCarModel(ownedCarIds = [], carId) {
  const baseId = getBaseCarId(carId);
  return (ownedCarIds || []).reduce(
    (count, id) => count + (getBaseCarId(id) === baseId ? 1 : 0),
    0
  );
}

export function createOwnedCarInstanceId(ownedCarIds = [], carId, reservedCarIds = []) {
  const baseId = getBaseCarId(carId);
  if (!baseId || !cars[baseId]) return null;

  if (isUniqueCarModel(baseId)) {
    return ownsCarModel(ownedCarIds, baseId) ? null : baseId;
  }

  // Never recycle an old instance ID after a sale or pink-slip loss. Car
  // History can then follow one physical car for its entire life.
  const reserved = new Set([
    ...(ownedCarIds || []).map(String),
    ...(reservedCarIds || []).map(String),
  ]);
  if (!reserved.has(baseId)) return baseId;

  let copyNumber = 2;
  let instanceId = baseId + COPY_MARKER + copyNumber;
  while (reserved.has(instanceId)) {
    copyNumber += 1;
    instanceId = baseId + COPY_MARKER + copyNumber;
  }
  return instanceId;
}

export function createAndRegisterOwnedCarInstance(
  ownedCarIds = [],
  carId,
  reservedCarIds = []
) {
  const instanceId = createOwnedCarInstanceId(ownedCarIds, carId, reservedCarIds);
  if (!instanceId) return null;
  if (instanceId !== getBaseCarId(instanceId)) {
    registerOwnedCarInstance(instanceId, carId);
  }
  return instanceId;
}
