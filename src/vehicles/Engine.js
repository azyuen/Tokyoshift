const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const linear=(a,b,t)=>a+(b-a)*t;
export default class Engine {
  constructor(config) {
    this.config = config;
    this.rpm = config.idleRPM;
  }

  baseTorqueAt(rpm) {
    const curve = this.config.torqueCurve;
    if (rpm <= curve[0][0]) return curve[0][1];
    let lo=0,hi=curve.length-1;
    if(rpm>=curve[hi][0])return curve[hi][1];
    while(hi-lo>1){const mid=(lo+hi)>>1;if(curve[mid][0]<rpm)lo=mid;else hi=mid;}
    const [r0,t0]=curve[lo],[r1,t1]=curve[hi];
    return linear(t0,t1,(rpm-r0)/(r1-r0));
  }

  combustionTorque(throttle, boostBar, nosTorque = 0) {
    const limiterCut = this.rpm >= this.config.limiterRPM ? 0 : 1;
    const idleAssist = this.rpm < this.config.idleRPM + 80 ? Math.max(0, 0.2 - throttle) * 0.5 : 0;
    const effectiveThrottle = clamp(throttle + idleAssist, 0, 1);
    const base = this.baseTorqueAt(this.rpm) * effectiveThrottle;

    const referenceBoost = this.config.referenceBoostBar ?? 0;
    const positiveBoost = Math.max(0, boostBar);
    let boostScale = 1;

    if (referenceBoost > 0) {
      if (positiveBoost <= referenceBoost) {
        const spoolFraction = clamp(positiveBoost / referenceBoost, 0, 1);
        const offBoost = this.config.offBoostTorqueFraction ?? 0.55;
        boostScale = linear(offBoost, 1, spoolFraction);
      } else {
        // Above the factory reference boost, scale by absolute pressure ratio.
        // At stock boost this remains exactly 1.0, so factory cars are unchanged.
        boostScale = (1 + positiveBoost) / (1 + referenceBoost);
      }
    } else if (positiveBoost > 0) {
      // Naturally aspirated engines can now respond to an aftermarket turbo.
      // A small efficiency discount keeps bolt-on boost believable and leaves
      // intercooler/ECU/engine upgrades meaningful.
      boostScale = 1 + positiveBoost * 0.78;
    }

    let combustion;
    if(this.config.engineering&&positiveBoost>referenceBoost){
      const h=this.config.engineering,requested=Math.max(0,base*(boostScale-1))*h.thermalEfficiency;
      const available=Math.min(h.torqueHeadroom,h.powerHeadroom*30000/(Math.PI*Math.max(500,this.rpm)));
      combustion = base+available*Math.tanh(requested/Math.max(1,available));
    } else {
      combustion = base * boostScale;
    }
    const refinement = this.config.specialistRefinement;
    if (refinement) {
      // Only the extra regional gain consumes the remaining hardware capacity.
      // Do not change an existing standard build that already exceeds a
      // provisional capacity estimate. NOS remains a separate temporary input.
      const capacity = Math.min(refinement.torqueCapacity,
        refinement.powerCapacity * 30000 / (Math.PI * Math.max(500, this.rpm)));
      const reserve = Math.max(0, capacity - combustion);
      if (reserve > 0) combustion += reserve * Math.tanh(combustion * refinement.demand / reserve);
    }
    return (combustion + nosTorque) * limiterCut;
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
    this.rpm = clamp(this.rpm, 500, this.config.limiterRPM + 250);
  }
}

export function measureEngineOutput(car,config){
 const e=new Engine(config);let powerKW=0,torqueNm=0,peakRPM=0;
 for(let rpm=config.idleRPM;rpm<=config.redlineRPM;rpm+=25){e.rpm=rpm;const t=e.combustionTorque(1,car.maximumBoost||0),p=t*rpm*Math.PI/30000;if(p>powerKW){powerKW=p;peakRPM=rpm;}torqueNm=Math.max(torqueNm,t);}
 return {powerKW,torqueNm,peakRPM};
}
export function refreshEngineOutput(car,engine){const output=measureEngineOutput(car,engine);car.powerKW=Math.round(output.powerKW);car.torqueNm=Math.round(output.torqueNm);car.engineIdleRPM=engine.idleRPM;car.engineRedlineRPM=engine.redlineRPM;car.engineLimiterRPM=engine.limiterRPM;return output;}
