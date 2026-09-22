import { WORKSHOP_TIERS } from './workshopProgression.js?v=20260922-r95';

export const HOME_REGION_ID = 'SHINONOME';
export const HOME_RETURN_COST = 500;
export const LOCAL_MOVE_COST = 200;

export const TRAVEL_REGIONS = {
  SHINONOME: {
    id: 'SHINONOME',
    label: 'SHINONOME',
    role: 'HOME / WORKSHOP',
    level: 'HOME',
    unlockWins: 0,
    baseCost: 0,
    mapX: 0.715,
    mapY: 0.285,
    description: 'Home base for garages, storage and tuning.',
    locations: [
      {
        id: 'shinonomeWorkshop',
        label: 'WORKSHOP',
        difficulty: 'HOME',
        kind: 'home',
        costOffset: 0,
        available: true,
        garageTier: 0,
        capacity: WORKSHOP_TIERS[0].capacity,
        note: 'Your original home workshop.',
      },
      {
        id: 'shinonomeCanalYard',
        label: 'CANAL YARD GARAGE',
        difficulty: 'UPGRADE',
        kind: 'garageUpgrade',
        costOffset: 0,
        available: true,
        garageTier: 1,
        unlockCost: WORKSHOP_TIERS[1].unlockCost,
        capacity: WORKSHOP_TIERS[1].capacity,
        note: 'Adds twelve storage slots at Canal Yard.',
      },
      {
        id: 'shinonomeWarehouseStrip',
        label: 'WAREHOUSE HQ',
        difficulty: 'UPGRADE',
        kind: 'garageUpgrade',
        costOffset: 0,
        available: true,
        garageTier: 2,
        requiresTier: 1,
        unlockCost: WORKSHOP_TIERS[2].unlockCost,
        capacity: WORKSHOP_TIERS[2].capacity,
        note: 'Adds twenty-four storage slots at the Warehouse HQ.',
      },
    ],
  },

  ODAIBA: {
    id: 'ODAIBA',
    label: 'ODAIBA',
    role: 'BEGINNER',
    level: 'LV 1-2',
    unlockWins: 0,
    baseCost: 200,
    mapX: 0.555,
    mapY: 0.365,
    description: 'Beginner-friendly bayfront meets. Cheap to reach and the best place to start.',
    locations: [
      {
        id: 'odaiba7eleven',
        label: '7-ELEVEN',
        difficulty: 'EASY',
        costOffset: 0,
        available: true,
        timeOfDay: 'night',
        note: 'Cheap local races and a forgiving starter crowd.',
      },
      {
        id: 'odaibaGundamPlaza',
        label: 'GUNDAM PLAZA',
        difficulty: 'EASY',
        costOffset: 100,
        available: true,
        timeOfDay: 'day',
        note: 'Another beginner-friendly Odaiba meet with slightly bigger bets.',
      },
      {
        id: 'odaibaMiraikan',
        label: 'MIRAIKAN',
        difficulty: 'MED',
        costOffset: 200,
        available: true,
        timeOfDay: 'night',
        note: 'The first step up from Odaiba\'s starter races.',
      },
    ],
  },

  SHINAGAWA: {
    id: 'SHINAGAWA',
    label: 'SHINAGAWA',
    role: 'BAY CITY',
    level: 'LV 2-3',
    unlockWins: 3,
    baseCost: 500,
    mapX: 0.335,
    mapY: 0.345,
    description: 'An early-game alternative with city roads, canals and industrial waterfront.',
    locations: [
      {
        id: 'shinagawaTennozu',
        label: 'TENNOZU ISLE',
        difficulty: 'EASY',
        costOffset: 0,
        available: true,
        timeOfDay: 'day',
        note: 'Canals, elevated roads and a forgiving early-game crowd.',
      },
      {
        id: 'shinagawaKonan',
        label: 'KONAN',
        difficulty: 'MED',
        costOffset: 100,
        available: true,
        timeOfDay: 'night',
        note: 'Office-district night meet with steady mid-level racers.',
      },
      {
        id: 'shinagawaOiWharf',
        label: 'OI WHARF',
        difficulty: 'MED',
        costOffset: 200,
        available: true,
        timeOfDay: 'twilight',
        note: 'Industrial waterfront meet with stronger early-game builds.',
      },
    ],
  },

  TATSUMI: {
    id: 'TATSUMI',
    label: 'TATSUMI',
    role: 'BAY EXPRESSWAY',
    level: 'LV 2-3',
    unlockWins: 6,
    baseCost: 650,
    mapX: 0.825,
    mapY: 0.165,
    description: 'Expressway-side meets with quicker cars and more serious rivals.',
    locations: [
      {
        id: 'tatsumiBridgefrontPlaza',
        label: 'BRIDGEFRONT PLAZA',
        difficulty: 'MED',
        costOffset: 0,
        available: true,
        timeOfDay: 'day',
        note: 'A mixed early-game crowd with consistent mid-level racers.',
      },
      {
        id: 'tatsumiSkylineVista',
        label: 'SKYLINE VISTA',
        difficulty: 'MED',
        costOffset: 100,
        available: true,
        timeOfDay: 'night',
        note: 'Faster cars, but still a mid-game meet.',
      },
      {
        id: 'tatsumiHarborLoop',
        label: 'HARBOR LOOP',
        difficulty: 'HARD',
        costOffset: 200,
        available: true,
        timeOfDay: 'night',
        note: 'The first serious jump in opponent pace and stakes.',
      },
    ],
  },

  SHIBUYA: {
    id: 'SHIBUYA',
    label: 'SHIBUYA',
    role: 'URBAN',
    level: 'LV 3-4',
    unlockWins: 10,
    baseCost: 900,
    mapX: 0.190,
    mapY: 0.220,
    description: 'Dense city streets, flashy tuner builds and increasingly aggressive rivals.',
    locations: [
      {
        id: 'shibuyaScramble',
        label: 'SCRAMBLE',
        difficulty: 'MED',
        costOffset: 0,
        available: true,
        timeOfDay: 'night',
        note: 'Iconic crossing district with flashy mid-game tuner builds.',
      },
      {
        id: 'shibuyaDogenzaka',
        label: 'DOGENZAKA',
        difficulty: 'HARD',
        costOffset: 100,
        available: true,
        timeOfDay: 'day',
        note: 'Daytime Dogenzaka meet with tougher street-focused rivals.',
      },
      {
        id: 'shibuyaCenterGai',
        label: 'CENTER-GAI',
        difficulty: 'HARD',
        costOffset: 200,
        available: true,
        timeOfDay: 'night',
        note: 'Neon shopping-street meet with strong urban racers.',
      },
    ],
  },

  CENTRAL_TOKYO: {
    id: 'CENTRAL_TOKYO',
    label: 'CENTRAL TOKYO',
    role: 'PRESTIGE HUB',
    level: 'SPECIAL',
    unlockWins: 12,
    baseCost: 1200,
    mapX: 0.405,
    mapY: 0.105,
    description: 'Tokyo\'s high-end automotive district: used cars, collector stock and professional drag racing.',
    locations: [
      {
        id: 'tokyoAutoMarket',
        label: 'TOKYO AUTO MARKET',
        difficulty: 'MARKET',
        kind: 'autoMarket',
        costOffset: 0,
        available: true,
        centralTokyoUnlock: 'autoMarket',
        timeOfDay: 'night',
        note: 'Buy pre-modified used cars or sell one of your own.',
      },
      {
        id: 'ginzaMotorGallery',
        label: 'GINZA MOTOR GALLERY',
        difficulty: 'INVITE',
        kind: 'showroom',
        costOffset: 100,
        available: true,
        centralTokyoUnlock: 'ginza',
        timeOfDay: 'night',
        note: 'Invitation-only collector showroom for rare, unmodifiable cars.',
      },
      {
        id: 'tokyoDragComplex',
        label: 'TOKYO DRAG COMPLEX',
        difficulty: 'PRO',
        kind: 'proDrag',
        costOffset: 200,
        available: true,
        centralTokyoUnlock: 'drag',
        timeOfDay: 'night',
        note: 'Professional three-round brackets with power limits and elite drivers.',
      },
    ],
  },

  SHINJUKU: {
    id: 'SHINJUKU',
    label: 'SHINJUKU',
    role: 'CITY',
    level: 'LV 4-5',
    unlockWins: 30,
    baseCost: 1100,
    mapX: 0.230,
    mapY: 0.075,
    description: 'Late-night downtown meets with strong urban crews and high stakes.',
    locations: [
      {
        id: 'shinjukuSouthExit',
        label: 'SOUTH EXIT',
        difficulty: 'HARD',
        costOffset: 0,
        available: false,
        timeOfDay: 'night',
        note: 'Station-side city meet // coming soon.',
      },
      {
        id: 'shinjukuKabukicho',
        label: 'KABUKICHO',
        difficulty: 'HARD',
        costOffset: 100,
        available: false,
        timeOfDay: 'night',
        note: 'Neon nightlife district // coming soon.',
      },
      {
        id: 'shinjukuNishi',
        label: 'NISHI-SHINJUKU',
        difficulty: 'ELITE',
        costOffset: 200,
        available: false,
        timeOfDay: 'night',
        note: 'Skyscraper district challenge // coming soon.',
      },
    ],
  },

  YOKOHAMA: {
    id: 'YOKOHAMA',
    label: 'YOKOHAMA',
    role: 'HARBOR CITY',
    level: 'LV 4-5',
    unlockWins: 16,
    baseCost: 1300,
    mapX: 0.130,
    mapY: 0.675,
    description: 'A longer drive south for harbor-city cruising and powerful late-game builds.',
    locations: [
      {
        id: 'yokohamaRedBrick',
        label: 'RED BRICK',
        difficulty: 'HARD',
        costOffset: 0,
        available: true,
        timeOfDay: 'day',
        note: 'Daytime waterfront meet beside the Red Brick Warehouses.',
      },
      {
        id: 'yokohamaMinatoMirai',
        label: 'MINATO MIRAI',
        difficulty: 'HARD',
        costOffset: 100,
        available: true,
        timeOfDay: 'night',
        note: 'Night skyline meet with powerful late-game builds.',
      },
      {
        id: 'yokohamaBayBridge',
        label: 'BAY BRIDGE',
        difficulty: 'ELITE',
        costOffset: 200,
        available: true,
        timeOfDay: 'night',
        note: 'Elite harbor-side meet beneath the Bay Bridge.',
      },
    ],
  },

  DAIKOKU: {
    id: 'DAIKOKU',
    label: 'DAIKOKU',
    role: 'HIGH STAKES',
    level: 'LV 5+',
    unlockWins: 22,
    baseCost: 1600,
    mapX: 0.315,
    mapY: 0.585,
    description: 'High-stakes meets, big bets and rare pink slips.',
    locations: [
      {
        id: 'daikokuPA',
        label: 'PA',
        difficulty: 'HARD',
        costOffset: 0,
        available: true,
        timeOfDay: 'night',
        note: 'The iconic parking-area meet and entry point to Daikoku.',
      },
      {
        id: 'daikokuHarbor',
        label: 'HARBOR',
        difficulty: 'ELITE',
        costOffset: 100,
        available: true,
        timeOfDay: 'day',
        note: 'Prestige-level harbor rivals with serious builds.',
      },
      {
        id: 'daikokuOpenLot',
        label: 'OPEN LOT',
        difficulty: 'ELITE',
        costOffset: 200,
        available: true,
        timeOfDay: 'night',
        note: 'The highest-stakes current meet.',
      },
    ],
  },
};

