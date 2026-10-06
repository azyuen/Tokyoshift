import { DrivingModel, clamp } from './DrivingModel.js?v=20261007-r399';

const lerp = (a, b, t) => a + (b - a) * t;

export default class DragRacingAI {
  constructor(vehicle, skill = {}, options = {}) {
    this.vehicle = vehicle;
    this.random = options.random || Math.random;
    for (const [key, fallback] of Object.entries({ reactionSkill: .78, launchSkill: .72, shiftSkill: .76, aggression: .72 })) {
      this[key] = clamp(Number.isFinite(skill[key]) ? skill[key] : fallback);
    }
    this.rating = clamp(Math.round(options.rating || 3), 1, 5);
    this.difficulty = options.playerDifficulty || 'STANDARD';
    this.rollingStart = Boolean(options.rollingStart);
    this.legacy = this.difficulty === 'EASY' || options.tutorial === true;
    this.smart = !this.legacy && this.rating >= 4;
    this.elite = this.rating === 5;
    this.precision = this.smart ? (this.elite ? 1 : this.difficulty === 'HARD' ? .88 : .72) : 0;
    this.model = new DrivingModel(vehicle);
    // Deliberate pedal/gear execution delay, never a vehicle penalty.
    this.executionHesitation = this.legacy ? 0 : [0, .22, .15, .025, 0, 0][this.rating];
    this.reactionDelay = this.executionHesitation + Math.max(.115, lerp(.40, .14, this.reactionSkill)
      + this.jitter(this.smart ? lerp(.018, .006, this.precision) : .03));
    const base = vehicle.config.launchRPM ?? 4400;
    this.launchTargetRPM = clamp(base * lerp(.94, 1.01, this.launchSkill)
      + this.jitter(this.smart ? 20 + (1 - this.launchSkill) * 140 : 70),
      vehicle.engine.config.idleRPM + 500, this.model.ceiling * .94);
    this.goTime = null;
    this.shiftState = 'none';
    this.shiftTimer = 0;
    this.nextGear = null;
    this.throttle = 0;
    this.launchClutch = 1;
    this.filteredSlip = 0;
    this.previousRPM = null;
    this.rpmRate = 0;
    this.targets = this.model.shiftPoints.map(ideal => {
      const old = vehicle.engine.config.redlineRPM * lerp(.94, .992, this.aggression)
        * lerp(.975, 1, this.shiftSkill);
      const blend = this.smart ? 1 : !this.legacy && this.rating === 3 ? .45 : 0;
      const error = this.smart ? lerp(170, 28, this.precision) + (1 - this.shiftSkill) * 350 : 150;
      return clamp(lerp(old, ideal, blend) + this.jitter(error), this.model.ceiling * .65, this.model.ceiling);
    });
    this.diagnostics = {
      rating: this.rating, tier: ['ROOKIE', 'ROOKIE', 'SKILLED', 'EXPERT', 'ELITE'][this.rating - 1],
      difficulty: this.difficulty, legacy: this.legacy,
      skills: Object.fromEntries(['reactionSkill', 'launchSkill', 'shiftSkill', 'aggression'].map(k => [k, this[k]])),
      targetLaunchRPM: this.launchTargetRPM, reactionDelay: this.reactionDelay,
      optimalShiftRPM: [...this.model.shiftPoints], targetShiftRPM: [...this.targets],
      shifts: [], launchSamples: [], nosEvents: [], splits: {},
    };
  }

  jitter(amount) { return (this.random() * 2 - 1) * amount; }

  chooseRollingStartGear(speedMps) {
    if (!this.smart) return null; // RaceScene retains its original fallback.
    const gear = this.model.rollingGear(speedMps);
    this.diagnostics.rollingGear = gear;
    return gear;
  }

  stage(dt, rpm) {
    if (!this.smart) return rpm < this.launchTargetRPM ? .80 : .40;
    const v = this.vehicle;
    const torque = Math.max(1, this.model.torque(rpm, v.turbo.boostBar));
    // Feed-forward covers Engine's drag/friction; proportional feedback corrects
    // error. Pedal response and small per-run target error retain personality.
    const loss = 9 + rpm * .0017 + (130 + rpm * .018) * v.engine.config.inertia * Math.PI * 2 / 60;
    const target = clamp(loss / torque + (this.launchTargetRPM - rpm) / lerp(1400, 650, this.launchSkill));
    this.throttle += (target - this.throttle) * Math.min(1, dt * lerp(12, 30, this.launchSkill));
    return this.throttle;
  }

