import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cars } from '../src/data/cars.js';
import {
  STANDARD_CAR_REFERENCE as reference,
  REFERENCE_CAR_CANVAS,
} from '../src/data/carReferenceGeometry.js';
import {
  getCarDecalAnchor, createCarBodyLayers, getCarTextureKeys,
} from '../src/vehicles/CarAppearance.js';
import { getWheelPairFit, getWheelContactOffsetY } from '../src/vehicles/WheelFit.js';

const approved = {
  r34: ['r34',36,-922,-248,'L'],
  '3000gt':['3000gt',-23,-947,-258,'L'],
  jzx100:['chaser',15,-962,-248,'S'],
  s2000:['s2000',13,-916,-228,'S'],
  '240z':['240z',-3,-887,-224,'S'],
  familia:['familia',3,-946,-244,'L'],
  evo5:['evo5',6,-950,-252,'S'],
  evo6:['evo6',1,-972,-280,'S'],
};
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} !== ${b}`);

test('all eight accepted source-pixel body offsets reach game configs unchanged', () => {
  assert.equal(reference.masterScale,.32);
  assert.deepEqual(reference.wheelDiameters,{S:182,L:194});
  for(const [gameId,[stem,y,rearX,frontX,size]] of Object.entries(approved)) {
    const spec=reference.cars[stem];
    const v=cars[gameId].visual;
    assert.equal(spec.bodyRenderOffsetY,y,stem);
    assert.equal(v.bodyRenderOffsetY,y,gameId);
    assert.equal(v.referenceStandard,true,gameId);
    assert.equal(v.referenceWheelDiameter,reference.wheelDiameters[size]);
    assert.equal(v.referenceGeometry.rearX,rearX);
    assert.equal(v.referenceGeometry.frontX,frontX);
    assert.equal(v.referenceWheelSize,size);
    assert.equal(v.bodyScale,.32);
    assert.equal(v.referenceCanvasWidth,REFERENCE_CAR_CANVAS[stem][0]);
    assert.equal(v.referenceCanvasHeight,REFERENCE_CAR_CANVAS[stem][1]);
  }
});

test('calibrated paint and body move together without changing wheel ground contact', () => {
  const wheelSource={width:384,height:384};
  for(const [gameId,[stem,y,rearX,frontX]] of Object.entries(approved)){
    const v=cars[gameId].visual, car=cars[gameId];
    const fit=getWheelPairFit(v,.32,false,wheelSource);
    close(fit.rear.offsetX,rearX*.32);
    close(fit.front.offsetX,frontX*.32);
    for(const axle of ['rear','front']) {
      close(fit[axle].offsetY+getWheelContactOffsetY(wheelSource,fit[axle].wheelScale),0);
    }
    const keys=getCarTextureKeys(car);
    const made=[];
    const scene={
      textures:{exists:key=>[keys.body,keys.paint].includes(key)},
      add:{image(x,yy,key) {
        const o={x,y:yy,key,setOrigin(){return this;},setScale(){return this;},
          setFlipX(){return this;},setDepth(){return this;},
          setTint(){return this;},setData(){return this;}};
        made.push(o);return o;
      }}
    };
    createCarBodyLayers(scene,car,{x:820,y:500,scale:.32});
    assert.equal(made.length,2,stem);
    close(made[0].y,500+y*.32);
    close(made[1].y,500+y*.32);
    assert.equal(made[0].key,keys.paint);
    assert.equal(made[1].key,keys.body);
  }
});

test('decals preserve historical shop Y coordinates and share the calibrated body shift', () => {
  for(const [gameId,[stem,y]] of Object.entries(approved)) {
    const car=cars[gameId];
    for(const scale of [.32,.77]) {
      const [w,h]=REFERENCE_CAR_CANVAS[stem];
      const {x, y:ay}=getCarDecalAnchor(car,{x:850,y:530,scale,sourceWidth:w,sourceHeight:h});
      close(x,850-w*scale*.5);
      // Saved tuner-shop y placements use the reference PNG's bottom edge.
      // Do not shift them by half a canvas, or old decals jump up into windows.
      close(ay,530+y*scale);
    }
  }
  assert.deepEqual(getCarDecalAnchor({visual:{}},{
    x:100,y:200,scale:.5,sourceWidth:1300,sourceHeight:440
  }),{x:100,y:200},'legacy centre-origin car stays unchanged');
});

test('race, garage and decal editor use the same anchor while wheel transforms remain separate', () => {
  const source=name=>readFileSync(new URL('../src/scenes/'+name+'.js',import.meta.url),'utf8');
  const race=source('RaceScene');
  const garage=source('GarageScene');
  const shop=source('TunerShopScene');
  assert.match(race,/const decalAnchor = getCarDecalAnchor\(c,/);
  assert.match(race,/obj\.setPosition\(decalAnchor\.x \+ offsetX, decalAnchor\.y \+ offsetY\)/);
  assert.match(race,/obj\.setPosition\(drawX \+ artOffsetX, bodyY \+ artOffsetY\)/);
  assert.match(race,/bodyY \+ v\.driverOffsetY \+ artOffsetY/);
  assert.match(race,/const rearY = bodyY \+ v\.wheelFit\.rear\.offsetY/);
  assert.match(race,/const frontY = bodyY \+ v\.wheelFit\.front\.offsetY/);
  assert.match(garage,/const decalAnchor = getCarDecalAnchor\(car,/);
  assert.match(garage,/x: decalAnchor\.x,\s*y: decalAnchor\.y,/);
  assert.match(shop,/const decalAnchor = getCarDecalAnchor\(car,/);
  assert.match(shop,/objects\.geometry = \{\s*\/\/ The placement editor must use the identical anchor as saved decals\.\s*x: decalAnchor\.x,\s*displayY: decalAnchor\.y,/);
});
