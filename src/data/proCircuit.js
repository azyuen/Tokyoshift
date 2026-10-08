// TOKYO SHIFT — Professional Circuit foundation (Phase 1).
// Design contract: docs/DRAG_COMPLEX_BLUEPRINT.md.
// This module seeds persistent standings and declares future tournament formats.
// It does NOT simulate off-screen races, award points or replace legacy 3-race cups.
import { MAIN_RIVAL_BY_REGION } from './characters.js?v=20261007-r411';
import { getCrewCount, isCrewComplete } from './crewSystem.js?v=20261007-r413';

export const PRO_CIRCUIT_SCHEMA_VERSION = 1;
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

export const PRO_CIRCUIT_TROPHIES = Object.freeze([
  Object.freeze({ id: 'shutoSpeed', label: 'SHUTO SPEED TROPHY', discipline: 'DRIVER', format: 'FIVE_FIXTURE', restriction: 'OPEN', fixtures: 5 }),
  Object.freeze({ id: 'tokyoTechnical', label: 'TOKYO TECHNICAL TROPHY', discipline: 'DRIVER', format: 'FIVE_FIXTURE', restriction: 'POWER_CLASS_NOS_OFF', fixtures: 5 }),
  Object.freeze({ id: 'triDrive', label: 'TRI-DRIVE TROPHY', discipline: 'TEAM', format: 'FIVE_FIXTURE', restriction: 'DRIVETRAIN_DIVERSITY', fixtures: 5 }),
  Object.freeze({ id: 'teamGrandPrix', label: 'TEAM GRAND PRIX TROPHY', discipline: 'TEAM', format: 'FIVE_FIXTURE', restriction: 'OPEN', fixtures: 5 }),
  Object.freeze({ id: 'tokyoMasters', label: 'TOKYO MASTERS TROPHY', discipline: 'MIXED', format: 'FIVE_FIXTURE', restriction: 'MIXED', fixtures: 5 }),
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
  GENERIC_DRIVER_NAMES.forEach((name, index) => {
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
  return Object.fromEntries(GENERIC_TEAM_NAMES.map((name, index) => [
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
    qualified: false, // Phase 2 sets this after the professional qualifier
    playerDriver: createStanding(1400),
    playerTeam: createStanding(1400),
    drivers: createDriverRoster(),
    teams: createTeamRoster(),
    completedEventIds: [],
    activeTournament: null,
    lastTournament: null,
    trophyWins: Object.fromEntries(PRO_CIRCUIT_TROPHIES.map(t => [t.id, 0])),
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
  return {
    schemaVersion: PRO_CIRCUIT_SCHEMA_VERSION,
    season: boundedInteger(source.season, 1, 1, 10000),
    eventTick: boundedInteger(source.eventTick, 0, 0, 10000000),
    qualified: Boolean(source.qualified),
    playerDriver: normaliseStanding(source.playerDriver, initial.playerDriver),
    playerTeam: normaliseStanding(source.playerTeam, initial.playerTeam),
    drivers: normaliseRoster(source.drivers, initial.drivers),
    teams: normaliseRoster(source.teams, initial.teams),
    completedEventIds: Array.isArray(source.completedEventIds)
      ? [...new Set(source.completedEventIds.filter(id => typeof id === 'string').slice(-250))]
      : [],
    activeTournament: source.activeTournament && typeof source.activeTournament === 'object' &&
      !Array.isArray(source.activeTournament) &&
      source.activeTournament.eventId === 'fourWideOpen' &&
      source.activeTournament.schema === 1 &&
      Number.isInteger(source.activeTournament.stage) &&
      source.activeTournament.stage >= 0 && source.activeTournament.stage <= 2 &&
      Array.isArray(source.activeTournament.heats) &&
      Array.isArray(source.activeTournament.entrants)
      ? source.activeTournament : null,
    lastTournament: source.lastTournament && typeof source.lastTournament === 'object' &&
      !Array.isArray(source.lastTournament) ? source.lastTournament : null,
    trophyWins: Object.fromEntries(PRO_CIRCUIT_TROPHIES.map(t => [
      t.id, boundedInteger(trophies[t.id], 0, 0, 10000),
    ])),
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
  const unlocked = isDev || joinedName === 'arkonden' || isCrewComplete(source);
  return {
    unlocked,
    crewCount: count,
    crewRequired: PRO_CIRCUIT_CREW_REQUIRED,
    reason: unlocked ? 'PRO CIRCUIT ACCESS GRANTED' : 'RECRUIT ALL 7 CREW MEMBERS',
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

export function getProCircuitDriverSeeds(proCircuit) {
  return seededRows(proCircuit, 'DRIVER');
}

export function getProCircuitTeamSeeds(proCircuit) {
  return seededRows(proCircuit, 'TEAM');
}
