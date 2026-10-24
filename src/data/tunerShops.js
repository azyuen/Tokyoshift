import { getRegionMechanicCharacterId } from './characters.js?v=20261006-r392';
import {
  getTunerTeamChallengeState,
  getTunerTeamChallengeLabel,
} from './tunerChallenges.js?v=20261011-r479';

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
    mechanicId: getRegionMechanicCharacterId('ODAIBA'),
    heroCarId: 'espritNsx',

    // Canonical stock NA1 shares the 'nsx' model ID across garage and market.
    donorCarId: 'nsx',
    donorLabel: 'HONDA NSX NA1',
    buildCost: 22000000,

    unlockRegionWins: 10,

    backgroundKey: 'tunerShopOdaibaEspritBg',
    backgroundPath: 'assets/Locations/TunerShops/odaiba_esprit_workshop.png',
    phaseBackgrounds: {
      day: { key: 'tunerShopOdaibaEspritBgDay', path: 'assets/Locations/TunerShops/odaiba_esprit_day.png' },
      night: { key: 'tunerShopOdaibaEspritBgNight', path: 'assets/Locations/TunerShops/odaiba_esprit_night.png' },
    },

    decalId: 'esprit',
    decalLabel: 'ESPRIT',
    decalTextureKey: 'tunerDecalEsprit',
    decalPath: 'assets/Decals/esprit.png',

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

  SHIBUYA: {
    id: 'shibuyaAmuse',
    enabled: true,
    regionId: 'SHIBUYA',
    mapLabel: 'TUNER SHOP',
    label: 'AMUSE',
    fullName: 'POWER HOUSE AMUSE',
    specialty: 'EXHAUST & FLOW',
    mechanicId: getRegionMechanicCharacterId('SHIBUYA'),
    heroCarId: 'amuseS2000Gt1',

    donorCarId: 's2000',
    donorLabel: 'HONDA S2000 AP1',
    buildCost: 9500000,

    unlockRegionWins: 10,

    backgroundKey: 'tunerShopShibuyaAmuseBg',
    backgroundPath: 'assets/Locations/TunerShops/shibuya_amuse_workshop.png',
    phaseBackgrounds: {
      day: { key: 'tunerShopShibuyaAmuseBgDay', path: 'assets/Locations/TunerShops/shibuya_amuse_day.png' },
      night: { key: 'tunerShopShibuyaAmuseBgNight', path: 'assets/Locations/TunerShops/shibuya_amuse_night.png' },
    },

    decalId: 'amuse',
    decalLabel: 'AMUSE',
    decalTextureKey: 'tunerDecalAmuse',
    decalPath: 'assets/Decals/amuse.png',

    tuningOptions: [
      {
        id: 'amuseTitaniumFlow',
        name: 'TITANIUM FLOW PACKAGE',
        shortName: 'TITANIUM FLOW',
        cost: 58000,
        description: 'Amuse-style exhaust refinement for less mass and stronger high-rpm flow.',
        requirementLabel: 'REQUIRES EXHAUST LV 2 + MUFFLER LV 2',
        requirements: {
          exhaustNos: { exhaust: 2, muffler: 2 },
        },
        effect: {
          outputScale: 1.02,
          massDelta: -4,
          redlineAdd: 75,
        },
        benefit: '+2% OUTPUT / -4 KG / +75 RPM',
      },
      {
        id: 'amuseHighRpmBreathing',
        name: 'HIGH-RPM BREATHING SETUP',
        shortName: 'HIGH-RPM BREATHING',
        cost: 76000,
        description: 'Refine intake and ECU calibration around a freer-flowing top end.',
        requirementLabel: 'REQUIRES INTAKE LV 2 + ECU LV 2',
        requirements: {
          engine: { intake: 2, ecu: 2 },
        },
        effect: {
          outputScale: 1.025,
          efficiencyAdd: 0.005,
          redlineAdd: 125,
        },
        benefit: '+2.5% OUTPUT / +125 RPM',
      },
      {
        id: 'amuseCompleteFlowSetup',
        name: 'AMUSE COMPLETE FLOW SETUP',
        shortName: 'COMPLETE FLOW SETUP',
        cost: 98000,
        description: 'Final dyno refinement after both Amuse breathing packages are installed.',
        requirementLabel: 'REQUIRES BOTH AMUSE BASE TUNES',
        requirements: {
          specialist: ['amuseTitaniumFlow', 'amuseHighRpmBreathing'],
        },
        effect: {
          outputScale: 1.015,
          massDelta: -3,
          redlineAdd: 75,
        },
        benefit: '+1.5% OUTPUT / -3 KG / +75 RPM',
      },
    ],
  },

  SHINJUKU: {
    id: 'shinjukuTopSecret',
    enabled: true,
    regionId: 'SHINJUKU',
    mapLabel: 'TUNER SHOP',
    label: 'TOP SECRET',
    fullName: 'TOP SECRET',
    specialty: 'TURBO & BOOST',

    mechanicId: getRegionMechanicCharacterId('SHINJUKU'),
    heroCarId: 'topSecretSupra',

    donorCarId: 'jza80',
    donorLabel: 'TOYOTA SUPRA A80',
    buildCost: 18000000,

    unlockRegionWins: 10,

    backgroundKey: 'tunerShopShinjukuTopSecretBg',
    backgroundPath: 'assets/Locations/TunerShops/shinjuku_top_secret_workshop.png',
    phaseBackgrounds: {
      day: { key: 'tunerShopShinjukuTopSecretBgDay', path: 'assets/Locations/TunerShops/shinjuku_topsecret_day.png' },
      night: { key: 'tunerShopShinjukuTopSecretBgNight', path: 'assets/Locations/TunerShops/shinjuku_topsecret_night.png' },
    },

    decalId: 'topSecret',
    decalLabel: 'TOP SECRET',
    decalTextureKey: 'tunerDecalTopSecret',
    decalPath: 'assets/Decals/top_secret.png',

    tuningOptions: [
      {
        id: 'topSecretBoostControl',
        name: 'BOOST CONTROL CALIBRATION',
        shortName: 'BOOST CONTROL',
        cost: 82000,
        description: 'Top Secret boost control and ECU calibration for stronger, cleaner boost delivery.',
        requirementLabel: 'REQUIRES TURBO LV 2 + ECU LV 2',
        requirements: {
          engine: { turbo: 2, ecu: 2 },
        },
        effect: {
          boostAdd: 0.08,
          spoolScale: 1.03,
          outputScale: 1.015,
        },
        benefit: '+0.08 BAR / FASTER SPOOL / +1.5% OUTPUT',
      },
      {
        id: 'topSecretChargeFlow',
        name: 'CHARGE FLOW PACKAGE',
        shortName: 'CHARGE FLOW',
        cost: 98000,
        description: 'Match the turbo system to upgraded charge cooling and intake flow.',
        requirementLabel: 'REQUIRES TURBO LV 3 + INTERCOOLER LV 2',
        requirements: {
          engine: { turbo: 3, intercooler: 2 },
        },
        effect: {
          boostAdd: 0.06,
          spoolScale: 1.025,
          outputScale: 1.02,
        },
        benefit: '+0.06 BAR / +2% OUTPUT',
      },
      {
        id: 'topSecretVmaxSetup',
        name: 'TOP SECRET V-MAX SETUP',
        shortName: 'V-MAX SETUP',
        cost: 125000,
        description: 'Final high-speed setup balancing power delivery and aero efficiency.',
        requirementLabel: 'REQUIRES BOTH TOP SECRET BASE TUNES',
        requirements: {
          specialist: ['topSecretBoostControl', 'topSecretChargeFlow'],
        },
        effect: {
          outputScale: 1.015,
          dragScale: 0.98,
          redlineAdd: 100,
        },
        benefit: '+1.5% OUTPUT / -2% DRAG / +100 RPM',
      },
    ],
  },

  YOKOHAMA: {
    id: 'yokohamaMines',
    enabled: true,
    regionId: 'YOKOHAMA',
    mapLabel: 'TUNER SHOP',
    label: "MINE'S",
    fullName: "MINE'S MOTOR SPORTS",
    specialty: 'ECU & RESPONSE',

    mechanicId: getRegionMechanicCharacterId('YOKOHAMA'),
    heroCarId: 'minesR34',

    donorCarId: 'r34',
    donorLabel: 'NISSAN SKYLINE GT-R R34',
    buildCost: 16000000,

    unlockRegionWins: 10,

    backgroundKey: 'tunerShopYokohamaMinesBg',
    backgroundPath: 'assets/Locations/TunerShops/yokohama_mines_workshop.png',
    phaseBackgrounds: {
      day: { key: 'tunerShopYokohamaMinesBgDay', path: 'assets/Locations/TunerShops/yokohama_mines_day.png' },
      night: { key: 'tunerShopYokohamaMinesBgNight', path: 'assets/Locations/TunerShops/yokohama_mines_night.png' },
    },

    decalId: 'mines',
    decalLabel: "MINE'S",
    decalTextureKey: 'tunerDecalMines',
    decalPath: 'assets/Decals/mines.png',

    tuningOptions: [
      {
        id: 'minesVxRom',
        name: 'VX-ROM CALIBRATION',
        shortName: 'VX-ROM CALIBRATION',
        cost: 68000,
        description: 'Fine ECU calibration focused on clean torque delivery and response.',
        requirementLabel: 'REQUIRES ECU LV 2',
        requirements: {
          engine: { ecu: 2 },
        },
        effect: {
          outputScale: 1.02,
          efficiencyAdd: 0.01,
          redlineAdd: 50,
        },
        benefit: '+2% OUTPUT / +1% EFF. / +50 RPM',
      },
      {
        id: 'minesResponsePackage',
        name: 'RESPONSE PACKAGE',
        shortName: 'RESPONSE PACKAGE',
        cost: 84000,
        description: 'Match intake flow and gearbox response for a sharper, more immediate car.',
        requirementLabel: 'REQUIRES INTAKE LV 2 + GEARBOX LV 2',
        requirements: {
          engine: { intake: 2 },
          drivetrain: { gearbox: 2 },
        },
        effect: {
          outputScale: 1.015,
          efficiencyAdd: 0.005,
          shiftScale: 0.96,
        },
        benefit: '+1.5% OUTPUT / 4% FASTER SHIFTS',
      },
      {
        id: 'minesCompleteResponse',
        name: "MINE'S COMPLETE RESPONSE",
        shortName: 'COMPLETE RESPONSE',
        cost: 110000,
        description: 'Final engine and drivetrain refinement once both Mine\'s response packages are installed.',
        requirementLabel: "REQUIRES BOTH MINE'S BASE TUNES",
        requirements: {
          specialist: ['minesVxRom', 'minesResponsePackage'],
        },
        effect: {
          outputScale: 1.01,
          efficiencyAdd: 0.005,
          shiftScale: 0.97,
          launchScale: 1.01,
        },
        benefit: '+1% OUTPUT / RESPONSE REFINEMENT',
      },
    ],
  },

  DAIKOKU: {
    id: 'daikokuReAmemiya',
    enabled: true,
    regionId: 'DAIKOKU',
    mapLabel: 'TUNER SHOP',
    label: 'RE AMEMIYA',
    fullName: 'RE AMEMIYA',
    specialty: 'COOLING & FLOW',

    mechanicId: getRegionMechanicCharacterId('DAIKOKU'),
    heroCarId: 'reAmemiyaRx7',

    donorCarId: 'rx7fd',
    donorLabel: 'MAZDA RX-7 FD3S',
    buildCost: 13000000,

    unlockRegionWins: 10,

    backgroundKey: 'tunerShopDaikokuReAmemiyaBg',
    backgroundPath: 'assets/Locations/TunerShops/daikoku_re_amemiya_workshop.png',
    phaseBackgrounds: {
      day: { key: 'tunerShopDaikokuReAmemiyaBgDay', path: 'assets/Locations/TunerShops/daikoku_reamemiya_day.png' },
      night: { key: 'tunerShopDaikokuReAmemiyaBgNight', path: 'assets/Locations/TunerShops/daikoku_reamemiya_night.png' },
    },

    decalId: 'reAmemiya',
    decalLabel: 'RE AMEMIYA',
    decalTextureKey: 'tunerDecalReAmemiya',
    decalPath: 'assets/Decals/re_amemiya.png',

    tuningOptions: [
      {
        id: 'reAmemiyaCoolingFlow',
        name: 'THERMAL & FLOW PACKAGE',
        shortName: 'COOLING & FLOW',
        cost: 64000,
        description: 'Improve charge cooling, airflow and thermal consistency during repeated runs.',
        requirementLabel: 'REQUIRES INTERCOOLER LV 2',
        requirements: {
          engine: { intercooler: 2 },
        },
        effect: {
          outputScale: 1.015,
          efficiencyAdd: 0.005,
          spoolScale: 1.02,
        },
        benefit: '+1.5% OUTPUT / IMPROVED RESPONSE',
      },
      {
        id: 'reAmemiyaTurboResponse',
        name: 'BOOST RESPONSE CALIBRATION',
        shortName: 'TURBO RESPONSE',
        cost: 86000,
        description: 'Coordinate ECU mapping and boost response throughout the usable powerband.',
        requirementLabel: 'REQUIRES TURBO LV 2 + ECU LV 2',
        requirements: {
          engine: { turbo: 2, ecu: 2 },
        },
        effect: {
          boostAdd: 0.05,
          spoolScale: 1.04,
          outputScale: 1.015,
        },
        benefit: '+0.05 BAR / FASTER SPOOL / +1.5% OUTPUT',
      },
      {
        id: 'reAmemiyaCircuitRotary',
        name: 'RE AMEMIYA CIRCUIT SETUP',
        shortName: 'CIRCUIT SETUP',
        cost: 108000,
        description: 'Final weight and chassis refinement for consistent hard runs.',
        requirementLabel: 'REQUIRES BOTH RE AMEMIYA BASE TUNES',
        requirements: {
          specialist: ['reAmemiyaCoolingFlow', 'reAmemiyaTurboResponse'],
        },
        effect: {
          outputScale: 1.015,
          massDelta: -8,
          gripScale: 1.01,
        },
        benefit: '+1.5% OUTPUT / -8 KG / +1% GRIP',
      },
    ],
  },

  SHINAGAWA: {
    id: 'shinagawaZeroSports',
    // Keep prior Spoon visits discoverable in existing save files.
    legacyShopId: 'shinagawaSpoon',
    enabled: true,
    regionId: 'SHINAGAWA',
    mapLabel: 'TUNER SHOP',
    label: 'ZERO/SPORTS',
    fullName: 'ZERO/SPORTS RACING DEVELOPMENT',
    specialty: 'DRIVETRAIN & LAUNCH',

    mechanicId: getRegionMechanicCharacterId('SHINAGAWA'),
    heroCarId: 'zeroSportsGc8',

    donorCarId: 'gc8',
    donorLabel: 'SUBARU IMPREZA WRX STI GC8',
    buildCost: 7000000,

    unlockRegionWins: 10,

    backgroundKey: 'tunerShopShinagawaZeroSportsBg',
    backgroundPath: 'assets/Locations/TunerShops/shinagawa_zerosports_day.png',
    phaseBackgrounds: {
      day: { key: 'tunerShopShinagawaZeroSportsBgDay', path: 'assets/Locations/TunerShops/shinagawa_zerosports_day.png' },
      night: { key: 'tunerShopShinagawaZeroSportsBgNight', path: 'assets/Locations/TunerShops/shinagawa_zerosports_night.png' },
    },

    // Use the official uploaded transparent decal texture.
    // Its temporary text fallback is rendered by TunerDecals; never load a missing PNG.
    decalId: 'zeroSports',
    decalLabel: 'ZERO/SPORTS',
    decalTextureKey: 'tunerDecalZeroSports',
    decalPath: 'assets/Decals/zerosports.png',

    tuningOptions: [
      {
        id: 'zeroSportsBoxerResponse',
        name: 'POWER DELIVERY CALIBRATION',
        shortName: 'POWER DELIVERY',
        cost: 52000,
        description: 'Refine ECU and boost delivery for sharper acceleration through the powerband.',
        requirementLabel: 'REQUIRES ECU LV 2 + TURBO LV 1',
        requirements: {
          engine: { ecu: 2, turbo: 1 },
        },
        effect: {
          spoolScale: 1.04,
          outputScale: 1.01,
        },
        benefit: '+4% SPOOL / +1% OUTPUT',
      },
      {
        id: 'zeroSportsAwdLaunch',
        name: 'TRACTION & LAUNCH SETUP',
        shortName: 'LAUNCH SETUP',
        cost: 68000,
        description: 'Match differential behaviour and tyre grip for consistent hard launches.',
        requirementLabel: 'REQUIRES DIFF LV 2 + TYRES LV 2',
        requirements: {
          drivetrain: { differential: 2 },
          chassis: { tyres: 2 },
        },
        effect: {
          gripScale: 1.02,
          launchScale: 1.025,
        },
        benefit: '+2% GRIP / +2.5% LAUNCH',
      },
      {
        id: 'zeroSportsCompleteSetup',
        name: 'ZERO/SPORTS COMPLETE SETUP',
        shortName: 'COMPLETE SETUP',
        cost: 88000,
        description: 'Complete low-mass aero and chassis calibration after both base packages.',
        requirementLabel: 'REQUIRES BOTH ZERO/SPORTS BASE TUNES',
        requirements: {
          specialist: ['zeroSportsBoxerResponse', 'zeroSportsAwdLaunch'],
        },
        effect: {
          massDelta: -5,
          dragScale: 0.985,
          gripScale: 1.01,
        },
        benefit: '-5 KG / -1.5% DRAG / +1% GRIP',
      },
    ],
  },

  TATSUMI: {
    id: 'tatsumiJun',
    enabled: true,
    regionId: 'TATSUMI',
    mapLabel: 'TUNER SHOP',
    label: 'JUN',
    fullName: 'JUN AUTO MECHANIC',
    specialty: 'ENGINE INTERNALS',
    mechanicId: getRegionMechanicCharacterId('TATSUMI'),
    heroCarId: 'junHyperLemonEvo5',

    // The JUN donor is the registered stock Evo V, not the Galant VR-4.
    donorCarId: 'evo5',
    donorLabel: 'MITSUBISHI LANCER EVO V',
    buildCost: 12000000,

    unlockRegionWins: 10,

    backgroundKey: 'tunerShopTatsumiJunBg',
    backgroundPath: 'assets/Locations/TunerShops/tatsumi_jun_workshop.png',
    phaseBackgrounds: {
      day: { key: 'tunerShopTatsumiJunBgDay', path: 'assets/Locations/TunerShops/tatsumi_jun_day.png' },
      night: { key: 'tunerShopTatsumiJunBgNight', path: 'assets/Locations/TunerShops/tatsumi_jun_night.png' },
    },

    decalId: 'jun',
    decalLabel: 'JUN',
    decalTextureKey: 'tunerDecalJun',
    decalPath: 'assets/Decals/jun.png',

    tuningOptions: [
      {
        id: 'junBottomEndBlueprint',
        name: 'BOTTOM-END BLUEPRINT',
        shortName: 'BLUEPRINTED BOTTOM END',
        cost: 72000,
        description: 'Balance and blueprint an already-forged long block for harder sustained use.',
        requirementLabel: 'REQUIRES ENGINE LV 2',
        requirements: {
          engine: { engine: 2 },
        },
        effect: {
          outputScale: 1.025,
          redlineAdd: 100,
        },
        benefit: '+2.5% OUTPUT / +100 RPM',
      },
      {
        id: 'junHeadCamPackage',
        name: 'HEAD & CAM PACKAGE',
        shortName: 'HEAD / CAM PACKAGE',
        cost: 88000,
        description: 'JUN headwork and cam timing for stronger high-rpm breathing.',
        requirementLabel: 'REQUIRES ENGINE LV 3 + ECU LV 2',
        requirements: {
          engine: { engine: 3, ecu: 2 },
        },
        effect: {
          outputScale: 1.035,
          redlineAdd: 150,
        },
        benefit: '+3.5% OUTPUT / +150 RPM',
      },
      {
        id: 'junCompleteEngineSetup',
        name: 'JUN COMPLETE ENGINE SETUP',
        shortName: 'COMPLETE ENGINE SETUP',
        cost: 110000,
        description: 'Final dyno and mechanical refinement once both JUN engine programs are complete.',
        requirementLabel: 'REQUIRES BOTH JUN ENGINE TUNES',
        requirements: {
          specialist: ['junBottomEndBlueprint', 'junHeadCamPackage'],
        },
        effect: {
          outputScale: 1.02,
          efficiencyAdd: 0.01,
          redlineAdd: 100,
        },
        benefit: '+2% OUTPUT / +100 RPM / +1% EFF.',
      },
    ],
  },
};

