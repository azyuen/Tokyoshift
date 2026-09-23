export const CENTRAL_TOKYO_REGION_ID = 'CENTRAL_TOKYO';

export const CENTRAL_TOKYO_LOCATIONS = {
  autoMarket: {
    id: 'tokyoAutoMarket',
    label: 'TOKYO AUTO MARKET',
    shortLabel: 'AUTO MARKET',
    kind: 'autoMarket',
    backgroundKey: 'centralTokyoAutoMarketBg',
    backgroundPath: 'assets/CentralTokyo/tokyo_auto_market_after_dark.png',
    winsRequired: 12,
    garageTierRequired: 0,
  },
  ginza: {
    id: 'ginzaMotorGallery',
    label: 'GINZA MOTOR GALLERY',
    shortLabel: 'GINZA GALLERY',
    kind: 'showroom',
    backgroundKey: 'centralTokyoGinzaBg',
    backgroundPath: 'assets/CentralTokyo/ginza_motor_gallery_at_night.png',
    winsRequired: 25,
    garageTierRequired: 1,
  },
  drag: {
    id: 'tokyoDragComplex',
    label: 'TOKYO DRAG COMPLEX',
    shortLabel: 'DRAG COMPLEX',
    kind: 'proDrag',
    backgroundKey: 'centralTokyoDragBg',
    backgroundPath: 'assets/CentralTokyo/tokyo_drag_strip_at_night.png',
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

export const GINZA_LISTINGS = [
  {
    carId: 'amuseS2000Gt1',
    price: 32000000,
    collectionLabel: 'TUNER ICON',
    rarity: 'COLLECTOR',
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
    carId: 'rwbStellaPorsche',
    price: 82000000,
    collectionLabel: 'RWB ONE-OFF',
    rarity: 'ULTRA RARE',
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
  const joined = (first + last).replace(/[^a-z0-9]/g, '');
  const legacyDevCash = Number(value(source, 'cash', 0) || 0) >= 900000000;

  // Accept the canonical split name, combined display-name variants, and old
  // dev saves that were created before the explicit devMode flag was stored.
  return devMode || joined.includes('arkonden') || legacyDevCash;
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

  // Auto Market is a wholesale exit, not full retail liquidity. A won or
  // modified car is still a meaningful windfall, but selling it should not
  // instantly convert its full market value into endgame tuning money.
  const resaleRate = modified ? 0.65 : 0.60;
  return Math.round(base * resaleRate / 10000) * 10000;
}
