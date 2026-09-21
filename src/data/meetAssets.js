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
  SHINAGAWA: {
    id: 'SHINAGAWA',
    label: 'SHINAGAWA',
    mapX: 0.32,
    mapY: 0.48,
  },
  TATSUMI: {
    id: 'TATSUMI',
    label: 'TATSUMI',
    mapX: 0.44,
    mapY: 0.48,
  },
  SHIBUYA: {
    id: 'SHIBUYA',
    label: 'SHIBUYA',
    mapX: 0.56,
    mapY: 0.48,
  },
  YOKOHAMA: {
    id: 'YOKOHAMA',
    label: 'YOKOHAMA',
    mapX: 0.68,
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

  shinagawaTennozu: {
    id: 'shinagawaTennozu',
    district: 'SHINAGAWA',
    location: 'tennozu_isle',
    label: 'TENNOZU ISLE',
    timeOfDay: 'day',
    difficulty: 'EASY',
    minRating: 2,
    maxRating: 3,
    rewardMultiplier: 1.1,
    bgKey: 'meetShinagawaTennozuIsleDay',
    backgroundPath: 'assets/Meet/shinagawa_tennozu_isle_day.png',
  },
  shinagawaKonan: {
    id: 'shinagawaKonan',
    district: 'SHINAGAWA',
    location: 'konan',
    label: 'KONAN',
    timeOfDay: 'night',
    difficulty: 'MED',
    minRating: 2,
    maxRating: 3,
    rewardMultiplier: 1.3,
    bgKey: 'meetShinagawaKonanNight',
    backgroundPath: 'assets/Meet/shinagawa_konan_night.png',
  },
  shinagawaOiWharf: {
    id: 'shinagawaOiWharf',
    district: 'SHINAGAWA',
    location: 'oi_wharf',
    label: 'OI WHARF',
    timeOfDay: 'twilight',
    difficulty: 'MED',
    minRating: 3,
    maxRating: 3,
    rewardMultiplier: 1.4,
    bgKey: 'meetShinagawaOiWharfTwilight',
    backgroundPath: 'assets/Meet/shinagawa_oi_wharf_twilight.png',
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

  shibuyaScramble: {
    id: 'shibuyaScramble',
    district: 'SHIBUYA',
    location: 'scramble',
    label: 'SCRAMBLE',
    timeOfDay: 'night',
    difficulty: 'MED',
    minRating: 3,
    maxRating: 4,
    rewardMultiplier: 1.55,
    bgKey: 'meetShibuyaScrambleNight',
    backgroundPath: 'assets/Meet/shibuya_scramble_night.png',
  },
  shibuyaDogenzaka: {
    id: 'shibuyaDogenzaka',
    district: 'SHIBUYA',
    location: 'dogenzaka',
    label: 'DOGENZAKA',
    timeOfDay: 'day',
    difficulty: 'HARD',
    minRating: 3,
    maxRating: 4,
    rewardMultiplier: 1.75,
    bgKey: 'meetShibuyaDogenzakaDay',
    backgroundPath: 'assets/Meet/shibuya_dogenzaka_day.png',
  },
  shibuyaCenterGai: {
    id: 'shibuyaCenterGai',
    district: 'SHIBUYA',
    location: 'center_gai',
    label: 'CENTER-GAI',
    timeOfDay: 'night',
    difficulty: 'HARD',
    minRating: 4,
    maxRating: 4,
    rewardMultiplier: 1.85,
    bgKey: 'meetShibuyaCenterGaiNight',
    backgroundPath: 'assets/Meet/shibuya_center_gai_night.png',
  },

  yokohamaRedBrick: {
    id: 'yokohamaRedBrick',
    district: 'YOKOHAMA',
    location: 'red_brick',
    label: 'RED BRICK',
    timeOfDay: 'day',
    difficulty: 'HARD',
    minRating: 4,
    maxRating: 4,
    rewardMultiplier: 1.85,
    bgKey: 'meetYokohamaRedBrickDay',
    backgroundPath: 'assets/Meet/yokohama_red_brick_day.png',
  },
  yokohamaMinatoMirai: {
    id: 'yokohamaMinatoMirai',
    district: 'YOKOHAMA',
    location: 'minato_mirai',
    label: 'MINATO MIRAI',
    timeOfDay: 'night',
    difficulty: 'HARD',
    minRating: 4,
    maxRating: 5,
    rewardMultiplier: 2.0,
    bgKey: 'meetYokohamaMinatoMiraiNight',
    backgroundPath: 'assets/Meet/yokohama_minato_mirai_night.PNG',
  },
  yokohamaBayBridge: {
    id: 'yokohamaBayBridge',
    district: 'YOKOHAMA',
    location: 'bay_bridge',
    label: 'BAY BRIDGE',
    timeOfDay: 'night',
    difficulty: 'ELITE',
    minRating: 4,
    maxRating: 5,
    rewardMultiplier: 2.15,
    bgKey: 'meetYokohamaBayBridgeNight',
    backgroundPath: 'assets/Meet/yokohama_bay_bridge_night.PNG',
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
  SHINAGAWA: ['shinagawaTennozu', 'shinagawaKonan', 'shinagawaOiWharf'],
  TATSUMI: ['tatsumiBridgefrontPlaza', 'tatsumiSkylineVista', 'tatsumiHarborLoop'],
  SHIBUYA: ['shibuyaScramble', 'shibuyaDogenzaka', 'shibuyaCenterGai'],
  YOKOHAMA: ['yokohamaRedBrick', 'yokohamaMinatoMirai', 'yokohamaBayBridge'],
  DAIKOKU: ['daikokuPA', 'daikokuHarbor', 'daikokuOpenLot'],
};

export const ALL_MEET_LOCATION_IDS = Object.values(LOCATION_ORDER_BY_REGION).flat();

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
    path: item.backgroundPath || meetBackgroundPath(item.district, item.location, item.timeOfDay),
    label: `${item.district} // ${item.label}`,
  };
});
