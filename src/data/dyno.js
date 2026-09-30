import { cars } from './cars.js?v=20260928-r232';
import { engines } from './engines.js?v=20260928-r232';
import { applyEngineTuning } from './tuning.js?v=20260926-r211';
import { applySecondaryTuning } from './secondaryTuning.js?v=20260926-r211';
import { applySpecialistTuning } from './tunerShops.js?v=20260930-r288';

const clone = value => JSON.parse(JSON.stringify(value || {}));
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export const DYNO_STAGES = Object.freeze([
  {
    tier: 0,
    id: 'none',
    label: 'DYNO CELL',
    shortLabel: 'NOT INSTALLED',
    installCost: 0,
    sessionCost: 0,
    pullsPerSession: 0,
  },
  {
    tier: 1,
    id: 'roller',
    label: 'STAGE I // AWD ROLLER DYNO',
    shortLabel: 'AWD ROLLER DYNO',
    installCost: 200000,
    sessionCost: 10000,
    pullsPerSession: 3,
    description: 'Baseline power and torque mapping with live telemetry.',
  },
  {
    tier: 2,
    id: 'load',
    label: 'STAGE II // LOAD DYNO + ECU MAPPING',
    shortLabel: 'LOAD DYNO + ECU',
    installCost: 450000,
    sessionCost: 15000,
    pullsPerSession: 3,
    description: 'Guided response, balanced and top-end calibration.',
  },
  {
    tier: 3,
    id: 'competition',
    label: 'STAGE III // COMPETITION CALIBRATION CELL',
    shortLabel: 'COMPETITION CELL',
    installCost: 900000,
    sessionCost: 20000,
    pullsPerSession: 3,
    description: 'Advanced maps, shift analysis and road-load simulation.',
  },
]);

export const DYNO_WAREHOUSE_ID = 'shinonomeWarehouseStrip';

export function normaliseDynoFacilityTier(value = 0) {
  return Math.max(0, Math.min(3, Math.floor(Number(value) || 0)));
}

export function getDynoStage(value = 0) {
  return DYNO_STAGES[normaliseDynoFacilityTier(value)] || DYNO_STAGES[0];
}

export function getDynoNextStage(value = 0) {
  const tier = normaliseDynoFacilityTier(value);
  return DYNO_STAGES[Math.min(3, tier + 1)] || DYNO_STAGES[3];
}

export function getRecommendedDynoGear(car = {}) {
  const ratios = Array.isArray(car.gearRatios) ? car.gearRatios : [];
  if (!ratios.length) return 1;

  // Tokyo SHIFT uses a consistent road-car dyno procedure capped at 4th gear.
  // This keeps five- and six-speed cars on the same interaction flow and avoids
  // six-speed collector cars appearing to "rev cap" while still in SETUP.
  const dynoRatios = ratios.slice(0, Math.min(4, ratios.length));

  let bestGear = 1;
  let bestDelta = Infinity;
  dynoRatios.forEach((ratio, index) => {
    const numeric = Math.max(0.01, Number(ratio) || 0.01);
    const delta = Math.abs(numeric - 1.0);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestGear = index + 1;
    }
  });
  return bestGear;
}

export function buildDynoCar(carId, state = {}) {
  const baseCar = cars[carId];
  if (!baseCar) return null;
  const baseEngine = engines[baseCar.engine];
  if (!baseEngine) return null;

  const engineBuild = applyEngineTuning(clone(baseCar), clone(baseEngine), state);
  const secondaryBuild = applySecondaryTuning(engineBuild.car, engineBuild.engine, state);
  const specialistBuild = applySpecialistTuning(
    secondaryBuild.car,
    secondaryBuild.engine,
    state
  );

  return {
    car: specialistBuild.car,
    engine: specialistBuild.engine,
    installedSpecialistTuning: specialistBuild.installed || [],
  };
}

export function torqueAtRPM(engine = {}, rpm = 0) {
  const curve = Array.isArray(engine.torqueCurve) ? engine.torqueCurve : [];
  if (!curve.length) return 0;
  const target = Number(rpm) || 0;
  if (target <= Number(curve[0][0] || 0)) return Number(curve[0][1] || 0);

  for (let index = 0; index < curve.length - 1; index += 1) {
    const [rpm0, torque0] = curve[index];
    const [rpm1, torque1] = curve[index + 1];
    if (target <= rpm1) {
      const span = Math.max(1, Number(rpm1) - Number(rpm0));
      const t = clamp((target - Number(rpm0)) / span, 0, 1);
      return Number(torque0) + (Number(torque1) - Number(torque0)) * t;
    }
  }

  return Number(curve[curve.length - 1][1] || 0);
}

