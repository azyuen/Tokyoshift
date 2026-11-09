// Canonical NOS equipment for garage, briefing, scrutineering and race builds.
// A fitted bottle is not necessarily usable (it also needs a shot upgrade).
// Factory-installed NOS on sealed LBWK/collector cars is a VEHICLE feature,
// not a purchased workshop part. Never infer it from the stock cars' generic
// nosPower default alone; stock cars have no factory nosShots.
import { getExhaustNosTuning, EXHAUST_NOS_TUNING_PARTS } from './secondaryTuning.js?v=20261026-r687';

const positive = value => Math.max(0, Number(value) || 0);
const shots = value => Math.min(3, Math.max(0, Math.floor(Number(value) || 0)));

export function getNosEquipment(car = {}, state = {}) {
  const sealed = Boolean(car.collector || car.tuningLocked ||
    state.collector || state.tuningLocked || state.immutable);
  const factory = sealed &&
    positive(car.nosPower) > 0 && shots(car.nosShots) > 0;

  const installed = getExhaustNosTuning(state);
  const purchased = installed.nosKit > 0;
  const bottle = EXHAUST_NOS_TUNING_PARTS.nosKit.levels[installed.nosKit];
  const shot = EXHAUST_NOS_TUNING_PARTS.nitrousShot.levels[installed.nitrousShot];

  // Pre-parts-tree saves have a genuine one-shot installation bit but no
  // exhaustNosTuning hardware. Never give an unfitted vehicle free NOS.
  const legacy = !factory && !purchased && state.nosInstalled === true;
  const equippedShots = factory ? shots(car.nosShots)
    : purchased ? (positive(shot?.powerHp) ? shots(bottle?.shots) : 0)
      : legacy ? 1 : 0;
  const equippedPowerHp = factory ? positive(car.nosPower)
    : purchased ? positive(shot?.powerHp)
      : legacy ? positive(state.nosPower) || 35 : 0;
  const shotDurationSeconds = factory
    ? Math.max(0.2, positive(car.nosShotDurationSeconds) || 1)
    : purchased ? Math.max(0.2, positive(bottle?.shotDurationSeconds) || 1)
      : 1;
  const usable = equippedShots > 0 && equippedPowerHp > 0;
  const enabled = state.nosEnabled !== false;
  return {
    type: factory ? 'FACTORY' : purchased ? 'AFTERMARKET' : legacy ? 'LEGACY' : 'NONE',
    factory, purchased, legacy,
    fitted: factory || purchased || legacy,
    usable, enabled, active: usable && enabled,
    equippedShots, equippedPowerHp, shotDurationSeconds,
    shots: usable && enabled ? equippedShots : 0,
    powerHp: usable && enabled ? equippedPowerHp : 0,
    capacitySeconds: usable && enabled ? equippedShots * shotDurationSeconds : 0,
  };
}

export function withNosEnabled(state = {}, enabled = true) {
  // This is a reversible master switch, NOT uninstall/repurchase.
  return { ...state, nosEnabled: Boolean(enabled) };
}
