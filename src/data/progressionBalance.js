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

    // Matchmaking PI should follow the same things the live standing-start
    // physics care about: engine response and boost availability. These are
    // intentionally mild refinements, not hidden car buffs/nerfs.
    referenceEngineInertia: 0.18,
    engineInertiaExponent: 0.10,
    turboLaunchBase: 0.90,
    turboLaunchSpoolWeight: 0.08,
    turboLaunchOffBoostWeight: 0.06,

    // A gearbox upgrade shortens only the brief shift interruption; it must not
    // multiply the whole car's acceleration by 1 / shiftTimeScale.
    gearboxPerformanceWeight: 0.22,
  },

  meetMatchmaking: {
    offerCount: 3,

    // Rolling starts are deliberately less common than standing starts. They
    // are more power-band/gearing dependent, so they pay more when they appear.
    raceTypeChances: {
      meetRolling: 0.20,
      competitionRolling: 0.20,
      pinkSlipRolling: 0.12,
    },
    rollingCashStakeMultiplier: 1.30,
    competitionRollingPrizeBonusPerRound: 0.10,
    // Standing starts leave more room for launch/clutch execution to overcome
    // a modest vehicle mismatch. Roll races are much more power-deterministic,
    // so "comparable" is deliberately tighter on the strong side.
    performanceBands: {
      standing: {
        comparable: { weight: 0.60, minRatio: 0.86, maxRatio: 1.15, targetRatio: 1.00 },
        weaker: { weight: 0.20, minRatio: 0.66, maxRatio: 0.86, targetRatio: 0.78 },
        stronger: { weight: 0.15, minRatio: 1.15, maxRatio: 1.40, targetRatio: 1.25 },
        wildcard: { weight: 0.05, minRatio: 0.48, maxRatio: 1.82, targetRatio: 1.45 },
      },
      rolling: {
        comparable: { weight: 0.60, minRatio: 0.90, maxRatio: 1.08, targetRatio: 1.00 },
        weaker: { weight: 0.20, minRatio: 0.70, maxRatio: 0.90, targetRatio: 0.82 },
        stronger: { weight: 0.15, minRatio: 1.08, maxRatio: 1.30, targetRatio: 1.17 },
        wildcard: { weight: 0.05, minRatio: 0.52, maxRatio: 1.70, targetRatio: 1.34 },
      },
    },
    // Location difficulty affects how favourable the VEHICLE match is while
    // still matching only against the car/build the player brought.
    difficultyVehicleProfiles: {
      EASY: {
        bandWeights: { comparable: 0.60, weaker: 0.30, stronger: 0.08, wildcard: 0.02 },
        standingComparableTarget: 0.98,
        rollingComparableTarget: 0.98,
        normalBuildRatings: [1, 2],
        wildcardBuildRatings: [3],
      },
      MED: {
        bandWeights: { comparable: 0.55, weaker: 0.12, stronger: 0.27, wildcard: 0.06 },
        standingComparableTarget: 1.03,
        rollingComparableTarget: 1.03,
        normalBuildRatings: [1, 2, 3],
        wildcardBuildRatings: [4],
      },
      HARD: {
        bandWeights: { comparable: 0.50, weaker: 0.08, stronger: 0.34, wildcard: 0.08 },
        standingComparableTarget: 1.07,
        rollingComparableTarget: 1.05,
        normalBuildRatings: [2, 3, 4],
        wildcardBuildRatings: [5],
      },
      ELITE: {
        bandWeights: { comparable: 0.35, weaker: 0.03, stronger: 0.47, wildcard: 0.15 },
        standingComparableTarget: 1.11,
        rollingComparableTarget: 1.07,
        normalBuildRatings: [3, 4, 5],
        wildcardBuildRatings: [5],
      },
    },

    wildcardStrongBias: 0.72,
    preferredRegionalModelWeight: 2.35,
    unownedCarWeight: 1.20,
    sameModelWeight: 0.58,
    // Fallback only. Normal Meet generation takes its build pool from the
    // location difficulty profile above so easy districts retain a real ceiling.
    candidateBuildRatings: [1, 2, 3, 4, 5],
    fallbackRatioFloor: 0.45,
    fallbackRatioCeiling: 1.95,

    // Fallback only. Normal Meets use the location's authored ratingSlots from
    // encounterProfiles so driver culture/difficulty belongs to the location,
    // never to player progression or the matched car.
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
