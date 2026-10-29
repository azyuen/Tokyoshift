import test from 'node:test';
import assert from 'node:assert/strict';
import { cars } from '../src/data/cars.js';
import { getWheelPairFit, getWheelContactOffsetY } from '../src/vehicles/WheelFit.js';
import { getWheelArchShadowStrips } from '../src/vehicles/WheelArchShadow.js';

test('all roster entries retain three tyre sizes, road contact and mirrored axle registration', () => {
  const wheel = {width:384,height:384};
  for (const [id,car] of Object.entries(cars)) {
    const v=car.visual;
    assert.ok(v.referenceStandard,id);
    for (const scale of [.16,.32,.8]) {
      const normal=getWheelPairFit(v,scale,false,wheel), mirror=getWheelPairFit(v,scale,true,wheel);
      for (const axle of ['rear','front']) {
        assert.ok([182,194,210].includes(normal[axle].wellRadiusSource*2),id);
        assert.ok(Math.abs(normal[axle].offsetY+getWheelContactOffsetY(wheel,normal[axle].wheelScale))<1e-8,id);
        assert.ok(Math.abs(normal[axle].offsetX+mirror[axle].offsetX+v.referenceCanvasWidth*scale)<1e-8,id);
      }
    }
  }
});

test('arch shadows follow a broad cavity but never extend to the road or adjacent cutouts', () => {
  const w=500,h=240,alpha=new Uint8Array(w*h);
  // Body with a broad open wheel arch, and an unrelated bumper notch.
  for(let x=0;x<w;x++)for(let y=20;y<205;y++){
    const arch=x>=140&&x<=260&&y>100+Math.abs(x-200)*.5;
    const notch=x>270&&y>170;
    if(!arch&&!notch)alpha[y*w+x]=255;
  }
  const v={referenceGeometry:{rearX:-300},referenceRearWheelDiameter:182};
  const strips=getWheelArchShadowStrips(alpha,w,h,v);
  assert.ok(strips.length>100);
  assert.ok(strips.some(([x,y])=>x===200&&y<=101));
  for(const [x,y,len] of strips){
    assert.ok(x>=139&&x<=261,'only arch opening');
    assert.ok(y+len<205,'above adjacent sill and road');
    assert.ok(y>=0&&len>0);
  }
  assert.deepEqual(getWheelArchShadowStrips(new Uint8Array(w*h),w,h,v),[],'empty images cannot cast giant shadows');
});

test('corrected Galant and Liberty Walk geometry propagates to aliases',()=>{
  assert.equal(cars.galant.visual.referenceRearWheelDiameter,194);
  assert.deepEqual(cars.lbwkR32.visual.referenceGeometry,{rearX:-984,frontX:-247});
  assert.deepEqual(cars.lbwkA60.visual.referenceGeometry,{rearX:-986,frontX:-262});
  assert.deepEqual(cars.arkonGinza240z.visual.referenceGeometry,cars.arkonLibertyWalk240z.visual.referenceGeometry);
  for(const c of Object.values(cars).filter(c=>c.visual.bodyPath===cars.galant.visual.bodyPath))
    assert.equal(c.visual.referenceFrontWheelDiameter,194);
});

test('shadow texture is cached, unpainted and owned by the body lifecycle',async()=>{
  const {createCarBodyLayers}=await import('../src/vehicles/CarAppearance.js');
  const original=globalThis.document;
  const context={drawImage(){},getImageData(){return {data:new Uint8ClampedArray(500*240*4)};},fillRect(){}};
  globalThis.document={createElement:()=>({getContext:()=>context})};
  let created=0;
  const textures=new Map([['carBody_fixture',{getSourceImage:()=>({width:500,height:240})}]]);
  const scene={textures:{exists:key=>textures.has(key),get:key=>textures.get(key),createCanvas(key){created++;const texture={getContext:()=>context,refresh(){}};textures.set(key,texture);return texture;}},add:{image(x,y,key){return {x,y,key,data:{},setOrigin(...v){this.origin=v;return this;},setScale(v){this.scale=v;return this;},setFlipX(v){this.flip=v;return this;},setDepth(v){this.depth=v;return this;},setTint(v){this.tint=v;return this;},setData(k,v){this.data[k]=v;return this;}};}}};
  try{
    const v={assetStem:'fixture',singleBody:true,referenceStandard:true,referenceGeometry:{rearX:-300,frontX:-100},referenceRearWheelDiameter:182,referenceFrontWheelDiameter:182};
    const a=createCarBodyLayers(scene,v,{x:200,y:100,scale:.5,depth:11,flipX:true,paintColor:0xff0000});
    const shadow=a.objects.find(o=>o.key.includes('_archShadow_'));
    assert.ok(shadow.depth<10,'behind tyre layer');
    assert.equal(shadow.tint,undefined);
    assert.deepEqual(shadow.origin,[1,1]);
    assert.equal(shadow.flip,true);
    assert.equal(shadow.scale,.5);
    assert.equal(a.primary.key,'carBody_fixture');
    createCarBodyLayers(scene,v);
    assert.equal(created,1,'reuse cached texture across displays');
  }finally{globalThis.document=original;}
});
