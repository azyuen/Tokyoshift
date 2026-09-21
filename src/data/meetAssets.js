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
  WANGAN: {
    id: 'WANGAN',
    label: 'WANGAN',
    mapX: 0.28,
    mapY: 0.48,
  },
  DAIKOKU: {
    id: 'DAIKOKU',
    label: 'DAIKOKU',
    mapX: 0.72,
    mapY: 0.48,
  },
};

export const MEET_LOCATIONS = {
  wangan7eleven: {
    id: 'wangan7eleven',
    district: 'WANGAN',
    location: '7eleven',
    label: '7-ELEVEN',
    timeOfDay: 'night',
    difficulty: 'EASY',
    minRating: 2,
    maxRating: 3,
    rewardMultiplier: 1.0,
    bgKey: 'meetWangan7ElevenNight',
  },
  wanganBayside: {
    id: 'wanganBayside',
    district: 'WANGAN',
    location: 'bayside',
    label: 'BAYSIDE',
    timeOfDay: 'day',
    difficulty: 'MED',
    minRating: 3,
    maxRating: 4,
    rewardMultiplier: 1.35,
    bgKey: 'meetWanganBaysideDay',
  },
  wanganBridge: {
    id: 'wanganBridge',
    district: 'WANGAN',
    location: 'bridge',
    label: 'BRIDGE',
    timeOfDay: 'night',
    difficulty: 'HARD',
    minRating: 4,
    maxRating: 5,
    rewardMultiplier: 1.75,
    bgKey: 'meetWanganBridgeNight',
  },
  daikokuHarbor: {
    id: 'daikokuHarbor',
    district: 'DAIKOKU',
    location: 'harbor',
    label: 'HARBOR',
    timeOfDay: 'day',
    difficulty: 'MED',
    minRating: 3,
    maxRating: 4,
    rewardMultiplier: 1.4,
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
    minRating: 4,
    maxRating: 5,
    rewardMultiplier: 2.2,
    bgKey: 'meetDaikokuOpenLotNight',
  },
};

export const LOCATION_ORDER_BY_REGION = {
  WANGAN: ['wangan7eleven', 'wanganBayside', 'wanganBridge'],
  DAIKOKU: ['daikokuHarbor', 'daikokuPA', 'daikokuOpenLot'],
};

export const ALL_MEET_LOCATION_IDS = [
  ...LOCATION_ORDER_BY_REGION.WANGAN,
  ...LOCATION_ORDER_BY_REGION.DAIKOKU,
];

export function getMeetLocation(id) {
  return MEET_LOCATIONS[id] || MEET_LOCATIONS.wangan7eleven;
}

export function getTravelCost(fromId, toId) {
  const from = getMeetLocation(fromId);
  const to = getMeetLocation(toId);
  if (from.id === to.id) return 0;
  return from.district === to.district ? 500 : 2500;
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
