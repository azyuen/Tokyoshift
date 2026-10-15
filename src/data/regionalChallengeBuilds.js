import { cars } from './cars.js';
import { RIVAL_BUILD_ARCHETYPES } from './progressionBalance.js';
import { chooseRivalBuildArchetype } from './rivalBuilds.js';
import { TUNER_OPTION_BY_ID, areTunerOptionRequirementsMet } from './tunerShops.js';
import { canInstallTuningLevel } from './workshopProgression.js';

const TARGETS = {
  'engine.engine': ['tuning', 'engine'],
  'engine.intake': ['tuning', 'intake'],
  'engine.ecu': ['tuning', 'ecu'],
  'engine.turbo': ['tuning', 'turbo'],
  'engine.intercooler': ['tuning', 'intercooler'],
  'drivetrain.clutch': ['drivetrainTuning', 'clutch'],
  'drivetrain.gearbox': ['drivetrainTuning', 'gearbox'],
  'drivetrain.differential': ['drivetrainTuning', 'differential'],
  'drivetrain.suspension': ['drivetrainTuning', 'suspension'],
  'chassis.tyres': ['chassisTuning', 'tyres'],
  'chassis.weightReduction': ['chassisTuning', 'weightReduction'],
  'exhaust.headers': ['exhaustNosTuning', 'headers'],
  'exhaust.exhaust': ['exhaustNosTuning', 'exhaust'],
  'exhaust.muffler': ['exhaustNosTuning', 'muffler'],
  'exhaust.nosKit': ['exhaustNosTuning', 'nosKit'],
  'exhaust.nitrousShot': ['exhaustNosTuning', 'nitrousShot'],
};
const NORMAL = Object.keys(TARGETS).filter(id => !id.includes('nosKit') && !id.includes('nitrousShot'));
const NOS = ['exhaust.nosKit', 'exhaust.nitrousShot'];

function blank(round, archetype) {
  const max = Number(round.maxTuningLevel || 1);
  return {
    stock: false,
    paintColor: round.paintColor ?? null,
    nosInstalled: false,
    tuneLevel: max,
    buildRating: Math.min(5, max + 2),
    buildArchetype: archetype,
    acquiredVia: 'regionalChallenge',
    tuning: { engine: 0, intake: 0, ecu: 0, turbo: 0, intercooler: 0 },
    drivetrainTuning: { clutch: 0, gearbox: 0, differential: 0, suspension: 0 },
    chassisTuning: { tyres: 0, weightReduction: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 0, muffler: 0, nosKit: 0, nitrousShot: 0 },
    specialistTuning: [],
    championshipDevelopmentPoints: 0,
    championshipMaxTuningLevel: max,
    championshipNosAllowed: Boolean(round.allowNos),
    championshipSpecialistUpgrades: 0,
    championshipEra: round.workshopEra || '',
  };
}

function priority(archetypeId, allowNos, carConfig = {}) {
  const archetype = RIVAL_BUILD_ARCHETYPES[archetypeId] || {};
  const forbidden = new Set(archetype.forbidden || []);
  const factoryTurbo = Number(carConfig.maximumBoost || 0) > 0.01;

  // Match ordinary rival-build rules: a naturally aspirated street, launch,
  // lightweight or high-rev tune must not silently become a turbo conversion.
  // Only the explicit TURBO / ROLL archetype may convert an NA engine.
  if (!factoryTurbo && archetypeId !== 'turboRoll') {
    forbidden.add('engine.turbo');
    forbidden.add('engine.intercooler');
  }

  const result = [];
  const add = id => {
    if (TARGETS[id] && !forbidden.has(id) && !result.includes(id)) result.push(id);
  };
  (archetype.priority || []).forEach(add);
  NORMAL.forEach(add);
  if (allowNos) {
    const at = archetypeId === 'launchDrag' ? 4 : archetypeId === 'turboRoll' ? 7 : result.length;
    result.splice(at, 0, ...NOS.filter(id => !forbidden.has(id)));
  }
  return result;
}

const WORKSHOP_BY_ERA = Object.freeze({
  HOME: 'shinonomeWorkshop',
  CANAL: 'shinonomeCanalYard',
  WAREHOUSE: 'shinonomeWarehouseStrip',
});
const CATEGORY_BY_GROUP = Object.freeze({
  tuning: 'engine',
  drivetrainTuning: 'drivetrain',
  chassisTuning: 'chassis',
  exhaustNosTuning: 'exhaustNos',
});

