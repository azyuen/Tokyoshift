// Ginza collector loans are for Tokyo street meets and cruising only.
// Restrict destinations at the shared travel-map layer AND scene transition
// boundaries, so links, stale UI and reloaded saves cannot bypass the rule.
const BLOCKED_LOCATIONS = new Set([
  'tokyoDragComplex',
  'tokyoAutoMarket',
  'oshiageDrivingSchool',
  'oshiageCustomWorks',
  'shinonomeWorkshop',
  'shinonomeCanalYard',
  'shinonomeWarehouseStrip',
]);
export const GINZA_LOAN_BLOCK_LABEL = 'GINZA LOAN // RETURN CAR FIRST';

const read = (registry, key) =>
  typeof registry?.get === 'function' ? registry.get(key) : registry?.[key];

export function isGinzaLoanActive(registry) {
  const rental = read(registry, 'ginzaTestDrive');
  return Boolean(rental && typeof rental.carId === 'string' && rental.carId.startsWith('ginzaDemo_'));
}

export function canVisitDuringGinzaLoan(registry, locationId) {
  if (!isGinzaLoanActive(registry)) return true;
  if (!locationId) return false;
  if (locationId === 'ginzaMotorGallery') return true;
  return !BLOCKED_LOCATIONS.has(locationId);
}

export function canUseTunerDuringGinzaLoan(registry) {
  return !isGinzaLoanActive(registry);
}

export function ginzaRoomDuringLoan(registry, requestedRoom = 1) {
  return isGinzaLoanActive(registry) ? 3
    : Math.min(3, Math.max(1, Number(requestedRoom) || 1));
}