  update(dt, raceClock, greenClock) {
    dt = Math.min(dt, 1 / 30);
    const v = this.vehicle, t = v.telemetry;
    if (this.previousRPM != null) this.rpmRate += ((t.rpm - this.previousRPM) / Math.max(.001, dt) - this.rpmRate) * Math.min(1, dt * 12);
    this.previousRPM = t.rpm;
    if (greenClock == null) return { throttle: this.stage(dt, t.rpm), clutch: 1, nos: false };
    if (this.goTime == null) {
      this.goTime = greenClock + this.reactionDelay;
      this.startPosition = v.positionM;
    }
    if (raceClock < this.goTime) return this.rollingStart
      ? { throttle: .36, clutch: 0, nos: false }
      : { throttle: this.stage(dt, t.rpm), clutch: 1, nos: false };
    if (this.diagnostics.actualLaunchRPM == null) this.diagnostics.actualLaunchRPM = t.rpm;
    const elapsed = raceClock - this.goTime;
    const result = this.drive(dt, elapsed, t);
    this.record(raceClock - greenClock, elapsed, t, result);
    return result;
  }

  drive(dt, elapsed, t) {
    const v = this.vehicle;
    if (this.shiftState === 'lift') {
      this.shiftTimer -= dt;
      // requestGear reads LAST frame's pedals. Wait until they really arrived.
      if (this.shiftTimer <= 0 && t.clutch >= .90 && t.throttle <= .22) {
        const accepted = v.requestGear(this.nextGear);
        if (accepted) {
          this.diagnostics.shifts.push({ time: elapsed, from: this.nextGear - 1, to: this.nextGear,
            rpm: this.shiftStartRPM, requestRPM: t.rpm, idealRPM: this.model.shiftPoints[this.nextGear - 2],
            targetRPM: this.targets[this.nextGear - 2], quality: v.transmission.lastShiftQuality });
          this.shiftState = 'wait';
        }
      }
      return { throttle: this.smart ? 0 : .06, clutch: 1, nos: false };
    }
    if (this.shiftState === 'wait') {
      if (v.transmission.currentGear === this.nextGear && v.transmission.shiftTimer <= 0) {
        this.shiftState = 'release';
        this.releaseDuration = this.smart
          ? lerp(.10, .025, this.precision) + (1 - this.shiftSkill) * .08 + this.random() * .006
          : lerp(.13, .065, this.shiftSkill) + this.executionHesitation + this.random() * .012;
        this.shiftTimer = this.releaseDuration;
      } else if (v.transmission.shiftTimer <= 0 && v.transmission.pendingGear == null) {
        this.shiftState = 'lift'; // retry a rejected/interrupted request, never stick in N
        this.shiftTimer = dt;
      }
      return { throttle: this.smart ? 0 : .16, clutch: 1, nos: false };
    }
    if (this.shiftState === 'release') {
      this.shiftTimer -= dt;
      const progress = clamp(1 - this.shiftTimer / this.releaseDuration);
      if (this.shiftTimer <= 0) this.shiftState = 'none';
      this.throttle = lerp(.22, 1, progress);
      return { throttle: this.throttle, clutch: 1 - progress, nos: false };
    }
    let throttle = 1, clutch = 0;
    if (this.smart) {
      ({ throttle, clutch } = this.controlTraction(dt, elapsed, t));
    } else if (!this.rollingStart && elapsed < .9) {
      clutch = clamp(1 - elapsed / lerp(.62, .34, this.launchSkill));
      if (t.wheelspin && t.slipRatio > .18) {
        const correction = clamp((t.slipRatio - .18) * .9, 0, .24) * lerp(.55, 1, this.launchSkill);
        clutch = clamp(clutch + correction);
        throttle = clamp(1 - correction * .9, .72, 1);
      }
    }
    let target = this.targets[t.gear - 1] ?? this.model.ceiling;
    if (this.legacy) {
      target = v.engine.config.redlineRPM * lerp(.94, .992, this.aggression)
        * lerp(.975, 1, this.shiftSkill) + this.jitter(lerp(140, 40, this.shiftSkill));
    }
    // Don't mistake stationary clutch flare/wheelspin for usable road speed.
    const roadRPM = t.speedMps / (2 * Math.PI * v.config.wheelRadius) * 60 * v.transmission.ratio;
    const ready = !this.smart || roadRPM > target * .87 || (elapsed > 1 && t.rpm >= v.engine.config.limiterRPM - 80);
    if (t.gear > 0 && t.gear < v.transmission.gearRatios.length && t.rpm + (this.smart ? Math.max(0, this.rpmRate) * dt : 0) >= target && ready) {
      this.nextGear = t.gear + 1;
      this.shiftStartRPM = t.rpm;
      this.shiftState = 'lift';
      this.shiftTimer = this.smart ? lerp(.065, .018, this.precision) + (1 - this.shiftSkill) * .04 : lerp(.085, .035, this.shiftSkill) + this.executionHesitation;
      return { throttle: this.smart ? 0 : .06, clutch: 1, nos: false };
    }
    const nos = this.smart
      ? throttle > .88 && clutch < .12 && Math.abs(t.clutchSlipRPM) < v.engine.config.redlineRPM * .10 && t.gear > 0
        && v.transmission.shiftTimer <= 0 && t.rpm > Math.max(2600, v.engine.config.redlineRPM * .38)
        && t.slipRatio < .065 && v.nitrous.remaining > .001 && v.nitrous.powerHp > 0
        && (t.gear === v.transmission.gearRatios.length || target - t.rpm > Math.max(220, Math.max(0, this.rpmRate) * .16))
      : elapsed > (this.rollingStart ? .50 : .82) && t.gear >= 1 && t.rpm > 3200 && v.nitrous.fraction > .05;
    return { throttle, clutch, nos };
  }

