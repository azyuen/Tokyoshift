import { getBaseCarId } from './carOwnership.js?v=20261006-r388';
import {
  ENGINE_PART_ORDER,
  ENGINE_TUNING_PARTS,
  getEngineTuning,
} from './tuning.js?v=20260926-r211';
import {
  DRIVETRAIN_PART_ORDER,
  CHASSIS_PART_ORDER,
  EXHAUST_NOS_PART_ORDER,
  DRIVETRAIN_TUNING_PARTS,
  CHASSIS_TUNING_PARTS,
  EXHAUST_NOS_TUNING_PARTS,
  getDrivetrainTuning,
  getChassisTuning,
  getExhaustNosTuning,
} from './secondaryTuning.js?v=20260926-r211';
import {
  getRegionalChampionshipCount,
} from './careerProgression.js?v=20260929-r272';

export const CENTRAL_TOKYO_REGION_ID = 'CENTRAL_TOKYO';

export const CENTRAL_TOKYO_LOCATIONS = {
  autoMarket: {
    id: 'tokyoAutoMarket',
    label: 'TOKYO AUTO MARKET',
    shortLabel: 'AUTO MARKET',
    kind: 'autoMarket',
    // Used is the default so existing saves land in the closest equivalent to
    // the original pre-modified Auto Market. Each room is loaded lazily.
    backgroundKey: 'centralTokyoAutoMarketUsedBg',
    backgroundPath: 'assets/CentralTokyo/tokyo_auto_market_used.png',
    marketBackgrounds: {
      new: {
        key: 'centralTokyoAutoMarketNewBg',
        path: 'assets/CentralTokyo/tokyo_auto_market_new.png',
        phases: {
          day: { key: 'centralTokyoAutoMarketNewDayBg', path: 'assets/CentralTokyo/tokyo_new_day.png' },
          night: { key: 'centralTokyoAutoMarketNewNightBg', path: 'assets/CentralTokyo/tokyo_new_night.png' },
        },
      },
      used: {
        key: 'centralTokyoAutoMarketUsedBg',
        path: 'assets/CentralTokyo/tokyo_auto_market_used.png',
        phases: {
          day: { key: 'centralTokyoAutoMarketUsedDayBg', path: 'assets/CentralTokyo/tokyo_used_day.png' },
          night: { key: 'centralTokyoAutoMarketUsedNightBg', path: 'assets/CentralTokyo/tokyo_used_night.png' },
        },
      },
      wheels: {
        key: 'centralTokyoAutoMarketWheelsBg',
        path: 'assets/CentralTokyo/tokyo_auto_market_wheels.png',
        phases: {
          day: { key: 'centralTokyoAutoMarketWheelsDayBg', path: 'assets/CentralTokyo/tokyo_wheels_day.png' },
          night: { key: 'centralTokyoAutoMarketWheelsNightBg', path: 'assets/CentralTokyo/tokyo_wheels_night.png' },
        },
      },
    },
    winsRequired: 3,
    championshipsRequired: 0,
    garageTierRequired: 0,
  },
  ginza: {
    id: 'ginzaMotorGallery',
    label: 'GINZA MOTOR GALLERY',
    shortLabel: 'GINZA GALLERY',
    kind: 'showroom',
    backgroundKey: 'centralTokyoGinzaBg',
    backgroundPath: 'assets/CentralTokyo/ginza_motor_gallery_at_night.png',
    phaseBackgrounds: {
      day: { key: 'centralTokyoGinzaDayBg', path: 'assets/CentralTokyo/tokyo_ginza_day.png' },
      night: { key: 'centralTokyoGinzaNightBg', path: 'assets/CentralTokyo/tokyo_ginza_night.png' },
    },
    winsRequired: 0,
    championshipsRequired: 3,
    garageTierRequired: 2,
  },
  drag: {
    id: 'tokyoDragComplex',
    label: 'TOKYO DRAG COMPLEX',
    shortLabel: 'DRAG COMPLEX',
    kind: 'proDrag',
    backgroundKey: 'centralTokyoDragBg',
    backgroundPath: 'assets/CentralTokyo/tokyo_drag_strip_at_night.png',
    phaseBackgrounds: {
      day: { key: 'centralTokyoDragDayBg', path: 'assets/CentralTokyo/tokyo_dragstrip_day.png' },
      night: { key: 'centralTokyoDragNightBg', path: 'assets/CentralTokyo/tokyo_dragstrip_night.png' },
    },
    winsRequired: 0,
    championshipsRequired: 7,
    garageTierRequired: 0,
  },
};

