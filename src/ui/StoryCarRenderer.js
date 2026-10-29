// R642 — canonical, modular-car artwork renderer for story tableaux.
// Uses the SAME tyre fit and 2-layer/singleBody rules as Garage and Meets.
import {
  preloadCarAppearanceAssets, preloadCarWheel, createCarBodyLayers,
  getCarBodyScaleForWidth, getCarBodyTextureKey,
} from '../vehicles/CarAppearance.js?v=20261020-r617';
import { getWheelPairFit, getWheelContactOffsetY } from '../vehicles/WheelFit.js?v=20260929-r258';
import { getReferenceRightX } from '../data/carReferenceGeometry.js?v=20261012-ref2';
import { carBodyCenterY } from './StoryComposition.js?v=20261022-r642';

export function preloadStoryCar(scene,car,cacheBust='20261022-r642') {
  if(!scene || !car)return 0;
  return preloadCarAppearanceAssets(scene,{[car.id]:car},cacheBust) +
    preloadCarWheel(scene,car);
}

export function renderStoryCar(scene,car,{
  x=1030,groundY=720,targetWidth=1000,depth=8,flipX=false,
  paintColor=0xffffff,shadow=true,garageGeometry=false,editorCanvas=false,
}={}) {
  if(!scene?.textures || !car?.visual)return [];
  const textureKey=getCarBodyTextureKey(scene,car);
  if(!scene.textures.exists(textureKey))return [];
  const bodySource=scene.textures.get(textureKey).getSourceImage();
  const scale=editorCanvas ? targetWidth/Math.max(1,bodySource?.naturalWidth||bodySource?.width||1) : getCarBodyScaleForWidth(scene,car,targetWidth);
  // Customer tuning in Canal Yard uses the Garage's tyre contact solver,
  // not the cinematic renderer's approximate body-centre equation.
  const wheelSource=car.visual.wheelKey && scene.textures.exists(car.visual.wheelKey)
    ? scene.textures.get(car.visual.wheelKey).getSourceImage() : null;
  const wheelFit=wheelSource?getWheelPairFit(car.visual,scale,flipX,wheelSource):null;
  const wheelContact=fit=>fit?.backingRadius>0
    ? fit.backingRadius : getWheelContactOffsetY(wheelSource,fit?.wheelScale);
  const maxContact=wheelFit
    ? Math.max(wheelFit.rear.offsetY+wheelContact(wheelFit.rear),
      wheelFit.front.offsetY+wheelContact(wheelFit.front)) : 0;
  const bodyY=editorCanvas ? groundY-(bodySource?.naturalHeight||bodySource?.height||0)*scale*.5 : garageGeometry && wheelFit
    ? (car.visual.referenceStandard
      ? groundY+Number(car.visual.renderOffsetY||0)*scale
      : groundY-maxContact)
    : carBodyCenterY({
      groundY,sourceHeight:bodySource?.naturalHeight||bodySource?.height,
      scale,referenceStandard:Boolean(car.visual.referenceStandard),
      bodyRenderOffsetY:Number(car.visual.bodyRenderOffsetY||0),
    });
  const drawX=editorCanvas ? x : getReferenceRightX(car,x,scale);
  const objects=[];
  const add=obj=>{if(obj)objects.push(obj);return obj;};
  if(shadow)add(scene.add.ellipse(x,groundY-5,Math.max(250,targetWidth*.83),
    Math.max(27,targetWidth*.035),0x000000,.48).setDepth(depth-.5));
  const key=car.visual.wheelKey;
  if(key && scene.textures.exists(key)){
    const source=scene.textures.get(key).getSourceImage();
    const fit=getWheelPairFit(car.visual,scale,flipX,source);
    for(const axle of [fit.rear,fit.front]){
      const wx=drawX+axle.offsetX,wy=bodyY+axle.offsetY;
      add(scene.add.circle(wx,wy,axle.backingRadius||18,0x020304)
        .setDepth(depth+.2));
      const tyre=scene.add.image(wx,wy,key).setScale(axle.wheelScale)
        .setDepth(depth+2);
      // The workshop's slow drive-in rotates ONLY the visible tyres.
      // Use the calibrated wheel radius, not the transparent PNG canvas.
      tyre.storyRollRadius=axle.backingRadius>0
        ? axle.backingRadius
        : Math.max(8,tyre.displayWidth*.5);
      add(tyre);
    }
  }
  const body=createCarBodyLayers(scene,car,{
    x:drawX,y:bodyY,scale,depth:depth+1,flipX,paintColor,
  });
  body?.objects?.forEach(add);
  return objects.sort((a, b) => a.depth - b.depth);
}
