// Reversible per-car factory-stock preparation. Purchased components remain
// in the save; only the active engine/chassis/NOS/specialist build is changed.
import { isCrewEventFactoryStock } from './crewBattleRules.js';
import { getInstalledSpecialistTuning } from './tunerShops.js';

const TUNE_FIELDS = Object.freeze([
  'stock', 'tuneLevel', 'tuning', 'engineTuning', 'drivetrainTuning',
  'chassisTuning', 'exhaustNosTuning', 'specialistTuning',
  'stage3Calibration', 'nosInstalled', 'nosPower', 'nosShots',
  'nosCapacitySeconds', 'nosShotDurationSeconds', 'buildRating', 'buildArchetype',
]);
const FEES = Object.freeze({
  ODAIBA: 5000, SHINAGAWA: 5000, TATSUMI: 10000,
  SHIBUYA: 10000, YOKOHAMA: 15000, DAIKOKU: 15000,
  SHINJUKU: 20000, WAREHOUSE: 10000,
});
const clone = value => JSON.parse(JSON.stringify(value));
const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

export function getStockTuneServiceFee(shop = null) {
  return FEES[String(shop?.regionId || 'WAREHOUSE').toUpperCase()] || FEES.WAREHOUSE;
}
export function hasStockTuneService(state = {}) {
  return Boolean(state?.stockTuneService?.version === 1 && state.stockTuneService.tune);
}
const originalTune = state => state?.stockTuneService?.tune || state || {};
function shopDidWork(state, shop) {
  const installed = getInstalledSpecialistTuning(originalTune(state));
  return Boolean(shop?.id && (shop.tuningOptions || [])
    .some(option => installed.includes(option.id)));
}

// Specialist builds go back to any shop which performed specialist work on
// that car. Ordinary garage-only builds can be serviced by Daichi at HQ.
export function getStockTuneServiceAction(state = {}, shop = null) {
  const specialist = getInstalledSpecialistTuning(originalTune(state));
  const fee = getStockTuneServiceFee(shop);
  const make = (action, reason = '') => ({ action, reason, fee });
  if (state?.storedKit) return make(null, 'RESTORE THE EXISTING STORED KIT FIRST');
  if (specialist.length && !shopDidWork(state, shop))
    return make(null, 'RETURN TO A TUNER THAT WORKED ON THIS CAR');
  if (!specialist.length && shop?.id)
    return make(null, 'DAICHI SERVICES STANDARD UPGRADES AT WAREHOUSE HQ');
  if (!hasStockTuneService(state)) {
    if (isCrewEventFactoryStock(state)) return make(null, 'ALREADY FACTORY STOCK');
    return make('PREPARE');
  }
  if (!isCrewEventFactoryStock(state))
    return make(null, 'REMOVE NEW MODIFICATIONS BEFORE RESTORING THE SAVED TUNE');
  return make('RESTORE');
}

export function applyStockTuneService(state = {}, shop = null) {
  const quote = getStockTuneServiceAction(state, shop);
  if (!quote.action) return null;
  const result = clone(state);
  if (quote.action === 'RESTORE') {
    for (const key of TUNE_FIELDS) {
      if (has(result.stockTuneService.tune, key))
        result[key] = clone(result.stockTuneService.tune[key]);
      else delete result[key];
    }
    delete result.stockTuneService;
    return result;
  }
  const tune = {};
  for (const key of TUNE_FIELDS) if (has(result, key)) tune[key] = clone(result[key]);
  result.stockTuneService = { version: 1, shopId: shop?.id || 'warehouse', tune };
  result.stock = true;
  result.tuneLevel = 0;
  result.tuning = {};
  result.engineTuning = {};
  result.drivetrainTuning = {};
  result.chassisTuning = {};
  result.exhaustNosTuning = {};
  result.specialistTuning = [];
  result.stage3Calibration = { ecuBias: 0, boostBias: 0, gearBias: 0 };
  result.nosInstalled = false;
  result.nosPower = 0;
  result.nosShots = 0;
  result.nosCapacitySeconds = 0;
  result.nosShotDurationSeconds = 0;
  result.buildRating = 1;
  result.buildArchetype = 'stock';
  return result;
}
