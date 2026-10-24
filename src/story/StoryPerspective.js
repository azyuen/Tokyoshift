// R644 — shared ground-plane projection for 2D side-on cars and front-on cast.
// Equations are written in normalized BACKGROUND coordinates, not global
// Phaser pixels: all aspect ratios and scene frames use the same function.
//
// Pinhole-ground approximation: s(y)=((y-h)/(r-h))^gamma, clamped to
// [minFactor,maxFactor]. s(r)=1. At the painted back boundary movement stops.
// IMPORTANT: race lanes are orthographic, with constant scale irrespective of Y.
import { CINEMATIC_PROJECTION_DEFAULTS } from '../data/storyBackgroundCatalog.js';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const validFamily=family=>CINEMATIC_PROJECTION_DEFAULTS[family]?'':('Invalid environment family: '+family);

export function getSceneProjection(profileOrFamily='location') {
  const category=typeof profileOrFamily==='string'
    ?profileOrFamily:(profileOrFamily?.family||'location');
  if(validFamily(category))throw new Error(validFamily(category));
  return {...CINEMATIC_PROJECTION_DEFAULTS[category],
    ...(typeof profileOrFamily==='object'?profileOrFamily.projection||{}:{})};
}
export function projectGroundFactor(profileOrFamily,requestedGround) {
  const p=getSceneProjection(profileOrFamily);
  const near=clamp(finite(p.near,.94),.01,1);
  const h=p.model==='orthographic'?null:clamp(finite(p.horizon,.4),0,.95);
  const back=p.model==='orthographic'
    ?clamp(finite(p.backLimit,.47),0,near)
    :clamp(Math.max(h+.012,finite(p.backLimit,h+.055)),0,near);
  const y=clamp(finite(requestedGround,p.reference),back,near);
  if(p.model==='orthographic'){
    return {ground:y,scaleFactor:1,backLimit:back,near,horizon:null,clamped:y!==requestedGround};
  }
  const reference=clamp(finite(p.reference,.76),h+.015,near);
  const gamma=clamp(finite(p.gamma,1),.2,2.5);
  const base=Math.pow(Math.max(0,(y-h)/(reference-h)),gamma);
  const factor=clamp(base,finite(p.minFactor,.15),finite(p.maxFactor,1.6));
  return {ground:y,scaleFactor:factor,backLimit:back,near,horizon:h,
    clamped:Math.abs(y-finite(requestedGround,y))>1e-9};
}

// Parameter x is a horizontal fraction along the stage, *not* perspective
// depth. Side-view car sprites remain horizontally undistorted.
// followVanishing is opt-in for a character/car moving along a converging road.
export function projectGroundEntity(profileOrFamily,{
  kind='character',ground=null,x=.5,frame=null,referenceSize=null,
  followVanishing=false,referenceGround=null,layerBias=0,
}={}) {
  if(!['car','character'].includes(kind))throw new Error('Unknown staged sprite: '+kind);
  const p=getSceneProjection(profileOrFamily);
  const g=projectGroundFactor(profileOrFamily,ground??p.reference);
  const targetFrame=frame||(
    typeof profileOrFamily==='object'?profileOrFamily.frame:null
  )||{x:0,y:0,w:1560,h:840};
  const fx=finite(targetFrame.x,0),fy=finite(targetFrame.y,0);
  const fw=Math.max(1,finite(targetFrame.w,1560)),
    fh=Math.max(1,finite(targetFrame.h,840));
  const reference=referenceSize==null
    ?(kind==='car'?fw*p.referenceCarWidth:fh*p.referenceCharacterHeight)
    :Math.max(1,finite(referenceSize,1));
  const x01=clamp(finite(x,.5),0,1);
  const vp=clamp(finite(p.vanishingX,.5),0,1);
  const xProjected=followVanishing && p.model==='ground-perspective'
    ?vp+(x01-vp)*g.scaleFactor/
      Math.max(.01,projectGroundFactor(profileOrFamily,referenceGround??p.reference).scaleFactor)
    :x01;
  const depth=Number((200+g.ground*12+finite(layerBias,0)+
    (kind==='character'?.04:0)).toFixed(4));
  return {
    kind,x:fx+fw*clamp(xProjected,0,1),groundY:fy+fh*g.ground,
    groundRatio:g.ground,scaleFactor:g.scaleFactor,
    displayWidth:kind==='car'?reference*g.scaleFactor:null,
    displayHeight:kind==='character'?reference*g.scaleFactor:null,
    depth,
    clamped:g.clamped,backLineY:fy+fh*g.backLimit,
    horizonY:g.horizon==null?null:fy+fh*g.horizon,
  };
}

// Convert a source image's original foot/contact row into the object's
// absolute top/left without modifying the asset's alpha bounding rectangle.
// In Phaser use setOrigin(.5,1) for character and the canonical modular car
// renderer for wheels / body (do NOT change its internal origins here).
export function groundAlignedCharacter(sprite,projection) {
  if(sprite && projection){
    sprite.setOrigin?.(.5,1);
    sprite.setPosition?.(projection.x,projection.groundY);
    sprite.setDisplaySize?.(
      projection.displayHeight*
        Math.max(.01,(sprite.width||1)/Math.max(1,sprite.height||1)),
      projection.displayHeight,
    );
    sprite.setDepth?.(projection.depth);
  }
  return sprite;
}
