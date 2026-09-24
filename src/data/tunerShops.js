const sourceValue = (source, key, fallback = null) => {
  if (source && typeof source.get === 'function') {
    const value = source.get(key);
    return value == null ? fallback : value;
  }
  const value = source?.[key];
  return value == null ? fallback : value;
};

export const TUNER_SHOPS = {
  ODAIBA: {
    id: 'odaibaEsprit',
    enabled: true,
    regionId: 'ODAIBA',
    mapLabel: 'TUNER SHOP',
    label: 'ESPRIT',
    fullName: 'ESPRIT',
    specialty: 'AERO & WEIGHT',
    mechanicId: 'takumiSerizawa',
    heroCarId: 'espritNsx',

    // The stock NA1 is intentionally a separate donor id. The current car
    // catalogue does not yet contain a stock NSX asset, so the conversion
    // control remains disabled until nsxNa1 is added rather than substituting
    // an unrelated car. One donor model maps to one regional tuner only.
    donorCarId: 'nsxNa1',
    donorLabel: 'HONDA NSX NA1',
    buildCost: 22000000,

    unlockRegionWins: 5,

    backgroundKey: 'tunerShopOdaibaEspritBg',
    backgroundPath: 'assets/Locations/TunerShops/odaiba_esprit_workshop.png',

    decalId: 'esprit',
    decalLabel: 'ESPRIT',

    tuningOptions: [
      {
        id: 'espritDryCarbon',
        name: 'DRY CARBON REFINEMENT',
        shortName: 'DRY CARBON',
        cost: 48000,
        description: 'Replace selected already-lightened panels with ESPRIT dry-carbon pieces.',
        requirementLabel: 'REQUIRES WEIGHT REDUCTION LV 2',
        requirements: {
          chassis: { weightReduction: 2 },
        },
        effect: {
          massDelta: -18,
        },
        benefit: '-18 KG',
      },
      {
        id: 'espritAeroBalance',
        name: 'AERO BALANCE SETUP',
        shortName: 'AERO BALANCE',
        cost: 62000,
        description: 'Refine ride height and aero balance around an upgraded suspension package.',
        requirementLabel: 'REQUIRES SUSPENSION LV 2',
        requirements: {
          drivetrain: { suspension: 2 },
        },
        effect: {
          dragScale: 0.97,
          gripScale: 1.015,
        },
        benefit: '-3% DRAG / +1.5% GRIP',
      },
      {
        id: 'espritTotalSetup',
        name: 'ESPRIT TOTAL SETUP',
        shortName: 'TOTAL SETUP',
        cost: 85000,
        description: 'Final corner-weight, alignment and aero refinement once both ESPRIT base tunes are installed.',
        requirementLabel: 'REQUIRES BOTH ESPRIT BASE TUNES',
        requirements: {
          specialist: ['espritDryCarbon', 'espritAeroBalance'],
        },
        effect: {
          massDelta: -5,
          dragScale: 0.99,
          gripScale: 1.01,
          launchScale: 1.01,
        },
        benefit: '-5 KG / BALANCE REFINEMENT',
      },
    ],
  },
};

export const TUNER_SHOP_ORDER = ['ODAIBA'];

export const TUNER_SHOP_BY_ID = Object.fromEntries(
  Object.values(TUNER_SHOPS).map(shop => [shop.id, shop])
);

export const TUNER_SHOP_BY_DONOR = Object.fromEntries(
  Object.values(TUNER_SHOPS)
    .filter(shop => shop.enabled && shop.donorCarId)
    .map(shop => [shop.donorCarId, shop])
);

export const TUNER_OPTION_BY_ID = Object.fromEntries(
  Object.values(TUNER_SHOPS).flatMap(shop =>
    (shop.tuningOptions || []).map(option => [
      option.id,
      { ...option, shopId: shop.id, regionId: shop.regionId },
    ])
  )
);

export function getTunerShopForRegion(regionId) {
  const shop = TUNER_SHOPS[String(regionId || '').toUpperCase()];
  return shop?.enabled ? shop : null;
}

export function getTunerShopById(shopId) {
  const shop = TUNER_SHOP_BY_ID[shopId];
  return shop?.enabled ? shop : null;
}

export function getTunerShopForDonorCar(carId) {
  return TUNER_SHOP_BY_DONOR[carId] || null;
}