  controlTraction(dt, elapsed, t) {
    const v = this.vehicle;
    const response = lerp(10, 30, this.precision) * lerp(.65, 1, this.launchSkill);
    this.filteredSlip += (t.slipRatio - this.filteredSlip) * Math.min(1, dt * response);
    const slipTarget = lerp(.075, .025, this.precision) + (1 - this.launchSkill) * .035
      + (this.aggression - .85) * .02;
    const correction = clamp((this.filteredSlip - slipTarget) * 2.5, 0, .65);
    const ratio = v.transmission.ratio;
    if (!(ratio > 0)) return { throttle: 0, clutch: 1 };
    const availableTorque = this.model.tractionForce() * v.config.wheelRadius / (ratio * v.transmission.efficiency);
    const margin = lerp(.93, .99, this.precision) * (1 - correction);
    const capacityPedal = 1 - Math.pow(clamp(availableTorque * margin / v.clutch.maxTorqueNm), 1 / 1.35);
    const launching = !this.rollingStart && elapsed < 2.5 && t.gear === 1
      && t.speedKmh < 65 && t.clutchSlipRPM > 200;
    let clutch = 0;
    if (launching) {
      // Release toward the usable torque capacity; reopen slightly when slip
      // rises. Low-grip/high-power builds naturally need more pedal travel.
      const desired = Math.max(capacityPedal, clamp(1 - elapsed / lerp(.28, .16, this.launchSkill)));
      this.launchClutch += (desired - this.launchClutch) * Math.min(1, dt * response);
      clutch = this.launchClutch;
    }
    const fullTorque = Math.max(1, this.model.torque(t.rpm, t.boostBar, t.nosActive));
    const sync = t.clutchSlipRPM * .085 * (1 - clutch);
    let desiredThrottle = clamp((availableTorque * margin - sync) / fullTorque, .08, 1);
    if (launching) {
      // Clutch meters road torque; throttle keeps the engine in its launch band.
      desiredThrottle = clamp(.22 + (this.launchTargetRPM - t.rpm) / 1100, .08, 1);
      desiredThrottle *= 1 - correction * .45;
    }
    this.throttle += (desiredThrottle - this.throttle) * Math.min(1, dt * response);
    return { throttle: clamp(this.throttle), clutch };
  }

  record(time, elapsed, t, controls) {
    const d = this.diagnostics;
    if (elapsed < 2 && d.launchSamples.length < 40 && elapsed >= d.launchSamples.length * .05) {
      d.launchSamples.push({ time: elapsed, rpm: t.rpm, slip: t.slipRatio, throttle: controls.throttle, clutch: controls.clutch });
    }
    if (controls.nos !== Boolean(this.lastNos) && d.nosEvents.length < 80) {
      d.nosEvents.push({ time, active: controls.nos, gear: t.gear, rpm: t.rpm, remaining: this.vehicle.nitrous.remaining });
    }
    this.lastNos = controls.nos;
    const distance = t.positionM - this.startPosition;
    if (d.movementReaction == null && (distance > .20 || t.speedMps > .60)) d.movementReaction = time;
    for (const [key, metres] of [['sixtyFoot', 18.288], ['quarterMile', 402.336], ['halfMile', 804.672]]) {
      if (d.splits[key] == null && distance >= metres) d.splits[key] = { fromGreen: time,
        et: time - (this.rollingStart ? 0 : d.movementReaction || 0) };
    }
  }
}
