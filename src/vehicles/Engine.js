export default class Engine {
  constructor(config) {
    this.config = config;
    this.rpm = config.idleRPM;
  }

  baseTorqueAt(rpm) {
    const curve = this.config.torqueCurve;
    if (rpm <= curve[0][0]) return curve[0][1];
    for (let i = 0; i < curve.length - 1; i++) {
      const [r0, t0] = curve[i];
      const [r1, t1] = curve[i + 1];
      if (rpm <= r1) {
        const a = (rpm - r0) / (r1 - r0);
        return Phaser.Math.Linear(t0, t1, a);
      }
    }
    return curve[curve.length - 1][1];
  }

  combustionTorque(throttle, boostBar, nosTorque = 0) {
    const limiterCut = this.rpm >= this.config.limiterRPM ? 0 : 1;
    const idleAssist = this.rpm < this.config.idleRPM + 80 ? Math.max(0, 0.2 - throttle) * 0.5 : 0;
    const effectiveThrottle = Phaser.Math.Clamp(throttle + idleAssist, 0, 1);
    const base = this.baseTorqueAt(this.rpm) * effectiveThrottle;
    const boosted = base * (1 + Math.max(0, boostBar) * 0.58);
    return (boosted + nosTorque) * limiterCut;
  }

  updateRPM(dt, netTorqueNm) {
    // Nm / kg*m² => rad/s², then convert to RPM/s.
    const radPerSec2 = netTorqueNm / Math.max(0.05, this.config.inertia);
    const rpmPerSec = radPerSec2 * 60 / (Math.PI * 2);
    this.rpm += rpmPerSec * dt;

    // Internal pumping/friction losses and a gentle idle floor for prototype playability.
    const friction = 130 + this.rpm * 0.018;
    this.rpm -= friction * dt;
    if (this.rpm < this.config.idleRPM) {
      this.rpm += (this.config.idleRPM - this.rpm) * Math.min(1, dt * 7);
    }
    this.rpm = Phaser.Math.Clamp(this.rpm, 500, this.config.limiterRPM + 250);
  }
}
