import test from 'node:test';
import assert from 'node:assert/strict';
import { cars, carOrder } from '../src/data/cars.js';
import {
  STANDARD_CAR_REFERENCE,
  getReferenceAssetRoot,
  REFERENCE_CAR_GAME_IDS,
  REFERENCE_CAR_CANVAS,
  REFERENCE_AE86_SOURCE_WIDTH,
  getReferenceRightX,
} from '../src/data/carReferenceGeometry.js';
import {
  getCarAssetPaths,
  getCarTextureKeys,
  getCarBodyScaleForWidth,
  getCarBodyTextureKey,
  hasLayeredPaintAssets,
  createCarBodyLayers,
} from '../src/vehicles/CarAppearance.js';
import {
  getWheelPairFit,
  getWheelContactOffsetY,
} from '../src/vehicles/WheelFit.js';

const migrated = Object.keys(REFERENCE_CAR_GAME_IDS);
const WHEEL_SOURCE = { width: 384, height: 384 };

function textureScene(car) {
  const keys = getCarTextureKeys(car);
  return {
    textures: {
      exists: key => [keys.body, keys.paint].includes(key),
      get: key => ({
        getSourceImage: () => ({
          width: REFERENCE_CAR_CANVAS[REFERENCE_CAR_GAME_IDS[car.id]]?.[0] || 1200,
          height: REFERENCE_CAR_CANVAS[REFERENCE_CAR_GAME_IDS[car.id]]?.[1] || 500,
        }),
      }),
    },
  };
}

test('reference game IDs use their correct Ref/Ref2 stock PNG pairs', () => {
  assert.equal(migrated.length, 28);
  for (const id of carOrder) {
    const car = cars[id];
    const paths = getCarAssetPaths(car);
    const filename = REFERENCE_CAR_GAME_IDS[id];
    if (filename) {
      assert.equal(car.visual.referenceStandard, true, id);
      assert.equal(paths.body, getReferenceAssetRoot(filename) + '/' + filename + '_stock_body.png');
      assert.equal(paths.paint, getReferenceAssetRoot(filename) + '/' + filename + '_stock_paint.png');
      assert.equal(paths.overlay, null, id + ' does not ask for a redundant third PNG');
    } else {
      assert.notEqual(car.visual.referenceStandard, true, id);
      assert.equal(paths.body, 'assets/Cars/' + car.visual.assetStem + '_stock_body.png', id);
    }
  }
});

test('reference models share one AE86-derived source scale regardless of original canvas width', () => {
  for (const id of migrated) {
    const car = cars[id];
    const stageWidth = 900;
    const scene = textureScene(car);
    assert.equal(getCarBodyScaleForWidth(scene, car, stageWidth), stageWidth / REFERENCE_AE86_SOURCE_WIDTH);
    assert.equal(car.visual.bodyScale, STANDARD_CAR_REFERENCE.masterScale);
    assert.equal(getReferenceRightX(car, 400, .32), 400 + REFERENCE_AE86_SOURCE_WIDTH * .32 / 2);
    assert.equal(getCarBodyTextureKey(scene, car), getCarTextureKeys(car).body);
    assert.equal(hasLayeredPaintAssets(scene, car), true, id);
  }
  const other = cars.ej1; // Evo III's stable slot is now the Ref2 Galant
  assert.notEqual(getReferenceRightX(other, 400, .32), 400 + REFERENCE_AE86_SOURCE_WIDTH * .32 / 2);
});

test('both tyre sizes contact zero ground at common scale, including flipped presentations', () => {
  for (const id of migrated) {
    const visual = cars[id].visual;
    const stem = REFERENCE_CAR_GAME_IDS[id];
    const expected = STANDARD_CAR_REFERENCE.cars[stem];
    const dimension = STANDARD_CAR_REFERENCE.wheelDiameters[expected.size];
    const normal = getWheelPairFit(visual, .32, false, WHEEL_SOURCE);
    const flipped = getWheelPairFit(visual, .32, true, WHEEL_SOURCE);
    for (const axle of ['rear', 'front']) {
      assert.equal(normal[axle].offsetX, expected[axle + 'X'] * .32);
      assert.equal(normal[axle].offsetY + getWheelContactOffsetY(WHEEL_SOURCE, normal[axle].wheelScale), 0);
      assert.equal(flipped[axle].offsetX, (-REFERENCE_CAR_CANVAS[stem][0] - expected[axle + 'X']) * .32);
      assert.equal(flipped[axle].offsetY + getWheelContactOffsetY(WHEEL_SOURCE, flipped[axle].wheelScale), 0);
      assert.equal(normal[axle].wheelScale, dimension * .32 / 384);
    }
  }
});

test('reference body layers anchor bottom-right and tint only paint UNDER the fixed shell', () => {
  const car = cars.ae86;
  const keys = getCarTextureKeys(car);
  const scene = textureScene(car);
  const objects = [];
  const fakeImage = (x, y, texture) => {
    const obj = {
      x, y, texture, originX: .5, originY: .5, depth: 0,
      setOrigin(a, b) { this.originX = a; this.originY = b; return this; },
      setScale(v) { this.scale = v; return this; },
      setFlipX(v) { this.flipX = v; return this; },
      setDepth(v) { this.depth = v; return this; },
      setTint(v) { this.tint = v; return this; },
      setData(k, v) { this[k] = v; return this; },
    };
    objects.push(obj);
    return obj;
  };
  scene.add = { image: fakeImage };
  const layers = createCarBodyLayers(scene, car, { x: 700, y: 500, scale: .32, paintColor: 0xe54433 });
  assert.equal(objects.length, 2);
  assert.equal(objects[0].texture, keys.paint);
  assert.equal(objects[1].texture, keys.body);
  assert.equal(objects[0].originX, 1);
  assert.equal(objects[0].originY, 1);
  assert.equal(objects[1].originX, 1);
  assert.equal(objects[1].originY, 1);
  assert.ok(objects[0].depth < objects[1].depth);
  assert.equal(objects[0].tint, 0xe54433);
  assert.equal(objects[1].tint, undefined, 'fixed body shell must NEVER be tinted');
  assert.equal(layers.primary, objects[1]);
  assert.equal(layers.paint, objects[0]);
});
