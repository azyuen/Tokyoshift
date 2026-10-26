import Vehicle from '../vehicles/Vehicle.js?v=20261026-r687';
import { DrivingModel, clamp } from './DrivingModel.js?v=20261026-r687';

// Oshiage coaching is advisory only. It shares the physics used by Expert/Elite
// drivers, and never changes player horsepower, controls or car configuration.
const launchCache = new Map();
const rpmRound = (rpm, step = 50) => Math.round(rpm / step) * step;

export class DrivingCoach {
  constructor(vehicle) {
    this.vehicle = vehicle;
    this.model = new DrivingModel(vehicle);
    this.shiftBands = this.model.shiftPoints.slice(0, -1).map((rpm, index) => {
      const ceiling = this.model.ceiling;
      const target = clamp(rpmRound(rpm), vehicle.engine.config.idleRPM + 500, ceiling);
      // Near a torque crossover there is no magic one-frame shift point. A
      // compact tolerance also accounts for touch input/engine-RPM sampling.
      const ratio = this.model.ratios[index + 1] / this.model.ratios[index];
      const at = x => {
        const current = this.model.torque(x) * this.model.ratios[index];
        const next = this.model.torque(x * ratio) * this.model.ratios[index + 1];
        return Math.abs(next - current) / Math.max(1, current, next);
      };
      const slope = Math.abs(at(Math.min(ceiling, target + 150)) - at(Math.max(1500, target - 150)));
      const halfWidth = slope < 0.03 ? 250 : slope < 0.09 ? 200 : 150;
      return {
        from: index + 1,
        to: index + 2,
        target,
        min: Math.max(vehicle.engine.config.idleRPM + 500, rpmRound(target - halfWidth)),
        max: Math.min(rpmRound(ceiling), rpmRound(target + halfWidth)),
      };
    });
  }

  rollingStart(speedKmh = 60) {
    const gear = this.model.rollingGear(speedKmh / 3.6);
    const ratio = this.vehicle.transmission.gearRatios[gear - 1] * this.vehicle.transmission.finalDrive;
    const wheelRPM = (speedKmh / 3.6) / (2 * Math.PI * this.vehicle.config.wheelRadius) * 60;
    return { speedKmh, gear, rpm: rpmRound(wheelRPM * ratio) };
  }

  // A bounded physics search optimises 60-foot times for plausible RPMs and
  // release durations. It is performed once per exact installed build, never
  // inside the racing frame loop. This is a coached estimate, not a claim of
  // mathematically perfect vehicle control.
  launch() {
    const v = this.vehicle;
    const key = JSON.stringify({ car: v.config, engine: v.engine.config });
    if (launchCache.has(key)) return { ...launchCache.get(key) };
    const idle = v.engine.config.idleRPM;
    const ceiling = this.model.ceiling;
    const seed = clamp(v.config.launchRPM || ceiling * 0.58, idle + 600, ceiling * 0.88);
    const candidates = new Set([rpmRound(seed)]);
    for (let offset = -900; offset <= 900; offset += 225) {
      candidates.add(clamp(rpmRound(seed + offset), idle + 600, ceiling * 0.88));
    }
    let best = { rpm: rpmRound(seed), clutchSeconds: 0.36, score: Infinity };
    const dt = 1 / 60;
    for (const rpm of candidates) for (const clutchSeconds of [0.22, 0.36, 0.52]) {
      const test = new Vehicle(v.config, v.engine.config);
      test.transmission.currentGear = 1;
      test.engine.rpm = rpm;
      test.clutch.pedal = 1;
      let slipPenalty = 0;
      let score = Infinity;
      for (let i = 0; i < 360; i++) {
        const time = i * dt;
        const clutch = clamp(1 - time / clutchSeconds);
        const throttle = time < clutchSeconds
          ? clamp(0.46 + (rpm - test.engine.rpm) / 1800, 0.32, 1)
          : 1;
        const t = test.update(dt, { clutch, throttle, nos: false });
        if (t.slipRatio > 0.12) slipPenalty += (t.slipRatio - 0.12) * dt;
        if (t.positionM >= 18.288) {
          score = time + slipPenalty * 0.08;
          break;
        }
      }
      if (score < best.score) best = { rpm, clutchSeconds, score };
    }
    const result = {
      target: rpmRound(best.rpm),
      min: clamp(rpmRound(best.rpm - 200), idle + 500, ceiling),
      max: clamp(rpmRound(best.rpm + 200), idle + 500, ceiling),
      clutchSeconds: best.clutchSeconds,
    };
    if (launchCache.size >= 64) launchCache.delete(launchCache.keys().next().value);
    launchCache.set(key, result);
    return { ...result };
  }

  shiftAdvice(from, rpm, quality = 'CLEAN') {
    const band = this.shiftBands[from - 1];
    if (!band) return { verdict: 'NO TARGET', pose: 'neutral', band: null };
    if (String(quality).includes('ROUGH') || String(quality).includes('REJECT')) {
      return { verdict: 'CLUTCH AND THROTTLE FIRST. MAKE THE SHIFT CLEAN.', pose: 'concerned', band };
    }
    if (rpm < band.min) return { verdict: 'A LITTLE EARLY. HOLD THE REVS LONGER.', pose: 'explaining', band };
    if (rpm > band.max) return { verdict: 'A LITTLE LATE. SHIFT SOONER.', pose: 'concerned', band };
    return { verdict: 'GOOD SHIFT. RIGHT IN THE POWERBAND.', pose: 'happy', band };
  }
}
