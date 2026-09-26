const clampLevel = value => Math.max(0, Math.min(3, Math.round(Number(value) || 0)));

export const ENGINE_PART_ORDER = ['engine', 'intake', 'ecu', 'turbo', 'intercooler'];

export const ENGINE_TUNING_PARTS = {
  engine: {
    id: 'engine',
    name: 'ENGINE',
    subtitle: 'LONG BLOCK',
    levels: [
      { level: 0, name: 'Stock engine', cost: 0, torqueScale: 1.00, redlineAdd: 0, massDelta: 0, benefit: 'Factory long block' },
      { level: 1, name: 'Street build', cost: 30000, torqueScale: 1.06, redlineAdd: 100, massDelta: 2, benefit: '+6% engine output' },
      { level: 2, name: 'Forged long block', cost: 85000, torqueScale: 1.10, redlineAdd: 200, massDelta: 4, benefit: '+10% engine output' },
      { level: 3, name: 'Stroker / big-bore', cost: 190000, torqueScale: 1.18, redlineAdd: 300, massDelta: 7, benefit: '+18% engine output' },
    ],
  },
  intake: {
    id: 'intake',
    name: 'INTAKE',
    subtitle: 'AIRFLOW',
    levels: [
      { level: 0, name: 'Stock airbox', cost: 0, torqueScale: 1.00, spoolScale: 1.00, spriteKey: 'tuningPartIntakeL0', benefit: 'Factory airflow' },
      { level: 1, name: 'High-flow intake', cost: 8000, torqueScale: 1.02, spoolScale: 1.02, spriteKey: 'tuningPartIntakeL1', benefit: '+2% output / response' },
      { level: 2, name: 'Cold-air intake', cost: 22000, torqueScale: 1.03, spoolScale: 1.035, spriteKey: 'tuningPartIntakeL2', benefit: '+3% output / response' },
      { level: 3, name: 'Race intake', cost: 55000, torqueScale: 1.05, spoolScale: 1.05, spriteKey: 'tuningPartIntakeL3', benefit: '+5% output / response' },
    ],
  },
  ecu: {
    id: 'ecu',
    name: 'ECU',
    subtitle: 'ENGINE CONTROL',
    levels: [
      { level: 0, name: 'Stock ECU', cost: 0, torqueScale: 1.00, redlineAdd: 0, boostAdd: 0, spriteKey: 'tuningPartEcuL0', benefit: 'Factory calibration' },
      { level: 1, name: 'Street reflash', cost: 12000, torqueScale: 1.03, redlineAdd: 50, boostAdd: 0.03, spriteKey: 'tuningPartEcuL1', benefit: '+3% output / sharper tune' },
      { level: 2, name: 'Dyno tune', cost: 35000, torqueScale: 1.04, redlineAdd: 125, boostAdd: 0.05, spriteKey: 'tuningPartEcuL2', benefit: '+4% output / more boost' },
      { level: 3, name: 'Motorsport ECU', cost: 85000, torqueScale: 1.07, redlineAdd: 225, boostAdd: 0.10, spriteKey: 'tuningPartEcuL3', benefit: '+7% output / full control' },
    ],
  },
  turbo: {
    id: 'turbo',
    name: 'TURBO',
    subtitle: 'FORCED INDUCTION',
    levels: [
      { level: 0, name: 'Factory setup', cost: 0, naBoost: 0, factoryBoostAdd: 0, size: 0, spoolScale: 1.00, benefit: 'Stock aspiration' },
      { level: 1, name: 'Street turbo kit', cost: 40000, naBoost: 0.25, factoryBoostAdd: 0.10, size: 0.42, spoolScale: 1.08, spriteKey: 'tuningPartTurboL1', benefit: 'Fast-spool street boost' },
      { level: 2, name: 'Ball-bearing turbo', cost: 110000, naBoost: 0.45, factoryBoostAdd: 0.18, size: 0.58, spoolScale: 1.00, spriteKey: 'tuningPartTurboL2', benefit: 'Strong mid / top end' },
      { level: 3, name: 'Big turbo', cost: 230000, naBoost: 0.75, factoryBoostAdd: 0.36, size: 0.74, spoolScale: 0.92, spriteKey: 'tuningPartTurboL3', benefit: 'Maximum peak power' },
    ],
  },
  intercooler: {
    id: 'intercooler',
    name: 'INTERCOOLER',
    subtitle: 'CHARGE COOLING',
    levels: [
      { level: 0, name: 'Factory cooling', cost: 0, torqueScale: 1.00, spoolScale: 1.00, spriteKey: 'tuningPartIntercoolerL0', benefit: 'Stock charge cooling' },
      { level: 1, name: 'Upgraded core', cost: 15000, torqueScale: 1.01, spoolScale: 1.01, spriteKey: 'tuningPartIntercoolerL1', benefit: '+1% output / consistency' },
      { level: 2, name: 'Front-mount kit', cost: 40000, torqueScale: 1.02, spoolScale: 1.03, spriteKey: 'tuningPartIntercoolerL2', benefit: '+2% output / response' },
      { level: 3, name: 'Race intercooler', cost: 90000, torqueScale: 1.035, spoolScale: 1.05, spriteKey: 'tuningPartIntercoolerL3', benefit: '+3.5% output / response' },
    ],
  },
};

