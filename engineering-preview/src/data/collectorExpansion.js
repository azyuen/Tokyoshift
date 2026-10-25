// R525 collector configurations. These are fixed gameplay builds, not a
// rebalance of existing tuners. Race/tuner curves are gameplay approximations.
export function addCollectorExpansion(cars) {
  const add = (id, donor, spec) => {
    cars[id] = {
      ...cars[donor], ...spec, id,
      collector: true, tuningLocked: true, ginzaExclusive: spec.ginzaExclusive ?? true,
      nosPower: 0, nosCapacitySeconds: 0,
      visual: { ...cars[donor].visual },
    };
  };
  // Clean bodies retain their racing counterpart's fixed mechanical build.
  add('essoToyotaGtOne', 'renownMazda787B', {
    name: 'Toyota GT-One TS020 // Esso', shortName: 'ESSO GT-ONE',
    description: 'Twin-turbo V8 Le Mans collector in the uploaded Esso racing livery.',
    engine: 'r36v_gtone', engineModel: 'R36V 3.6L TWIN-TURBO V8',
    drivetrain: 'RWD', engineLayout: 'mid', powerKW: 447, torqueNm: 650,
    vehicleMassKg: 900, engineIdleRPM: 1200, engineRedlineRPM: 7200,
    engineLimiterRPM: 7400, engineInertia: 0.16,
    gearRatios: [2.90, 2.05, 1.55, 1.23, 1.02, 0.85], finalDriveRatio: 3.40,
    drivenAxleWeightFraction: 0.60, launchRPM: 5000,
    turboSize: 0.80, turboSpoolRate: 1.45, maximumBoost: 1.1,
    clutchStrength: 900, dragCoefficient: 0.33, frontalAreaM2: 1.75,
  });
  add('cleanToyotaGtOne', 'essoToyotaGtOne', {
    name: 'Toyota GT-One TS020 // Clean', shortName: 'GT-ONE CLEAN',
    description: 'The GT-One collector in clean bodywork without racing decals.',
  });
  add('calsonicR390', 'essoToyotaGtOne', {
    name: 'Nissan R390 GT1 // Calsonic', shortName: 'CALSONIC R390',
    description: 'A mid-engined twin-turbo V8 collector in Calsonic racing livery.',
    engine: 'vrh35l_r390', engineModel: 'VRH35L 3.5L TWIN-TURBO V8',
    powerKW: 478, torqueNm: 706, vehicleMassKg: 1000,
    engineRedlineRPM: 7200, engineLimiterRPM: 7400, engineInertia: 0.18,
    gearRatios: [2.85, 2.00, 1.52, 1.21, 1.00, 0.84], finalDriveRatio: 3.50,
    maximumBoost: 1.2, turboSpoolRate: 1.35, launchRPM: 4800,
    dragCoefficient: 0.35, frontalAreaM2: 1.80,
  });
  add('cleanR390', 'calsonicR390', {
    name: 'Nissan R390 GT1 // Clean', shortName: 'R390 CLEAN',
    description: 'The R390 GT1 collector in clean bodywork without racing decals.',
  });
  add('cleanMazda787B', 'renownMazda787B', {
    name: 'Mazda 787B // Clean', shortName: '787B CLEAN',
    description: 'The four-rotor collector build in clean orange bodywork without sponsor decals.',
    drivetrain: 'RWD', engineLayout: 'mid',
  });
  add('zeroSportsGc8', 'gc8', {
    name: 'ZERO/SPORTS Subaru Impreza GC8', shortName: 'ZERO/SPORTS GC8',
    // Now also obtainable by converting a stock GC8 at the Shinagawa tuner.
    ginzaExclusive: false,
    description: 'A fixed 294 kW game-spec ZERO/SPORTS collector build with a broad turbo powerband.',
    engine: 'ej20_zerosports', engineModel: 'EJ20 // ZERO/SPORTS',
    drivetrain: 'AWD', powerKW: 294, torqueNm: 480, vehicleMassKg: 1220,
    engineIdleRPM: 900, engineRedlineRPM: 7500, engineLimiterRPM: 7700,
    engineInertia: 0.19, turboSize: 0.72, turboSpoolRate: 1.5,
    maximumBoost: 1.25, clutchStrength: 660, tyreGrip: 1.12,
  });
  add('castrolMugenNsx', 'nsx', {
    name: 'Honda Castrol Mugen NSX GT500', shortName: 'CASTROL NSX',
    description: 'A naturally aspirated, mid-engined GT500 collector with close-ratio race gearing.',
    engine: 'c32b_gt500', engineModel: 'C32B V6 // GT500',
    drivetrain: 'RWD', engineLayout: 'mid', powerKW: 368, torqueNm: 400,
    vehicleMassKg: 1150, engineIdleRPM: 1200,
    engineRedlineRPM: 9500, engineLimiterRPM: 9700, engineInertia: 0.13,
    gearRatios: [2.92, 2.15, 1.68, 1.36, 1.14, 0.98], finalDriveRatio: 3.7,
    drivetrainEfficiency: 0.91, drivenAxleWeightFraction: 0.58,
    launchLoadMultiplier: 1.12, launchRPM: 6200, tyreGrip: 1.25,
    clutchStrength: 650, turboSize: 0, turboSpoolRate: 0, maximumBoost: 0,
    dragCoefficient: 0.36, frontalAreaM2: 1.85,
  });
  add('mcrae22B', 'gc8', {
    name: 'Subaru Impreza 22B STI // McRae-era', shortName: '22B McRAE',
    description: 'A 22B-spec collector wearing the uploaded McRae-era rally tribute livery.',
    engine: 'ej22g_collector', engineModel: 'EJ22G // 22B',
    drivetrain: 'AWD', powerKW: 206, torqueNm: 363, vehicleMassKg: 1270,
    engineIdleRPM: 850, engineRedlineRPM: 7000, engineLimiterRPM: 7200,
    engineInertia: 0.22, maximumBoost: 0.85, turboSize: 0.60,
    turboSpoolRate: 1.7,
  });
  add('tommiEvo6', 'evo6', {
    name: 'Mitsubishi Lancer Evolution VI // Tommi Mäkinen Rally', shortName: 'MÄKINEN EVO VI',
    description: 'The Mäkinen-era Group A rally collector, not the road-going Tommi Mäkinen Edition.',
    engine: '4g63_rally_evo6', engineModel: '4G63T // GROUP A RALLY',
    drivetrain: 'AWD', powerKW: 221, torqueNm: 510, vehicleMassKg: 1230,
    engineIdleRPM: 1100, engineRedlineRPM: 7000, engineLimiterRPM: 7200,
    engineInertia: 0.18, gearRatios: [2.85, 2.00, 1.50, 1.18, 0.96, 0.80],
    finalDriveRatio: 4.444, drivetrainEfficiency: 0.85,
    maximumBoost: 1.50, turboSize: 0.55, turboSpoolRate: 2.2,
    clutchStrength: 720, tyreGrip: 1.16, launchRPM: 4500,
  });
}
