import { getEngineTuning } from './tuning.js?v=20260926-r211';
import { getDrivetrainTuning } from './secondaryTuning.js?v=20260926-r211';

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const clone = value => JSON.parse(JSON.stringify(value || {}));

export const STAGE3_CALIBRATION_KEYS = Object.freeze(['ecuBias', 'boostBias', 'gearBias']);
export const STAGE3_PRESET_SAVE_COST = 100000;
export const MAX_STAGE3_PRESETS = 3;

export const STAGE3_CALIBRATION_OPTIONS = Object.freeze({
  ecuBias: Object.freeze([
    { value: -2, label: 'MID +2', detail: 'Earlier torque / lower peak power' },
    { value: -1, label: 'MID +1', detail: 'Mild midrange bias' },
    { value: 0, label: 'BALANCED', detail: 'Neutral power curve' },
    { value: 1, label: 'TOP +1', detail: 'Mild top-end bias' },
    { value: 2, label: 'TOP +2', detail: 'Later torque / higher peak power' },
  ]),
  boostBias: Object.freeze([
    { value: -2, label: 'EARLY +2', detail: 'Fast spool / lower peak boost' },
    { value: -1, label: 'EARLY +1', detail: 'Earlier response / softer peak' },
    { value: 0, label: 'BALANCED', detail: 'Neutral boost curve' },
    { value: 1, label: 'LATE +1', detail: 'Later spool / stronger peak' },
    { value: 2, label: 'LATE +2', detail: 'Latest spool / strongest peak' },
  ]),
  gearBias: Object.freeze([
    { value: -2, label: 'CLOSE +2', detail: 'Longer low gears / shorter upper gears' },
    { value: -1, label: 'CLOSE +1', detail: 'Mild close-ratio spread' },
    { value: 0, label: 'BALANCED', detail: 'Installed gearbox ratios' },
    { value: 1, label: 'WIDE +1', detail: 'Shorter low gears / taller upper gears' },
    { value: 2, label: 'WIDE +2', detail: 'Maximum low-to-high spread' },
  ]),
});

export function normaliseStage3Calibration(input = {}) {
  const source = input?.stage3Calibration || input || {};
  return {
    ecuBias: Math.round(clamp(source.ecuBias, -2, 2)),
    boostBias: Math.round(clamp(source.boostBias, -2, 2)),
    gearBias: Math.round(clamp(source.gearBias, -2, 2)),
  };
}

export function getStage3CalibrationEligibility(state = {}) {
  const engine = getEngineTuning(state);
  const drivetrain = getDrivetrainTuning(state);
  return {
    ecuBias: Number(engine.ecu || 0) >= 3,
    boostBias: Number(engine.turbo || 0) >= 3,
    gearBias: Number(drivetrain.gearbox || 0) >= 3,
  };
}

export function getStage3CalibrationOption(key, value = 0) {
  const list = STAGE3_CALIBRATION_OPTIONS[key] || [];
  const numeric = Math.round(clamp(value, -2, 2));
  return list.find(item => item.value === numeric) || list.find(item => item.value === 0) || null;
}

export function describeStage3Calibration(input = {}) {
  const tune = normaliseStage3Calibration(input);
  return {
    ecu: getStage3CalibrationOption('ecuBias', tune.ecuBias)?.label || 'BALANCED',
    boost: getStage3CalibrationOption('boostBias', tune.boostBias)?.label || 'BALANCED',
    gears: getStage3CalibrationOption('gearBias', tune.gearBias)?.label || 'BALANCED',
  };
}

