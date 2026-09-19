export default class Transmission {
  constructor(config) {
    this.gearRatios = config.gearRatios;
    this.finalDrive = config.finalDriveRatio;
    this.efficiency = config.drivetrainEfficiency;
    this.currentGear = 1;
    this.pendingGear = null;
    this.shiftTimer = 0;
    this.lastShiftQuality = 'READY';
    this.shiftEvent = null;
  }

  get ratio() {
    if (this.currentGear <= 0) return 0;
    return this.gearRatios[this.currentGear - 1] * this.finalDrive;
  }

  requestGear(gear, clutchPedal, throttle) {
    if (gear < 1 || gear > this.gearRatios.length || this.shiftTimer > 0 || gear === this.currentGear) return false;

    if (clutchPedal < 0.58) {
      this.lastShiftQuality = 'REJECTED — CLUTCH';
      this.shiftEvent = { type: 'rejected', severity: 1 - clutchPedal };
      return false;
    }

    const qualityPenalty = Phaser.Math.Clamp((0.90 - clutchPedal) * 1.7 + Math.max(0, throttle - 0.22) * 0.75, 0, 1);
    this.pendingGear = gear;
    this.shiftTimer = 0.095 + qualityPenalty * 0.11;
    this.lastShiftQuality = qualityPenalty < 0.22 ? 'CLEAN' : qualityPenalty < 0.55 ? 'ROUGH' : 'SLOW/ROUGH';
    this.shiftEvent = { type: 'accepted', severity: qualityPenalty };
    this.currentGear = 0;
    return true;
  }

  update(dt) {
    this.shiftEvent = null;
    if (this.shiftTimer <= 0) return;
    this.shiftTimer -= dt;
    if (this.shiftTimer <= 0 && this.pendingGear) {
      this.currentGear = this.pendingGear;
      this.pendingGear = null;
    }
  }
}
