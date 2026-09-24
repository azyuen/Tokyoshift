import { applySpecialistTuning } from './tunerShops.js?v=20260924-r178';

const clampLevel = value => Math.max(0, Math.min(3, Math.round(Number(value) || 0)));

export const DRIVETRAIN_PART_ORDER = ['clutch', 'gearbox', 'differential', 'suspension'];
export const CHASSIS_PART_ORDER = ['tyres', 'weightReduction'];
export const EXHAUST_NOS_PART_ORDER = ['headers', 'exhaust', 'muffler', 'nosKit', 'nitrousShot'];

export const DRIVETRAIN_TUNING_PARTS = {
  clutch: {
    id: 'clutch',
    name: 'CLUTCH',
    levels: [
      { level: 0, name: 'Stock clutch', cost: 0, clutchScale: 1.00, spriteKey: 'tuningPartClutchL0', benefit: 'Factory torque capacity' },
      { level: 1, name: 'Sports clutch', cost: 8000, clutchScale: 1.15, spriteKey: 'tuningPartClutchL1', benefit: '+15% torque capacity' },
      { level: 2, name: 'Heavy-duty clutch', cost: 18000, clutchScale: 1.35, spriteKey: 'tuningPartClutchL2', benefit: '+35% torque capacity' },
      { level: 3, name: 'Twin-plate clutch', cost: 35000, clutchScale: 1.65, spriteKey: 'tuningPartClutchL3', benefit: '+65% torque capacity' },
    ],
  },
  gearbox: {
    id: 'gearbox',
    name: 'GEARBOX',
    levels: [
      { level: 0, name: 'Stock gearbox', cost: 0, shiftScale: 1.00, efficiencyAdd: 0.00, spriteKey: 'tuningPartGearboxL0', benefit: 'Factory shift speed' },
      { level: 1, name: 'Short-shift kit', cost: 15000, shiftScale: 0.90, efficiencyAdd: 0.01, spriteKey: 'tuningPartGearboxL1', benefit: '10% faster shifts' },
      { level: 2, name: 'Close-ratio box', cost: 35000, shiftScale: 0.80, efficiencyAdd: 0.02, spriteKey: 'tuningPartGearboxL2', benefit: '20% faster shifts' },
      { level: 3, name: 'Dog box', cost: 70000, shiftScale: 0.68, efficiencyAdd: 0.03, spriteKey: 'tuningPartGearboxL3', benefit: '32% faster shifts' },
    ],
  },
  differential: {
    id: 'differential',
    name: 'DIFFERENTIAL',
    levels: [
      { level: 0, name: 'Factory differential', cost: 0, gripScale: 1.00, launchScale: 1.00, spriteKey: 'tuningPartDifferentialL0', benefit: 'Factory traction' },
      { level: 1, name: 'Street LSD', cost: 12000, gripScale: 1.02, launchScale: 1.02, spriteKey: 'tuningPartDifferentialL1', benefit: '+2% grip / launch' },
      { level: 2, name: '1.5-way LSD', cost: 28000, gripScale: 1.04, launchScale: 1.04, spriteKey: 'tuningPartDifferentialL2', benefit: '+4% grip / launch' },
      { level: 3, name: 'Race LSD', cost: 55000, gripScale: 1.06, launchScale: 1.07, spriteKey: 'tuningPartDifferentialL3', benefit: '+6% grip / +7% launch' },
    ],
  },
  suspension: {
    id: 'suspension',
    name: 'SUSPENSION',
    levels: [
      { level: 0, name: 'Stock suspension', cost: 0, gripScale: 1.00, launchScale: 1.00, spriteKey: 'tuningPartSuspensionL0', benefit: 'Factory setup' },
      { level: 1, name: 'Street suspension', cost: 10000, gripScale: 1.01, launchScale: 1.02, spriteKey: 'tuningPartSuspensionL1', benefit: '+1% grip / +2% launch' },
      { level: 2, name: 'Coilovers', cost: 25000, gripScale: 1.025, launchScale: 1.04, spriteKey: 'tuningPartSuspensionL2', benefit: '+2.5% grip / +4% launch' },
      { level: 3, name: 'Drag suspension', cost: 50000, gripScale: 1.04, launchScale: 1.07, spriteKey: 'tuningPartSuspensionL3', benefit: '+4% grip / +7% launch' },
    ],
  },
};

