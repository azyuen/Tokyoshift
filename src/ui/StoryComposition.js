// R642 — shared cinematic staging rules for Story and Career scenes.
// Geometry uses the game's 1560x840 virtual space, then scales proportionally.
// Car/character proportions are intentional: cars are NOT auto-scaled to
// portrait height, and their depth is always explicit.
export const STORY_COMPOSITION_PRESETS = Object.freeze({
  'car-behind-cast': Object.freeze({
    carWidth: .69, carX: .635, carGround: .855, carDepth: 8,
    castFeet: .84, castHeights: [.58,.59,.55], castX: [.15,.345,.455],
    castDepth: 14,
  }),
  'car-in-front': Object.freeze({
    carWidth: .72, carX: .625, carGround: .89, carDepth: 21,
    castFeet: .84, castHeights: [.55,.57,.53], castX: [.145,.34,.465],
    castDepth: 12,
  }),
  'conversation-balanced': Object.freeze({
    carWidth: .48, carX: .73, carGround: .83, carDepth: 8,
    castFeet: .85, castHeights: [.60,.60,.56], castX: [.215,.47,.59],
    castDepth: 14,
  }),
});

export const DEFAULT_STORY_COMPOSITION = 'car-behind-cast';
const validSize = (value,fallback) => Number.isFinite(Number(value)) && Number(value)>0
  ? Number(value) : fallback;

export function resolveStoryComposition({
  width=1560,height=840,preset=DEFAULT_STORY_COMPOSITION,
  castCount=2,carWidth=null,carGround=null,carX=null,
}={}) {
  const w=validSize(width,1560),h=validSize(height,840);
  const p=STORY_COMPOSITION_PRESETS[preset];
  if(!p) throw new Error('Unknown story composition: '+preset);
  const n=Math.max(0,Math.min(3,Math.floor(Number(castCount)||0)));
  const carCenterX=w*(carX??p.carX);
  const edgePadding=w*.0154;
  const maxWidth=Math.max(1,Math.min(carCenterX-edgePadding,w-edgePadding-carCenterX)*2);
  const bodyWidth=Math.min(maxWidth,w*(carWidth??p.carWidth));
  const car={
    x:Math.round(carCenterX),
    // Ground is a point on the floor, not the centre of a car texture.
    groundY:Math.round(h*(carGround??p.carGround)),
    targetWidth:Math.round(bodyWidth),
    depth:p.carDepth,
    layer:p.carDepth>p.castDepth?'foreground':'background',
  };
  const cast=p.castX.slice(0,n).map((fx,index)=>({
    x:Math.round(w*fx),
    feetY:Math.round(h*p.castFeet),
    height:Math.round(h*p.castHeights[index]),
    depth:p.castDepth+index,
  }));
  return {name:preset,car,cast,safeArea:{
    left:Math.round(w*.03),right:Math.round(w*.97),
    top:Math.round(h*.11),bottom:Math.round(h*.86),
  }};
}

// The standard reference PNGs use bottom-right origin; hero/collector cars
// use a centred sprite. Converting an authored ground line to renderer space
// prevents oversized cars from sinking below the stage or floating above it.
export function carBodyCenterY({groundY,sourceHeight,scale,referenceStandard=false,bodyRenderOffsetY=0}={}) {
  const ground=Number(groundY)||0;
  const height=Math.max(0,Number(sourceHeight)||0)*Math.max(0,Number(scale)||0);
  const offset=(Number(bodyRenderOffsetY)||0)*(Number(scale)||0);
  return referenceStandard?ground-offset:ground-height*.5-offset;
}
