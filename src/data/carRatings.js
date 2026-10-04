const stableValue = value => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, stableValue(value[key])])
    );
  }
  return value;
};

const positiveLevels = group =>
  group && typeof group === 'object' &&
  Object.values(group).some(value => Number(value || 0) > 0);

export function hasPerformanceModifications(state = {}) {
  if (state?.stock === false) return true;
  if (Number(state?.tuneLevel || 0) > 0) return true;
  if (Boolean(state?.nosInstalled)) return true;

  const groups = [
    state?.tuning,
    state?.engineTuning,
    state?.drivetrainTuning,
    state?.chassisTuning,
    state?.exhaustNosTuning,
  ];
  if (groups.some(positiveLevels)) return true;

  const specialist = state?.specialistTuning;
  if (Array.isArray(specialist) && specialist.length) return true;
  if (
    specialist &&
    typeof specialist === 'object' &&
    Object.values(specialist).some(Boolean)
  ) return true;

  return false;
}

export function getPerformanceModificationSignature(state = {}) {
  const payload = stableValue({
    stock: state?.stock !== false,
    tuneLevel: Number(state?.tuneLevel || 0),
    tuning: state?.tuning || {},
    engineTuning: state?.engineTuning || {},
    drivetrainTuning: state?.drivetrainTuning || {},
    chassisTuning: state?.chassisTuning || {},
    exhaustNosTuning: state?.exhaustNosTuning || {},
    specialistTuning: state?.specialistTuning || [],
    stage3Calibration: state?.stage3Calibration || {},
    nosInstalled: Boolean(state?.nosInstalled),
    nosPower: Number(state?.nosPower || 0),
    nosCapacitySeconds: Number(state?.nosCapacitySeconds || 0),
  });
  return JSON.stringify(payload);
}

export function getOfficialDynoReading(state = {}) {
  const reading = state?.dyno?.officialReading;
  if (!reading || typeof reading !== 'object') return null;
  if (String(reading.signature || '') !== getPerformanceModificationSignature(state)) return null;

  const powerKW = Number(reading.powerKW);
  const torqueNm = Number(reading.torqueNm);
  if (!Number.isFinite(powerKW) || !Number.isFinite(torqueNm)) return null;

  return {
    powerKW,
    torqueNm,
    measuredAt: Number(reading.measuredAt || 0),
  };
}

function estimatedRange(value = 0, step = 50) {
  const numeric = Math.max(0, Number(value || 0));
  const size = Math.max(10, Number(step || 50));
  const lower = Math.max(0, Math.floor(numeric / size) * size);
  const upper = lower + size;
  return { lower, upper, label: lower + '–' + upper };
}

export function getPowerTorqueDisplay(car = {}, state = {}, builtCar = null) {
  const spec = builtCar || car || {};
  const accurateByDefault = Boolean(
    car?.collector ||
    car?.tuningLocked ||
    car?.ginzaExclusive ||
    state?.collector ||
    state?.immutable
  );
  const modified = hasPerformanceModifications(state);
  const official = !accurateByDefault && modified ? getOfficialDynoReading(state) : null;

  if (accurateByDefault || !modified || official) {
    const powerKW = Number(official?.powerKW ?? spec?.powerKW ?? car?.powerKW ?? 0);
    const torqueNm = Number(official?.torqueNm ?? spec?.torqueNm ?? car?.torqueNm ?? 0);
    return {
      estimated: false,
      official: Boolean(official),
      powerKW,
      torqueNm,
      powerLabel: Math.round(powerKW) + ' kW',
      torqueLabel: Math.round(torqueNm) + ' Nm',
    };
  }

  const power = estimatedRange(spec?.powerKW ?? car?.powerKW ?? 0, 50);
  const torque = estimatedRange(spec?.torqueNm ?? car?.torqueNm ?? 0, 50);
  return {
    estimated: true,
    official: false,
    powerKW: Number(spec?.powerKW ?? car?.powerKW ?? 0),
    torqueNm: Number(spec?.torqueNm ?? car?.torqueNm ?? 0),
    powerLabel: 'EST. ' + power.label + ' kW',
    torqueLabel: 'EST. ' + torque.label + ' Nm',
  };
}

export function createOfficialDynoReading(state = {}, run = {}) {
  const analysis = run?.analysis || {};
  const powerKW = Number(run?.maxPowerKW ?? analysis?.peakPowerKW ?? 0);
  const torqueNm = Number(run?.maxTorqueNm ?? analysis?.peakTorqueNm ?? 0);

  return {
    signature: getPerformanceModificationSignature(state),
    powerKW: Math.max(0, Math.round(powerKW)),
    torqueNm: Math.max(0, Math.round(torqueNm)),
    measuredAt: Number(run?.completedAt || Date.now()),
  };
}