export const TUNER_SHOP_ORDER = [
  'ODAIBA',
  'SHIBUYA',
  'SHINJUKU',
  'YOKOHAMA',
  'DAIKOKU',
  'SHINAGAWA',
  'TATSUMI',
];

export const TUNER_SHOP_BY_ID = Object.fromEntries(
  Object.values(TUNER_SHOPS).flatMap(shop => [
    [shop.id, shop],
    ...(shop.legacyShopId ? [[shop.legacyShopId, shop]] : []),
  ])
);

export const TUNER_SHOP_BY_DONOR = Object.fromEntries(
  Object.values(TUNER_SHOPS)
    .filter(shop => shop.enabled && shop.donorCarId)
    .map(shop => [shop.donorCarId, shop])
);

// Legacy Spoon specialist effects remain valid on already-tuned cars.
 // They are not offered by the new Shinagawa workshop.
const LEGACY_SHINAGAWA_TUNES = {
  spoonRigidChassis: { id: 'spoonRigidChassis', effect: { gripScale: 1.02, massDelta: -5 } },
  spoonLsdGeometry: { id: 'spoonLsdGeometry', effect: { gripScale: 1.025, launchScale: 1.02 } },
  spoonCompleteChassis: { id: 'spoonCompleteChassis', effect: { massDelta: -5, gripScale: 1.015, launchScale: 1.01 } },
};