export const CENTRAL_TOKYO_LOCATION_ORDER = [
  'tokyoAutoMarket',
  'ginzaMotorGallery',
  'tokyoDragComplex',
];

export const MARKET_BASE_PRICES = {
  ae86: 950000,
  ef: 1150000,
  ek9: 1450000,
  s2000: 3600000,
  fc3s: 1850000,
  rx8: 2050000,
  rx7fd: 4200000,
  evo3: 2800000,
  evo5: 3900000,
  evo6: 4500000,
  wrx22b: 6200000,
  r32: 7200000,
  ej1: 1350000,
  a60: 2100000,
  jza80: 6800000,
  nsx: 9000000,
  r34: 8500000,
  '3000gt': 4900000,
};

const MARKET_BUILDS = {
  ae86: {
    stock: false,
    acquiredVia: 'tokyoAutoMarket',
    tuning: { engine: 0, intake: 1, ecu: 1, turbo: 0, intercooler: 0, exhaust: 1 },
    drivetrainTuning: { clutch: 1, gearbox: 0, differential: 0, suspension: 1, launchSetup: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 1, muffler: 1, nosKit: 0, nitrousShot: 0 },
  },
  ek9: {
    stock: false,
    acquiredVia: 'tokyoAutoMarket',
    tuning: { engine: 0, intake: 1, ecu: 1, turbo: 0, intercooler: 0, exhaust: 1 },
    drivetrainTuning: { clutch: 1, gearbox: 0, differential: 1, suspension: 1, launchSetup: 0 },
    exhaustNosTuning: { headers: 1, exhaust: 1, muffler: 1, nosKit: 0, nitrousShot: 0 },
  },
  fc3s: {
    stock: false,
    acquiredVia: 'tokyoAutoMarket',
    tuning: { engine: 0, intake: 1, ecu: 1, turbo: 1, intercooler: 1, exhaust: 1 },
    drivetrainTuning: { clutch: 1, gearbox: 0, differential: 1, suspension: 1, launchSetup: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 1, muffler: 1, nosKit: 0, nitrousShot: 0 },
  },
  evo3: {
    stock: false,
    acquiredVia: 'tokyoAutoMarket',
    tuning: { engine: 0, intake: 1, ecu: 1, turbo: 1, intercooler: 1, exhaust: 1 },
    drivetrainTuning: { clutch: 1, gearbox: 1, differential: 1, suspension: 1, launchSetup: 1 },
    exhaustNosTuning: { headers: 1, exhaust: 1, muffler: 1, nosKit: 0, nitrousShot: 0 },
  },
  wrx22b: {
    stock: false,
    acquiredVia: 'tokyoAutoMarket',
    tuning: { engine: 0, intake: 1, ecu: 1, turbo: 1, intercooler: 1, exhaust: 1 },
    drivetrainTuning: { clutch: 1, gearbox: 1, differential: 1, suspension: 1, launchSetup: 1 },
    exhaustNosTuning: { headers: 1, exhaust: 1, muffler: 1, nosKit: 0, nitrousShot: 0 },
  },
  r32: {
    stock: false,
    acquiredVia: 'tokyoAutoMarket',
    tuning: { engine: 0, intake: 1, ecu: 1, turbo: 1, intercooler: 1, exhaust: 1 },
    drivetrainTuning: { clutch: 1, gearbox: 1, differential: 1, suspension: 1, launchSetup: 1 },
    exhaustNosTuning: { headers: 1, exhaust: 1, muffler: 1, nosKit: 0, nitrousShot: 0 },
  },
};

