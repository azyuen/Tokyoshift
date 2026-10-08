import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRO_CIRCUIT_SCHEMA_VERSION,
  PRO_CIRCUIT_TROPHIES,
  PRO_CIRCUIT_CHAMPIONSHIPS,
  createDefaultProCircuitState,
  normaliseProCircuitState,
  getProCircuitAccess,
  getProCircuitDriverSeeds,
  getProCircuitTeamSeeds,
} from '../src/data/proCircuit.js';
import { CREW_REGIONS, REGIONAL_CREW_ROSTERS } from '../src/data/crewRoster.js';
import { MAIN_RIVAL_BY_REGION } from '../src/data/characters.js';
import { createDefaultGameState, normaliseState } from '../src/state/GameState.js';

test('professional roster has stable unique identities and seven canonical rivals', () => {
  const first = createDefaultProCircuitState();
  const second = createDefaultProCircuitState();
  assert.deepEqual(first, second);
  const driverIds = Object.keys(first.drivers);
  const teamIds = Object.keys(first.teams);
  assert.equal(driverIds.length, 31);
  assert.equal(teamIds.length, 16);
  assert.equal(new Set(driverIds).size, driverIds.length);
  assert.equal(new Set(teamIds).size, teamIds.length);
  for (const characterId of Object.values(MAIN_RIVAL_BY_REGION)) {
    assert.equal(first.drivers['rival:' + characterId].characterId, characterId);
  }
});

test('five trophy definitions and two 16-player championships are data driven', () => {
  assert.equal(PRO_CIRCUIT_TROPHIES.length, 5);
  assert.equal(new Set(PRO_CIRCUIT_TROPHIES.map(x => x.id)).size, 5);
  assert.equal(PRO_CIRCUIT_CHAMPIONSHIPS.length, 2);
  for (const championship of PRO_CIRCUIT_CHAMPIONSHIPS) {
    assert.equal(championship.participants, championship.groups * championship.entrantsPerGroup);
    assert.equal(championship.groups * championship.qualifiersPerGroup, championship.knockoutEntrants);
  }
});

test('venue unlock and professional event unlock are separate: genuine seven recruits required', () => {
  const crewMembers = Object.fromEntries(CREW_REGIONS.map(regionId => [
    regionId,
    { characterId: REGIONAL_CREW_ROSTERS[regionId].members[0].characterId },
  ]));
  assert.equal(getProCircuitAccess({ crewMembers: {} }).unlocked, false);
  assert.equal(getProCircuitAccess({ crewMembers }).unlocked, true);
  assert.equal(getProCircuitAccess({ crewMembers }).crewCount, 7);
  const partialCrew = { ...crewMembers };
  delete partialCrew.SHINJUKU;
  assert.equal(getProCircuitAccess({ crewMembers: partialCrew }).unlocked, false);
  assert.equal(getProCircuitAccess({ crewMembers: { ...crewMembers, ODAIBA: { characterId: 'invalid' } } }).unlocked, false);
  assert.equal(getProCircuitAccess({ devMode: true }).unlocked, true);
  assert.equal(getProCircuitAccess({ firstName: 'Arkon', lastName: 'Den' }).unlocked, true);
});

test('legacy profile without proCircuit silently receives compatible defaults', () => {
  const existing = createDefaultGameState();
  delete existing.proCircuit;
  const restored = normaliseState(existing);
  assert.equal(restored.proCircuit.schemaVersion, PRO_CIRCUIT_SCHEMA_VERSION);
  assert.equal(restored.proCircuit.season, 1);
  assert.equal(restored.cash, existing.cash);
  assert.deepEqual(restored.ownedCarIds, existing.ownedCarIds);
  assert.deepEqual(restored.crewMembers, existing.crewMembers);
  assert.equal(restored.competitionState, existing.competitionState);
});

test('professional standings, tournaments and trophies survive normalisation', () => {
  const current = createDefaultProCircuitState();
  current.season = 2;
  current.eventTick = 21;
  current.playerDriver.rating = 1760;
  current.playerTeam.seasonPoints = 290;
  current.drivers['rival:emiKanzaki'].wins = 8;
  current.trophyWins.shutoSpeed = 1;
  current.championshipWins.DRIVER = 2;
  current.completedEventIds = ['evt1', 'evt2'];
  current.activeTournament = { id: 'testBracket', roundIndex: 2 };
  const result = normaliseState({ ...createDefaultGameState(), proCircuit: current }).proCircuit;
  assert.equal(result.season, 2);
  assert.equal(result.eventTick, 21);
  assert.equal(result.playerDriver.rating, 1760);
  assert.equal(result.playerTeam.seasonPoints, 290);
  assert.equal(result.drivers['rival:emiKanzaki'].wins, 8);
  assert.equal(result.trophyWins.shutoSpeed, 1);
  assert.equal(result.championshipWins.DRIVER, 2);
  assert.deepEqual(result.completedEventIds, ['evt1', 'evt2']);
  assert.deepEqual(result.activeTournament, { id: 'testBracket', roundIndex: 2 });
});

test('damaged payload cannot corrupt ratings, season or event lists', () => {
  const repaired = normaliseProCircuitState({
    season: -100,
    eventTick: 'NaN',
    playerDriver: { rating: Infinity, seasonPoints: -50 },
    playerTeam: { rating: -100, wins: 1.9 },
    drivers: { 'rival:emiKanzaki': { wins: 22 } },
    teams: null,
    completedEventIds: [7, 'a', 'a', null, 'b'],
    activeTournament: [],
    trophyWins: { shutoSpeed: -99 },
  });
  assert.equal(repaired.season, 1);
  assert.equal(repaired.eventTick, 0);
  assert.equal(repaired.playerDriver.rating, 1400);
  assert.equal(repaired.playerDriver.seasonPoints, 0);
  assert.equal(repaired.playerTeam.rating, 100);
  assert.equal(repaired.playerTeam.wins, 1);
  assert.equal(repaired.drivers['rival:emiKanzaki'].wins, 22);
  assert.deepEqual(repaired.completedEventIds, ['a', 'b']);
  assert.equal(repaired.activeTournament, null);
  assert.equal(repaired.trophyWins.shutoSpeed, 0);
});

test('driver/team seeds are deterministic and independent', () => {
  const state = createDefaultProCircuitState();
  state.playerDriver.rating = 2500;
  state.playerTeam.rating = 1100;
  const drivers = getProCircuitDriverSeeds(state);
  const teams = getProCircuitTeamSeeds(state);
  assert.equal(drivers[0].id, 'player:driver');
  assert.notEqual(teams[0].id, 'player:team');
  assert.equal(drivers.length, Object.keys(state.drivers).length + 1);
  assert.equal(teams.length, Object.keys(state.teams).length + 1);
  assert.deepEqual(drivers, getProCircuitDriverSeeds(state));
  assert.deepEqual(teams, getProCircuitTeamSeeds(state));
  assert.equal(new Set(drivers.map(x => x.id)).size, drivers.length);
  assert.ok(drivers.every((row, index) => row.seed === index + 1));
});
