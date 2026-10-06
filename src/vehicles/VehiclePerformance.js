import { cars } from '../data/cars.js?v=20261006-r388';
import { engines } from '../data/engines.js?v=20261004-r333';
import { applyEngineTuning } from '../data/tuning.js?v=20260926-r211';
import { applySecondaryTuning, getExhaustNosTuning } from '../data/secondaryTuning.js?v=20260926-r211';
import { PROGRESSION_BALANCE } from '../data/progressionBalance.js?v=20260928-r239';
import { applyStage3Calibration } from '../data/stage3Calibration.js?v=20261004-r325';

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export function hasExplicitWorkshopTuning(state = {}) {
  const groups = [
    state.tuning,
    state.engineTuning,
    state.drivetrainTuning,
    state.chassisTuning,
    state.exhaustNosTuning,
  ];
  return groups.some(group =>
    group && typeof group === 'object' &&
    Object.values(group).some(value => Number(value || 0) > 0)
  );
}

export function applyLegacyTuneLevel(config, tuneLevel = 0) {
  const rating = clamp(tuneLevel, 0, 5);
  const tier = Math.max(0, rating - 2);
  config.tyreGrip *= 1 + tier * 0.018;
  config.clutchStrength *= 1 + tier * 0.055;
  if ((config.maximumBoost || 0) > 0) {
    config.maximumBoost *= 1 + tier * 0.035;
    config.turboSpoolRate *= 1 + tier * 0.025;
  }
  return config;
}

export function buildCarFromState(carConfig, engineConfig, state = {}) {
  const config = clone(carConfig || {});
  const engine = clone(engineConfig || {});

  if (config.tuningLocked || state.tuningLocked || state.immutable || state.collector) {
    config.nosPower = 0;
    config.nosCapacitySeconds = 0;
    return { car: config, engine };
  }

  // Preserve invisible tuneLevel only for untouched legacy pink-slip cars.
  if (!hasExplicitWorkshopTuning(state)) {
    applyLegacyTuneLevel(config, state.tuneLevel || 0);
  }

  const engineTuned = applyEngineTuning(config, engine, state);
  // applySecondaryTuning already applies regional specialist tuning exactly once.
  const tuned = applySecondaryTuning(engineTuned.car, engineTuned.engine, state);
  const calibrated = applyStage3Calibration(tuned.car, tuned.engine, state);
  tuned.car = calibrated.car;
  tuned.engine = calibrated.engine;
  tuned.stage3Calibration = calibrated.calibration;
  tuned.stage3CalibrationEligibility = calibrated.eligibility;
  const exhaustNos = getExhaustNosTuning(state);

  if (exhaustNos.nosKit <= 0) {
    if (!state.nosInstalled) {
      tuned.car.nosPower = 0;
      tuned.car.nosCapacitySeconds = 0;
    } else {
      tuned.car.nosPower = Number(state.nosPower || tuned.car.nosPower || 35);
      tuned.car.nosCapacitySeconds = Number(state.nosCapacitySeconds || tuned.car.nosCapacitySeconds || 5);
    }
  }

  return tuned;
}

export function getBuiltCar(carId, state = {}) {
  const car = cars[carId];
  if (!car) return null;
  const engine = engines[car.engine];
  if (!engine) return null;
  return buildCarFromState(car, engine, state);
}

function torqueBandFactor(engine = {}, car = {}) {
  const curve = Array.isArray(engine.torqueCurve) ? engine.torqueCurve : [];
  if (!curve.length) return 1;
  const redline = Number(engine.redlineRPM || car.engineRedlineRPM || 7600);
  const usable = curve.filter(([rpm]) => Number(rpm) >= redline * 0.42 && Number(rpm) <= redline * 0.94);
  const points = usable.length ? usable : curve;
  const torques = points.map(([, torque]) => Math.max(0, Number(torque) || 0));
  const peak = Math.max(1, ...curve.map(([, torque]) => Math.max(0, Number(torque) || 0)));
  const average = torques.reduce((sum, torque) => sum + torque, 0) / Math.max(1, torques.length);
  return clamp(average / peak, 0.68, 1.02);
}

