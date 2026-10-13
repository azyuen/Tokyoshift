import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars, carOrder } from '../src/data/cars.js';
import { CAR_DRIVER_FACE_ANCHORS } from '../src/data/carDriverFaceAnchors.js';
import { resolveCharacterFaceAnchor } from '../src/characters/CharacterFaceAnchor.js';
import { createDriverSilhouette, resolveDriverSeat } from '../src/vehicles/DriverSilhouette.js';

const nearly = (a, b) => assert.ok(Math.abs(a - b) < 0.00001, a + ' should equal ' + b);

test('each deployed stock car has its own authored driver-face target', () => {
  assert.equal(carOrder.length, 29);
  assert.equal(Object.keys(CAR_DRIVER_FACE_ANCHORS).length, 29);
  for (const id of carOrder) {
    const face = cars[id].visual.driverFace;
    assert.deepEqual(face, CAR_DRIVER_FACE_ANCHORS[id], id);
    assert.ok(face.x > 0.4 && face.x < 0.65, id + ' centre should lie in the forward window');
    assert.ok(face.y > 0.1 && face.y < 0.35, id + ' face should be above the door sill');
    assert.ok(face.height > 0.08 && face.height < 0.18, id + ' head crop should fit cabin');
  }
});

test('reference-standard source coordinates use the right and bottom image edge', () => {
  const car = cars.ae86.visual;
  const seat = resolveDriverSeat(car, car.referenceCanvasWidth, car.referenceCanvasHeight);
  nearly(seat.x, (car.driverFace.x - 1) * car.referenceCanvasWidth);
  nearly(seat.y, (car.driverFace.y - 1) * car.referenceCanvasHeight);
  assert.ok(seat.x < 0 && seat.y < 0);
});

test('new regular assets keep old centre-based vehicle origins', () => {
  // Evo III is now a Ref2 Galant, so use the remaining legacy Civic EJ1.
  const car = cars.ej1.visual;
  const seat = resolveDriverSeat(car, 1200, 500);
  nearly(seat.x, (car.driverFace.x - 0.5) * 1200);
  nearly(seat.y, (car.driverFace.y - 0.5) * 500);
  assert.ok(seat.x > 0 && seat.y < 0);
});

test('face coordinates scale to the actual portrait PNG, with pose overrides', () => {
  const src = { width: 1000, height: 1500 };
  const visual = {
    faceAnchor: {
      x: 0.43, y: 0.15, headHeight: 0.16,
      poses: { win: { x: 0.48, y: 0.11 } },
    },
  };
  const idle = resolveCharacterFaceAnchor(src, 'test-sprite-a', visual, 'idle');
  const win = resolveCharacterFaceAnchor(src, 'test-sprite-a', visual, 'win');
  assert.deepEqual(idle, { x: 430, y: 225, headHeight: 240 });
  assert.deepEqual(win, { x: 480, y: 165, headHeight: 240 });
});

test('silhouette source pixels map the face exactly onto the car anchor', () => {
  const sprite = { width: 1000, height: 1500 };
  const character = { visual: {
    spriteKey: 'driver',
    faceAnchor: { x: 0.48, y: 0.14, headHeight: 0.17 },
  } };
  const scene = {
    textures: {
      exists: key => key === 'driver',
      get: () => ({ getSourceImage: () => sprite }),
    },
    add: {
      image(x, y, key) {
        const image = { x, y, key, data: {},
          setOrigin() { return this; },
          setCrop(a, b, c, d) { this.crop = [a, b, c, d]; return this; },
          setScale(s) { this.scale = s; return this; },
          setFlipX() { return this; },
          setTint() { return this; },
          setAlpha() { return this; },
          setDepth() { return this; },
          setData(k, v) { this.data[k] = v; return this; },
        };
        return image;
      },
    },
  };
  for (const id of ['ae86', 'r32', 'evo3', 's2000']) {
    const visual = cars[id].visual;
    const width = visual.referenceCanvasWidth || (id === 's2000' ? 1942 : 1200);
    const height = visual.referenceCanvasHeight || (id === 's2000' ? 809 : 500);
    const result = createDriverSilhouette(scene, visual, character, {
      bodyScale: visual.bodyScale, sourceWidth: width, sourceHeight: height, depth: 3,
    });
    assert.ok(result);
    const face = resolveCharacterFaceAnchor(sprite, 'driver', character.visual);
    nearly(result.image.x + (face.x - sprite.width / 2) * result.image.scale,
      result.seat.x * visual.bodyScale);
    nearly(result.image.y + (face.y - sprite.height / 2) * result.image.scale,
      result.seat.y * visual.bodyScale);
    assert.ok(result.image.crop[2] < sprite.width / 2, 'crop should omit torso/wide arms');
    assert.ok(result.image.crop[3] < sprite.height / 2, 'crop should omit lower torso');
  }
});

test('race scene does not add ground offset twice to the reference driver', () => {
  const race = readFileSync(new URL('../src/scenes/RaceScene.js', import.meta.url), 'utf8');
  assert.match(race, /driverOffsetY: driver\?\.offsetY \|\| 0,/);
  assert.doesNotMatch(race, /driverOffsetY: .*\+ referenceGroundOffset/);
  assert.match(race, /bodyY \+ v\.driverOffsetY/);
});
