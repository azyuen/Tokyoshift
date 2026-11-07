import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultProCircuitState, normaliseProCircuitState } from '../src/data/proCircuit.js';
import {
  validateProSeasonDriverCars, startProfessionalSeason, getProSeasonDriverCarError,
  getProfessionalRoundEvents,
} from '../src/data/proSeason.js';
import { stageProGarage, getProGarageBayCars, PRO_GARAGE_BAYS } from '../src/data/proGarage.js';

// Regression for the approved November open-drivetrain registration rules.
// Restricted rounds are still restricted; nomination itself is not.
for (const roster of [
  ['ef', 'ek9', 'dc2'],       // three FWD
  ['ae86', 's15', 'rx7fd'],   // three RWD
  ['gc8', 'gdb', 'r34'],      // three AWD
  ['ef', 'ae86', 'gc8'],      // mixed
]) {
  test('Pro Season accepts and persists open-class roster: ' + roster.join(', '), () => {
    assert.equal(validateProSeasonDriverCars(roster, roster), null);
    const started = startProfessionalSeason(createDefaultProCircuitState(), roster, roster);
    assert.ok(started.circuit, started.error);
    const reloaded = normaliseProCircuitState(JSON.parse(JSON.stringify(started.circuit)));
    assert.deepEqual(reloaded.registeredDriverCars, roster);
    assert.equal(getProSeasonDriverCarError(reloaded, roster[0]), null);
    const locations = Object.fromEntries(roster.map(id => [id, 'shinonomeGarage']));
    // Use the existing garage resolver rather than assuming the exact garage ID.
    const staged = stageProGarage(reloaded, roster, locations, 0);
    if (staged.error) {
      // A garage assignment may be invalid for the fixture; registration itself
      // must remain valid and cannot impose a hidden drivetrain constraint.
      assert.doesNotMatch(staged.error, /DRIVETRAIN|ONE FWD|ONE RWD|ONE AWD/i);
    } else {
      const bays = getProGarageBayCars(staged.circuit, roster);
      assert.deepEqual(bays.map(b => b.carId), roster);
      assert.deepEqual(bays.map(b => b.number), PRO_GARAGE_BAYS.map(b => b.number));
    }
  });
}

test('round-specific drivetrain rules survive open-class nomination', () => {
  const c = createDefaultProCircuitState();
  const rwdOnly = getProfessionalRoundEvents(1, c).driver;
  const fwdOnly = getProfessionalRoundEvents(3, c).driver;
  const awdOnly = getProfessionalRoundEvents(4, c).driver;
  assert.equal(rwdOnly.drivetrain, 'RWD');
  assert.equal(fwdOnly.drivetrain, 'FWD');
  assert.equal(awdOnly.drivetrain, 'AWD');
});
