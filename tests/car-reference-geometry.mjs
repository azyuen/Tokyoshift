import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STANDARD_CAR_REFERENCE as reference, getReferenceAssetRoot } from '../src/data/carReferenceGeometry.js';

function dimensions(id, layer) {
  const bytes = readFileSync(new URL('../' + getReferenceAssetRoot(id) + '/' + id + '_stock_' + layer + '.png', import.meta.url));
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG', id + ' ' + layer + ' must be PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('AE86 master and two shared wheel diameters match approved calibration', () => {
  assert.equal(reference.masterScale, 0.32);
  assert.deepEqual(reference.wheelDiameters, { S: 182, L: 194 });
  assert.equal(Object.keys(reference.cars).length, 43);
});

test('all reference cars have paired identical-size body/paint canvases and valid right-origin axles', () => {
  for (const [id, car] of Object.entries(reference.cars)) {
    const body = dimensions(id, 'body');
    const paint = dimensions(id, 'paint');
    assert.deepEqual(paint, body, id + ' paint/body size must match');
    assert.ok(car.rearX < car.frontX && car.frontX < 0, id + ' axle order');
    assert.ok(car.rearX > -body.width && car.frontX > -body.width, id + ' axles within canvas');
    assert.ok(['S', 'L'].includes(car.size), id + ' uses one of two wheel diameters');
    assert.ok(reference.wheelDiameters[car.size] <= body.height, id + ' wheel fits canvas height');
  }
});

test('reference axle coordinates include the visual wheel audit', () => {
  const expected = {
    ae86: [-921, -247, 'S'],
    ef: [-877, -195, 'S'],
    ek9: [-931, -231, 'S'],
    gc8: [-901, -253, 'S'],
    galant: [-998, -255, 'L'],
    evo6: [-972, -280, 'S'],
    r32: [-988, -268, 'L'],
    rx7fc: [-936, -260, 'L'],
    rx7fd: [-922, -218, 'L'],
    rx8: [-986, -246, 'L'],
  };
  for (const [id, [rearX, frontX, size]] of Object.entries(expected)) {
    // The wheel audit may change wheel fit, never the body canvas.
    const { rearX: actualRear, frontX: actualFront, size: actualSize } = reference.cars[id];
    assert.deepEqual([actualRear, actualFront, actualSize], [rearX, frontX, size]);
  }
});