function standingEngineResponseFactor(car = {}, engine = {}) {
  const cfg = PROGRESSION_BALANCE.performance;
  const inertia = Math.max(
    0.05,
    Number(engine.inertia || car.engineInertia || cfg.referenceEngineInertia || 0.18)
  );
  const inertiaFactor = clamp(
    Math.pow(
      Math.max(0.05, Number(cfg.referenceEngineInertia || 0.18)) / inertia,
      Number(cfg.engineInertiaExponent || 0.10)
    ),
    0.95,
    1.04
  );

  let turboLaunchFactor = 1;
  if (Number(car.maximumBoost || 0) > 0.01) {
    // Turbo.js begins producing meaningful boost above ~1800 rpm. Estimate how
    // much of that window the car has already reached at its authored launch RPM
    // and blend in the engine's true off-boost torque fraction.
    const launchRPM = Math.max(1800, Number(car.launchRPM || 4400));
    const rpmWindow = clamp((launchRPM - 1800) / 4300, 0, 1);
    const spoolWindow = Math.pow(rpmWindow, 1.18);
    const offBoost = clamp(Number(engine.offBoostTorqueFraction ?? 0.55), 0.35, 1);

    turboLaunchFactor = clamp(
      Number(cfg.turboLaunchBase || 0.90) +
      spoolWindow * Number(cfg.turboLaunchSpoolWeight || 0.08) +
      offBoost * Number(cfg.turboLaunchOffBoostWeight || 0.06),
      0.94,
      1.02
    );
  }

  return {
    inertiaFactor,
    turboLaunchFactor,
    combined: inertiaFactor * turboLaunchFactor,
  };
}

function gearingFactor(car = {}, rolling = false) {
  const ratios = Array.isArray(car.gearRatios) ? car.gearRatios : [];
  if (!ratios.length) return 1;
  const finalDrive = Math.max(0.1, Number(car.finalDriveRatio || 1));
  const firstOverall = Math.max(0.1, Number(ratios[0] || 1) * finalDrive);
  const reference = PROGRESSION_BALANCE.performance.referenceOverallRatio;
  const launch = clamp(Math.sqrt(firstOverall / reference), 0.86, 1.14);

  if (!rolling) return launch;

  const middle = ratios[Math.min(ratios.length - 1, Math.max(1, Math.floor(ratios.length / 2)))] || ratios[0];
  const middleOverall = Math.max(0.1, Number(middle) * finalDrive);
  return clamp(Math.sqrt(middleOverall / 5.5), 0.90, 1.10);
}

