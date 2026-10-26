import { LBWK_CONVERSIONS } from './lbwkConversions.js';
import { HERO_WHEEL_DIAMETERS } from './heroCarAssets.js';
import { TUNING_POTENTIAL } from './tuningPotential.js';
import { engines } from './engines.js';

// Sealed hero engines: unique curves so stock cars and existing builds remain
// completely unchanged. Power and torque targets exceed the level-3 catalogue
// ceiling; race-time comparisons against stacked regional tuners need testing.
export function registerLbwkHeroCars(cars) {
  for (const g of LBWK_CONVERSIONS) {
    const donor=cars[g.donor];
    const original=donor && engines[donor.engine];
    if (!donor || !original) throw Error('Missing LBWK donor/engine: '+g.donor);
    const ceiling=TUNING_POTENTIAL[g.donor];
    if (!ceiling) throw Error('Missing tuning ceiling: '+g.donor);
    const kw=Math.ceil(ceiling.maximumPowerKW*1.12);
    const nm=Math.ceil(ceiling.maximumTorqueNm*1.12);
    const engineId='lbwk_'+g.donor;
    const points=original.torqueCurve;
    const basePeakKW=Math.max(...points.map(([rpm,t])=>rpm*t*Math.PI/30000));
    const basePeakNm=Math.max(...points.map(([,t])=>t));
    const powerFactor=kw/Math.max(1,basePeakKW);
    const torqueFactor=nm/Math.max(1,basePeakNm);
    const peakTorqueRPM=points.reduce((a,b)=>a[1]>=b[1]?a:b)[0];
    const peakPowerRPM=points.reduce((a,b)=>a[0]*a[1]>=b[0]*b[1]?a:b)[0];
    engines[engineId]={
      ...original,id:engineId,name:g.name+' // full works',
      engineering:undefined,
      referenceBoostBar:donor.maximumBoost||0,
      torqueCurve:points.map(([rpm,t])=>{
        const f=Math.max(0,Math.min(1,(rpm-peakTorqueRPM)/Math.max(1,peakPowerRPM-peakTorqueRPM)));
        const blend=f*f*(3-2*f);
        return [rpm,Math.round(Math.min(nm,t*(torqueFactor*(1-blend)+powerFactor*blend))*100)/100];
      }),
    };
    const diameter=HERO_WHEEL_DIAMETERS[g.wheel];
    cars[g.id]={
      ...donor,id:g.id,name:g.name,shortName:g.name,
      description:'Liberty Walk full-works collector conversion of the '+donor.name+'.',
      engine:engineId,engineModel:donor.engineModel+' // LBWK FULL WORKS',
      powerKW:kw,torqueNm:nm,
      vehicleMassKg:Math.round(donor.vehicleMassKg*0.96),
      tyreGrip:Math.max(1.4,(donor.tyreGrip||1)*1.22),
      clutchStrength:Math.max(donor.clutchStrength||0,nm*1.6),
      launchLoadMultiplier:(donor.launchLoadMultiplier||1)*1.06,
      collector:true,tuningLocked:true,ginzaExclusive:false,
      nosPower:0,nosCapacitySeconds:0,
      visual:{
        ...donor.visual,assetStem:g.stem+'_hero',
        bodyPath:'assets/Cars/hero/'+g.stem+'_hero_body.png',
        singleBody:true,referenceStandard:true,
        referenceGeometry:{rearX:g.rearX,frontX:g.frontX},
        referenceCanvasWidth:1300,referenceCanvasHeight:440,
        referenceWheelDiameter:diameter,referenceRearWheelDiameter:diameter,
        referenceFrontWheelDiameter:diameter,
        referenceRearWheelSize:g.wheel,referenceFrontWheelSize:g.wheel,
        bodyScale:0.32,canvasDisplayScale:1,
        renderOffsetY:0,bodyRenderOffsetX:0,bodyRenderOffsetY:0,
        modularAssetRoot:null,paintPath:null,overlayPath:null,
        singleLayerModular:false,deriveModularFromPreview:false,
        layeredMasterGeometry:null,stockBodyKit:false,stockSpoiler:false,
        wheelFitMode:'reference-standard',levelWheelContact:false,
        rearOffsetX:g.rearX,frontOffsetX:g.frontX,
        rearWheelOffsetX:g.rearX,frontWheelOffsetX:g.frontX,
        wheelOffsetY:-diameter/2,rearWheelOffsetY:-diameter/2,frontWheelOffsetY:-diameter/2,
        rearWheelWellRadius:diameter/2,frontWheelWellRadius:diameter/2,
        rearWheelBackingRadius:diameter/2,frontWheelBackingRadius:diameter/2,
        exhaustOffsetX:-1265,exhaustOffsetY:-diameter/2,
      },
    };
  }
}
