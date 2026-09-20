export default class DragRacingAI {
  constructor(vehicle, skill = {}) {
    this.vehicle = vehicle;
    this.reactionSkill = skill.reactionSkill ?? 0.78;
    this.launchSkill = skill.launchSkill ?? 0.72;
    this.shiftSkill = skill.shiftSkill ?? 0.76;
    this.aggression = skill.aggression ?? 0.72;
    this.reactionDelay = Phaser.Math.Linear(0.48, 0.16, this.reactionSkill) + Phaser.Math.FloatBetween(-0.035, 0.045);
    this.launchTargetRPM = Phaser.Math.Linear(3600, 4600, this.launchSkill) + Phaser.Math.Between(-120, 120);
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
      throttle = t.rpm < this.launchTargetRPM ? 0.78 : 0.38;
      return { throttle, clutch, nos };
    }

    if (this.goTime == null) this.goTime = greenClock + this.reactionDelay;
    if (raceClock < this.goTime) {
      throttle = t.rpm < this.launchTargetRPM ? 0.80 : 0.40;
      return { throttle, clutch, nos };
    }

    // Shift routine: lift -> clutch in -> select gear -> progressively re-engage.
    if (this.shiftState === 'lift') {
      throttle = 0.04;
      clutch = 1;
      this.shiftTimer -= dt;
      if (this.shiftTimer <= 0) {
        v.requestGear(this.nextGear);
        this.shiftState = 'wait';
      }
      return { throttle, clutch, nos };
    }

    if (this.shiftState === 'wait') {
      throttle = 0.15;
      clutch = 1;
      if (v.transmission.currentGear === this.nextGear) {
        this.shiftState = 'release';
        this.releaseDuration = Phaser.Math.Linear(0.16, 0.075, this.shiftSkill) + Phaser.Math.FloatBetween(0, 0.02);
        this.shiftTimer = this.releaseDuration;
      }
      return { throttle, clutch, nos };
    }

    if (this.shiftState === 'release') {
      this.shiftTimer -= dt;
      const progress = Phaser.Math.Clamp(1 - this.shiftTimer / this.releaseDuration, 0, 1);
      clutch = 1 - progress;
      throttle = Phaser.Math.Linear(0.18, 1.0, progress);
      if (this.shiftTimer <= 0) this.shiftState = 'none';
      return { throttle, clutch, nos };
    }

    throttle = 1;
    const launchElapsed = raceClock - this.goTime;

    // Rivals use their finite NOS once they are cleanly launched. This keeps
    // them competitive without giving them an artificial speed multiplier.
    nos = launchElapsed > 0.85 && t.gear >= 1 && t.rpm > 3200 && v.nitrous.fraction > 0.05;
    if (launchElapsed < 0.9) {
      const releaseDuration = Phaser.Math.Linear(0.78, 0.36, this.launchSkill);
      clutch = Phaser.Math.Clamp(1 - launchElapsed / releaseDuration, 0, 1);
      if (this.launchSkill < 0.8 && launchElapsed > 0.18 && launchElapsed < 0.35) {
        clutch = Phaser.Math.Clamp(clutch + Phaser.Math.Linear(0.08, 0, this.launchSkill), 0, 1);
      }
    } else {
      clutch = 0;
    }

    const shiftRPM = Phaser.Math.Linear(7350, 7900, this.aggression) + Phaser.Math.Between(-90, 90);
    if (t.rpm >= shiftRPM && t.gear > 0 && t.gear < v.config.gearRatios.length) {
      this.nextGear = t.gear + 1;
      this.shiftState = 'lift';
      this.shiftTimer = Phaser.Math.Linear(0.11, 0.045, this.shiftSkill);
    }

    return { throttle, clutch, nos };
  }
}
