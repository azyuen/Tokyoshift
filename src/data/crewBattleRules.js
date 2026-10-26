// Regional crew regulations are strict eligibility checks for player cars.
// Never auto-trim a player's engine, upgrades or installed NOS for a race.
// Opponents are generated with legal builds before registration.
import { getVehiclePerformance } from '../vehicles/VehiclePerformance.js?v=20261026-r687';

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
  TATSUMI: Object.freeze({ focus: 'PRECISION / 220 KW CLASS', build: 3, ai: [4,4,4], heats: [capped(220), capped(220), capped(220)] }),
  SHIBUYA: Object.freeze({ focus: 'STOCK SKILL / OPEN PERFORMANCE', build: 3, ai: [4,4,5], heats: [STOCK, OPEN, OPEN] }),
  YOKOHAMA: Object.freeze({ focus: 'POWER CLASS / HIGH SPEED', build: 4, ai: [4,5,5], heats: [capped(300), capped(300), OPEN] }),
  DAIKOKU: Object.freeze({ focus: 'ENGINEERING / CONTROLLED POWER', build: 4, ai: [5,5,5], heats: [capped(380, true), capped(380, true), capped(380, true)] }),
  SHINJUKU: Object.freeze({ focus: 'TECHNICAL FINALS / THREE CLASSES', build: 5, ai: [5,5,5], heats: [STOCK, capped(380, true), OPEN] }),
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
    nosShots: 0,
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

// Check active performance changes, not paint/wheels or upgrades stored off-car.
const hasInstalledUpgrades = (values = {}) => Object.values(values || {})
  .some(value => typeof value === 'number'
    ? Math.abs(value) > 0.0001
    : value && typeof value === 'object' && hasInstalledUpgrades(value));

export function isCrewEventFactoryStock(state = {}) {
  const parts = [
    state.tuning, state.engineTuning, state.drivetrainTuning,
    state.chassisTuning, state.exhaustNosTuning,
  ];
  return !parts.some(hasInstalledUpgrades) &&
    !Number(state.tuneLevel || 0) &&
    !Boolean(state.nosInstalled) &&
    !Number(state.nosShots || 0) &&
    !(Array.isArray(state.specialistTuning) && state.specialistTuning.length) &&
    !hasInstalledUpgrades(state.stage3Calibration || {});
}

// Validate the actual built race car, not just its displayed labels.
// Used for both sides at race start to prevent an AI-only NOS or power bypass.
export function validateCrewBattleBuiltCar(config = {}, state = {}, rule = OPEN) {
  const powerKW = Number(config.powerKW);
  if (!Number.isFinite(powerKW) || powerKW <= 0)
    return { eligible: false, reason: 'POWER UNAVAILABLE', powerKW };
  if (rule.stock && !isCrewEventFactoryStock(state))
    return { eligible: false, reason: 'FACTORY STOCK REQUIRED', powerKW };

  // A NOS-equipped car is not eligible for a No NOS heat even if the player
  // promises not to press the button; rivals follow exactly the same rule.
  if (rule.noNos && (
    Boolean(state.nosInstalled) ||
    Number(state.exhaustNosTuning?.nosKit || 0) > 0 ||
    Number(state.exhaustNosTuning?.nitrousShot || 0) > 0 ||
    Number(config.nosPower || 0) > 0 ||
    Number(config.nosCapacitySeconds || 0) > 0 ||
    Number(config.nosShots || 0) > 0
  )) return { eligible: false, reason: 'NO NOS INSTALLED', powerKW };

  const limit = Number(rule.maxPowerKW);
  if (Number.isFinite(limit) && powerKW > limit + 0.001)
    return { eligible: false, reason: 'OVER ' + limit + ' KW LIMIT', powerKW };
  return { eligible: true, reason: '', powerKW };
}

// The eligible setup is an untouched snapshot of the installed build.
// Factory-stock rivals are explicitly authored using eventStockState(), while
// player cars must be physically compliant after uninstalling any parts.
export function getCrewEventCarSetup(carId, installedState = {}, rule = OPEN) {
  if (!carId) return { eligible: false, reason: 'NO CAR', state: {} };
  const state = copy(installedState);
  let performance;
  try { performance = getVehiclePerformance(carId, state); }
  catch (_) { return { eligible: false, reason: 'PERFORMANCE UNAVAILABLE', state }; }
  const check = validateCrewBattleBuiltCar(performance?.car || {}, state, rule);
  return { ...check, state, adjustment: '', ruleLabel: rule.label || 'OPEN CLASS' };
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
