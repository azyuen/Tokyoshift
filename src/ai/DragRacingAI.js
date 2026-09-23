export default class DragRacingAI {
  constructor(vehicle, skill = {}, options = {}) {
    this.vehicle = vehicle;
    this.reactionSkill = skill.reactionSkill ?? 0.78;
    this.launchSkill = skill.launchSkill ?? 0.72;
    this.shiftSkill = skill.shiftSkill ?? 0.76;
    this.aggression = skill.aggression ?? 0.72;
    this.rollingStart = Boolean(options.rollingStart);

    this.reactionDelay = Phaser.Math.Linear(0.40, 0.14, this.reactionSkill)
      + Phaser.Math.FloatBetween(-0.025, 0.035);

    const baseLaunchRPM = vehicle.config.launchRPM ?? 4400;
    this.launchTargetRPM = baseLaunchRPM
      * Phaser.Math.Linear(0.94, 1.01, this.launchSkill)
      + Phaser.Math.Between(-70, 70);

    this.goTime = null;
    this.shiftState = 'none';
    this.shiftTimer = 0;
    this.releaseDuration = 0.1;
    this.nextGear = null;
  }

  update(dt, raceClock, greenClock) {
    const v = this.vehicle;
    const t = v.telemetry;
    let throttle = 0;
    let clutch = 1;
    let nos = false;

    if (greenClock == null) {
      throttle = t.rpm < this.launchTargetRPM ? 0.80 : 0.40;
      return { throttle, clutch, nos };
    }

    if (this.goTime == null) this.goTime = greenClock + this.reactionDelay;
    if (raceClock < this.goTime) {
      if (this.rollingStart) {
        return { throttle: 0.36, clutch: 0, nos: false };
      }

      throttle = t.rpm < this.launchTargetRPM ? 0.82 : 0.42;
      return { throttle, clutch, nos };
    }

    if (this.shiftState === 'lift') {
      throttle = 0.06;
      clutch = 1;
      this.shiftTimer -= dt;
      if (this.shiftTimer <= 0) {
        v.requestGear(this.nextGear);
        this.shiftState = 'wait';
      }
      return { throttle, clutch, nos };
    }

    if (this.shiftState === 'wait') {
      throttle = 0.16;
      clutch = 1;
      if (v.transmission.currentGear === this.nextGear) {
        this.shiftState = 'release';
        this.releaseDuration = Phaser.Math.Linear(0.13, 0.065, this.shiftSkill)
          + Phaser.Math.FloatBetween(0, 0.012);
        this.shiftTimer = this.releaseDuration;
      }
      return { throttle, clutch, nos };
    }

    if (this.shiftState === 'release') {
      this.shiftTimer -= dt;
      const progress = Phaser.Math.Clamp(1 - this.shiftTimer / this.releaseDuration, 0, 1);
      clutch = 1 - progress;
      throttle = Phaser.Math.Linear(0.22, 1.0, progress);
      if (this.shiftTimer <= 0) this.shiftState = 'none';
      return { throttle, clutch, nos };
    }

    throttle = 1;
    const launchElapsed = raceClock - this.goTime;

    nos = launchElapsed > (this.rollingStart ? 0.50 : 0.82)
      && t.gear >= 1
      && t.rpm > 3200
      && v.nitrous.fraction > 0.05;

    if (!this.rollingStart && launchElapsed < 0.9) {
      const releaseDuration = Phaser.Math.Linear(0.62, 0.34, this.launchSkill);
      clutch = Phaser.Math.Clamp(1 - launchElapsed / releaseDuration, 0, 1);

      if (t.wheelspin && t.slipRatio > 0.18) {
        const correction = Phaser.Math.Clamp((t.slipRatio - 0.18) * 0.9, 0, 0.24)
          * Phaser.Math.Linear(0.55, 1.0, this.launchSkill);
        clutch = Phaser.Math.Clamp(clutch + correction, 0, 1);
        throttle = Phaser.Math.Clamp(1 - correction * 0.9, 0.72, 1);
      }

      if (this.launchSkill < 0.78 && launchElapsed > 0.18 && launchElapsed < 0.31) {
        clutch = Phaser.Math.Clamp(clutch + Phaser.Math.Linear(0.04, 0, this.launchSkill), 0, 1);
      }
    } else {
      clutch = 0;
    }

    const redline = v.config.engineRedlineRPM ?? 7800;
    const skillPenalty = Phaser.Math.Linear(0.975, 1.0, this.shiftSkill);
    const shiftJitter = Phaser.Math.Linear(140, 40, this.shiftSkill);
    const shiftRPM = redline
      * Phaser.Math.Linear(0.94, 0.992, this.aggression)
      * skillPenalty
      + Phaser.Math.Between(-shiftJitter, shiftJitter);

    if (t.rpm >= shiftRPM && t.gear > 0 && t.gear < v.config.gearRatios.length) {
      this.nextGear = t.gear + 1;
      this.shiftState = 'lift';
      this.shiftTimer = Phaser.Math.Linear(0.085, 0.035, this.shiftSkill);
    }

    return { throttle, clutch, nos };
  }
}
