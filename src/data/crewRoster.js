// Post-regional recruitment roster.
//
// This table defines recruitable candidates and signature-car mapping. The
// later 6-on-6 crew battle reuses the original seven-race regional championship
// cast, then removes the driver who defected to the player's crew.

export const CREW_REGIONS = Object.freeze([
  'ODAIBA',
  'SHINAGAWA',
  'TATSUMI',
  'SHIBUYA',
  'YOKOHAMA',
  'DAIKOKU',
  'SHINJUKU',
]);

export const REGIONAL_CREW_ROSTERS = Object.freeze({
  ODAIBA: Object.freeze({
    mainRivalId: 'emiKanzaki',
    members: Object.freeze([
      Object.freeze({ characterId: 'aoiShindou', baseCarId: 'ej1', recruitable: true }),
      Object.freeze({ characterId: 'yutoAsakura', baseCarId: 'ae86', recruitable: true }),
      Object.freeze({ characterId: 'mikaHoshino', baseCarId: 'ef', recruitable: true }),
      Object.freeze({ characterId: 'kaoriNishimura', baseCarId: 'a60', recruitable: true }),
      Object.freeze({ characterId: 'shunAmamiya', baseCarId: 'fc3s', recruitable: true }),
      Object.freeze({ characterId: 'emiKanzaki', baseCarId: 'ek9', recruitable: false, leader: true }),
    ]),
  }),

  SHINAGAWA: Object.freeze({
    mainRivalId: 'renMizuno',
    members: Object.freeze([
      Object.freeze({ characterId: 'akiraShimizu', baseCarId: 'ae86', recruitable: true }),
      Object.freeze({ characterId: 'natsumiKagawa', baseCarId: 'ef', recruitable: true }),
      Object.freeze({ characterId: 'reiTakamura', baseCarId: 'a60', recruitable: true }),
      Object.freeze({ characterId: 'goroNakajima', baseCarId: 'ek9', recruitable: true }),
      Object.freeze({ characterId: 'tetsuyaKanda', baseCarId: 'fc3s', recruitable: true }),
      Object.freeze({ characterId: 'renMizuno', baseCarId: 'rx8', recruitable: false, leader: true }),
    ]),
  }),

  TATSUMI: Object.freeze({
    mainRivalId: 'kaitoFujimori',
    members: Object.freeze([
      Object.freeze({ characterId: 'sotaKisaragi', baseCarId: 'a60', recruitable: true }),
      Object.freeze({ characterId: 'yuiNaruse', baseCarId: 'ek9', recruitable: true }),
      Object.freeze({ characterId: 'daigoMoriyama', baseCarId: 'fc3s', recruitable: true }),
      Object.freeze({ characterId: 'risaTachikawa', baseCarId: 'rx8', recruitable: true }),
      Object.freeze({ characterId: 'masatoKurogane', baseCarId: 's2000', recruitable: true }),
      Object.freeze({ characterId: 'kaitoFujimori', baseCarId: 'evo3', recruitable: false, leader: true }),
    ]),
  }),

  SHIBUYA: Object.freeze({
    mainRivalId: 'ayaKurose',
    members: Object.freeze([
      Object.freeze({ characterId: 'haruSakurai', baseCarId: 'fc3s', recruitable: true }),
      Object.freeze({ characterId: 'miuTanaka', baseCarId: 'ek9', recruitable: true }),
      Object.freeze({ characterId: 'renjiAoki', baseCarId: 'rx8', recruitable: true }),
      Object.freeze({ characterId: 'kentoFujisawa', baseCarId: 's2000', recruitable: true }),
      Object.freeze({ characterId: 'rinaTachibana', baseCarId: 'evo3', recruitable: true }),
      Object.freeze({ characterId: 'ayaKurose', baseCarId: 'r32', recruitable: false, leader: true }),
    ]),
  }),

  YOKOHAMA: Object.freeze({
    mainRivalId: 'masatoIshikawa',
    members: Object.freeze([
      Object.freeze({ characterId: 'mikaHayase', baseCarId: 'rx8', recruitable: true }),
      Object.freeze({ characterId: 'reinaKuroda', baseCarId: 's2000', recruitable: true }),
      Object.freeze({ characterId: 'ryoheiTakeda', baseCarId: 'evo3', recruitable: true }),
      Object.freeze({ characterId: 'shunMizuno', baseCarId: 'rx7fd', recruitable: true }),
      Object.freeze({ characterId: 'yuiKanzaki', baseCarId: 'evo5', recruitable: true }),
      Object.freeze({ characterId: 'masatoIshikawa', baseCarId: 'r32', recruitable: false, leader: true }),
    ]),
  }),

  DAIKOKU: Object.freeze({
    mainRivalId: 'reinaShibata',
    members: Object.freeze([
      Object.freeze({ characterId: 'shoNakamura', baseCarId: 's2000', recruitable: true }),
      Object.freeze({ characterId: 'miloArai', baseCarId: 'evo3', recruitable: true }),
      Object.freeze({ characterId: 'naoFujita', baseCarId: 'r32', recruitable: true }),
      Object.freeze({ characterId: 'akiSenda', baseCarId: 'rx7fd', recruitable: true }),
      Object.freeze({ characterId: 'tetsuoMori', baseCarId: 'nsx', recruitable: true }),
      Object.freeze({ characterId: 'reinaShibata', baseCarId: '3000gt', recruitable: false, leader: true }),
    ]),
  }),

  SHINJUKU: Object.freeze({
    mainRivalId: 'daigoArakawa',
    members: Object.freeze([
      Object.freeze({ characterId: 'emiSaionji', baseCarId: 'wrx22b', recruitable: true }),
      Object.freeze({ characterId: 'kaedeTachibana', baseCarId: 'evo5', recruitable: true }),
      Object.freeze({ characterId: 'renKurosawa', baseCarId: 'evo6', recruitable: true }),
      Object.freeze({ characterId: 'rinAmamiya', baseCarId: 'jza80', recruitable: true }),
      Object.freeze({ characterId: 'soraKanzaki', baseCarId: 'r34', recruitable: true }),
      Object.freeze({ characterId: 'daigoArakawa', baseCarId: '3000gt', recruitable: false, leader: true }),
    ]),
  }),
});

export const CREW_CHARACTER_CARS = Object.freeze(
  Object.fromEntries(
    CREW_REGIONS.flatMap(regionId =>
      REGIONAL_CREW_ROSTERS[regionId].members
        .filter(member => member.recruitable)
        .map(member => [member.characterId, member.baseCarId])
    )
  )
);

export function getRegionalCrewRoster(regionId) {
  return REGIONAL_CREW_ROSTERS[String(regionId || '').toUpperCase()] || null;
}

export function getRegionalMainRivalId(regionId) {
  return getRegionalCrewRoster(regionId)?.mainRivalId || null;
}

export function getRecruitableRegionalMembers(regionId) {
  return (getRegionalCrewRoster(regionId)?.members || [])
    .filter(member => member.recruitable)
    .map(member => ({ ...member }));
}

export function getCrewBaseCarId(characterId) {
  return CREW_CHARACTER_CARS[String(characterId || '')] || null;
}

export function getCrewLoanCarId(characterId) {
  return 'crew__' + String(characterId || '').replace(/[^a-zA-Z0-9]/g, '');
}

export function isCrewLoanCarId(carId) {
  return String(carId || '').startsWith('crew__');
}
