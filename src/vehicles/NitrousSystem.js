export default class NitrousSystem {
  constructor(config) {
    this.powerHp = config.nosPower || 0;
    this.capacity = config.nosCapacitySeconds || 0;
    this.remaining = this.capacity;
    this.active = false;
  }

  update(dt, requested, engineRunning, rpm) {
    this.active = Boolean(requested && engineRunning && this.remaining > 0.001 && rpm > 1800 && this.powerHp > 0);
    if (this.active) this.remaining = Math.max(0, this.remaining - dt);
    return this.active;
  }

  torqueAtRPM(rpm) {
    if (!this.active || rpm <= 0) return 0;
    const watts = this.powerHp * 745.7;
    const radSec = rpm * Math.PI * 2 / 60;
    return Phaser.Math.Clamp(watts / Math.max(90, radSec), 0, 190);
  }

  get fraction() {
    return this.capacity > 0 ? this.remaining / this.capacity : 0;
  }
}
