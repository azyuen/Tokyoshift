// Central balance knobs for Batch 1 progression/gameplay.
// Keep numerical tuning here so playtesting does not require scene rewrites.

export const PROGRESSION_BALANCE = {
  performance: {
    // Reference values only normalise the index; matchmaking uses ratios.
    referencePowerToWeight: 120,
    referenceTorqueToWeight: 155,
    referenceLaunchTraction: 0.62,
    referenceOverallRatio: 14.0,
    standingWeight: 0.58,
    rollingWeight: 0.42,
    nosStandingUse: 0.42,
    nosRollingUse: 0.58,
  },

  meetMatchmaking: {
    offerCount: 3,
    performanceBands: {
      comparable: { weight: 0.60, minRatio: 0.86, maxRatio: 1.17, targetRatio: 1.00 },
      weaker: { weight: 0.20, minRatio: 0.66, maxRatio: 0.86, targetRatio: 0.78 },
      stronger: { weight: 0.15, minRatio: 1.17, maxRatio: 1.42, targetRatio: 1.27 },
      wildcard: { weight: 0.05, minRatio: 0.48, maxRatio: 1.85, targetRatio: 1.48 },
    },
    wildcardStrongBias: 0.72,
    preferredRegionalModelWeight: 2.35,
    unownedCarWeight: 1.20,
    sameModelWeight: 0.58,
    candidateBuildRatings: [1, 2, 3, 4, 5],
    fallbackRatioFloor: 0.45,
    fallbackRatioCeiling: 1.95,

    // Driver skill is deliberately independent from vehicle/build performance.
    driverRatings: [
      { rating: 2, weight: 0.38 },
      { rating: 3, weight: 0.34 },
      { rating: 4, weight: 0.20 },
      { rating: 5, weight: 0.08 },
    ],
  },

  rivalBuilds: {
    developmentPoints: {
      1: 0,
      2: 5,
      3: 11,
      4: 18,
      5: 27,
    },
    archetypeWeights: {
      balancedStreet: 1.00,
      naHighRev: 0.85,
      launchDrag: 0.82,
      turboRoll: 0.82,
      lightweight: 0.72,
    },
  },
};

export const RIVAL_BUILD_ARCHETYPES = {
  balancedStreet: {
    id: 'balancedStreet',
    label: 'BALANCED STREET',
    priority: [
      'engine.intake', 'engine.ecu', 'drivetrain.clutch', 'chassis.tyres',
      'exhaust.muffler', 'drivetrain.gearbox', 'engine.engine', 'drivetrain.differential',
      'drivetrain.suspension', 'exhaust.headers', 'exhaust.exhaust', 'chassis.weightReduction',
      'engine.turbo', 'engine.intercooler',
    ],
  },
  naHighRev: {
    id: 'naHighRev',
    label: 'NA / HIGH-REV',
    priority: [
      'engine.intake', 'engine.ecu', 'exhaust.headers', 'exhaust.exhaust',
      'engine.engine', 'chassis.weightReduction', 'drivetrain.gearbox', 'chassis.tyres',
      'drivetrain.clutch', 'drivetrain.differential', 'drivetrain.suspension', 'exhaust.muffler',
    ],
    forbidden: ['engine.turbo', 'engine.intercooler'],
  },
  launchDrag: {
    id: 'launchDrag',
    label: 'LAUNCH / DRAG',
    priority: [
      'chassis.tyres', 'drivetrain.differential', 'drivetrain.suspension', 'drivetrain.clutch',
      'engine.ecu', 'engine.engine', 'drivetrain.gearbox', 'engine.intake',
      'exhaust.exhaust', 'engine.intercooler', 'engine.turbo', 'chassis.weightReduction',
      'exhaust.headers', 'exhaust.muffler',
    ],
  },
  turboRoll: {
    id: 'turboRoll',
    label: 'TURBO / ROLL',
    priority: [
      'engine.turbo', 'engine.ecu', 'engine.intercooler', 'engine.engine',
      'exhaust.exhaust', 'engine.intake', 'drivetrain.gearbox', 'exhaust.headers',
      'drivetrain.clutch', 'chassis.weightReduction', 'chassis.tyres', 'drivetrain.differential',
      'exhaust.muffler', 'drivetrain.suspension',
    ],
  },
  lightweight: {
    id: 'lightweight',
    label: 'LIGHTWEIGHT',
    priority: [
      'chassis.weightReduction', 'chassis.tyres', 'drivetrain.gearbox', 'engine.intake',
      'engine.ecu', 'engine.engine', 'drivetrain.clutch', 'drivetrain.differential',
      'drivetrain.suspension', 'exhaust.headers', 'exhaust.exhaust', 'exhaust.muffler',
    ],
    forbidden: ['engine.turbo'],
  },
};