// New dealership entries use the matching drivetrain's street build recipe.
Object.assign(MARKET_BUILDS, {
  ef: MARKET_BUILDS.ek9,
  s2000: MARKET_BUILDS.ek9,
  rx7fd: MARKET_BUILDS.fc3s,
  rx8: MARKET_BUILDS.fc3s,
  evo5: MARKET_BUILDS.evo3,
  evo6: MARKET_BUILDS.evo3,
  ej1: MARKET_BUILDS.ek9,
  a60: MARKET_BUILDS.ae86,
  jza80: MARKET_BUILDS.r32,
  nsx: MARKET_BUILDS.ae86,
  r34: MARKET_BUILDS.r32,
  '3000gt': MARKET_BUILDS.r32,
});

export const AUTO_MARKET_LISTINGS = [
  { carId: 'ae86', price: 1150000, buildLabel: 'LIGHT STREET BUILD' },
  { carId: 'ef', price: 1400000, buildLabel: 'VTEC STREET BUILD' },
  { carId: 'ek9', price: 1750000, buildLabel: 'STAGE 1 STREET BUILD' },
  { carId: 's2000', price: 4300000, buildLabel: 'VTEC ROADSTER BUILD' },
  { carId: 'fc3s', price: 2350000, buildLabel: 'TURBO STREET BUILD' },
  { carId: 'rx8', price: 2600000, buildLabel: 'ROTARY STREET BUILD' },
  { carId: 'evo3', price: 3450000, buildLabel: 'AWD STREET BUILD' },
  { carId: 'rx7fd', price: 4900000, buildLabel: 'TWIN TURBO BUILD' },
  { carId: 'evo5', price: 4700000, buildLabel: 'AWD STREET BUILD' },
  { carId: 'evo6', price: 5400000, buildLabel: 'AWD STREET BUILD' },
  { carId: 'wrx22b', price: 7200000, buildLabel: 'PERFORMANCE BUILD' },
  { carId: 'r32', price: 8450000, buildLabel: 'PERFORMANCE BUILD' },
  { carId: 'ej1', price: 1650000, buildLabel: 'VTEC COUPE BUILD' },
  { carId: 'a60', price: 2550000, buildLabel: 'CLASSIC FR BUILD' },
  { carId: 'jza80', price: 8100000, buildLabel: 'TWIN TURBO BUILD' },
  { carId: 'nsx', price: 10800000, buildLabel: 'MID-ENGINE BUILD' },
  { carId: 'r34', price: 10200000, buildLabel: 'GT-R STREET BUILD' },
  { carId: '3000gt', price: 5900000, buildLabel: 'TWIN TURBO AWD BUILD' },
];

export const GINZA_LISTINGS = [
  {
    carId: 'spoonEk9',
    price: 28000000,
    collectionLabel: 'SPOON RACE EK9',
    rarity: 'COLLECTOR',
  },
  {
    carId: 'amuseS2000Gt1',
    price: 32000000,
    collectionLabel: 'TUNER ICON',
    rarity: 'COLLECTOR',
  },
  {
    carId: 'reAmemiyaRx7',
    price: 48000000,
    collectionLabel: 'RE AMEMIYA TIME ATTACK',
    rarity: 'RARE',
  },
  {
    carId: 'veilsideFortuneRx7',
    price: 45000000,
    collectionLabel: 'FORTUNE HERO CAR',
    rarity: 'COLLECTOR',
  },
  {
    carId: 'minesR34',
    price: 52000000,
    collectionLabel: "MINE'S COMPLETE CAR",
    rarity: 'RARE',
  },
  {
    carId: 'topSecretSupra',
    price: 58000000,
    collectionLabel: 'TOP SECRET GT-300',
    rarity: 'RARE',
  },
  {
    carId: 'libertyWalkR35',
    price: 68000000,
    collectionLabel: 'LB-WORKS HERO CAR',
    rarity: 'RARE',
  },
  {
    carId: 'junHyperLemonEvo5',
    price: 76000000,
    collectionLabel: 'HYPER LEMON EVO V',
    rarity: 'ULTRA RARE',
  },
  {
    carId: 'rwbStellaPorsche',
    price: 82000000,
    collectionLabel: 'RWB ONE-OFF',
    rarity: 'ULTRA RARE',
  },
  {
    carId: 'espritNsx',
    price: 145000000,
    collectionLabel: 'ESPRIT TIME ATTACK NSX',
    rarity: 'LEGENDARY',
  },
  {
    carId: 'renownMazda787B',
    price: 220000000,
    collectionLabel: 'LE MANS LEGEND',
    rarity: 'LEGENDARY',
  },
];