export function applyStage3Calibration(carConfig = {}, engineConfig = {}, state = {}) {
  const car = clone(carConfig);
  const engine = clone(engineConfig);
  car.gearRatios = [...(carConfig.gearRatios || [])];
  engine.torqueCurve = (engineConfig.torqueCurve || []).map(point => [...point]);

  const requested = normaliseStage3Calibration(state);
  const eligibility = getStage3CalibrationEligibility(state);
  const tune = {
    ecuBias: eligibility.ecuBias ? requested.ecuBias : 0,
    boostBias: eligibility.boostBias ? requested.boostBias : 0,
    gearBias: eligibility.gearBias ? requested.gearBias : 0,
  };

  // ECU: redistribute the torque curve around ~58% of the rev range.
  // Negative = stronger midrange but less top-end; positive = the opposite.
  if (tune.ecuBias !== 0 && engine.torqueCurve.length) {
    const idle = Math.max(500, Number(engine.idleRPM || 850));
    const redline = Math.max(idle + 1000, Number(engine.redlineRPM || car.engineRedlineRPM || 7600));
    engine.torqueCurve = engine.torqueCurve.map(([rpm, torque]) => {
      const position = clamp((Number(rpm) - idle) / Math.max(1, redline - idle), 0, 1);
      const curveShift = tune.ecuBias * (position - 0.58) * 0.12;
      return [rpm, Math.max(0, Number(torque || 0) * (1 + curveShift))];
    });

    // Metadata follows the curve trade-off so matchmaking/spec estimates remain
    // directionally consistent with the physics without creating free output.
    car.powerKW = Math.max(1, Math.round(Number(car.powerKW || 0) * (1 + tune.ecuBias * 0.025)));
    car.torqueNm = Math.max(1, Math.round(Number(car.torqueNm || 0) * (1 - tune.ecuBias * 0.0125)));
  }

  // Boost control: early response deliberately gives up peak boost; a late map
  // delays the ramp and allows a stronger peak. Turbo hardware itself is unchanged.
  if (tune.boostBias !== 0 && Number(car.maximumBoost || 0) > 0.01) {
    const strength = tune.boostBias / 2;
    car.maximumBoost = Math.max(0.05, Number(car.maximumBoost) * (1 + strength * 0.11));
    car.turboSpoolRate = Math.max(0.1, Number(car.turboSpoolRate || 1.75) * (1 - strength * 0.18));
    car.boostOnsetRPM = Math.round(1800 + strength * 350);
    car.boostRampRPM = Math.round(4300 + strength * 700);

    // Keep the published peak figure aligned with the possible boost target.
    // This is still a trade: stronger peak arrives later, early response arrives weaker.
    car.powerKW = Math.max(1, Math.round(Number(car.powerKW || 0) * (1 + strength * 0.045)));
  } else {
    car.boostOnsetRPM = Number(car.boostOnsetRPM || 1800);
    car.boostRampRPM = Number(car.boostRampRPM || 4300);
  }

  // Gear spread: positive settings shorten low gears while making upper gears
  // taller. Negative settings close the spread. Engine power is unchanged.
  if (tune.gearBias !== 0 && car.gearRatios.length > 1) {
    const strength = tune.gearBias / 2;
    const last = car.gearRatios.length - 1;
    car.gearRatios = car.gearRatios.map((ratio, index) => {
      const position = index / last;
      const spread = (1 - position * 2) * strength * 0.10;
      return Math.max(0.20, Number(ratio || 1) * (1 + spread));
    });
  }

  car.stage3Calibration = { ...tune };
  engine.stage3Calibration = { ...tune };
  return { car, engine, calibration: tune, eligibility };
}


export function normaliseStage3PresetName(value = '', fallback = 'UNTITLED') {
  const cleaned = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20);
  return cleaned || fallback;
}

export function stage3CalibrationsEqual(a = {}, b = {}) {
  const left = normaliseStage3Calibration(a);
  const right = normaliseStage3Calibration(b);
  return (
    left.ecuBias === right.ecuBias &&
    left.boostBias === right.boostBias &&
    left.gearBias === right.gearBias
  );
}

export function getStage3Presets(state = {}) {
  const source = Array.isArray(state?.stage3Presets) ? state.stage3Presets : [];
  return Array.from({ length: MAX_STAGE3_PRESETS }, (_, index) => {
    const raw = source[index];
    if (!raw || typeof raw !== 'object') return null;
    return {
      name: normaliseStage3PresetName(raw.name, 'PRESET ' + (index + 1)),
      calibration: normaliseStage3Calibration(raw.calibration || raw),
      savedAt: Math.max(0, Number(raw.savedAt || 0)),
    };
  });
}

export function findMatchingStage3Preset(state = {}, calibration = {}) {
  const presets = getStage3Presets(state);
  const index = presets.findIndex(preset =>
    preset && stage3CalibrationsEqual(preset.calibration, calibration)
  );
  return index >= 0 ? { index, preset: presets[index] } : null;
}
