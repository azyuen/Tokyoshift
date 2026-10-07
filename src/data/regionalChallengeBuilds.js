import { cars } from './cars.js?v=20261006-r388';
import { RIVAL_BUILD_ARCHETYPES } from './progressionBalance.js?v=20260928-r239';
import { chooseRivalBuildArchetype } from './rivalBuilds.js?v=20260928-r234';
import { TUNER_OPTION_BY_ID, areTunerOptionRequirementsMet } from './tunerShops.js?v=20261006-r392';

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

function priority(archetypeId, allowNos) {
  const source = RIVAL_BUILD_ARCHETYPES[archetypeId]?.priority || [];
  const result = [];
  const add = id => { if (TARGETS[id] && !result.includes(id)) result.push(id); };
  source.forEach(add);
  NORMAL.forEach(add);
  if (allowNos) {
    const at = archetypeId === 'launchDrag' ? 4 : archetypeId === 'turboRoll' ? 7 : result.length;
    result.splice(at, 0, ...NOS);
  }
  return result;
}

function allocate(state, points, maxLevel, allowNos, archetypeId) {
  const order = priority(archetypeId, allowNos);
  let left = Math.min(order.length * maxLevel, Math.max(0, Math.floor(Number(points) || 0)));
  let cursor = 0;
  while (left > 0) {
    const id = order[cursor % order.length];
    cursor += 1;
    const [group, key] = TARGETS[id];
    if (Number(state[group][key] || 0) >= maxLevel) continue;
    state[group][key] += 1;
    left -= 1;
  }
  state.championshipDevelopmentPoints = order.reduce((sum, id) => {
    const [group, key] = TARGETS[id];
    return sum + Number(state[group][key] || 0);
  }, 0);
  state.nosInstalled = Boolean(allowNos && state.exhaustNosTuning.nosKit > 0);
  return state;
}

const STANDING_SPECIALISTS = [
  'spoonLsdGeometry', 'spoonRigidChassis', 'minesResponsePackage',
  'junBottomEndBlueprint', 'topSecretBoostControl', 'amuseHighRpmBreathing',
  'reAmemiyaTurboResponse', 'minesVxRom', 'amuseTitaniumFlow',
  'junHeadCamPackage', 'topSecretChargeFlow', 'reAmemiyaCoolingFlow',
  'spoonCompleteChassis', 'minesCompleteResponse', 'junCompleteEngineSetup',
  'topSecretVmaxSetup', 'amuseCompleteFlowSetup', 'reAmemiyaCircuitRotary',
  'espritDryCarbon', 'espritAeroBalance', 'espritTotalSetup',
];
const ROLL_SPECIALISTS = [
  'topSecretBoostControl', 'topSecretChargeFlow', 'amuseHighRpmBreathing',
  'minesVxRom', 'minesResponsePackage', 'junBottomEndBlueprint',
  'reAmemiyaTurboResponse', 'amuseTitaniumFlow', 'espritDryCarbon',
  'junHeadCamPackage', 'reAmemiyaCoolingFlow', 'spoonLsdGeometry',
  'topSecretVmaxSetup', 'amuseCompleteFlowSetup', 'minesCompleteResponse',
  'junCompleteEngineSetup', 'reAmemiyaCircuitRotary', 'spoonRigidChassis',
  'espritAeroBalance', 'spoonCompleteChassis', 'espritTotalSetup',
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

export function materialiseRegionalChallengeRounds(rounds = []) {
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
      archetype
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