export function normaliseEngineTuning(input = {}) {
  const result = {};
  ENGINE_PART_ORDER.forEach(id => {
    result[id] = clampLevel(input?.[id]);
  });
  return result;
}

export function getEngineTuning(carState = {}) {
  return normaliseEngineTuning(carState.tuning || carState.engineTuning || {});
}

export function getUpgradePathCost(partId, fromLevel, toLevel) {
  const part = ENGINE_TUNING_PARTS[partId];
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

export function getEngineTuningCartCost(currentInput = {}, pendingInput = {}) {
  const current = normaliseEngineTuning(currentInput);
  const pending = normaliseEngineTuning(pendingInput);
  return ENGINE_PART_ORDER.reduce(
    (sum, id) => sum + getUpgradePathCost(id, current[id], pending[id]),
    0
  );
}

export function getEngineTuningCount(input = {}) {
  const tuning = normaliseEngineTuning(input);
  return ENGINE_PART_ORDER.filter(id => tuning[id] > 0).length;
}

export function applyEngineTuning(carConfig, engineConfig, carState = {}) {
  const car = {
    ...carConfig,
    gearRatios: [...(carConfig.gearRatios || [])],
    visual: { ...(carConfig.visual || {}) },
  };

  const engine = {
    ...engineConfig,
    torqueCurve: (engineConfig.torqueCurve || []).map(point => [...point]),
  };

  const tuning = getEngineTuning(carState);
  const levels = {};
  ENGINE_PART_ORDER.forEach(id => {
    levels[id] = ENGINE_TUNING_PARTS[id].levels[tuning[id]];
  });

  const baseBoost = Number(carConfig.maximumBoost || 0);
  const turboLevel = tuning.turbo;
  const turboSpec = levels.turbo;
  const hasForcedInduction = baseBoost > 0.01 || turboLevel > 0;
  const intercoolerScale = hasForcedInduction ? (levels.intercooler.torqueScale || 1) : 1;

  const mechanicalScale =
    (levels.engine.torqueScale || 1) *
    (levels.intake.torqueScale || 1) *
    (levels.ecu.torqueScale || 1) *
    intercoolerScale;

  engine.torqueCurve = engine.torqueCurve.map(([rpm, torque]) => [rpm, torque * mechanicalScale]);

  const redlineAdd = (levels.engine.redlineAdd || 0) + (levels.ecu.redlineAdd || 0);
  engine.redlineRPM = Number(engine.redlineRPM || car.engineRedlineRPM || 7600) + redlineAdd;
  engine.limiterRPM = Number(engine.limiterRPM || car.engineLimiterRPM || engine.redlineRPM + 200) + redlineAdd;
  car.engineRedlineRPM = Number(car.engineRedlineRPM || engine.redlineRPM) + redlineAdd;
  car.engineLimiterRPM = Number(car.engineLimiterRPM || engine.limiterRPM) + redlineAdd;

  if (turboLevel > 0) {
    car.maximumBoost = baseBoost > 0
      ? baseBoost + turboSpec.factoryBoostAdd
      : turboSpec.naBoost;
    car.turboSize = Math.max(Number(carConfig.turboSize || 0), turboSpec.size || 0);
    const stockSpool = Number(carConfig.turboSpoolRate || 0) > 0
      ? Number(carConfig.turboSpoolRate)
      : 1.75;
    car.turboSpoolRate = stockSpool
      * (turboSpec.spoolScale || 1)
      * (levels.intake.spoolScale || 1)
      * (levels.intercooler.spoolScale || 1);
  } else {
    car.maximumBoost = baseBoost;
    car.turboSize = Number(carConfig.turboSize || 0);
    car.turboSpoolRate = Number(carConfig.turboSpoolRate || 0);
  }

  if (car.maximumBoost > 0.01) {
    car.maximumBoost += levels.ecu.boostAdd || 0;
  }

  car.vehicleMassKg = Math.max(
    500,
    Number(carConfig.vehicleMassKg || 1000)
      + Number(levels.engine.massDelta || 0)
  );

  let boostOutputScale = 1;
  const referenceBoost = Number(engineConfig.referenceBoostBar || 0);
  if (car.maximumBoost > 0.01) {
    boostOutputScale = referenceBoost > 0
      ? Math.max(1, (1 + car.maximumBoost) / (1 + referenceBoost))
      : 1 + car.maximumBoost * 0.78;
  }

  car.powerKW = Math.round(Number(carConfig.powerKW || 0) * mechanicalScale * boostOutputScale);
  car.torqueNm = Math.round(Number(carConfig.torqueNm || 0) * mechanicalScale * boostOutputScale);

  return { car, engine, tuning, mechanicalScale, boostOutputScale };
}