export const CHASSIS_TUNING_PARTS = {
  tyres: {
    id: 'tyres',
    name: 'TYRES',
    levels: [
      { level: 0, name: 'Stock street tyres', cost: 0, gripScale: 1.00, launchScale: 1.00, spriteKey: 'tuningPartTyresL0', benefit: 'Factory road tyre grip' },
      { level: 1, name: 'Performance tyres', cost: 9000, gripScale: 1.025, launchScale: 1.01, spriteKey: 'tuningPartTyresL1', benefit: '+2.5% grip / +1% launch' },
      { level: 2, name: 'Drag radials', cost: 22000, gripScale: 1.06, launchScale: 1.04, spriteKey: 'tuningPartTyresL2', benefit: '+6% grip / +4% launch' },
      { level: 3, name: 'Slicks', cost: 45000, gripScale: 1.10, launchScale: 1.08, spriteKey: 'tuningPartTyresL3', benefit: '+10% grip / +8% launch' },
    ],
  },
  weightReduction: {
    id: 'weightReduction',
    name: 'WEIGHT REDUCTION',
    levels: [
      { level: 0, name: 'Stock interior', cost: 0, massDelta: 0, spriteKey: 'tuningPartWeightReductionL0', benefit: 'Full factory interior' },
      { level: 1, name: 'Lightweight interior', cost: 12000, massDelta: -18, spriteKey: 'tuningPartWeightReductionL1', benefit: '-18 kg' },
      { level: 2, name: 'Stripped interior', cost: 30000, massDelta: -42, spriteKey: 'tuningPartWeightReductionL2', benefit: '-42 kg' },
      { level: 3, name: 'Race-lightweight setup', cost: 60000, massDelta: -75, spriteKey: 'tuningPartWeightReductionL3', benefit: '-75 kg' },
    ],
  },
};

export const EXHAUST_NOS_TUNING_PARTS = {
  headers: {
    id: 'headers',
    name: 'HEADERS',
    levels: [
      { level: 0, name: 'Stock manifold', cost: 0, torqueScale: 1.00, massDelta: 0, benefit: 'Factory exhaust manifold' },
      { level: 1, name: 'Street headers', cost: 8000, torqueScale: 1.015, massDelta: 0, benefit: '+1.5% engine output' },
      { level: 2, name: 'Equal-length headers', cost: 18000, torqueScale: 1.03, massDelta: -1, benefit: '+3% output / -1 kg' },
      { level: 3, name: 'Race headers', cost: 36000, torqueScale: 1.05, massDelta: -2, benefit: '+5% output / -2 kg' },
    ],
  },
  exhaust: {
    id: 'exhaust',
    name: 'EXHAUST SYSTEM',
    levels: [
      { level: 0, name: 'Stock exhaust', cost: 0, torqueScale: 1.00, massDelta: 0, spriteKey: 'tuningPartEngineExhaustL0', benefit: 'Factory exhaust flow' },
      { level: 1, name: 'Axle-back system', cost: 10000, torqueScale: 1.015, massDelta: -1, spriteKey: 'tuningPartEngineExhaustL1', benefit: '+1.5% output / -1 kg' },
      { level: 2, name: 'Cat-back system', cost: 22000, torqueScale: 1.03, massDelta: -3, spriteKey: 'tuningPartEngineExhaustL2', benefit: '+3% output / -3 kg' },
      { level: 3, name: 'Race exhaust', cost: 45000, torqueScale: 1.05, massDelta: -5, spriteKey: 'tuningPartEngineExhaustL3', benefit: '+5% output / -5 kg' },
    ],
  },
  muffler: {
    id: 'muffler',
    name: 'MUFFLER',
    levels: [
      { level: 0, name: 'Stock muffler', cost: 0, torqueScale: 1.00, massDelta: 0, benefit: 'Factory rear section' },
      { level: 1, name: 'Sports muffler', cost: 5000, torqueScale: 1.005, massDelta: -1, benefit: '+0.5% output / -1 kg' },
      { level: 2, name: 'Straight-through', cost: 12000, torqueScale: 1.012, massDelta: -2, benefit: '+1.2% output / -2 kg' },
      { level: 3, name: 'Race muffler', cost: 25000, torqueScale: 1.02, massDelta: -3, benefit: '+2% output / -3 kg' },
    ],
  },
  nosKit: {
    id: 'nosKit',
    name: 'NOS KIT',
    levels: [
      { level: 0, name: 'No nitrous system', cost: 0, capacitySeconds: 0, benefit: 'No nitrous installed' },
      { level: 1, name: 'Street bottle', cost: 18000, capacitySeconds: 3.0, benefit: '3.0 sec nitrous capacity' },
      { level: 2, name: 'Wet kit', cost: 38000, capacitySeconds: 5.0, benefit: '5.0 sec nitrous capacity' },
      { level: 3, name: 'Race twin-bottle', cost: 70000, capacitySeconds: 7.0, benefit: '7.0 sec nitrous capacity' },
    ],
  },
  nitrousShot: {
    id: 'nitrousShot',
    name: 'NITROUS SHOT',
    levels: [
      { level: 0, name: 'No shot', cost: 0, powerHp: 0, benefit: '0 hp nitrous shot' },
      { level: 1, name: '35 hp shot', cost: 10000, powerHp: 35, benefit: '+35 hp while NOS is active' },
      { level: 2, name: '50 hp shot', cost: 20000, powerHp: 50, benefit: '+50 hp while NOS is active' },
      { level: 3, name: '75 hp shot', cost: 40000, powerHp: 75, benefit: '+75 hp while NOS is active' },
    ],
  },
};

