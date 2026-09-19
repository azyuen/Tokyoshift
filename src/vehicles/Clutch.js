export default class Clutch {
  constructor(config) {
    this.maxTorqueNm = config.clutchStrength;
    this.pedal = 1; // 1 = fully depressed, 0 = fully engaged
    this.slipping = false;
    this.slipRPM = 0;
    this.transmittedTorqueNm = 0;
  }

  solve(engineTorqueNm, engineRPM, drivelineRPM) {
    const engagement = Phaser.Math.Clamp(1 - this.pedal, 0, 1);
    const capacity = this.maxTorqueNm * Math.pow(engagement, 1.35);
    const rpmDelta = engineRPM - drivelineRPM;

    // Engine torque plus a synchronising term attempts to bring both shafts together.
    const synchronisingTorque = rpmDelta * 0.085 * engagement;
    const desiredTorque = engineTorqueNm + synchronisingTorque;
    const transmitted = Phaser.Math.Clamp(desiredTorque, -capacity, capacity);

    this.slipRPM = rpmDelta;
    this.slipping = engagement > 0.02 && (Math.abs(desiredTorque) > capacity + 2 || Math.abs(rpmDelta) > 180);
    this.transmittedTorqueNm = transmitted;

    return { transmittedTorqueNm: transmitted, capacityNm: capacity, slipping: this.slipping, rpmDelta };
  }
}
