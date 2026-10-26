import { DrivingModel, clamp } from './DrivingModel.js';

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
    // E005: Expert/Elite sample perceived wheelspin and RPM at human cadences.
    // The underlying vehicle and physics are NEVER modified by driver skill.
    this.tractionObservationInterval = this.smart ? (this.elite ? .09 : .12) : 0;
    this.tractionObservationClock = 0;
    this.perceivedSlip = 0;
    this.perceivedRPM = vehicle.engine.rpm;
    this.tractionEstimateBias = this.smart ? this.jitter(this.elite ? .025 : .045) : 0;
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
    this.nosCooldown = 0;
    this.targets = this.model.shiftPoints.map(ideal => {
      const old = vehicle.engine.config.redlineRPM * lerp(.94, .992, this.aggression)
        * lerp(.975, 1, this.shiftSkill);
      const blend = this.smart ? 1 : !this.legacy && this.rating === 3 ? .45 : 0;
      const error = this.smart ? (this.elite ? 90 : 160) + (1 - this.shiftSkill) * 330 : 150;
      return clamp(lerp(old, ideal, blend) + this.jitter(error), this.model.ceiling * .65, this.model.ceiling);
    });
    this.diagnostics = {
      rating: this.rating, tier: ['ROOKIE', 'ROOKIE', 'SKILLED', 'EXPERT', 'ELITE'][this.rating - 1],
      difficulty: this.difficulty, legacy: this.legacy,
      calibration: this.smart ? 'E005 HUMAN EXPERT/ELITE' : 'STANDARD',
      tractionObservationMs: Math.round(this.tractionObservationInterval * 1000),
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
    this.nosCooldown = Math.max(0, Number(this.nosCooldown || 0) - dt);
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
        // Even elite drivers need finite time to coordinate clutch and throttle.
        this.releaseDuration = this.smart
          ? (this.elite ? .105 : .145) + (1 - this.shiftSkill) * .085 + this.random() * .025
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
      this.shiftTimer = this.smart
        ? (this.elite ? .055 : .080) + (1 - this.shiftSkill) * .045 + this.random() * .024
        : lerp(.085, .035, this.shiftSkill) + this.executionHesitation;
      return { throttle: this.smart ? 0 : .06, clutch: 1, nos: false };
    }
    const nitrousReady =
      !v.nitrous.active &&
      v.nitrous.shotsRemaining > 0 &&
      v.nitrous.powerHp > 0 &&
      this.nosCooldown <= 0;
    const stableForNos = this.smart
      ? throttle > .88 &&
        clutch < .12 &&
        Math.abs(t.clutchSlipRPM) < v.engine.config.redlineRPM * .10 &&
        t.gear >= 2 &&
        v.transmission.shiftTimer <= 0 &&
        t.rpm > Math.max(2800, v.engine.config.redlineRPM * .40) &&
        t.slipRatio < .065 &&
        (
          t.gear === v.transmission.gearRatios.length ||
          target - t.rpm > Math.max(260, Math.max(0, this.rpmRate) * .18)
        )
      : elapsed > (this.rollingStart ? .75 : 1.05) &&
        t.gear >= 2 &&
        t.rpm > 3400 &&
        t.slipRatio < .12;
    const nos = Boolean(nitrousReady && stableForNos);
    if (nos) {
      // A discrete request pulse starts one committed shot. The cooldown spaces
      // multiple charges instead of letting AI chain all three continuously.
      this.nosCooldown = this.smart
        ? lerp(1.65, 1.35, this.precision)
        : 1.90;
    }
    return { throttle, clutch, nos };
  }

  controlTraction(dt, elapsed, t) {
    const v = this.vehicle;
    // Observation is imperfect and periodic (Elite ~11Hz; Expert ~8Hz).
    // No omniscient frame-by-frame wheelspin or RPM corrections.
    this.tractionObservationClock -= dt;
    if (this.tractionObservationClock <= 0) {
      this.perceivedSlip = clamp(t.slipRatio + this.jitter(this.elite ? .012 : .020), 0, 1);
      this.perceivedRPM = Math.max(
        v.engine.config.idleRPM,
        t.rpm + this.jitter(this.elite ? 65 : 110)
      );
      this.tractionObservationClock += this.tractionObservationInterval;
    }
    const response = this.elite ? 12 : 9;
    this.filteredSlip += (this.perceivedSlip - this.filteredSlip) * Math.min(1, dt * response);
    const slipTarget = (this.elite ? .052 : .072) + (1 - this.launchSkill) * .025;
    const correction = clamp((this.filteredSlip - slipTarget) * 2.05, 0, .65);
    const ratio = v.transmission.ratio;
    if (!(ratio > 0)) return { throttle: 0, clutch: 1 };
    // A driver's grip estimate isn't perfectly matched to the tyre model.
    const estimatedTraction = this.model.tractionForce() * (1 + this.tractionEstimateBias);
    const availableTorque = estimatedTraction * v.config.wheelRadius / (ratio * v.transmission.efficiency);
    const margin = (this.elite ? .967 : .939) * (1 - correction);
    const capacityPedal = 1 - Math.pow(clamp(availableTorque * margin / v.clutch.maxTorqueNm), 1 / 1.35);
    const launching = !this.rollingStart && elapsed < 4 && t.gear === 1
      && t.speedKmh < 65 && t.clutchSlipRPM > 200;
    let clutch = 0;
    if (launching) {
      const observedRPM = this.perceivedRPM;
      const losses = 9 + observedRPM * .0017
        + (130 + observedRPM * .018) * v.engine.config.inertia * Math.PI * 2 / 60;
      const sustainableTorque = this.model.torque(observedRPM, t.boostBar) - losses
        + (observedRPM - this.launchTargetRPM) * .03;
      const enginePedal = 1 - Math.pow(clamp(sustainableTorque / v.clutch.maxTorqueNm), 1 / 1.35);
      const desired = Math.max(capacityPedal, enginePedal, clamp(1 - elapsed / lerp(.32, .21, this.launchSkill)));
      this.launchClutch += (desired - this.launchClutch) * Math.min(1, dt * response);
      clutch = this.launchClutch;
    }
    const fullTorque = Math.max(1, this.model.torque(this.perceivedRPM, t.boostBar, t.nosActive));
    const sync = t.clutchSlipRPM * .085 * (1 - clutch);
    let desiredThrottle = clamp((availableTorque * margin - sync) / fullTorque, .08, 1);
    if (launching) {
      desiredThrottle = clamp(1 + (this.launchTargetRPM - this.perceivedRPM) / 1250, .08, 1);
      desiredThrottle *= 1 - correction * .42;
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
      d.nosEvents.push({ time, active: controls.nos, gear: t.gear, rpm: t.rpm, remaining: this.vehicle.nitrous.shotsRemaining });
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