export function calculatePerformanceIndex(car = {}, engine = {}, options = {}) {
  const cfg = PROGRESSION_BALANCE.performance;
  const mass = Math.max(500, Number(car.vehicleMassKg || 1000));
  const power = Math.max(1, Number(car.powerKW || 1));
  const torque = Math.max(1, Number(car.torqueNm || 1));
  const powerToWeight = power / mass * 1000;
  const torqueToWeight = torque / mass * 1000;
  const efficiency = clamp(Number(car.drivetrainEfficiency || 0.86) / 0.88, 0.82, 1.13);
  const rawShiftAdvantage = 1 / Math.max(0.55, Number(car.shiftTimeScale || 1));
  const shiftFactor = clamp(
    1 + (rawShiftAdvantage - 1) * Number(cfg.gearboxPerformanceWeight || 0.22),
    0.96,
    1.12
  );
  const bandFactor = torqueBandFactor(engine, car);
  const clutchFactor = clamp(Number(car.clutchStrength || torque) / Math.max(torque, 1), 0.82, 1.10);

  const tractionRaw = Math.max(0.1,
    Number(car.tyreGrip || 1) *
    Math.max(0.30, Number(car.drivenAxleWeightFraction || 0.54)) *
    Math.max(0.65, Number(car.launchLoadMultiplier || 1))
  );
  const tractionFactor = clamp(tractionRaw / cfg.referenceLaunchTraction, 0.72, 1.38);

  const boost = Math.max(0, Number(car.maximumBoost || 0));
  const spool = Math.max(0, Number(car.turboSpoolRate || 0));
  const turboSize = Math.max(0, Number(car.turboSize || 0));
  const boostResponse = boost > 0.01
    ? clamp(0.95 + spool * 0.035 - turboSize * 0.045, 0.90, 1.08)
    : 1;

  const launchGearing = gearingFactor(car, false);
  const rollGearing = gearingFactor(car, true);
  const standingEngineResponse = standingEngineResponseFactor(car, engine);
  const aeroLoad = Math.max(0.45, Number(car.dragCoefficient || 0.34) * Number(car.frontalAreaM2 || 1.85));
  const aeroFactor = clamp(Math.sqrt(0.64 / aeroLoad), 0.86, 1.12);

  const basePower = powerToWeight / cfg.referencePowerToWeight;
  const baseTorque = torqueToWeight / cfg.referenceTorqueToWeight;
  const standingCore = (basePower * 0.82 + baseTorque * 0.18);
  const rollingCore = (basePower * 0.90 + baseTorque * 0.10);
  // Traction/torque shape matter, but should refine—not erase—the real
  // power-to-weight difference between otherwise dissimilar cars.
  const standingTraction = 0.72 + tractionFactor * 0.28;
  const clutchUsability = 0.65 + clutchFactor * 0.35;
  const standingBand = 0.70 + bandFactor * 0.30;
  const rollingBand = 0.78 + bandFactor * 0.22;

  const nosPowerKw = Math.max(0, Number(car.nosPower || 0)) * 0.7457;
  const nosCapacity = Math.max(0, Number(car.nosCapacitySeconds || 0));
  const nosAvailability = clamp(nosCapacity / 5, 0, 1.35);
  const nosPerMass = nosPowerKw / mass * 1000 / cfg.referencePowerToWeight;

  const standing = Math.max(1,
    100 * standingCore *
    standingTraction * clutchUsability * efficiency * launchGearing *
    shiftFactor * standingBand * boostResponse * standingEngineResponse.combined +
    100 * nosPerMass * nosAvailability * cfg.nosStandingUse
  );

  const rolling = Math.max(1,
    100 * rollingCore *
    efficiency * rollGearing * shiftFactor *
    rollingBand * boostResponse * aeroFactor +
    100 * nosPerMass * nosAvailability * cfg.nosRollingUse
  );

  const overall = standing * cfg.standingWeight + rolling * cfg.rollingWeight;
  const raceType = String(options.raceType || '').toLowerCase();
  const selected = raceType.includes('roll') ? rolling : raceType.includes('standing') ? standing : overall;

  return {
    overall,
    standing,
    rolling,
    selected,
    components: {
      powerKW: power,
      torqueNm: torque,
      massKg: mass,
      powerToWeight,
      torqueToWeight,
      traction: tractionRaw,
      drivetrainEfficiency: Number(car.drivetrainEfficiency || 0),
      boostBar: boost,
      engineInertia: Number(engine.inertia || car.engineInertia || 0),
      engineResponse: standingEngineResponse.combined,
      turboLaunchResponse: standingEngineResponse.turboLaunchFactor,
      nosPowerHp: Math.max(0, Number(car.nosPower || 0)),
    },
  };
}

export function getVehiclePerformance(carId, state = {}, options = {}) {
  const built = getBuiltCar(carId, state);
  if (!built) return null;
  return {
    ...built,
    index: calculatePerformanceIndex(built.car, built.engine, options),
  };
}
