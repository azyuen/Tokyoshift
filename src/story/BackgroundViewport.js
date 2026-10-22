// R645: one source-art coordinate system for small gameplay windows AND
// full-screen cinematic stage. The same uniform transform that displays the
// background is applied to its car/character ground points and their sizes.
//
// IMPORTANT: Perspective ratios are in normalized SOURCE ART coordinates,
// not cropped screen coordinates. Otherwise cover-cropping shifts objects
// relative to painted road/garage reference lines.
import { projectGroundEntity } from './StoryPerspective.js?v=20261022-r644';

const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;

export function resolveBackgroundViewport({
  sourceWidth=1672,sourceHeight=941,
  frame={x:0,y:0,w:1560,h:840},fit='cover',
}={}) {
  const sw=Math.max(1,finite(sourceWidth,1672));
  const sh=Math.max(1,finite(sourceHeight,941));
  const f={
    x:finite(frame?.x,0),y:finite(frame?.y,0),
    w:Math.max(1,finite(frame?.w,1560)),
    h:Math.max(1,finite(frame?.h,840)),
  };
  const cover=Math.max(f.w/sw,f.h/sh);
  const contain=Math.min(f.w/sw,f.h/sh);
  const scale=fit==='contain'?contain
    :fit==='top-fit'?f.w/sw
    :fit==='zoom-cover'?cover*1.12
    :cover;
  const width=sw*scale,height=sh*scale;
  const left=f.x+(f.w-width)/2;
  const top=fit==='bottom-cover'?f.y+f.h-height
    :fit==='top-fit'?f.y
    :f.y+(f.h-height)/2;
  return Object.freeze({frame:f,fit,scale,sourceWidth:sw,sourceHeight:sh,
    width,height,left,top,centreX:left+width/2,centreY:top+height/2});
}

export function imagePointToScreen(viewport,x01,y01) {
  return {
    x:viewport.left+viewport.width*finite(x01,.5),
    y:viewport.top+viewport.height*finite(y01,.5),
  };
}

export function projectEntityOnBackground(
  profile,{sourceWidth=1672,sourceHeight=941,frame=null,fit=null,
    kind='character',x=.5,ground=null,referenceSize=null,
    followVanishing=false,layerBias=0}={}
) {
  if(!profile)throw new Error('Background profile is required');
  if(profile.layered)throw new Error('Moving road/drag backgrounds require a live scene adapter');
  const viewport=resolveBackgroundViewport({
    sourceWidth,sourceHeight,frame:frame||profile.frame,
    fit:fit||profile.fit||'cover',
  });
  const sourceProjection=projectGroundEntity(profile,{
    kind,x,ground,referenceSize,followVanishing,layerBias,
    frame:{x:0,y:0,w:viewport.sourceWidth,h:viewport.sourceHeight},
  });
  const imageX=sourceProjection.x / viewport.sourceWidth;
  const imageY=sourceProjection.groundY / viewport.sourceHeight;
  const mapped=imagePointToScreen(viewport,imageX,imageY);
  const back=imagePointToScreen(viewport,0,sourceProjection.backLineY/viewport.sourceHeight);
  const horizon=sourceProjection.horizonY==null?null:
    imagePointToScreen(viewport,0,sourceProjection.horizonY/viewport.sourceHeight);
  return {
    ...sourceProjection,x:mapped.x,groundY:mapped.y,
    displayWidth:sourceProjection.displayWidth==null?null:
      sourceProjection.displayWidth*viewport.scale,
    displayHeight:sourceProjection.displayHeight==null?null:
      sourceProjection.displayHeight*viewport.scale,
    backLineY:back.y,horizonY:horizon?.y??null,
    sourceX:imageX,sourceGround:imageY,
    viewport,
  };
}
