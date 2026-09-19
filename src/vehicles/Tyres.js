export default class Tyres {
  constructor(config) {
    this.grip = config.tyreGrip;
    this.wheelRadius = config.wheelRadius;
    this.drivenAxleWeightFraction = config.drivenAxleWeightFraction ?? 0.54;
    this.spinVelocityMps = 0;
    this.slipRatio = 0;
    this.wheelRPM = 0;
    this.wheelspin = false;
  }

  update(dt, vehicleSpeedMps, demandedForceN, massKg) {
    const g = 9.81;
    // Weight transfer under launch is approximated by a small static bonus for RWD prototypes.
    const drivenNormalN = massKg * g * this.drivenAxleWeightFraction * 1.16;
    const peakForce = drivenNormalN * this.grip;
    const absDemand = Math.abs(demandedForceN);
    const direction = Math.sign(demandedForceN || 1);

    let roadForceN = demandedForceN;
    if (absDemand > peakForce) {
      const excess = absDemand - peakForce;
      this.spinVelocityMps += direction * (excess / Math.max(90, massKg * 0.11)) * dt;
      const postPeak = peakForce * Phaser.Math.Clamp(0.92 - Math.abs(this.spinVelocityMps) * 0.030, 0.50, 0.92);
      roadForceN = direction * postPeak;
    } else {
      const recovery = Math.min(1, dt * (5.2 + (1 - absDemand / Math.max(1, peakForce)) * 4.0));
      this.spinVelocityMps *= 1 - recovery;
      if (Math.abs(this.spinVelocityMps) < 0.03) this.spinVelocityMps = 0;
    }

    const wheelSurfaceSpeed = Math.max(0, vehicleSpeedMps + this.spinVelocityMps);
    this.wheelRPM = wheelSurfaceSpeed / (Math.PI * 2 * this.wheelRadius) * 60;
    this.slipRatio = Math.abs(this.spinVelocityMps) / Math.max(2.0, Math.abs(vehicleSpeedMps));
    this.wheelspin = this.slipRatio > 0.09 && absDemand > peakForce * 0.75;

    return { roadForceN, peakForceN: peakForce, wheelRPM: this.wheelRPM, wheelspin: this.wheelspin, slipRatio: this.slipRatio };
  }
}
