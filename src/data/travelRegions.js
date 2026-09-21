import { WORKSHOP_TIERS } from './workshopProgression.js?v=20260921-r76';

export const HOME_REGION_ID = 'SHINONOME';
export const HOME_RETURN_COST = 500;
export const LOCAL_MOVE_COST = 200;

export const TRAVEL_REGIONS = {
  SHINONOME: {
    id: 'SHINONOME',
    label: 'SHINONOME',
    role: 'HOME / WORKSHOP',
    level: 'HOME',
    baseCost: 0,
    mapX: 0.722,
    mapY: 0.327,
    description: 'Your Shinonome home base. Expand storage and manage your workshop here.',
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
    baseCost: 200,
    mapX: 0.568,
    mapY: 0.405,
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
    baseCost: 500,
    mapX: 0.335,
    mapY: 0.395,
    description: 'An early-game alternative with city roads, canals and industrial waterfront.',
    locations: [
      {
        id: 'shinagawaTennozu',
        label: 'TENNOZU ISLE',
        difficulty: 'EASY',
        costOffset: 0,
        available: false,
        timeOfDay: 'day',
        note: 'Canals and elevated roads // coming soon.',
      },
      {
        id: 'shinagawaKonan',
        label: 'KONAN',
        difficulty: 'MED',
        costOffset: 100,
        available: false,
        timeOfDay: 'night',
        note: 'Office district night meet // coming soon.',
      },
      {
        id: 'shinagawaOiWharf',
        label: 'OI WHARF',
        difficulty: 'MED',
        costOffset: 200,
        available: false,
        timeOfDay: 'night',
        note: 'Industrial waterfront run // coming soon.',
      },
    ],
  },

  TATSUMI: {
    id: 'TATSUMI',
    label: 'TATSUMI',
    role: 'BAY EXPRESSWAY',
    level: 'LV 2-3',
    baseCost: 650,
    mapX: 0.859,
    mapY: 0.199,
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
    baseCost: 900,
    mapX: 0.171,
    mapY: 0.278,
    description: 'Dense city streets, flashy tuner builds and increasingly aggressive rivals.',
    locations: [
      {
        id: 'shibuyaScramble',
        label: 'SCRAMBLE',
        difficulty: 'MED',
        costOffset: 0,
        available: false,
        timeOfDay: 'night',
        note: 'Shibuya crossing district // coming soon.',
      },
      {
        id: 'shibuyaDogenzaka',
        label: 'DOGENZAKA',
        difficulty: 'HARD',
        costOffset: 100,
        available: false,
        timeOfDay: 'night',
        note: 'Hill-side nightlife streets // coming soon.',
      },
      {
        id: 'shibuyaCenterGai',
        label: 'CENTER-GAI',
        difficulty: 'HARD',
        costOffset: 200,
        available: false,
        timeOfDay: 'night',
        note: 'Flashy urban street scene // coming soon.',
      },
    ],
  },

  SHINJUKU: {
    id: 'SHINJUKU',
    label: 'SHINJUKU',
    role: 'CITY',
    level: 'LV 4-5',
    baseCost: 1100,
    mapX: 0.223,
    mapY: 0.110,
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
    baseCost: 1300,
    mapX: 0.115,
    mapY: 0.743,
    description: 'A longer drive south for harbor-city cruising and powerful late-game builds.',
    locations: [
      {
        id: 'yokohamaRedBrick',
        label: 'RED BRICK',
        difficulty: 'HARD',
        costOffset: 0,
        available: false,
        timeOfDay: 'day',
        note: 'Red Brick Warehouse waterfront // coming soon.',
      },
      {
        id: 'yokohamaMinatoMirai',
        label: 'MINATO MIRAI',
        difficulty: 'HARD',
        costOffset: 100,
        available: false,
        timeOfDay: 'night',
        note: 'Yokohama skyline meet // coming soon.',
      },
      {
        id: 'yokohamaBayBridge',
        label: 'BAY BRIDGE',
        difficulty: 'ELITE',
        costOffset: 200,
        available: false,
        timeOfDay: 'night',
        note: 'High-speed harbor route // coming soon.',
      },
    ],
  },

  DAIKOKU: {
    id: 'DAIKOKU',
    label: 'DAIKOKU',
    role: 'HIGH STAKES',
    level: 'LV 5+',
    baseCost: 1600,
    mapX: 0.322,
    mapY: 0.681,
    description: 'Prestige meets with the strongest current cars, biggest bets and rare pink-slip opportunities.',
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
  'SHINJUKU',
  'YOKOHAMA',
  'DAIKOKU',
];

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