function allocate(state, points, maxLevel, allowNos, archetypeId, workshopEra, careerWins, carConfig) {
  const workshop = WORKSHOP_BY_ERA[String(workshopEra || '').toUpperCase()] || WORKSHOP_BY_ERA.HOME;
  const order = priority(archetypeId, allowNos, carConfig);
  const maxAllowed = Object.fromEntries(order.map(id => {
    const [group, part] = TARGETS[id];
    let level = 0;
    for (let next = 1; next <= maxLevel; next++) {
      if (!canInstallTuningLevel(CATEGORY_BY_GROUP[group], part, next, workshop, careerWins)) break;
      level = next;
    }
    // Canal Yard is the first boost-conversion era. A purpose-built TURBO / ROLL
    // NA rival can fit a street turbo here, but its full L2 conversion is
    // reserved for the Warehouse tier. Factory-turbo cars retain L2 upgrades.
    if (id === 'engine.turbo' &&
        Number(carConfig?.maximumBoost || 0) <= 0.01 &&
        String(workshopEra || '').toUpperCase() === 'CANAL') {
      level = Math.min(level, 1);
    }
    return [id, level];
  }));

  // A tuning-point budget is not permission to install parts the player
  // physically cannot access in this workshop era.
  let left = Math.min(
    Math.max(0, Math.floor(Number(points) || 0)),
    Object.values(maxAllowed).reduce((sum, level) => sum + level, 0)
  );
  let cursor = 0;
  while (left > 0 && order.length) {
    const id = order[cursor % order.length];
    cursor += 1;
    const [group, key] = TARGETS[id];
    if (Number(state[group][key] || 0) >= maxAllowed[id]) continue;

    // Do not allocate an unusable nitrous power shot before its bottle.
    if (id === 'exhaust.nitrousShot' && !state.exhaustNosTuning.nosKit) continue;
    state[group][key] += 1;
    left -= 1;
  }
  state.championshipDevelopmentPoints = order.reduce((sum, id) => {
    const [group, key] = TARGETS[id];
    return sum + Number(state[group][key] || 0);
  }, 0);
  state.nosInstalled = Boolean(
    allowNos && state.exhaustNosTuning.nosKit > 0 && state.exhaustNosTuning.nitrousShot > 0
  );
  return state;
}

const STANDING_SPECIALISTS = [
  'zeroSportsAwdLaunch', 'zeroSportsBoxerResponse', 'minesResponsePackage',
  'junBottomEndBlueprint', 'topSecretBoostControl', 'amuseHighRpmBreathing',
  'reAmemiyaTurboResponse', 'minesVxRom', 'amuseTitaniumFlow',
  'junHeadCamPackage', 'topSecretChargeFlow', 'reAmemiyaCoolingFlow',
  'zeroSportsCompleteSetup', 'minesCompleteResponse', 'junCompleteEngineSetup',
  'topSecretVmaxSetup', 'amuseCompleteFlowSetup', 'reAmemiyaCircuitRotary',
  'espritDryCarbon', 'espritAeroBalance', 'espritTotalSetup',
];
const ROLL_SPECIALISTS = [
  'topSecretBoostControl', 'topSecretChargeFlow', 'amuseHighRpmBreathing',
  'minesVxRom', 'minesResponsePackage', 'junBottomEndBlueprint',
  'reAmemiyaTurboResponse', 'amuseTitaniumFlow', 'espritDryCarbon',
  'junHeadCamPackage', 'reAmemiyaCoolingFlow', 'zeroSportsAwdLaunch',
  'topSecretVmaxSetup', 'amuseCompleteFlowSetup', 'minesCompleteResponse',
  'junCompleteEngineSetup', 'reAmemiyaCircuitRotary', 'zeroSportsBoxerResponse',
  'espritAeroBalance', 'zeroSportsCompleteSetup', 'espritTotalSetup',
];

function addSpecialists(state, count, round) {
  const target = Math.max(0, Math.floor(Number(count) || 0));
  if (!target) return state;
  const order = String(round.raceType || '').toLowerCase().includes('roll')
    ? ROLL_SPECIALISTS : STANDING_SPECIALISTS;
  const offset = (Number(round.stageIndex || 0) + String(round.carId || '').length) % order.length;
  const rotated = order.slice(offset).concat(order.slice(0, offset));
  const installed = new Set(state.specialistTuning || []);
  while (installed.size < target) {
    state.specialistTuning = [...installed];
    const nextId = rotated.find(id => {
      const option = TUNER_OPTION_BY_ID[id];
      return option && !installed.has(id) && areTunerOptionRequirementsMet(state, option);
    });
    if (!nextId) break;
    installed.add(nextId);
  }
  state.specialistTuning = [...installed];
  state.championshipSpecialistUpgrades = installed.size;
  return state;
}

export function materialiseRegionalChallengeRounds(rounds = [], careerWins = Infinity) {
  return rounds.map(round => {
    const config = cars[round.carId];
    if (!config) return { ...round };
    const rating = Math.max(1, Math.min(5, Number(round.encounterRating || 3)));
    const archetype = chooseRivalBuildArchetype(config, rating, {
      raceType: round.raceType,
      seed: ['REGIONAL', round.regionId, round.stageIndex, round.characterId, round.carId].join(':'),
    });
    let state = blank(round, archetype);
    state = allocate(
      state,
      round.tuningPointCap,
      Number(round.maxTuningLevel || 1),
      Boolean(round.allowNos),
      archetype,
      round.workshopEra,
      careerWins,
      config
    );
    state = addSpecialists(state, round.specialistUpgradeCount, round);
    return {
      ...round,
      opponentBuildRating: state.buildRating,
      opponentBuildArchetype: state.buildArchetype,
      opponentBuildState: state,
    };
  });
}
