const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const linear=(a,b,t)=>a+(b-a)*t;
export default class Clutch {
  constructor(config) {
    this.maxTorqueNm = config.clutchStrength;
    this.pedal = 1; // 1 = fully depressed, 0 = fully engaged
    this.slipping = false;
    this.slipRPM = 0;
    this.transmittedTorqueNm = 0;
  }

  solve(engineTorqueNm, engineRPM, drivelineRPM) {
    const engagement = clamp(1 - this.pedal, 0, 1);
    const capacity = this.maxTorqueNm * Math.pow(engagement, 1.35);
    const rpmDelta = engineRPM - drivelineRPM;

    // Engine torque plus a synchronising term attempts to bring both shafts together.
    const synchronisingTorque = rpmDelta * 0.085 * engagement;
    const desiredTorque = engineTorqueNm + synchronisingTorque;
    const transmitted = clamp(desiredTorque, -capacity, capacity);

    this.slipRPM = rpmDelta;
    this.slipping = engagement > 0.02 && (Math.abs(desiredTorque) > capacity + 2 || Math.abs(rpmDelta) > 180);
    this.transmittedTorqueNm = transmitted;

    return { transmittedTorqueNm: transmitted, capacityNm: capacity, slipping: this.slipping, rpmDelta };
  }
}
