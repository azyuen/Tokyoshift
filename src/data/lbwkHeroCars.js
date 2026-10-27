import { LBWK_CONVERSIONS } from './lbwkConversions.js';
import {
  LBWK_CATALOG, LBWK_FULL_WORKS_STATE, LBWK_HERO_BOOST,
  LBWK_NOS_SHOTS, LBWK_NOS_HP,
} from './lbwkFullWorks.js';
import { HERO_WHEEL_DIAMETERS } from './heroCarAssets.js';
import { engines } from './engines.js?v=20261026-r687';
import { applyEngineTuning } from './tuning.js?v=20261026-r687';
import { applySecondaryTuning } from './secondaryTuning.js?v=20261026-r687';
import { refreshEngineOutput } from '../vehicles/Engine.js?v=20261026-r687';

function calibrateSealedEngine(car, engine, requestedKW) {
  // Full Level 3 hardware is an ordinary player-accessible build; Aruken's
  // additional calibration is then applied to a separate, sealed engine.
  // No donor curves, stage-3 purchased state, or other collectors are changed.
  delete car.engineering;
  delete engine.engineering;
  delete engine.specialistRefinement;
  engine.referenceBoostBar = Number(car.maximumBoost || 0);
  refreshEngineOutput(car, engine);
  const scale = Math.max(1, requestedKW / Math.max(1, car.powerKW));
  engine.torqueCurve = engine.torqueCurve.map(([rpm, torque]) =>
    [rpm, Math.round(torque * scale * 100) / 100]);
  refreshEngineOutput(car, engine);
  return { car, engine };
}