export const TUNER_OPTION_BY_ID = {
  ...Object.fromEntries(
    Object.values(TUNER_SHOPS).flatMap(shop =>
      (shop.tuningOptions || []).map(option => [
        option.id,
        { ...option, shopId: shop.id, regionId: shop.regionId },
      ])
    )
  ),
  ...LEGACY_SHINAGAWA_TUNES,
};

export function getTunerShopPhaseBackground(shopOrRegion, phase = 'night') {
  const shop = typeof shopOrRegion === 'string'
    ? TUNER_SHOPS[String(shopOrRegion).toUpperCase()]
    : shopOrRegion;
  if (!shop) return null;
  const safePhase = String(phase).toLowerCase() === 'day' ? 'day' : 'night';
  return shop.phaseBackgrounds?.[safePhase] || {
    key: shop.backgroundKey,
    path: shop.backgroundPath,
  };
}

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
  // The first Chapter 07 build deliberately introduces JUST the two real
  // workshops: Amuse in Shibuya and Mine's in Yokohama. Even Aruken's dev
  // profile should experience these story gates. All seven open at stage 2.
  if(sourceValue(source,'gameMode')==='arkonStory' &&
     sourceValue(source,'arkonStoryChapter06Done')){
    const work=sourceValue(source,'arkonStoryChapter07Work')||{};
    if(!sourceValue(source,'arkonStoryChapter07Done') && work.stage===1)
      return ['SHIBUYA','YOKOHAMA'].includes(String(regionId||'').toUpperCase());
    return true;
  }
  if (isTunerDevProfile(source)) return true;

  // Preserve access for players who already entered a tuner shop before the
  // team-challenge progression was introduced.
  const legacyProgress = sourceValue(source, 'tunerShopProgress', {}) || {};
  const legacyShop = legacyProgress[shop.id]
    || (shop.legacyShopId ? legacyProgress[shop.legacyShopId] : null)
    || {};
  if (legacyShop.visited || legacyShop.discovered || legacyShop.unlockedByChallenge) {
    return true;
  }

  return getTunerTeamChallengeState(source, shop.regionId).completed;
}

