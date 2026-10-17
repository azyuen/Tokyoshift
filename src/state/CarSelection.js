// Preserve the last user-selected personal car separately from event overrides.
import { cars } from '../data/cars.js?v=20261011-r479';
const read = (source, key, fallback = null) =>
  (typeof source?.get === 'function' ? source.get(key) : source?.[key]) ?? fallback;
const personal = (source, id) =>
  Boolean(id && (read(source, 'ownedCarIds', []) || []).includes(id) &&
    cars[id] && !cars[id].crewLoan);
export function getPreferredCarId(source) {
  const preferred = read(source, 'preferredCarId');
  if (personal(source, preferred)) return preferred;
  const selected = read(source, 'selectedCarId');
  if (personal(source, selected)) return selected;
  return (read(source, 'ownedCarIds', []) || []).find(id => personal(source, id)) || null;
}
export function choosePersonalCar(registry, id) {
  if (!registry?.set || !personal(registry, id)) return false;
  registry.set('preferredCarId', id);
  registry.set('selectedCarId', id);
  return true;
}
export function restorePreferredCar(registry) {
  if (!registry?.set) return null;
  // A Ginza loan remains the driven vehicle across map/Meet transitions,
  // even when a stale preferredCarId still points at the personal garage.
  const demoId = read(registry, 'ginzaTestDrive')?.carId;
  if (demoId && personal(registry, demoId) && cars[demoId]?.ginzaDemo) {
    if (registry.get('selectedCarId') !== demoId) registry.set('selectedCarId', demoId);
    if (registry.get('preferredCarId') !== demoId) registry.set('preferredCarId', demoId);
    return demoId;
  }
  // Loan-car battles and active Oshiage series intentionally lock their car.
  if (read(registry, 'crewSpaceActive', false) ||
      read(registry, 'crewBattleState')?.active ||
      read(registry, 'oshiageEliteSeries')?.active) {
    return read(registry, 'selectedCarId');
  }
  const id = getPreferredCarId(registry);
  if (id && registry.get('selectedCarId') !== id) registry.set('selectedCarId', id);
  return id;
}
