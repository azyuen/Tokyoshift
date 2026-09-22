export const CENTRAL_TOKYO_REGION_ID = 'CENTRAL_TOKYO';

export const CENTRAL_TOKYO_LOCATIONS = {
  autoMarket: {
    id: 'tokyoAutoMarket',
    label: 'TOKYO AUTO MARKET',
    shortLabel: 'AUTO MARKET',
    kind: 'autoMarket',
    backgroundKey: 'centralTokyoAutoMarketBg',
    backgroundPath: 'assets/CentralTokyo/central_tokyo_auto_market_night.png',
    winsRequired: 12,
    garageTierRequired: 0,
  },
  ginza: {
    id: 'ginzaMotorGallery',
    label: 'GINZA MOTOR GALLERY',
    shortLabel: 'GINZA GALLERY',
    kind: 'showroom',
    backgroundKey: 'centralTokyoGinzaBg',
    backgroundPath: 'assets/CentralTokyo/central_tokyo_ginza_gallery_night.png',
    winsRequired: 25,
    garageTierRequired: 1,
  },
  drag: {
    id: 'tokyoDragComplex',
    label: 'TOKYO DRAG COMPLEX',
    shortLabel: 'DRAG COMPLEX',
    kind: 'proDrag',
    backgroundKey: 'centralTokyoDragBg',
    backgroundPath: 'assets/CentralTokyo/central_tokyo_drag_complex_night.png',
    winsRequired: 40,
    garageTierRequired: 2,
  },
};

export const CENTRAL_TOKYO_LOCATION_ORDER = [
  'tokyoAutoMarket',
  'ginzaMotorGallery',
  'tokyoDragComplex',
];

const MARKET_BASE_PRICES = {
  ae86: 950000,
  ek9: 1450000,
  fc3s: 1850000,
  evo3: 2800000,
  wrx22b: 6200000,
  r32: 7200000,
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

export const AUTO_MARKET_LISTINGS = [
  { carId: 'ae86', price: 1150000, buildLabel: 'LIGHT STREET BUILD' },
  { carId: 'ek9', price: 1750000, buildLabel: 'STAGE 1 STREET BUILD' },
  { carId: 'fc3s', price: 2350000, buildLabel: 'TURBO STREET BUILD' },
  { carId: 'evo3', price: 3450000, buildLabel: 'AWD STREET BUILD' },
  { carId: 'wrx22b', price: 7200000, buildLabel: 'PERFORMANCE BUILD' },
  { carId: 'r32', price: 8450000, buildLabel: 'PERFORMANCE BUILD' },
];

export const GINZA_PLACEHOLDERS = [
  { carId: 'r32', slotLabel: 'COLLECTOR SLOT A', price: 28000000 },
  { carId: 'wrx22b', slotLabel: 'COLLECTOR SLOT B', price: 24000000 },
  { carId: 'fc3s', slotLabel: 'COLLECTOR SLOT C', price: 19000000 },
];

export const PRO_DRAG_EVENTS = [
  {
    id: 'streetShootout',
    label: 'STREET SHOOTOUT',
    subtitle: 'PROVING GROUNDS',
    entryFee: 25000,
    prizeCash: 250000,
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
    entryFee: 50000,
    prizeCash: 600000,
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
    entryFee: 100000,
    prizeCash: 1200000,
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
  return devMode || (first === 'arkon' && last === 'den');
}

export function getCentralTokyoAccess(source) {
  if (isArkonDen(source)) {
    return { autoMarket: true, ginza: true, drag: true };
  }

  const wins = Number(value(source, 'wins', 0) || 0);
  const garageTier = Number(value(source, 'garageTier', 0) || 0);

  return {
    autoMarket: wins >= CENTRAL_TOKYO_LOCATIONS.autoMarket.winsRequired,
    ginza:
      wins >= CENTRAL_TOKYO_LOCATIONS.ginza.winsRequired &&
      garageTier >= CENTRAL_TOKYO_LOCATIONS.ginza.garageTierRequired,
    drag:
      wins >= CENTRAL_TOKYO_LOCATIONS.drag.winsRequired &&
      garageTier >= CENTRAL_TOKYO_LOCATIONS.drag.garageTierRequired,
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

export function getCentralTokyoUnlockLabel(source, locationId) {
  const key = getCentralTokyoAccessKey(locationId);
  if (!key) return 'LOCKED';
  if (isCentralTokyoLocationUnlocked(source, locationId)) return 'OPEN';

  const cfg = CENTRAL_TOKYO_LOCATIONS[key];
  const wins = Number(value(source, 'wins', 0) || 0);
  const garageTier = Number(value(source, 'garageTier', 0) || 0);

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

  const access = getCentralTokyoAccess(source);
  const seen = value(source, 'tokyoInvitesSeen', {}) || {};

  // The Auto Market simply opens once the player has enough wins. The two
  // prestige destinations are the ones that arrive as explicit invitations.
  if (access.ginza && !seen.ginza) return 'ginza';
  if (access.drag && !seen.drag) return 'drag';
  return null;
}

export function getAutoMarketBuild(carId) {
  return JSON.parse(JSON.stringify(MARKET_BUILDS[carId] || {
    stock: true,
    acquiredVia: 'tokyoAutoMarket',
  }));
}

export function getAutoMarketSellPrice(carId, carState = {}) {
  const base = Number(MARKET_BASE_PRICES[carId] || 1000000);
  const modified = carState && carState.stock === false;
  return Math.round(base * (modified ? 0.82 : 0.74) / 10000) * 10000;
}
