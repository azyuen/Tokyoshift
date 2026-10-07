export default class NitrousSystem {
  constructor(config = {}) {
    this.powerHp = Number(config.nosPower || 0);
    this.shotDuration = Math.max(0.2, Number(config.nosShotDurationSeconds || 1.0));

    const explicitShots = Number(config.nosShots);
    const legacyHasNitrous =
      this.powerHp > 0 && Number(config.nosCapacitySeconds || 0) > 0;
    this.totalShots = Math.max(
      0,
      Math.min(
        3,
        Number.isFinite(explicitShots)
          ? Math.round(explicitShots)
          : legacyHasNitrous
            ? 1
            : 0
      )
    );

    this.shotsRemaining = this.totalShots;
    this.active = false;
    this.activeRemaining = 0;
    this.activeElapsed = 0;
    this.lastRequested = false;
  }

  update(dt, requested, engineRunning, rpm) {
    dt = Math.min(Math.max(0, Number(dt) || 0), 1 / 30);
    const pressed = Boolean(requested);
    const trigger = pressed && !this.lastRequested;
    this.lastRequested = pressed;

    if (this.active) {
      this.activeElapsed += dt;
      this.activeRemaining = Math.max(0, this.activeRemaining - dt);
      if (this.activeRemaining <= 0.001) {
        this.active = false;
        this.activeRemaining = 0;
      }
      return this.active;
    }

    const ready =
      trigger &&
      engineRunning &&
      rpm > 1800 &&
      this.powerHp > 0 &&
      this.shotsRemaining > 0;

    if (ready) {
      this.shotsRemaining -= 1;
      this.active = true;
      this.activeRemaining = this.shotDuration;
      this.activeElapsed = 0;
    }

    return this.active;
  }

  get powerFraction() {
    if (!this.active || this.shotDuration <= 0) return 0;

    const rampIn = Math.min(0.12, this.shotDuration * 0.25);
    const rampOut = Math.min(0.12, this.shotDuration * 0.25);
    const inScale = rampIn > 0 ? Math.min(1, this.activeElapsed / rampIn) : 1;
    const outScale = rampOut > 0 ? Math.min(1, this.activeRemaining / rampOut) : 1;
    return Math.max(0, Math.min(1, inScale, outScale));
  }

  torqueAtRPM(rpm) {
    if (!this.active || rpm <= 0) return 0;
    const watts = this.powerHp * this.powerFraction * 745.7;
    const radSec = rpm * Math.PI * 2 / 60;
    return Phaser.Math.Clamp(watts / Math.max(90, radSec), 0, 190);
  }

  get visibleShots() {
    return this.shotsRemaining + (this.active ? 1 : 0);
  }

  get shotFraction() {
    if (!this.active || this.shotDuration <= 0) return 0;
    return Math.max(0, Math.min(1, this.activeRemaining / this.shotDuration));
  }

  get fraction() {
    if (this.totalShots <= 0) return 0;
    const activeFraction = this.active ? this.shotFraction : 0;
    return Math.max(
      0,
      Math.min(1, (this.shotsRemaining + activeFraction) / this.totalShots)
    );
  }
}
