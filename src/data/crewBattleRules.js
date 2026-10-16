// Shared, real-performance regional crew race regulations. Event trims are
// reversible race configurations; never mutate the player's saved car state.
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261006-r388';

const OPEN = Object.freeze({ label: 'OPEN CLASS' });
const NO_NOS = Object.freeze({ label: 'NO NOS', noNos: true });
const STOCK = Object.freeze({ label: 'FACTORY STOCK', stock: true, noNos: true });
const capped = (kw, noNos = false) => Object.freeze({
  label: 'MAX ' + kw + ' KW' + (noNos ? ' / NO NOS' : ''),
  maxPowerKW: kw, noNos,
});

export const CREW_BATTLE_REGION_RULES = Object.freeze({
  ODAIBA: Object.freeze({ focus: 'OPEN CREW / FIND YOUR RHYTHM', build: 2, ai: [3,3,4], heats: [OPEN, OPEN, OPEN] }),
  SHINAGAWA: Object.freeze({ focus: 'ENGINE RESPONSE / NO NOS', build: 2, ai: [3,4,4], heats: [NO_NOS, NO_NOS, NO_NOS] }),
  TATSUMI: Object.freeze({ focus: 'PRECISION / 260 KW CLASS', build: 3, ai: [4,4,4], heats: [capped(260), capped(260), capped(260)] }),
  SHIBUYA: Object.freeze({ focus: 'STOCK SKILL / OPEN PERFORMANCE', build: 3, ai: [4,4,5], heats: [STOCK, OPEN, OPEN] }),
  YOKOHAMA: Object.freeze({ focus: 'POWER CLASS / HIGH SPEED', build: 4, ai: [4,5,5], heats: [capped(260), OPEN, OPEN] }),
  DAIKOKU: Object.freeze({ focus: 'ENGINEERING / CONTROLLED POWER', build: 4, ai: [5,5,5], heats: [capped(380, true), capped(380, true), capped(380, true)] }),
  SHINJUKU: Object.freeze({ focus: 'TECHNICAL FINALS / THREE CLASSES', build: 5, ai: [5,5,5], heats: [STOCK, capped(380), OPEN] }),
});
export const CREW_BATTLE_REGIONS = Object.freeze(Object.keys(CREW_BATTLE_REGION_RULES));
export function getCrewBattleRegionRules(regionId) {
  return CREW_BATTLE_REGION_RULES[String(regionId || '').toUpperCase()] || null;
}
export function getCrewBattleHeatRule(regionId, index = 0) {
  const heats = getCrewBattleRegionRules(regionId)?.heats;
  return heats?.[Math.max(0, Math.min(2, Math.floor(Number(index) || 0)))] || OPEN;
}
const copy = value => JSON.parse(JSON.stringify(value || {}));

export function eventStockState(previous = {}) {
  return {
    ...copy(previous),
    stock: true,
    nosInstalled: false,
    nosPower: 0,
    nosCapacitySeconds: 0,
    tuneLevel: 0,
    buildRating: 1,
    buildArchetype: 'stock',
    tuning: { engine: 0, intake: 0, ecu: 0, turbo: 0, intercooler: 0 },
    engineTuning: {},
    drivetrainTuning: { clutch: 0, gearbox: 0, differential: 0, suspension: 0, launchSetup: 0 },
    chassisTuning: { tyres: 0, weightReduction: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 0, muffler: 0, nosKit: 0, nitrousShot: 0 },
    specialistTuning: [],
    stage3Calibration: {},
  };
}

// The applied configuration is shared by lineup preview, eligibility and
// live player/opponent physics. A power cap above factory output can always be
// met with a reversible factory trim; engines exceeding the cap even at stock
// remain ineligible and must not be silently power-limited.
export function getCrewEventCarSetup(carId, installedState = {}, rule = OPEN) {
  if (!carId) return { eligible: false, reason: 'NO CAR', state: {} };
  const original = copy(installedState);
  let state = rule.stock ? eventStockState(original) : original;
  let adjustment = rule.stock ? 'FACTORY SETUP' : '';
  if (rule.noNos) {
    const hadNos = Boolean(state.nosInstalled || state.exhaustNosTuning?.nosKit);
    state.nosInstalled = false;
    state.nosPower = 0;
    state.nosCapacitySeconds = 0;
    state.exhaustNosTuning = { ...(state.exhaustNosTuning || {}), nosKit: 0, nitrousShot: 0 };
    if (!rule.stock && hadNos) adjustment = 'NOS DISABLED';
  }
  let performance;
  try { performance = getVehiclePerformance(carId, state); }
  catch (_) { return { eligible: false, reason: 'PERFORMANCE UNAVAILABLE', state }; }
  let powerKW = Number(performance?.car?.powerKW);
  if (!Number.isFinite(powerKW)) return { eligible: false, reason: 'POWER UNAVAILABLE', state };
  const limit = Number(rule.maxPowerKW);
  if (Number.isFinite(limit) && powerKW > limit + .001) {
    const stock = eventStockState(original);
    const stockPerformance = getVehiclePerformance(carId, stock);
    const stockPower = Number(stockPerformance?.car?.powerKW);
    if (!Number.isFinite(stockPower) || stockPower > limit + .001) {
      return { eligible: false, reason: 'FACTORY POWER EXCEEDS ' + limit + ' KW', state, powerKW };
    }
    state = stock;
    powerKW = stockPower;
    adjustment = 'FACTORY POWER TRIM';
  }
  return { eligible: true, state, powerKW, adjustment, ruleLabel: rule.label || 'OPEN CLASS' };
}

const FOCUS = Object.freeze({
  stock: 'FACTORY SKILL', launchDrag: 'LAUNCH / TRACTION',
  naHighRev: 'HIGH RPM / RESPONSE', turboRoll: 'BOOST / TOP END',
  lightweight: 'WEIGHT / GRIP', balancedStreet: 'BALANCED SETUP',
});
const UPGRADES = [
  ['tuning','engine','ENGINE'],['tuning','intake','INTAKE'],['tuning','ecu','ECU'],
  ['tuning','turbo','TURBO'],['tuning','intercooler','INTERCOOLER'],
  ['drivetrainTuning','clutch','CLUTCH'],['drivetrainTuning','gearbox','GEARBOX'],
  ['drivetrainTuning','differential','DIFF'],['chassisTuning','tyres','TYRES'],
  ['chassisTuning','weightReduction','WEIGHT'],['exhaustNosTuning','nosKit','NOS'],
];
export function getCrewBattleScout(buildState = {}) {
  const upgrades = UPGRADES.map(([section, part, label]) => ({
    label, level: Number(buildState?.[section]?.[part] || 0),
  })).filter(item => item.level > 0)
    .sort((a,b) => b.level - a.level || a.label.localeCompare(b.label));
  return {
    focus: FOCUS[buildState.buildArchetype] || (upgrades.length ? 'CUSTOM TUNING' : 'FACTORY SKILL'),
    upgrades: upgrades.slice(0, 3).map(item => item.label),
    label: upgrades.length ? upgrades.slice(0, 2).map(item => item.label).join(' + ') : 'FACTORY STOCK',
  };
}