export const TRAVEL_REGION_ORDER = [
  'SHINONOME',
  'ODAIBA',
  'SHINAGAWA',
  'TATSUMI',
  'SHIBUYA',
  'CENTRAL_TOKYO',
  'SHINJUKU',
  'YOKOHAMA',
  'DAIKOKU',
];

function sourceValue(source, key, fallback = null) {
  if (source && typeof source.get === 'function') {
    const result = source.get(key);
    return result == null ? fallback : result;
  }
  const result = source?.[key];
  return result == null ? fallback : result;
}

function isDevTravelProfile(source) {
  if (Boolean(sourceValue(source, 'devMode', false))) return true;

  const first = String(sourceValue(source, 'firstName', '')).trim().toLowerCase();
  const last = String(sourceValue(source, 'lastName', '')).trim().toLowerCase();
  const joined = (first + last).replace(/[^a-z0-9]/g, '');
  const cash = Number(sourceValue(source, 'cash', 0) || 0);

  return joined.includes('arkonden') || cash >= 900000000;
}

export function isTravelRegionUnlocked(source, regionId) {
  const region = TRAVEL_REGIONS[regionId];
  if (!region) return false;

  if (isDevTravelProfile(source)) return true;
  if (regionId === HOME_REGION_ID || regionId === 'ODAIBA') return true;

  // Do not reveal regions that still have no playable destination. This keeps
  // future areas anonymous grey nodes until content for them actually exists.
  const hasPlayableDestination = region.locations.some(location => location.available !== false);
  if (!hasPlayableDestination) return false;

  const wins = Math.max(0, Number(sourceValue(source, 'wins', 0) || 0));
  return wins >= Math.max(0, Number(region.unlockWins || 0));
}

