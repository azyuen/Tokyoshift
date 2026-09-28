import { PROGRESSION_BALANCE, RIVAL_BUILD_ARCHETYPES } from './progressionBalance.js?v=20260928-r239';

const clampLevel = value => Math.max(0, Math.min(3, Math.round(Number(value) || 0)));

const PART_TARGETS = {
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

function hashSeed(value = '') {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed = '') {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedChoice(entries, random) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight || 0)), 0);
  if (total <= 0) return entries[0]?.value ?? null;
  let cursor = random() * total;
  for (const entry of entries) {
    cursor -= Math.max(0, Number(entry.weight || 0));
    if (cursor <= 0) return entry.value;
  }
  return entries[entries.length - 1]?.value ?? null;
}

function emptyBuildState(rating, archetypeId, paintColor = null) {
  return {
    stock: rating <= 1,
    paintColor,
    nosInstalled: false,
    tuneLevel: 0,
    buildRating: rating,
    buildArchetype: archetypeId,
    acquiredVia: 'rivalBuild',
    tuning: { engine: 0, intake: 0, ecu: 0, turbo: 0, intercooler: 0 },
    drivetrainTuning: { clutch: 0, gearbox: 0, differential: 0, suspension: 0 },
    chassisTuning: { tyres: 0, weightReduction: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 0, muffler: 0, nosKit: 0, nitrousShot: 0 },
  };
}

function getPartLevel(state, partId) {
  const target = PART_TARGETS[partId];
  return target ? clampLevel(state[target[0]]?.[target[1]]) : 0;
}

function setPartLevel(state, partId, value) {
  const target = PART_TARGETS[partId];
  if (!target) return;
  state[target[0]][target[1]] = clampLevel(value);
}

function suitableArchetypes(config = {}, rating = 3, raceType = '') {
  const factoryTurbo = Number(config.maximumBoost || 0) > 0.01;
  const highRevNa = !factoryTurbo && Number(config.engineRedlineRPM || 0) >= 7200;
  const isRoll = String(raceType).toLowerCase().includes('roll');
  const weights = PROGRESSION_BALANCE.rivalBuilds.archetypeWeights;

  const entries = [
    { value: 'balancedStreet', weight: weights.balancedStreet },
    { value: 'launchDrag', weight: weights.launchDrag * (isRoll ? 0.55 : 1.25) },
    { value: 'lightweight', weight: weights.lightweight * (Number(config.vehicleMassKg || 9999) <= 1250 ? 1.25 : 0.70) },
  ];

  if (highRevNa || (!factoryTurbo && rating <= 4)) {
    entries.push({ value: 'naHighRev', weight: weights.naHighRev * (highRevNa ? 1.35 : 0.90) });
  }

  if (factoryTurbo) {
    entries.push({ value: 'turboRoll', weight: weights.turboRoll * (isRoll ? 1.45 : 1.00) });
  } else if (rating >= 4) {
    // Some highly developed NA cars may be converted to turbo, but never all of them.
    entries.push({ value: 'turboRoll', weight: weights.turboRoll * (isRoll ? 0.42 : 0.24) });
  }

  return entries;
}

export function chooseRivalBuildArchetype(config = {}, rating = 3, options = {}) {
  const explicit = String(options.archetype || '');
  if (RIVAL_BUILD_ARCHETYPES[explicit]) return explicit;

  const random = options.random || seededRandom(
    options.seed || `${config.id || config.engine || 'car'}:${rating}:${options.raceType || 'street'}`
  );
  return weightedChoice(suitableArchetypes(config, rating, options.raceType), random) || 'balancedStreet';
}

function allocateDevelopment(state, archetype, points, config) {
  const forbidden = new Set(archetype.forbidden || []);
  const priority = (archetype.priority || []).filter(partId => !forbidden.has(partId));
  if (!priority.length || points <= 0) return state;

  const factoryTurbo = Number(config.maximumBoost || 0) > 0.01;
  let remaining = Math.max(0, Math.floor(points));
  let cursor = 0;
  let guard = 0;

  while (remaining > 0 && guard < 500) {
    guard += 1;
    const partId = priority[cursor % priority.length];
    cursor += 1;

    // Factory-NA cars stay NA unless the owner specifically rolls the turbo/
    // roll archetype. High build rating alone must not turbo-convert every car.
    if (partId === 'engine.turbo' && !factoryTurbo && archetype.id !== 'turboRoll') continue;

    if (partId === 'engine.intercooler') {
      const turboLevel = getPartLevel(state, 'engine.turbo');
      if (!factoryTurbo && turboLevel <= 0) continue;
    }

    const current = getPartLevel(state, partId);
    if (current >= 3) {
      if (priority.every(id => getPartLevel(state, id) >= 3 || forbidden.has(id))) break;
      continue;
    }

    setPartLevel(state, partId, current + 1);
    remaining -= 1;
  }

  return state;
}

export function addPinkSlipSupport(buildState = {}, rating = 3) {
  const state = JSON.parse(JSON.stringify(buildState || {}));
  const r = Math.max(1, Math.min(5, Math.round(Number(rating) || Number(state.buildRating) || 3)));
  if (r < 3 || state.pinkSlipSupportApplied) return state;

  state.drivetrainTuning = { clutch: 0, gearbox: 0, differential: 0, suspension: 0, ...(state.drivetrainTuning || {}) };
  state.chassisTuning = { tyres: 0, weightReduction: 0, ...(state.chassisTuning || {}) };

  state.drivetrainTuning.clutch = Math.min(3, clampLevel(state.drivetrainTuning.clutch) + 1);
  state.drivetrainTuning.differential = Math.min(3, clampLevel(state.drivetrainTuning.differential) + 1);
  state.chassisTuning.tyres = Math.min(3, clampLevel(state.chassisTuning.tyres) + 1);
  state.pinkSlipSupportApplied = true;
  return state;
}

export function createRivalBuildState(config = {}, rating = 3, options = {}) {
  const r = Math.max(1, Math.min(5, Math.round(Number(rating) || 3)));
  const archetypeId = chooseRivalBuildArchetype(config, r, options);
  const archetype = RIVAL_BUILD_ARCHETYPES[archetypeId] || RIVAL_BUILD_ARCHETYPES.balancedStreet;
  const points = Number(PROGRESSION_BALANCE.rivalBuilds.developmentPoints[r] || 0);
  let state = emptyBuildState(r, archetypeId, options.paintColor ?? null);

  allocateDevelopment(state, archetype, points, config);

  // NOS is a deliberate late-build choice rather than an automatic rating bonus.
  if (r >= 4 && archetypeId === 'launchDrag') {
    state.exhaustNosTuning.nosKit = r >= 5 ? 2 : 1;
    state.exhaustNosTuning.nitrousShot = r >= 5 ? 2 : 1;
  } else if (r >= 5 && archetypeId === 'turboRoll') {
    state.exhaustNosTuning.nosKit = 1;
    state.exhaustNosTuning.nitrousShot = 1;
  }

  state.nosInstalled = state.exhaustNosTuning.nosKit > 0;
  if (options.pinkSlip) state = addPinkSlipSupport(state, r);
  return state;
}

export function getRivalBuildLabel(buildState = {}) {
  const archetype = RIVAL_BUILD_ARCHETYPES[buildState.buildArchetype];
  return archetype?.label || 'BALANCED STREET';
}