export function getGinzaCollectorState(carId) {
  return {
    stock: false,
    acquiredVia: 'ginzaMotorGallery',
    collector: true,
    immutable: true,
    tuningLocked: true,
    nosInstalled: false,
    tuneLevel: 0,
    tuning: { engine: 0, intake: 0, ecu: 0, turbo: 0, intercooler: 0, exhaust: 0 },
    drivetrainTuning: { clutch: 0, gearbox: 0, differential: 0, suspension: 0, launchSetup: 0 },
    chassisTuning: { tyres: 0, weightReduction: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 0, muffler: 0, nosKit: 0, nitrousShot: 0 },
  };
}

export const PRO_DRAG_EVENTS = [
  {
    id: 'streetShootout',
    label: 'STREET SHOOTOUT',
    subtitle: 'PROVING GROUNDS',
    entryFee: 55000,
    prizeCash: 95000,
    maxPowerKW: 260,
    noNos: true,
    requiredWins: 40,
    opponentRatings: [4, 5, 5],
    opponentCars: ['evo3', 'wrx22b', 'r32'],
  },
  {
    id: 'midnightCup',
    label: 'MIDNIGHT CUP',
    subtitle: 'PRO STREET',
    entryFee: 65000,
    prizeCash: 135000,
    maxPowerKW: 380,
    noNos: true,
    requiredWins: 45,
    opponentRatings: [5, 5, 5],
    opponentCars: ['wrx22b', 'r32', 'evo3'],
  },
  {
    id: 'tokyoInvitational',
    label: 'TOKYO INVITATIONAL',
    subtitle: 'OPEN PRO',
    entryFee: 80000,
    prizeCash: 190000,
    maxPowerKW: 600,
    noNos: false,
    requiredWins: 55,
    opponentRatings: [5, 5, 5],
    opponentCars: ['r32', 'wrx22b', 'r32'],
  },
];

function value(source, key, fallback = null) {
  if (source && typeof source.get === 'function') {
    const result = source.get(key);
    return result == null ? fallback : result;
  }
  const result = source?.[key];
  return result == null ? fallback : result;
}

export function isArkonDen(source) {
  const devMode = Boolean(value(source, 'devMode', false));
  const first = String(value(source, 'firstName', '')).trim().toLowerCase();
  const last = String(value(source, 'lastName', '')).trim().toLowerCase();
  const joined = (first + last).replace(/[^a-z0-9]/g, '');
  const legacyDevCash = Number(value(source, 'cash', 0) || 0) >= 900000000;

  // Accept the canonical split name, combined display-name variants, and old
  // dev saves that were created before the explicit devMode flag was stored.
  return devMode || joined.includes('arkonden') || legacyDevCash;
}

export function getCentralTokyoEligibility(source) {
  if (isArkonDen(source)) {
    return { autoMarket: true, ginza: true, drag: true };
  }

  const wins = Number(value(source, 'wins', 0) || 0);
  const garageTier = Number(value(source, 'garageTier', 0) || 0);
  const championships = getRegionalChampionshipCount(source);

  return {
    autoMarket:
      wins >= Number(CENTRAL_TOKYO_LOCATIONS.autoMarket.winsRequired || 0) &&
      championships >= Number(CENTRAL_TOKYO_LOCATIONS.autoMarket.championshipsRequired || 0) &&
      garageTier >= CENTRAL_TOKYO_LOCATIONS.autoMarket.garageTierRequired,
    ginza:
      championships >= Number(CENTRAL_TOKYO_LOCATIONS.ginza.championshipsRequired || 0) &&
      garageTier >= CENTRAL_TOKYO_LOCATIONS.ginza.garageTierRequired,
    drag:
      championships >= Number(CENTRAL_TOKYO_LOCATIONS.drag.championshipsRequired || 0) &&
      garageTier >= CENTRAL_TOKYO_LOCATIONS.drag.garageTierRequired,
  };
}

