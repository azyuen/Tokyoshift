// R651 — foreground staging comes from gameplay, NOT new Story coordinates.
// Workshop's hero/driver geometry and Showdown's stage positions are canonical.
// Other cinematic backgrounds still use the ground-plane perspective engine.
import { WORKSHOP_PRESENTATION } from '../data/workshopPresentation.js?v=20260929-r267';
import { SHOWDOWN_STAGE, SHOWDOWN_HERO_CAR, SHOWDOWN_HERO_CHARACTER } from '../ui/ShowdownLayout.js?v=20261022-r651';

// Backward-compatible grouped view of one geometry owner; no copied pixels.
export const SHOWDOWN_HERO = Object.freeze({
  carX:SHOWDOWN_HERO_CAR.x,carY:SHOWDOWN_HERO_CAR.y,
  targetWidth:SHOWDOWN_HERO_CAR.targetWidth,
  driverX:SHOWDOWN_HERO_CHARACTER.x,
  driverFeetY:SHOWDOWN_HERO_CHARACTER.feetY,
  driverHeight:SHOWDOWN_HERO_CHARACTER.height,
});

const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const finite=(n,f)=>Number.isFinite(Number(n))?Number(n):f;

/**
 * A stage template is applicable ONLY inside the live owner scene. It thereby
 * uses the very renderer/foreground anchors which already work in Career.
 * In unrelated scenes, StoryStage falls back to authored perspective profiles.
 */
export function getNativeStoryStageTemplate(profile,scene) {
  const key=scene?.sys?.settings?.key || scene?.scene?.key || '';
  if(profile?.id?.startsWith('workshop:') && key==='GarageScene') {
    const player=WORKSHOP_PRESENTATION.player;
    const hero=WORKSHOP_PRESENTATION.heroCar;
    return Object.freeze({
      kind:'workshop',
      frame:profile.frame,
      car:{x:hero.x,tyreContactY:hero.tyreContactY,targetWidth:hero.targetWidth},
      character:{x:player.x,feetY:player.feetY,height:player.targetHeight},
      // Horizontal movement is authorable, but the floor and size are shared.
      castGap:175,
      observerX:profile.frame.x+profile.frame.w-130,
    });
  }
  if(profile?.id?.startsWith('meet:') && key==='MeetScene') {
    return Object.freeze({
      kind:'meet',
      frame:SHOWDOWN_STAGE,
      car:{x:SHOWDOWN_HERO.carX,y:SHOWDOWN_HERO.carY,
        targetWidth:SHOWDOWN_HERO.targetWidth},
      character:{x:SHOWDOWN_HERO.driverX,feetY:SHOWDOWN_HERO.driverFeetY,
        height:SHOWDOWN_HERO.driverHeight},
      castGap:175,
      observerX:SHOWDOWN_STAGE.x+SHOWDOWN_STAGE.w-120,
    });
  }
  return null;
}

// Artist-facing roles are semantic, not independent pixel sizes.
// 'observer' places a same-height cast member on the opposite edge of frame;
// 'near' (default) keeps the group together at one ground line.
export function getNativeCastPlacement(template,index=0,total=1,role='near') {
  if(!template)return null;
  const base=template.character;
  // Authored Chapter 1 roadside repair and Chapter 2 dockside examination:
  // foreground people share the native meet stage, while the witness stands
  // further upstage at 80% size. All other Story/Career casts are unchanged.
  const special={
    chapter01RepairAoi:{x:base.x-34,feetY:base.feetY,height:base.height},
    chapter01RepairHaru:{x:base.x+148,feetY:base.feetY,height:base.height},
    chapter01RepairAruken:{x:base.x+312,feetY:base.feetY,height:base.height},
    chapter01RepairSayaka:{x:template.frame.x+template.frame.w-110,
      feetY:base.feetY-78,height:base.height*.80},
    chapter02DockForeman:{x:base.x-12,feetY:base.feetY,height:base.height},
    chapter02DockAruken:{x:template.frame.x+template.frame.w-244,
      feetY:base.feetY,height:base.height},
    chapter02DockCrouch:{x:template.frame.x+template.frame.w-244,
      feetY:base.feetY,height:base.height},
    chapter02ShibuyaRina:{x:template.frame.x+template.frame.w-164,
      feetY:base.feetY,height:base.height*1.25},
  }[role];
  if(template.kind==='meet' && special) return Object.freeze(special);
  const validIndex=Math.max(0,Math.floor(finite(index,0)));
  const x=role==='observer' ? template.observerX
    :role==='carMechanic' ? template.car.x
    :base.x+validIndex*template.castGap;
  return Object.freeze({
    x:clamp(x,template.frame.x+55,template.frame.x+template.frame.w-55),
    feetY:base.feetY,
    height:base.height,
    depth:0,
  });
}