function normalise(order, input = {}) {
  const result = {};
  order.forEach(id => { result[id] = clampLevel(input?.[id]); });
  return result;
}

function getPathCost(parts, partId, fromLevel, toLevel) {
  const part = parts[partId];
  if (!part) return 0;
  const from = clampLevel(fromLevel);
  const to = clampLevel(toLevel);
  if (to <= from) return 0;
  let total = 0;
  for (let level = from + 1; level <= to; level++) {
    total += Number(part.levels[level]?.cost || 0);
  }
  return total;
}

function cartCost(order, parts, currentInput, pendingInput) {
  const current = normalise(order, currentInput);
  const pending = normalise(order, pendingInput);
  return order.reduce((sum, id) => sum + getPathCost(parts, id, current[id], pending[id]), 0);
}

export function normaliseDrivetrainTuning(input = {}) {
  return normalise(DRIVETRAIN_PART_ORDER, input);
}

export function normaliseChassisTuning(input = {}) {
  return normalise(CHASSIS_PART_ORDER, input);
}

export function normaliseExhaustNosTuning(input = {}) {
  return normalise(EXHAUST_NOS_PART_ORDER, input);
}

export function getDrivetrainTuning(carState = {}) {
  return normaliseDrivetrainTuning(carState.drivetrainTuning || {});
}

export function getChassisTuning(carState = {}) {
  return normaliseChassisTuning(carState.chassisTuning || {});
}

export function getExhaustNosTuning(carState = {}) {
  const current = carState.exhaustNosTuning || {};
  const legacyEngineExhaust = carState.tuning?.exhaust ?? carState.engineTuning?.exhaust;

  // R114 migration: the old Engine > Exhaust category was removed. Preserve
  // any level the player already bought by treating it as Exhaust System
  // unless a newer exhaustNosTuning.exhaust value already exists.
  return normaliseExhaustNosTuning({
    ...current,
    exhaust: current.exhaust ?? legacyEngineExhaust ?? 0,
  });
}

export function getDrivetrainUpgradePathCost(partId, fromLevel, toLevel) {
  return getPathCost(DRIVETRAIN_TUNING_PARTS, partId, fromLevel, toLevel);
}

export function getChassisUpgradePathCost(partId, fromLevel, toLevel) {
  return getPathCost(CHASSIS_TUNING_PARTS, partId, fromLevel, toLevel);
}

export function getExhaustNosUpgradePathCost(partId, fromLevel, toLevel) {
  return getPathCost(EXHAUST_NOS_TUNING_PARTS, partId, fromLevel, toLevel);
}