export function getCentralTokyoAccess(source) {
  if (isArkonDen(source)) {
    return { autoMarket: true, ginza: true, drag: true };
  }

  const unlocked = value(source, 'centralTokyoUnlocks', {}) || {};
  const eligible = getCentralTokyoEligibility(source);
  return {
    autoMarket: Boolean(unlocked.autoMarket && eligible.autoMarket),
    ginza: Boolean(unlocked.ginza && eligible.ginza),
    drag: Boolean(eligible.drag),
  };
}

export function getCentralTokyoAccessKey(locationId) {
  if (locationId === CENTRAL_TOKYO_LOCATIONS.autoMarket.id) return 'autoMarket';
  if (locationId === CENTRAL_TOKYO_LOCATIONS.ginza.id) return 'ginza';
  if (locationId === CENTRAL_TOKYO_LOCATIONS.drag.id) return 'drag';
  return null;
}

export function isCentralTokyoLocationUnlocked(source, locationId) {
  const key = getCentralTokyoAccessKey(locationId);
  if (!key) return true;
  return Boolean(getCentralTokyoAccess(source)[key]);
}

export function markCentralTokyoUnlocked(registry, key) {
  if (!registry || typeof registry.set !== 'function') return false;
  if (!['autoMarket', 'ginza', 'drag'].includes(String(key))) return false;

  const unlocks = {
    ...(registry.get('centralTokyoUnlocks') || {}),
    [key]: true,
  };
  const seen = {
    ...(registry.get('tokyoInvitesSeen') || {}),
    [key]: true,
  };

  registry.set('centralTokyoUnlocks', unlocks);
  registry.set('tokyoInvitesSeen', seen);
  return true;
}

export function getCentralTokyoUnlockLabel(source, locationId) {
  const key = getCentralTokyoAccessKey(locationId);
  if (!key) return 'LOCKED';
  if (isCentralTokyoLocationUnlocked(source, locationId)) return 'OPEN';

  const cfg = CENTRAL_TOKYO_LOCATIONS[key];
  const wins = Number(value(source, 'wins', 0) || 0);
  const garageTier = Number(value(source, 'garageTier', 0) || 0);
  const championships = getRegionalChampionshipCount(source);
  const championshipsRequired = Number(cfg.championshipsRequired || 0);

  if (championships < championshipsRequired) {
    return championshipsRequired === 1
      ? 'WIN A REGIONAL CHAMPIONSHIP'
      : championshipsRequired + ' REGIONAL CHAMPIONSHIPS REQUIRED';
  }

  if (wins < cfg.winsRequired) {
    return cfg.winsRequired + ' WINS REQUIRED';
  }

  if (garageTier < cfg.garageTierRequired) {
    return cfg.garageTierRequired >= 2 ? 'WAREHOUSE HQ REQUIRED' : 'CANAL YARD REQUIRED';
  }

  return 'INVITATION REQUIRED';
}

export function getPendingCentralTokyoInvite(source) {
  if (isArkonDen(source)) return null;

  const eligible = getCentralTokyoEligibility(source);
  const access = getCentralTokyoAccess(source);

  if (eligible.autoMarket && !access.autoMarket) return 'autoMarket';
  if (eligible.ginza && !access.ginza) return 'ginza';
  return null;
}

