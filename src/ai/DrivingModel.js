import Engine from '../vehicles/Engine.js?v=20260921-r55';
import Turbo from '../vehicles/Turbo.js?v=20261004-r325';

export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));

// A read-only planning model: call the SAME torque/spool functions on private
// probes. These estimates only select pedals/gears; they never move the car.
export class DrivingModel {
  constructor(vehicle) {
    this.vehicle = vehicle;
    this.engine = new Engine(vehicle.engine.config);
    this.turbo = new Turbo(vehicle.config);
    this.ratios = vehicle.transmission.gearRatios;
    this.ceiling = Math.min(vehicle.engine.config.redlineRPM, vehicle.engine.config.limiterRPM - 160);
    this.shiftPoints = this.ratios.map((_, i) => this.findShiftRPM(i + 1));
  }

  torque(rpm, boost = this.expectedBoost(rpm), nos = false) {
    this.engine.rpm = rpm;
    const kit = this.vehicle.nitrous;
    const extra = nos && kit.remaining > 0.001
      ? clamp(kit.powerHp * 745.7 / Math.max(90, rpm * Math.PI * 2 / 60), 0, 190) : 0;
    return this.engine.combustionTorque(1, boost, extra);
  }

  expectedBoost(rpm, initialSpool = null) {
    this.turbo.spool = initialSpool ?? 0;
    // Steady useful boost for curve comparison, shorter recovery after a shift.
    const duration = initialSpool == null ? 3 : 0.35;
    for (let time = 0; time < duration; time += 0.05) {
      this.turbo.update(0.05, rpm, 1, 1.05, false, false);
    }
    return this.turbo.boostBar;
  }

  findShiftRPM(gear) {
    const ratio = this.ratios[gear - 1], next = this.ratios[gear];
    if (!(ratio > 0 && next > 0 && next < ratio)) return this.ceiling;
    const floor = Math.max(this.ceiling * 0.66, this.vehicle.engine.config.idleRPM * 2 * ratio / next);
    // Final drive/efficiency cancel in this same-speed comparison. Scan from
    // above the useful-band floor; require the crossover to persist for 100 rpm.
    const advantage = rpm => {
      const boost = this.expectedBoost(rpm);
      const retained = this.vehicle.turbo.maxBoostBar > 0
        ? boost / this.vehicle.turbo.maxBoostBar * Math.exp(-(2.6 + this.vehicle.turbo.size) * 0.12) : 0;
      const after = rpm * next / ratio;
      const nextBoost = Math.min(this.expectedBoost(after), this.expectedBoost(after, retained));
      return this.torque(after, nextBoost) * next - this.torque(rpm, boost) * ratio;
    };
    for (let rpm = floor; rpm < this.ceiling - 100; rpm += 25) {
      if (advantage(rpm) >= 0 && advantage(rpm + 100) >= 0) return Math.round(rpm);
    }
    return this.ceiling;
  }

  rollingGear(speedMps) {
    const v = this.vehicle;
    const wheelRPM = speedMps / (2 * Math.PI * v.config.wheelRadius) * 60;
    let best = null;
    for (let gear = 1; gear <= this.ratios.length; gear++) {
      const rpm = wheelRPM * this.ratios[gear - 1] * v.transmission.finalDrive;
      const limit = Math.min(this.shiftPoints[gear - 1] * 0.90, v.engine.config.limiterRPM * 0.90);
      if (rpm < v.engine.config.idleRPM || rpm > limit) continue;
      const force = this.torque(rpm) * this.ratios[gear - 1] * v.transmission.finalDrive
        * v.transmission.efficiency / v.config.wheelRadius;
      // Penalise torque that cannot reach the road, with a small preference for
      // headroom when two gears are traction-limited.
      const score = Math.min(force, this.tractionForce()) * (1 - 0.025 * rpm / limit);
      if (!best || score > best.score) best = { gear, rpm, score };
    }
    return best?.gear ?? this.ratios.length;
  }

  tractionForce() {
    const v = this.vehicle;
    return v.config.vehicleMassKg * 9.81 * v.tyres.drivenAxleWeightFraction
      * v.tyres.launchLoadMultiplier * v.tyres.grip;
  }
}