export function getDrivetrainCartCost(currentInput = {}, pendingInput = {}) {
  return cartCost(DRIVETRAIN_PART_ORDER, DRIVETRAIN_TUNING_PARTS, currentInput, pendingInput);
}

export function getChassisCartCost(currentInput = {}, pendingInput = {}) {
  return cartCost(CHASSIS_PART_ORDER, CHASSIS_TUNING_PARTS, currentInput, pendingInput);
}

export function getExhaustNosCartCost(currentInput = {}, pendingInput = {}) {
  return cartCost(EXHAUST_NOS_PART_ORDER, EXHAUST_NOS_TUNING_PARTS, currentInput, pendingInput);
}

export function applySecondaryTuning(carConfig, engineConfig, carState = {}) {
  const car = {
    ...carConfig,
    gearRatios: [...(carConfig.gearRatios || [])],
    visual: { ...(carConfig.visual || {}) },
  };
  const engine = {
    ...engineConfig,
    torqueCurve: (engineConfig.torqueCurve || []).map(point => [...point]),
  };

  const drivetrain = getDrivetrainTuning(carState);
  const dt = {};
  DRIVETRAIN_PART_ORDER.forEach(id => {
    dt[id] = DRIVETRAIN_TUNING_PARTS[id].levels[drivetrain[id]];
  });

  car.clutchStrength = Number(car.clutchStrength || 1) * (dt.clutch.clutchScale || 1);
  car.shiftTimeScale = (dt.gearbox.shiftScale || 1);
  car.drivetrainEfficiency = Math.min(
    0.99,
    Number(car.drivetrainEfficiency || 0.85) + Number(dt.gearbox.efficiencyAdd || 0)
  );
  car.tyreGrip = Number(car.tyreGrip || 1)
    * (dt.differential.gripScale || 1)
    * (dt.suspension.gripScale || 1);
  car.launchLoadMultiplier = Number(car.launchLoadMultiplier || 1)
    * (dt.differential.launchScale || 1)
    * (dt.suspension.launchScale || 1);

  const chassis = getChassisTuning(carState);
  const ch = {};
  CHASSIS_PART_ORDER.forEach(id => {
    ch[id] = CHASSIS_TUNING_PARTS[id].levels[chassis[id]];
  });

  car.tyreGrip *= ch.tyres.gripScale || 1;
  car.launchLoadMultiplier *= ch.tyres.launchScale || 1;

  const exhaustNos = getExhaustNosTuning(carState);
  const ex = {};
  EXHAUST_NOS_PART_ORDER.forEach(id => {
    ex[id] = EXHAUST_NOS_TUNING_PARTS[id].levels[exhaustNos[id]];
  });

  const exhaustScale =
    (ex.headers.torqueScale || 1)
    * (ex.exhaust.torqueScale || 1)
    * (ex.muffler.torqueScale || 1);

  engine.torqueCurve = engine.torqueCurve.map(([rpm, torque]) => [rpm, torque * exhaustScale]);
  car.powerKW = Math.round(Number(car.powerKW || 0) * exhaustScale);
  car.torqueNm = Math.round(Number(car.torqueNm || 0) * exhaustScale);
  car.vehicleMassKg = Math.max(
    500,
    Number(car.vehicleMassKg || 1000)
      + Number(ex.headers.massDelta || 0)
      + Number(ex.exhaust.massDelta || 0)
      + Number(ex.muffler.massDelta || 0)
      + Number(ch.weightReduction.massDelta || 0)
  );

  if (exhaustNos.nosKit > 0) {
    car.nosCapacitySeconds = Number(ex.nosKit.capacitySeconds || 0);
    car.nosPower = Number(ex.nitrousShot.powerHp || 0);
  }

  // Regional tuner-house work is a final refinement layered over the normal
  // parts tree. This means the same specialist tune is respected by garage
  // specs, AI threat calculations and race physics without scene-specific math.
  const specialist = applySpecialistTuning(car, engine, carState);

  return {
    car: specialist.car,
    engine: specialist.engine,
    drivetrain,
    chassis,
    exhaustNos,
    exhaustScale,
    specialistTuning: specialist.installed,
  };
}
