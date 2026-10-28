// TOKYO SHIFT — Professional Circuit foundation (Phase 1).
// Design contract: docs/DRAG_COMPLEX_BLUEPRINT.md.
// This module seeds persistent standings and declares future tournament formats.
// It does NOT simulate off-screen races, award points or replace legacy 3-race cups.
import { MAIN_RIVAL_BY_REGION } from './characters.js?v=20261007-r411';
import { getCrewCount, isCrewComplete, areAllCrewBattlesComplete } from './crewSystem.js?v=20261007-r413';

export const PRO_CIRCUIT_SCHEMA_VERSION = 3;
export const PRO_CIRCUIT_CREW_REQUIRED = 7;

// Deliberately stable identities: DO NOT regenerate names/IDs each time the
// player opens the venue. These drivers and teams will gain persistent records.
const GENERIC_DRIVER_NAMES = Object.freeze([
  'Takeshi Mori', 'Kenji Sato', 'Ayumi Tanaka', 'Kenta Okabe',
  'Shiori Nakamura', 'Yusuke Arata', 'Rina Okamoto', 'Daigo Endo',
  'Noriaki Ishida', 'Mei Kobayashi', 'Toru Hasegawa', 'Akari Kondo',
  'Shohei Inoue', 'Kazuya Noda', 'Mio Kurata', 'Hiroto Tachikawa',
  'Naomi Nishida', 'Keisuke Toda', 'Mai Hoshikawa', 'Shota Kishi',
  'Tsubasa Arai', 'Saki Fujita', 'Tomo Ueda', 'Haruka Sakai',
]);

const GENERIC_TEAM_NAMES = Object.freeze([
  'Night Vector', 'Kanto Velocity', 'Redline Syndicate', 'Apex Circuit',
  'Circuit Zero', 'Eastern Works', 'Carbon District', 'Wangan Motorsport',
  'Osaka Apex', 'Tokyo Precision', 'Silverline Racing', 'Neon Pulse',
  'Streetline Engineering', 'Blue Arc', 'Midnight Theory', 'Vertex Motorsport',
]);

// These are persistent standalone championships, not short season events.
// Drivers contest five live knockout stages; crews contest three full fixtures
// (nine personally driven heats). Masters changes racing format by fixture.
export const PRO_CIRCUIT_TROPHIES = Object.freeze([
  Object.freeze({ id:'shutoSpeed',label:'SHUTO SPEED TROPHY',discipline:'DRIVER',format:'FIVE_ROUND_KNOCKOUT',restriction:'OPEN',fixtures:5,season:1,entryFee:75000,prizeCash:230000,repeatCash:85000,description:'OPEN-CLASS SPEED GAUNTLET · FIVE KNOCKOUTS',stages:['QUALIFYING','ELIMINATION I','ELIMINATION II','SEMIFINAL','GRAND FINAL'] }),
  Object.freeze({ id:'tokyoTechnical',label:'TOKYO TECHNICAL TROPHY',discipline:'DRIVER',format:'FIVE_ROUND_KNOCKOUT',restriction:'POWER_CLASS_NOS_OFF',fixtures:5,season:1,entryFee:65000,prizeCash:215000,repeatCash:80000,maxPowerKW:260,noNos:true,description:'260 KW MAX · NO NOS · FIVE STAGES',stages:['SCRUTINEERING','QUALIFYING','ELIMINATION','SEMIFINAL','PRECISION FINAL'] }),
  Object.freeze({ id:'triDrive',label:'TRI-DRIVE TROPHY',discipline:'TEAM',format:'THREE_FIXTURE_SERIES',restriction:'DRIVETRAIN_DIVERSITY',fixtures:3,season:2,entryFee:85000,prizeCash:265000,repeatCash:90000,description:'THREE FIXTURES · FWD + RWD + AWD',formats:['DUEL','DUEL','DUEL'] }),
  Object.freeze({ id:'teamGrandPrix',label:'TEAM GRAND PRIX TROPHY',discipline:'TEAM',format:'THREE_FIXTURE_SERIES',restriction:'OPEN',fixtures:3,season:2,entryFee:100000,prizeCash:300000,repeatCash:100000,description:'THREE FULL 3V3 FIXTURES · NINE HEATS',formats:['DUEL','DUEL','DUEL'] }),
  Object.freeze({ id:'tokyoMasters',label:'TOKYO MASTERS TROPHY',discipline:'MIXED',format:'THREE_FIXTURE_GAUNTLET',restriction:'MIXED',fixtures:3,season:3,requiredTrophies:2,entryFee:125000,prizeCash:375000,repeatCash:125000,description:'INVITATIONAL · DUEL / RELAY / FOUR-WIDE',formats:['DUEL','RELAY','FOUR_WIDE'] }),
]);

