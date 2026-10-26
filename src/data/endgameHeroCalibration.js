// Engineering preview ONLY. Fictional Tokyo SHIFT endgame specifications.
// No hidden acceleration modifiers: cars use the normal Engine, Tyres, Clutch,
// Turbo and Transmission components. Production cars are not changed.
import { engines } from './engines.js';

const ENTRIES = Object.freeze({
  espritNsx:         { kw:625, nm:850, mass:1230, grip:1.66, load:1.48, axle:.65, clutch:1250, launch:6250, gears:[3.20,2.23,1.67,1.30,1.02,.83], final:3.75, spool:1.85 },
  topSecretSupra:    { kw:615, nm:990, mass:1380, grip:1.73, load:1.55, axle:.56, clutch:1350, launch:5750, gears:[3.42,2.29,1.68,1.30,1.04,.78], final:3.60, spool:1.78 },
  minesR34:         { kw:545, nm:885, mass:1410, grip:1.56, load:1.07, axle:1.00, clutch:1200, launch:6050, gears:[3.30,2.23,1.61,1.24,1.00,.79], final:3.92, spool:1.94 },
  reAmemiyaRx7:     { kw:495, nm:740, mass:1040, grip:1.72, load:1.48, axle:.60, clutch:1200, launch:6250, gears:[3.26,2.18,1.58,1.22,.96,.75], final:4.00, spool:2.10 },
  junHyperLemonEvo5:{ kw:510, nm:770, mass:1150, grip:1.50, load:1.06, axle:1.00, clutch:1220, launch:6200, gears:[3.00,2.07,1.52,1.18,.91], final:4.24, spool:1.98 },
  amuseS2000Gt1:    { kw:475, nm:575, mass:1080, grip:1.78, load:1.50, axle:.58, clutch:970, launch:6450, gears:[3.24,2.23,1.65,1.29,1.02,.78], final:3.98, spool:1.97 },
  zeroSportsGc8:    { kw:450, nm:720, mass:1070, grip:1.54, load:1.08, axle:1.00, clutch:1120, launch:6150, gears:[3.20,2.16,1.55,1.17,.88], final:4.23, spool:2.05 },
  spoonEk9:         { kw:350, nm:445, mass:900,  grip:1.96, load:1.14, axle:.70, clutch:800,  launch:7400, gears:[3.33,2.27,1.70,1.30,1.01,.78], final:4.10, boost:.92, turbo:.42, spool:2.40, offBoost:.64 },
  veilsideFortuneRx7:{kw:490, nm:750, mass:1210, grip:1.78, load:1.50, axle:.60, clutch:1180, launch:6400, gears:[3.38,2.29,1.69,1.31,1.01,.79], final:4.00, spool:2.10 },
  rwbStellaPorsche: { kw:440, nm:610, mass:1130, grip:1.65, load:1.48, axle:.70, clutch:950, launch:6200, gears:[3.28,2.24,1.65,1.28,.98,.77], final:3.66, boost:.88, turbo:.52, spool:2.15, offBoost:.60 },
  libertyWalkR35:   { kw:610, nm:940, mass:1540, grip:1.62, load:1.07, axle:1.00, clutch:1500, launch:5500, gears:[3.72,2.37,1.66,1.29,1.02,.78], final:3.52, spool:2.10 },
  castrolMugenNsx:  { kw:485, nm:515, mass:1050, grip:1.90, load:1.62, axle:.66, clutch:1000, launch:7750, gears:[3.33,2.28,1.71,1.34,1.07,.83], final:3.72 },
  mcrae22B:         { kw:465, nm:725, mass:1200, grip:1.60, load:1.08, axle:1.00, clutch:1250, launch:6200, gears:[3.18,2.13,1.56,1.19,.92,.73], final:4.26, boost:1.55, turbo:.57, spool:2.32, offBoost:.56 },
  tommiEvo6:        { kw:495, nm:790, mass:1200, grip:1.62, load:1.07, axle:1.00, clutch:1350, launch:6200, gears:[3.14,2.12,1.56,1.20,.91,.73], final:4.24, boost:1.67, turbo:.56, spool:2.30, offBoost:.56 },
  renownMazda787B:  { kw:535, nm:630, mass:830,  grip:1.62, load:1.48, axle:.65, clutch:1040, launch:7350, gears:[3.10,2.18,1.59,1.22,.87], final:3.63 },
  essoToyotaGtOne:  { kw:480, nm:690, mass:900,  grip:1.91, load:1.65, axle:.68, clutch:1250, launch:6600, gears:[3.47,2.37,1.70,1.29,.96,.74], final:3.49, spool:2.10 },
  calsonicR390:     { kw:510, nm:750, mass:1000, grip:1.92, load:1.65, axle:.68, clutch:1370, launch:6550, gears:[3.43,2.34,1.69,1.28,.95,.73], final:3.54, spool:2.10 },
  libertyWalk240z:  { kw:445, nm:690, mass:1020, grip:1.79, load:1.55, axle:.60, clutch:1050, launch:6200, gears:[3.36,2.28,1.64,1.25,.96,.76], final:3.93, boost:1.18, turbo:.58, spool:2.20, offBoost:.59 },
});
const variants = Object.freeze({
  cleanMazda787B:'renownMazda787B',
  cleanToyotaGtOne:'essoToyotaGtOne',
  cleanR390:'calsonicR390',
});