export function registerLbwkHeroCars(cars) {
  for (const g of LBWK_CATALOG) {
    const donor = cars[g.donor];
    const original = donor && engines[donor.engine];
    if (!donor || !original) throw Error('Missing LBWK donor/engine: '+g.donor);

    const stage1 = applyEngineTuning(donor, original, LBWK_FULL_WORKS_STATE);
    const stage2 = applySecondaryTuning(stage1.car, stage1.engine, LBWK_FULL_WORKS_STATE);
    const benchmarkKW = Number(stage2.car.powerKW);
    const targetKW = Math.ceil(benchmarkKW * LBWK_HERO_BOOST);
    const engineId = 'lbwk_'+g.donor+'_fullworks';
    const car = { ...stage2.car, id:g.id, name:g.name, shortName:g.name,
      description:'Maximum Level 3 parts and NOS, finished with Aruken Denzaki bespoke LBWK calibration.',
      engine:engineId, engineModel:donor.engineModel+' // LBWK FULL WORKS',
      vehicleMassKg:Math.max(650, Math.round(stage2.car.vehicleMassKg*0.95)),
      tyreGrip:Number(stage2.car.tyreGrip || 1)*1.075,
      launchLoadMultiplier:Number(stage2.car.launchLoadMultiplier || 1)*1.035,
      clutchStrength:Math.max(Number(stage2.car.clutchStrength || 1), Number(stage2.car.torqueNm || 1)*1.8),
      collector:true, tuningLocked:true, ginzaExclusive:false, lbwkFullWorks:true,
      nosPower:LBWK_NOS_HP, nosShots:LBWK_NOS_SHOTS,
      nosShotDurationSeconds:1, nosCapacitySeconds:LBWK_NOS_SHOTS,
    };
    const engine = { ...stage2.engine, id:engineId, name:g.name+' // Denzaki full works',
      torqueCurve:(stage2.engine.torqueCurve||[]).map(p=>[...p]) };
    calibrateSealedEngine(car, engine, targetKW);
    // Calibration changes engine output, not the installed nitrous hardware.
    car.nosPower=LBWK_NOS_HP;
    car.nosShots=LBWK_NOS_SHOTS;
    car.nosShotDurationSeconds=1;
    car.nosCapacitySeconds=LBWK_NOS_SHOTS;

    const artwork = LBWK_CONVERSIONS.find(item=>item.id === g.id);
    if (artwork) {
      const diameter=HERO_WHEEL_DIAMETERS[artwork.wheel];
      car.visual={
        ...donor.visual,assetStem:artwork.stem+'_hero',
        bodyPath:'assets/Cars/hero/'+artwork.stem+'_hero_body.png',
        singleBody:true,referenceStandard:true,
        referenceGeometry:{rearX:artwork.rearX,frontX:artwork.frontX},
        referenceCanvasWidth:1300,referenceCanvasHeight:440,
        referenceWheelDiameter:diameter,referenceRearWheelDiameter:diameter,
        referenceFrontWheelDiameter:diameter,
        referenceRearWheelSize:artwork.wheel,referenceFrontWheelSize:artwork.wheel,
        bodyScale:0.32,canvasDisplayScale:1,
        renderOffsetY:0,bodyRenderOffsetX:0,bodyRenderOffsetY:0,
        modularAssetRoot:null,paintPath:null,overlayPath:null,
        singleLayerModular:false,deriveModularFromPreview:false,
        layeredMasterGeometry:null,stockBodyKit:false,stockSpoiler:false,
        wheelFitMode:'reference-standard',levelWheelContact:false,
        rearOffsetX:artwork.rearX,frontOffsetX:artwork.frontX,
        rearWheelOffsetX:artwork.rearX,frontWheelOffsetX:artwork.frontX,
        wheelOffsetY:-diameter/2,rearWheelOffsetY:-diameter/2,frontWheelOffsetY:-diameter/2,
        rearWheelWellRadius:diameter/2,frontWheelWellRadius:diameter/2,
        rearWheelBackingRadius:diameter/2,frontWheelBackingRadius:diameter/2,
        exhaustOffsetX:-1265,exhaustOffsetY:-diameter/2,
      };
    } else {
      // Career player's conventional LBWK 240Z: white/red #52 body asset.
      // This MUST NOT inherit the black/gold #16 Story Mode body from Aruken.
      car.visual={
        ...cars.arkonLibertyWalk240z.visual,
        assetStem:'liberty_walk_240z_hero',
        bodyPath:'assets/Cars/hero/liberty_walk_240z_hero_body.png',
      };
    }
    engines[engineId]=engine;
    cars[g.id]=car;
  }

  // Aruken's fictional, completely rebuilt RB26 monster is NOT the career
  // player's 240Z conversion. Story Mode's existing gameplay car remains
  // the separate arkonLibertyWalk240z ID with its own saved story upgrades.
  const engineId='arkon_ginza_rb26_240z';
  const rb26 = engines.rb26dett;
  const donor = cars.r32;
  const body = cars.arkonLibertyWalk240z;
  if (!rb26 || !donor || !body) throw Error('Aruken 240Z requires RB26 donor and Story Mode body');
  const originalEngine = {
    ...rb26,id:engineId,name:'Denzaki RB26DETT // one-off works',
    torqueCurve:(rb26.torqueCurve||[]).map(p=>[...p]),
    engineering:undefined,specialistRefinement:undefined,
    referenceBoostBar:1.75,
    redlineRPM:8500,limiterRPM:8700,
  };
  const aruken = {
    ...donor, id:'arkonGinza240z',
    name:'Liberty Walk 240Z No. 16 // Denzaki One-Off',
    shortName:'LBWK 240Z #16',
    description:'Aruken Denzaki\'s ultra-rare RB26-swapped and stripped one-off. Sold through Ginza Motor Gallery.',
    engine:engineId,engineModel:'RB26DETT 2.6L Twin Turbo // Denzaki',
    drivetrain:'RWD',drivenAxleWeightFraction:0.63,
    vehicleMassKg:975,maximumBoost:1.75,
    turboSize:0.68,turboSpoolRate:2.3,
    engineRedlineRPM:8500,engineLimiterRPM:8700,
    tyreGrip:1.86,launchLoadMultiplier:1.58,
    clutchStrength:1700,drivetrainEfficiency:0.92,
    collector:true,tuningLocked:true,ginzaExclusive:true,arkonOneOff:true,
    nosPower:75,nosShots:3,nosShotDurationSeconds:1,nosCapacitySeconds:3,
    // Deliberate match with Aruken's Story Mode body (#16):
    // black and gold, echoing Sayaka's RWB/Ginza identity.
    visual:{
      ...body.visual,
      assetStem:'liberty_walk_aruken240z_hero',
      bodyPath:'assets/Cars/hero/liberty_walk_aruken240z_hero_body.png',
    },
  };
  calibrateSealedEngine(aruken,originalEngine,675);
  aruken.nosPower=75;aruken.nosShots=3;aruken.nosShotDurationSeconds=1;aruken.nosCapacitySeconds=3;
  engines[engineId]=originalEngine;
  cars.arkonGinza240z=aruken;
}