export function getTravelRegionUnlockWins(regionId) {
  return Math.max(0, Number(TRAVEL_REGIONS[regionId]?.unlockWins || 0));
}

export function getTravelRegion(regionId) {
  return TRAVEL_REGIONS[regionId] || TRAVEL_REGIONS.ODAIBA;
}

export function getTravelLocation(locationId) {
  for (const regionId of TRAVEL_REGION_ORDER) {
    const region = TRAVEL_REGIONS[regionId];
    const location = region.locations.find(item => item.id === locationId);
    if (location) return { ...location, regionId, region };
  }
  return null;
}

export function regionIdForMeetLocation(locationId, fallback = 'ODAIBA') {
  const found = getTravelLocation(locationId);
  return found?.regionId || fallback;
}

export function getRegionTravelCost({
  fromWorkshop = false,
  currentLocationId = null,
  targetLocationId,
} = {}) {
  const target = getTravelLocation(targetLocationId);
  if (!target) return 0;

  if (target.kind === 'home') {
    return fromWorkshop ? 0 : HOME_RETURN_COST;
  }

  // Once the player has driven home, the saved meetLocation still points
  // at the last meet they visited. Leaving the workshop is a fresh journey,
  // even when returning to that same meet, so workshop departure pricing must
  // be resolved before the "same location" shortcut.
  if (fromWorkshop) {
    return target.region.baseCost + Number(target.costOffset || 0);
  }

  if (currentLocationId === targetLocationId) return 0;

  const current = getTravelLocation(currentLocationId);
  if (current && current.regionId === target.regionId) {
    return LOCAL_MOVE_COST + Number(target.costOffset || 0);
  }

  return target.region.baseCost + Number(target.costOffset || 0);
}
