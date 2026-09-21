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
    description: 'Your home workshop on the bay side. Tune, save and manage your garage here.',
    locations: [
      {
        id: 'shinonomeWorkshop',
        label: 'WORKSHOP',
        difficulty: 'HOME',
        kind: 'home',
        costOffset: 0,
        available: true,
        note: 'Tune cars, save your run and manage the garage.',
      },
      {
        id: 'shinonomeCanalYard',
        label: 'CANAL YARD',
        difficulty: 'EASY',
        costOffset: 0,
        available: false,
        note: 'Local Shinonome meet // coming soon.',
      },
      {
        id: 'shinonomeWarehouseStrip',
        label: 'WAREHOUSE STRIP',
        difficulty: 'EASY',
        costOffset: 100,
        available: false,
        note: 'Warehouse-side local meet // coming soon.',
      },
    ],
  },

  ODAIBA: {
    id: 'ODAIBA',
    label: 'ODAIBA',
    role: 'BEGINNER',
    level: 'LV 1-2',
    baseCost: 300,
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
        note: 'Cheap local races and a forgiving starter crowd.',
      },
      {
        id: 'odaibaGundamPlaza',
        label: 'GUNDAM PLAZA',
        difficulty: 'EASY',
        costOffset: 100,
        available: true,
        note: 'Popular public meet in front of DiverCity.',
      },
      {
        id: 'odaibaMiraikan',
        label: 'MIRAIKAN',
        difficulty: 'MED',
        costOffset: 200,
        available: true,
        note: 'A small step up from Odaiba\'s starter spots.',
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
    description: 'Bay-side city roads between central Tokyo and the waterfront.',
    locations: [
      {
        id: 'shinagawaTennozu',
        label: 'TENNOZU ISLE',
        difficulty: 'MED',
        costOffset: 0,
        available: false,
        note: 'Canals and elevated roads // coming soon.',
      },
      {
        id: 'shinagawaKonan',
        label: 'KONAN',
        difficulty: 'MED',
        costOffset: 100,
        available: false,
        note: 'Office district night meet // coming soon.',
      },
      {
        id: 'shinagawaOiWharf',
        label: 'OI WHARF',
        difficulty: 'HARD',
        costOffset: 200,
        available: false,
        note: 'Industrial waterfront run // coming soon.',
      },
    ],
  },

  TATSUMI: {
    id: 'TATSUMI',
    label: 'TATSUMI',
    role: 'BAY EXPRESSWAY',
    level: 'LV 2-3',
    baseCost: 600,
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
        note: 'Open overlook meet with a mixed crowd.',
      },
      {
        id: 'tatsumiSkylineVista',
        label: 'SKYLINE VISTA',
        difficulty: 'HARD',
        costOffset: 100,
        available: true,
        note: 'Faster cars and more experienced drivers.',
      },
      {
        id: 'tatsumiHarborLoop',
        label: 'HARBOR LOOP',
        difficulty: 'ELITE',
        costOffset: 200,
        available: true,
        note: 'The hardest current Tatsumi meet.',
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
    description: 'Dense central-city streets, bright lights and polished street builds.',
    locations: [
      {
        id: 'shibuyaScramble',
        label: 'SCRAMBLE',
        difficulty: 'MED',
        costOffset: 0,
        available: false,
        note: 'Shibuya crossing district // coming soon.',
      },
      {
        id: 'shibuyaDogenzaka',
        label: 'DOGENZAKA',
        difficulty: 'HARD',
        costOffset: 100,
        available: false,
        note: 'Hill-side nightlife streets // coming soon.',
      },
      {
        id: 'shibuyaCenterGai',
        label: 'CENTER-GAI',
        difficulty: 'HARD',
        costOffset: 200,
        available: false,
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
        id: 'shinjukuKabukicho',
        label: 'KABUKICHO',
        difficulty: 'HARD',
        costOffset: 0,
        available: false,
        note: 'Neon nightlife district // coming soon.',
      },
      {
        id: 'shinjukuSouthExit',
        label: 'SOUTH EXIT',
        difficulty: 'HARD',
        costOffset: 100,
        available: false,
        note: 'Station-side city meet // coming soon.',
      },
      {
        id: 'shinjukuNishi',
        label: 'NISHI-SHINJUKU',
        difficulty: 'ELITE',
        costOffset: 200,
        available: false,
        note: 'Skyscraper district challenge // coming soon.',
      },
    ],
  },

  YOKOHAMA: {
    id: 'YOKOHAMA',
    label: 'YOKOHAMA',
    role: 'HARBOR CITY',
    level: 'LV 4-5',
    baseCost: 1200,
    mapX: 0.115,
    mapY: 0.743,
    description: 'A longer drive south for harbor-city cruising and powerful builds.',
    locations: [
      {
        id: 'yokohamaRedBrick',
        label: 'RED BRICK',
        difficulty: 'HARD',
        costOffset: 0,
        available: false,
        note: 'Red Brick Warehouse waterfront // coming soon.',
      },
      {
        id: 'yokohamaMinatoMirai',
        label: 'MINATO MIRAI',
        difficulty: 'HARD',
        costOffset: 100,
        available: false,
        note: 'Yokohama skyline meet // coming soon.',
      },
      {
        id: 'yokohamaBayBridge',
        label: 'BAY BRIDGE',
        difficulty: 'ELITE',
        costOffset: 200,
        available: false,
        note: 'High-speed harbor route // coming soon.',
      },
    ],
  },

  DAIKOKU: {
    id: 'DAIKOKU',
    label: 'DAIKOKU',
    role: 'HIGH STAKES',
    level: 'LV 5+',
    baseCost: 1500,
    mapX: 0.322,
    mapY: 0.681,
    description: 'The toughest current destination. Big cars, big bets and serious rivals.',
    locations: [
      {
        id: 'daikokuPA',
        label: 'PA',
        difficulty: 'HARD',
        costOffset: 0,
        available: true,
        note: 'The iconic parking-area meet.',
      },
      {
        id: 'daikokuHarbor',
        label: 'HARBOR',
        difficulty: 'HARD',
        costOffset: 100,
        available: true,
        note: 'Harbor-side racers with stronger builds.',
      },
      {
        id: 'daikokuOpenLot',
        label: 'OPEN LOT',
        difficulty: 'ELITE',
        costOffset: 200,
        available: true,
        note: 'Current end-game meet and highest stakes.',
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

  if (currentLocationId === targetLocationId) return 0;

  if (fromWorkshop) {
    return target.region.baseCost + Number(target.costOffset || 0);
  }

  const current = getTravelLocation(currentLocationId);
  if (current && current.regionId === target.regionId) {
    return LOCAL_MOVE_COST + Number(target.costOffset || 0);
  }

  return target.region.baseCost + Number(target.costOffset || 0);
}
