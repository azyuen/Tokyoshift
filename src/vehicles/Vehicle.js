import Engine from './Engine.js';
import Transmission from './Transmission.js';
import Clutch from './Clutch.js';
import Turbo from './Turbo.js';
import Tyres from './Tyres.js';
import NitrousSystem from './NitrousSystem.js';

export default class Vehicle {
  constructor(carConfig, engineConfig) {
    this.config = carConfig;
    this.engine = new Engine(engineConfig);
    this.transmission = new Transmission(carConfig);
    this.clutch = new Clutch(carConfig);
    this.turbo = new Turbo(carConfig);
    this.tyres = new Tyres(carConfig);
    this.nitrous = new NitrousSystem(carConfig);

    this.positionM = 0;
    this.speedMps = 0;
    this.accelerationMps2 = 0;
    this.throttle = 0;
    this.lastRequestedGear = 1;
    this.shiftShock = 0;
    this.lastForces = { drive: 0, drag: 0, rolling: 0, net: 0 };
  }

  requestGear(gear) {
    const ok = this.transmission.requestGear(gear, this.clutch.pedal, this.throttle);
    if (!ok) {
      this.shiftShock = Math.max(this.shiftShock, 0.45);
    } else if (this.transmission.shiftEvent?.severity > 0.08) {
      this.shiftShock = Math.max(this.shiftShock, this.transmission.shiftEvent.severity * 0.20);
    }
    return ok;
  }

  update(dt, controls) {
    dt = Math.min(dt, 1 / 30);
    this.transmission.update(dt);

    this.throttle = Phaser.Math.Clamp(controls.throttle ?? 0, 0, 1);
    this.clutch.pedal = Phaser.Math.Clamp(controls.clutch ?? 1, 0, 1);

    const nosActive = this.nitrous.update(dt, controls.nos, this.engine.rpm > 500, this.engine.rpm);
    const shifting = this.transmission.currentGear === 0 || this.transmission.shiftTimer > 0;

    const currentRatio = this.transmission.ratio;
    const drivelineRPM = currentRatio > 0 ? this.tyres.wheelRPM * currentRatio : 0;
    const engagement = 1 - this.clutch.pedal;
    const roughLoad = currentRatio > 0 ? Phaser.Math.Clamp(engagement * (0.35 + this.throttle * 0.7), 0.15, 1.1) : 0.2;

    this.turbo.update(dt, this.engine.rpm, this.throttle, roughLoad, nosActive, shifting);
    const nosTorque = this.nitrous.torqueAtRPM(this.engine.rpm);
    const engineTorque = this.engine.combustionTorque(this.throttle, this.turbo.boostBar, nosTorque);

    let transmittedEngineTorque = 0;
    let clutchResult = { slipping: false, rpmDelta: 0, capacityNm: 0 };
    if (currentRatio > 0) {
      clutchResult = this.clutch.solve(engineTorque, this.engine.rpm, drivelineRPM);
      transmittedEngineTorque = clutchResult.transmittedTorqueNm;
    } else {
      this.clutch.slipping = false;
      this.clutch.slipRPM = 0;
      this.clutch.transmittedTorqueNm = 0;
    }

    const engineDragTorque = 9 + this.engine.rpm * 0.0017;
    const netEngineTorque = currentRatio > 0 ? engineTorque - transmittedEngineTorque - engineDragTorque : engineTorque - engineDragTorque;
    this.engine.updateRPM(dt, netEngineTorque);

    // When the clutch is nearly locked, pull engine speed toward the driveline speed.
    if (currentRatio > 0 && engagement > 0.78 && !clutchResult.slipping) {
      const lockStrength = (engagement - 0.78) / 0.22;
      this.engine.rpm = Phaser.Math.Linear(this.engine.rpm, Math.max(this.config.engineIdleRPM, drivelineRPM), Math.min(1, dt * 15 * lockStrength));
    }

    const wheelTorque = transmittedEngineTorque * currentRatio * this.transmission.efficiency;
    const demandedDriveForceN = currentRatio > 0 ? wheelTorque / this.config.wheelRadius : 0;
    const tyre = this.tyres.update(dt, this.speedMps, demandedDriveForceN, this.config.vehicleMassKg);

    const rho = 1.225;
    const dragN = 0.5 * rho * this.config.dragCoefficient * this.config.frontalAreaM2 * this.speedMps * this.speedMps;
    const rollingN = this.config.rollingResistance * this.config.vehicleMassKg * 9.81 * (this.speedMps > 0.1 ? 1 : 0);
    const shiftShockForce = this.shiftShock * this.config.vehicleMassKg * 1.0;
    this.shiftShock = Math.max(0, this.shiftShock - dt * 3.0);

    const netForceN = tyre.roadForceN - dragN - rollingN - shiftShockForce;
    this.accelerationMps2 = netForceN / this.config.vehicleMassKg;
    this.speedMps = Math.max(0, this.speedMps + this.accelerationMps2 * dt);
    this.positionM += this.speedMps * dt;

    this.lastForces = { drive: tyre.roadForceN, drag: dragN, rolling: rollingN, net: netForceN };
    return this.telemetry;
  }

  get telemetry() {
    return {
      positionM: this.positionM,
      speedMps: this.speedMps,
      speedKmh: this.speedMps * 3.6,
      accelerationMps2: this.accelerationMps2,
      rpm: this.engine.rpm,
      gear: this.transmission.currentGear,
      pendingGear: this.transmission.pendingGear,
      throttle: this.throttle,
      clutch: this.clutch.pedal,
      clutchSlipRPM: this.clutch.slipRPM,
      clutchSlipping: this.clutch.slipping,
      clutchTorqueNm: this.clutch.transmittedTorqueNm,
      boostBar: this.turbo.boostBar,
      turboSpool: this.turbo.spool,
      wheelRPM: this.tyres.wheelRPM,
      wheelspin: this.tyres.wheelspin,
      slipRatio: this.tyres.slipRatio,
      nosActive: this.nitrous.active,
      nosFraction: this.nitrous.fraction,
      shiftQuality: this.transmission.lastShiftQuality,
      forces: this.lastForces,
    };
  }
}
