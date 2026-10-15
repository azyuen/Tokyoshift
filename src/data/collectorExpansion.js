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
