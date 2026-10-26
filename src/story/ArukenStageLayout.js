import {SHOWDOWN_STAGE,SHOWDOWN_HERO_CHARACTER} from '../ui/ShowdownLayout.js?v=20261022-r651';
import {WORKSHOP_PRESENTATION} from '../data/workshopPresentation.js?v=20260929-r267';
// Artwork-only extras, with no character identity, story knowledge or gameplay state.
const guestPaths=['Shinjuku/ren_kurosawa_idle.png','Ginza/kaede_tachibana_idle.png',
  'Ginza/emi_saionji_idle.png','Shinjuku/sora_kanzaki_idle.png',
  'Shinjuku/daigo_arakawa_idle.png','Shinjuku/rin_amamiya_idle.png'];
export function getArukenGuests(population){
  if(!population)return [];
  const n=['gala','gallery'].includes(population)?8:6;
  return Array.from({length:n},(_,i)=>({
    asset:{key:'arukenBackgroundGuest'+i,path:'assets/Characters/'+guestPaths[i%guestPaths.length]},
    x:[.09,.17,.34,.41,.65,.72,.87,.93][i],ground:i%2?.66:.64,
    height:i%2?148:140,flipX:i%2===1}));
}
export function getArukenDisplayCars(population){
  return ['gala','invitational','private-sale'].includes(population)
    ?[{carId:'r34',x:.22},{carId:'nsx',x:.76}]:[];
}
export function getArukenCarBay(template,index,total){
  if(total<2)return null;
  const f=template?.frame||SHOWDOWN_STAGE;
  return {x:f.x+f.w*(index===0?.31:.75),
    groundY:template?.kind==='workshop'?WORKSHOP_PRESENTATION.heroCar.tyreContactY:510,
    targetWidth:Math.min(440,f.w*.38),flipX:index===1};
}
export function getArukenActorPlacement(template,actor,index,total){
  if(template&&actor.role==='chapter02ShibuyaRina')return {
    x:template.frame.x+template.frame.w*.70,
    feetY:template.character.feetY,height:template.character.height};
  if(!template||actor.role?.startsWith('chapter'))return null;
  const base=template.character,f=template.frame;
  if(actor.role==='carMechanic')return {...base,x:template.car.x};
  if(total<2)return {...base};
  const slots=total===2?[.20,.36]:[.16,.31,.86];
  return {x:f.x+f.w*(slots[index]??(.16+index*.18)),feetY:base.feetY,
    height:Math.min(base.height,SHOWDOWN_HERO_CHARACTER.height)};
}
export function arukenPoseHeight(pose){
  return pose==='storyMechanicCrouch'?.58:pose==='storyMechanicEngine'?.92:1;
}
export function getArukenEnvironmentTemplate(profile){
  if(!profile||!(profile.id.startsWith('tuner:')||profile.id.startsWith('central:ginzaMotorGallery:')))return null;
  const f=profile.frame,tuner=profile.id.startsWith('tuner:');
  return {kind:'display',frame:f,
    car:{x:WORKSHOP_PRESENTATION.heroCar.x,targetWidth:WORKSHOP_PRESENTATION.heroCar.targetWidth,
      tyreContactY:tuner?f.y+f.h*.84:WORKSHOP_PRESENTATION.heroCar.tyreContactY},
    character:{x:WORKSHOP_PRESENTATION.player.x,feetY:tuner?f.y+f.h*.91:WORKSHOP_PRESENTATION.player.feetY,
      height:SHOWDOWN_HERO_CHARACTER.height},castGap:175,observerX:f.x+f.w-130};
}
const boundsCache=new WeakMap();
export function alignArukenActor(image,x,feetY,height){
  const source=image.texture.getSourceImage();let bounds=boundsCache.get(source);
  if(!bounds){
    const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
    const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let top=canvas.height,bottom=0,left=canvas.width,right=0;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
      if(data[(y*canvas.width+x)*4+3]<24)continue;
      top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);
    }
    bounds=bottom>top?{top,bottom,left,right}:{top:0,bottom:canvas.height,left:0,right:canvas.width};
    boundsCache.set(source,bounds);
  }
  const scale=height/Math.max(1,bounds.bottom-bounds.top);
  return image.setScale(scale).setOrigin(.5,1).setPosition(
    x+(source.width/2-(bounds.left+bounds.right)/2)*scale,
    feetY+(source.height-bounds.bottom)*scale);
}