// Adjust the ACTUAL engine torque curves (not just the catalogue's kW/Nm
// labels), keeping the original character and a consistent peak-power band.
function tuneCurve(engine, kw, nm) {
  if (!engine || !Array.isArray(engine.torqueCurve)) throw Error('Missing hero engine torque curve');
  const original=engine.torqueCurve.map(([r,t])=>[Number(r),Number(t)]);
  const peakNm=Math.max(...original.map(p=>p[1]));
  const powerPoints=original.map(([r,t])=>[r,t*r*Math.PI/30000]);
  const [pRpm,peakKW]=powerPoints.reduce((a,b)=>a[1]>b[1]?a:b);
  const tRpm=original.reduce((a,b)=>a[1]>b[1]?a:b)[0];
  const tScale=nm/Math.max(1,peakNm),pScale=kw/Math.max(1,peakKW);
  const difference=Math.max(100,pRpm-tRpm);
  const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
  engine.torqueCurve=original.map(([rpm,torque])=>{
    const blend=smooth((rpm-tRpm)/difference);
    const request=torque*(tScale+(pScale-tScale)*blend);
    // Never allow an implausible pointwise peak above the advertised limits.
    const capPower=rpm>=pRpm?kw*30000/(Math.PI*Math.max(rpm,1)):Infinity;
    return [rpm,Math.max(1,Math.round(Math.min(nm,request,capPower)*100)/100)];
  });
}

export function applyEndgameHeroCalibration(cars) {
  // The story's original Aruken 240Z is deliberately untouched. Create a
  // separate sealed collector using exactly the same authored body artwork.
  if (!cars.libertyWalk240z) {
    const donor=cars.arkonLibertyWalk240z;
    const stock=cars['240z'];
    if (!donor||!stock) throw Error('Liberty Walk 240Z requires story artwork and stock donor');
    const original=engines[stock.engine];
    if (!original) throw Error('Liberty Walk 240Z donor engine missing');
    const newId='l28_liberty_walk';
    const rpmFactor=8200/original.redlineRPM;
    engines[newId]={
      ...original,id:newId,name:'Tokyo SHIFT L-series turbo endurance special',
      redlineRPM:8200,limiterRPM:8400,idleRPM:950,inertia:.17,
      referenceBoostBar:1.18,offBoostTorqueFraction:.59,
      engineering:undefined,
      torqueCurve:original.torqueCurve.map(([rpm,torque])=>[Math.round(rpm*rpmFactor),torque]),
    };
    cars.libertyWalk240z={
      ...donor,id:'libertyWalk240z',name:'Liberty Walk 240Z // Tokyo SHIFT',
      shortName:'LB 240Z',description:'Sealed endgame L-series turbo special with authentic Liberty Walk bodywork.',
      engine:newId,engineModel:'L-Series 2.8L Turbo // Tokyo SHIFT',
      collector:true,tuningLocked:true,ginzaExclusive:true,storyBodyConversion:false,
      nosPower:0,nosCapacitySeconds:0,
      visual:{...donor.visual},
    };
  }
  const changed=new Set();
  for (const [id,p] of Object.entries(ENTRIES)) {
    const car=cars[id];
    if (!car) throw Error('Missing hero '+id);
    if (changed.has(car.engine)) throw Error('Hero engine shared unexpectedly: '+car.engine);
    changed.add(car.engine);
    Object.assign(car,{
      powerKW:p.kw,torqueNm:p.nm,vehicleMassKg:p.mass,
      tyreGrip:p.grip,drivenAxleWeightFraction:p.axle,
      launchLoadMultiplier:p.load,clutchStrength:p.clutch,launchRPM:p.launch,
      gearRatios:[...p.gears],finalDriveRatio:p.final,
      engineInertia:engines[car.engine].inertia,
      collector:true,tuningLocked:true,nosPower:0,nosCapacitySeconds:0,
    });
    if(p.spool!==undefined)car.turboSpoolRate=p.spool;
    if(p.boost!==undefined)car.maximumBoost=p.boost;
    if(p.turbo!==undefined)car.turboSize=p.turbo;
    const engine=engines[car.engine];
    if(p.offBoost!==undefined)engine.offBoostTorqueFraction=p.offBoost;
    engine.referenceBoostBar=car.maximumBoost||0;
    tuneCurve(engine,p.kw,p.nm);
  }
  for(const [id,originalId] of Object.entries(variants)){
    if(!cars[id])throw Error('Missing hero alternate livery '+id);
    const original=cars[originalId];
    const previous=cars[id];
    // Preserve distinct visual artwork, identity and metadata.
    Object.assign(previous,{
      powerKW:original.powerKW,torqueNm:original.torqueNm,
      vehicleMassKg:original.vehicleMassKg,tyreGrip:original.tyreGrip,
      drivenAxleWeightFraction:original.drivenAxleWeightFraction,
      launchLoadMultiplier:original.launchLoadMultiplier,clutchStrength:original.clutchStrength,
      launchRPM:original.launchRPM,gearRatios:[...original.gearRatios],
      finalDriveRatio:original.finalDriveRatio,turboSpoolRate:original.turboSpoolRate,
      engineInertia:original.engineInertia,nosPower:0,nosCapacitySeconds:0,
    });
  }
  // Stable existing save IDs; update only display identity of two rally legends.
  Object.assign(cars.mcrae22B,{
    shortName:'McRAE WRC97',name:'McRae Subaru Impreza WRC97 // Tokyo SHIFT',
    description:'Fictional unrestricted competition-built two-door Impreza WRC with turbo anti-lag character.',
    engineModel:'EJ22 Turbo // Tokyo SHIFT WRC',
  });
  Object.assign(cars.tommiEvo6,{
    description:'Fictional unrestricted Group A Mitsubishi Evo VI, built for AWD launch and torque.',
    engineModel:'4G63T // Tokyo SHIFT Group A',
  });
}

export const ENDGAME_HERO_IDS=Object.freeze([
  ...Object.keys(ENTRIES), ...Object.keys(variants),
]);
