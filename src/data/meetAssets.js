const BACKGROUND_ROOT = 'assets/Meet/Backgrounds';

const slug = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

export function meetBackgroundPath(district, location, timeOfDay) {
  return `${BACKGROUND_ROOT}/${slug(district)}_${slug(location)}_${slug(timeOfDay)}.png`;
}

export const MEET_REGIONS = {
  ODAIBA: {
    id: 'ODAIBA',
    label: 'ODAIBA',
    mapX: 0.20,
    mapY: 0.48,
  },
  TATSUMI: {
    id: 'TATSUMI',
    label: 'TATSUMI',
    mapX: 0.50,
    mapY: 0.48,
  },
  DAIKOKU: {
    id: 'DAIKOKU',
    label: 'DAIKOKU',
    mapX: 0.80,
    mapY: 0.48,
  },
};

export const MEET_LOCATIONS = {
  odaiba7eleven: {
    id: 'odaiba7eleven',
    district: 'ODAIBA',
    location: '7eleven',
    label: '7-ELEVEN',
    timeOfDay: 'night',
    difficulty: 'EASY',
    minRating: 2,
    maxRating: 2,
    rewardMultiplier: 1.0,
    bgKey: 'meetOdaiba7ElevenNight',
  },
  odaibaGundamPlaza: {
    id: 'odaibaGundamPlaza',
    district: 'ODAIBA',
    location: 'gundam_plaza',
    label: 'GUNDAM PLAZA',
    timeOfDay: 'day',
    difficulty: 'EASY',
    minRating: 2,
    maxRating: 3,
    rewardMultiplier: 1.1,
    bgKey: 'meetOdaibaGundamPlazaDay',
  },
  odaibaMiraikan: {
    id: 'odaibaMiraikan',
    district: 'ODAIBA',
    location: 'miraikan',
    label: 'MIRAIKAN',
    timeOfDay: 'night',
    difficulty: 'MED',
    minRating: 2,
    maxRating: 3,
    rewardMultiplier: 1.25,
    bgKey: 'meetOdaibaMiraikanNight',
  },

  tatsumiBridgefrontPlaza: {
    id: 'tatsumiBridgefrontPlaza',
    district: 'TATSUMI',
    location: 'bridgefront_plaza',
    label: 'BRIDGEFRONT PLAZA',
    timeOfDay: 'day',
    difficulty: 'MED',
    minRating: 3,
    maxRating: 3,
    rewardMultiplier: 1.35,
    bgKey: 'meetTatsumiBridgefrontPlazaDay',
  },
  tatsumiSkylineVista: {
    id: 'tatsumiSkylineVista',
    district: 'TATSUMI',
    location: 'skyline_vista',
    label: 'SKYLINE VISTA',
    timeOfDay: 'night',
    difficulty: 'MED',
    minRating: 3,
    maxRating: 4,
    rewardMultiplier: 1.5,
    bgKey: 'meetTatsumiSkylineVistaNight',
  },
  tatsumiHarborLoop: {
    id: 'tatsumiHarborLoop',
    district: 'TATSUMI',
    location: 'harbor_loop',
    label: 'HARBOR LOOP',
    timeOfDay: 'twilight',
    difficulty: 'HARD',
    minRating: 3,
    maxRating: 4,
    rewardMultiplier: 1.7,
    bgKey: 'meetTatsumiHarborLoopTwilight',
  },

  daikokuHarbor: {
    id: 'daikokuHarbor',
    district: 'DAIKOKU',
    location: 'harbor',
    label: 'HARBOR',
    timeOfDay: 'day',
    difficulty: 'ELITE',
    minRating: 4,
    maxRating: 5,
    rewardMultiplier: 2.0,
    bgKey: 'meetDaikokuHarborDay',
  },
  daikokuPA: {
    id: 'daikokuPA',
    district: 'DAIKOKU',
    location: 'pa',
    label: 'PA',
    timeOfDay: 'twilight',
    difficulty: 'HARD',
    minRating: 4,
    maxRating: 5,
    rewardMultiplier: 1.8,
    bgKey: 'meetDaikokuPATwilight',
  },
  daikokuOpenLot: {
    id: 'daikokuOpenLot',
    district: 'DAIKOKU',
    location: 'open_lot',
    label: 'OPEN LOT',
    timeOfDay: 'night',
    difficulty: 'ELITE',
    minRating: 5,
    maxRating: 5,
    rewardMultiplier: 2.2,
    bgKey: 'meetDaikokuOpenLotNight',
  },
};

export const LOCATION_ORDER_BY_REGION = {
  ODAIBA: ['odaiba7eleven', 'odaibaGundamPlaza', 'odaibaMiraikan'],
  TATSUMI: ['tatsumiBridgefrontPlaza', 'tatsumiSkylineVista', 'tatsumiHarborLoop'],
  DAIKOKU: ['daikokuPA', 'daikokuHarbor', 'daikokuOpenLot'],
};

export const ALL_MEET_LOCATION_IDS = [
  ...LOCATION_ORDER_BY_REGION.ODAIBA,
  ...LOCATION_ORDER_BY_REGION.TATSUMI,
  ...LOCATION_ORDER_BY_REGION.DAIKOKU,
];

export function getMeetLocation(id) {
  return MEET_LOCATIONS[id] || MEET_LOCATIONS.odaiba7eleven;
}

export const LOCAL_TRAVEL_COST = 200;
export const DISTRICT_TRAVEL_COST = 1000;
export const WORKSHOP_RETURN_COST = 500;

export function getTravelCost(fromId, toId) {
  const from = getMeetLocation(fromId);
  const to = getMeetLocation(toId);
  if (from.id === to.id) return 0;
  return from.district === to.district ? LOCAL_TRAVEL_COST : DISTRICT_TRAVEL_COST;
}

export function getWorkshopDepartureCost(currentLocationId, toId) {
  const current = getMeetLocation(currentLocationId);
  const to = getMeetLocation(toId);
  return current.district === to.district ? LOCAL_TRAVEL_COST : DISTRICT_TRAVEL_COST;
}

export const meetBackgrounds = ALL_MEET_LOCATION_IDS.map(id => {
  const item = MEET_LOCATIONS[id];
  return {
    ...item,
    key: item.bgKey,
    path: meetBackgroundPath(item.district, item.location, item.timeOfDay),
    label: `${item.district} // ${item.label}`,
  };
});
