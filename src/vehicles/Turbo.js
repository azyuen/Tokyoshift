export default class Turbo {
  constructor(config) {
    this.size = config.turboSize;
    this.spoolRate = config.turboSpoolRate;
    this.maxBoostBar = config.maximumBoost;
    this.boostOnsetRPM = Number(config.boostOnsetRPM || 1800);
    this.boostRampRPM = Math.max(1200, Number(config.boostRampRPM || 4300));
    this.spool = 0;
    this.boostBar = 0;
  }

  update(dt, rpm, throttle, engineLoad, nosActive = false, shifting = false) {
    const rpmFactor = Phaser.Math.Clamp(
      (rpm - this.boostOnsetRPM) / this.boostRampRPM,
      0,
      1
    );
    const loadFactor = Phaser.Math.Clamp(engineLoad, 0.15, 1.15);
    const sizePenalty = Phaser.Math.Linear(1.35, 0.62, Phaser.Math.Clamp(this.size, 0, 1));
    let target = Math.pow(rpmFactor, 1.18) * Math.pow(throttle, 0.88) * loadFactor;
    if (nosActive) target = Math.min(1, target + 0.10);
    if (shifting || throttle < 0.08) target *= 0.20;

    const rise = this.spoolRate * sizePenalty * (0.35 + rpmFactor * 1.15);
    const fall = 2.6 + this.size * 1.0;
    const rate = target > this.spool ? rise : fall;
    this.spool += (target - this.spool) * Math.min(1, dt * rate);
    this.spool = Phaser.Math.Clamp(this.spool, 0, 1);
    this.boostBar = this.maxBoostBar * this.spool;
  }
}
