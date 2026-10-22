// R654 — in Story Mode Arkon does his own work. Use the exact Daichi
// presentation geometry, only swapping the character texture.
// The filename "insepct" is the actual uploaded asset spelling.
export const ARKON_STORY_MECHANIC_ASSETS = Object.freeze([
  Object.freeze({key:'arkonStoryMechanicNormal',
    path:'assets/Characters/Main/arkon_den_mechanic.png'}),
  Object.freeze({key:'arkonStoryMechanicEngine',
    path:'assets/Characters/Main/arkon_den_engine_insepct.png'}),
  Object.freeze({key:'arkonStoryMechanicChassis',
    path:'assets/Characters/Main/arkon_den_chassis_tools.png'}),
  Object.freeze({key:'arkonStoryMechanicExhaust',
    path:'assets/Characters/Main/arkon_den_exhaust_crouch.png'}),
]);

const STORY_POSE_FOR_DAICHI = Object.freeze({
  characterDaichiSakamoto: 'arkonStoryMechanicNormal',
  daichiEngineInspect: 'arkonStoryMechanicEngine',
  daichiChassisTools: 'arkonStoryMechanicChassis',
  daichiExhaustCrouch: 'arkonStoryMechanicExhaust',
});

export function isArkonStoryWorkshop(source,crewMode=false) {
  const gameMode=typeof source?.get==='function'
    ? source.get('gameMode') : source?.gameMode;
  return gameMode==='arkonStory' && !crewMode;
}

export function resolveWorkshopMechanicTexture(source,daichiTextureKey,crewMode=false) {
  return isArkonStoryWorkshop(source,crewMode)
    ? (STORY_POSE_FOR_DAICHI[daichiTextureKey] || daichiTextureKey)
    : daichiTextureKey;
}