export const PRO_CIRCUIT_CHAMPIONSHIPS = Object.freeze([
  Object.freeze({
    id: 'tokyoDrivers', label: "TOKYO DRIVERS' CHAMPIONSHIP", discipline: 'DRIVER',
    participants: 16, groups: 4, entrantsPerGroup: 4, qualifiersPerGroup: 2,
    knockoutEntrants: 8, registration: 'SAME_CAR_BETWEEN_ROUNDS',
  }),
  Object.freeze({
    id: 'tokyoCrews', label: 'TOKYO CREW CHAMPIONSHIP', discipline: 'TEAM',
    participants: 16, groups: 4, entrantsPerGroup: 4, qualifiersPerGroup: 2,
    knockoutEntrants: 8, squadSize: 5, fixtureDrivers: 3, fixtureWinsNeeded: 2,
  }),
]);

function value(source, key, fallback = null) {
  const found = source && typeof source.get === 'function'
    ? source.get(key)
    : source?.[key];
  return found == null ? fallback : found;
}

function boundedInteger(raw, fallback, min, max) {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
}

function safeObject(raw) {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

function createStanding(rating) {
  return { rating, seasonPoints: 0, entered: 0, wins: 0, losses: 0 };
}

function normaliseStanding(raw, reference) {
  const data = safeObject(raw);
  const base = safeObject(reference);
  return {
    ...base,
    rating: boundedInteger(data.rating, base.rating || 1400, 100, 3000),
    seasonPoints: boundedInteger(data.seasonPoints, base.seasonPoints || 0, 0, 1000000),
    entered: boundedInteger(data.entered, base.entered || 0, 0, 1000000),
    wins: boundedInteger(data.wins, base.wins || 0, 0, 1000000),
    losses: boundedInteger(data.losses, base.losses || 0, 0, 1000000),
  };
}

function createDriverRoster() {
  const entries = Object.entries(MAIN_RIVAL_BY_REGION).map(([regionId, characterId], index) => [
    'rival:' + characterId,
    {
      ...createStanding(1860 - index * 33),
      role: 'MAIN_RIVAL',
      characterId,
      regionId,
    },
  ]);
  // 24 competitors total: seven regional rivals, sixteen professionals, and the player.
  GENERIC_DRIVER_NAMES.slice(0, 16).forEach((name, index) => {
    entries.push([
      'pro:driver:' + String(index + 1).padStart(2, '0'),
      {
        ...createStanding(1740 - index * 22),
        role: 'PRO',
        name,
      },
    ]);
  });
  return Object.fromEntries(entries);
}

function createTeamRoster() {
  return Object.fromEntries([...GENERIC_TEAM_NAMES, ...GENERIC_DRIVER_NAMES.slice(16, 23)].map((name, index) => [
    'pro:team:' + String(index + 1).padStart(2, '0'),
    {
      ...createStanding(1770 - index * 28),
      name,
    },
  ]));
}

export function createDefaultProCircuitState() {
  return {
    schemaVersion: PRO_CIRCUIT_SCHEMA_VERSION,
    season: 1,
    eventTick: 0, // advances on completed in-game events, never wall-clock time
    seasonStatus: 'OPEN', // opt-in; OPEN -> ACTIVE -> COMPLETE, or OPEN on forfeit
    openCircuitTick: 0, // successful standalone event completions only
    minorTrophyIndex: 0,
    minorTrophyCooldownUntil: 0,
    crewAdviceCooldownUntil: 0, // eventTick after this event + two OTHER completions
    qualified: false, // Phase 2 sets this after the professional qualifier
    playerDriver: createStanding(1400),
    playerTeam: createStanding(1400),
    drivers: createDriverRoster(),
    teams: createTeamRoster(),
    completedEventIds: [],
    activeCrewEvent: null,
    lastCrewEvent: null,
    crewSeriesWins: 0,
    calendar: { round: 0, history: [], result: null, archives: [] },
    activeTournament: null,
    activeTimedEvent: null,
    lastTournament: null,
    activeChampionship: null,
    championshipHistory: [],
    championshipSettledIds: [], // Permanent once-only reward ledger.
    tokyoChampionWins: 0,
    careerCompleted: false,
    trophyWins: Object.fromEntries(PRO_CIRCUIT_TROPHIES.map(t => [t.id, 0])),
    trophyHistory: [],
    championshipWins: { DRIVER: 0, TEAM: 0 },
  };
}

// Unrecognised entries are preserved to allow subsequent game builds to add
// professional racers without deleting their progress from old save files.
function normaliseRoster(raw, initial) {
  const stored = safeObject(raw);
  const candidates = new Set([...Object.keys(initial), ...Object.keys(stored).slice(0, 128)]);
  return Object.fromEntries([...candidates].filter(id => id.length < 80).map(id => {
    const base = initial[id] || {
      ...createStanding(1400),
      role: 'PRO',
      name: String(stored[id]?.name || id).slice(0, 80),
    };
    return [id, normaliseStanding(stored[id], base)];
  }));
}

export function normaliseProCircuitState(raw) {
  const initial = createDefaultProCircuitState();
  const source = safeObject(raw);
  const trophies = safeObject(source.trophyWins);
  const championships = safeObject(source.championshipWins);
  // Existing fully recorded unified Tokyo titles predate the v1 dedicated
  // trophy counter. Restore that fact without granting any unearned titles
  // from obsolete, separate Driver/Crew championship placeholders.
  const legacyTokyoTitles=Array.isArray(source.championshipHistory)?
    source.championshipHistory.filter(h=>h&&h.championId==='player:driver'&&
      (!h.id||String(h.id).startsWith('tokyo:s'))).length:0;
  const tokyoTitles=boundedInteger(source.tokyoChampionWins,legacyTokyoTitles,0,10000);
  // Existing careers have already entered seasons implicitly. Preserve their
  // progress rather than moving them back into the new OPEN pre-season state.
  const legacySeasonStarted = Number(source.calendar?.round || 0) > 0 ||
    Boolean(source.calendar?.history?.length) ||
    Number(source.playerDriver?.seasonPoints || 0) > 0 ||
    Number(source.playerTeam?.seasonPoints || 0) > 0 ||
    Boolean(source.activeCrewEvent || source.activeTournament || source.activeTimedEvent ||
      source.activeChampionship);
  const legacyStatus = Number(source.calendar?.round || 0) >= 8
    ? 'COMPLETE' : legacySeasonStarted ? 'ACTIVE' : 'OPEN';
  const seasonStatus = ['OPEN', 'ACTIVE', 'COMPLETE'].includes(source.seasonStatus)
    ? source.seasonStatus : legacyStatus;
  return {
    schemaVersion: PRO_CIRCUIT_SCHEMA_VERSION,
    season: boundedInteger(source.season, 1, 1, 10000),
    eventTick: boundedInteger(source.eventTick, 0, 0, 10000000),
    seasonStatus,
    openCircuitTick: boundedInteger(source.openCircuitTick, 0, 0, 10000000),
    minorTrophyIndex: boundedInteger(source.minorTrophyIndex, 0, 0, PRO_CIRCUIT_TROPHIES.length - 1),
    minorTrophyCooldownUntil: boundedInteger(source.minorTrophyCooldownUntil, 0, 0, 10000000),
    crewAdviceCooldownUntil: boundedInteger(source.crewAdviceCooldownUntil, 0, 0, 10000000),
    qualified: Boolean(source.qualified),
    playerDriver: normaliseStanding(source.playerDriver, initial.playerDriver),
    playerTeam: normaliseStanding(source.playerTeam, initial.playerTeam),
    drivers: normaliseRoster(source.drivers, initial.drivers),
    teams: normaliseRoster(source.teams, initial.teams),
    completedEventIds: Array.isArray(source.completedEventIds)
      ? [...new Set(source.completedEventIds.filter(id => typeof id === 'string').slice(-250))]
      : [],
    activeCrewEvent: source.activeCrewEvent && typeof source.activeCrewEvent === 'object' && !Array.isArray(source.activeCrewEvent) ? source.activeCrewEvent : null,
    lastCrewEvent: source.lastCrewEvent && typeof source.lastCrewEvent === 'object' && !Array.isArray(source.lastCrewEvent) ? source.lastCrewEvent : null,
    crewSeriesWins: boundedInteger(source.crewSeriesWins, 0, 0, 1000000),
    calendar: {
      round: boundedInteger(source.calendar?.round, 0, 0, 8),
      history: Array.isArray(source.calendar?.history) ? source.calendar.history.filter(e => e && typeof e.id === 'string').slice(-8) : [],
      result: source.calendar?.result && typeof source.calendar.result === 'object' ? source.calendar.result : null,
      archives: Array.isArray(source.calendar?.archives) ? source.calendar.archives.filter(e => e && typeof e === 'object').slice(-20) : [],
    },
    // Preserve future/legacy saved bracket structures; the Phase 2 runner
    // separately validates its own eventId and expected heat before starting.
    activeTournament: source.activeTournament && typeof source.activeTournament === 'object' &&
      !Array.isArray(source.activeTournament) ? source.activeTournament : null,
    activeTimedEvent: source.activeTimedEvent && typeof source.activeTimedEvent === 'object' && !Array.isArray(source.activeTimedEvent) ? source.activeTimedEvent : null,
    lastTournament: source.lastTournament && typeof source.lastTournament === 'object' &&
      !Array.isArray(source.lastTournament) ? source.lastTournament : null,
    activeChampionship: source.activeChampionship && typeof source.activeChampionship === 'object' && !Array.isArray(source.activeChampionship) ? source.activeChampionship : null,
    championshipHistory: Array.isArray(source.championshipHistory) ? source.championshipHistory.filter(x => x && typeof x === 'object').slice(-20) : [],
    championshipSettledIds: Array.isArray(source.championshipSettledIds)?
      [...new Set(source.championshipSettledIds.filter(id=>typeof id==='string'&&id.startsWith('tokyo:s')))].slice(-250):[],
    tokyoChampionWins: tokyoTitles,
    careerCompleted: Boolean(source.careerCompleted)||tokyoTitles>0,
    trophyWins: Object.fromEntries(PRO_CIRCUIT_TROPHIES.map(t => [
      t.id, boundedInteger(trophies[t.id], 0, 0, 10000),
    ])),
    trophyHistory: Array.isArray(source.trophyHistory) ? source.trophyHistory.filter(h => h && typeof h.id === 'string' && PRO_CIRCUIT_TROPHIES.some(t=>t.id===h.trophyId)).slice(-100) : [],
    championshipWins: {
      DRIVER: boundedInteger(championships.DRIVER, 0, 0, 10000),
      TEAM: boundedInteger(championships.TEAM, 0, 0, 10000),
    },
  };
}

export function getProCircuitAccess(source) {
  const count = getCrewCount(source);
  const isDev = Boolean(value(source, 'devMode', false));
  const joinedName = (
    String(value(source, 'firstName', '')).trim().toLowerCase() +
    String(value(source, 'lastName', '')).trim().toLowerCase()
  ).replace(/[^a-z0-9]/g, '');
  const invited = value(source, 'centralTokyoUnlocks', {}) || {};
  const unlocked = isDev || joinedName === 'arkonden' || (
    isCrewComplete(source) && areAllCrewBattlesComplete(source) && Boolean(invited.ginza || invited.drag)
  );
  return {
    unlocked,
    crewCount: count,
    crewRequired: PRO_CIRCUIT_CREW_REQUIRED,
    reason: unlocked ? 'PRO CIRCUIT ACCESS GRANTED' :
      !isCrewComplete(source) ? 'RECRUIT ALL 7 CREW MEMBERS' :
      !areAllCrewBattlesComplete(source) ? 'WIN ALL 7 REGIONAL CREW BATTLES' :
      'AWAIT PROFESSIONAL INVITATION',
  };
}

function seededRows(state, kind) {
  const source = normaliseProCircuitState(state);
  const rows = kind === 'TEAM'
    ? [['player:team', source.playerTeam], ...Object.entries(source.teams)]
    : [['player:driver', source.playerDriver], ...Object.entries(source.drivers)];
  return rows
    .map(([id, standing]) => ({ id, ...standing }))
    .sort((a, b) =>
      b.rating - a.rating ||
      b.seasonPoints - a.seasonPoints ||
      a.id.localeCompare(b.id)
    )
    .map((record, index) => ({ ...record, seed: index + 1 }));
}

// Sponsorship is tied to the same persistent Pro Rank across Open Circuit
// and the eight-round Season. Only paid event purses receive commission:
// fees, racing performance, season points and championship seeds are unchanged.
// Lock the rate to the player's standing BEFORE the event is settled.
export function getProPrizeBonusPercent(rank) {
  const place = Number(rank);
  if (!Number.isInteger(place) || place < 1) return 0;
  if (place === 1) return 100;
  if (place <= 3) return 75;
  if (place <= 5) return 50;
  if (place <= 10) return 30;
  if (place <= 14) return 15;
  return 0;
}

export function getProPrizeWithBonus(cashPrize, rank) {
  const basePrize = Number.isFinite(Number(cashPrize))
    ? Math.max(0, Math.floor(Number(cashPrize))) : 0;
  const bonusPercent = getProPrizeBonusPercent(rank);
  const bonusCash = Math.floor(basePrize * bonusPercent / 100);
  return { basePrize, bonusPercent, bonusCash, totalPrize: basePrize + bonusCash };
}

export function getProCircuitDriverSeeds(proCircuit) {
  return seededRows(proCircuit, 'DRIVER');
}

export function getProCircuitTeamSeeds(proCircuit) {
  return seededRows(proCircuit, 'TEAM');
}