export function getDynoPoint(build, rpm, boostBar = 0, throttle = 1) {
  if (!build?.car || !build?.engine) {
    return { rpm: Number(rpm) || 0, torqueNm: 0, powerKW: 0, boostBar: 0 };
  }

  const engine = build.engine;
  const baseTorque = torqueAtRPM(engine, rpm);
  const referenceBoost = Math.max(0, Number(engine.referenceBoostBar || 0));
  const positiveBoost = Math.max(0, Number(boostBar || 0));
  let boostScale = 1;

  if (referenceBoost > 0) {
    if (positiveBoost <= referenceBoost) {
      const spoolFraction = clamp(positiveBoost / referenceBoost, 0, 1);
      const offBoost = clamp(Number(engine.offBoostTorqueFraction ?? 0.55), 0.20, 1);
      boostScale = offBoost + (1 - offBoost) * spoolFraction;
    } else {
      boostScale = (1 + positiveBoost) / (1 + referenceBoost);
    }
  } else if (positiveBoost > 0) {
    boostScale = 1 + positiveBoost * 0.78;
  }

  const limiter = Math.max(
    1000,
    Number(engine.limiterRPM || build.car.engineLimiterRPM || 8000)
  );
  const limiterCut = Number(rpm) >= limiter ? 0 : 1;
  const torqueNm = Math.max(0, baseTorque * boostScale * clamp(throttle, 0, 1) * limiterCut);
  const powerKW = Math.max(0, torqueNm * Math.max(0, Number(rpm) || 0) / 9549);

  return {
    rpm: Math.round(Number(rpm) || 0),
    torqueNm,
    powerKW,
    boostBar: positiveBoost,
  };
}

export function analyseDynoRun(run = {}, build = null) {
  const points = Array.isArray(run.points) ? run.points : [];
  if (!points.length) {
    return {
      peakPowerKW: 0,
      peakPowerRPM: 0,
      peakTorqueNm: 0,
      peakTorqueRPM: 0,
      usableBandStartRPM: 0,
      usableBandEndRPM: 0,
      comment: 'No clean pull recorded yet.',
    };
  }

  const peakPowerPoint = points.reduce(
    (best, point) => Number(point.powerKW || 0) > Number(best.powerKW || 0) ? point : best,
    points[0]
  );
  const peakTorquePoint = points.reduce(
    (best, point) => Number(point.torqueNm || 0) > Number(best.torqueNm || 0) ? point : best,
    points[0]
  );

  const peakPower = Math.max(1, Number(peakPowerPoint.powerKW || 0));
  const bandPoints = points.filter(point => Number(point.powerKW || 0) >= peakPower * 0.82);
  const usableStart = bandPoints[0]?.rpm || peakPowerPoint.rpm;
  const usableEnd = bandPoints[bandPoints.length - 1]?.rpm || peakPowerPoint.rpm;
  const finalPoint = points[points.length - 1];
  const finalPowerFraction = Number(finalPoint.powerKW || 0) / peakPower;
  const maxBoost = Math.max(0, Number(build?.car?.maximumBoost || 0));
  const boostThreshold = maxBoost * 0.72;
  const boostPoint = maxBoost > 0.05
    ? points.find(point => Number(point.boostBar || 0) >= boostThreshold)
    : null;
  const redline = Math.max(
    1000,
    Number(build?.engine?.redlineRPM || build?.car?.engineRedlineRPM || finalPoint.rpm || 8000)
  );

  let comment = 'Clean curve. That gives us a proper baseline.';
  if (maxBoost > 0.05 && boostPoint && Number(boostPoint.rpm || 0) > redline * 0.58) {
    comment = 'Boost arrives late. Big top end, but there is a real hole before it comes on.';
  } else if (finalPowerFraction >= 0.94) {
    comment = 'Power is still carrying near redline. Do not rush the shift on this one.';
  } else if (finalPowerFraction < 0.78) {
    comment = 'It falls away hard up top. Peak number is good, but the useful band ends earlier.';
  } else if (Number(peakTorquePoint.rpm || 0) < redline * 0.52) {
    comment = 'Strong midrange hit. This should feel very effective out of slower sections and launches.';
  } else if (Number(usableEnd || 0) - Number(usableStart || 0) > redline * 0.38) {
    comment = 'That is a broad usable band. You have plenty of room around the shift points.';
  }

  return {
    peakPowerKW: Math.round(Number(peakPowerPoint.powerKW || 0)),
    peakPowerRPM: Math.round(Number(peakPowerPoint.rpm || 0) / 50) * 50,
    peakTorqueNm: Math.round(Number(peakTorquePoint.torqueNm || 0)),
    peakTorqueRPM: Math.round(Number(peakTorquePoint.rpm || 0) / 50) * 50,
    usableBandStartRPM: Math.round(Number(usableStart || 0) / 50) * 50,
    usableBandEndRPM: Math.round(Number(usableEnd || 0) / 50) * 50,
    comment,
  };
}