export const CAR_COUPON_REQUIREMENTS = {
  ae86: 5,
  ef: 5,
  ek9: 5,
  s2000: 5,
  fc3s: 5,
  rx8: 5,
  rx7fd: 7,
  evo3: 5,
  evo5: 7,
  evo6: 7,
  wrx22b: 5,
  r32: 7,
  ej1: 5,
  a60: 5,
  jza80: 7,
  nsx: 7,
  r34: 7,
  '3000gt': 7,
};

export function getCarCouponRequirement(carId) {
  // Unlisted models do not issue coupons; keep the minimum meaningful target
  // aligned with the entry-tier five-coupon economy.
  return Math.max(5, Number(CAR_COUPON_REQUIREMENTS[String(carId)] || 5));
}

export function getCarCouponCount(source, carId) {
  const coupons = value(source, 'carCoupons', {}) || {};
  return Math.max(0, Math.floor(Number(coupons[String(carId)] || 0)));
}

export function canRedeemCarCoupon(source, carId) {
  return getCarCouponCount(source, carId) >= getCarCouponRequirement(carId);
}

export function getAutoMarketBuild(carId) {
  const baseCarId = getBaseCarId(carId);
  return JSON.parse(JSON.stringify(MARKET_BUILDS[baseCarId] || {
    stock: true,
    acquiredVia: 'tokyoAutoMarket',
  }));
}

export function getAutoMarketBasePrice(carId) {
  return Math.max(100000, Number(MARKET_BASE_PRICES[getBaseCarId(carId)] || 1000000));
}

export function getNewCarState(carId, paintColor = 0xffffff) {
  return {
    stock: true,
    paintColor,
    nosInstalled: false,
    tuneLevel: 0,
    tuning: { engine: 0, intake: 0, ecu: 0, turbo: 0, intercooler: 0, exhaust: 0 },
    drivetrainTuning: { clutch: 0, gearbox: 0, differential: 0, suspension: 0, launchSetup: 0 },
    chassisTuning: { tyres: 0, weightReduction: 0 },
    exhaustNosTuning: { headers: 0, exhaust: 0, muffler: 0, nosKit: 0, nitrousShot: 0 },
    visualMods: {},
    acquiredVia: 'tokyoAutoMarketNew',
  };
}

function installedPartsCost(order, catalog, levels = {}) {
  return order.reduce((total, partId) => {
    const installed = Math.max(0, Math.min(3, Math.floor(Number(levels?.[partId] || 0))));
    const part = catalog[partId];
    if (!part || installed <= 0) return total;

    let partTotal = 0;
    for (let level = 1; level <= installed; level++) {
      partTotal += Number(part.levels?.[level]?.cost || 0);
    }
    return total + partTotal;
  }, 0);
}

function getInstalledPerformanceInvestment(carState = {}) {
  return (
    installedPartsCost(
      ENGINE_PART_ORDER,
      ENGINE_TUNING_PARTS,
      getEngineTuning(carState)
    ) +
    installedPartsCost(
      DRIVETRAIN_PART_ORDER,
      DRIVETRAIN_TUNING_PARTS,
      getDrivetrainTuning(carState)
    ) +
    installedPartsCost(
      CHASSIS_PART_ORDER,
      CHASSIS_TUNING_PARTS,
      getChassisTuning(carState)
    ) +
    installedPartsCost(
      EXHAUST_NOS_PART_ORDER,
      EXHAUST_NOS_TUNING_PARTS,
      getExhaustNosTuning(carState)
    )
  );
}

export function getAutoMarketSellPrice(carId, carState = {}) {
  const base = Number(MARKET_BASE_PRICES[getBaseCarId(carId)] || 1000000);

  // The dealership pays wholesale for the shell, then only a fraction of the
  // money sunk into performance parts. This prevents a cheap cosmetic flag or
  // one small modification from magically increasing the value by 5% of the
  // whole car, while still rewarding a genuinely developed build.
  const baseResale = base * 0.50;
  const partsInvestment = getInstalledPerformanceInvestment(carState);
  const partsRecovery = Math.min(base * 0.05, partsInvestment * 0.25);

  return Math.round((baseResale + partsRecovery) / 10000) * 10000;
}