export function isTunerDevProfile(source) {
  if (Boolean(sourceValue(source, 'devMode', false))) return true;

  const first = String(sourceValue(source, 'firstName', '')).trim().toLowerCase();
  const last = String(sourceValue(source, 'lastName', '')).trim().toLowerCase();
  const joined = (first + last).replace(/[^a-z0-9]/g, '');
  const cash = Number(sourceValue(source, 'cash', 0) || 0);

  return joined.includes('arkonden') || cash >= 900000000;
}

export function getRegionWinCount(source, regionId) {
  const regionWins = sourceValue(source, 'regionWins', {}) || {};
  return Math.max(0, Number(regionWins[String(regionId || '').toUpperCase()] || 0));
}

export function isTunerShopUnlocked(source, regionId) {
  const shop = getTunerShopForRegion(regionId);
  if (!shop) return false;
  if (isTunerDevProfile(source)) return true;
  return getRegionWinCount(source, shop.regionId) >= Number(shop.unlockRegionWins || 0);
}

export function getTunerShopUnlockLabel(source, regionId) {
  const shop = getTunerShopForRegion(regionId);
  if (!shop) return '';
  if (isTunerShopUnlocked(source, regionId)) return 'UNLOCKED';

  const wins = getRegionWinCount(source, regionId);
  const target = Math.max(0, Number(shop.unlockRegionWins || 0));
  return wins + ' / ' + target + ' REGION WINS';
}

export function getInstalledSpecialistTuning(carState = {}) {
  const raw = carState?.specialistTuning;

  if (Array.isArray(raw)) {
    return [...new Set(raw.map(String).filter(Boolean))];
  }

  if (raw && typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([, installed]) => Boolean(installed))
      .map(([id]) => id);
  }

  return [];
}

function readLevel(source, id) {
  return Math.max(0, Number(source?.[id] || 0));
}

export function areTunerOptionRequirementsMet(carState = {}, option = null) {
  if (!option) return false;

  const requirements = option.requirements || {};
  const installed = new Set(getInstalledSpecialistTuning(carState));

  for (const [id, level] of Object.entries(requirements.engine || {})) {
    const source = carState.engineTuning || carState.tuning || {};
    if (readLevel(source, id) < Number(level || 0)) return false;
  }

  for (const [id, level] of Object.entries(requirements.drivetrain || {})) {
    if (readLevel(carState.drivetrainTuning || {}, id) < Number(level || 0)) return false;
  }

  for (const [id, level] of Object.entries(requirements.chassis || {})) {
    if (readLevel(carState.chassisTuning || {}, id) < Number(level || 0)) return false;
  }

  for (const [id, level] of Object.entries(requirements.exhaustNos || {})) {
    if (readLevel(carState.exhaustNosTuning || {}, id) < Number(level || 0)) return false;
  }

  for (const requiredId of requirements.specialist || []) {
    if (!installed.has(requiredId)) return false;
  }

  return true;
}

export function getTunerOption(optionId) {
  return TUNER_OPTION_BY_ID[optionId] || null;
}

export function applySpecialistTuning(carConfig, engineConfig, carState = {}) {
  const car = carConfig;
  const engine = engineConfig;
  const installed = getInstalledSpecialistTuning(carState);

  installed.forEach(optionId => {
    const option = getTunerOption(optionId);
    const effect = option?.effect || {};
    if (!option) return;

    car.vehicleMassKg = Math.max(
      500,
      Number(car.vehicleMassKg || 1000) + Number(effect.massDelta || 0)
    );

    if (effect.dragScale != null) {
      car.dragCoefficient = Math.max(
        0.15,
        Number(car.dragCoefficient || 0.34) * Number(effect.dragScale || 1)
      );
    }

    if (effect.gripScale != null) {
      car.tyreGrip = Number(car.tyreGrip || 1) * Number(effect.gripScale || 1);
    }

    if (effect.launchScale != null) {
      car.launchLoadMultiplier =
        Number(car.launchLoadMultiplier || 1) * Number(effect.launchScale || 1);
    }

    if (effect.efficiencyAdd != null) {
      car.drivetrainEfficiency = Math.min(
        0.99,
        Number(car.drivetrainEfficiency || 0.85) + Number(effect.efficiencyAdd || 0)
      );
    }

    if (effect.outputScale != null) {
      const scale = Number(effect.outputScale || 1);
      car.powerKW = Math.round(Number(car.powerKW || 0) * scale);
      car.torqueNm = Math.round(Number(car.torqueNm || 0) * scale);
      engine.torqueCurve = (engine.torqueCurve || []).map(
        ([rpm, torque]) => [rpm, torque * scale]
      );
    }
  });

  return { car, engine, installed };
}
