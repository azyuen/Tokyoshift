import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRO_CIRCUIT_SCHEMA_VERSION, PRO_AI_TEAM_DEFINITIONS, DEFAULT_PRO_TEAM_NAME,
  createDefaultProCircuitState, normaliseProCircuitState, normaliseProTeamName,
  getProCircuitDriverSeeds, getProCircuitTeamSeeds, getProTeamIdForDriver,
  getProPrizeBonusPercent,
} from '../src/data/proCircuit.js';
import { simulateProfessionalRound, completeSeasonRound } from '../src/data/proSeason.js';
import { createProvisionalChampionship } from '../src/data/tokyoChampionship.js';

test('professional world has 12 ranked teams, 24 ranked drivers, and last-place GMG Racing', () => {
  const c = createDefaultProCircuitState();
  const teams = getProCircuitTeamSeeds(c), drivers = getProCircuitDriverSeeds(c);
  assert.equal(c.schemaVersion, PRO_CIRCUIT_SCHEMA_VERSION);
  assert.equal(PRO_AI_TEAM_DEFINITIONS.length, 11);
  assert.equal(teams.length, 12);
  assert.equal(drivers.length, 24);
  assert.equal(c.playerTeamName, DEFAULT_PRO_TEAM_NAME);
  assert.equal(teams[11].id, 'player:team');
  assert.equal(teams[11].seed, 12);
  assert.equal(drivers[23].id, 'player:driver');
  const affiliates = Object.values(c.drivers).map(d => d.teamId);
  assert.equal(affiliates.length, 23);
  assert.ok(affiliates.every(id => c.teams[id]));
  assert.equal(new Set(affiliates).size, 11);
  for(const team of PRO_AI_TEAM_DEFINITIONS) {
    assert.equal(c.teams[team.id].name, team.name);
    assert.equal(getProTeamIdForDriver(team.leadDriverId), team.id);
    assert.ok(team.rankedDriverIds.length >= 2);
    assert.ok(team.reserveName.length > 2);
  }
});

test('renaming survives normalisation, old team records remain in save but are not ranked', () => {
  const c = createDefaultProCircuitState();
  c.playerTeamName = '  SHIFT LEGENDS  ';
  c.teams['pro:team:23'] = {rating:2400,name:'Retired legacy AI team',seasonPoints:7,entered:2,wins:1,losses:1};
  const result = normaliseProCircuitState(c);
  assert.equal(result.playerTeamName, 'SHIFT LEGENDS');
  assert.equal(result.teams['pro:team:23'].rating, 2400);
  assert.equal(getProCircuitTeamSeeds(result).length, 12);
  assert.ok(!getProCircuitTeamSeeds(result).some(row => row.id === 'pro:team:23'));
  assert.equal(normaliseProTeamName('<BAD> '), 'BAD');
  assert.equal(normaliseProTeamName(' '), DEFAULT_PRO_TEAM_NAME);
});

test('12-team sponsorship avoids paying last place and preserves driver bonus bands', () => {
  assert.equal(getProPrizeBonusPercent(12, 'TEAM'), 0);
  assert.equal(getProPrizeBonusPercent(9, 'TEAM'), 0);
  assert.equal(getProPrizeBonusPercent(8, 'TEAM'), 15);
  assert.equal(getProPrizeBonusPercent(1, 'TEAM'), 100);
  assert.equal(getProPrizeBonusPercent(11, 'DRIVER'), 15);
});

test('one AI team never scores both crew and solo events in a simulated round', () => {
  const initial = createDefaultProCircuitState();
  const once = simulateProfessionalRound(initial, 0);
  assert.deepEqual(once, simulateProfessionalRound(initial, 0));
  const teamIds = new Set(once.results.TEAM.map(r => r.id));
  assert.ok(once.results.DRIVER.length + once.results.TEAM.length > 0);
  for(const entry of once.results.DRIVER) assert.ok(!teamIds.has(getProTeamIdForDriver(entry.id)));
  const active = completeSeasonRound(initial,{id:'r724:round:1',discipline:'DRIVER',points:20});
  assert.equal(active.calendar.round,1);
  assert.equal(getProCircuitTeamSeeds(active).length,12);
});

test('Tokyo 16-driver bracket uses a shared organisation instead of matching array indices', () => {
  const c = createDefaultProCircuitState();
  c.calendar.round = 8; c.seasonStatus = 'COMPLETE';
  c.playerDriver.seasonPoints = 60; c.playerTeam.seasonPoints = 40;
  const a = 'pro:driver:01', b = 'rival:emiKanzaki';
  assert.equal(c.drivers[a].teamId,c.drivers[b].teamId);
  c.drivers[a].seasonPoints = 120; c.drivers[b].seasonPoints = 110;
  c.teams[c.drivers[a].teamId].seasonPoints = 120;
  const out = createProvisionalChampionship(c);
  assert.ok(out.championship,out.error);
  assert.equal(out.championship.entrants.length,16);
  assert.equal(out.championship.entrants.find(e=>e.id===a)?.seasonSeedScore,2.3);
  assert.equal(out.championship.entrants.find(e=>e.id===b)?.seasonSeedScore,2.183333);
});