export function getTunerShopUnlockLabel(source, regionId) {
  const shop = getTunerShopForRegion(regionId);
  if (!shop) return '';
  if (isTunerShopUnlocked(source, regionId)) return 'UNLOCKED';
  return getTunerTeamChallengeLabel(source, regionId);
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

    if (effect.redlineAdd != null) {
      const add = Number(effect.redlineAdd || 0);
      car.engineRedlineRPM = Number(car.engineRedlineRPM || engine.redlineRPM || 7600) + add;
      car.engineLimiterRPM = Number(car.engineLimiterRPM || engine.limiterRPM || car.engineRedlineRPM + 200) + add;
      engine.redlineRPM = Number(engine.redlineRPM || car.engineRedlineRPM || 7600) + add;
      engine.limiterRPM = Number(engine.limiterRPM || car.engineLimiterRPM || engine.redlineRPM + 200) + add;
    }

    if (effect.boostAdd != null && Number(car.maximumBoost || 0) > 0) {
      car.maximumBoost =
        Number(car.maximumBoost || 0) + Number(effect.boostAdd || 0);
    }

    if (effect.spoolScale != null && Number(car.turboSpoolRate || 0) > 0) {
      car.turboSpoolRate =
        Number(car.turboSpoolRate || 0) * Number(effect.spoolScale || 1);
    }

    if (effect.shiftScale != null) {
      car.shiftTimeScale =
        Number(car.shiftTimeScale || 1) * Number(effect.shiftScale || 1);
    }
  });

  return { car, engine, installed };
}
